import prisma from '../config/database.js';
import { ConversationType, MessageType, ParticipantRole, CompanyRole } from '@prisma/client';
import { logger } from '../utils/logger.js';

/** Company roles allowed to view/respond to guard & client support chats */
export const COMPANY_SUPPORT_STAFF_ROLES: CompanyRole[] = ['OWNER', 'ADMIN', 'MANAGER'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function inferConversationType(conversationId: string): ConversationType {
  if (conversationId.startsWith('team_')) return 'TEAM';
  if (conversationId.startsWith('group_')) return 'GROUP';
  return 'DIRECT';
}

/** Platform support thread: one per admin user */
export function buildSupportChatId(adminUserId: string): string {
  return `support_admin_${adminUserId}`;
}

/** Company support thread: one per guard/client user */
export function buildCompanySupportChatId(userId: string): string {
  return `support_user_${userId}`;
}

export function isPlatformSupportChatId(conversationId: string): boolean {
  return conversationId.startsWith('support_admin_');
}

export function isCompanySupportChatId(conversationId: string): boolean {
  return conversationId.startsWith('support_user_');
}

export function isSupportChatId(conversationId: string): boolean {
  return isPlatformSupportChatId(conversationId) || isCompanySupportChatId(conversationId);
}

export function parseSupportChatAdminUserId(conversationId: string): string | null {
  if (!isPlatformSupportChatId(conversationId)) return null;
  const adminUserId = conversationId.slice('support_admin_'.length);
  return isUuid(adminUserId) ? adminUserId : null;
}

export function parseCompanySupportUserId(conversationId: string): string | null {
  if (!isCompanySupportChatId(conversationId)) return null;
  const userId = conversationId.slice('support_user_'.length);
  return isUuid(userId) ? userId : null;
}

export async function resolveSubmitterCompanyId(submitterUserId: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: submitterUserId },
    select: {
      guard: {
        select: {
          companyGuards: { where: { isActive: true }, take: 1, select: { securityCompanyId: true } },
        },
      },
      client: {
        select: {
          companyClients: { where: { isActive: true }, take: 1, select: { securityCompanyId: true } },
        },
      },
    },
  });

  return (
    user?.guard?.companyGuards[0]?.securityCompanyId ??
    user?.client?.companyClients[0]?.securityCompanyId
  );
}

export async function getCompanySupportStaffUserIds(securityCompanyId: string): Promise<string[]> {
  const rows = await prisma.companyUser.findMany({
    where: {
      securityCompanyId,
      isActive: true,
      role: { in: COMPANY_SUPPORT_STAFF_ROLES },
    },
    select: { userId: true },
  });
  return rows.map(r => r.userId);
}

export async function getCompanySupportStaffMembership(userId: string): Promise<{
  isStaff: boolean;
  securityCompanyId?: string;
}> {
  const membership = await prisma.companyUser.findFirst({
    where: {
      userId,
      isActive: true,
      role: { in: COMPANY_SUPPORT_STAFF_ROLES },
    },
    select: { securityCompanyId: true },
  });

  return {
    isStaff: Boolean(membership),
    securityCompanyId: membership?.securityCompanyId,
  };
}

/**
 * Parse participant user IDs from stable direct-chat conversation IDs.
 * Formats: client_<userId>_guard_<userId>, admin_<userId>_guard_<userId>, client_<userId>_admin_<userId>
 */
export function parseDirectChatParticipantIds(conversationId: string): string[] | null {
  const parts = conversationId.split('_');
  if (parts.length >= 4) {
    const part2 = parts[2];
    if (part2 === 'guard' || part2 === 'admin') {
      const ids = [parts[1], parts[3]].filter(Boolean);
      return ids.length === 2 && ids.every(isUuid) ? ids : null;
    }
  }
  if (conversationId.startsWith('direct_') && parts.length >= 3) {
    const ids = [parts[1], parts[2]].filter(Boolean);
    return ids.length === 2 && ids.every(isUuid) ? ids : null;
  }
  return null;
}

export function mapChatTypeToConversationType(type: 'direct' | 'group' | 'team'): ConversationType {
  switch (type) {
    case 'team':
      return 'TEAM';
    case 'group':
      return 'GROUP';
    default:
      return 'DIRECT';
  }
}

export function mapMessageTypeToEnum(
  messageType: 'text' | 'image' | 'file' | 'location' | 'system'
): MessageType {
  switch (messageType) {
    case 'image':
      return 'IMAGE';
    case 'file':
      return 'FILE';
    case 'location':
      return 'LOCATION';
    case 'system':
      return 'SYSTEM';
    default:
      return 'TEXT';
  }
}

