import React from 'react';
import { useSupabaseNotesStore } from './useSupabaseNotesStore';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PinnedNotesService from '../services/pinned';
import SocialService from '../services/social';

// Legacy compatibility wrapper for existing UI components
// This provides the same interface as before but uses Supabase data

export const useNotesStore = () => {
  // Reduce console spam - only log when user changes
  const { user } = useAuth();
  const userIdRef = React.useRef(user?.id);
  
  if (userIdRef.current !== user?.id) {
    console.log('🚨 useNotesStore - User changed:', userIdRef.current, '->', user?.id);
    userIdRef.current = user?.id;
  }
  const supabaseStore = useSupabaseNotesStore();
  
  // Stabilize supabaseStore values to prevent unnecessary rerenders
  const stableSupabaseData = React.useMemo(() => ({
    notes: supabaseStore.notes,
    publicNotes: supabaseStore.publicNotes,
    loading: supabaseStore.loading,
    error: supabaseStore.error
  }), [supabaseStore.notes, supabaseStore.publicNotes, supabaseStore.loading, supabaseStore.error]);
  
  const [pinnedNotes, setPinnedNotes] = React.useState([]);
  const [starredNotes, setStarredNotes] = React.useState([]);

  // Load pinned and starred notes from Supabase + AsyncStorage when user changes
  React.useEffect(() => {
    console.log('🔍 Pinned/Starred useEffect triggered - user:', user?.id);
    
    if (user) { // Remove the pinnedNotes.length === 0 condition that was blocking execution
      console.log('🔄 User exists, starting pinned/starred data load for:', user.id);
      const loadData = async () => {
        try {
          console.log('🔄 Loading pinned/starred notes for user:', user.id);
          
          // Load pinned notes from Supabase first
          try {
            console.log('📌 🔄 Loading pinned notes from Supabase for user:', user.id);
            const { data: supabasePinned, error } = await PinnedNotesService.getUserPinnedNotes(user.id);
            
            console.log('📌 🔄 PinnedNotesService.getUserPinnedNotes result:', { 
              data: supabasePinned, 
              error,
              dataType: typeof supabasePinned,
              isArray: Array.isArray(supabasePinned) 
            });
            
            if (error) {
              console.error('📌 ❌ Supabase error, will fallback:', error);
              throw new Error(error);
            }
            
            if (!supabasePinned || !Array.isArray(supabasePinned)) {
              console.error('📌 ❌ Invalid data format from Supabase:', supabasePinned);
              throw new Error('Invalid data format from Supabase');
            }
            
            console.log('📌 ✅ Successfully loaded pinned notes from Supabase:', supabasePinned);
            setPinnedNotes(supabasePinned);
            console.log('📌 ✅ setPinnedNotes called with:', supabasePinned);
            
            // Sync to AsyncStorage as backup
            await AsyncStorage.setItem(`pinnedNotes_${user.id}`, JSON.stringify(supabasePinned));
            console.log('💾 ✅ Synced Supabase pinned notes to AsyncStorage:', supabasePinned);
            
          } catch (pinnedError) {
            console.error('⚠️ Supabase pinned notes error, falling back to AsyncStorage:', pinnedError);
            
            // Fallback to AsyncStorage
            const savedPinned = await AsyncStorage.getItem(`pinnedNotes_${user.id}`);
            if (savedPinned) {
              const parsedPinned = JSON.parse(savedPinned);
              console.log('📌 Fallback: Loaded pinned notes from AsyncStorage:', parsedPinned);
              setPinnedNotes(parsedPinned);
            } else {
              console.log('📌 No pinned notes found in AsyncStorage fallback');
              setPinnedNotes([]);
            }
          }

          // Load starred notes from Supabase
          try {
            console.log('⭐ 🔄 Loading starred notes from Supabase for user:', user.id);
            await supabaseStore.fetchStarredNotes?.(user.id);
            const supabaseStarred = supabaseStore.starredNotes || [];
            const starredIds = supabaseStarred.map(note => note.id);
            console.log('⭐ ✅ Successfully loaded starred notes from Supabase:', starredIds);
            setStarredNotes(starredIds);
            
            // Sync to AsyncStorage as backup
            await AsyncStorage.setItem(`starredNotes_${user.id}`, JSON.stringify(starredIds));
            console.log('💾 ✅ Synced Supabase starred notes to AsyncStorage:', starredIds);
          } catch (starredError) {
            console.error('⭐ ❌ Supabase starred notes error, falling back to AsyncStorage:', starredError);
            
            // Fallback to AsyncStorage
            const savedStarred = await AsyncStorage.getItem(`starredNotes_${user.id}`);
            if (savedStarred) {
              const parsedStarred = JSON.parse(savedStarred);
              console.log('⭐ Fallback: Loaded starred notes from AsyncStorage:', parsedStarred);
              setStarredNotes(parsedStarred);
            } else {
              console.log('⭐ No starred notes found in AsyncStorage fallback');
              setStarredNotes([]);
            }
          }
        } catch (error) {
          console.log('Error loading pinned/starred notes:', error);
        }
      };
      loadData();
    } else {
      console.log('🔍 No user found, skipping pinned/starred data load');
    }
  }, [user?.id]);

  // Save pinned notes to AsyncStorage
  const savePinned = React.useCallback(async (pinned) => {
    if (user) {
      try {
        await AsyncStorage.setItem(`pinnedNotes_${user.id}`, JSON.stringify(pinned));
        console.log('💾 Saved pinned notes to storage:', pinned);
      } catch (error) {
        console.log('Error saving pinned notes:', error);
      }
    }
  }, [user?.id]);

  // Save starred notes to AsyncStorage
  const saveStarred = React.useCallback(async (starred) => {
    if (user) {
      try {
        await AsyncStorage.setItem(`starredNotes_${user.id}`, JSON.stringify(starred));
        console.log('💾 Saved starred notes to storage:', starred);
      } catch (error) {
        console.log('Error saving starred notes:', error);
      }
    }
  }, [user?.id]);

  // Initialize data loading
  React.useEffect(() => {
    if (user) {
      console.log('🔄 Initializing notes store for user:', user.id);
      // Load initial data
      const loadData = async () => {
        try {
          console.log('📥 Loading user notes...');
          await supabaseStore.fetchUserNotes?.(user.id);
          console.log('📥 Loading public notes...');
          await supabaseStore.fetchPublicNotes?.();
          console.log('⭐ Loading starred notes...');
          await supabaseStore.fetchStarredNotes?.(user.id);
          console.log('✅ All notes loaded (including starred notes)');
        } catch (error) {
          console.error('❌ Error loading notes (continuing anyway):', error);
          // Continue anyway - schema cache issues are handled elsewhere
        }
      };
      loadData();
    }
  }, [user?.id]);

  // Use real Supabase data (not mock data) - Stabilize with useMemo
  const allUserNotes = React.useMemo(() => stableSupabaseData.notes || [], [stableSupabaseData.notes]);
  const privateNotes = React.useMemo(() => allUserNotes.filter(note => !note.is_public), [allUserNotes]);
  const userPublicNotes = React.useMemo(() => allUserNotes.filter(note => note.is_public), [allUserNotes]); // User's own public notes
  
  console.log('🔀 Using REAL SUPABASE DATA - User notes:', allUserNotes.length, 'Private:', privateNotes.length, 'User public:', userPublicNotes.length);

  // Memoize functions outside of the return object
  const getPinnedNotes = React.useCallback(() => {
    const allNotes = allUserNotes; // Use real Supabase data
    
    // Filter notes that are in pinnedNotes array (pinned notes)
    const filteredPinnedNotes = allNotes.filter(note => pinnedNotes.includes(note.id));
    
    // Sort by pinned order - most recently pinned first (latest in pinnedNotes array)
    filteredPinnedNotes.sort((a, b) => {
      const aIndex = pinnedNotes.indexOf(a.id);
      const bIndex = pinnedNotes.indexOf(b.id);
      
      // Most recently pinned (higher index in pinnedNotes array) should come first
      return bIndex - aIndex;
    });
    
    console.log('📌 getPinnedNotes - pinnedNotes array order:', pinnedNotes);
    console.log('📌 getPinnedNotes - sorted pinned notes:', filteredPinnedNotes.map(n => `${n.title}(${n.id})`));
    
    return filteredPinnedNotes;
  }, [allUserNotes, pinnedNotes]);


  const getStarredNotes = React.useCallback(() => {
    console.log('⭐ getStarredNotes called');
    console.log('⭐ Current starredNotes state:', starredNotes);
    console.log('⭐ Available supabaseStore.starredNotes:', supabaseStore.starredNotes?.length || 0, 'notes');
    
    // Use supabaseStore.starredNotes (actual note objects) if available, 
    // otherwise return empty array
    const result = supabaseStore.starredNotes || [];
    console.log('⭐ getStarredNotes returning:', result.length, 'notes');
    
    return result;
  }, [starredNotes, supabaseStore.starredNotes]);

  const togglePinned = React.useCallback(async (noteId) => {
    console.log('📌 ==========================================');
    console.log('📌 togglePinned called for noteId:', noteId);
    console.log('📌 User authenticated:', !!user, user?.id);
    console.log('📌 Current pinnedNotes state:', pinnedNotes);
    
    if (!user) {
      console.error('📌 ❌ User not authenticated, rejecting');
      return Promise.reject(new Error('User not authenticated'));
    }
    
    const newPinned = [...pinnedNotes];
    const index = newPinned.indexOf(noteId);
    const isUnpinning = index > -1;
    
    console.log('📌 Pin analysis:');
    console.log('  - noteId in pinnedNotes?', index > -1);
    console.log('  - current index:', index);
    console.log('  - action:', isUnpinning ? 'UNPIN' : 'PIN');
    console.log('  - newPinned before action:', newPinned);
    
    try {
      if (isUnpinning) {
        // Remove from pinned (unpin) - Try Supabase first
        console.log('📌 ❌ UNPINNING note from Supabase:', noteId, 'for user:', user.id);
        const unpinResult = await PinnedNotesService.unpinNote(noteId, user.id);
        console.log('📌 Unpin Supabase result:', unpinResult);
        
        if (unpinResult.error) {
          throw new Error(`Unpin failed: ${unpinResult.error}`);
        }
        
        newPinned.splice(index, 1);
        console.log('📌 ❌ Local array after unpin:', newPinned);
      } else {
        // Add to pinned (pin) - Try Supabase first
        console.log('📌 ✅ PINNING note to Supabase:', noteId, 'for user:', user.id);
        const pinResult = await PinnedNotesService.pinNote(noteId, user.id);
        console.log('📌 Pin Supabase result:', pinResult);
        
        if (pinResult.error) {
          throw new Error(`Pin failed: ${pinResult.error}`);
        }
        
        newPinned.push(noteId);
        console.log('📌 ✅ Local array after pin:', newPinned);
      }
      
      // Update local state after successful Supabase operation
      console.log('📌 🎉 Supabase operation SUCCESS - updating local state');
      console.log('📌 State change from:', pinnedNotes, 'to:', newPinned);
      setPinnedNotes(newPinned);
      console.log('📌 ✅ Local state updated with setPinnedNotes:', newPinned);
      
      // Sync to AsyncStorage as backup
      await AsyncStorage.setItem(`pinnedNotes_${user.id}`, JSON.stringify(newPinned));
      console.log('💾 ✅ Synced to AsyncStorage after Supabase success:', newPinned);
      
      const newPinnedState = !isUnpinning;
      console.log('📌 🏁 Returning new pinned state:', newPinnedState);
      console.log('📌 ==========================================');
      return Promise.resolve(newPinnedState); // Return new pinned state
    } catch (error) {
      console.error('📌 💥 SUPABASE OPERATION FAILED - using fallback');
      console.error('📌 💥 Error details:', error.message);
      console.error('📌 💥 Full error:', error);
      
      // Reset newPinned array since Supabase failed
      const fallbackPinned = [...pinnedNotes];
      
      // Fallback: Update local state and AsyncStorage only
      if (isUnpinning) {
        fallbackPinned.splice(index, 1);
        console.log('📌 💾 FALLBACK: Unpinning note locally:', noteId);
        console.log('📌 💾 FALLBACK: Local array after unpin:', fallbackPinned);
      } else {
        fallbackPinned.push(noteId);
        console.log('📌 💾 FALLBACK: Pinning note locally:', noteId);
        console.log('📌 💾 FALLBACK: Local array after pin:', fallbackPinned);
      }
      
      setPinnedNotes(fallbackPinned);
      console.log('📌 💾 FALLBACK: State updated locally:', fallbackPinned);
      
      await AsyncStorage.setItem(`pinnedNotes_${user.id}`, JSON.stringify(fallbackPinned));
      console.log('💾 💾 FALLBACK: Saved to AsyncStorage only:', fallbackPinned);
      
      const fallbackState = !isUnpinning;
      console.log('📌 🏁 FALLBACK: Returning state:', fallbackState);
      console.log('📌 ==========================================');
      return Promise.resolve(fallbackState);
    }
  }, [user, pinnedNotes]);

  const toggleFavorite = React.useCallback(async (noteId) => {
    console.log('🔄 toggleFavorite called - redirecting to togglePinned');
    console.log('🔄 noteId:', noteId);
    
    // toggleFavorite is legacy name for togglePinned - redirect to the Supabase version
    return await togglePinned(noteId);
  }, [togglePinned]);

  const toggleStarred = React.useCallback(async (noteId) => {
    console.log('⭐ ==========================================');
    console.log('⭐ toggleStarred called for noteId:', noteId);
    console.log('⭐ User authenticated:', !!user, user?.id);
    console.log('⭐ Current starredNotes state:', starredNotes);
    
    if (!user) {
      console.error('⭐ ❌ User not authenticated, rejecting');
      return Promise.reject(new Error('User not authenticated'));
    }
    
    const newStarred = [...starredNotes];
    const index = newStarred.indexOf(noteId);
    const isUnstarring = index > -1;
    
    console.log('⭐ Star analysis:');
    console.log('  - noteId in starredNotes?', index > -1);
    console.log('  - current index:', index);
    console.log('  - action:', isUnstarring ? 'UNSTAR' : 'STAR');
    console.log('  - newStarred before action:', newStarred);
    
    try {
      if (isUnstarring) {
        // Remove from starred (unstar) - Try Supabase first
        console.log('⭐ ❌ UNSTARRING note from Supabase:', noteId, 'for user:', user.id);
        const unstarResult = await SocialService.unstarNote(noteId, user.id);
        console.log('⭐ Unstar Supabase result:', unstarResult);
        
        if (unstarResult.error) {
          throw new Error(`Unstar failed: ${unstarResult.error}`);
        }
        
        newStarred.splice(index, 1);
        console.log('⭐ ❌ Local array after unstar:', newStarred);
      } else {
        // Add to starred (star) - Try Supabase first
        console.log('⭐ ✅ STARRING note to Supabase:', noteId, 'for user:', user.id);
        const starResult = await SocialService.starNote(noteId, user.id);
        console.log('⭐ Star Supabase result:', starResult);
        
        if (starResult.error) {
          throw new Error(`Star failed: ${starResult.error}`);
        }
        
        newStarred.push(noteId);
        console.log('⭐ ✅ Local array after star:', newStarred);
      }
      
      // Update local state after successful Supabase operation
      console.log('⭐ 🎉 Supabase operation SUCCESS - updating local state');
      console.log('⭐ State change from:', starredNotes, 'to:', newStarred);
      setStarredNotes(newStarred);
      console.log('⭐ ✅ Local state updated with setStarredNotes:', newStarred);
      
      // Refresh starred notes from Supabase to ensure UI/server sync
      try {
        console.log('⭐ 🔄 Refreshing starred notes from Supabase after star toggle...');
        await supabaseStore.fetchStarredNotes?.(user.id);
        console.log('⭐ ✅ Starred notes refreshed from Supabase');
      } catch (refreshError) {
        console.error('⭐ ⚠️ Failed to refresh starred notes, continuing anyway:', refreshError);
      }
      
      // Sync to AsyncStorage as backup
      await AsyncStorage.setItem(`starredNotes_${user.id}`, JSON.stringify(newStarred));
      console.log('💾 ✅ Synced to AsyncStorage after Supabase success:', newStarred);
      
      const newStarredState = !isUnstarring;
      console.log('⭐ 🏁 Returning new starred state:', newStarredState);
      console.log('⭐ ==========================================');
      return Promise.resolve(newStarredState); // Return new starred state
    } catch (error) {
      console.error('⭐ 💥 SUPABASE OPERATION FAILED - using fallback');
      console.error('⭐ 💥 Error details:', error.message);
      console.error('⭐ 💥 Full error:', error);
      
      // Reset newStarred array since Supabase failed
      const fallbackStarred = [...starredNotes];
      
      // Fallback: Update local state and AsyncStorage only
      if (isUnstarring) {
        fallbackStarred.splice(index, 1);
        console.log('⭐ 💾 FALLBACK: Unstarring note locally:', noteId);
        console.log('⭐ 💾 FALLBACK: Local array after unstar:', fallbackStarred);
      } else {
        fallbackStarred.push(noteId);
        console.log('⭐ 💾 FALLBACK: Starring note locally:', noteId);
        console.log('⭐ 💾 FALLBACK: Local array after star:', fallbackStarred);
      }
      
      setStarredNotes(fallbackStarred);
      console.log('⭐ 💾 FALLBACK: State updated locally:', fallbackStarred);
      
      await AsyncStorage.setItem(`starredNotes_${user.id}`, JSON.stringify(fallbackStarred));
      console.log('💾 💾 FALLBACK: Saved to AsyncStorage only:', fallbackStarred);
      
      const fallbackState = !isUnstarring;
      console.log('⭐ 🏁 FALLBACK: Returning state:', fallbackState);
      console.log('⭐ ==========================================');
      return Promise.resolve(fallbackState);
    }
  }, [user, starredNotes]);

  const isPinned = React.useCallback((noteId) => {
    console.log('🔍 isPinned called for noteId:', noteId);
    console.log('🔍 Current pinnedNotes state:', pinnedNotes);
    console.log('🔍 pinnedNotes type:', typeof pinnedNotes, 'Array?', Array.isArray(pinnedNotes));
    
    const pinned = pinnedNotes.includes(noteId);
    console.log('🔍 isPinned result for', noteId, ':', pinned);
    
    if (pinnedNotes.length > 0) {
      console.log('🔍 pinnedNotes details:', pinnedNotes.map((id, idx) => `${idx}: ${id}`));
    } else {
      console.log('🔍 pinnedNotes is empty array');
    }
    
    return pinned;
  }, [pinnedNotes]);

  const isFavorite = React.useCallback((noteId) => {
    console.log('🔄 isFavorite called - redirecting to isPinned for noteId:', noteId);
    
    // isFavorite is legacy name for isPinned - redirect to the detailed version
    return isPinned(noteId);
  }, [isPinned]);

  const isStarred = React.useCallback((noteId) => {
    console.log('⭐ isStarred called for noteId:', noteId);
    console.log('⭐ Current starredNotes (local IDs array):', starredNotes);
    console.log('⭐ Available supabaseStore.starredNotes (note objects):', supabaseStore.starredNotes?.length || 0, 'notes');
    
    // Check in actual starred notes from Supabase store (array of note objects)
    const supabaseStarredIds = supabaseStore.starredNotes?.map(note => note.id) || [];
    console.log('⭐ Supabase starred IDs:', supabaseStarredIds);
    
    // Also check local starredNotes array (array of IDs)
    const localStarred = starredNotes.includes(noteId);
    const supabaseStarred = supabaseStarredIds.includes(noteId);
    
    console.log('⭐ Local starred check:', localStarred);
    console.log('⭐ Supabase starred check:', supabaseStarred);
    
    // Use Supabase data as source of truth, fallback to local
    const result = supabaseStarred || localStarred;
    console.log('⭐ Final isStarred result for', noteId, ':', result);
    
    return result;
  }, [starredNotes, supabaseStore.starredNotes]);

  return React.useMemo(() => ({
    // Data (using real Supabase data)
    notes: allUserNotes,
    privateNotes: privateNotes,
    publicNotes: userPublicNotes, // Show user's own public notes for home screen
    globalPublicNotes: stableSupabaseData.publicNotes || [], // Global public notes for explore screen
    starredNotes: supabaseStore.starredNotes || [], // Re-enabled for star functionality
    loading: stableSupabaseData.loading || false,
    error: stableSupabaseData.error,

    // Actions - Re-enabled after fixing schema cache issues
    createNote: async (noteData) => {
      if (!user) {
        console.error('❌ No user authenticated for createNote');
        throw new Error('User not authenticated');
      }
      
      console.log('💾 Creating note for user:', user.id, 'with data:', noteData);
      return supabaseStore.createNote({ ...noteData, userId: user.id });
    },

    updateNote: async (noteId, updates) => {
      console.log('📝 Updating note:', noteId, 'with updates:', updates);
      return supabaseStore.updateNote(noteId, updates);
    },
    
    deleteNote: async (noteId) => {
      console.log('🗑️ Deleting note:', noteId);
      return supabaseStore.deleteNote(noteId);
    },
    
    // Fetch operations - Re-enabled
    fetchUserNotes: () => {
      if (!user) return Promise.resolve([]);
      return supabaseStore.fetchUserNotes(user.id);
    },
    
    fetchPublicNotes: () => {
      return supabaseStore.fetchPublicNotes();
    },
    
    fetchStarredNotes: () => {
      if (!user) return Promise.resolve([]);
      return supabaseStore.fetchStarredNotes(user.id);
    },

    // Social features - Re-enabled
    starNote: (noteId) => {
      if (!user) throw new Error('User not authenticated');
      return supabaseStore.starNote(noteId, user.id);
    },
    
    unstarNote: (noteId) => {
      if (!user) throw new Error('User not authenticated');
      return supabaseStore.unstarNote(noteId, user.id);
    },
    
    forkNote: (noteId) => {
      if (!user) throw new Error('User not authenticated');
      return supabaseStore.forkNote(noteId, user.id);
    },

    // UI compatibility functions
    getPinnedNotes,
    getStarredNotes,
    togglePinned,
    // Legacy compatibility
    toggleFavorite,
    toggleStarred,
    isPinned,
    // Legacy compatibility
    isFavorite,
    isStarred,

    // Legacy methods for backward compatibility - DISABLED
    getAllNotes: () => {
      console.log('📋 getAllNotes DISABLED - using mock data');
      return allUserNotes;
    },
    getPublicNotes: () => {
      console.log('🌍 getPublicNotes DISABLED - using mock data');
      return userPublicNotes;
    },
    getPrivateNotes: () => {
      console.log('🔒 getPrivateNotes DISABLED - using mock data');
      return privateNotes;
    },
    getNoteById: async (noteId) => {
      console.log('🔍 getNoteById 호출됨, noteId:', noteId);
      
      // First check if note exists in current store data
      const localNote = allUserNotes.find(note => note.id === noteId);
      if (localNote) {
        console.log('✅ 로컬 스토어에서 노트 발견:', localNote.title);
        return localNote;
      }
      
      // If not found locally, fetch from Supabase
      console.log('🔄 로컬에서 찾을 수 없음, Supabase에서 조회...');
      try {
        const result = await supabaseStore.getNoteById(noteId);
        console.log('📋 Supabase 조회 결과:', result?.title || 'not found');
        return result;
      } catch (error) {
        console.error('❌ getNoteById 에러:', error);
        return null;
      }
    },

    // Real-time subscriptions - DISABLED
    subscribeToUserNotes: () => {
      console.log('📡 subscribeToUserNotes DISABLED');
      return null;
    },

    // Cleanup - DISABLED
    clearNotes: () => {
      console.log('🧹 clearNotes DISABLED');
    },
    unsubscribeAll: () => {
      console.log('📡 unsubscribeAll DISABLED');
    },
    
    // Database cleanup - DISABLED
    clearAllPinnedNotesFromDatabase: async () => {
      console.log('🗑️ clearAllPinnedNotesFromDatabase DISABLED - using mock data mode');
      // Clear from AsyncStorage instead
      if (user) {
        await AsyncStorage.removeItem(`pinnedNotes_${user.id}`);
        setPinnedNotes([]);
      }
      return Promise.resolve();
    },
  }), [
    allUserNotes,
    privateNotes,
    userPublicNotes,
    stableSupabaseData.publicNotes,
    stableSupabaseData.loading,
    stableSupabaseData.error,
    pinnedNotes,
    starredNotes,
    user?.id,
    // Add stable function references
    getPinnedNotes,
    getStarredNotes,
    togglePinned,
    toggleFavorite,
    toggleStarred,
    isPinned,
    isFavorite,
    isStarred
  ]);
};

export default useNotesStore;