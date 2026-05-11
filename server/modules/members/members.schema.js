const { z } = require('zod');

const createUserSchema = z.object({
  user_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'member', 'admin', 'manager']),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'member', 'admin', 'manager']),
});

module.exports = {
  createUserSchema,
  updateUserRoleSchema,
};
