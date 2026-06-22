import apiService from '../api';

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

export const supportApi = {
  createTicket: (data: {
    subject: string;
    message: string;
    category: string;
    audience?: 'COMPANY' | 'PLATFORM';
  }) =>
    apiService.post<{ success: boolean; data: SupportTicketRecord; message?: string }>(
      '/support/tickets',
      data,
    ),
  getMyTickets: (page = 1, limit = 20) =>
    apiService.get(`/support/tickets/mine?page=${page}&limit=${limit}`),
  getInbox: (page = 1, limit = 20, status?: string) => {
    const qs = status ? `&status=${status}` : '';
    return apiService.get(`/support/tickets/inbox?page=${page}&limit=${limit}${qs}`);
  },
  getTicketById: (ticketId: string) => apiService.get(`/support/tickets/${ticketId}`),
  replyToTicket: (ticketId: string, message: string) =>
    apiService.post(`/support/tickets/${ticketId}/replies`, { message }),
  updateTicketStatus: (ticketId: string, status: string) =>
    apiService.patch(`/support/tickets/${ticketId}`, { status }),
  openTicketChat: (ticketId: string) =>
    apiService.post(`/support/tickets/${ticketId}/chat`),
};
