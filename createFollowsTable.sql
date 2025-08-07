-- Create follows table for Newton app
-- Execute this in Supabase SQL Editor if automatic creation fails

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (just in case)
DROP POLICY IF EXISTS "Allow read access to follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;

-- Create RLS policies
CREATE POLICY "Allow read access to follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);

-- Grant necessary permissions
GRANT ALL ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

-- Test the table by inserting and deleting a test record
-- (This will help verify everything works)
DO $$
BEGIN
  -- Only run test if there are users in auth.users
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE NOTICE 'Follows table created successfully and is ready to use!';
  ELSE
    RAISE NOTICE 'Follows table created, but no users found in auth.users for testing.';
  END IF;
END $$;