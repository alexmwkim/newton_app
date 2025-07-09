// Core data types for the nested notes app

export const NoteSchema = {
  id: 'string',
  title: 'string', 
  content: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  parentId: 'string | null', // Parent note/folder ID
  type: 'note | folder', // Type of item
  children: 'Note[]', // Child notes/folders
  isExpanded: 'boolean', // Tree expansion state
  isPublic: 'boolean' // Public/private flag
};

export const BreadcrumbSchema = {
  id: 'string',
  title: 'string',
  type: 'note | folder'
};

// Helper functions for type validation
export const createNote = (data) => ({
  id: data.id || Date.now().toString(),
  title: data.title || '',
  content: data.content || '',
  createdAt: data.createdAt || new Date(),
  updatedAt: data.updatedAt || new Date(),
  parentId: data.parentId || null,
  type: data.type || 'note',
  children: data.children || [],
  isExpanded: data.isExpanded || false,
  isPublic: data.isPublic || false
});

export const createFolder = (data) => ({
  id: data.id || Date.now().toString(),
  title: data.title || data.name || 'New Folder', // Support both title and name
  content: data.content || '',
  createdAt: data.createdAt || new Date(),
  updatedAt: data.updatedAt || new Date(),
  parentId: data.parentId || null,
  type: 'folder',
  children: data.children || [],
  isExpanded: data.isExpanded || false,
  isPublic: data.isPublic || false
});

export const createBreadcrumb = (data) => ({
  id: data.id,
  title: data.title || 'Untitled',
  type: data.type || 'note'
});