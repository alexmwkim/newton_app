import { create } from 'zustand';
import NotesService from '../services/notes';
import SocialService from '../services/social';
import { supabase } from '../services/supabase';

export const useSupabaseNotesStore = create((set, get) => ({
  // State
  notes: [],
  publicNotes: [],
  starredNotes: [],
  currentNote: null,
  loading: false,
  error: null,
  subscriptions: new Map(),

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Notes CRUD
  createNote: async (noteData) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.createNote(noteData);
      
      if (error) throw new Error(error);

      set(state => ({
        notes: [data, ...state.notes],
        loading: false
      }));

      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateNote: async (noteId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.updateNote(noteId, updates);
      
      if (error) throw new Error(error);

      set(state => ({
        notes: state.notes.map(note => 
          note.id === noteId ? data : note
        ),
        currentNote: state.currentNote?.id === noteId ? data : state.currentNote,
        loading: false
      }));

      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },


  deleteNote: async (noteId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await NotesService.deleteNote(noteId);
      
      if (error) throw new Error(error);

      set(state => ({
        notes: state.notes.filter(note => note.id !== noteId),
        currentNote: state.currentNote?.id === noteId ? null : state.currentNote,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch operations
  fetchUserNotes: async (userId, isPublic = null) => {
    try {
      console.log('📥 fetchUserNotes called with userId:', userId, 'isPublic:', isPublic);
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.getUserNotes(userId, isPublic);
      
      if (error) {
        console.error('❌ fetchUserNotes error:', error);
        throw new Error(error);
      }

      console.log('✅ fetchUserNotes success, data:', data);
      console.log('📊 Setting notes count:', data?.length || 0);
      set({ notes: data || [], loading: false });
      return data;
    } catch (error) {
      console.error('❌ fetchUserNotes exception:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPublicNotes: async (orderBy = 'created_at') => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.getPublicNotes(20, 0, orderBy);
      
      if (error) throw new Error(error);

      set({ publicNotes: data || [], loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchStarredNotes: async (userId) => {
    try {
      console.log('⭐ 🔄 fetchStarredNotes ENABLED - fetching starred notes for user:', userId);
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.getStarredNotes(userId);
      
      if (error) {
        console.error('⭐ ❌ fetchStarredNotes error:', error);
        throw new Error(error);
      }
      
      console.log('⭐ ✅ fetchStarredNotes successful - loaded', data?.length || 0, 'starred notes');
      set({ starredNotes: data || [], loading: false });
      
      return data || [];
    } catch (error) {
      console.error('⭐ 💥 fetchStarredNotes failed, falling back to empty array:', error);
      set({ starredNotes: [], loading: false, error: error.message });
      return [];
    }
  },

  fetchNoteById: async (noteId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.getNoteById(noteId);
      
      if (error) throw new Error(error);

      set({ currentNote: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Social features
  starNote: async (noteId, userId) => {
    try {
      const { error } = await SocialService.starNote(noteId, userId);
      
      if (error) throw new Error(error);

      // Optimistically update UI
      set(state => ({
        notes: state.notes.map(note => 
          note.id === noteId ? { ...note, star_count: (note.star_count || 0) + 1 } : note
        ),
        publicNotes: state.publicNotes.map(note => 
          note.id === noteId ? { ...note, star_count: (note.star_count || 0) + 1 } : note
        ),
        currentNote: state.currentNote?.id === noteId 
          ? { ...state.currentNote, star_count: (state.currentNote.star_count || 0) + 1 }
          : state.currentNote
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  unstarNote: async (noteId, userId) => {
    try {
      const { error } = await SocialService.unstarNote(noteId, userId);
      
      if (error) throw new Error(error);

      // Optimistically update UI
      set(state => ({
        notes: state.notes.map(note => 
          note.id === noteId ? { ...note, star_count: Math.max((note.star_count || 0) - 1, 0) } : note
        ),
        publicNotes: state.publicNotes.map(note => 
          note.id === noteId ? { ...note, star_count: Math.max((note.star_count || 0) - 1, 0) } : note
        ),
        currentNote: state.currentNote?.id === noteId 
          ? { ...state.currentNote, star_count: Math.max((state.currentNote.star_count || 0) - 1, 0) }
          : state.currentNote,
        starredNotes: state.starredNotes.filter(note => note.id !== noteId)
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  forkNote: async (noteId, userId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await SocialService.forkNote(noteId, userId);
      
      if (error) throw new Error(error);

      // Update fork count
      set(state => ({
        notes: state.notes.map(note => 
          note.id === noteId ? { ...note, fork_count: (note.fork_count || 0) + 1 } : note
        ),
        publicNotes: state.publicNotes.map(note => 
          note.id === noteId ? { ...note, fork_count: (note.fork_count || 0) + 1 } : note
        ),
        currentNote: state.currentNote?.id === noteId 
          ? { ...state.currentNote, fork_count: (state.currentNote.fork_count || 0) + 1 }
          : state.currentNote,
        loading: false
      }));

      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Search
  searchNotes: async (query, isPublic = true) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await NotesService.searchNotes(query, isPublic);
      
      if (error) throw new Error(error);

      set({ loading: false });
      return data || [];
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Real-time subscriptions
  subscribeToUserNotes: (userId) => {
    const subscription = NotesService.subscribeToUserNotes(userId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      set(state => {
        let updatedNotes = [...state.notes];
        
        switch (eventType) {
          case 'INSERT':
            updatedNotes = [newRecord, ...state.notes];
            break;
          case 'UPDATE':
            updatedNotes = state.notes.map(note => 
              note.id === newRecord.id ? newRecord : note
            );
            break;
          case 'DELETE':
            updatedNotes = state.notes.filter(note => note.id !== oldRecord.id);
            break;
        }
        
        return { 
          notes: updatedNotes,
          currentNote: state.currentNote?.id === newRecord?.id ? newRecord : state.currentNote
        };
      });
    });

    const subscriptions = get().subscriptions;
    subscriptions.set(`user-notes-${userId}`, subscription);
    set({ subscriptions });

    return subscription;
  },

  subscribeToNoteChanges: (noteId) => {
    const subscription = NotesService.subscribeToNoteChanges(noteId, (payload) => {
      const { eventType, new: newRecord } = payload;
      
      if (eventType === 'UPDATE') {
        set(state => ({
          currentNote: state.currentNote?.id === noteId ? newRecord : state.currentNote,
          notes: state.notes.map(note => 
            note.id === noteId ? newRecord : note
          )
        }));
      }
    });

    const subscriptions = get().subscriptions;
    subscriptions.set(`note-${noteId}`, subscription);
    set({ subscriptions });

    return subscription;
  },

  subscribeToSocialActivity: (noteId) => {
    const subscription = SocialService.subscribeToSocialActivity(noteId, (type, payload) => {
      const { eventType, new: newRecord } = payload;
      
      if (type === 'star' && eventType === 'INSERT') {
        set(state => ({
          notes: state.notes.map(note => 
            note.id === noteId ? { ...note, star_count: (note.star_count || 0) + 1 } : note
          ),
          currentNote: state.currentNote?.id === noteId 
            ? { ...state.currentNote, star_count: (state.currentNote.star_count || 0) + 1 }
            : state.currentNote
        }));
      }
      
      if (type === 'fork' && eventType === 'INSERT') {
        set(state => ({
          notes: state.notes.map(note => 
            note.id === noteId ? { ...note, fork_count: (note.fork_count || 0) + 1 } : note
          ),
          currentNote: state.currentNote?.id === noteId 
            ? { ...state.currentNote, fork_count: (state.currentNote.fork_count || 0) + 1 }
            : state.currentNote
        }));
      }
    });

    const subscriptions = get().subscriptions;
    subscriptions.set(`social-${noteId}`, subscription);
    set({ subscriptions });

    return subscription;
  },

  // Cleanup subscriptions
  unsubscribe: (key) => {
    const subscriptions = get().subscriptions;
    const subscription = subscriptions.get(key);
    
    if (subscription) {
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      } else {
        supabase.removeChannel(subscription);
      }
      subscriptions.delete(key);
      set({ subscriptions });
    }
  },

  unsubscribeAll: () => {
    const subscriptions = get().subscriptions;
    
    subscriptions.forEach((subscription, key) => {
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      } else {
        supabase.removeChannel(subscription);
      }
    });
    
    set({ subscriptions: new Map() });
  },

  // Utility methods
  clearNotes: () => set({ notes: [], publicNotes: [], starredNotes: [], currentNote: null }),
  
  setCurrentNote: (note) => set({ currentNote: note }),

  // Integration with existing UI components
  getAllNotes: () => {
    const { notes } = get();
    return notes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  getPublicNotes: () => {
    const { publicNotes } = get();
    return publicNotes;
  },

  getPrivateNotes: () => {
    const { notes } = get();
    return notes.filter(note => !note.is_public);
  },

  getNoteById: async (id) => {
    console.log('🔍 useSupabaseNotesStore.getNoteById 호출됨, id:', id);
    
    // First check if note exists in current store
    const { notes } = get();
    const localNote = notes.find(note => note.id === id);
    if (localNote) {
      console.log('✅ useSupabaseNotesStore에서 로컬 노트 발견:', localNote.title);
      return localNote;
    }
    
    // If not found locally, fetch from Supabase
    console.log('🔄 useSupabaseNotesStore에서 Supabase API 호출...');
    try {
      const { data, error } = await NotesService.getNoteById(id);
      if (error) {
        console.error('❌ Supabase getNoteById 에러:', error);
        return null;
      }
      
      if (data) {
        console.log('✅ Supabase에서 노트 발견:', data.title);
        // Add the note to the store
        set((state) => ({
          notes: [...state.notes.filter(n => n.id !== data.id), data]
        }));
        return data;
      }
      
      console.log('❌ 노트를 찾을 수 없음');
      return null;
    } catch (error) {
      console.error('❌ getNoteById 예외:', error);
      return null;
    }
  }
}));