-- ===========================
-- RLS SECURITY TESTING SUITE
-- ===========================
-- This file contains comprehensive tests to verify that RLS policies
-- properly isolate users and prevent unauthorized access.

-- ===========================
-- TEST SETUP
-- ===========================

-- Create test users (run these manually in Supabase dashboard)
/*
Test User 1: alice@test.com (ID will be generated)
Test User 2: bob@test.com (ID will be generated)  
Test User 3: charlie@test.com (ID will be generated)

After creating users, replace the UUIDs below with actual user IDs.
*/

-- Test user IDs (replace with actual IDs from auth.users table)
-- You can get these with: SELECT id, email FROM auth.users;

-- ===========================
-- TEST DATA SETUP
-- ===========================

-- Insert test profiles (run as authenticated users)
INSERT INTO public.profiles (user_id, username, bio) VALUES
('alice-uuid-here', 'alice_writer', 'I love writing notes!'),
('bob-uuid-here', 'bob_reader', 'Always learning something new'),
('charlie-uuid-here', 'charlie_dev', 'Code and documentation enthusiast');

-- Insert test notes with mixed public/private
INSERT INTO public.notes (user_id, title, content, is_public) VALUES
-- Alice's notes
('alice-uuid-here', 'Alice Public Note 1', 'This is Alice''s public content', true),
('alice-uuid-here', 'Alice Private Note 1', 'This is Alice''s private content', false),
('alice-uuid-here', 'Alice Public Note 2', 'Another public note from Alice', true),

-- Bob's notes  
('bob-uuid-here', 'Bob Public Note 1', 'This is Bob''s public content', true),
('bob-uuid-here', 'Bob Private Note 1', 'This is Bob''s private content', false),

-- Charlie's notes
('charlie-uuid-here', 'Charlie Private Note 1', 'Charlie''s secret thoughts', false),
('charlie-uuid-here', 'Charlie Public Tutorial', 'How to write good documentation', true);

-- ===========================
-- TEST CASE 1: ANONYMOUS USER RESTRICTIONS
-- ===========================

-- Test: Anonymous users should only see public data
BEGIN;
SET ROLE anon;

-- Should only return public notes
SELECT 
    'ANONYMOUS_NOTES_TEST' as test_name,
    count(*) as public_notes_visible,
    count(*) FILTER (WHERE is_public = false) as private_notes_visible
FROM public.notes;
-- Expected: public_notes_visible > 0, private_notes_visible = 0

-- Should only see profiles of users with public notes
SELECT 
    'ANONYMOUS_PROFILES_TEST' as test_name,
    count(*) as profiles_visible
FROM public.profiles;
-- Expected: Should see profiles of users who have public notes

-- Should not see any stars, pinned notes, or personal data
SELECT 'ANONYMOUS_STARS_TEST' as test_name, count(*) as visible_stars FROM public.stars;
SELECT 'ANONYMOUS_PINNED_TEST' as test_name, count(*) as visible_pinned FROM public.user_pinned_notes;
-- Expected: Both should return 0

-- Should see forks of public notes only
SELECT 'ANONYMOUS_FORKS_TEST' as test_name, count(*) as visible_forks FROM public.forks;
-- Expected: Should only see forks involving public notes

ROLLBACK;

-- ===========================  
-- TEST CASE 2: USER ISOLATION VERIFICATION
-- ===========================

-- Test: Alice should only see her own private data + public data
BEGIN;
-- Simulate Alice being logged in
SET request.jwt.claims = '{"sub": "alice-uuid-here"}';

-- Alice should see her own notes + all public notes, but no other private notes
SELECT 
    'ALICE_NOTES_ISOLATION' as test_name,
    count(*) as total_visible,
    count(*) FILTER (WHERE user_id = 'alice-uuid-here') as own_notes,
    count(*) FILTER (WHERE user_id != 'alice-uuid-here' AND is_public = false) as others_private_notes
FROM public.notes;
-- Expected: total_visible > own_notes, others_private_notes = 0

-- Test Alice cannot insert notes for other users
DO $$
BEGIN
    BEGIN
        INSERT INTO public.notes (user_id, title, content, is_public) 
        VALUES ('bob-uuid-here', 'Malicious Note', 'Should not work', false);
        RAISE NOTICE 'ALICE_INSERT_VIOLATION: FAILED - Alice was able to insert for Bob';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'ALICE_INSERT_VIOLATION: PASSED - Alice correctly blocked from inserting for Bob';
    END;
END $$;

-- Test Alice cannot update other users' notes
DO $$
BEGIN
    BEGIN
        UPDATE public.notes 
        SET title = 'Hacked by Alice' 
        WHERE user_id = 'bob-uuid-here';
        
        IF FOUND THEN
            RAISE NOTICE 'ALICE_UPDATE_VIOLATION: FAILED - Alice was able to update Bob''s notes';
        ELSE
            RAISE NOTICE 'ALICE_UPDATE_VIOLATION: PASSED - No notes were updated by Alice';
        END IF;
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'ALICE_UPDATE_VIOLATION: PASSED - Alice correctly blocked from updating Bob''s notes';
    END;
