const express = require('express');
const chatController = require('./chat.controller');
const validate = require('../../middleware/validate.middleware');
const { startSessionSchema, sendMessageSchema, replyMessageSchema } = require('./chat.schema');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

const router = express.Router();

// Customer/Guest routes
router.post('/start', validate(startSessionSchema), chatController.startSession);
router.post('/send', validate(sendMessageSchema), chatController.sendMessage);
router.get('/messages/:sessionId', chatController.getMessages);

// Admin routes
router.get('/admin/sessions', authenticate, authorizeRoles('admin', 'manager'), chatController.getAllSessions);
router.post('/admin/reply', authenticate, authorizeRoles('admin', 'manager'), validate(replyMessageSchema), chatController.replyMessage);
router.put('/admin/close/:sessionId', authenticate, authorizeRoles('admin', 'manager'), chatController.closeSession);
router.get('/admin/unread-count', authenticate, authorizeRoles('admin', 'manager'), chatController.getUnreadCount);

module.exports = router;
