import { supabase, testSupabaseConnection } from './supabase';
import supabaseDebugger from '../utils/SupabaseDebugger';

class NotesService {
  // 노트 생성
  async createNote(noteData) {
    try {
      console.log('💾 NotesService.createNote called with:', noteData);
      
      // Get profile for metadata only - we'll use auth user ID for the note
      console.log('🔍 Getting profile for metadata...');
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, user_id, username')
        .eq('user_id', noteData.userId)
        .single();
      
      if (profileCheckError) {
        console.log('⚠️ No profile found, will create note without profile metadata');
      }
      
      console.log('🔑 Using auth user ID for note:', noteData.userId);
      
      const insertData = {
        title: noteData.title,
        content: noteData.content || '',
        is_public: noteData.isPublic || false,
        slug: noteData.slug || this.generateSlug(noteData.title),
        user_id: noteData.userId,  // Use auth user ID directly, not profile ID
        parent_note_id: noteData.parentNoteId || null, // Support parent-child relationship
        is_subpage: noteData.isSubpage || false, // Flag for subpages
      };
      console.log('📝 Inserting note data:', insertData);
      
      console.log('📝 Attempting direct insert (will likely fail due to RLS)...');
      
      // Simplified insert without JOIN to avoid schema cache issues
      const { data, error } = await supabase
        .from('notes')
        .insert([insertData])
        .select('*')
        .single();

      if (error) throw error;

      // Add profile data manually to avoid JOIN issues
      const noteWithProfile = {
        ...data,
        profiles: {
          id: profileCheck?.id || null,
          username: profileCheck?.username || 'Unknown',
          avatar_url: null
        }
      };

      return { data: noteWithProfile, error: null };
    } catch (error) {
      console.error('Create note error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자 노트 목록 조회
  async getUserNotes(userId, isPublic = null, limit = 20, offset = 0) {
    try {
      console.log('🔍 getUserNotes called with userId (auth user):', userId);
      
      // First get the profile ID for this user
      const profileResult = await supabase
        .from('profiles')
        .select('id, username')
        .eq('user_id', userId)
        .single();
      
      let profile = profileResult.data;
      const profileError = profileResult.error;
      
      if (!profile || profileError) {
        console.log('⚠️ No profile found for user:', userId);
        console.log('⚠️ Continuing with minimal profile data for notes to load');
        
        // Create minimal profile data to allow notes to load
        profile = {
          id: null,
          username: 'User'
        };
      }
      
      console.log('👤 Found profile ID:', profile.id);
      
      // FIXED: Separate queries to avoid schema cache issues
      let query = supabase
        .from('notes')
        .select('*')  // Remove JOIN to avoid schema cache issues
        .eq('user_id', userId)  // Use auth user ID directly
        .order('updated_at', { ascending: false });

      if (isPublic !== null) {
        query = query.eq('is_public', isPublic);
      }

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      console.log('📝 Executing getUserNotes query (no JOIN) for user ID:', userId);
      const { data: notes, error } = await query;

      if (error) {
        console.error('❌ getUserNotes query error:', error);
        throw error;
      }

      // Add profile data manually to avoid JOIN issues
      const notesWithProfiles = notes?.map(note => ({
        ...note,
        profiles: {
          id: profile.id,
          username: profile.username,
          avatar_url: null
        }
      })) || [];

      console.log('✅ getUserNotes success, found:', notesWithProfiles?.length || 0, 'notes');
      return { data: notesWithProfiles, error: null };
    } catch (error) {
      console.error('Get user notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 퍼블릭 노트 피드 조회
  async getPublicNotes(limit = 20, offset = 0, orderBy = 'updated_at') {
    try {
      // Test connection first
      console.log('🌐 Testing Supabase connection before fetching public notes...');
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        throw new Error('Network connection failed - cannot reach Supabase');
      }

      console.log('✅ Connection test passed, fetching public notes...');
      // FIXED: Remove JOIN to avoid schema cache issues
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')  // Remove JOIN
        .eq('is_public', true)
        .order(orderBy, { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get unique user_ids from notes
      const userIds = [...new Set(notes?.map(note => note.user_id))];
      
      // Get profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url')
        .in('user_id', userIds);

      // Manually add profile data
      const notesWithProfiles = notes?.map(note => ({
        ...note,
        profiles: profiles?.find(p => p.user_id === note.user_id) || { username: 'Unknown' }
      })) || [];

      return { data: notesWithProfiles, error: null };
    } catch (error) {
      console.error('Get public notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트 상세 조회
  async getNoteById(noteId) {
    try {
      console.log('🔍 getNoteById called with noteId:', noteId);
      
      // FIXED: Remove JOIN to avoid schema cache issues
      const { data: note, error } = await supabase
        .from('notes')
        .select('*')  // Remove JOIN
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('❌ Note query error:', error);
        throw error;
      }
      
      if (!note) {
        console.log('❌ Note not found with ID:', noteId);
        return { data: null, error: 'Note not found' };
      }

      console.log('✅ Found note:', note.title);

      // Get profile separately - handle gracefully if profile doesn't exist
      let profile = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, bio')
          .eq('user_id', note.user_id)
          .single();
          
        if (!profileError && profileData) {
          profile = profileData;
          console.log('✅ Found profile:', profile.username);
        } else {
          console.log('⚠️ Profile not found, using fallback');
        }
      } catch (profileError) {
        console.log('⚠️ Profile query failed, using fallback:', profileError);
      }

      // Add profile data manually with fallback
      const noteWithProfile = {
        ...note,
        profiles: profile || { 
          id: null,
          user_id: note.user_id,
          username: 'Unknown',
          avatar_url: null,
          bio: null
        }
      };

      console.log('✅ Returning note with profile data');
      return { data: noteWithProfile, error: null };
    } catch (error) {
      console.error('💥 Get note by ID error:', error);
      return { data: null, error: error.message };
    }
  }

  // 슬러그로 노트 조회
  async getNoteBySlug(slug, userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('slug', slug)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get note by slug error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트 업데이트 - 성능 최적화
  async updateNote(noteId, updates) {
    try {
      const updateData = { 
        ...updates,
        updated_at: new Date().toISOString() // Explicitly set updated_at
      };
      
      // If title is being updated, update slug as well
      if (updates.title) {
        updateData.slug = this.generateSlug(updates.title);
      }

      // Fast update without unnecessary auth checks and logging
      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Update note error:', error);
        throw error;
      }

      console.log('✅ Note updated successfully');

      // Return minimal data for auto-save performance
      const noteWithMinimalProfile = {
        ...data,
        profiles: { username: 'User' } // Minimal profile data for auto-save
      };

      return { data: noteWithMinimalProfile, error: null };
    } catch (error) {
      console.error('❌ Update note error:', error);
      return { data: null, error: error.message };
    }
  }


  // 노트 삭제
  async deleteNote(noteId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Delete note error:', error);
      return { data: null, error: error.message };
    }
  }

  // 노트 검색
  async searchNotes(query, isPublic = true, limit = 20, offset = 0) {
    try {
      let supabaseQuery = supabase
        .from('notes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (isPublic !== null) {
        supabaseQuery = supabaseQuery.eq('is_public', isPublic);
      }

      if (limit) {
        supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Search notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 인기 노트 조회 (별점 기준)
  async getTrendingNotes(limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('star_count', { ascending: false })
        .order('fork_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get trending notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 최근 노트 조회
  async getRecentNotes(limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get recent notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자의 별표된 노트 조회
  async getStarredNotes(userId, limit = 20, offset = 0) {
    try {
      console.log('⭐ 🔄 getStarredNotes called for userId:', userId);
      
      // First, get the profile ID for this user (stars table references profiles.id)
      const profileResult = await supabaseDebugger.wrapQuery(
        'profiles',
        () => supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .limit(1), // Use limit(1) instead of single() to avoid multiple rows error
        'getProfileForStarredNotes'
      );
      
      const profile = profileResult.data?.[0]; // Get first item from array
      if (!profile) {
        console.error('⭐ ❌ Profile not found for user:', userId);
        supabaseDebugger.logRelationshipError(
          'profiles', 
          'user_id', 
          new Error('Profile not found for starred notes query'),
          `userId: ${userId}`
        );
        throw new Error('User profile not found');
      }
      
      console.log('⭐ ✅ Profile found:', profile.id, 'for user:', userId);
      
      // STEP 1: Get starred note IDs from stars table
      console.log('🔍 RLS DEBUG: Querying stars table with profile.id:', profile.id);
      console.log('🔍 RLS DEBUG: Current auth user (for RLS):', (await supabase.auth.getUser()).data?.user?.id);
      
      const starsResult = await supabaseDebugger.wrapQuery(
        'stars',
        () => supabase
          .from('stars')
          .select('note_id, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
        `getStarredNoteIds_profileId:${profile.id}`
      );
      
      console.log('🔍 RLS DEBUG: Stars query result:', {
        hasData: !!starsResult.data,
        dataLength: starsResult.data?.length || 0,
        error: starsResult.error
      });

      const starredRecords = starsResult.data;

      if (!starredRecords || starredRecords.length === 0) {
        console.log('⭐ ℹ️ No starred notes found for user');
        return { data: [], error: null };
      }

      console.log('⭐ 📊 Found starred note IDs:', starredRecords.length, 'records');
      console.log('⭐ 📋 Starred note IDs:', starredRecords.map(s => s.note_id));

      // STEP 2: Get the actual notes using the note IDs (simple query without JOIN)
      const noteIds = starredRecords.map(s => s.note_id);
      console.log('⭐ 🔄 Querying notes for IDs:', noteIds);
      
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .in('id', noteIds);

      if (notesError) {
        console.error('⭐ ❌ Notes query error:', notesError);
        throw notesError;
      }

      console.log('⭐ 📊 Retrieved notes:', notes?.length || 0, 'notes');
      
      // STEP 3: Get profile info for each note (optional, for completeness)
      const uniqueUserIds = [...new Set(notes?.map(n => n.user_id))];
      let profilesMap = {};
      
      if (uniqueUserIds.length > 0) {
        console.log('⭐ 🔄 Fetching profiles for user IDs:', uniqueUserIds);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url')
          .in('user_id', uniqueUserIds);
        
        if (!profilesError && profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
          console.log('⭐ ✅ Profiles fetched:', Object.keys(profilesMap).length);
        } else {
          console.warn('⭐ ⚠️ Profile fetch failed, continuing without profiles:', profilesError);
        }
      }
      
      // STEP 4: Merge starred info with notes and maintain order
      const transformedData = starredRecords.map(starRecord => {
        const note = notes?.find(n => n.id === starRecord.note_id);
        if (!note) {
          console.warn('⭐ ⚠️ Note not found for starred ID:', starRecord.note_id);
          return null;
        }
        
        // Add profile info if available
        const profile = profilesMap[note.user_id];
        
        return {
          ...note,
          starred_at: starRecord.created_at,
          profiles: profile ? {
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url
          } : null,
          // Legacy field for compatibility
          username: profile?.username || 'Unknown'
        };
      }).filter(note => note !== null); // Filter out null notes

      console.log('⭐ ✅ Final transformed starred notes:', transformedData.length, 'notes');
      console.log('⭐ 📋 Starred notes details:', transformedData.map(n => `${n.title}(${n.id})`));
      
      return { data: transformedData, error: null };
    } catch (error) {
      console.error('⭐ 💥 Get starred notes error:', error);
      return { data: null, error: error.message };
    }
  }

  // 슬러그 생성 유틸리티
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .trim()
      .substring(0, 50);        // Limit length
  }

  // 사용자 권한 확인
  async checkNoteOwnership(noteId, userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('user_id')
        .eq('id', noteId)
        .single();

      if (error) throw error;

      return data.user_id === userId;
    } catch (error) {
      console.error('Check note ownership error:', error);
      return false;
    }
  }

  // 노트 접근 권한 확인 (퍼블릭이거나 소유자인지)
  async canAccessNote(noteId, userId = null) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('user_id, is_public')
        .eq('id', noteId)
        .single();

      if (error) throw error;

      return data.is_public || (userId && data.user_id === userId);
    } catch (error) {
      console.error('Check note access error:', error);
      return false;
    }
  }

  // 실시간 노트 업데이트 구독
  subscribeToNoteChanges(noteId, callback) {
    return supabase
      .channel(`note-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `id=eq.${noteId}`,
        },
        callback
      )
      .subscribe();
  }

  // 실시간 사용자 노트 구독
  subscribeToUserNotes(userId, callback) {
    return supabase
      .channel(`user-notes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
}

export default new NotesService();