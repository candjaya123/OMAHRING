const chatService = require('./chat.service');

class ChatController {
  async startSession(req, res, next) {
    try {
      const session = await chatService.startSession(req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const message = await chatService.sendMessage(req.body);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await chatService.getChatHistory(req.params.sessionId);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async getAllSessions(req, res, next) {
    try {
      const sessions = await chatService.getAllSessions();
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async replyMessage(req, res, next) {
    try {
      const messageData = {
        ...req.body,
        sender_role: 'admin'
      };
      const message = await chatService.sendMessage(messageData);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  async closeSession(req, res, next) {
    try {
      const session = await chatService.closeSession(req.params.sessionId);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const totalUnread = await chatService.getTotalUnreadCount();
      res.status(200).json({ success: true, totalUnread });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
