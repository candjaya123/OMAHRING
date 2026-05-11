const { z } = require('zod');

const promoSchema = z.object({
  title: z.string().min(3),
  promo_code: z.string().min(3).toUpperCase(),
  discount_type: z.enum(['fixed', 'percentage']),
  discount_value: z.number().positive(),
  min_order: z.number().int().nonnegative().optional().default(0),
  max_discount: z.number().int().nonnegative().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_active: z.boolean().optional().default(true),
  usage_limit: z.number().int().positive().optional(),
});

module.exports = {
  promoSchema,
};
