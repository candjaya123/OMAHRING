const { z } = require('zod');

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  variantName: z.string().min(1),
});

const addToCartSchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  variantName: z.string().min(1),
}).refine(data => data.userId || data.sessionId, {
  message: "Either userId or sessionId must be provided",
  path: ["userId"]
});

const updateCartQtySchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  productId: z.string().uuid(),
  variantName: z.string().min(1),
  quantity: z.number().int().positive(),
}).refine(data => data.userId || data.sessionId, {
  message: "Either userId or sessionId must be provided",
  path: ["userId"]
});

const mergeCartSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().min(1),
  action: z.enum(['merge', 'replace']).optional().default('merge'),
});

module.exports = {
  addToCartSchema,
  updateCartQtySchema,
  mergeCartSchema,
};
