import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

class AdminService {
  // Clean up duplicate profiles
  async cleanupDuplicateProfiles() {
    try {
      console.log('🧹 === CLEANING UP DUPLICATE PROFILES ===');
      
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('🚨 SECURITY: Missing Supabase admin configuration in environment variables');
      }
      
      const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Real user IDs from auth.users
      const ALEX_KIM_REAL_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';
      const DAVID_LEE_REAL_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
      
      // Get all profiles for each user
      const { data: alexProfiles, error: alexError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('user_id', ALEX_KIM_REAL_ID)
        .order('created_at', { ascending: true });
      
      const { data: davidProfiles, error: davidError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('user_id', DAVID_LEE_REAL_ID)
        .order('created_at', { ascending: true });
      
      console.log('👤 Alex Kim profiles found:', alexProfiles?.length || 0);
      console.log('👤 David Lee profiles found:', davidProfiles?.length || 0);
      
      // Keep only the first profile for each user and delete the rest
      if (alexProfiles && alexProfiles.length > 1) {
        const profilesToDelete = alexProfiles.slice(1); // Keep first, delete rest
        console.log('🗑️ Deleting', profilesToDelete.length, 'duplicate Alex profiles');
        
        for (const profile of profilesToDelete) {
          const { error: deleteError } = await serviceSupabase
            .from('profiles')
            .delete()
            .eq('id', profile.id);
          
          if (deleteError) {
            console.error('❌ Failed to delete Alex profile:', profile.username, deleteError.message);
          } else {
            console.log('✅ Deleted Alex profile:', profile.username);
          }
        }
      }
      
      if (davidProfiles && davidProfiles.length > 1) {
        const profilesToDelete = davidProfiles.slice(1); // Keep first, delete rest
        console.log('🗑️ Deleting', profilesToDelete.length, 'duplicate David profiles');
        
        for (const profile of profilesToDelete) {
          const { error: deleteError } = await serviceSupabase
            .from('profiles')
            .delete()
            .eq('id', profile.id);
          
          if (deleteError) {
            console.error('❌ Failed to delete David profile:', profile.username, deleteError.message);
          } else {
            console.log('✅ Deleted David profile:', profile.username);
          }
        }
      }
      
      // Update remaining profile usernames to be clean
      if (alexProfiles && alexProfiles.length > 0) {
        const { error: updateAlexError } = await serviceSupabase
          .from('profiles')
          .update({ username: 'Alex Kim' })
          .eq('id', alexProfiles[0].id);
        
        if (updateAlexError) {
          console.error('❌ Failed to update Alex username:', updateAlexError.message);
        } else {
          console.log('✅ Updated Alex username to "Alex Kim"');
        }
      }
      
      if (davidProfiles && davidProfiles.length > 0) {
        const { error: updateDavidError } = await serviceSupabase
          .from('profiles')
          .update({ username: 'David Lee' })
          .eq('id', davidProfiles[0].id);
        
        if (updateDavidError) {
          console.error('❌ Failed to update David username:', updateDavidError.message);
        } else {
          console.log('✅ Updated David username to "David Lee"');
        }
      }
      
      console.log('🎉 === DUPLICATE PROFILE CLEANUP COMPLETED ===');
      
      return { success: true, message: 'Duplicate profiles cleaned up successfully' };
    } catch (error) {
      console.error('❌ Cleanup duplicate profiles error:', error);
      return { success: false, error: error.message };
    }
  }
  // Fix user IDs to match real auth.users
  async fixUserIdsToRealAuthUsers() {
    try {
      console.log('🔧 === FIXING USER IDS TO REAL AUTH USERS ===');
      
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('🚨 SECURITY: Missing Supabase admin configuration in environment variables');
      }
      
      const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Real user IDs from auth.users (from screenshot)
      const ALEX_KIM_REAL_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';
      const DAVID_LEE_REAL_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
      
      console.log('📝 Real Alex Kim ID:', ALEX_KIM_REAL_ID);
      console.log('📝 Real David Lee ID:', DAVID_LEE_REAL_ID);
      
      // Check what user IDs are currently in the notes table
      const { data: notes, error: notesError } = await serviceSupabase
        .from('notes')
        .select('user_id, title');
      
      if (notesError) {
        console.error('❌ Failed to check notes:', notesError.message);
      } else {
        console.log('📊 Current user_ids in notes table:');
        const userIdCounts = {};
        notes?.forEach(n => {
          userIdCounts[n.user_id] = (userIdCounts[n.user_id] || 0) + 1;
        });
        Object.entries(userIdCounts).forEach(([userId, count]) => {
          console.log(`  - ${userId}: ${count} notes`);
        });
      }
      
      // Check profiles table
      const { data: profiles, error: profilesError } = await serviceSupabase
        .from('profiles')
        .select('user_id, username');
      
      if (profilesError) {
        console.error('❌ Failed to check profiles:', profilesError.message);
      } else {
        console.log('👤 Current profiles:');
        profiles?.forEach(p => console.log(`  - ${p.username}: ${p.user_id}`));
      }
      
      // Update Alex Kim's notes to use real ID
      console.log('🔄 Updating Alex Kim notes...');
      const { error: alexNotesError } = await serviceSupabase
        .from('notes')
        .update({ user_id: ALEX_KIM_REAL_ID })
        .or('title.ilike.%alex%,title.ilike.%memo%,title.ilike.%ㅅㅅ%');
      
      if (alexNotesError) {
        console.error('❌ Failed to update Alex notes:', alexNotesError.message);
      } else {
        console.log('✅ Updated Alex Kim notes');
      }
      
      // Update David Lee's notes to use real ID  
      console.log('🔄 Updating David Lee notes...');
      const { error: davidNotesError } = await serviceSupabase
        .from('notes')
        .update({ user_id: DAVID_LEE_REAL_ID })
        .or('title.ilike.%david%,title.ilike.%note%');
      
      if (davidNotesError) {
        console.error('❌ Failed to update David notes:', davidNotesError.message);
      } else {
        console.log('✅ Updated David Lee notes');
      }
      
      // Create/update profiles with real IDs
      console.log('👤 Creating/updating profiles...');
      
      // Check if Alex Kim profile exists and create/update accordingly
      const { data: existingAlexProfile, error: alexCheckError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('user_id', ALEX_KIM_REAL_ID)
        .single();
      
      if (alexCheckError && alexCheckError.code === 'PGRST116') {
        // Profile doesn't exist, create new one
        console.log('📝 Creating new Alex Kim profile...');
        const { error: alexCreateError } = await serviceSupabase
          .from('profiles')
          .insert({
            user_id: ALEX_KIM_REAL_ID,
            username: 'Alex Kim'
          });
        
        if (alexCreateError) {
          console.error('❌ Failed to create Alex profile:', alexCreateError.message);
        } else {
          console.log('✅ Alex Kim profile created');
        }
      } else if (!alexCheckError) {
        // Profile exists, update it
        console.log('🔄 Updating existing Alex Kim profile...');
        const { error: alexUpdateError } = await serviceSupabase
          .from('profiles')
          .update({ username: 'Alex Kim' })
          .eq('user_id', ALEX_KIM_REAL_ID);
        
        if (alexUpdateError) {
          console.error('❌ Failed to update Alex profile:', alexUpdateError.message);
        } else {
          console.log('✅ Alex Kim profile updated');
        }
      }
      
      // Handle David Lee profile more carefully
      console.log('🔍 Checking David Lee profile situation...');
      
      // First, check if there's already a profile with the correct user_id
      const { data: existingDavidProfile, error: davidCheckError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('user_id', DAVID_LEE_REAL_ID)
        .single();
      
      // Also check if there are any profiles with David-related usernames
      const { data: davidUsernameProfiles, error: davidUsernameError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .or('username.ilike.%david%,username.ilike.%David%');
      
      console.log('👤 David profiles by user_id:', existingDavidProfile ? 'EXISTS' : 'NOT FOUND');
      console.log('👤 David profiles by username:', davidUsernameProfiles?.length || 0);
      davidUsernameProfiles?.forEach(p => {
        console.log(`  - Username: "${p.username}", user_id: ${p.user_id}`);
      });
      
      if (davidCheckError && davidCheckError.code === 'PGRST116') {
        // No profile with correct user_id exists
        if (davidUsernameProfiles && davidUsernameProfiles.length > 0) {
          // There are profiles with David usernames, update the first one to use correct user_id
          const profileToUpdate = davidUsernameProfiles[0];
          console.log(`🔄 Updating existing David profile "${profileToUpdate.username}" to use correct user_id...`);
          
          const { error: davidUpdateError } = await serviceSupabase
            .from('profiles')
            .update({ user_id: DAVID_LEE_REAL_ID })
            .eq('id', profileToUpdate.id);
          
          if (davidUpdateError) {
            console.error('❌ Failed to update David profile user_id:', davidUpdateError.message);
          } else {
            console.log('✅ David profile user_id updated successfully');
          }
        } else {
          // No David profiles exist, create new one
          console.log('📝 Creating new David Lee profile...');
          const { error: davidCreateError } = await serviceSupabase
            .from('profiles')
            .insert({
              user_id: DAVID_LEE_REAL_ID,
              username: 'David Lee'
            });
          
          if (davidCreateError) {
            console.error('❌ Failed to create David profile:', davidCreateError.message);
          } else {
            console.log('✅ David Lee profile created');
          }
        }
      } else if (!davidCheckError) {
        // Profile with correct user_id already exists
        console.log('✅ David Lee profile already has correct user_id');
      }
      
      console.log('🎉 === USER ID FIX COMPLETED ===');
      
      return { success: true, message: 'User IDs fixed to match real auth.users' };
    } catch (error) {
      console.error('❌ Fix user IDs error:', error);
      return { success: false, error: error.message };
    }
  }
  // Foreign Key 제약조건을 우회하여 User ID 수정
  async fixUserIdNoConstraints() {
    try {
      console.log('🔧 Starting NO-CONSTRAINTS User ID fix process...');
      
      // 현재 인증된 사용자 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('No authenticated user found');
      }
      
      const currentAuthId = user.id;
      console.log('🔑 Current authenticated user ID:', currentAuthId);
      
      // 1단계: Foreign Key 제약조건 임시 제거
      console.log('🔓 Removing foreign key constraints...');
      const { error: dropConstraintError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;'
      });
      
      if (dropConstraintError) {
        console.log('⚠️ Could not remove constraint (might not exist):', dropConstraintError.message);
      } else {
        console.log('✅ Removed foreign key constraint');
      }
      
      // 2단계: 기존 노트들의 user_id 찾기
      const { data: existingNotes, error: notesError } = await supabase
        .from('notes')
        .select('user_id, id, title')
        .limit(1);
      
      if (notesError || !existingNotes || existingNotes.length === 0) {
        console.log('❌ No existing notes found');
        return { success: true, message: 'No notes to fix' };
      }
      
      const oldUserId = existingNotes[0].user_id;
      console.log('🔍 Found existing user_id in notes:', oldUserId);
      
      if (oldUserId === currentAuthId) {
        console.log('✅ User IDs already match, no fix needed');
        return { success: true, message: 'No fix needed - IDs already match' };
      }
      
      // 3단계: 프로필 먼저 생성/확인
      console.log('📝 Ensuring profile exists for current user...');
      const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
      
      const { error: upsertProfileError } = await supabase
        .from('profiles')
        .upsert([{
          user_id: currentAuthId,
          username: username
        }], {
          onConflict: 'user_id'
        });
      
      if (upsertProfileError) {
        console.log('⚠️ Profile upsert warning:', upsertProfileError.message);
      } else {
        console.log('✅ Profile ready for current user');
      }
      
      console.log('🔄 Fixing user_id mismatch...');
      console.log('  From:', oldUserId);
      console.log('  To:', currentAuthId);
      
      // 4단계: 노트의 user_id 업데이트 (제약조건이 제거되어 있으므로 가능)
      const { error: updateNotesError } = await supabase
        .from('notes')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updateNotesError) {
        throw new Error('Failed to update notes: ' + updateNotesError.message);
      }
      console.log('✅ Updated notes user_id');
      
      // 5단계: 핀드 노트의 user_id 업데이트
      const { error: updatePinnedError } = await supabase
        .from('user_pinned_notes')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updatePinnedError) {
        console.log('⚠️ Pinned notes update failed (might not exist):', updatePinnedError.message);
      } else {
        console.log('✅ Updated pinned notes user_id');
      }
      
      // 6단계: Foreign Key 제약조건 다시 추가
      console.log('🔒 Re-adding foreign key constraints...');
      const { error: addConstraintError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.notes ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;'
      });
      
