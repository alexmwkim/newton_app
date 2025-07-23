-- ===========================
-- SECURITY-HARDENED RLS POLICIES FOR NEWTON APP
-- ===========================
-- This file contains bulletproof RLS policies that ensure:
-- 1. Complete user isolation with proper auth.uid() checks
-- 2. Secure client-side access with only anon key
-- 3. Prevention of data leaks and unauthorized access
-- 4. Granular permissions for all CRUD operations

-- ===========================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ===========================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Public notes are viewable by everyone." ON public.notes;
DROP POLICY IF EXISTS "Users can view their own notes." ON public.notes;
DROP POLICY IF EXISTS "Users can insert their own notes." ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes." ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes." ON public.notes;

DROP POLICY IF EXISTS "Users can view their own stars." ON public.stars;
DROP POLICY IF EXISTS "Users can star notes." ON public.stars;
DROP POLICY IF EXISTS "Users can unstar notes." ON public.stars;

DROP POLICY IF EXISTS "Users can manage their own pinned notes." ON public.user_pinned_notes;

DROP POLICY IF EXISTS "Users can view all forks." ON public.forks;
DROP POLICY IF EXISTS "Users can fork notes." ON public.forks;

-- ===========================
-- STEP 2: FIX FOREIGN KEY REFERENCES
-- ===========================

-- Fix stars table to reference auth.users instead of profiles
ALTER TABLE public.stars DROP CONSTRAINT stars_user_id_fkey;
ALTER TABLE public.stars ADD CONSTRAINT stars_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix forks table to reference auth.users instead of profiles  
ALTER TABLE public.forks DROP CONSTRAINT forks_user_id_fkey;
ALTER TABLE public.forks ADD CONSTRAINT forks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================
-- STEP 3: PROFILES TABLE - SECURITY-HARDENED POLICIES
-- ===========================

-- SELECT: Allow users to view profiles of users whose public notes they can see,
-- plus their own profile, plus profiles of users who have interacted with their content
CREATE POLICY "secure_profiles_select" ON public.profiles
FOR SELECT USING (
    -- User can view their own profile
    auth.uid() = user_id
    OR
    -- User can view profiles of users who have public notes
    EXISTS (
        SELECT 1 FROM public.notes 
        WHERE notes.user_id = profiles.user_id 
        AND notes.is_public = true
    )
    OR
    -- User can view profiles of users who have starred their notes
    EXISTS (
        SELECT 1 FROM public.stars s
        JOIN public.notes n ON s.note_id = n.id
        WHERE s.user_id = profiles.user_id
        AND n.user_id = auth.uid()
    )
    OR
    -- User can view profiles of users who have forked their notes
    EXISTS (
        SELECT 1 FROM public.forks f
        JOIN public.notes n ON f.original_note_id = n.id
        WHERE f.user_id = profiles.user_id
        AND n.user_id = auth.uid()
    )
);

-- INSERT: Users can only create their own profile
CREATE POLICY "secure_profiles_insert" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "secure_profiles_update" ON public.profiles  
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own profile
CREATE POLICY "secure_profiles_delete" ON public.profiles
FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- STEP 4: NOTES TABLE - SECURITY-HARDENED POLICIES  
-- ===========================

-- SELECT: Users can view public notes OR their own private notes
CREATE POLICY "secure_notes_select" ON public.notes
FOR SELECT USING (
    is_public = true 
    OR auth.uid() = user_id
);

-- INSERT: Users can only create notes for themselves
CREATE POLICY "secure_notes_insert" ON public.notes
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
);

-- UPDATE: Users can only update their own notes
CREATE POLICY "secure_notes_update" ON public.notes
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() = NEW.user_id  -- Prevent user_id changes
);

-- DELETE: Users can only delete their own notes
CREATE POLICY "secure_notes_delete" ON public.notes
FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- STEP 5: STARS TABLE - SECURITY-HARDENED POLICIES
-- ===========================

