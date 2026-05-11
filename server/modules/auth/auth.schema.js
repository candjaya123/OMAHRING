const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    userName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'member', 'admin', 'manager']).default('user'),
    nik: z.string().optional(),
    phone_number: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const upgradeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  upgradeSchema,
};
