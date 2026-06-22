import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MessageType } from '@prisma/client';
import prisma from '../src/config/database.js';
import {
  isUuid,
  inferConversationType,
  buildSupportChatId,
  buildCompanySupportChatId,
  isPlatformSupportChatId,
  isCompanySupportChatId,
  isSupportChatId,
  parseSupportChatAdminUserId,
  parseCompanySupportUserId,
  parseDirectChatParticipantIds,
  mapChatTypeToConversationType,
  mapMessageTypeToEnum,
  mapMessageTypeFromEnum,
  COMPANY_SUPPORT_STAFF_ROLES,
  ensureConversation,
  isConversationParticipant,
  assertConversationParticipant,
  getConversationParticipantIds,
  touchConversationLastMessage,
  updateParticipantLastRead,
  resolveSubmitterCompanyId,
  getCompanySupportStaffUserIds,
  getCompanySupportStaffMembership,
  backfillConversationsFromMessages,
} from '../src/services/conversationService.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const GUARD_ID = '11111111-1111-4111-8111-111111111111';
const CLIENT_ID = '33333333-3333-4333-8333-333333333333';

async function cleanupConversation(conversationId: string): Promise<void> {
  await prisma.message.deleteMany({ where: { conversationId } }).catch(() => {});
  await prisma.conversationParticipant.deleteMany({ where: { conversationId } }).catch(() => {});
  await prisma.conversation.deleteMany({ where: { id: conversationId } }).catch(() => {});
}

describe('conversationService pure helpers', () => {
  it('validates UUID format', () => {
    assert.equal(isUuid(ADMIN_ID), true);
    assert.equal(isUuid('not-a-uuid'), false);
  });

  it('infers conversation type from id prefix', () => {
    assert.equal(inferConversationType('team_ops'), 'TEAM');
    assert.equal(inferConversationType('group_abc'), 'GROUP');
    assert.equal(inferConversationType(`admin_${ADMIN_ID}_guard_${GUARD_ID}`), 'DIRECT');
  });

  it('builds and detects support chat ids', () => {
    const platformId = buildSupportChatId(ADMIN_ID);
    const companyId = buildCompanySupportChatId(GUARD_ID);

    assert.equal(platformId, `support_admin_${ADMIN_ID}`);
    assert.equal(companyId, `support_user_${GUARD_ID}`);
    assert.equal(isPlatformSupportChatId(platformId), true);
    assert.equal(isCompanySupportChatId(companyId), true);
    assert.equal(isSupportChatId(platformId), true);
    assert.equal(isSupportChatId(companyId), true);
    assert.equal(parseSupportChatAdminUserId(platformId), ADMIN_ID);
    assert.equal(parseCompanySupportUserId(companyId), GUARD_ID);
    assert.equal(parseSupportChatAdminUserId('support_admin_bad'), null);
  });

  it('parses direct chat participant ids', () => {
    const clientGuard = `client_${CLIENT_ID}_guard_${GUARD_ID}`;
    const adminGuard = `admin_${ADMIN_ID}_guard_${GUARD_ID}`;
    const direct = `direct_${ADMIN_ID}_${GUARD_ID}`;

    assert.deepEqual(parseDirectChatParticipantIds(clientGuard), [CLIENT_ID, GUARD_ID]);
    assert.deepEqual(parseDirectChatParticipantIds(adminGuard), [ADMIN_ID, GUARD_ID]);
    assert.deepEqual(parseDirectChatParticipantIds(direct), [ADMIN_ID, GUARD_ID]);
    assert.equal(parseDirectChatParticipantIds('invalid_chat'), null);
  });

  it('maps chat and message types', () => {
    assert.equal(mapChatTypeToConversationType('team'), 'TEAM');
    assert.equal(mapChatTypeToConversationType('group'), 'GROUP');
    assert.equal(mapChatTypeToConversationType('direct'), 'DIRECT');

    assert.equal(mapMessageTypeToEnum('image'), 'IMAGE');
    assert.equal(mapMessageTypeToEnum('text'), 'TEXT');
    assert.equal(mapMessageTypeFromEnum('FILE' as MessageType), 'file');
    assert.equal(mapMessageTypeFromEnum('TEXT' as MessageType), 'text');
  });

  it('exports company support staff roles', () => {
    assert.ok(COMPANY_SUPPORT_STAFF_ROLES.includes('ADMIN'));
    assert.ok(COMPANY_SUPPORT_STAFF_ROLES.includes('OWNER'));
  });
});

