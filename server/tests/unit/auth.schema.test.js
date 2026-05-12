const { registerSchema, loginSchema } = require('../../modules/auth/auth.schema');
const { describe, it, expect } = require('@jest/globals');

describe('Auth Validation Schemas', () => {
  describe('Register Schema', () => {
    it('should validate a correct registration payload', () => {
      const validPayload = {
        body: {
          userName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
        }
      };
      
      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail if email is invalid', () => {
      const invalidPayload = {
        body: {
          userName: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        }
      };
      
      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Invalid email address');
    });
  });

  describe('Login Schema', () => {
    it('should validate a correct login payload', () => {
      const validPayload = {
        body: {
          email: 'john@example.com',
          password: 'password123',
        }
      };
      
      const result = loginSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });
});