export function mapMessageTypeFromEnum(messageType: MessageType): 'text' | 'image' | 'file' | 'location' | 'system' {
  switch (messageType) {
    case 'IMAGE':
      return 'image';
    case 'FILE':
      return 'file';
    case 'LOCATION':
      return 'location';
    case 'SYSTEM':
      return 'system';
    default:
      return 'text';
  }
}

export async function backfillConversationsFromMessages(): Promise<number> {
  const rows = await prisma.message.findMany({
    select: { conversationId: true },
    distinct: ['conversationId'],
  });

  let created = 0;

  for (const { conversationId } of rows) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (existing) continue;

    const [participants, lastMessage] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        select: { senderId: true },
        distinct: ['senderId'],
      }),
      prisma.message.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, senderId: true },
      }),
    ]);

    const participantIds = participants.map(p => p.senderId).filter(Boolean);
    if (participantIds.length === 0 || !lastMessage) continue;

    const createdBy = lastMessage.senderId;

    let securityCompanyId: string | undefined;
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId: { in: participantIds }, isActive: true },
      select: { securityCompanyId: true },
    });
    if (companyUser) {
      securityCompanyId = companyUser.securityCompanyId;
    } else {
      const guards = await prisma.guard.findMany({
        where: { userId: { in: participantIds } },
        select: { id: true },
      });
      const companyGuard = guards.length
        ? await prisma.companyGuard.findFirst({
            where: { guardId: { in: guards.map(g => g.id) }, isActive: true },
            select: { securityCompanyId: true },
          })
        : null;
      securityCompanyId = companyGuard?.securityCompanyId;
    }

    await prisma.conversation.create({
      data: {
        id: conversationId,
        type: inferConversationType(conversationId),
        createdBy,
        securityCompanyId,
        lastMessageAt: lastMessage.createdAt,
        participants: {
          create: participantIds.map(userId => ({
            userId,
            role: userId === createdBy ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
          })),
        },
      },
    });

    created++;
  }

  if (created > 0) {
    logger.info(`Backfilled ${created} conversation(s) from existing messages`);
  }

  return created;
}

export async function ensureConversation(data: {
  id: string;
  type: ConversationType;
  name?: string;
  createdBy: string;
  participantIds: string[];
  securityCompanyId?: string;
}): Promise<void> {
  const uniqueParticipantIds = [...new Set(data.participantIds.filter(Boolean))];
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: uniqueParticipantIds } },
    select: { id: true },
  });
  const validParticipantIds = existingUsers.map(user => user.id);

  if (validParticipantIds.length === 0) {
    throw new Error('Cannot create conversation: no valid participant user IDs');
  }

  await prisma.conversation.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      type: data.type,
      name: data.name,
      securityCompanyId: data.securityCompanyId,
      createdBy: data.createdBy,
      participants: {
        create: validParticipantIds.map(userId => ({
          userId,
          role: userId === data.createdBy ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
        })),
      },
    },
    update: {
      name: data.name,
      securityCompanyId: data.securityCompanyId ?? undefined,
    },
  });

  for (const userId of validParticipantIds) {
    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: data.id,
          userId,
        },
      },
      create: {
        conversationId: data.id,
        userId,
        role: userId === data.createdBy ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
      },
      update: {},
    });
  }
}

export async function isConversationParticipant(conversationId: string, userId: string): Promise<boolean> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    select: { id: true },
  });

  return Boolean(participant);
}

export async function assertConversationParticipant(conversationId: string, userId: string): Promise<void> {
  const isParticipant = await isConversationParticipant(conversationId, userId);
  if (!isParticipant) {
    throw new Error('You do not have access to this conversation');
  }
}

export async function getConversationParticipantIds(conversationId: string): Promise<string[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  return participants.map(p => p.userId);
}

export async function touchConversationLastMessage(conversationId: string, lastMessageAt: Date): Promise<void> {
  await prisma.conversation.updateMany({
    where: { id: conversationId },
    data: { lastMessageAt },
  });
}

export async function updateParticipantLastRead(
  conversationId: string,
  userId: string,
  lastReadAt: Date = new Date()
): Promise<void> {
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt },
  });
}

export default {
  backfillConversationsFromMessages,
  ensureConversation,
  isConversationParticipant,
  assertConversationParticipant,
  getConversationParticipantIds,
  touchConversationLastMessage,
  updateParticipantLastRead,
  inferConversationType,
  parseDirectChatParticipantIds,
  buildSupportChatId,
  buildCompanySupportChatId,
  isSupportChatId,
  isPlatformSupportChatId,
  isCompanySupportChatId,
  parseSupportChatAdminUserId,
  parseCompanySupportUserId,
  resolveSubmitterCompanyId,
  getCompanySupportStaffUserIds,
  getCompanySupportStaffMembership,
  COMPANY_SUPPORT_STAFF_ROLES,
  mapChatTypeToConversationType,
  mapMessageTypeToEnum,
  mapMessageTypeFromEnum,
};
