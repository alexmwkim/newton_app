import { useState, useEffect } from 'react';

// Simple global state for notes
let privateNotes = [
  {
    id: 1,
    title: '📏 Scroll gap fixed - Notes have proper margin ✅ LIVE RELOAD TEST',
    timeAgo: '5 hrs ago',
  },
  {
    id: 2,
    title: 'Idea notes',
    timeAgo: '05/08/25',
  },
  {
    id: 3,
    title: 'Oio project',
    timeAgo: '10/04/24',
  },
  {
    id: 4,
    title: 'Workout session',
    timeAgo: '09/12/24',
  },
  {
    id: 5,
    title: 'Morning thoughts',
    timeAgo: '1 day ago',
  },
  {
    id: 6,
    title: 'Book reading notes',
    timeAgo: '2 days ago',
  },
  {
    id: 7,
    title: 'Meeting minutes',
    timeAgo: '3 days ago',
  },
  {
    id: 8,
    title: 'Travel plans',
    timeAgo: '1 week ago',
  },
  {
    id: 9,
    title: 'Recipe collection',
    timeAgo: '1 week ago',
  },
  {
    id: 10,
    title: 'Daily reflections',
    timeAgo: '2 weeks ago',
  },
  {
    id: 11,
    title: 'Goal setting 2024',
    timeAgo: '3 weeks ago',
  },
  {
    id: 12,
    title: 'Learning notes',
    timeAgo: '1 month ago',
  },
];

let publicNotes = [
  {
    id: 13,
    title: 'React Native Best Practices',
    timeAgo: '5 hours ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 5,
  },
  {
    id: 14,
    title: 'Design System Guide',
    timeAgo: '1 day ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 12,
  },
  {
    id: 15,
    title: 'JavaScript Performance Tips',
    timeAgo: '2 days ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 8,
  },
  {
    id: 16,
    title: 'Mobile App Architecture',
    timeAgo: '3 days ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 15,
  },
  {
    id: 17,
    title: 'UI/UX Design Principles',
    timeAgo: '1 week ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 3,
  },
  {
    id: 18,
    title: 'Remote Work Tips',
    timeAgo: '1 week ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 7,
  },
  {
    id: 19,
    title: 'Building Great Teams',
    timeAgo: '2 weeks ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 22,
  },
  {
    id: 20,
    title: 'Productivity Hacks',
    timeAgo: '2 weeks ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 11,
  },
  {
    id: 21,
    title: 'Tech Industry Insights',
    timeAgo: '3 weeks ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 6,
  },
  {
    id: 22,
    title: 'Startup Lessons Learned',
    timeAgo: '1 month ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 18,
  },
];

let folders = [];
let listeners = [];
let folderIdCounter = 1000; // Start from 1000 to avoid conflicts
let noteIdCounter = 2000; // Start from 2000 for notes in folders

