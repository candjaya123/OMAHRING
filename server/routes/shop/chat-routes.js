const express = require('express');
const {
  startChatSession,
  sendMessage,
  getChatMessages,
  getAllSessions,
  replyMessage,
  closeSession,
  getUnreadCount,
} = require('../../controllers/shop/chat-controller');

const router = express.Router();

router.post('/start', startChatSession);
router.post('/message', sendMessage);
router.get('/messages/:sessionId', getChatMessages);
router.get('/sessions', getAllSessions);
router.post('/reply', replyMessage);
router.put('/session/:sessionId/close', closeSession);
router.get('/unread-count', getUnreadCount);

module.exports = router;
