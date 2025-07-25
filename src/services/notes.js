import { supabase } from './supabase';
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
        console.log('❌ No profile found for user, creating profile:', userId);
        
        // Try to create profile automatically
        try {
          const { data: user } = await supabase.auth.getUser();
          const username = user?.user?.user_metadata?.username || user?.user?.email?.split('@')[0] || 'user';
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              user_id: userId,
              username: username
            }])
            .select('id, username')
            .single();
          
          if (createError) {
            console.error('❌ Failed to create profile:', createError);
            return { data: [], error: null }; // Return empty data instead of throwing error
          }
          
          profile = newProfile;
          console.log('✅ Profile created successfully:', profile);
        } catch (createErr) {
          console.error('❌ Error creating profile:', createErr);
          return { data: [], error: null }; // Return empty data instead of throwing error
        }
      }
      
      console.log('👤 Found profile ID:', profile.id);
      
      // FIXED: Separate queries to avoid schema cache issues
      let query = supabase
        .from('notes')
        .select('*')  // Remove JOIN to avoid schema cache issues
        .eq('user_id', userId)  // Use auth user ID directly
        .order('created_at', { ascending: false });

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
  async getPublicNotes(limit = 20, offset = 0, orderBy = 'created_at') {
    try {
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
      // FIXED: Remove JOIN to avoid schema cache issues
      const { data: note, error } = await supabase
        .from('notes')
        .select('*')  // Remove JOIN
        .eq('id', noteId)
        .single();

      if (error) throw error;

      // Get profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url, bio')
        .eq('user_id', note.user_id)
        .single();

      // Add profile data manually
      const noteWithProfile = {
        ...note,
        profiles: profile || { username: 'Unknown' }
      };

      return { data: noteWithProfile, error: null };
    } catch (error) {
      console.error('Get note by ID error:', error);
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

  // 노트 업데이트
  async updateNote(noteId, updates) {
    try {
      console.log('🔧 updateNote 함수 호출됨');
      console.log('📝 파라미터 noteId:', noteId);
      console.log('📝 파라미터 updates:', JSON.stringify(updates, null, 2));
      
      // 현재 사용자 ID 확인
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      console.log('👤 현재 인증된 사용자 ID:', authUser?.user?.id);
      if (authError) {
        console.error('❌ 사용자 인증 확인 중 에러:', authError);
      }
      
      const updateData = { 
        ...updates,
        updated_at: new Date().toISOString() // Explicitly set updated_at
      };
      console.log('📊 최종 업데이트 데이터:', JSON.stringify(updateData, null, 2));
      
      // If title is being updated, update slug as well
      if (updates.title) {
        updateData.slug = this.generateSlug(updates.title);
        console.log('🔗 슬러그 생성됨:', updateData.slug);
      }

      console.log('🚀 Supabase 업데이트 쿼리 실행 중...');
      console.log('🎯 업데이트 대상 노트 ID:', noteId);
      
      // Simplified update without JOIN to avoid schema cache issues
      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Supabase 업데이트 쿼리 에러:', error);
        console.error('❌ 에러 메시지:', error.message);
        console.error('❌ 에러 세부사항:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ 업데이트 쿼리 성공!');
      console.log('📋 업데이트된 노트 데이터:', JSON.stringify(data, null, 2));

      // Get profile data separately to avoid JOIN issues
      console.log('👤 프로필 데이터 가져오는 중... user_id:', data.user_id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, username, avatar_url')
        .eq('user_id', data.user_id)
        .single();

      if (profileError) {
        console.error('⚠️ 프로필 데이터 가져오기 에러:', profileError);
      } else {
        console.log('✅ 프로필 데이터 성공:', JSON.stringify(profile, null, 2));
      }

      // Add profile data manually
      const noteWithProfile = {
        ...data,
        profiles: profile || { username: 'Unknown' }
      };

      console.log('🎉 최종 반환 데이터:', JSON.stringify(noteWithProfile, null, 2));
      return { data: noteWithProfile, error: null };
    } catch (error) {
      console.error('💥 updateNote 함수 전체 에러:', error);
      console.error('💥 에러 타입:', typeof error);
      console.error('💥 에러 스택:', error.stack);
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
          .single(),
        'getProfileForStarredNotes'
      );
      
      const profile = profileResult.data;
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