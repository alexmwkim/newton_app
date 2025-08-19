-- Setup follows table for Newton App
-- Follow system for user relationships

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate follows and self-follows
  CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Add foreign key relationships to profiles table for Supabase schema cache
-- This helps Supabase understand the relationship between follows and profiles
ALTER TABLE public.follows 
ADD CONSTRAINT fk_follows_follower_profile 
FOREIGN KEY (follower_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.follows 
ADD CONSTRAINT fk_follows_following_profile 
FOREIGN KEY (following_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;

-- RLS Policies
-- 1. Allow everyone to read follows (for public follow counts and lists)
CREATE POLICY "Allow read access to follows" ON public.follows
  FOR SELECT USING (true);

-- 2. Users can only create follows where they are the follower
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- 3. Users can only delete their own follows
CREATE POLICY "Users can unfollow others" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_follows_updated_at 
  BEFORE UPDATE ON public.follows 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Test data (optional - uncomment if you want sample data)
/*
-- Insert some test follows (replace UUIDs with actual user IDs from your auth.users table)
INSERT INTO public.follows (follower_id, following_id) VALUES
  ('user1-uuid-here', 'user2-uuid-here'),
  ('user2-uuid-here', 'user1-uuid-here'),
  ('user1-uuid-here', 'user3-uuid-here');
*/

-- Verify table structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'follows'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'follows';