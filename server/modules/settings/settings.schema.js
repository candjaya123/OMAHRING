const { z } = require('zod');

const settingsSchema = z.object({
  store_name: z.string().optional(),
  store_logo_url: z.string().url().optional(),
  midtrans_is_production: z.boolean().optional().default(false),
  midtrans_server_key: z.string().optional(),
  midtrans_client_key: z.string().optional(),
  store_service_fee: z.number().int().nonnegative().optional().default(0),
});

module.exports = {
  settingsSchema,
};
