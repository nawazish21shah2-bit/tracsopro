import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import supportService from '../services/supportService.js';
import { SupportStatus } from '@prisma/client';

export async function createTicket(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { subject, message, category, audience } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const ticket = await supportService.createSupportTicket(userId, {
      subject,
      message,
      category: category || 'general',
      audience,
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    logger.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create support ticket',
    });
  }
}

export async function getMyTickets(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await supportService.getMySupportTickets(userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get my tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to get support tickets' });
  }
}

export async function getInbox(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as SupportStatus | undefined;
    const result = await supportService.getSupportInbox(
      userId,
      req.securityCompanyId,
      page,
      limit,
      status,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get support inbox error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get support inbox',
    });
  }
}

export async function getTicketById(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const ticket = await supportService.getSupportTicketById(id, userId, req.securityCompanyId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    res.json({ success: true, data: ticket });
  } catch (error) {
    logger.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to get support ticket' });
  }
}

export async function replyToTicket(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { message } = req.body;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    const reply = await supportService.addSupportTicketReply(
      id,
      userId,
      message,
      req.securityCompanyId,
    );
    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    logger.error('Reply to ticket error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send reply',
    });
  }
}

export async function updateTicketStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const ticket = await supportService.updateSupportTicketStatus(
      id,
      userId,
      status as SupportStatus,
      req.securityCompanyId,
    );
    res.json({ success: true, data: ticket });
  } catch (error) {
    logger.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update ticket',
    });
  }
}

export async function openTicketChat(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await supportService.linkTicketToChat(id, userId, req.securityCompanyId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Open ticket chat error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to open support chat',
    });
  }
}

export default {
  createTicket,
  getMyTickets,
  getInbox,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  openTicketChat,
};
