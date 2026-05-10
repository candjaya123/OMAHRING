-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nik TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS performance JSONB DEFAULT '{"totalOrders": 0, "totalSpend": 0}'::jsonb;

-- Ensure role column exists and defaults to user (it already exists, but just in case)
-- ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
