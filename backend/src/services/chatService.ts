import prisma from '../config/database.js';
import WebSocketService from './websocketService.js';
import { logger } from '../utils/logger.js';
import {
  backfillConversationsFromMessages,
  ensureConversation,
  getConversationParticipantIds,
  inferConversationType,
  isConversationParticipant,
  mapChatTypeToConversationType,
  mapMessageTypeFromEnum,
  mapMessageTypeToEnum,
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
  touchConversationLastMessage,
  updateParticipantLastRead,
} from './conversationService.js';

function getDirectChatOtherParticipantId(
  participantIds: string[],
  createdBy: string,
): string | null {
  const others = participantIds.filter(id => id !== createdBy);
  if (others.length === 1) {
    return others[0];
  }
  if (participantIds.length === 1 && participantIds[0] !== createdBy) {
    return participantIds[0];
  }
  return null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'system';
  timestamp: Date;
  isRead: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'team';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  role: 'member' | 'admin';
  joinedAt: Date;
  lastReadAt?: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

export class ChatService {
  private static instance: ChatService;
  private websocketService: any;

  constructor() {
    this.websocketService = WebSocketService;
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async initializeConversations(): Promise<void> {
    await backfillConversationsFromMessages();
  }

  private mapParticipantRole(role: string): 'member' | 'admin' {
    return role === 'ADMIN' ? 'admin' : 'member';
  }

  private async getSuperAdminUserIds(): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { id: true },
    });
    return users.map(user => user.id);
  }

  private async getSupportChatDisplayName(adminUserId: string): Promise<string> {
    const [adminUser, companyUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: adminUserId },
        select: { firstName: true, lastName: true, email: true },
      }),
      prisma.companyUser.findFirst({
        where: { userId: adminUserId, isActive: true },
        include: { securityCompany: { select: { name: true } } },
      }),
    ]);

    const adminName =
      `${adminUser?.firstName || ''} ${adminUser?.lastName || ''}`.trim() ||
      adminUser?.email ||
      'Admin';
    const companyName = companyUser?.securityCompany?.name;
    return companyName ? `${adminName} · ${companyName}` : adminName;
  }

  private async canAccessSupportChat(conversationId: string, userId: string): Promise<boolean> {
    if (isPlatformSupportChatId(conversationId)) {
      const adminUserId = parseSupportChatAdminUserId(conversationId);
      if (!adminUserId) return false;
      if (userId === adminUserId) return true;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role === 'SUPER_ADMIN';
    }

    if (isCompanySupportChatId(conversationId)) {
      const submitterId = parseCompanySupportUserId(conversationId);
      if (!submitterId) return false;
      if (userId === submitterId) return true;

      const [staff, submitterCompanyId] = await Promise.all([
        getCompanySupportStaffMembership(userId),
        resolveSubmitterCompanyId(submitterId),
      ]);

      return Boolean(
        staff.isStaff &&
          staff.securityCompanyId &&
          submitterCompanyId &&
          submitterCompanyId === staff.securityCompanyId,
      );
    }

    return false;
  }

  private async buildVirtualSupportChat(
    conversationId: string,
    userId: string,
  ): Promise<(Chat & { metadata?: Record<string, unknown> }) | null> {
    if (!(await this.canAccessSupportChat(conversationId, userId))) {
      return null;
    }

    const adminUserId = parseSupportChatAdminUserId(conversationId);
    const companyUserId = parseCompanySupportUserId(conversationId);
    const subjectUserId = adminUserId ?? companyUserId;
    if (!subjectUserId) return null;

    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, firstName: true, lastName: true },
    });

    const [subjectUser, superAdminIds, lastMessage, unreadCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: subjectUserId },
        select: { id: true, firstName: true, lastName: true, role: true, profilePictureUrl: true },
      }),
      this.getSuperAdminUserIds(),
      prisma.message.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
      }),
    ]);

    if (!subjectUser) return null;

    let chatName = 'Support';
    if (isPlatformSupportChatId(conversationId)) {
      chatName =
        viewer?.role === 'SUPER_ADMIN'
          ? await this.getSupportChatDisplayName(subjectUserId)
          : 'Platform Support';
    } else if (isCompanySupportChatId(conversationId)) {
      const submitterName =
        `${subjectUser.firstName || ''} ${subjectUser.lastName || ''}`.trim() ||
        subjectUser.role;
      chatName =
        viewer?.role === 'ADMIN'
          ? `${submitterName} · ${subjectUser.role}`
          : 'Company Support';
    }

    const companyAdminIds = isCompanySupportChatId(conversationId) && viewer?.role === 'ADMIN'
      ? [userId]
      : [];

    const superAdminUsers = isPlatformSupportChatId(conversationId) && superAdminIds.length
      ? await prisma.user.findMany({
          where: { id: { in: superAdminIds } },
          select: { id: true, firstName: true, lastName: true, role: true, profilePictureUrl: true },
        })
      : [];

    const participants: ChatParticipant[] = [
      {
        id: `part_${subjectUser.id}_${conversationId}`,
        chatId: conversationId,
        userId: subjectUser.id,
        role: 'member',
        joinedAt: new Date(),
        user: {
          id: subjectUser.id,
          firstName: subjectUser.firstName,
          lastName: subjectUser.lastName,
          avatar: subjectUser.profilePictureUrl || undefined,
          role: subjectUser.role,
        },
      },
      ...superAdminUsers.map(sa => ({
        id: `part_${sa.id}_${conversationId}`,
        chatId: conversationId,
        userId: sa.id,
        role: 'admin' as const,
        joinedAt: new Date(),
        user: {
          id: sa.id,
          firstName: sa.firstName,
          lastName: sa.lastName,
          avatar: sa.profilePictureUrl || undefined,
          role: sa.role,
        },
      })),
    ];

    return {
      id: conversationId,
      name: chatName,
      type: 'direct',
      participants,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            chatId: conversationId,
            senderId: lastMessage.senderId,
            content: lastMessage.content,
            messageType: mapMessageTypeFromEnum(lastMessage.messageType),
            timestamp: lastMessage.createdAt,
            isRead: lastMessage.isRead,
            sender: {
              id: lastMessage.sender.id,
              firstName: lastMessage.sender.firstName,
              lastName: lastMessage.sender.lastName,
              role: lastMessage.sender.role,
            },
          }
        : undefined,
      lastMessageAt: lastMessage?.createdAt,
      unreadCount,
      createdAt: lastMessage?.createdAt || new Date(),
      updatedAt: lastMessage?.updatedAt || new Date(),
      metadata: {
        isSupportChat: true,
        isPlatformSupport: isPlatformSupportChatId(conversationId),
        isCompanySupport: isCompanySupportChatId(conversationId),
        adminUserId: adminUserId ?? undefined,
        submitterUserId: companyUserId ?? undefined,
      },
    };
  }

  private async buildChatFromConversation(
    conversationId: string,
    userId: string,
    securityCompanyId?: string
  ): Promise<Chat | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                profilePictureUrl: true,
                guard: {
                  select: { profilePictureUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      if (isSupportChatId(conversationId)) {
        return this.buildVirtualSupportChat(conversationId, userId);
      }

      const senders = await prisma.message.findMany({
        where: { conversationId },
        select: { senderId: true },
        distinct: ['senderId'],
      });
      const parsed = parseDirectChatParticipantIds(conversationId);
      const participantIds =
        parsed && parsed.length >= 2
          ? parsed
          : senders.map(s => s.senderId).filter(Boolean);

      if (!participantIds.includes(userId)) {
        return null;
      }

      if (participantIds.length > 0) {
        await ensureConversation({
          id: conversationId,
          type: inferConversationType(conversationId),
          createdBy: userId,
          participantIds,
          securityCompanyId,
        });
        return this.buildChatFromConversation(conversationId, userId, securityCompanyId);
      }

      return null;
    }

    if (securityCompanyId && conversation.securityCompanyId && conversation.securityCompanyId !== securityCompanyId) {
      if (!isSupportChatId(conversationId)) {
        return null;
      }
    }

    const participantIds = conversation.participants.map(p => p.userId);
    if (securityCompanyId && !isSupportChatId(conversationId)) {
      const [participantAdmins, participantGuards, participantClients] = await Promise.all([
        prisma.companyUser.findMany({
          where: {
            userId: { in: participantIds },
            securityCompanyId,
            isActive: true,
          },
          select: { userId: true },
        }),
        prisma.guard.findMany({
          where: { userId: { in: participantIds } },
          include: {
            companyGuards: {
              where: { securityCompanyId, isActive: true },
              take: 1,
            },
          },
        }),
        prisma.client.findMany({
          where: { userId: { in: participantIds } },
          include: {
            companyClients: {
              where: { securityCompanyId, isActive: true },
              take: 1,
            },
          },
        }),
      ]);

      const validParticipantIds = new Set([
        ...participantAdmins.map(cu => cu.userId),
        ...participantGuards.filter(g => g.companyGuards.length > 0).map(g => g.userId),
        ...participantClients.filter(c => c.companyClients.length > 0).map(c => c.userId),
      ]);

      if (participantIds.some(id => !validParticipantIds.has(id))) {
        const parsed = parseDirectChatParticipantIds(conversationId);
        if (!parsed?.includes(userId)) {
          return null;
        }
      }
    }

    const [lastMessage, unreadCount] = await Promise.all([
      prisma.message.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
      }),
    ]);

    const participants: ChatParticipant[] = conversation.participants.map(p => ({
      id: p.id,
      chatId: conversationId,
      userId: p.userId,
      role: this.mapParticipantRole(p.role),
      joinedAt: p.joinedAt,
      lastReadAt: p.lastReadAt || undefined,
      user: {
        id: p.user.id,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        avatar: p.user.profilePictureUrl || p.user.guard?.profilePictureUrl || undefined,
        role: p.user.role,
      },
    }));

    let chatName = conversation.name || undefined;
    if (isSupportChatId(conversationId)) {
      const viewer = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      chatName =
        viewer?.role === 'SUPER_ADMIN'
          ? await this.getSupportChatDisplayName(parseSupportChatAdminUserId(conversationId)!)
          : 'Platform Support';
    } else if (!chatName && conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants.find(p => p.userId !== userId);
      if (otherParticipant) {
        chatName = `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`.trim();
      }
    }

    const chatType =
      conversation.type === 'TEAM' ? 'team' : conversation.type === 'GROUP' ? 'group' : 'direct';

    return {
      id: conversationId,
      name: chatName,
      type: chatType,
      participants,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            chatId: conversationId,
            senderId: lastMessage.senderId,
            content: lastMessage.content,
            messageType: mapMessageTypeFromEnum(lastMessage.messageType),
            timestamp: lastMessage.createdAt,
            isRead: lastMessage.isRead,
            sender: {
              id: lastMessage.sender.id,
              firstName: lastMessage.sender.firstName,
              lastName: lastMessage.sender.lastName,
              role: lastMessage.sender.role,
            },
          }
        : undefined,
      lastMessageAt: lastMessage?.createdAt || conversation.lastMessageAt || undefined,
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      ...(isSupportChatId(conversationId)
        ? {
            metadata: {
              isSupportChat: true,
              adminUserId: parseSupportChatAdminUserId(conversationId),
            },
          }
        : {}),
    };
  }

  /**
   * Get all chats for a user
   * Uses Message model with conversationId to group conversations
   * Multi-tenant: Filters chats to only show conversations within the same company
   */
  async getUserChats(userId: string, securityCompanyId?: string): Promise<Chat[]> {
    try {
      // Multi-tenant: Get user's company if not provided (for SUPER_ADMIN)
      let userCompanyId = securityCompanyId;
      if (!userCompanyId) {
        // Get user's company
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            companyUsers: { where: { isActive: true }, take: 1 },
            guard: { include: { companyGuards: { where: { isActive: true }, take: 1 } } },
            client: { include: { companyClients: { where: { isActive: true }, take: 1 } } },
          },
        });
        
        if (user?.role === 'ADMIN' && user.companyUsers.length > 0) {
          userCompanyId = user.companyUsers[0].securityCompanyId;
        } else if (user?.role === 'GUARD' && user.guard?.companyGuards && user.guard.companyGuards.length > 0) {
          userCompanyId = user.guard.companyGuards[0].securityCompanyId;
        } else if (user?.role === 'CLIENT' && user.client?.companyClients && user.client.companyClients.length > 0) {
          userCompanyId = user.client.companyClients[0].securityCompanyId;
        }
      }

      const participantRows = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
        orderBy: { joinedAt: 'desc' },
      });

      let validChats: Chat[] = (
        await Promise.all(
          participantRows.map(row =>
            this.buildChatFromConversation(row.conversationId, userId, userCompanyId)
          )
        )
      ).filter((chat): chat is Chat => chat !== null);

      validChats.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });

      // Legacy fallback before backfill completes
      if (validChats.length === 0) {
        const [sentRows, receivedRows] = await Promise.all([
          prisma.message.findMany({
            where: { senderId: userId },
            select: { conversationId: true },
            distinct: ['conversationId'],
            orderBy: { createdAt: 'desc' },
          }),
          prisma.message.findMany({
            where: {
              conversationId: { contains: userId },
              senderId: { not: userId },
            },
            select: { conversationId: true },
            distinct: ['conversationId'],
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        const conversationIds = [
          ...new Set([...sentRows, ...receivedRows].map(r => r.conversationId)),
        ];

        validChats = (
          await Promise.all(
            conversationIds.map(id =>
              this.buildChatFromConversation(id, userId, userCompanyId)
            )
          )
        ).filter((chat): chat is Chat => chat !== null);
      }

      // For CLIENT users: Also include guards assigned to their sites (even if no chat exists yet)
      // For ADMIN users: Also include guards and clients in their company (even if no chat exists yet)
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            client: true,
            guard: true,
            companyUsers: { where: { isActive: true }, take: 1 },
          },
        });

        if (user?.role === 'CLIENT' && user.client) {
          // Get all guards assigned to client's sites through shifts
          const clientSites = await prisma.site.findMany({
            where: { clientId: user.client.id },
            select: { id: true },
          });

          if (clientSites.length > 0) {
            const siteIds = clientSites.map(s => s.id);
            
            // Get guards with active or recent shifts at client's sites
            const shiftsRaw = await prisma.shift.findMany({
              where: {
                siteId: { in: siteIds },
                // Include shifts from last 30 days or active shifts
                OR: [
                  {
                    status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                  },
                  {
                    scheduledStartTime: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                  },
                ],
              },
              include: {
                guard: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                      },
                    },
                  },
                },
                site: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                scheduledStartTime: 'desc',
              },
            });

            // Get unique guards (manually filter duplicates by guardId)
            // Filter out shifts without guardId, guard, or guard.user and cast to proper type
            const shifts = (shiftsRaw as any[]).filter((shift: any) => {
              return shift.guardId && shift.guard && shift.guard.userId && shift.guard.user;
            });

            const uniqueGuardShifts = new Map<string, any>();
            shifts.forEach((shift: any) => {
              if (shift.guardId && !uniqueGuardShifts.has(shift.guardId)) {
                uniqueGuardShifts.set(shift.guardId, shift);
              }
            });
            const uniqueShifts = Array.from(uniqueGuardShifts.values());

            // Create chat entries for guards assigned to sites (if chat doesn't exist)
            const existingChatGuardIds = new Set(
              validChats
                .filter(chat => chat.type === 'direct')
                .map(chat => {
                  const otherParticipant = chat.participants.find(p => p.userId !== userId);
                  return otherParticipant?.userId;
                })
                .filter(Boolean)
            );

            const guardChats: Chat[] = uniqueShifts
              .filter((shift: any) => {
                const guardUserId = shift.guard?.userId;
                return guardUserId && !existingChatGuardIds.has(guardUserId);
              })
              .map((shift: any) => {
                const guardUser = shift.guard.user;
                const conversationId = `client_${userId}_guard_${guardUser.id}`;
                const guardAvatar = shift.guard.profilePictureUrl || undefined;

                return {
                  id: conversationId,
                  name: `${guardUser.firstName} ${guardUser.lastName}`.trim(),
                  type: 'direct' as const,
                  participants: [
                    {
                      id: `part_${userId}_${conversationId}`,
                      chatId: conversationId,
                      userId: userId,
                      role: 'admin' as const,
                      joinedAt: new Date(),
                      lastReadAt: undefined,
                      user: {
                        id: userId,
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        role: user.role,
                      },
                    },
                    {
                      id: `part_${guardUser.id}_${conversationId}`,
                      chatId: conversationId,
                      userId: guardUser.id,
                      role: 'member' as const,
                      joinedAt: new Date(),
                      lastReadAt: undefined,
                      user: {
                        id: guardUser.id,
                        firstName: guardUser.firstName,
                        lastName: guardUser.lastName,
                        avatar: guardAvatar,
                        role: guardUser.role,
                      },
                    },
                  ],
                  lastMessage: undefined,
                  lastMessageAt: undefined,
                  unreadCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  // Add metadata for site assignment
                  metadata: {
                    siteId: shift.siteId,
                    siteName: shift.site?.name,
                    guardId: shift.guard.id,
                    isAssignedGuard: true,
                  },
                } as Chat & { metadata?: any };
              });

            // Combine existing chats with guard chats
            validChats = [...validChats, ...guardChats];
          }
        } else if (user?.role === 'GUARD' && user.guard) {
          const guardUserId = userId;
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          const shiftsRaw = await prisma.shift.findMany({
            where: {
              guardId: user.guard.id,
              OR: [
                { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
                { scheduledStartTime: { gte: thirtyDaysAgo } },
              ],
            },
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      role: true,
                      profilePictureUrl: true,
                    },
                  },
                },
              },
              site: { select: { id: true, name: true } },
            },
            orderBy: { scheduledStartTime: 'desc' },
          });

          const uniqueClientShifts = new Map<string, any>();
          shiftsRaw.forEach((shift: any) => {
            const clientUserId = shift.client?.userId;
            if (clientUserId && !uniqueClientShifts.has(clientUserId)) {
              uniqueClientShifts.set(clientUserId, shift);
            }
          });

          const existingChatClientIds = new Set(
            validChats
              .filter(chat => chat.type === 'direct')
              .map(chat => chat.participants.find(p => p.userId !== userId)?.userId)
              .filter(Boolean)
          );

          const clientChats: Chat[] = Array.from(uniqueClientShifts.values())
            .filter((shift: any) => {
              const clientUserId = shift.client?.userId;
              return clientUserId && !existingChatClientIds.has(clientUserId);
            })
            .map((shift: any) => {
              const clientUser = shift.client.user;
              const conversationId = `client_${clientUser.id}_guard_${guardUserId}`;

              return {
                id: conversationId,
                name: `${clientUser.firstName} ${clientUser.lastName}`.trim(),
                type: 'direct' as const,
                participants: [
                  {
                    id: `part_${clientUser.id}_${conversationId}`,
                    chatId: conversationId,
                    userId: clientUser.id,
                    role: 'member' as const,
                    joinedAt: new Date(),
                    user: {
                      id: clientUser.id,
                      firstName: clientUser.firstName,
                      lastName: clientUser.lastName,
                      avatar: clientUser.profilePictureUrl || undefined,
                      role: clientUser.role,
                    },
                  },
                  {
                    id: `part_${guardUserId}_${conversationId}`,
                    chatId: conversationId,
                    userId: guardUserId,
                    role: 'admin' as const,
                    joinedAt: new Date(),
                    user: {
                      id: guardUserId,
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      role: user.role,
                    },
                  },
                ],
                lastMessage: undefined,
                lastMessageAt: undefined,
                unreadCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                  clientId: shift.client.id,
                  siteId: shift.siteId,
                  siteName: shift.site?.name,
                  isAssignedClient: true,
                },
              } as Chat & { metadata?: any };
            });

          validChats = [...validChats, ...clientChats];
        } else if (user?.role === 'ADMIN' && user.companyUsers.length > 0) {
          // For ADMIN users: Include guards and clients in their company
          const adminCompanyId = user.companyUsers[0].securityCompanyId;

          // Get all guards in the company
          const companyGuards = await prisma.companyGuard.findMany({
            where: {
              securityCompanyId: adminCompanyId,
              isActive: true,
            },
            include: {
              guard: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      role: true,
                    },
                  },
                },
              },
            },
          });

          // Get all clients in the company
          const companyClients = await prisma.companyClient.findMany({
            where: {
              securityCompanyId: adminCompanyId,
              isActive: true,
            },
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      role: true,
                    },
                  },
                },
              },
            },
          });

          // Get existing chat participant IDs to avoid duplicates
          const existingChatUserIds = new Set(
            validChats
              .filter(chat => chat.type === 'direct')
              .map(chat => {
                const otherParticipant = chat.participants.find(p => p.userId !== userId);
                return otherParticipant?.userId;
              })
              .filter(Boolean)
          );

          // Create virtual chats for guards
          const guardChats: Chat[] = companyGuards
            .filter(cg => {
              const guardUserId = cg.guard?.userId;
              return guardUserId && !existingChatUserIds.has(guardUserId);
            })
            .map(cg => {
              const guardUser = cg.guard!.user;
              const conversationId = `admin_${userId}_guard_${guardUser.id}`;
              const guardAvatar = cg.guard!.profilePictureUrl || undefined;

              return {
                id: conversationId,
                name: `${guardUser.firstName} ${guardUser.lastName}`.trim(),
                type: 'direct' as const,
                participants: [
                  {
                    id: `part_${userId}_${conversationId}`,
                    chatId: conversationId,
                    userId: userId,
                    role: 'admin' as const,
                    joinedAt: new Date(),
                    lastReadAt: undefined,
                    user: {
                      id: userId,
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      role: user.role,
                    },
                  },
                  {
                    id: `part_${guardUser.id}_${conversationId}`,
                    chatId: conversationId,
                    userId: guardUser.id,
                    role: 'member' as const,
                    joinedAt: new Date(),
                    lastReadAt: undefined,
                    user: {
                      id: guardUser.id,
                      firstName: guardUser.firstName,
                      lastName: guardUser.lastName,
                      avatar: guardAvatar,
                      role: guardUser.role,
                    },
                  },
                ],
                lastMessage: undefined,
                lastMessageAt: undefined,
                unreadCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                  guardId: cg.guard!.id,
                  isAssignedGuard: true,
                },
              } as Chat & { metadata?: any };
            });

          // Update existing chat user IDs to include guards
          guardChats.forEach(chat => {
            const otherParticipant = chat.participants.find(p => p.userId !== userId);
            if (otherParticipant?.userId) {
              existingChatUserIds.add(otherParticipant.userId);
            }
          });

          // Create virtual chats for clients
          const clientChats: Chat[] = companyClients
            .filter(cc => {
              const clientUserId = cc.client?.userId;
              return clientUserId && !existingChatUserIds.has(clientUserId);
            })
            .map(cc => {
              const clientUser = cc.client!.user;
              const conversationId = `client_${clientUser.id}_admin_${userId}`;

              return {
                id: conversationId,
                name: `${clientUser.firstName} ${clientUser.lastName}`.trim(),
                type: 'direct' as const,
                participants: [
                  {
                    id: `part_${userId}_${conversationId}`,
                    chatId: conversationId,
                    userId: userId,
                    role: 'admin' as const,
                    joinedAt: new Date(),
                    lastReadAt: undefined,
                    user: {
                      id: userId,
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      role: user.role,
                    },
                  },
                  {
                    id: `part_${clientUser.id}_${conversationId}`,
                    chatId: conversationId,
                    userId: clientUser.id,
                    role: 'member' as const,
                    joinedAt: new Date(),
                    lastReadAt: undefined,
                    user: {
                      id: clientUser.id,
                      firstName: clientUser.firstName,
                      lastName: clientUser.lastName,
                      role: clientUser.role,
                    },
                  },
                ],
                lastMessage: undefined,
                lastMessageAt: undefined,
                unreadCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                  clientId: cc.client!.id,
                  isAssignedClient: true,
                },
              } as Chat & { metadata?: any };
            });

          // Combine existing chats with guard and client chats
          validChats = [...validChats, ...guardChats, ...clientChats];
        }
      } catch (siteGuardError) {
        // Log error but don't fail - just return existing chats
        logger.error('Error fetching users for chats:', siteGuardError);
        // Continue with existing chats only
      }

      // Sort by last message time (most recent first), with assigned guards at the end
      validChats.sort((a, b) => {
        // Chats with messages come first
        if (a.lastMessageAt && !b.lastMessageAt) return -1;
        if (!a.lastMessageAt && b.lastMessageAt) return 1;
        if (a.lastMessageAt && b.lastMessageAt) {
          return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
        }
        // Both have no messages - assigned guards come after existing chats
        const aIsAssigned = (a as any).metadata?.isAssignedGuard;
        const bIsAssigned = (b as any).metadata?.isAssignedGuard;
        if (aIsAssigned && !bIsAssigned) return 1;
        if (!aIsAssigned && bIsAssigned) return -1;
        return 0;
      });

      // Team chats only — platform support uses GET /chat/support
      validChats = validChats.filter(chat => !isSupportChatId(chat.id));

      return validChats;
    } catch (error) {
      logger.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific chat
   * Multi-tenant: Validates user belongs to same company as chat participants
   */
  async getChatMessages(chatId: string, userId: string, page: number = 1, limit: number = 50, securityCompanyId?: string): Promise<ChatMessage[]> {
    try {
      const skip = (page - 1) * limit;

      // Multi-tenant: Get user's company
      let userCompanyId = securityCompanyId;
      if (!userCompanyId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            companyUsers: { where: { isActive: true }, take: 1 },
            guard: { include: { companyGuards: { where: { isActive: true }, take: 1 } } },
            client: { include: { companyClients: { where: { isActive: true }, take: 1 } } },
          },
        });
        
        if (user?.role === 'ADMIN' && user.companyUsers.length > 0) {
          userCompanyId = user.companyUsers[0].securityCompanyId;
        } else if (user?.role === 'GUARD' && user.guard?.companyGuards && user.guard.companyGuards.length > 0) {
          userCompanyId = user.guard.companyGuards[0].securityCompanyId;
        } else if (user?.role === 'CLIENT' && user.client?.companyClients && user.client.companyClients.length > 0) {
          userCompanyId = user.client.companyClients[0].securityCompanyId;
        }
      }

      // Verify user has access to this conversation
      if (isSupportChatId(chatId)) {
        if (!(await this.canAccessSupportChat(chatId, userId))) {
          throw new Error('Chat not found or access denied');
        }
        let participantIds: string[] = [userId];
        let createdBy = userId;
        let chatName = 'Support';
        if (isPlatformSupportChatId(chatId)) {
          const adminUserId = parseSupportChatAdminUserId(chatId)!;
          const superAdminIds = await this.getSuperAdminUserIds();
          participantIds = [...new Set([adminUserId, ...superAdminIds, userId])];
          createdBy = adminUserId;
          chatName = 'Platform Support';
        } else if (isCompanySupportChatId(chatId)) {
          const submitterId = parseCompanySupportUserId(chatId)!;
          const companyId = userCompanyId ?? (await resolveSubmitterCompanyId(submitterId));
          const adminIds = companyId ? await getCompanySupportStaffUserIds(companyId) : [];
          participantIds = [...new Set([submitterId, ...adminIds, userId])];
          createdBy = submitterId;
          chatName = 'Company Support';
        }
        await ensureConversation({
          id: chatId,
          type: inferConversationType(chatId),
          name: chatName,
          createdBy,
          participantIds,
          securityCompanyId: userCompanyId,
        });
      }

      const hasParticipantAccess = await isConversationParticipant(chatId, userId);
      let hasSentMessage = hasParticipantAccess;
      const existingMessages = await prisma.message.findFirst({
        where: { conversationId: chatId },
      });

      if (!hasParticipantAccess) {
        if (existingMessages) {
          const messageFromUser = await prisma.message.findFirst({
            where: {
              conversationId: chatId,
              senderId: userId,
            },
          });

          if (messageFromUser) {
            hasSentMessage = true;
          } else {
            const parsedParticipants = parseDirectChatParticipantIds(chatId);
            if (parsedParticipants?.includes(userId)) {
              hasSentMessage = true;
            }
          }
        }
      }
      
      if (!hasSentMessage && !isSupportChatId(chatId)) {
        // Validate access based on chatId format (for new chats or users who haven't sent a message)
        // Supported formats:
        // - client_<clientUserId>_guard_<guardUserId> (new format)
        // - admin_<adminUserId>_guard_<guardUserId> (new format)
        // - client_<clientUserId>_admin_<adminUserId> (new format)
        // - client_guard_<guardId>_<timestamp> (old format - backward compatibility)
        // - admin_guard_<guardId>_<timestamp> (old format - backward compatibility)
        // - client_admin_<adminId>_<timestamp> (old format - backward compatibility)
        const chatIdParts = chatId.split('_');
        
        // Check for new format: role_userId_role_userId (4+ parts)
        // New format: client_<userId>_guard_<userId> or admin_<userId>_guard_<userId>
        // Old format: client_guard_<guardId>_<timestamp> or admin_guard_<guardId>_<timestamp>
        if (chatIdParts.length >= 4) {
          const role1 = chatIdParts[0]; // 'client' or 'admin'
          const part1 = chatIdParts[1]; // Could be userId (new) or 'guard'/'admin' (old)
          const part2 = chatIdParts[2]; // Could be 'guard'/'admin' (new) or guardId (old)
          const part3 = chatIdParts[3]; // Could be userId (new) or timestamp (old)
          
          // Detect format: if part2 is 'guard' or 'admin', it's new format
          // If part2 is a UUID (not 'guard' or 'admin'), it's old format
          const isNewFormat = part2 === 'guard' || part2 === 'admin';
          
          if (isNewFormat) {
            // New format: role_userId_role_userId
            const userId1 = part1;
            const role2 = part2;
            const userId2 = part3;
            // Get current user's role
            const currentUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { 
                id: true,
                role: true,
              },
            });
            
            if (!currentUser) {
              throw new Error('Chat not found or access denied');
            }
            
            // Check if current user is one of the participants
            const isParticipant = userId === userId1 || userId === userId2;
            
            if (!isParticipant) {
              throw new Error('Chat not found or access denied');
            }
            
            // For new chats, allow access - empty messages array will be returned
            // The chat will be created when first message is sent
          } else {
            // Old format: role_role_<id>_<timestamp>
            const role2 = part1; // 'guard' or 'admin'
            const participantId = part2; // Guard/Admin ID (not userId)
            
            // Get current user's role
            const currentUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { 
                id: true,
                role: true,
              },
            });
            
            if (!currentUser) {
              throw new Error('Chat not found or access denied');
            }
            
            let hasAccess = false;
            
            // Case 1: Client-Guard chat (client_guard_<guardId>_<timestamp>)
            if (role1 === 'client' && role2 === 'guard') {
              // Try to find guard by ID and check if user is the guard or client
              const guard = await prisma.guard.findUnique({
                where: { id: participantId },
                select: { userId: true },
              });
              
              const isGuardInChat = guard && guard.userId === userId;
              const isClient = currentUser.role === 'CLIENT';
              const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
              
              hasAccess = isGuardInChat || isClient || isAdmin;
            }
            // Case 2: Admin-Guard chat (admin_guard_<guardId>_<timestamp>)
            else if (role1 === 'admin' && role2 === 'guard') {
              const guard = await prisma.guard.findUnique({
                where: { id: participantId },
                select: { userId: true },
              });
              
              const isGuardInChat = guard && guard.userId === userId;
              const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
              
              hasAccess = isGuardInChat || isAdmin;
            }
            // Case 3: Client-Admin chat (client_admin_<adminId>_<timestamp>)
            else if (role1 === 'client' && role2 === 'admin') {
              // Try to find admin by userId (adminId might be userId)
              const adminUser = await prisma.user.findUnique({
                where: { id: participantId },
                select: { id: true, role: true },
              });
              
              const isAdminInChat = adminUser && adminUser.id === userId && adminUser.role === 'ADMIN';
              const isClient = currentUser.role === 'CLIENT';
              const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
              
              hasAccess = isAdminInChat || isClient || isAdmin;
            }
            
            if (!hasAccess) {
              throw new Error('Chat not found or access denied');
            }
          }
        } else if (chatId.startsWith('direct_')) {
          const parsedParticipants = parseDirectChatParticipantIds(chatId);
          if (parsedParticipants?.includes(userId)) {
            hasSentMessage = true;
          } else {
            throw new Error('Chat not found or access denied');
          }
        } else {
          // For other chatId formats, require existing conversation
          throw new Error('Chat not found or access denied');
        }
      }

      // Multi-tenant: Validate all participants in conversation belong to same company
      if (existingMessages && userCompanyId) {
        const conversationParticipants = await prisma.message.findMany({
          where: { conversationId: chatId },
          select: { senderId: true },
          distinct: ['senderId'],
        });

        const participantIds = conversationParticipants.map(p => p.senderId);
        
        if (participantIds.length > 0) {
          const [participantAdmins, participantGuards, participantClients] = await Promise.all([
            prisma.companyUser.findMany({
              where: {
                userId: { in: participantIds },
                securityCompanyId: userCompanyId,
                isActive: true,
              },
              select: { userId: true },
            }),
            prisma.guard.findMany({
              where: { userId: { in: participantIds } },
              include: {
                companyGuards: {
                  where: { securityCompanyId: userCompanyId, isActive: true },
                  take: 1,
                },
              },
            }),
            prisma.client.findMany({
              where: { userId: { in: participantIds } },
              include: {
                companyClients: {
                  where: { securityCompanyId: userCompanyId, isActive: true },
                  take: 1,
                },
              },
            }),
          ]);

          const validParticipantIds = new Set([
            ...participantAdmins.map(cu => cu.userId),
            ...participantGuards.filter(g => g.companyGuards.length > 0).map(g => g.userId),
            ...participantClients.filter(c => c.companyClients.length > 0).map(c => c.userId),
          ]);

          // Reject if not all participants are in the same company
          if (participantIds.some(id => !validParticipantIds.has(id))) {
            throw new Error('Chat not found or access denied');
          }
        }
      }

      // Fetch messages from database
      const messages = await prisma.message.findMany({
        where: { conversationId: chatId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Transform to ChatMessage format
      const chatMessages: ChatMessage[] = messages.reverse().map((msg) => ({
        id: msg.id,
        chatId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        messageType: mapMessageTypeFromEnum(msg.messageType),
        timestamp: msg.createdAt,
        isRead: msg.isRead,
        sender: {
          id: msg.sender.id,
          firstName: msg.sender.firstName,
          lastName: msg.sender.lastName,
          role: msg.sender.role,
        },
      }));

      return chatMessages;
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Send a message
   * Multi-tenant: Validates sender belongs to same company as chat participants
   */
  async sendMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'image' | 'file' | 'location';
    securityCompanyId?: string;
  }): Promise<ChatMessage> {
    try {
      const userCompanyId = data.securityCompanyId;
      const supportChat = isSupportChatId(data.chatId);

      if (supportChat) {
        if (!(await this.canAccessSupportChat(data.chatId, data.senderId))) {
          throw new Error('You do not have access to this conversation');
        }
      }

      // Register conversation + participants before first message (so recipients see the chat)
      const parsedParticipants = parseDirectChatParticipantIds(data.chatId);
      let participantIds = await getConversationParticipantIds(data.chatId);

      if (supportChat) {
        if (isPlatformSupportChatId(data.chatId)) {
          const adminUserId = parseSupportChatAdminUserId(data.chatId)!;
          const superAdminIds = await this.getSuperAdminUserIds();
          participantIds = [...new Set([adminUserId, ...superAdminIds, data.senderId])];
        } else if (isCompanySupportChatId(data.chatId)) {
          const submitterId = parseCompanySupportUserId(data.chatId)!;
          const submitterCompany = await resolveSubmitterCompanyId(submitterId);
          const adminIds = submitterCompany
            ? await getCompanySupportStaffUserIds(submitterCompany)
            : [];
          participantIds = [...new Set([submitterId, ...adminIds, data.senderId])];
        }
      } else if (parsedParticipants && parsedParticipants.length >= 2) {
        participantIds = [...new Set([...parsedParticipants, data.senderId])];
      } else if (!participantIds.includes(data.senderId)) {
        participantIds = [...participantIds, data.senderId];
      }

      if (participantIds.length > 0) {
        await ensureConversation({
          id: data.chatId,
          type: inferConversationType(data.chatId),
          createdBy: data.senderId,
          participantIds,
          securityCompanyId: userCompanyId,
        });
      }

      // Multi-tenant: Validate sender can send to this chat
      if (userCompanyId && !supportChat) {
        participantIds = await getConversationParticipantIds(data.chatId);
        if (participantIds.length === 0) {
          const conversationParticipants = await prisma.message.findMany({
            where: { conversationId: data.chatId },
            select: { senderId: true },
            distinct: ['senderId'],
          });
          participantIds = [...new Set([...conversationParticipants.map(p => p.senderId), data.senderId])];
        } else if (!participantIds.includes(data.senderId)) {
          participantIds = [...participantIds, data.senderId];
        }
        
        // Validate all participants belong to same company
        const [participantAdmins, participantGuards, participantClients] = await Promise.all([
          prisma.companyUser.findMany({
            where: {
              userId: { in: participantIds },
              securityCompanyId: userCompanyId,
              isActive: true,
            },
            select: { userId: true },
          }),
          prisma.guard.findMany({
            where: { userId: { in: participantIds } },
            include: {
              companyGuards: {
                where: { securityCompanyId: userCompanyId, isActive: true },
                take: 1,
              },
            },
          }),
          prisma.client.findMany({
            where: { userId: { in: participantIds } },
            include: {
              companyClients: {
                where: { securityCompanyId: userCompanyId, isActive: true },
                take: 1,
              },
            },
          }),
        ]);

        const validParticipantIds = new Set([
          ...participantAdmins.map(cu => cu.userId),
          ...participantGuards.filter(g => g.companyGuards.length > 0).map(g => g.userId),
          ...participantClients.filter(c => c.companyClients.length > 0).map(c => c.userId),
        ]);

        const invalidParticipants = participantIds.filter(id => !validParticipantIds.has(id));

        if (invalidParticipants.length > 0) {
          const users = await prisma.user.findMany({
            where: { id: { in: participantIds } },
            select: { id: true, role: true },
          });
          const roleByUserId = new Map(users.map(u => [u.id, u.role]));
          const clientUserId = participantIds.find(id => roleByUserId.get(id) === 'CLIENT');
          const guardUserId = participantIds.find(id => roleByUserId.get(id) === 'GUARD');

          let allowSiteAssignedChat = false;
          if (clientUserId && guardUserId) {
            const client = await prisma.client.findUnique({
              where: { userId: clientUserId },
              select: { id: true },
            });
            const guard = await prisma.guard.findUnique({
              where: { userId: guardUserId },
              select: { id: true },
            });

            if (client && guard) {
              const clientSites = await prisma.site.findMany({
                where: { clientId: client.id },
                select: { id: true },
              });

              if (clientSites.length > 0) {
                const assignedShift = await prisma.shift.findFirst({
                  where: {
                    guardId: guard.id,
                    siteId: { in: clientSites.map(s => s.id) },
                    OR: [
                      { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
                      {
                        scheduledStartTime: {
                          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                      },
                    ],
                  },
                  select: { id: true },
                });
                allowSiteAssignedChat = Boolean(assignedShift);
              }
            }
          }

          if (!allowSiteAssignedChat) {
            throw new Error('Cannot send message: participants must belong to the same company');
          }
        }
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          senderId: data.senderId,
          conversationId: data.chatId,
          content: data.content,
          messageType: mapMessageTypeToEnum(data.messageType),
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      await touchConversationLastMessage(data.chatId, message.createdAt);

      // Transform to ChatMessage format
      const chatMessage: ChatMessage = {
        id: message.id,
        chatId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        messageType: data.messageType,
        timestamp: message.createdAt,
        isRead: message.isRead,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          role: message.sender.role,
        },
      };

      // Get all participants in this conversation to ensure they're in the room
      participantIds = await getConversationParticipantIds(data.chatId);
      if (participantIds.length === 0) {
        const conversationParticipants = await prisma.message.findMany({
          where: { conversationId: data.chatId },
          select: { senderId: true },
          distinct: ['senderId'],
        });
        participantIds = [...new Set([...conversationParticipants.map(p => p.senderId), data.senderId])];
      }

      // Ensure all participants are joined to the chat room
      participantIds.forEach(participantId => {
        this.websocketService.joinUserToChatRoom(participantId, data.chatId);
      });

      // Broadcast message to chat participants via WebSocket
      this.websocketService.broadcastToRoom(`chat_${data.chatId}`, 'new_message', {
        message: chatMessage,
        chatId: data.chatId
      });

      // Notify offline participants via push + in-app notification
      if (data.messageType === 'text' || data.messageType === 'image' || data.messageType === 'file') {
        try {
          const notificationService = (await import('./notificationService.js')).default;
          const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
          const preview =
            data.content.length > 100 ? `${data.content.slice(0, 97)}...` : data.content;

          await notificationService.notifyChatMessage(
            participantIds,
            {
              senderName,
              senderUserId: data.senderId,
              chatId: data.chatId,
              messageId: message.id,
              preview,
            },
            data.securityCompanyId
          );
        } catch (notifyErr) {
          logger.error('Failed to send chat message notification:', notifyErr);
        }
      }

      logger.info(`Message sent in chat ${data.chatId} by user ${data.senderId}`);

      return chatMessage;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    try {
      // Update messages as read in database
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          conversationId: chatId,
          senderId: { not: userId }, // Only mark messages from others as read
        },
        data: {
          isRead: true,
        },
      });

      await updateParticipantLastRead(chatId, userId);

      logger.info(`Marked ${messageIds.length} messages as read in chat ${chatId} for user ${userId}`);

      // Get all participants and ensure they're in the room
      let participantIds = await getConversationParticipantIds(chatId);
      if (participantIds.length === 0) {
        const conversationParticipants = await prisma.message.findMany({
          where: { conversationId: chatId },
          select: { senderId: true },
          distinct: ['senderId'],
        });
        participantIds = [...new Set(conversationParticipants.map(p => p.senderId))];
      }
      participantIds.forEach(participantId => {
        this.websocketService.joinUserToChatRoom(participantId, chatId);
      });

      // Broadcast read status to other participants
      this.websocketService.broadcastToRoom(`chat_${chatId}`, 'messages_read', {
        chatId,
        userId,
        messageIds,
        readAt: new Date()
      });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * List platform support chats (admin sees own thread; super admin sees all admin requests).
   */
  async getSupportChats(userId: string, securityCompanyId?: string): Promise<Chat[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return [];
    }

    if (user.role === 'ADMIN') {
      const platformChatId = buildSupportChatId(userId);
      const [platformChat, companyConversations, companyMessages] = await Promise.all([
        this.buildChatFromConversation(platformChatId, userId, securityCompanyId).then(
          c => c ?? this.buildVirtualSupportChat(platformChatId, userId),
        ),
        prisma.conversation.findMany({
          where: { id: { startsWith: 'support_user_' }, securityCompanyId: securityCompanyId ?? undefined },
          select: { id: true },
        }),
        prisma.message.findMany({
          where: { conversationId: { startsWith: 'support_user_' } },
          select: { conversationId: true },
          distinct: ['conversationId'],
        }),
      ]);

      const companyIds = [
        ...new Set([
          ...companyConversations.map(c => c.id),
          ...companyMessages.map(m => m.conversationId),
        ]),
      ];

      const companyChats = (
        await Promise.all(
          companyIds.map(async id => {
            const existing = await this.buildChatFromConversation(id, userId, securityCompanyId);
            if (existing) return existing;
            return this.buildVirtualSupportChat(id, userId);
          }),
        )
      ).filter((c): c is Chat => c !== null);

      const chats = [platformChat, ...companyChats].filter((c): c is Chat => c !== null);
      chats.sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0));
      return chats;
    }

    if (user.role === 'GUARD' || user.role === 'CLIENT') {
      const chatId = buildCompanySupportChatId(userId);
      let chat = await this.buildChatFromConversation(chatId, userId, securityCompanyId);
      if (!chat) chat = await this.buildVirtualSupportChat(chatId, userId);
      return chat ? [chat] : [];
    }

    if (user.role === 'SUPER_ADMIN') {
      const [conversations, messageRows] = await Promise.all([
        prisma.conversation.findMany({
          where: { id: { startsWith: 'support_admin_' } },
          select: { id: true },
        }),
        prisma.message.findMany({
          where: { conversationId: { startsWith: 'support_admin_' } },
          select: { conversationId: true },
          distinct: ['conversationId'],
        }),
      ]);

      const conversationIds = [
        ...new Set([
          ...conversations.map(row => row.id),
          ...messageRows.map(row => row.conversationId),
        ]),
      ];

      const chats = (
        await Promise.all(
          conversationIds.map(async id => {
            const existing = await this.buildChatFromConversation(id, userId);
            if (existing) return existing;
            return this.buildVirtualSupportChat(id, userId);
          }),
        )
      ).filter((chat): chat is Chat => chat !== null);

      chats.sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });

      return chats;
    }

    throw new Error('Support chat is not available for this role');
  }

  async openCompanySupportChat(userId: string, securityCompanyId?: string): Promise<Chat> {
    const { conversationId } = await import('./supportService.js').then(m =>
      m.openCompanySupportChat(userId, securityCompanyId),
    );
    const chat =
      (await this.buildChatFromConversation(conversationId, userId, securityCompanyId)) ||
      (await this.buildVirtualSupportChat(conversationId, userId));
    if (!chat) throw new Error('Failed to open company support chat');
    return chat;
  }

  /**
   * Open (or create) the admin's platform support conversation.
   */
  async openSupportChat(adminUserId: string, securityCompanyId?: string): Promise<Chat> {
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Only company admins can open platform support chat');
    }

    const superAdminIds = await this.getSuperAdminUserIds();
    if (superAdminIds.length === 0) {
      throw new Error('No platform support agents are available');
    }

    const chatId = buildSupportChatId(adminUserId);
    await ensureConversation({
      id: chatId,
      type: inferConversationType(chatId),
      name: 'Platform Support',
      createdBy: adminUserId,
      participantIds: [...new Set([adminUserId, ...superAdminIds])],
      securityCompanyId,
    });

    const chat =
      (await this.buildChatFromConversation(chatId, adminUserId, securityCompanyId)) ||
      (await this.buildVirtualSupportChat(chatId, adminUserId));

    if (!chat) {
      throw new Error('Failed to open support chat');
    }

    return chat;
  }

  /**
   * Create a new chat
   * Creates a conversation by sending an initial message
   */
  async createChat(data: {
    type: 'direct' | 'group' | 'team';
    name?: string;
    participantIds: string[];
    createdBy: string;
    securityCompanyId?: string;
  }): Promise<Chat> {
    try {
      // Validate participant roles for direct chats
      if (data.type === 'direct') {
        const otherParticipantId = getDirectChatOtherParticipantId(data.participantIds, data.createdBy);
        if (!otherParticipantId) {
          throw new Error('Direct chat requires exactly one other participant');
        }

        const creator = await prisma.user.findUnique({
          where: { id: data.createdBy },
          select: { role: true },
        });
        
        const participant = await prisma.user.findUnique({
          where: { id: otherParticipantId },
          select: { role: true },
        });
        
        if (!creator || !participant) {
          throw new Error('Invalid participant IDs');
        }
        
        // Validate allowed role combinations:
        // - CLIENT ↔ GUARD (allowed)
        // - ADMIN ↔ GUARD (allowed)
        // - CLIENT ↔ ADMIN (allowed)
        // - GUARD ↔ GUARD (not allowed for direct)
        // - ADMIN ↔ ADMIN (not allowed for direct)
        // - CLIENT ↔ CLIENT (not allowed for direct)
        const roleCombinations = [
          ['CLIENT', 'GUARD'],
          ['GUARD', 'CLIENT'],
          ['ADMIN', 'GUARD'],
          ['GUARD', 'ADMIN'],
          ['CLIENT', 'ADMIN'],
          ['ADMIN', 'CLIENT'],
        ];
        
        const combination = [creator.role, participant.role];
        const isValid = roleCombinations.some(
          combo => combo[0] === combination[0] && combo[1] === combination[1]
        );
        
        if (!isValid) {
          throw new Error(`Direct chat between ${creator.role} and ${participant.role} is not allowed`);
        }
      }
      
      // Multi-tenant: Validate all participants belong to same company (if not SUPER_ADMIN)
      // Exception: CLIENT-GUARD chats are allowed if guard is assigned to client's site
      const userCompanyId = data.securityCompanyId;
      if (userCompanyId) {
        const allParticipantIds = [...new Set([...data.participantIds, data.createdBy])];
        
        // Helper function to validate company membership
        const validateCompanyMembership = async (): Promise<boolean> => {
        const [participantAdmins, participantGuards, participantClients] = await Promise.all([
          prisma.companyUser.findMany({
            where: {
              userId: { in: allParticipantIds },
              securityCompanyId: userCompanyId,
              isActive: true,
            },
            select: { userId: true },
          }),
          prisma.guard.findMany({
            where: { userId: { in: allParticipantIds } },
            include: {
              companyGuards: {
                where: { securityCompanyId: userCompanyId, isActive: true },
                take: 1,
              },
            },
          }),
          prisma.client.findMany({
            where: { userId: { in: allParticipantIds } },
            include: {
              companyClients: {
                where: { securityCompanyId: userCompanyId, isActive: true },
                take: 1,
              },
            },
          }),
        ]);

        const validParticipantIds = new Set([
          ...participantAdmins.map(cu => cu.userId),
          ...participantGuards.filter(g => g.companyGuards.length > 0).map(g => g.userId),
          ...participantClients.filter(c => c.companyClients.length > 0).map(c => c.userId),
        ]);

          return !allParticipantIds.some(id => !validParticipantIds.has(id));
        };

        // Get user roles to check chat type
        const participants = await prisma.user.findMany({
          where: { id: { in: allParticipantIds } },
          select: { id: true, role: true },
        });

        const participantMap = new Map(participants.map(p => [p.id, p.role]));
        const creatorRole = participantMap.get(data.createdBy);
        
        // Get the other participant - handle case where createdBy might be in participantIds
        let otherParticipantId = data.participantIds.find(id => id !== data.createdBy);
        // If not found, get the first one that's different from creator
        if (!otherParticipantId && data.participantIds.length > 0) {
          otherParticipantId = data.participantIds[0];
        }
        const otherParticipantRole = otherParticipantId ? participantMap.get(otherParticipantId) : null;

        logger.debug(`Chat creation - creatorRole: ${creatorRole}, otherRole: ${otherParticipantRole}, creatorId: ${data.createdBy}, otherId: ${otherParticipantId}`);

        // Check if this is a CLIENT-GUARD or GUARD-CLIENT chat
        const isClientGuardChat = 
          (creatorRole === 'CLIENT' && otherParticipantRole === 'GUARD') ||
          (creatorRole === 'GUARD' && otherParticipantRole === 'CLIENT');

        // Check if this is ADMIN-GUARD, GUARD-ADMIN, ADMIN-CLIENT, or CLIENT-ADMIN chat
        const isAdminGuardChat = 
          (creatorRole === 'ADMIN' && otherParticipantRole === 'GUARD') ||
          (creatorRole === 'GUARD' && otherParticipantRole === 'ADMIN');
        
        const isAdminClientChat = 
          (creatorRole === 'ADMIN' && otherParticipantRole === 'CLIENT') ||
          (creatorRole === 'CLIENT' && otherParticipantRole === 'ADMIN');

        logger.debug(`Chat type detection - isClientGuard: ${isClientGuardChat}, isAdminGuard: ${isAdminGuardChat}, isAdminClient: ${isAdminClientChat}`);

        // For ADMIN-GUARD or ADMIN-CLIENT chats within same company, allow them
        if ((isAdminGuardChat || isAdminClientChat) && otherParticipantId) {
          // Validate company membership for ADMIN chats
          const isValid = await validateCompanyMembership();
          if (!isValid) {
            throw new Error('Cannot create chat: all participants must belong to the same company');
          }
          // If valid, allow the chat - skip to chatId generation
        }
        // For CLIENT-GUARD chats, check if guard is assigned to client's site
        else if (isClientGuardChat && otherParticipantId) {
          const clientUserId = creatorRole === 'CLIENT' ? data.createdBy : otherParticipantId;
          const guardUserId = creatorRole === 'GUARD' ? data.createdBy : otherParticipantId;

          // Get client's client record
          const client = await prisma.client.findUnique({
            where: { userId: clientUserId },
            select: { id: true },
          });

          // Get guard's guard record
          const guard = await prisma.guard.findUnique({
            where: { userId: guardUserId },
            select: { id: true },
          });

          if (client && guard) {
            // Check if guard has any active or recent shifts at client's sites
            const clientSites = await prisma.site.findMany({
              where: { clientId: client.id },
              select: { id: true },
            });

            if (clientSites.length > 0) {
              const siteIds = clientSites.map(s => s.id);
              const assignedShift = await prisma.shift.findFirst({
                where: {
                  guardId: guard.id,
                  siteId: { in: siteIds },
                  // Include active or recent shifts (last 30 days)
                  OR: [
                    {
                      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                    },
                    {
                      scheduledStartTime: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      },
                    },
                  ],
                },
                select: { id: true },
              });

              // If guard is assigned to client's site, allow the chat (skip company validation)
              if (assignedShift) {
                logger.info(`Allowing CLIENT-GUARD chat: guard ${guard.id} is assigned to client ${client.id}'s site`);
                // Skip company validation for this case
              } else {
                // Guard not assigned to client's site, validate company membership
                const isValid = await validateCompanyMembership();
                if (!isValid) {
          throw new Error('Cannot create chat: all participants must belong to the same company');
                }
              }
            } else {
              // Client has no sites, validate company membership
              const isValid = await validateCompanyMembership();
              if (!isValid) {
                throw new Error('Cannot create chat: all participants must belong to the same company');
              }
            }
          } else {
            // Could not find client or guard records, validate company membership
            const isValid = await validateCompanyMembership();
            if (!isValid) {
              throw new Error('Cannot create chat: all participants must belong to the same company');
            }
          }
        } else {
          // Not a CLIENT-GUARD chat, validate company membership
          const isValid = await validateCompanyMembership();
          if (!isValid) {
            throw new Error('Cannot create chat: all participants must belong to the same company');
          }
        }
      }

      // Generate conversation ID based on roles for consistency with virtual chats
      let chatId: string;
      const otherParticipantId = data.type === 'direct'
        ? getDirectChatOtherParticipantId(data.participantIds, data.createdBy)
        : null;
      
      // Get user roles to create consistent chat ID
      const participantUserIds = data.type === 'direct' && otherParticipantId
        ? [data.createdBy, otherParticipantId]
        : [data.createdBy, ...data.participantIds];
      const participants = await prisma.user.findMany({
        where: { id: { in: [...new Set(participantUserIds)] } },
        select: { id: true, role: true, firstName: true, lastName: true },
      });

      const creator = participants.find(p => p.id === data.createdBy);
      const participant = otherParticipantId
        ? participants.find(p => p.id === otherParticipantId)
        : null;

      if (data.type === 'direct') {
        if (!participant || !creator || !otherParticipantId) {
          throw new Error('Invalid participant IDs for direct chat');
        }
        // Create consistent ID based on roles (matches getUserChats pattern)
        if (creator.role === 'CLIENT' && participant.role === 'GUARD') {
          chatId = `client_${data.createdBy}_guard_${otherParticipantId}`;
        } else if (creator.role === 'GUARD' && participant.role === 'CLIENT') {
          chatId = `client_${otherParticipantId}_guard_${data.createdBy}`;
        } else if (creator.role === 'ADMIN' && participant.role === 'GUARD') {
          chatId = `admin_${data.createdBy}_guard_${otherParticipantId}`;
        } else if (creator.role === 'GUARD' && participant.role === 'ADMIN') {
          chatId = `admin_${otherParticipantId}_guard_${data.createdBy}`;
        } else if (creator.role === 'CLIENT' && participant.role === 'ADMIN') {
          chatId = `client_${data.createdBy}_admin_${otherParticipantId}`;
        } else if (creator.role === 'ADMIN' && participant.role === 'CLIENT') {
          chatId = `client_${otherParticipantId}_admin_${data.createdBy}`;
        } else {
          // Fallback to sorted user IDs for other combinations
          const sortedIds = [data.createdBy, otherParticipantId].sort();
          chatId = `direct_${sortedIds[0]}_${sortedIds[1]}`;
        }
      } else {
        // For group/team chats, generate a unique ID
        chatId = `${data.type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      }

      const allParticipantIds = [...new Set([...data.participantIds, data.createdBy])];

      let chatName = data.name;
      if (!chatName && data.type === 'direct' && participants.length === 2) {
        const otherParticipant = participants.find(p => p.id !== data.createdBy);
        if (otherParticipant) {
          chatName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
        }
      }

      await ensureConversation({
        id: chatId,
        type: mapChatTypeToConversationType(data.type),
        name: chatName,
        createdBy: data.createdBy,
        participantIds: allParticipantIds,
        securityCompanyId: userCompanyId,
      });
      
      // Check if chat already exists (from virtual chat or previous creation)
      const existingChat = await prisma.message.findFirst({
        where: { conversationId: chatId },
        select: { conversationId: true },
      });

      // Only create initial message if chat doesn't exist
      let initialMessage;
      if (!existingChat) {
        initialMessage = await prisma.message.create({
          data: {
            senderId: data.createdBy,
            conversationId: chatId,
            content: data.name || 'Chat started',
            messageType: 'SYSTEM',
            isRead: false,
          },
        });
        await touchConversationLastMessage(chatId, initialMessage.createdAt);
      } else {
        // Chat exists, get the latest message for lastMessage
        initialMessage = await prisma.message.findFirst({
          where: { conversationId: chatId },
          orderBy: { createdAt: 'desc' },
        });
      }

      // Get all participants' user data (reuse from above if available, otherwise fetch)
      const allParticipants = participants.length > 0 
        ? participants
        : await prisma.user.findMany({
            where: {
              id: { in: [...data.participantIds, data.createdBy] },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          });

      // Build participants list
      const chatParticipants: ChatParticipant[] = allParticipants.map((user) => ({
        id: `part_${user.id}_${chatId}`,
        chatId,
        userId: user.id,
        role: user.id === data.createdBy ? 'admin' : 'member',
        joinedAt: new Date(),
        lastReadAt: undefined,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      }));

      const chat: Chat = {
        id: chatId,
        name: chatName,
        type: data.type,
        participants: chatParticipants,
        lastMessage: initialMessage ? {
          id: initialMessage.id,
          chatId,
          senderId: initialMessage.senderId,
          content: initialMessage.content,
          messageType: 'system',
          timestamp: initialMessage.createdAt,
          isRead: false,
          sender: {
            id: allParticipants.find(p => p.id === initialMessage.senderId)?.id || '',
            firstName: allParticipants.find(p => p.id === initialMessage.senderId)?.firstName || '',
            lastName: allParticipants.find(p => p.id === initialMessage.senderId)?.lastName || '',
            role: allParticipants.find(p => p.id === initialMessage.senderId)?.role || 'GUARD',
          },
        } : undefined,
        lastMessageAt: initialMessage?.createdAt,
        unreadCount: 0,
        createdAt: initialMessage?.createdAt || new Date(),
        updatedAt: initialMessage?.createdAt || new Date(),
      };

      // Ensure all participants are joined to the chat room
      allParticipantIds.forEach(participantUserId => {
        this.websocketService.joinUserToChatRoom(participantUserId, chatId);
        this.websocketService.broadcastToUser(participantUserId, 'new_chat', { chat });
      });

      logger.info(`New chat created: ${chatId} by user ${data.createdBy}`);

      return chat;
    } catch (error) {
      logger.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Search chats and messages
   */
  async searchChats(userId: string, query: string): Promise<{
    chats: Chat[];
    messages: ChatMessage[];
  }> {
    try {
      const userChats = await this.getUserChats(userId);
      
      // Filter chats by name or participant name
      const filteredChats = userChats.filter(chat => 
        chat.name?.toLowerCase().includes(query.toLowerCase()) ||
        chat.participants.some(p => 
          `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(query.toLowerCase())
        )
      );

      // Mock message search - in real app, search message content
      const messages: ChatMessage[] = [];

      return {
        chats: filteredChats,
        messages
      };
    } catch (error) {
      logger.error('Error searching chats:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string): Promise<Chat | null> {
    try {
      const userChats = await this.getUserChats(userId);
      return userChats.find(chat => chat.id === chatId) || null;
    } catch (error) {
      logger.error('Error getting chat by ID:', error);
      throw error;
    }
  }
}

export default ChatService;
