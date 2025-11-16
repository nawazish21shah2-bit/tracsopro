import { Request, Response } from 'express';
import { ChatService } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

const chatService = ChatService.getInstance();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    guardId?: string;
    clientId?: string;
  };
}

/**
 * Get all chats for the authenticated user
 */
export const getUserChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    const chats = await chatService.getUserChats(userId);

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    logger.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get messages for a specific chat
 */
export const getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }

    const messages = await chatService.getChatMessages(
      chatId,
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Send a message
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const message = await chatService.sendMessage({
      chatId,
      senderId: userId,
      content: content.trim(),
      messageType,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required',
      });
    }

    await chatService.markMessagesAsRead(chatId, userId, messageIds);

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Create a new chat
 */
export const createChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, name, participantIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    if (!type || !['direct', 'group', 'team'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid chat type is required (direct, group, team)',
      });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participant IDs array is required',
      });
    }

    // Add current user to participants if not already included
    const allParticipants = participantIds.includes(userId) 
      ? participantIds 
      : [...participantIds, userId];

    const chat = await chatService.createChat({
      type,
      name,
      participantIds: allParticipants,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    logger.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Search chats and messages
 */
export const searchChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q: query } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const results = await chatService.searchChats(userId, query.trim());

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error('Error searching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search chats',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get chat by ID
 */
export const getChatById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }

    const chat = await chatService.getChatById(chatId, userId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    logger.error('Error getting chat by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  getUserChats,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  createChat,
  searchChats,
  getChatById,
};