// Simple store implementation
const NotesStore = {
  // Get current notes
  getPrivateNotes: () => privateNotes,
  getPublicNotes: () => publicNotes,
  
  // Get note by ID
  getNoteById: (noteId) => {
    const allNotes = [...privateNotes, ...publicNotes];
    const note = allNotes.find(note => note.id === noteId);
    console.log('🔍 NotesStore.getNoteById:', noteId, 'Found:', !!note);
    return note;
  },
  
  // Add new note
  addNote: (noteData) => {
    console.log('📝 NotesStore.addNote called with:', noteData);
    
    const newNote = {
      id: Date.now(),
      title: noteData.title,
      content: noteData.content,
      timeAgo: 'Just now',
      ...(noteData.isPublic && {
        username: 'alexnwkim',
        avatarUrl: 'https://via.placeholder.com/24',
        forksCount: 0,
      })
    };
    
    if (noteData.isPublic) {
      publicNotes = [newNote, ...publicNotes];
      console.log('✅ Added to public notes, new count:', publicNotes.length);
    } else {
      privateNotes = [newNote, ...privateNotes];
      console.log('✅ Added to private notes, new count:', privateNotes.length);
    }
    
    // Notify all listeners
    listeners.forEach(listener => listener());
    
    return newNote;
  },
  
  // Update existing note
  updateNote: (noteId, updatedData) => {
    console.log('✏️ NotesStore.updateNote called with:', noteId, updatedData);
    
    // Find note in private notes
    const privateIndex = privateNotes.findIndex(note => note.id === noteId);
    if (privateIndex !== -1) {
      privateNotes[privateIndex] = {
        ...privateNotes[privateIndex],
        title: updatedData.title,
        content: updatedData.content,
        timeAgo: 'Just now', // Update time
      };
      console.log('✅ Updated private note:', privateNotes[privateIndex]);
      listeners.forEach(listener => listener());
      return privateNotes[privateIndex];
    }
    
    // Find note in public notes
    const publicIndex = publicNotes.findIndex(note => note.id === noteId);
    if (publicIndex !== -1) {
      publicNotes[publicIndex] = {
        ...publicNotes[publicIndex],
        title: updatedData.title,
        content: updatedData.content,
        timeAgo: 'Just now', // Update time
      };
      console.log('✅ Updated public note:', publicNotes[publicIndex]);
      listeners.forEach(listener => listener());
      return publicNotes[publicIndex];
    }
    
    console.log('❌ Note not found for update:', noteId);
    return null;
  },
  
  // Delete note
  deleteNote: (noteId, isPublic) => {
    if (isPublic) {
      publicNotes = publicNotes.filter(note => note.id !== noteId);
    } else {
      privateNotes = privateNotes.filter(note => note.id !== noteId);
    }
    
    // Notify all listeners
    listeners.forEach(listener => listener());
  },
  
  // Folder functions
  createFolder: (folderData) => {
    console.log('📁 NotesStore.createFolder called with:', folderData);
    
    // Generate unique ID
    folderIdCounter++;
    const folderId = folderIdCounter;
    
    const newFolder = {
      id: folderId,
      name: folderData.name,
      parentNoteId: folderData.parentNoteId,
      createdAt: new Date().toISOString(),
      notes: [], // Notes inside this folder
    };
    
    folders = [newFolder, ...folders];
    console.log('✅ Created folder:', newFolder);
    console.log('📊 Total folders now:', folders.length);
    console.log('📊 All folders:', folders.map(f => ({ id: f.id, name: f.name, parentNoteId: f.parentNoteId })));
    
    // Notify all listeners
    listeners.forEach(listener => listener());
    
    return newFolder;
  },
  
  getFolders: () => folders,
  
  getFolderById: (folderId) => {
    return folders.find(folder => folder.id === folderId);
  },
  
  getFoldersByParentNote: (noteId) => {
    return folders.filter(folder => folder.parentNoteId === noteId);
  },
  
  // Debug function
  debugFolders: () => {
    console.log('🔍 DEBUG - All folders:', folders.map(f => ({
      id: f.id,
      name: f.name,
      parentNoteId: f.parentNoteId,
      notesCount: f.notes.length
    })));
    return folders;
  },
  
  addNoteToFolder: (folderId, noteData) => {
    console.log('📝 Adding/updating note to folder:', folderId, noteData);
    
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      console.log('❌ Folder not found:', folderId);
      console.log('📊 Available folders:', folders.map(f => ({ id: f.id, name: f.name })));
      return null;
    }
    
    // Check if a note with the same title already exists in this folder
    const existingNoteIndex = folder.notes.findIndex(note => note.title === noteData.title);
    
    if (existingNoteIndex !== -1) {
      // Update existing note
      folder.notes[existingNoteIndex] = {
        ...folder.notes[existingNoteIndex],
        content: noteData.content,
        timeAgo: 'Just now',
      };
      
      console.log('✅ Updated existing note in folder:', folder.notes[existingNoteIndex]);
      
      // Notify all listeners
      listeners.forEach(listener => listener());
      
      return folder.notes[existingNoteIndex];
    } else {
      // Create new note
      noteIdCounter++;
      const noteId = noteIdCounter;
      
      const newNote = {
        id: noteId,
        title: noteData.title,
        content: noteData.content,
        timeAgo: 'Just now',
        folderId: folderId,
      };
      
      folder.notes = [newNote, ...folder.notes];
      console.log('✅ Added new note to folder:', newNote);
    }
    
    console.log('📊 Folder now has:', folder.notes.length, 'notes');
    
    // Notify all listeners
    listeners.forEach(listener => listener());
    
    return folder.notes[0];
  },
  
  // Subscribe to changes
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

// React hook to use the notes store
export const useNotesStore = () => {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = NotesStore.subscribe(() => {
      forceUpdate({});
    });
    
    return unsubscribe;
  }, []);
  
  return {
    privateNotes: NotesStore.getPrivateNotes(),
    publicNotes: NotesStore.getPublicNotes(),
    getNoteById: NotesStore.getNoteById,
    addNote: NotesStore.addNote,
    updateNote: NotesStore.updateNote,
    deleteNote: NotesStore.deleteNote,
    createFolder: NotesStore.createFolder,
    getFolders: NotesStore.getFolders,
    getFolderById: NotesStore.getFolderById,
    getFoldersByParentNote: NotesStore.getFoldersByParentNote,
    addNoteToFolder: NotesStore.addNoteToFolder,
    debugFolders: NotesStore.debugFolders,
  };
};

export default NotesStore;