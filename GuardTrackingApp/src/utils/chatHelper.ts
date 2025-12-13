/**
 * Chat Helper Utility
 * Centralized service for finding or creating chat rooms between users
 * Handles Client-Guard, Admin-Guard, and other chat flows
 */

import apiService from '../services/api';
import { RootState } from '../store';

export interface ChatNavigationParams {
  chatId: string;
  chatName: string;
  avatar?: string;
  context?: 'report' | 'site' | 'general';
  guardId?: string;
  clientId?: string;
  adminId?: string;
}

export interface ChatRoomSearchResult {
  chatId: string;
  chatName: string;
  exists: boolean;
}

/**
 * Find or create a chat room between a Client and Guard
 */
export async function findOrCreateClientGuardChat(
  clientId: string,
  guardId: string,
  guardName: string,
  context: 'report' | 'site' | 'general' = 'general',
  contextId?: string
): Promise<ChatNavigationParams> {
  try {
    // First, try to find existing chat
    const existingChat = await findExistingChat([clientId, guardId], 'direct');
    
    if (existingChat) {
      return {
        chatId: existingChat.chatId,
        chatName: existingChat.chatName || guardName,
        context,
        guardId,
        clientId,
      };
    }

    // No existing chat found, create a new one
    const createResponse = await apiService.createChat('direct', [clientId, guardId], guardName);
    
    if (createResponse.success && createResponse.data) {
      return {
        chatId: createResponse.data.id,
        chatName: createResponse.data.name || guardName,
        context,
        guardId,
        clientId,
      };
    }

    // Fallback to pattern-based chatId if creation fails
    return {
      chatId: `client_guard_${guardId}_${Date.now()}`,
      chatName: guardName,
      context,
      guardId,
      clientId,
    };
  } catch (error) {
    console.error('Error finding/creating client-guard chat:', error);
    // Fallback to pattern-based chatId
    return {
      chatId: `client_guard_${guardId}_${Date.now()}`,
      chatName: guardName,
      context,
      guardId,
      clientId,
    };
  }
}

/**
 * Find or create a chat room between an Admin and Guard
 */
export async function findOrCreateAdminGuardChat(
  adminId: string,
  guardId: string,
  guardName: string
): Promise<ChatNavigationParams> {
  try {
    // First, try to find existing chat
    const existingChat = await findExistingChat([adminId, guardId], 'direct');
    
    if (existingChat) {
      return {
        chatId: existingChat.chatId,
        chatName: existingChat.chatName || guardName,
        context: 'general',
        guardId,
        adminId,
      };
    }

    // No existing chat found, create a new one
    const createResponse = await apiService.createChat('direct', [adminId, guardId], guardName);
    
    if (createResponse.success && createResponse.data) {
      return {
        chatId: createResponse.data.id,
        chatName: createResponse.data.name || guardName,
        context: 'general',
        guardId,
        adminId,
      };
    }

    // Fallback to pattern-based chatId if creation fails
    return {
      chatId: `admin_guard_${guardId}_${Date.now()}`,
      chatName: guardName,
      context: 'general',
      guardId,
      adminId,
    };
  } catch (error) {
    console.error('Error finding/creating admin-guard chat:', error);
    // Fallback to pattern-based chatId
    return {
      chatId: `admin_guard_${guardId}_${Date.now()}`,
      chatName: guardName,
      context: 'general',
      guardId,
      adminId,
    };
  }
}

/**
 * Find existing chat room between participants
 */
async function findExistingChat(
  participantIds: string[],
  type: 'direct' | 'group' | 'team' = 'direct'
): Promise<ChatRoomSearchResult | null> {
  try {
    const response = await apiService.getChatRooms();
    
    if (!response.success || !response.data) {
      return null;
    }

    // Search for existing chat with these participants
    const existingChat = response.data.find((chat: any) => {
      if (chat.type !== type) return false;
      
      const chatParticipants = chat.participants || [];
      const participantUserIds = chatParticipants.map((p: any) => 
        p.userId || p.id || (p.user && p.user.id)
      ).filter(Boolean);

      // Check if all participants match
      if (participantUserIds.length !== participantIds.length) return false;
      
      const hasAllParticipants = participantIds.every(id => 
        participantUserIds.includes(id)
      );

      return hasAllParticipants;
    });

    if (existingChat) {
      // Get chat name from participants
      let chatName = existingChat.name;
      if (!chatName && type === 'direct' && existingChat.participants) {
        const otherParticipant = existingChat.participants.find(
          (p: any) => {
            const pId = p.userId || p.id || (p.user && p.user.id);
            return pId && !participantIds.includes(pId);
          }
        );
        
        if (otherParticipant?.user) {
          chatName = `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim();
        } else if (otherParticipant?.firstName) {
          chatName = `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim();
        }
      }

      return {
        chatId: existingChat.id,
        chatName: chatName || 'Chat',
        exists: true,
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding existing chat:', error);
    return null;
  }
}

/**
 * Find or create a chat room between a Client and Admin
 */
export async function findOrCreateClientAdminChat(
  clientId: string,
  adminId: string,
  adminName: string
): Promise<ChatNavigationParams> {
  try {
    // First, try to find existing chat
    const existingChat = await findExistingChat([clientId, adminId], 'direct');
    
    if (existingChat) {
      return {
        chatId: existingChat.chatId,
        chatName: existingChat.chatName || adminName,
        context: 'general',
        adminId,
        clientId,
      };
    }

    // No existing chat found, create a new one
    const createResponse = await apiService.createChat('direct', [clientId, adminId], adminName);
    
    if (createResponse.success && createResponse.data) {
      return {
        chatId: createResponse.data.id,
        chatName: createResponse.data.name || adminName,
        context: 'general',
        adminId,
        clientId,
      };
    }

    // Fallback to pattern-based chatId if creation fails
    return {
      chatId: `client_admin_${adminId}_${Date.now()}`,
      chatName: adminName,
      context: 'general',
      adminId,
      clientId,
    };
  } catch (error) {
    console.error('Error finding/creating client-admin chat:', error);
    // Fallback to pattern-based chatId
    return {
      chatId: `client_admin_${adminId}_${Date.now()}`,
      chatName: adminName,
      context: 'general',
      adminId,
      clientId,
    };
  }
}

/**
 * Get chat room by ID (for navigating to existing chat)
 */
export async function getChatRoomById(chatId: string): Promise<ChatNavigationParams | null> {
  try {
    const response = await apiService.getChatRooms();
    
    if (!response.success || !response.data) {
      return null;
    }

    const chat = response.data.find((c: any) => c.id === chatId);
    
    if (chat) {
      let chatName = chat.name;
      if (!chatName && chat.participants) {
        const otherParticipant = chat.participants.find(
          (p: any) => {
            const pId = p.userId || p.id || (p.user && p.user.id);
            return pId; // Get first other participant
          }
        );
        
        if (otherParticipant?.user) {
          chatName = `${otherParticipant.user.firstName || ''} ${otherParticipant.user.lastName || ''}`.trim();
        }
      }

      return {
        chatId: chat.id,
        chatName: chatName || 'Chat',
        context: 'general',
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting chat room by ID:', error);
    return null;
  }
}

