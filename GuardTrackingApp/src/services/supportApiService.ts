import { supportApi, SupportTicketRecord, SupportTicketReply } from './api/supportApi';
import { chatApi } from './api/chatApi';

export type { SupportTicketRecord, SupportTicketReply };

class SupportApiService {
  async createTicket(data: {
    subject: string;
    message: string;
    category: string;
    audience?: 'COMPANY' | 'PLATFORM';
  }) {
    const response = await supportApi.createTicket(data);
    const body = response.data;
    if (!body?.success || !body.data) {
      throw new Error(body?.message || 'Failed to create support ticket');
    }
    return body.data;
  }

  async getMyTickets(page = 1, limit = 20) {
    const response = await supportApi.getMyTickets(page, limit);
    return response.data.data as {
      tickets: SupportTicketRecord[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  }

  async getInbox(page = 1, limit = 20, status?: string) {
    const response = await supportApi.getInbox(page, limit, status);
    return response.data.data as {
      tickets: SupportTicketRecord[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  }

  async getTicketById(ticketId: string) {
    const response = await supportApi.getTicketById(ticketId);
    return response.data.data as SupportTicketRecord;
  }

  async replyToTicket(ticketId: string, message: string) {
    const response = await supportApi.replyToTicket(ticketId, message);
    return response.data.data as SupportTicketReply;
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const response = await supportApi.updateTicketStatus(ticketId, status);
    return response.data.data as SupportTicketRecord;
  }

  async openTicketChat(ticketId: string) {
    const response = await supportApi.openTicketChat(ticketId);
    return response.data.data as { conversationId: string; ticket: SupportTicketRecord };
  }

  async openCompanySupportChat() {
    const response = await chatApi.openCompanySupportChat();
    if (!response.success) {
      throw new Error(response.message || 'Failed to open company support chat');
    }
    return response.data;
  }
}

export const supportApiService = new SupportApiService();
export default supportApiService;
