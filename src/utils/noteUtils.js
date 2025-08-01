import React from 'react';
import { Platform } from 'react-native';

let blockId = 0;
export const generateId = () => `block-${blockId++}`;

// Clean legacy markdown placeholders from note content
export const cleanLegacyContent = (content) => {
  if (!content) return content;
  
  // Remove card placeholders: 📋 [Card N](#card-id)
  let cleaned = content.replace(/📋\s*\[Card\s+\d+\]\([^)]+\)/g, '');
  
  // Remove page references: 📄 [Title](pageId) or 📄 [[Title|pageId]]
  cleaned = cleaned.replace(/📄\s*\[\[([^|]+)\|([^\]]+)\]\]/g, '$1');
  cleaned = cleaned.replace(/📄\s*\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove folder references: 📁 [FolderName](#folder-id)
  cleaned = cleaned.replace(/📁\s*\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Clean up extra newlines and whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
};

// Keyboard-aware helper functions based on react-native-keyboard-aware-scroll-view
export const getKeyboardAwareConfig = () => {
  return {
    keyboardVerticalOffset: Platform.OS === 'ios' ? 56 : 0,
    extraScrollHeight: Platform.OS === 'ios' ? 80 : 100,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    enableOnAndroid: true,
    keyboardShouldPersistTaps: 'handled',
    scrollEventThrottle: 16
  };
};

// Initialize content from note data
export const parseNoteContentToBlocks = (noteData) => {
  if (!noteData || !noteData.content || !noteData.content.trim()) {
    return [
      { 
        id: generateId(), 
        type: 'text', 
        content: '', 
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null
      }
    ];
  }

  console.log('🔄 Loading note content for editing:', noteData.content);
  
  const newBlocks = [];
  const content = noteData.content;
  
  // Split by double newlines first (as saved), then process each part
  const parts = content.split('\n\n');
  
  console.log('📋 Content parts:', parts);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    
    if (!part) continue; // Skip empty parts
    
    console.log('📋 Processing part:', part);
    
    if (part.startsWith('📋 Card:')) {
      // Card block - include all content after "📋 Card:" as card content
      const cardContent = part.replace('📋 Card:', '').trim();
      console.log('📋 Found card with multiline content:', cardContent);
      newBlocks.push({
        id: generateId(),
        type: 'card',
        content: cardContent,
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null
      });
    } else if (part.startsWith('🔲 Grid:')) {
      // Grid card block - include all content after "🔲 Grid:" as grid card content
      const gridCardContent = part.replace('🔲 Grid:', '').trim();
      console.log('🔲 Found grid card with content:', gridCardContent);
      newBlocks.push({
        id: generateId(),
        type: 'grid-card',
        content: gridCardContent,
        ref: React.createRef(),
        layoutMode: 'grid-left',
        groupId: null
      });
    } else if (part.startsWith('🖼️ Image:')) {
      // Image block
      const imageUri = part.replace('🖼️ Image:', '').trim();
      console.log('🖼️ Found image with URI:', imageUri);
      newBlocks.push({
        id: generateId(),
        type: 'image',
        content: imageUri,
        layoutMode: 'full',
        groupId: null
      });
    } else {
      // Text part - could be multiple lines, split and create text blocks
      const lines = part.split('\n');
      console.log('📝 Found text part with lines:', lines);
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          newBlocks.push({
            id: generateId(),
            type: 'text',
            content: trimmedLine,
            ref: React.createRef(),
            layoutMode: 'full',
            groupId: null
          });
        }
      });
    }
  }
  
  // Ensure at least one empty block at the end
  if (newBlocks.length === 0 || newBlocks[newBlocks.length - 1].type !== 'text' || newBlocks[newBlocks.length - 1].content.trim() !== '') {
    newBlocks.push({
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
      groupId: null
    });
  }
  
  console.log('🔄 Created blocks from content:', newBlocks.map(b => ({ type: b.type, content: b.content?.substring(0, 50) || 'empty' })));
  return newBlocks;
};

// Convert blocks back to content string for saving
export const convertBlocksToContent = (blocks) => {
  console.log('🔍 All blocks before filtering:', blocks.map(b => ({ type: b.type, content: b.content?.substring(0, 50) || 'empty' })));
  
  const contentParts = [];
  
  blocks.forEach(block => {
    if (block.type === 'text' && block.content?.trim()) {
      contentParts.push(block.content);
    } else if (block.type === 'card') {
      // Save card even if empty
      const cardContent = block.content?.trim() || '';
      contentParts.push(`📋 Card: ${cardContent}`);
    } else if (block.type === 'grid-card') {
      // Save grid card even if empty
      const gridCardContent = block.content?.trim() || '';
      contentParts.push(`🔲 Grid: ${gridCardContent}`);
    } else if (block.type === 'image' && block.content) {
      contentParts.push(`🖼️ Image: ${block.content}`);
    }
  });
  
  const blockContent = contentParts.join('\n\n');
  const contentText = cleanLegacyContent(blockContent.trim());
  
  console.log('💾 Content conversion details:', {
    totalBlocks: blocks.length,
    contentParts: contentParts.length,
    rawBlockContent: blockContent.substring(0, 200) + '...',
    finalContent: contentText.substring(0, 200) + '...',
    contentLength: contentText.length
  });
  
  return contentText;
};

// Check if blocks have any content
export const hasContent = (title, blocks) => {
  const titleHasContent = title.trim().length > 0;
  const blocksHaveContent = blocks.some(block => 
    (block.type === 'text' && block.content?.trim()) ||
    (block.type === 'card' && block.content?.trim()) ||
    (block.type === 'grid-card' && block.content?.trim()) ||
    (block.type === 'image' && block.content)
  );
  return titleHasContent || blocksHaveContent;
};