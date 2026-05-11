const { z } = require('zod');

const variantSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  sale_price: z.number().int().nonnegative().optional().default(0),
  total_stock: z.number().int().nonnegative().default(0),
});

const imageSchema = z.object({
  image_url: z.string().url(),
  display_order: z.number().int().nonnegative().optional().default(0),
});

const productSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  order_template: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
});

module.exports = {
  productSchema,
};