END $$;

ROLLBACK;

-- ===========================
-- TEST CASE 3: CROSS-USER DATA ACCESS
-- ===========================

-- Test: Bob trying to access Alice's private data
BEGIN;
SET request.jwt.claims = '{"sub": "bob-uuid-here"}';

-- Bob should not see Alice's private notes
SELECT 
    'BOB_ALICE_PRIVACY' as test_name,
    count(*) as alice_private_notes_visible
FROM public.notes 
WHERE user_id = 'alice-uuid-here' AND is_public = false;
-- Expected: 0

-- Bob should not see Alice's pinned notes
SELECT 
    'BOB_ALICE_PINNED' as test_name,
    count(*) as alice_pinned_visible
FROM public.user_pinned_notes 
WHERE user_id = 'alice-uuid-here';
-- Expected: 0

-- Bob should not be able to star Alice's private notes  
DO $$
BEGIN
    BEGIN
        INSERT INTO public.stars (user_id, note_id)
        SELECT 'bob-uuid-here', id 
        FROM public.notes 
        WHERE user_id = 'alice-uuid-here' AND is_public = false 
        LIMIT 1;
        
        RAISE NOTICE 'BOB_STAR_PRIVATE: FAILED - Bob was able to star Alice''s private note';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'BOB_STAR_PRIVATE: PASSED - Bob correctly blocked from starring private note';
    END;
END $$;

ROLLBACK;

-- ===========================
-- TEST CASE 4: FORK SECURITY
-- ===========================

-- Test: Fork restrictions
BEGIN;
SET request.jwt.claims = '{"sub": "charlie-uuid-here"}';

-- Charlie should not be able to fork his own notes
DO $$
DECLARE
    charlie_note_id UUID;
    new_note_id UUID;
BEGIN
    -- Get one of Charlie's public notes
    SELECT id INTO charlie_note_id 
    FROM public.notes 
    WHERE user_id = 'charlie-uuid-here' AND is_public = true 
    LIMIT 1;
    
    IF charlie_note_id IS NOT NULL THEN
        BEGIN
            -- Try to fork own note
            SELECT forked_note_id INTO new_note_id
            FROM public.fork_note_secure(charlie_note_id, 'Self Fork Test');
            
            RAISE NOTICE 'CHARLIE_SELF_FORK: FAILED - Charlie was able to fork his own note';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'CHARLIE_SELF_FORK: PASSED - Charlie correctly blocked from forking own note';
        END;
    END IF;
END $$;

-- Charlie should not be able to fork private notes
DO $$
DECLARE
    private_note_id UUID;
    new_note_id UUID;
BEGIN
    -- Get a private note from another user
    SELECT id INTO private_note_id 
    FROM public.notes 
    WHERE user_id != 'charlie-uuid-here' AND is_public = false 
    LIMIT 1;
    
    IF private_note_id IS NOT NULL THEN
        BEGIN
            -- Try to fork private note
            SELECT forked_note_id INTO new_note_id
            FROM public.fork_note_secure(private_note_id, 'Private Fork Test');
            
            RAISE NOTICE 'CHARLIE_PRIVATE_FORK: FAILED - Charlie was able to fork private note';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'CHARLIE_PRIVATE_FORK: PASSED - Charlie correctly blocked from forking private note';
        END;
    END IF;
END $$;

-- Charlie should be able to fork public notes from others
DO $$
DECLARE
    public_note_id UUID;
    new_note_id UUID;
BEGIN
    -- Get a public note from another user
    SELECT id INTO public_note_id 
    FROM public.notes 
    WHERE user_id != 'charlie-uuid-here' AND is_public = true 
    LIMIT 1;
    
    IF public_note_id IS NOT NULL THEN
        BEGIN
            -- Try to fork public note
            SELECT forked_note_id INTO new_note_id
            FROM public.fork_note_secure(public_note_id, 'Valid Fork Test');
            
            IF new_note_id IS NOT NULL THEN
                RAISE NOTICE 'CHARLIE_PUBLIC_FORK: PASSED - Charlie successfully forked public note';
            ELSE
                RAISE NOTICE 'CHARLIE_PUBLIC_FORK: FAILED - Charlie could not fork public note';
            END IF;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'CHARLIE_PUBLIC_FORK: FAILED - Charlie blocked from forking public note: %', SQLERRM;
        END;
    END IF;
END $$;

ROLLBACK;

-- ===========================
-- TEST CASE 5: PROFILE VISIBILITY
-- ===========================

-- Test: Profile visibility rules
BEGIN;
SET request.jwt.claims = '{"sub": "alice-uuid-here"}';

