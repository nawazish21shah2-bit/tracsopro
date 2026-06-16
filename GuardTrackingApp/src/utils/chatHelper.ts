/**
 * Chat Helper Utility
 * Stable client↔guard conversation IDs (must match backend chatService.createChat)
 */

import apiService from '../services/api';
import { pickProfilePictureUrl } from './profilePictureUtils';

export interface ChatNavigationParams {
  chatId: string;
  chatName: string;
  avatar?: string;
  context?: 'report' | 'site' | 'general' | 'support';
  /** Guard entity id (for ClientGuardDetails) */
  guardId?: string;
  /** Guard user id */
  guardUserId?: string;
  clientId?: string;
  clientUserId?: string;
  adminId?: string;
}

/** Platform support thread id (one per admin user) */
export function buildSupportChatId(adminUserId: string): string {
  return `support_admin_${adminUserId}`;
}

export function isSupportChatId(chatId: string): boolean {
  return chatId.startsWith('support_admin_');
}

export function getAdminSupportChatParams(adminUserId: string): ChatNavigationParams {
  return {
    chatId: buildSupportChatId(adminUserId),
    chatName: 'Platform Support',
    context: 'support',
  };
}

/** Same ID format as backend: client_{clientUserId}_guard_{guardUserId} */
export function buildClientGuardChatId(clientUserId: string, guardUserId: string): string {
  return `client_${clientUserId}_guard_${guardUserId}`;
}

export function getClientGuardChatParams(
  clientUserId: string,
  guardUserId: string,
  guardName: string,
  avatar?: string,
  context: 'report' | 'site' | 'general' = 'general',
): ChatNavigationParams {
  return {
    chatId: buildClientGuardChatId(clientUserId, guardUserId),
    chatName: guardName,
    avatar,
    context,
    guardUserId,
    clientUserId: clientUserId,
  };
}

/**
 * Open existing client↔guard thread instantly (no room scan / no duplicate chats).
 * @param guardUserId — guard's USER id (not guard entity id)
 */
export async function findOrCreateClientGuardChat(
  clientUserId: string,
  guardUserId: string,
  guardName: string,
  context: 'report' | 'site' | 'general' = 'general',
  avatar?: string,
): Promise<ChatNavigationParams> {
  return getClientGuardChatParams(clientUserId, guardUserId, guardName, avatar, context);
}

export function buildAdminGuardChatId(adminUserId: string, guardUserId: string): string {
  return `admin_${adminUserId}_guard_${guardUserId}`;
}

export async function findOrCreateAdminGuardChat(
  adminId: string,
  guardUserId: string,
  guardName: string,
): Promise<ChatNavigationParams> {
  return {
    chatId: buildAdminGuardChatId(adminId, guardUserId),
    chatName: guardName,
    context: 'general',
    guardId: guardUserId,
    adminId,
  };
}

export async function findOrCreateClientAdminChat(
  clientId: string,
  adminId: string,
  adminName: string,
): Promise<ChatNavigationParams> {
  return {
    chatId: `client_${clientId}_admin_${adminId}`,
    chatName: adminName,
    context: 'general',
    adminId,
    clientId,
  };
}

export function parseDirectChatParticipants(
  chatId: string,
  currentUserId: string,
): {
  otherUserId?: string;
  clientUserId?: string;
  guardUserId?: string;
  adminUserId?: string;
} {
  const parts = chatId.split('_');
  if (parts.length >= 4 && (parts[2] === 'guard' || parts[2] === 'admin')) {
    const userId1 = parts[1];
    const role2 = parts[2];
    const userId2 = parts[3];
    const otherUserId = userId1 === currentUserId ? userId2 : userId1;

    if (parts[0] === 'client' && role2 === 'guard') {
      return { otherUserId, clientUserId: userId1, guardUserId: userId2 };
    }
    if (parts[0] === 'admin' && role2 === 'guard') {
      return { otherUserId, adminUserId: userId1, guardUserId: userId2 };
    }
    if (parts[0] === 'client' && role2 === 'admin') {
      return { otherUserId, clientUserId: userId1, adminUserId: userId2 };
    }
  }

  if (chatId.startsWith('direct_') && parts.length >= 3) {
    const userId1 = parts[1];
    const userId2 = parts[2];
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(userId1) || !uuidRe.test(userId2)) {
      return {};
    }
    return { otherUserId: userId1 === currentUserId ? userId2 : userId1 };
  }

  return {};
}

/** Resolve guard entity id from user id using client guards list. */
export async function resolveGuardEntityId(guardUserId: string): Promise<string | null> {
  try {
    const response = await apiService.getClientGuards(1, 100);
    if (!response.success || !Array.isArray(response.data)) {
      return null;
    }
    const match = response.data.find(
      (g: any) => g.userId === guardUserId || g.user?.id === guardUserId,
    );
    return match?.id || match?.guardId || null;
  } catch {
    return null;
  }
}

export async function resolveChatParticipantProfile(
  chatId: string,
  currentUserId: string,
): Promise<{
  avatar?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
} | null> {
  try {
    const response = await apiService.getChatRooms();

    if (!response.success || !Array.isArray(response.data)) {
      return null;
    }

    const chat = response.data.find((c: any) => c.id === chatId);
    if (!chat) {
      return null;
    }

    const otherParticipant = chat.participants?.find(
      (p: any) => (p.userId || p.user?.id) !== currentUserId,
    );

    if (otherParticipant?.user) {
      const participantUser = otherParticipant.user;
      const avatar =
        pickProfilePictureUrl(participantUser) ||
        pickProfilePictureUrl(otherParticipant) ||
        pickProfilePictureUrl({ avatar: chat.avatar });

      return {
        avatar,
        firstName: participantUser.firstName,
        lastName: participantUser.lastName,
        displayName:
          `${participantUser.firstName || ''} ${participantUser.lastName || ''}`.trim() ||
          chat.name ||
          undefined,
      };
    }

    const fallbackAvatar = pickProfilePictureUrl({ avatar: chat.avatar });
    if (fallbackAvatar) {
      return { avatar: fallbackAvatar, displayName: chat.name };
    }

    return null;
  } catch (error) {
    console.error('Error resolving chat participant profile:', error);
    return null;
  }
}

export async function getChatRoomById(chatId: string): Promise<ChatNavigationParams | null> {
  try {
    const response = await apiService.getChatRooms();

    if (!response.success || !response.data) {
      return null;
    }

    const chat = response.data.find((c: any) => c.id === chatId);

    if (chat) {
      let chatName = chat.name;
      let avatar: string | undefined;

      if (chat.participants) {
        const otherParticipant = chat.participants.find((p: any) => {
          const pId = p.userId || p.id || (p.user && p.user.id);
          return pId;
        });

        if (otherParticipant?.user) {
          chatName =
            `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim() ||
            chatName;
          avatar =
            pickProfilePictureUrl(otherParticipant.user) ||
            pickProfilePictureUrl({ avatar: chat.avatar });
        }
      }

      return {
        chatId: chat.id,
        chatName: chatName || 'Chat',
        avatar,
        context: 'general',
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting chat room by ID:', error);
    return null;
  }
}
