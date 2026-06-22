import apiService from '../api';

export const chatApi = {
  getChatRooms: () => apiService.getChatRooms(),
  getChatMessages: (chatId: string, page?: number, limit?: number) =>
    apiService.getChatMessages(chatId, page, limit),
  sendChatMessage: (
    chatId: string,
    content: string,
    messageType?: Parameters<typeof apiService.sendChatMessage>[2],
  ) => apiService.sendChatMessage(chatId, content, messageType),
  createChat: (
    type: Parameters<typeof apiService.createChat>[0],
    participantIds: string[],
    name?: string,
  ) => apiService.createChat(type, participantIds, name),
  getMessages: (conversationId?: string) => apiService.getMessages(conversationId),
  sendMessage: (messageData: Parameters<typeof apiService.sendMessage>[0]) =>
    apiService.sendMessage(messageData),
  getSupportChats: () => apiService.getSupportChats(),
  openSupportChat: () => apiService.openSupportChat(),
  openCompanySupportChat: () => apiService.openCompanySupportChat(),
};
