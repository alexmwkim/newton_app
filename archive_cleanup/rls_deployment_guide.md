# Newton App RLS Security Deployment Guide

## Overview

This guide walks you through implementing bulletproof Row Level Security (RLS) policies for the Newton app database. The security improvements address critical vulnerabilities in the current implementation and ensure complete user isolation for client-side access with only the anon key.

## Critical Security Issues Found

### 🚨 **High Priority Issues**
1. **Duplicate SELECT Policies**: Conflicting policies on notes table
2. **Foreign Key Inconsistencies**: Stars and forks tables reference `profiles.id` instead of `auth.users.id`
3. **Overly Permissive Access**: Forks table allows viewing all forks, profiles completely public
4. **Missing Granular Control**: Using `FOR ALL` instead of specific CRUD operations
5. **Privilege Escalation Risk**: Functions with `SECURITY DEFINER` bypassing RLS

### ⚠️ **Security Impact**
- Users could potentially access other users' private data
- Cross-user data manipulation possible
- Anonymous users have excessive access to sensitive information
- Database functions could be exploited for privilege escalation

## Deployment Steps

### Step 1: Backup Current Database

```sql
-- Create backup of current policies
CREATE TABLE policy_backup AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public';

-- Backup current table structures
pg_dump --schema-only --schema=public your_database_name > schema_backup.sql
```

### Step 2: Apply Security-Hardened Policies

Execute the security improvements in this order:

```bash
# 1. Apply the main security policies
psql -f security_hardened_rls_policies.sql

# 2. Verify policies are applied correctly
psql -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;"
```

### Step 3: Run Security Tests

```bash
# Execute comprehensive security tests
psql -f rls_security_tests.sql

# Review all NOTICE messages to ensure tests PASS
# Any FAILED tests indicate security vulnerabilities
```

### Step 4: Update Application Code

Update your Supabase client calls to use the new secure functions:

#### Before (Vulnerable):
```javascript
// Old way - bypasses RLS
const { data, error } = await supabase
  .from('notes')
  .insert({ 
    title: 'My Note', 
    content: 'Content here',
    user_id: someUserId  // Security risk!
  });
```

#### After (Secure):
```javascript
// New way - uses secure function
const { data, error } = await supabase
  .rpc('create_note_secure', {
    p_title: 'My Note',
    p_content: 'Content here',
    p_is_public: false
  });

// Get current user profile securely  
const { data: profile } = await supabase
  .rpc('get_current_user_profile');

// Fork note securely
const { data: fork } = await supabase
  .rpc('fork_note_secure', {
    p_original_note_id: noteId,
    p_new_title: 'My Fork of Original Note'
  });
```

### Step 5: Test Client-Side Security

Create test users and verify isolation:

```javascript
// Test script for your React Native app
const testUserIsolation = async () => {
  // Test 1: User can only see their own private notes
  const { data: privateNotes } = await supabase
    .from('notes')
    .select('*')
    .eq('is_public', false);
  
  console.log('Private notes visible:', privateNotes.length);
  // Should only show current user's private notes
  
  // Test 2: User can see all public notes
  const { data: publicNotes } = await supabase
    .from('notes')
    .select('*')
    .eq('is_public', true);
  
  console.log('Public notes visible:', publicNotes.length);
  // Should show all public notes from all users
  
  // Test 3: User cannot insert for other users
  const { error } = await supabase
    .from('notes')
    .insert({
      user_id: 'some-other-user-id', // This should fail
      title: 'Malicious Note',
      content: 'Should not work'
    });
  
  console.log('Insert error (expected):', error?.message);
};
```

## Security Policy Summary

### Profiles Table
- **SELECT**: Users can view profiles of public note authors + their own profile
- **INSERT**: Users can only create their own profile
- **UPDATE**: Users can only update their own profile  
- **DELETE**: Users can only delete their own profile

### Notes Table
- **SELECT**: Public notes OR own private notes only
- **INSERT**: Users can only create notes for themselves
- **UPDATE**: Users can only update their own notes (prevents user_id changes)
- **DELETE**: Users can only delete their own notes

### Stars Table
- **SELECT**: Own stars + stars on public notes + stars on own notes
- **INSERT**: Can star public notes and own notes only
- **DELETE**: Can only remove own stars

### User Pinned Notes Table
- **SELECT**: Users can only view their own pinned notes  
- **INSERT**: Can pin own notes or public notes
- **DELETE**: Can only unpin their own pinned notes

### Forks Table
- **SELECT**: Own forks + forks of public notes + forks of own notes
- **INSERT**: Can fork public notes from other users (not own notes)
- **DELETE**: Can only delete own fork records

## Verification Checklist

After deployment, verify these security measures:

### ✅ **Anonymous User Restrictions**
- [ ] Anonymous users can only see public notes
- [ ] Anonymous users cannot see any private data (stars, pinned notes, etc.)
- [ ] Anonymous users can only see profiles of users with public notes

### ✅ **User Isolation**  
- [ ] Users cannot see other users' private notes
- [ ] Users cannot modify other users' data
- [ ] Users cannot insert data for other users
- [ ] Bulk operations respect user boundaries

### ✅ **Business Logic Security**
- [ ] Users cannot fork their own notes
- [ ] Users cannot fork private notes
- [ ] Users cannot star private notes they don't own
- [ ] Fork relationships are properly tracked

### ✅ **Function Security**
- [ ] All functions require authentication
- [ ] Functions use caller's permissions (SECURITY INVOKER)
- [ ] No privilege escalation possible
- [ ] Input validation prevents injection attacks

## Monitoring and Maintenance

### Regular Security Checks

```sql
-- Monthly security audit query
SELECT 
  tablename,
  count(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;

-- Check for any disabled RLS
SELECT tablename 
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' 
AND NOT c.relrowsecurity;
```

### Performance Monitoring

```sql
-- Monitor policy performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;
```

## Rollback Plan

If issues occur, rollback steps:

```sql
-- 1. Disable RLS temporarily (emergency only)
-- ALTER TABLE public.tablename DISABLE ROW LEVEL SECURITY;

-- 2. Restore old policies from backup
-- DROP POLICY ... (for each new policy)
-- CREATE POLICY ... (restore from policy_backup table)

-- 3. Restore original schema
-- psql -f schema_backup.sql
```

## Support and Troubleshooting

### Common Issues

**Issue**: "Permission denied for table"
**Solution**: Verify RLS is enabled and user has proper authentication

**Issue**: "Function does not exist"  
**Solution**: Ensure all functions from security_hardened_rls_policies.sql are applied

**Issue**: "Row violates row-level security policy"
**Solution**: Check that user is authenticated and data ownership is correct

### Testing Commands

```sql
-- Check current user context
SELECT auth.uid(), auth.role();

-- List all policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';

-- Test specific table access
SET request.jwt.claims = '{"sub": "user-id-here"}';
SELECT * FROM public.tablename LIMIT 5;
```

## Conclusion

These security improvements provide:

1. **Complete User Isolation**: Users can only access their own private data
2. **Proper Public Data Access**: Public content remains accessible to all
3. **Granular Permissions**: Specific policies for each operation type
4. **Business Logic Security**: Prevents illogical operations (self-forking, etc.)
5. **Function Security**: No privilege escalation or bypass vulnerabilities
6. **Anonymous User Safety**: Limited access appropriate for unauthenticated users

The database is now secure for client-side access using only the Supabase anon key, with all security enforced at the database level through bulletproof RLS policies.