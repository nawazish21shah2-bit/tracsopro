import prisma from '../config/database.js';
import { SupportAudience, SupportStatus, Role } from '@prisma/client';
import {
  buildCompanySupportChatId,
  buildSupportChatId,
  ensureConversation,
  inferConversationType,
  getCompanySupportStaffUserIds,
} from './conversationService.js';
import { logger } from '../utils/logger.js';

export interface CreateTicketInput {
  subject: string;
  message: string;
  category: string;
  audience?: SupportAudience;
}

const CATEGORY_MAP: Record<string, 'TECHNICAL' | 'BILLING' | 'GENERAL' | 'URGENT'> = {
  technical: 'TECHNICAL',
  billing: 'BILLING',
  general: 'GENERAL',
  urgent: 'URGENT',
};

export async function resolveUserCompanyContext(userId: string): Promise<{
  securityCompanyId?: string;
  role: Role;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      companyUsers: { where: { isActive: true }, take: 1, select: { securityCompanyId: true } },
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

  if (!user) {
    throw new Error('User not found');
  }

  let securityCompanyId: string | undefined;
  if (user.role === 'ADMIN' && user.companyUsers[0]) {
    securityCompanyId = user.companyUsers[0].securityCompanyId;
  } else if (user.role === 'GUARD' && user.guard?.companyGuards[0]) {
    securityCompanyId = user.guard.companyGuards[0].securityCompanyId;
  } else if (user.role === 'CLIENT' && user.client?.companyClients[0]) {
    securityCompanyId = user.client.companyClients[0].securityCompanyId;
  }

  return { securityCompanyId, role: user.role };
}

async function getCompanyAdminUserIds(securityCompanyId: string): Promise<string[]> {
  return getCompanySupportStaffUserIds(securityCompanyId);
}

function mapCategory(category: string) {
  return CATEGORY_MAP[category.toLowerCase()] || 'GENERAL';
}

function mapPriority(category: string) {
  const mapped = mapCategory(category);
  if (mapped === 'URGENT') return 'URGENT' as const;
  if (mapped === 'TECHNICAL') return 'HIGH' as const;
  return 'NORMAL' as const;
}

export async function createSupportTicket(userId: string, input: CreateTicketInput) {
  const { securityCompanyId, role } = await resolveUserCompanyContext(userId);

  if (role === 'SUPER_ADMIN') {
    throw new Error('Super admins cannot submit support tickets');
  }

  let audience: SupportAudience = input.audience ?? 'COMPANY';
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    audience = input.audience ?? 'PLATFORM';
  }
  if ((role === 'GUARD' || role === 'CLIENT') && audience === 'PLATFORM') {
    audience = 'COMPANY';
  }

  if (audience === 'COMPANY' && !securityCompanyId && role !== 'SUPER_ADMIN') {
    throw new Error('Your account is not linked to a security company');
  }

  const category = mapCategory(input.category);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: input.subject.trim(),
      message: input.message.trim(),
      category,
      status: 'OPEN',
      priority: mapPriority(input.category),
      audience,
      securityCompanyId: audience === 'COMPANY' ? securityCompanyId : undefined,
      submitterRole: role,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      },
    },
  });

  try {
    const notificationService = (await import('./notificationService.js')).default;
    const submitterName = `${ticket.user.firstName} ${ticket.user.lastName}`;

    if (audience === 'PLATFORM') {
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', isActive: true },
        select: { id: true },
      });
      await notificationService.createBulkNotifications(
        superAdmins.map((u) => u.id),
        {
          type: 'SYSTEM',
          title: 'New Support Ticket',
          message: `${submitterName} submitted: "${ticket.subject}"`,
          data: { ticketId: ticket.id, conversationId: ticket.conversationId },
          sendPush: true,
          priority: ticket.priority === 'URGENT' ? 'urgent' : 'normal',
        },
        undefined,
        userId
      );
    } else if (securityCompanyId) {
      const adminIds = await getCompanyAdminUserIds(securityCompanyId);
      await notificationService.createBulkNotifications(
        adminIds,
        {
          type: 'SYSTEM',
          title: 'New Support Ticket',
          message: `${submitterName} submitted: "${ticket.subject}"`,
          data: { ticketId: ticket.id, conversationId: ticket.conversationId },
          sendPush: true,
          priority: ticket.priority === 'URGENT' ? 'urgent' : 'normal',
        },
        securityCompanyId,
        userId
      );
    }
  } catch (err) {
    logger.error('Failed to send support ticket notification:', err);
  }

  return ticket;
}

