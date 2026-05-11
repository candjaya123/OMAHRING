const chatRepository = require('./chat.repository');

class ChatService {
  async startSession(data) {
    const { customerId, sessionToken, context } = data;

    const existing = customerId 
      ? await chatRepository.findActiveSessionByCustomerId(customerId)
      : await chatRepository.findActiveSessionByToken(sessionToken);

    if (existing) return existing;

    return await chatRepository.createSession({
      customerId,
      sessionToken,
      contextType: context?.type || 'general',
      contextId: context?.id,
      contextTitle: context?.title,
      contextUrl: context?.url
    });
  }

  async sendMessage(messageData) {
    const message = await chatRepository.insertMessage(messageData);

    // Business Logic: Update session metadata when message sent
    const updateData = {
      last_message: messageData.message_text,
      last_message_at: new Date().toISOString()
    };

    if (messageData.sender_role === 'customer') {
      await chatRepository.incrementUnreadCount(messageData.session_id);
    } else if (['admin', 'manager'].includes(messageData.sender_role)) {
      updateData.unread_count = 0; // Admin replied, reset unread
    }

    await chatRepository.updateSessionMetadata(messageData.session_id, updateData);

    return message;
  }

  async getChatHistory(sessionId) {
    return await chatRepository.getMessagesBySessionId(sessionId);
  }

  async getAllSessions() {
    return await chatRepository.getAllSessions();
  }

  async closeSession(sessionId) {
    return await chatRepository.updateSessionMetadata(sessionId, { status: 'closed' });
  }

  async getTotalUnreadCount() {
    const sessions = await chatRepository.getActiveSessionsUnreadCount();
    return sessions.reduce((sum, s) => sum + (s.unread_count || 0), 0);
  }
}

module.exports = new ChatService();