      if (addConstraintError) {
        console.log('⚠️ Could not re-add constraint:', addConstraintError.message);
      } else {
        console.log('✅ Re-added foreign key constraint');
      }
      
      // 7단계: 확인 쿼리
      const { data: verifyNotes } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', currentAuthId);
      
      console.log('🎉 NO-CONSTRAINTS Fix completed!');
      console.log('✅ Notes now owned by current user:', verifyNotes?.length || 0);
      
      return {
        success: true,
        message: `Successfully updated ${verifyNotes?.length || 0} notes to current user`,
        oldUserId,
        newUserId: currentAuthId
      };
      
    } catch (error) {
      console.error('❌ NO-CONSTRAINTS User ID fix failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // User ID 불일치 문제를 해결하는 함수 (Foreign Key 제약조건 고려)
  async fixUserIdMismatchProper() {
    try {
      console.log('🔧 Starting PROPER User ID fix process...');
      
      // 현재 인증된 사용자 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('No authenticated user found');
      }
      
      const currentAuthId = user.id;
      console.log('🔑 Current authenticated user ID:', currentAuthId);
      
      // 1단계: 현재 인증된 사용자의 프로필이 존재하는지 확인
      const { data: currentProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('user_id', currentAuthId)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        throw new Error('Failed to check current user profile: ' + profileCheckError.message);
      }
      
      // 2단계: 프로필이 없다면 오류 처리 (생성하지 않음)
      if (!currentProfile) {
        console.log('⚠️ No profile found for current authenticated user:', currentAuthId);
        console.log('⚠️ Profiles should be created during user registration, not during admin operations');
        console.log('⚠️ This suggests the user registration process is incomplete');
        
        // DO NOT create profile here - this should be handled during user registration
        // Return error to indicate the problem
        return {
          success: false,
          error: 'User profile not found. Please ensure user registration completed properly.'
        };
      } else {
        console.log('✅ Profile already exists for current user');
      }
      
      // 3단계: 기존 노트들의 user_id를 찾기
      const { data: existingNotes, error: notesError } = await supabase
        .from('notes')
        .select('user_id, id, title')
        .limit(1);
      
      if (notesError || !existingNotes || existingNotes.length === 0) {
        console.log('❌ No existing notes found');
        return { success: true, message: 'No notes to fix' };
      }
      
      const oldUserId = existingNotes[0].user_id;
      console.log('🔍 Found existing user_id in notes:', oldUserId);
      
      if (oldUserId === currentAuthId) {
        console.log('✅ User IDs already match, no fix needed');
        return { success: true, message: 'No fix needed - IDs already match' };
      }
      
      console.log('🔄 Fixing user_id mismatch...');
      console.log('  From:', oldUserId);
      console.log('  To:', currentAuthId);
      
      // 4단계: 노트의 user_id 업데이트 (이제 프로필이 존재하므로 foreign key 제약조건 만족)
      const { error: updateNotesError } = await supabase
        .from('notes')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updateNotesError) {
        throw new Error('Failed to update notes: ' + updateNotesError.message);
      }
      console.log('✅ Updated notes user_id');
      
      // 5단계: 핀드 노트의 user_id 업데이트
      const { error: updatePinnedError } = await supabase
        .from('user_pinned_notes')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updatePinnedError) {
        console.log('⚠️ Pinned notes update failed (might not exist):', updatePinnedError.message);
      } else {
        console.log('✅ Updated pinned notes user_id');
      }
      
      // 6단계: 기존 프로필 삭제 (선택사항)
      const { error: deleteOldProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', oldUserId);
      
      if (deleteOldProfileError) {
        console.log('⚠️ Old profile deletion failed (might not exist):', deleteOldProfileError.message);
      } else {
        console.log('🗑️ Deleted old profile');
      }
      
      // 7단계: 확인 쿼리
      const { data: verifyNotes } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', currentAuthId);
      
      console.log('🎉 PROPER Fix completed!');
      console.log('✅ Notes now owned by current user:', verifyNotes?.length || 0);
      
      return {
        success: true,
        message: `Successfully updated ${verifyNotes?.length || 0} notes to current user`,
        oldUserId,
        newUserId: currentAuthId
      };
      
    } catch (error) {
      console.error('❌ PROPER User ID fix failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // User ID 불일치 문제를 해결하는 함수 (기존)
  async fixUserIdMismatch() {
    try {
      console.log('🔧 Starting User ID fix process...');
      
      // 현재 인증된 사용자 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('No authenticated user found');
      }
      
      const currentAuthId = user.id;
      console.log('🔑 Current authenticated user ID:', currentAuthId);
      
      // 기존 노트들의 user_id를 찾기
      const { data: existingNotes, error: notesError } = await supabase
        .from('notes')
        .select('user_id, id, title')
        .limit(1);
      
      if (notesError || !existingNotes || existingNotes.length === 0) {
        console.log('❌ No existing notes found');
        return { success: false, error: 'No notes found' };
      }
      
      const oldUserId = existingNotes[0].user_id;
      console.log('🔍 Found existing user_id in notes:', oldUserId);
      
      if (oldUserId === currentAuthId) {
        console.log('✅ User IDs already match, no fix needed');
        return { success: true, message: 'No fix needed - IDs already match' };
      }
      
      console.log('🔄 Fixing user_id mismatch...');
      console.log('  From:', oldUserId);
      console.log('  To:', currentAuthId);
      
      // 1. 노트의 user_id 업데이트
      const { error: updateNotesError } = await supabase
        .from('notes')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updateNotesError) {
        throw new Error('Failed to update notes: ' + updateNotesError.message);
      }
      console.log('✅ Updated notes user_id');
      
      // 2. 프로필의 user_id 업데이트 (있다면)
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updateProfileError) {
        console.log('⚠️ Profile update failed (might not exist):', updateProfileError.message);
      } else {
        console.log('✅ Updated profile user_id');
      }
      
      // 3. 핀드 노트의 user_id 업데이트
      const { error: updatePinnedError } = await supabase
        .from('user_pinned_notes')
        .update({ user_id: currentAuthId })
        .eq('user_id', oldUserId);
      
      if (updatePinnedError) {
        console.log('⚠️ Pinned notes update failed (might not exist):', updatePinnedError.message);
      } else {
        console.log('✅ Updated pinned notes user_id');
      }
      
      // 4. 확인 쿼리
      const { data: verifyNotes } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', currentAuthId);
      
      console.log('🎉 Fix completed!');
      console.log('✅ Notes now owned by current user:', verifyNotes?.length || 0);
      
      return {
        success: true,
        message: `Successfully updated ${verifyNotes?.length || 0} notes to current user`,
        oldUserId,
        newUserId: currentAuthId
      };
      
    } catch (error) {
      console.error('❌ User ID fix failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export class instead of instance to prevent initialization errors
// IMPORTANT: This service requires admin keys and should NOT be used in client applications
export default AdminService;