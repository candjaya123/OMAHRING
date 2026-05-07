const express = require('express');
const {
  startChatSession,
  sendMessage,
  getChatMessages,
  getAllSessions,
} = require('../../controllers/shop/chat-controller');

const router = express.Router();

router.post('/start', startChatSession);
router.post('/message', sendMessage);
router.get('/messages/:sessionId', getChatMessages);
router.get('/sessions', getAllSessions);

module.exports = router;
