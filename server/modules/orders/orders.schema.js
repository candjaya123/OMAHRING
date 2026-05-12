const { z } = require('zod');

const addressSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().optional(),
  phone: z.string().min(10),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  userId: z.string(),
  cartId: z.string().uuid(),
  customerName: z.string().min(1),
  email: z.string().email(),
  addressInfo: addressSchema,
  shippingCost: z.number().int().nonnegative().default(0),
  paymentCategory: z.enum(['bank_transfer', 'minimarket', 'qris', 'ewallet', 'credit_card', 'manual']).default('qris'),
  totalAmount: z.number().int().positive(), // Validated on server anyway
});

module.exports = {
  createOrderSchema,
};
