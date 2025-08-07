import { supabase } from './supabase';
import NotesService from './notes';

class SocialService {
  // 노트 별표 추가
  async starNote(noteId, userId) {
    try {
      // First get the profile ID for this user (stars table references profiles.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Check if already starred
      const { data: existingStar } = await supabase
        .from('stars')
        .select('id')
        .eq('note_id', noteId)
        .eq('user_id', profile.id)
        .single();

      if (existingStar) {
        return { data: null, error: 'Note is already starred' };
      }

      const { data, error } = await supabase
        .from('stars')
        .insert([{
          note_id: noteId,
          user_id: profile.id, // Use profile.id as stars table references profiles
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('⭐ Starred note in Supabase:', noteId);
      return { data, error: null };
    } catch (error) {
      console.error('Star note error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트 별표 제거
  async unstarNote(noteId, userId) {
    try {
      // First get the profile ID for this user
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!profile) {
        throw new Error('User profile not found');
      }

      const { data, error } = await supabase
        .from('stars')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', profile.id) // Use profile.id
        .select()
        .single();

      if (error) throw error;

      console.log('⭐ Unstarred note in Supabase:', noteId);

      return { data, error: null };
    } catch (error) {
      console.error('Unstar note error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자가 노트에 별표했는지 확인
  async isNoteStarred(noteId, userId) {
    try {
      if (!userId) return { isStarred: false, error: null };

      // First get the profile ID for this user (stars table references profiles.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!profile) {
        return { isStarred: false, error: null };
      }

      const { data, error } = await supabase
        .from('stars')
        .select('id')
        .eq('note_id', noteId)
        .eq('user_id', profile.id) // Use profile.id instead of auth.user.id
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { isStarred: !!data, error: null };
    } catch (error) {
      console.error('Check star status error:', error);
      return { isStarred: false, error: error.message };
    }
  }

  // 노트 포크하기
  async forkNote(originalNoteId, userId) {
    try {
      // Get original note data
      const { data: originalNote, error: getNoteError } = await NotesService.getNoteById(originalNoteId);
      if (getNoteError) throw new Error(getNoteError);

      // Check if user already forked this note
      const { data: existingFork } = await supabase
        .from('forks')
        .select('id')
        .eq('original_note_id', originalNoteId)
        .eq('user_id', userId)
        .single();

      if (existingFork) {
        return { data: null, error: 'Note is already forked' };
      }

      // Create forked note
      const forkedNoteData = {
        title: `Fork: ${originalNote.title}`,
        content: originalNote.content,
        is_public: false, // Forks start as private
        userId: userId,
      };

      const { data: forkedNote, error: createNoteError } = await NotesService.createNote(forkedNoteData);
      if (createNoteError) throw new Error(createNoteError);

      // Update forked note with forked_from reference
      const { error: updateError } = await supabase
        .from('notes')
        .update({ forked_from: originalNoteId })
        .eq('id', forkedNote.id);

      if (updateError) throw updateError;

      // Create fork record
      const { data: forkRecord, error: forkError } = await supabase
        .from('forks')
        .insert([{
          user_id: userId,
          original_note_id: originalNoteId,
          forked_note_id: forkedNote.id,
        }])
        .select()
        .single();

      if (forkError) throw forkError;

      return { 
        data: { 
          forkedNote: { ...forkedNote, forked_from: originalNoteId }, 
          forkRecord 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Fork note error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자가 포크한 노트 목록
  async getUserForks(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('forks')
        .select(`
          *,
          original_note:original_note_id (
            id,
            title,
            profiles:user_id (
              id,
              username,
              avatar_url
            )
          ),
          forked_note:forked_note_id (
            *,
            profiles:user_id (
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get user forks error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트의 포크 목록
  async getNoteForks(noteId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('forks')
        .select(`
          *,
          forked_note:forked_note_id (
            *,
            profiles:user_id (
              id,
              username,
              avatar_url
            )
          ),
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('original_note_id', noteId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get note forks error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트를 별표한 사용자 목록
  async getNoteStars(noteId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('note_id', noteId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get note stars error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자 활동 피드 (팔로잉한 사용자들의 활동)
  async getActivityFeed(userId, limit = 20, offset = 0) {
    try {
      // Get notes first
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (notesError) {
        throw notesError;
      }
      
      if (!notes || notes.length === 0) {
        return { data: [], error: null };
      }
      
      // Get unique user IDs from notes
      const userIds = [...new Set(notes.map(note => note.user_id))];
      
      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
        
      if (profilesError) {
        console.warn('Could not load profiles:', profilesError.message);
        // Return notes without profile information
        return { data: notes, error: null };
      }
      
      // Create a map of user_id to profile for quick lookup
      const profileMap = {};
      profiles?.forEach(profile => {
        profileMap[profile.user_id] = profile;
      });
      
      // Add profile information to each note
      const notesWithProfiles = notes.map(note => ({
        ...note,
        profiles: profileMap[note.user_id] || null
      }));

      return { data: notesWithProfiles, error: null };
    } catch (error) {
      console.error('Get activity feed error:', error);
      return { data: null, error: error.message };
    }
  }

  // 인기 있는 작성자들
  async getPopularAuthors(limit = 10) {
    try {
      // First try the complex query with relationships
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          notes!inner (count)
        `)
        .eq('notes.is_public', true)
        .order('notes(count)', { ascending: false })
        .limit(limit);

      if (error) {
        // If schema relationship error, fall back to simple profiles query
        console.warn('Schema relationship error, falling back to simple query:', error.message);
        
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('*')
          .limit(limit);
          
        if (simpleError) {
          throw simpleError;
        }
        
        // Return profiles without note counts
        return { data: simpleData, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get popular authors error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자의 공개 노트 통계
  async getUserPublicStats(userId) {
    try {
      // Get public notes count
      const { count: notesCount, error: notesError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true);

      if (notesError) throw notesError;

      // Get total stars received
      const { data: starData, error: starError } = await supabase
        .from('notes')
        .select(`
          star_count
        `)
        .eq('user_id', userId)
        .eq('is_public', true);

      if (starError) throw starError;

      const totalStars = starData.reduce((sum, note) => sum + (note.star_count || 0), 0);

      // Get total forks received
      const { data: forkData, error: forkError } = await supabase
        .from('notes')
        .select(`
          fork_count
        `)
        .eq('user_id', userId)
        .eq('is_public', true);

      if (forkError) throw forkError;

      const totalForks = forkData.reduce((sum, note) => sum + (note.fork_count || 0), 0);

      return { 
        data: {
          publicNotesCount: notesCount || 0,
          totalStarsReceived: totalStars,
          totalForksReceived: totalForks,
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트에 대한 상세 소셜 정보 (별표, 포크 상태 포함)
  async getNoteWithSocialInfo(noteId, currentUserId = null) {
    try {
      const { data: note, error: noteError } = await NotesService.getNoteById(noteId);
      if (noteError) throw new Error(noteError);

      let isStarred = false;
      let isForked = false;

      if (currentUserId) {
        // Check if current user starred this note
        const { isStarred: starred } = await this.isNoteStarred(noteId, currentUserId);
        isStarred = starred;

        // Check if current user forked this note
        const { data: forkData } = await supabase
          .from('forks')
          .select('id')
          .eq('original_note_id', noteId)
          .eq('user_id', currentUserId)
          .single();

        isForked = !!forkData;
      }

      return {
        data: {
          ...note,
          isStarred,
          isForked,
        },
        error: null
      };
    } catch (error) {
      console.error('Get note with social info error:', error);
      return { data: null, error: error.message };
    }
  }

  // 실시간 소셜 활동 구독
  subscribeToSocialActivity(noteId, callback) {
    const starsChannel = supabase
      .channel(`stars-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stars',
          filter: `note_id=eq.${noteId}`,
        },
        (payload) => callback('star', payload)
      );

    const forksChannel = supabase
      .channel(`forks-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forks',
          filter: `original_note_id=eq.${noteId}`,
        },
        (payload) => callback('fork', payload)
      );

    starsChannel.subscribe();
    forksChannel.subscribe();

    return {
      unsubscribe: () => {
        starsChannel.unsubscribe();
        forksChannel.unsubscribe();
      }
    };
  }
}

export default new SocialService();