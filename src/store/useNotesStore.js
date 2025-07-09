import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNote, createFolder, createBreadcrumb } from '../types/index.js';

export const useNotesStore = create()(
  persist(
    (set, get) => ({
      items: [], // All notes and folders
      currentItemId: null,
      expandedItems: new Set(),

      // Basic CRUD actions
      addItem: (itemData) => {
        const now = new Date();
        const newItem = itemData.type === 'folder' 
          ? createFolder({
              ...itemData,
              id: Date.now().toString(),
              createdAt: now,
              updatedAt: now,
              lastModified: now,
            })
          : createNote({
              ...itemData,
              id: Date.now().toString(),
              createdAt: now,
              updatedAt: now,
              lastModified: now,
            });
        
        set(state => ({
          items: [...state.items, newItem]
        }));
        
        return newItem;
      },

      updateItem: (id, updates) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date(), lastModified: new Date() }
              : item
          )
        }));
      },

      deleteItem: (id) => {
        const deleteRecursively = (items, targetId) => {
          return items.filter(item => {
            if (item.id === targetId) return false;
            // Delete child items recursively
            return !isDescendant(item.id, targetId, items);
          });
        };

        const isDescendant = (itemId, ancestorId, items) => {
          const item = items.find(i => i.id === itemId);
          if (!item || !item.parentId) return false;
          if (item.parentId === ancestorId) return true;
          return isDescendant(item.parentId, ancestorId, items);
        };

        set(state => ({
          items: deleteRecursively(state.items, id),
          currentItemId: state.currentItemId === id ? null : state.currentItemId
        }));
      },

      // Navigation related
      setCurrentItem: (id) => {
        set({ currentItemId: id });
      },

      toggleExpanded: (id) => {
        set(state => {
          const newExpanded = new Set(state.expandedItems);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedItems: newExpanded };
        });
      },

      // Utility functions
      getItemTree: () => {
        const { items } = get();
        const buildTree = (parentId) => {
          return items
            .filter(item => item.parentId === parentId)
            .map(item => ({
              ...item,
              children: buildTree(item.id)
            }))
            .sort((a, b) => {
              // Folders first, then notes
              if (a.type === 'folder' && b.type === 'note') return -1;
              if (a.type === 'note' && b.type === 'folder') return 1;
              return a.title.localeCompare(b.title);
            });
        };
        return buildTree(null);
      },

      getItemById: (id) => {
        const { items } = get();
        return items.find(item => item.id === id) || null;
      },

      getChildren: (parentId) => {
        const { items } = get();
        return items
          .filter(item => item.parentId === parentId)
          .sort((a, b) => {
            if (a.type === 'folder' && b.type === 'note') return -1;
            if (a.type === 'note' && b.type === 'folder') return 1;
            return a.title.localeCompare(b.title);
          });
      },

      getBreadcrumbs: (itemId) => {
        const { items } = get();
        const breadcrumbs = [];
        let currentId = itemId;
        
        while (currentId) {
          const item = items.find(i => i.id === currentId);
          if (item) {
            breadcrumbs.unshift(createBreadcrumb({
              id: item.id,
              title: item.title || 'Untitled',
              type: item.type
            }));
            currentId = item.parentId;
          } else {
            break;
          }
        }
        
        return breadcrumbs;
      },

      moveItem: (itemId, newParentId) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === itemId
              ? { ...item, parentId: newParentId }
              : item
          )
        }));
      },

      // Legacy compatibility methods for existing UI
      notes: [],
      folders: [],
      currentFolderId: null,

      addNote: (noteData) => {
        const { addItem } = get();
        return addItem({
          ...noteData,
          type: 'note',
          parentId: noteData.folderId || noteData.parentId || null
        });
      },

      updateNote: (id, updates) => {
        const { updateItem } = get();
        return updateItem(id, updates);
      },

      deleteNote: (id) => {
        const { deleteItem } = get();
        return deleteItem(id);
      },

      addFolder: (folderData) => {
        const { addItem } = get();
        return addItem({
          ...folderData,
          title: folderData.name || folderData.title || 'New Folder',
          type: 'folder',
          parentId: folderData.parentId || null
        });
      },

      deleteFolder: (id) => {
        const { deleteItem } = get();
        return deleteItem(id);
      },

      setCurrentFolder: (id) => {
        const { setCurrentItem } = get();
        return setCurrentItem(id);
      },

      getFolderTree: () => {
        const { getItemTree } = get();
        return getItemTree().filter(item => item.type === 'folder');
      },

      getNotesInFolder: (folderId) => {
        const { getChildren } = get();
        return getChildren(folderId);
      },

      getFolderPath: (folderId) => {
        const { getBreadcrumbs } = get();
        return getBreadcrumbs(folderId);
      },

      getNoteById: (id) => {
        const { getItemById } = get();
        return getItemById(id);
      },

      createFolder: (folderData) => {
        const { addFolder } = get();
        return addFolder(folderData);
      },

      getAllNotes: () => {
        const { items } = get();
        return items
          .filter(item => item.type === 'note')
          .sort((a, b) => {
            const aTime = new Date(a.lastModified || a.updatedAt || a.createdAt);
            const bTime = new Date(b.lastModified || b.updatedAt || b.createdAt);
            return bTime - aTime; // Most recently modified first
          });
      },

      getPublicNotes: () => {
        const { items } = get();
        return items
          .filter(item => item.type === 'note' && item.isPublic)
          .sort((a, b) => {
            const aTime = new Date(a.lastModified || a.updatedAt || a.createdAt);
            const bTime = new Date(b.lastModified || b.updatedAt || b.createdAt);
            return bTime - aTime; // Most recently modified first
          });
      },

      getPrivateNotes: () => {
        const { items } = get();
        return items
          .filter(item => item.type === 'note' && !item.isPublic)
          .sort((a, b) => {
            const aTime = new Date(a.lastModified || a.updatedAt || a.createdAt);
            const bTime = new Date(b.lastModified || b.updatedAt || b.createdAt);
            return bTime - aTime; // Most recently modified first
          });
      }
    }),
    {
      name: 'notes-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);