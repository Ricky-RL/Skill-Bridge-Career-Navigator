-- Mentorship Chat Messages Table
-- Run this in Supabase SQL Editor after mentorship_tables.sql

-- 4. Mentorship Messages Table
CREATE TABLE IF NOT EXISTS mentorship_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES mentorship_connections(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE mentorship_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentorship_messages
-- Users can view messages in their connections
CREATE POLICY "Users can view messages in their connections" ON mentorship_messages
    FOR SELECT USING (
        connection_id IN (
            SELECT id FROM mentorship_connections
            WHERE mentee_id = auth.uid() OR
            mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
        )
    );

-- Users can send messages in their connections
CREATE POLICY "Users can send messages in their connections" ON mentorship_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        connection_id IN (
            SELECT id FROM mentorship_connections
            WHERE mentee_id = auth.uid() OR
            mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
        )
    );

-- Users can update (mark as read) messages sent to them
CREATE POLICY "Users can mark messages as read" ON mentorship_messages
    FOR UPDATE USING (
        connection_id IN (
            SELECT id FROM mentorship_connections
            WHERE mentee_id = auth.uid() OR
            mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
        )
    );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentorship_messages_connection_id ON mentorship_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_messages_sender_id ON mentorship_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_messages_created_at ON mentorship_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_mentorship_messages_is_read ON mentorship_messages(is_read);