export async function getMySupportTickets(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    }),
    prisma.supportTicket.count({ where: { userId } }),
  ]);

  return {
    tickets,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function getSupportInbox(
  userId: string,
  securityCompanyId: string | undefined,
  page = 1,
  limit = 20,
  status?: SupportStatus,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new Error('User not found');

  const skip = (page - 1) * limit;
  let where: Record<string, unknown> = {};

  if (user.role === 'ADMIN') {
    if (!securityCompanyId) throw new Error('Company context required');
    where = { audience: 'COMPANY', securityCompanyId };
  } else if (user.role === 'SUPER_ADMIN') {
    where = { audience: 'PLATFORM' };
  } else {
    throw new Error('Inbox not available for this role');
  }

  if (status) {
    where.status = status;
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        replies: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function getSupportTicketById(
  ticketId: string,
  userId: string,
  securityCompanyId?: string,
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      },
    },
  });

  if (!ticket) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return null;

  const isOwner = ticket.userId === userId;
  const isCompanyAdmin =
    user.role === 'ADMIN' &&
    ticket.audience === 'COMPANY' &&
    ticket.securityCompanyId &&
    ticket.securityCompanyId === securityCompanyId;
  const isSuperAdmin = user.role === 'SUPER_ADMIN' && ticket.audience === 'PLATFORM';

  if (!isOwner && !isCompanyAdmin && !isSuperAdmin) {
    return null;
  }

  return ticket;
}

export async function addSupportTicketReply(
  ticketId: string,
  senderId: string,
  message: string,
  securityCompanyId?: string,
) {
  const ticket = await getSupportTicketById(ticketId, senderId, securityCompanyId);
  if (!ticket) throw new Error('Ticket not found or access denied');
  if (ticket.status === 'CLOSED') throw new Error('Ticket is closed');

  const trimmed = message.trim();
  if (!trimmed) throw new Error('Reply message is required');

  const user = await prisma.user.findUnique({ where: { id: senderId }, select: { role: true } });
  const isStaff =
    (user?.role === 'ADMIN' && ticket.audience === 'COMPANY') ||
    (user?.role === 'SUPER_ADMIN' && ticket.audience === 'PLATFORM');

  const [reply] = await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: { ticketId, senderId, message: trimmed },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: isStaff && ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        updatedAt: new Date(),
      },
    }),
  ]);

  try {
    const notificationService = (await import('./notificationService.js')).default;
    const senderName = `${reply.sender.firstName} ${reply.sender.lastName}`;

    if (isStaff) {
      await notificationService.createNotification(
        {
          userId: ticket.userId,
          type: 'SYSTEM',
          title: 'Support Ticket Update',
          message: `${senderName} replied to "${ticket.subject}"`,
          data: { ticketId, conversationId: ticket.conversationId },
          sendPush: true,
        },
        ticket.securityCompanyId ?? undefined,
        senderId
      );
    } else {
      let recipientIds: string[] = [];
      if (ticket.audience === 'PLATFORM') {
        const superAdmins = await prisma.user.findMany({
          where: { role: 'SUPER_ADMIN', isActive: true },
          select: { id: true },
        });
        recipientIds = superAdmins.map((u) => u.id);
      } else if (ticket.securityCompanyId) {
        recipientIds = await getCompanyAdminUserIds(ticket.securityCompanyId);
      }
      await notificationService.createBulkNotifications(
        recipientIds,
        {
          type: 'SYSTEM',
          title: 'Support Ticket Reply',
          message: `${senderName} replied to "${ticket.subject}"`,
          data: { ticketId, conversationId: ticket.conversationId },
          sendPush: true,
        },
        ticket.securityCompanyId ?? undefined,
        senderId
      );
    }
  } catch (err) {
    logger.error('Failed to send support reply notification:', err);
  }

  return reply;
}

