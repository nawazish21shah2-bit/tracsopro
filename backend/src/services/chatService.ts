import prisma from '../config/database.js';
import WebSocketService from './websocketService.js';
import { logger } from '../utils/logger.js';

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

      // Get all unique conversations where user has sent messages
      // Multi-tenant: Filter by company if not SUPER_ADMIN
      const whereClause: any = {
        senderId: userId,
      };

      // If user has a company (not SUPER_ADMIN), filter messages to only those from users in same company
      if (userCompanyId) {
        // Get all user IDs in the same company
        const [companyAdmins, companyGuards, companyClients] = await Promise.all([
          prisma.companyUser.findMany({
            where: { securityCompanyId: userCompanyId, isActive: true },
            select: { userId: true },
          }),
          prisma.companyGuard.findMany({
            where: { securityCompanyId: userCompanyId, isActive: true },
            select: { guard: { select: { userId: true } } },
          }),
          prisma.companyClient.findMany({
            where: { securityCompanyId: userCompanyId, isActive: true },
            select: { client: { select: { userId: true } } },
          }),
        ]);

        const companyUserIds = [
          ...companyAdmins.map(cu => cu.userId).filter(Boolean),
          ...companyGuards.map(cg => cg.guard?.userId).filter(Boolean),
          ...companyClients.map(cc => cc.client?.userId).filter(Boolean),
        ];

        // Ensure we have at least the current user
        const allUserIds = [...new Set([userId, ...companyUserIds])].filter(Boolean);
        if (allUserIds.length === 0) {
          // No valid user IDs, return empty array
          return [];
        }
        whereClause.senderId = { in: allUserIds };
      }

      const userMessages = await prisma.message.findMany({
        where: whereClause,
        select: {
          conversationId: true,
          senderId: true,
          createdAt: true,
        },
        distinct: ['conversationId'],
        orderBy: { createdAt: 'desc' },
      });

      // Get unique conversation IDs
      const conversationIds = [...new Set(userMessages.map(m => m.conversationId))];

      // For each conversation, get the latest message and participants
      // Multi-tenant: Filter to only include conversations where all participants are in same company
      const chats = await Promise.all(
        conversationIds.map(async (conversationId) => {
          // Get all unique participants (senders) in this conversation
          const participantsData = await prisma.message.findMany({
            where: { conversationId },
            select: {
              senderId: true,
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            distinct: ['senderId'],
          });

          // Multi-tenant: Validate all participants belong to same company (if not SUPER_ADMIN)
          if (userCompanyId) {
            const participantIds = participantsData.map(p => p.senderId);
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

            // Skip this conversation if not all participants are in the same company
            if (participantIds.some(id => !validParticipantIds.has(id))) {
              return null;
            }
          }

          // Get latest message in this conversation
          const lastMessage = await prisma.message.findFirst({
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
          });

          // Count unread messages for this user
          const unreadCount = await prisma.message.count({
            where: {
              conversationId,
              senderId: { not: userId },
              isRead: false,
            },
          });

          // Determine chat name (for direct chats, use other participant's name)
          let chatName: string | undefined;
          const otherParticipant = participantsData.find(p => p.senderId !== userId);
          if (otherParticipant?.sender) {
            chatName = `${otherParticipant.sender.firstName} ${otherParticipant.sender.lastName}`.trim();
          } else {
            chatName = 'Chat';
          }

          // Build participants list
          const participants: ChatParticipant[] = participantsData.map((p) => ({
            id: `part_${p.senderId}_${conversationId}`,
            chatId: conversationId,
            userId: p.senderId,
            role: p.senderId === userId ? 'admin' : 'member',
            joinedAt: new Date(), // Would need a join date in a full implementation
            lastReadAt: undefined,
            user: {
              id: p.sender.id,
              firstName: p.sender.firstName,
              lastName: p.sender.lastName,
              role: p.sender.role,
            },
          }));

          const chat: Chat = {
            id: conversationId,
            name: chatName,
            type: participants.length === 2 ? 'direct' : 'group',
            participants,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              chatId: conversationId,
              senderId: lastMessage.senderId,
              content: lastMessage.content,
              messageType: 'text', // Default to text, would need to add messageType to schema
              timestamp: lastMessage.createdAt,
              isRead: lastMessage.isRead,
              sender: {
                id: lastMessage.sender.id,
                firstName: lastMessage.sender.firstName,
                lastName: lastMessage.sender.lastName,
                role: lastMessage.sender.role,
              },
            } : undefined,
            lastMessageAt: lastMessage?.createdAt,
            unreadCount,
            createdAt: lastMessage?.createdAt || new Date(),
            updatedAt: lastMessage?.createdAt || new Date(),
          };

          return chat;
        })
      );

      // Filter out null chats (conversations with participants from different companies)
      let validChats = chats.filter((chat): chat is Chat => chat !== null) as Chat[];

      // For CLIENT users: Also include guards assigned to their sites (even if no chat exists yet)
      // For ADMIN users: Also include guards and clients in their company (even if no chat exists yet)
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            client: true,
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

      // Check if conversation exists (has messages)
      const conversationExists = await prisma.message.findFirst({
        where: { conversationId: chatId },
      });

      // Verify user has access to this conversation
      if (conversationExists) {
        // For existing conversations, check if user has sent a message
        const hasAccess = await prisma.message.findFirst({
          where: {
            conversationId: chatId,
            senderId: userId,
          },
        });

        if (!hasAccess) {
          throw new Error('Chat not found or access denied');
        }
      } else {
        // For new chats (no messages yet), validate access based on chatId format
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
          // Handle direct_<userId1>_<userId2> format
          const chatIdParts = chatId.split('_');
          if (chatIdParts.length >= 3) {
            const userId1 = chatIdParts[1];
            const userId2 = chatIdParts[2];
            const isParticipant = userId === userId1 || userId === userId2;
            
            if (!isParticipant) {
              throw new Error('Chat not found or access denied');
            }
          } else {
            throw new Error('Chat not found or access denied');
          }
        } else {
          // For other chatId formats, require existing conversation
          throw new Error('Chat not found or access denied');
        }
      }

      // Multi-tenant: Validate all participants in conversation belong to same company
      // Skip this check for new chats (no messages yet) - validation will happen when first message is sent
      if (conversationExists && userCompanyId) {
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
        messageType: 'text', // Default - would need messageType in schema
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
      // Multi-tenant: Validate sender can send to this chat
      const userCompanyId = data.securityCompanyId;
      if (userCompanyId) {
        // Get all participants in this conversation
        const conversationParticipants = await prisma.message.findMany({
          where: { conversationId: data.chatId },
          select: { senderId: true },
          distinct: ['senderId'],
        });

        const participantIds = [...new Set([...conversationParticipants.map(p => p.senderId), data.senderId])];
        
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

        // Reject if not all participants are in the same company
        if (participantIds.some(id => !validParticipantIds.has(id))) {
          throw new Error('Cannot send message: participants must belong to the same company');
        }
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          senderId: data.senderId,
          conversationId: data.chatId,
          content: data.content,
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
      const conversationParticipants = await prisma.message.findMany({
        where: { conversationId: data.chatId },
        select: { senderId: true },
        distinct: ['senderId'],
      });

      const participantIds = [...new Set([...conversationParticipants.map(p => p.senderId), data.senderId])];

      // Ensure all participants are joined to the chat room
      participantIds.forEach(participantId => {
        this.websocketService.joinUserToChatRoom(participantId, data.chatId);
      });

      // Broadcast message to chat participants via WebSocket
      this.websocketService.broadcastToRoom(`chat_${data.chatId}`, 'new_message', {
        message: chatMessage,
        chatId: data.chatId
      });

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

      logger.info(`Marked ${messageIds.length} messages as read in chat ${chatId} for user ${userId}`);

      // Get all participants and ensure they're in the room
      const conversationParticipants = await prisma.message.findMany({
        where: { conversationId: chatId },
        select: { senderId: true },
        distinct: ['senderId'],
      });

      const participantIds = [...new Set(conversationParticipants.map(p => p.senderId))];
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
      if (data.type === 'direct' && data.participantIds.length === 1) {
        const creator = await prisma.user.findUnique({
          where: { id: data.createdBy },
          select: { role: true },
        });
        
        const participant = await prisma.user.findUnique({
          where: { id: data.participantIds[0] },
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
      
      // Get user roles to create consistent chat ID
      const participants = await prisma.user.findMany({
        where: { id: { in: [data.createdBy, ...data.participantIds] } },
        select: { id: true, role: true, firstName: true, lastName: true },
      });

      const creator = participants.find(p => p.id === data.createdBy);
      const participant = data.participantIds.length === 1 
        ? participants.find(p => p.id === data.participantIds[0])
        : null;

      if (data.type === 'direct' && participant && creator) {
        // Create consistent ID based on roles (matches getUserChats pattern)
        if (creator.role === 'CLIENT' && participant.role === 'GUARD') {
          chatId = `client_${data.createdBy}_guard_${data.participantIds[0]}`;
        } else if (creator.role === 'GUARD' && participant.role === 'CLIENT') {
          chatId = `client_${data.participantIds[0]}_guard_${data.createdBy}`;
        } else if (creator.role === 'ADMIN' && participant.role === 'GUARD') {
          chatId = `admin_${data.createdBy}_guard_${data.participantIds[0]}`;
        } else if (creator.role === 'GUARD' && participant.role === 'ADMIN') {
          chatId = `admin_${data.participantIds[0]}_guard_${data.createdBy}`;
        } else if (creator.role === 'CLIENT' && participant.role === 'ADMIN') {
          chatId = `client_${data.createdBy}_admin_${data.participantIds[0]}`;
        } else if (creator.role === 'ADMIN' && participant.role === 'CLIENT') {
          chatId = `client_${data.participantIds[0]}_admin_${data.createdBy}`;
        } else {
          // Fallback to sorted IDs for other combinations
          const sortedIds = [data.createdBy, data.participantIds[0]].sort();
          chatId = `direct_${sortedIds[0]}_${sortedIds[1]}`;
        }
      } else {
        // For group/team chats, generate a unique ID
        chatId = `${data.type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      }
      
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
            isRead: false,
          },
        });
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

      // Determine chat name
      let chatName = data.name;
      if (!chatName && data.type === 'direct' && allParticipants.length === 2) {
        const otherParticipant = allParticipants.find(p => p.id !== data.createdBy);
        if (otherParticipant) {
          chatName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
        }
      }

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
          messageType: 'text',
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
      const allParticipantIds = [...data.participantIds, data.createdBy];
      allParticipantIds.forEach(userId => {
        this.websocketService.joinUserToChatRoom(userId, chatId);
        this.websocketService.broadcastToUser(userId, 'new_chat', { chat });
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