-- Alice should be able to see profiles of users with public notes
SELECT 
    'ALICE_PROFILE_VISIBILITY' as test_name,
    p.username,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.notes WHERE user_id = p.user_id AND is_public = true) 
        THEN 'Has public notes'
        WHEN p.user_id = 'alice-uuid-here' 
        THEN 'Own profile'
        ELSE 'Private user'
    END as visibility_reason
FROM public.profiles p;

ROLLBACK;

-- ===========================
-- TEST CASE 6: BULK OPERATIONS SECURITY
-- ===========================

-- Test: Ensure bulk operations respect RLS
BEGIN;
SET request.jwt.claims = '{"sub": "bob-uuid-here"}';

-- Bob should not be able to bulk delete other users' data
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notes WHERE user_id != 'bob-uuid-here';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        RAISE NOTICE 'BOB_BULK_DELETE: FAILED - Bob deleted % notes from other users', deleted_count;
    ELSE
        RAISE NOTICE 'BOB_BULK_DELETE: PASSED - Bob could not delete other users'' notes';
    END IF;
END $$;

-- Bob should not be able to bulk update other users' data
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notes SET title = 'Hacked by Bob' WHERE user_id != 'bob-uuid-here';
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RAISE NOTICE 'BOB_BULK_UPDATE: FAILED - Bob updated % notes from other users', updated_count;
    ELSE
        RAISE NOTICE 'BOB_BULK_UPDATE: PASSED - Bob could not update other users'' notes';
    END IF;
END $$;

ROLLBACK;

-- ===========================
-- TEST CASE 7: FUNCTION SECURITY
-- ===========================

-- Test: Secure functions work correctly
BEGIN;
SET request.jwt.claims = '{"sub": "alice-uuid-here"}';

-- Test secure note creation
DO $$
DECLARE
    new_note RECORD;
BEGIN
    SELECT * INTO new_note FROM public.create_note_secure(
        'Test Secure Note',
        'This note was created securely by Alice',
        true,
        'test-secure-note'
    );
    
    IF new_note.user_id = 'alice-uuid-here' THEN
        RAISE NOTICE 'SECURE_NOTE_CREATE: PASSED - Note created with correct user_id';
    ELSE
        RAISE NOTICE 'SECURE_NOTE_CREATE: FAILED - Note created with wrong user_id: %', new_note.user_id;
    END IF;
END $$;

-- Test profile retrieval
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM public.get_current_user_profile();
    
    IF profile_record.user_id = 'alice-uuid-here' THEN
        RAISE NOTICE 'SECURE_PROFILE_GET: PASSED - Retrieved correct user profile';
    ELSE
        RAISE NOTICE 'SECURE_PROFILE_GET: FAILED - Retrieved wrong profile: %', profile_record.user_id;
    END IF;
END $$;

ROLLBACK;

-- ===========================
-- TEST CASE 8: UNAUTHENTICATED ACCESS
-- ===========================

-- Test: Verify functions require authentication
BEGIN;
SET request.jwt.claims = '{}';  -- No user

-- Should fail without authentication
DO $$
BEGIN
    BEGIN
        PERFORM public.create_note_secure('Unauthenticated Note', 'Should fail');
        RAISE NOTICE 'UNAUTH_NOTE_CREATE: FAILED - Function allowed unauthenticated access';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'UNAUTH_NOTE_CREATE: PASSED - Function correctly rejected unauthenticated access';
    END;
END $$;

DO $$
BEGIN
    BEGIN
        PERFORM public.get_current_user_profile();
        RAISE NOTICE 'UNAUTH_PROFILE_GET: FAILED - Function allowed unauthenticated access';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'UNAUTH_PROFILE_GET: PASSED - Function correctly rejected unauthenticated access';
    END;
END $$;

ROLLBACK;

-- ===========================
-- TEST SUMMARY QUERY
-- ===========================

-- Run this to get a summary of your test results
SELECT 
    'TEST_SUMMARY' as report_type,
    'Review the NOTICE messages above for detailed test results' as instruction,
    'All tests should show PASSED for proper security' as expected_result;

-- ===========================
-- CLEANUP (Optional)
-- ===========================

-- Uncomment to clean up test data after testing
/*
DELETE FROM public.forks WHERE user_id IN ('alice-uuid-here', 'bob-uuid-here', 'charlie-uuid-here');
DELETE FROM public.stars WHERE user_id IN ('alice-uuid-here', 'bob-uuid-here', 'charlie-uuid-here'); 
DELETE FROM public.user_pinned_notes WHERE user_id IN ('alice-uuid-here', 'bob-uuid-here', 'charlie-uuid-here');
DELETE FROM public.notes WHERE user_id IN ('alice-uuid-here', 'bob-uuid-here', 'charlie-uuid-here');
DELETE FROM public.profiles WHERE user_id IN ('alice-uuid-here', 'bob-uuid-here', 'charlie-uuid-here');
*/