describe('conversationService database helpers', () => {
  const runId = `conv-svc-${Date.now()}`;
  let tenant: TenantFixture;
  const conversationIds: string[] = [];

  before(async () => {
    tenant = await createTenantFixture('conv', runId);
  });

  after(async () => {
    for (const id of conversationIds) {
      await cleanupConversation(id);
    }
    await destroyFixturesByRunId(runId);
  });

  it('ensureConversation creates participants and supports upsert', async () => {
    const id = `group_conv_${runId}`;
    conversationIds.push(id);

    await ensureConversation({
      id,
      type: 'GROUP',
      name: 'Ops',
      createdBy: tenant.admin.userId,
      participantIds: [tenant.admin.userId, tenant.guard.userId],
      securityCompanyId: tenant.companyId,
    });

    assert.equal(await isConversationParticipant(id, tenant.guard.userId), true);
    const participantIds = await getConversationParticipantIds(id);
    assert.ok(participantIds.includes(tenant.admin.userId));
    assert.ok(participantIds.includes(tenant.guard.userId));

    await ensureConversation({
      id,
      type: 'GROUP',
      name: 'Ops Updated',
      createdBy: tenant.admin.userId,
      participantIds: [tenant.admin.userId, tenant.guard.userId, tenant.client.userId],
      securityCompanyId: tenant.companyId,
    });

    const updatedIds = await getConversationParticipantIds(id);
    assert.ok(updatedIds.includes(tenant.client.userId));
  });

  it('assertConversationParticipant rejects non-members', async () => {
    const id = `direct_conv_${runId}`;
    conversationIds.push(id);

    await ensureConversation({
      id,
      type: 'DIRECT',
      createdBy: tenant.admin.userId,
      participantIds: [tenant.admin.userId],
      securityCompanyId: tenant.companyId,
    });

    await assert.rejects(
      () => assertConversationParticipant(id, tenant.guard.userId),
      /do not have access/,
    );
  });

  it('touchConversationLastMessage and updateParticipantLastRead persist timestamps', async () => {
    const id = `read_conv_${runId}`;
    conversationIds.push(id);
    const readAt = new Date('2026-06-01T12:00:00Z');
    const lastAt = new Date('2026-06-01T13:00:00Z');

    await ensureConversation({
      id,
      type: 'DIRECT',
      createdBy: tenant.admin.userId,
      participantIds: [tenant.admin.userId, tenant.guard.userId],
      securityCompanyId: tenant.companyId,
    });

    await touchConversationLastMessage(id, lastAt);
    await updateParticipantLastRead(id, tenant.guard.userId, readAt);

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId: tenant.guard.userId },
      },
    });

    assert.equal(conversation?.lastMessageAt?.toISOString(), lastAt.toISOString());
    assert.equal(participant?.lastReadAt?.toISOString(), readAt.toISOString());
  });

  it('resolveSubmitterCompanyId resolves guard and client company', async () => {
    const guardCompany = await resolveSubmitterCompanyId(tenant.guard.userId);
    const clientCompany = await resolveSubmitterCompanyId(tenant.client.userId);
    assert.equal(guardCompany, tenant.companyId);
    assert.equal(clientCompany, tenant.companyId);
  });

  it('getCompanySupportStaffUserIds and membership include admin', async () => {
    const staffIds = await getCompanySupportStaffUserIds(tenant.companyId);
    assert.ok(staffIds.includes(tenant.admin.userId));

    const membership = await getCompanySupportStaffMembership(tenant.admin.userId);
    assert.equal(membership.isStaff, true);
    assert.equal(membership.securityCompanyId, tenant.companyId);

    const guardMembership = await getCompanySupportStaffMembership(tenant.guard.userId);
    assert.equal(guardMembership.isStaff, false);
  });

  it('backfillConversationsFromMessages skips existing conversations', async () => {
    const id = `admin_${tenant.admin.userId}_guard_${tenant.guard.userId}`;
    conversationIds.push(id);

    await ensureConversation({
      id,
      type: 'DIRECT',
      createdBy: tenant.admin.userId,
      participantIds: [tenant.admin.userId, tenant.guard.userId],
      securityCompanyId: tenant.companyId,
    });

    await prisma.message.create({
      data: {
        senderId: tenant.guard.userId,
        conversationId: id,
        content: 'Existing conversation message',
        messageType: 'TEXT',
      },
    });

    const created = await backfillConversationsFromMessages();
    assert.equal(typeof created, 'number');
    assert.equal(created, 0);
  });

  it('ensureConversation rejects empty participant list', async () => {
    await assert.rejects(
      () =>
        ensureConversation({
          id: `empty_${runId}`,
          type: 'DIRECT',
          createdBy: tenant.admin.userId,
          participantIds: ['00000000-0000-4000-8000-000000000000'],
        }),
      /no valid participant/,
    );
  });
});
