import apiService from './api';

export interface SupportTicketRecord {
  id: string;
  userId?: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  audience?: string;
  conversationId?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
  };
  replies?: SupportTicketReply[];
}

export interface SupportTicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

class SupportApiService {
  async createTicket(data: {
    subject: string;
    message: string;
    category: string;
    audience?: 'COMPANY' | 'PLATFORM';
  }) {
    const response = await apiService.post<{ success: boolean; data: SupportTicketRecord; message?: string }>(
      '/support/tickets',
      data,
    );
    const body = response.data;
    if (!body?.success || !body.data) {
      throw new Error(body?.message || 'Failed to create support ticket');
    }
    return body.data;
  }

  async getMyTickets(page = 1, limit = 20) {
    const response = await apiService.get(`/support/tickets/mine?page=${page}&limit=${limit}`);
    return response.data.data as {
      tickets: SupportTicketRecord[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  }

  async getInbox(page = 1, limit = 20, status?: string) {
    const qs = status ? `&status=${status}` : '';
    const response = await apiService.get(`/support/tickets/inbox?page=${page}&limit=${limit}${qs}`);
    return response.data.data as {
      tickets: SupportTicketRecord[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  }

  async getTicketById(ticketId: string) {
    const response = await apiService.get(`/support/tickets/${ticketId}`);
    return response.data.data as SupportTicketRecord;
  }

  async replyToTicket(ticketId: string, message: string) {
    const response = await apiService.post(`/support/tickets/${ticketId}/replies`, { message });
    return response.data.data as SupportTicketReply;
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const response = await apiService.patch(`/support/tickets/${ticketId}`, { status });
    return response.data.data as SupportTicketRecord;
  }

  async openTicketChat(ticketId: string) {
    const response = await apiService.post(`/support/tickets/${ticketId}/chat`);
    return response.data.data as { conversationId: string; ticket: SupportTicketRecord };
  }

  async openCompanySupportChat() {
    const response = await apiService.post('/chat/support/company');
    return response.data.data;
  }
}

export const supportApiService = new SupportApiService();
export default supportApiService;