export async function updateSupportTicketStatus(
  ticketId: string,
  userId: string,
  status: SupportStatus,
  securityCompanyId?: string,
) {
  const ticket = await getSupportTicketById(ticketId, userId, securityCompanyId);
  if (!ticket) throw new Error('Ticket not found or access denied');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const canManage =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    ticket.userId === userId;

  if (!canManage) throw new Error('Not allowed to update this ticket');

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      },
    },
  });

  try {
    const isStaffUpdate = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (isStaffUpdate) {
      const notificationService = (await import('./notificationService.js')).default;
      await notificationService.createNotification(
        {
          userId: ticket.userId,
          type: 'SYSTEM',
          title: 'Support Ticket Status Updated',
          message: `Your ticket "${ticket.subject}" is now ${status.replace('_', ' ').toLowerCase()}.`,
          data: { ticketId, status, conversationId: ticket.conversationId },
          sendPush: true,
        },
        ticket.securityCompanyId ?? undefined,
        userId
      );
    }
  } catch (err) {
    logger.error('Failed to send support status notification:', err);
  }

  return updated;
}

/** Link or create a chat thread for a ticket */
export async function linkTicketToChat(
  ticketId: string,
  actorId: string,
  securityCompanyId?: string,
): Promise<{ conversationId: string; ticket: unknown }> {
  const ticket = await getSupportTicketById(ticketId, actorId, securityCompanyId);
  if (!ticket) throw new Error('Ticket not found or access denied');

  if (ticket.conversationId) {
    return { conversationId: ticket.conversationId, ticket };
  }

  let conversationId: string;
  let participantIds: string[] = [];

  if (ticket.audience === 'PLATFORM') {
    conversationId = buildSupportChatId(ticket.userId);
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { id: true },
    });
    participantIds = [ticket.userId, ...superAdmins.map(s => s.id)];
  } else {
    conversationId = buildCompanySupportChatId(ticket.userId);
    if (!ticket.securityCompanyId) throw new Error('Ticket has no company context');
    const adminIds = await getCompanyAdminUserIds(ticket.securityCompanyId);
    participantIds = [ticket.userId, ...adminIds];
  }

  participantIds = [...new Set(participantIds.filter(Boolean))];

  await ensureConversation({
    id: conversationId,
    type: inferConversationType(conversationId),
    name: ticket.subject,
    createdBy: ticket.userId,
    participantIds,
    securityCompanyId: ticket.securityCompanyId ?? undefined,
  });

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { conversationId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      },
    },
  });

  // Seed initial message in chat if none exists
  const existing = await prisma.message.findFirst({
    where: { conversationId },
  });
  if (!existing) {
    await prisma.message.create({
      data: {
        senderId: ticket.userId,
        conversationId,
        content: `[Support Ticket] ${ticket.subject}\n\n${ticket.message}`,
        messageType: 'SYSTEM',
        isRead: false,
      },
    });
  }

  return { conversationId, ticket: updated };
}

export async function openCompanySupportChat(userId: string, securityCompanyId?: string) {
  const { role, securityCompanyId: companyId } = await resolveUserCompanyContext(userId);
  const resolvedCompanyId = securityCompanyId ?? companyId;

  if (role !== 'GUARD' && role !== 'CLIENT') {
    throw new Error('Only guards and clients can open company support chat');
  }
  if (!resolvedCompanyId) {
    throw new Error('Your account is not linked to a security company');
  }

  const adminIds = await getCompanyAdminUserIds(resolvedCompanyId);
  if (adminIds.length === 0) {
    throw new Error('No company admin is available for support');
  }

  const conversationId = buildCompanySupportChatId(userId);
  await ensureConversation({
    id: conversationId,
    type: inferConversationType(conversationId),
    name: 'Company Support',
    createdBy: userId,
    participantIds: [userId, ...adminIds],
    securityCompanyId: resolvedCompanyId,
  });

  return { conversationId, name: 'Company Support' };
}

export default {
  createSupportTicket,
  getMySupportTickets,
  getSupportInbox,
  getSupportTicketById,
  addSupportTicketReply,
  updateSupportTicketStatus,
  linkTicketToChat,
  openCompanySupportChat,
  resolveUserCompanyContext,
};
