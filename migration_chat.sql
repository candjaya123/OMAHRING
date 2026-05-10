-- Comprehensive Chat System Migration
-- This script ensures tables exist before applying enhancements

-- 1. Create Base Tables if they don't exist
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'active', -- active, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id),
    sender_id UUID REFERENCES users(id),
    sender_role TEXT NOT NULL, -- customer, admin, manager
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add New Columns for Enhancement
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- 3. Optional: Indexing for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_id ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- 4. RPC Function: Atomic increment of unread_count
-- Required for the sendMessage endpoint to correctly track unread messages
CREATE OR REPLACE FUNCTION increment_unread_count(session_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE chat_sessions
  SET unread_count = unread_count + 1
  WHERE id = session_id_param;
END;
$$ LANGUAGE plpgsql;
