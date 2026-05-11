const { z } = require('zod');

const competitionSchema = z.object({
  event_name: z.string().min(1),
  event_date: z.string().optional(),
  location: z.string().optional(),
  rank: z.number().int().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

const registerBirdSchema = z.object({
  member_id: z.string().uuid(),
  name: z.string().min(1),
  species: z.string().min(1),
  whatsapp_contact: z.string().optional(),
  competitions: z.array(competitionSchema).optional(),
});

module.exports = {
  registerBirdSchema,
};
