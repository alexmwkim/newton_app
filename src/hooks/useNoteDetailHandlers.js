import React, { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateId, convertBlocksToContent, cleanLegacyContent } from '../utils/noteUtils';

export const useNoteDetailHandlers = (
  blocks,
  setBlocks,
  setFocusedIndex,
  keyboardVisible,
  keyboardHeight,
  scrollToFocusedInput,
  title,
  displayNote,
  isAuthor,
  noteId,
  loadingNote,
  updateNote
) => {

  const insertBlockSet = useCallback((index, blockSet, focusIndex) => {
    console.log('🎯 insertBlockSet called:', {
      index,
      blockSetLength: blockSet.length,
      blockTypes: blockSet.map(b => b.type),
      currentBlocks: blocks.length
    });
    
    const updated = [...blocks];
    // Replace current block instead of inserting after it
    updated.splice(index, 1, ...blockSet);
    
    console.log('🎯 setBlocks called with:', updated.length, 'blocks');
    console.log('🎯 Block types after update:', updated.map(b => `${b.type}(${b.id})`));
    
    setBlocks(updated);
    
    console.log('🔧 Block set inserted, triggering auto-save');
    
    setTimeout(() => {
      const targetRef = updated[focusIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(focusIndex);
        // Fast scroll for new blocks when keyboard is visible
        if (keyboardVisible && keyboardHeight > 100) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 50);
        }
      }
    }, 100);
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleAddCard = useCallback((index) => {
    console.log('🎯 handleAddCard called with index:', index);
    console.log('🎯 Current blocks count:', blocks.length);
    
    const card = {
      id: generateId(),
      type: 'card',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
      groupId: null
    };
    
    console.log('🎯 Created card object:', card.id, card.type);
    const trailingText = {
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
      groupId: null
    };
    // Focus on the card (first element in the set)
    insertBlockSet(index, [card, trailingText], index);
  }, [insertBlockSet]);

  const handleAddGrid = useCallback((index) => {
    const gridCard = {
      id: generateId(),
      type: 'grid-card',
      content: '',
      ref: React.createRef(),
      layoutMode: 'grid-left',
      groupId: null
    };
    const trailingText = {
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
      groupId: null
    };
    // Focus on the grid card (first element in the set)
    insertBlockSet(index, [gridCard, trailingText], index);
  }, [insertBlockSet]);

  const handleAddImage = useCallback(async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      const image = {
        id: generateId(),
        type: 'image',
        content: uri,
        layoutMode: 'full',
        groupId: null
      };
      const trailingText = {
        id: generateId(),
        type: 'text',
        content: '',
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null
      };
      // Focus on the trailing text after image (second element in the set)
      insertBlockSet(index, [image, trailingText], index + 1);
    }
  }, [insertBlockSet]);

  const handleDeleteBlock = useCallback((index) => {
    Alert.alert('Delete Block', 'Are you sure you want to delete this block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const updated = [...blocks];
          updated.splice(index, 1);
          setBlocks(updated);
        }
      }
    ]);
  }, [blocks, setBlocks]);

  const handleKeyPress = useCallback((block, index, key) => {
    if (key === 'Backspace') {
      if (block.content === '' && index > 0) {
        const updated = [...blocks];
        const prevBlock = updated[index - 1];
        
        if (prevBlock.type === 'text') {
          updated.splice(index, 1);
          setBlocks(updated);
          
          setTimeout(() => {
            prevBlock.ref.current?.focus();
            const textLength = prevBlock.content.length;
            prevBlock.ref.current?.setSelection(textLength, textLength);
          }, 50);
        }
      }
    }
  }, [blocks, setBlocks]);

  const handleTextChange = useCallback((id, text) => {
    console.log('✏️ Text changed in block:', id, 'New text length:', text.length);
    setBlocks(prev => prev.map(block => {
      if (block.id === id) {
        return { ...block, content: text };
      }
      return block;
    }));
  }, [setBlocks]);

  // Enhanced auto-save with proper content conversion
  useEffect(() => {
    console.log('🔄 Auto-save useEffect triggered:', {
      isAuthor,
      loadingNote,
      noteId,
      titleLength: title?.length || 0,
      blocksLength: blocks?.length || 0
    });
    
    if (!isAuthor) {
      console.log('🚫 Auto-save blocked: not author');
      return;
    }
    
    if (loadingNote) {
      console.log('🚫 Auto-save blocked: still loading');
      return;
    }
    
    if (!noteId) {
      console.log('🚫 Auto-save blocked: no noteId');
      return;
    }
    
    const timer = setTimeout(async () => {
      console.log('💾 Auto-save timer triggered after 2 seconds');
      
      const finalTitle = title?.trim() || '';
      const finalContent = convertBlocksToContent(blocks);
      
      console.log('💾 Preparing to save:', {
        noteId,
        finalTitle: finalTitle.substring(0, 50) + '...',
        titleLength: finalTitle.length,
        contentLength: finalContent.length
      });
      
      if (finalTitle.trim() || finalContent.trim()) {
        console.log('💾 Calling updateNote function...');
        try {
          const result = await updateNote(noteId, {
            title: finalTitle,
            content: finalContent
          });
          console.log('✅ Auto-save SUCCESS:', result);
        } catch (error) {
          console.error('❌ Auto-save ERROR:', error);
        }
      } else {
        console.log('💾 Auto-save skipped: no content to save');
      }
    }, 2000); // Increased delay to 2 seconds

    return () => {
      console.log('🗚 Clearing auto-save timer');
      clearTimeout(timer);
    };
  }, [title, blocks, isAuthor, noteId, loadingNote]); // Removed displayNote and updateNote from dependencies

  return {
    handleAddCard,
    handleAddGrid,
    handleAddImage,
    handleDeleteBlock,
    handleKeyPress,
    handleTextChange
  };
};