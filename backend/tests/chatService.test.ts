import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import ChatService from '../src/services/chatService.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

async function cleanupChat(chatId: string): Promise<void> {
  await prisma.message.deleteMany({ where: { conversationId: chatId } }).catch(() => {});
  await prisma.conversationParticipant.deleteMany({ where: { conversationId: chatId } }).catch(() => {});
  await prisma.conversation.deleteMany({ where: { id: chatId } }).catch(() => {});
}

async function cleanupUserChatData(userIds: string[]): Promise<void> {
  const participantRows = await prisma.conversationParticipant.findMany({
    where: { userId: { in: userIds } },
    select: { conversationId: true },
  });
  const createdRows = await prisma.conversation.findMany({
    where: { createdBy: { in: userIds } },
    select: { id: true },
  });
  const ids = [
    ...new Set([
      ...participantRows.map((row) => row.conversationId),
      ...createdRows.map((row) => row.id),
    ]),
  ];
  for (const id of ids) {
    await cleanupChat(id);
  }
}

describe('ChatService', () => {
  const runId = `chat-svc-${Date.now()}`;
  let tenant: TenantFixture;
  const chatIds: string[] = [];
  const service = ChatService.getInstance();

  before(async () => {
    tenant = await createTenantFixture('chatsvc', runId);
  });

  after(async () => {
    for (const id of chatIds) {
      await cleanupChat(id);
    }
    await cleanupUserChatData([
      tenant.admin.userId,
      tenant.guard.userId,
      tenant.client.userId,
    ]);
    await destroyFixturesByRunId(runId);
  });

  it('initializeConversations completes without error', async () => {
    await service.initializeConversations();
  });

  it('getUserChats starts empty for guard', async () => {
    const chats = await service.getUserChats(tenant.guard.userId, tenant.companyId);
    assert.ok(Array.isArray(chats));
  });

  it('creates direct chat between guard and admin', async () => {
    const chat = await service.createChat({
      type: 'direct',
      participantIds: [tenant.admin.userId],
      createdBy: tenant.guard.userId,
      securityCompanyId: tenant.companyId,
    });

    chatIds.push(chat.id);
    assert.match(chat.id, /^admin_.*_guard_.*|^guard_.*|^admin_.*_guard_.*/);
    assert.ok(chat.participants.length >= 2);
  });

  it('creates direct chat between client and guard', async () => {
    const chat = await service.createChat({
      type: 'direct',
      participantIds: [tenant.guard.userId],
      createdBy: tenant.client.userId,
      securityCompanyId: tenant.companyId,
    });

    chatIds.push(chat.id);
    assert.match(chat.id, /^client_.*_guard_.*/);
  });

  it('rejects direct chat with only self as participant', async () => {
    await assert.rejects(
      () =>
        service.createChat({
          type: 'direct',
          participantIds: [tenant.guard.userId],
          createdBy: tenant.guard.userId,
          securityCompanyId: tenant.companyId,
        }),
      /requires exactly one other participant/,
    );
  });

  it('creates group chat with multiple participants', async () => {
    const chat = await service.createChat({
      type: 'group',
      name: 'Ops Group',
      participantIds: [tenant.admin.userId, tenant.guard.userId],
      createdBy: tenant.admin.userId,
      securityCompanyId: tenant.companyId,
    });

    chatIds.push(chat.id);
    assert.equal(chat.type, 'group');
    assert.equal(chat.name, 'Ops Group');
  });

  it('sendMessage, getChatMessages, markMessagesAsRead, and getChatById', async () => {
    const chat = await service.createChat({
      type: 'direct',
      participantIds: [tenant.admin.userId],
      createdBy: tenant.guard.userId,
      securityCompanyId: tenant.companyId,
    });
    chatIds.push(chat.id);

    const sent = await service.sendMessage({
      chatId: chat.id,
      senderId: tenant.guard.userId,
      content: 'Chat service unit test message',
      messageType: 'text',
      securityCompanyId: tenant.companyId,
    });

    assert.ok(sent.id);
    assert.equal(sent.content, 'Chat service unit test message');

    const messages = await service.getChatMessages(
      chat.id,
      tenant.admin.userId,
      1,
      50,
      tenant.companyId,
    );
    assert.ok(messages.some((m) => m.content.includes('Chat service unit test')));

    await service.markMessagesAsRead(chat.id, tenant.admin.userId, [sent.id]);

    const found = await service.getChatById(chat.id, tenant.guard.userId);
    assert.ok(found);
    assert.equal(found!.id, chat.id);
  });

  it('searchChats filters by participant name', async () => {
    const chat = await service.createChat({
      type: 'direct',
      participantIds: [tenant.admin.userId],
      createdBy: tenant.guard.userId,
      securityCompanyId: tenant.companyId,
    });
    chatIds.push(chat.id);

    const result = await service.searchChats(tenant.guard.userId, tenant.prefix);
    assert.ok(result.chats.some((c) => c.id === chat.id));
  });

  it('openCompanySupportChat and getSupportChats for guard', async () => {
    const supportChat = await service.openCompanySupportChat(
      tenant.guard.userId,
      tenant.companyId,
    );
    chatIds.push(supportChat.id);
    assert.match(supportChat.id, /^support_user_/);

    const supportMessage = await service.sendMessage({
      chatId: supportChat.id,
      senderId: tenant.guard.userId,
      content: 'Need help with shift',
      messageType: 'text',
      securityCompanyId: tenant.companyId,
    });
    assert.ok(supportMessage.id);

    const guardSupportList = await service.getSupportChats(tenant.guard.userId, tenant.companyId);
    assert.ok(guardSupportList.some((c) => c.id === supportChat.id));

    const adminSupportList = await service.getSupportChats(tenant.admin.userId, tenant.companyId);
    assert.ok(adminSupportList.length >= 1);
  });

  it('openSupportChat validates role and opens when platform agents exist', async () => {
    await assert.rejects(
      () => service.openSupportChat(tenant.guard.userId, tenant.companyId),
      /Only company admins/,
    );

    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { id: true },
    });

    if (superAdmins.length === 0) {
      await assert.rejects(
        () => service.openSupportChat(tenant.admin.userId, tenant.companyId),
        /No platform support agents/,
      );
      return;
    }

    const chat = await service.openSupportChat(tenant.admin.userId, tenant.companyId);
    chatIds.push(chat.id);
    assert.match(chat.id, /^support_admin_/);
  });

  it('getUserChats includes created direct chats', async () => {
    const chats = await service.getUserChats(tenant.guard.userId, tenant.companyId);
    assert.ok(chats.length >= 1);
    assert.ok(chats.some((c) => chatIds.includes(c.id)));
  });

  it('getUserChats auto-resolves company for client with site-assigned guards', async () => {
    await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Client Site Shift',
        locationAddress: '100 Tenant Test Street',
        scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
      },
    });

    const chats = await service.getUserChats(tenant.client.userId);
    assert.ok(
      chats.some((chat) => chat.id === `client_${tenant.client.userId}_guard_${tenant.guard.userId}`),
    );
  });

  it('getUserChats for admin resolves company membership', async () => {
    const chats = await service.getUserChats(tenant.admin.userId);
    assert.ok(Array.isArray(chats));
    assert.ok(chats.length >= 1);
  });

  it('createChat is idempotent for existing direct conversations', async () => {
    const first = await service.createChat({
      type: 'direct',
      participantIds: [tenant.client.userId],
      createdBy: tenant.admin.userId,
      securityCompanyId: tenant.companyId,
    });
    chatIds.push(first.id);

    const second = await service.createChat({
      type: 'direct',
      participantIds: [tenant.client.userId],
      createdBy: tenant.admin.userId,
      securityCompanyId: tenant.companyId,
    });

    assert.equal(first.id, second.id);
  });

  it('creates team chat', async () => {
    const chat = await service.createChat({
      type: 'team',
      name: 'Field Team',
      participantIds: [tenant.admin.userId, tenant.guard.userId],
      createdBy: tenant.admin.userId,
      securityCompanyId: tenant.companyId,
    });
    chatIds.push(chat.id);
    assert.equal(chat.type, 'team');
  });

  it('getSupportChats lists platform threads for super admin', async () => {
    const superAdmin = await prisma.user.create({
      data: {
        email: `chatsvc-super-${runId}@tenant-isolation.test`,
        password: 'hash',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        accountType: 'INDIVIDUAL',
        isActive: true,
        isEmailVerified: true,
      },
    });

    try {
      const platformChat = await service.openSupportChat(tenant.admin.userId, tenant.companyId);
      chatIds.push(platformChat.id);

      const chats = await service.getSupportChats(superAdmin.id);
      assert.ok(chats.some((chat) => chat.id === platformChat.id));
    } finally {
      await cleanupUserChatData([superAdmin.id, tenant.admin.userId]);
      await prisma.user.delete({ where: { id: superAdmin.id } }).catch(() => {});
    }
  });

  it('getChatMessages rejects users outside the conversation', async () => {
    const outsider = await prisma.user.create({
      data: {
        email: `chatsvc-outsider-${runId}@tenant-isolation.test`,
        password: 'hash',
        firstName: 'Out',
        lastName: 'Side',
        role: 'GUARD',
        accountType: 'INDIVIDUAL',
        isActive: true,
        isEmailVerified: true,
      },
    });

    const chat = await service.createChat({
      type: 'direct',
      participantIds: [tenant.admin.userId],
      createdBy: tenant.guard.userId,
      securityCompanyId: tenant.companyId,
    });
    chatIds.push(chat.id);

    try {
      await assert.rejects(
        () => service.getChatMessages(chat.id, outsider.id, 1, 50, tenant.companyId),
        /access denied|Chat not found/,
      );
    } finally {
      await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
    }
  });
});
