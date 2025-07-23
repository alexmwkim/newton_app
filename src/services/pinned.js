import { supabase } from './supabase';

class PinnedNotesService {
  // 사용자의 핀된 노트 목록 가져오기
  async getUserPinnedNotes(userId) {
    try {
      console.log('📌 Attempting to load pinned notes for userId:', userId);
      
      const authUser = await supabase.auth.getUser();
      const actualUserId = authUser.data?.user?.id;
      console.log('📌 Load pinned - using auth user ID:', actualUserId, 'vs passed userId:', userId);
      
      // Validate actualUserId before using it
      if (!actualUserId) {
        console.error('📌 No authenticated user found');
        return { data: [], error: 'No authenticated user' };
      }
      
      const { data, error } = await supabase
        .from('user_pinned_notes')
        .select('note_id, created_at')
        .eq('user_id', actualUserId) // Use auth.uid() for consistency
        .order('created_at', { ascending: true }); // 핀된 순서대로 (오래된 것 먼저)

      if (error) {
        console.error('📌 Supabase getUserPinnedNotes error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('📌 Raw pinned notes data from Supabase:', data);
      
      // note_id 배열로 반환 (핀된 순서대로)
      const noteIds = data?.map(item => item.note_id) || [];
      console.log('📌 Processed pinned note IDs:', noteIds);
      return { data: noteIds, error: null };
    } catch (error) {
      console.error('📌 Full getUserPinnedNotes error:', error);
      return { data: null, error: error.message }; // null을 반환해서 AsyncStorage fallback 사용
    }
  }

  // 노트를 핀하기
  async pinNote(noteId, userId) {
    try {
      console.log('📌 Attempting to pin note:', { noteId, userId });
      
      // Validate noteId first
      if (!noteId || noteId === 'undefined') {
        console.error('📌 Invalid noteId provided:', noteId);
        return { data: null, error: 'Invalid note ID' };
      }
      
      const authUser = await supabase.auth.getUser();
      console.log('📌 Supabase auth user:', authUser);
      
      // Use auth.uid() instead of passed userId for consistency with RLS
      const actualUserId = authUser.data?.user?.id;
      console.log('📌 Using auth user ID for RLS:', actualUserId, 'vs passed userId:', userId);
      
      // Validate actualUserId
      if (!actualUserId || actualUserId === 'undefined') {
        console.error('📌 Invalid actualUserId:', actualUserId);
        return { data: null, error: 'No authenticated user' };
      }
      
      const { data, error } = await supabase
        .from('user_pinned_notes')
        .insert([{
          user_id: actualUserId, // Use auth.uid() for RLS
          note_id: noteId
        }])
        .select()
        .single();

      if (error) {
        console.error('📌 Supabase pinNote error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('📌 Successfully pinned note in Supabase:', noteId, 'data:', data);
      return { data, error: null };
    } catch (error) {
      console.error('📌 Full pinNote error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트 언핀하기
  async unpinNote(noteId, userId) {
    try {
      console.log('📌 Attempting to unpin note:', { noteId, userId });
      
      // Validate noteId first
      if (!noteId || noteId === 'undefined') {
        console.error('📌 Invalid noteId provided for unpin:', noteId);
        return { data: null, error: 'Invalid note ID' };
      }
      
      const authUser = await supabase.auth.getUser();
      console.log('📌 Supabase auth user:', authUser);
      
      // Use auth.uid() instead of passed userId for consistency with RLS
      const actualUserId = authUser.data?.user?.id;
      console.log('📌 Using auth user ID for RLS:', actualUserId, 'vs passed userId:', userId);
      
      // Validate actualUserId
      if (!actualUserId || actualUserId === 'undefined') {
        console.error('📌 Invalid actualUserId for unpin:', actualUserId);
        return { data: null, error: 'No authenticated user' };
      }
      
      const { data, error } = await supabase
        .from('user_pinned_notes')
        .delete()
        .eq('user_id', actualUserId) // Use auth.uid() for RLS
        .eq('note_id', noteId)
        .select();

      if (error) {
        console.error('📌 Supabase unpinNote error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('📌 Successfully unpinned note in Supabase:', noteId, 'data:', data);
      return { data, error: null };
    } catch (error) {
      console.error('📌 Full unpinNote error:', error);
      return { data: null, error: error.message };
    }
  }

  // 특정 노트가 핀되어 있는지 확인
  async isNotePinned(noteId, userId) {
    try {
      const { data, error } = await supabase
        .from('user_pinned_notes')
        .select('id')
        .eq('user_id', userId)
        .eq('note_id', noteId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      return { data: !!data, error: null };
    } catch (error) {
      console.error('Check if note is pinned error:', error);
      return { data: false, error: error.message };
    }
  }

  // 사용자의 모든 핀된 노트 제거 (데이터베이스 정리용)
  async clearAllUserPinnedNotes(userId) {
    try {
      const { data, error } = await supabase
        .from('user_pinned_notes')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      console.log('🗑️ Cleared all pinned notes for user:', userId);
      return { data, error: null };
    } catch (error) {
      console.error('Clear all pinned notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 실시간 구독 - 사용자의 핀된 노트 변경사항 감지
  subscribeToUserPinnedNotes(userId, callback) {
    return supabase
      .channel(`user-pinned-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_pinned_notes',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
}

export default new PinnedNotesService();