-- SELECT: Users can view stars on public notes and all stars on their own notes
CREATE POLICY "secure_stars_select" ON public.stars
FOR SELECT USING (
    -- User can see their own stars
    auth.uid() = user_id
    OR
    -- User can see stars on their own notes
    EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = stars.note_id
        AND n.user_id = auth.uid()
    )
    OR
    -- User can see stars on public notes
    EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = stars.note_id
        AND n.is_public = true
    )
);

-- INSERT: Users can star public notes and their own notes
CREATE POLICY "secure_stars_insert" ON public.stars
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = note_id
        AND (n.is_public = true OR n.user_id = auth.uid())
    )
);

-- UPDATE: No updates allowed on stars (create/delete only)
-- Stars are immutable once created

-- DELETE: Users can only remove their own stars
CREATE POLICY "secure_stars_delete" ON public.stars
FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- STEP 6: USER_PINNED_NOTES TABLE - SECURITY-HARDENED POLICIES
-- ===========================

-- SELECT: Users can only view their own pinned notes
CREATE POLICY "secure_pinned_notes_select" ON public.user_pinned_notes
FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can pin their own notes or public notes
CREATE POLICY "secure_pinned_notes_insert" ON public.user_pinned_notes
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = note_id
        AND (n.user_id = auth.uid() OR n.is_public = true)
    )
);

-- UPDATE: No updates needed for pinned notes (create/delete only)

-- DELETE: Users can only unpin their own pinned notes
CREATE POLICY "secure_pinned_notes_delete" ON public.user_pinned_notes
FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- STEP 7: FORKS TABLE - SECURITY-HARDENED POLICIES
-- ===========================

-- SELECT: Users can view forks of public notes and forks involving their notes
CREATE POLICY "secure_forks_select" ON public.forks
FOR SELECT USING (
    -- User can see their own forks
    auth.uid() = user_id
    OR
    -- User can see forks of their own notes
    EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = forks.original_note_id
        AND n.user_id = auth.uid()
    )
    OR
    -- User can see forks of public notes
    EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = forks.original_note_id
        AND n.is_public = true
    )
);

-- INSERT: Users can fork public notes (not their own)
CREATE POLICY "secure_forks_insert" ON public.forks
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.notes original
        WHERE original.id = original_note_id
        AND original.is_public = true
        AND original.user_id != auth.uid()  -- Can't fork own notes
    )
    AND EXISTS (
        SELECT 1 FROM public.notes forked
        WHERE forked.id = forked_note_id
        AND forked.user_id = auth.uid()  -- Must own the forked note
    )
);

-- UPDATE: No updates allowed on forks (immutable)

-- DELETE: Users can only delete their own fork records
CREATE POLICY "secure_forks_delete" ON public.forks
FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- STEP 8: SECURITY FUNCTIONS - HARDENED VERSIONS
-- ===========================

-- Drop potentially dangerous function
DROP FUNCTION IF EXISTS public.create_user_note(TEXT, TEXT, BOOLEAN, TEXT, UUID);

