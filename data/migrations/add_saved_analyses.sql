-- Migration: Create saved_analyses table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_info JSONB NOT NULL,
  analysis_result JSONB NOT NULL,
  job_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_id ON saved_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_analyses_created_at ON saved_analyses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved analyses
CREATE POLICY "Users can view own saved analyses" ON saved_analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved analyses
CREATE POLICY "Users can insert own saved analyses" ON saved_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved analyses
CREATE POLICY "Users can delete own saved analyses" ON saved_analyses
  FOR DELETE USING (auth.uid() = user_id);
