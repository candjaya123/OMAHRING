const { z } = require('zod');

const contentUpsertSchema = z.object({
  content_type: z.enum(['text', 'image', 'html', 'json']).optional(),
  content_value: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

const bulkUpsertSchema = z.object({
  entries: z.array(z.object({
    section_key: z.string(),
    content_type: z.enum(['text', 'image', 'html', 'json']),
    content_value: z.string().nullable(),
    metadata: z.record(z.any()).optional(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
  }))
});

module.exports = {
  contentUpsertSchema,
  bulkUpsertSchema
};
