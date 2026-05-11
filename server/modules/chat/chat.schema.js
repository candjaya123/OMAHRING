const { z } = require('zod');

const startSessionSchema = z.object({
  customer_id: z.string().uuid(),
});

const sendMessageSchema = z.object({
  session_id: z.string().uuid(),
  sender_id: z.string().uuid().nullable(),
  sender_role: z.enum(['customer', 'guest', 'admin', 'manager']),
  message_text: z.string().min(1),
});

const replyMessageSchema = z.object({
  session_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  message_text: z.string().min(1),
});

module.exports = {
  startSessionSchema,
  sendMessageSchema,
  replyMessageSchema,
};
