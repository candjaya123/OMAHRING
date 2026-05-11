const { z } = require('zod');

const articleSchema = z.object({
  title: z.string().min(5),
  content_body: z.string().min(10),
  excerpt: z.string().optional(),
  type: z.enum(['education', 'champion_bird', 'news', 'promo']).default('education'),
  subcategory: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  is_member_only: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  slug: z.string().optional(),
});

module.exports = {
  articleSchema,
};
