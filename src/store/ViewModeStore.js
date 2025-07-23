/**
 * View Mode Store - Note list display preferences
 * Manages: Title Only vs Content Preview view modes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// View mode constants
export const VIEW_MODES = {
  TITLE_ONLY: 'title_only',
  CONTENT_PREVIEW: 'content_preview'
};

export const VIEW_MODE_ICONS = {
  [VIEW_MODES.TITLE_ONLY]: 'list',
  [VIEW_MODES.CONTENT_PREVIEW]: 'file-text'
};

export const VIEW_MODE_NAMES = {
  [VIEW_MODES.TITLE_ONLY]: 'Title Only',
  [VIEW_MODES.CONTENT_PREVIEW]: 'Content Preview'
};

export const VIEW_MODE_DESCRIPTIONS = {
  [VIEW_MODES.TITLE_ONLY]: 'Clean list with titles only',
  [VIEW_MODES.CONTENT_PREVIEW]: 'Cards with content preview'
};

// Create view mode store with persistence
export const useViewModeStore = create(
  persist(
    (set, get) => ({
      // Current view mode
      currentViewMode: VIEW_MODES.TITLE_ONLY,
      
      // Set view mode
      setViewMode: (mode) => {
        console.log('👁️ ViewModeStore: Setting view mode to:', mode);
        set({ currentViewMode: mode });
      },
      
      // Get current view mode
      getCurrentViewMode: () => {
        return get().currentViewMode;
      },
      
      // Check if current mode is title only
      isTitleOnlyMode: () => {
        return get().currentViewMode === VIEW_MODES.TITLE_ONLY;
      },
      
      // Check if current mode is content preview
      isContentPreviewMode: () => {
        return get().currentViewMode === VIEW_MODES.CONTENT_PREVIEW;
      },
      
      // Toggle between modes
      toggleViewMode: () => {
        const current = get().currentViewMode;
        const newMode = current === VIEW_MODES.TITLE_ONLY 
          ? VIEW_MODES.CONTENT_PREVIEW 
          : VIEW_MODES.TITLE_ONLY;
        
        console.log('🔄 ViewModeStore: Toggling from', current, 'to', newMode);
        set({ currentViewMode: newMode });
        return newMode;
      }
    }),
    {
      name: 'newton-view-mode-storage',
      storage: {
        getItem: async (name) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('ViewModeStore: Error loading from storage:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('ViewModeStore: Error saving to storage:', error);
          }
        },
        removeItem: async (name) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error('ViewModeStore: Error removing from storage:', error);
          }
        }
      }
    }
  )
);

// Hook for easy access to view mode functions
export const useViewMode = () => {
  const { 
    currentViewMode, 
    setViewMode, 
    getCurrentViewMode, 
    isTitleOnlyMode, 
    isContentPreviewMode, 
    toggleViewMode 
  } = useViewModeStore();
  
  return {
    currentViewMode,
    setViewMode,
    getCurrentViewMode,
    isTitleOnlyMode,
    isContentPreviewMode,
    toggleViewMode,
    viewModes: VIEW_MODES,
    viewModeIcons: VIEW_MODE_ICONS,
    viewModeNames: VIEW_MODE_NAMES,
    viewModeDescriptions: VIEW_MODE_DESCRIPTIONS
  };
};

export default useViewMode;