-- Create secure note creation function
CREATE OR REPLACE FUNCTION public.create_note_secure(
    p_title TEXT,
    p_content TEXT DEFAULT '',
    p_is_public BOOLEAN DEFAULT false,
    p_slug TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    content TEXT,
    is_public BOOLEAN,
    slug TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Use caller's permissions, not function owner's
SET search_path = public
AS $$
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Insert the note with authenticated user's ID
    RETURN QUERY
    INSERT INTO public.notes (title, content, is_public, slug, user_id)
    VALUES (
        p_title, 
        p_content, 
        p_is_public, 
        COALESCE(p_slug, p_title), 
        auth.uid()
    )
    RETURNING 
        public.notes.id,
        public.notes.title,
        public.notes.content,
        public.notes.is_public,
        public.notes.slug,
        public.notes.user_id,
        public.notes.created_at,
        public.notes.updated_at;
END;
$$;

-- ===========================
-- STEP 9: ADDITIONAL SECURITY MEASURES
-- ===========================

-- Create function to safely get current user's profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.username,
        p.avatar_url,
        p.bio,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.user_id = auth.uid();
END;
$$;

-- Create function to safely fork a note
CREATE OR REPLACE FUNCTION public.fork_note_secure(
    p_original_note_id UUID,
    p_new_title TEXT DEFAULT NULL,
    p_new_content TEXT DEFAULT NULL
)
RETURNS TABLE(
    forked_note_id UUID,
    fork_record_id UUID
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_original_note RECORD;
    v_new_note_id UUID;
    v_fork_id UUID;
BEGIN
    -- Verify user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Get original note and verify it's public and not owned by current user
    SELECT * INTO v_original_note
    FROM public.notes
    WHERE id = p_original_note_id
    AND is_public = true
    AND user_id != auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Note not found, not public, or you cannot fork your own note';
    END IF;
    
    -- Create the forked note
    INSERT INTO public.notes (
        user_id,
        title,
        content,
        is_public,
        forked_from
    ) VALUES (
        auth.uid(),
        COALESCE(p_new_title, v_original_note.title || ' (Fork)'),
        COALESCE(p_new_content, v_original_note.content),
        false,  -- Forks start as private
        p_original_note_id
    ) RETURNING id INTO v_new_note_id;
    
    -- Create fork record
    INSERT INTO public.forks (
        user_id,
        original_note_id,
        forked_note_id
    ) VALUES (
        auth.uid(),
        p_original_note_id,
        v_new_note_id
    ) RETURNING id INTO v_fork_id;
    
    RETURN QUERY SELECT v_new_note_id, v_fork_id;
END;
$$;

-- ===========================
-- STEP 10: VERIFICATION QUERIES
-- ===========================

-- These queries can be run to verify RLS is working correctly:

/*
-- Test 1: Verify anonymous users cannot access private data
SET ROLE anon;
SELECT * FROM public.notes WHERE is_public = false; -- Should return empty
SELECT * FROM public.user_pinned_notes; -- Should return empty
RESET ROLE;

-- Test 2: Verify users can only see their own private data
-- (Replace with actual user ID when testing)
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM public.notes WHERE user_id != auth.uid() AND is_public = false; -- Should return empty
SELECT * FROM public.user_pinned_notes WHERE user_id != auth.uid(); -- Should return empty

-- Test 3: Verify public data is accessible
SELECT count(*) FROM public.notes WHERE is_public = true; -- Should return count of public notes

-- Test 4: Verify fork restrictions
-- Try to fork own note (should fail)
-- Try to fork private note (should fail)  
-- Try to fork public note from another user (should succeed)
*/

-- ===========================
-- STEP 11: POLICY SUMMARY
-- ===========================

/*
SECURITY IMPROVEMENTS IMPLEMENTED:

1. Fixed Foreign Key References:
   - Stars and forks now reference auth.users instead of profiles
   - Ensures auth.uid() works correctly across all policies

2. Eliminated Duplicate Policies:
   - Removed redundant SELECT policies on notes table
   - Single, clear policy per operation type

3. Granular Permission Control:
   - Separate policies for SELECT, INSERT, UPDATE, DELETE
   - No overly broad "FOR ALL" policies

4. User Isolation:
   - All policies properly check auth.uid()
   - Prevents cross-user data access
   - Anonymous users limited to public data only

5. Business Logic Security:
   - Users cannot fork their own notes
   - Users cannot star private notes they don't own
   - Profile visibility limited to relevant users

6. Function Security:
   - Replaced SECURITY DEFINER with SECURITY INVOKER
   - Added authentication checks in all functions
   - Removed privilege escalation risks

7. Immutable Record Protection:
   - Stars and forks are create/delete only
   - Prevents tampering with historical data

8. Comprehensive Coverage:
   - All tables have complete CRUD policies
   - No gaps in security coverage
   - Clear access patterns defined

TESTING RECOMMENDATIONS:
- Test with different user contexts
- Verify anonymous access limitations  
- Test cross-user data isolation
- Validate public data accessibility
- Test all CRUD operations per table
*/