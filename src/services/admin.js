import { supabase } from './supabase';

class AdminService {
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
      
      // 2단계: 프로필이 없다면 생성
      if (!currentProfile) {
        console.log('📝 Creating profile for current authenticated user...');
        const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: currentAuthId,
            username: username
          }]);
        
        if (createProfileError) {
          throw new Error('Failed to create profile: ' + createProfileError.message);
        }
        console.log('✅ Created profile for current user');
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

export default new AdminService();