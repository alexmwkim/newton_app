import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  TouchableOpacity,
  SafeAreaView,
  InputAccessoryView,
  Alert,
  Text,
  ActivityIndicator,
  Dimensions
} from 'react-native';
// SafeArea fallback for projects without safe-area-context
let useSafeAreaInsets;
try {
  useSafeAreaInsets = require('react-native-safe-area-context').useSafeAreaInsets;
} catch (e) {
  useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';

let blockId = 0;
const generateId = () => `block-${blockId++}`;
const TOOLBAR_ID = 'newton-toolbar';

// Clean legacy markdown placeholders from note content
const cleanLegacyContent = (content) => {
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

// Normalize note data outside component to prevent recreation
const normalizeNote = (noteData) => {
  if (!noteData) return null;
  return {
    ...noteData,
    isPublic: noteData.isPublic || noteData.is_public || false,
    username: noteData.username || noteData.profiles?.username || 'Unknown',
    starCount: noteData.star_count || noteData.starCount || 0,
    forkCount: noteData.fork_count || noteData.forkCount || 0,
    // Clean legacy markdown content
    content: cleanLegacyContent(noteData.content)
  };
};

const NoteDetailScreen = ({ 
  noteId, 
  note = null, 
  isStarredNote = false, 
  returnToScreen,
  returnToTab,
  onStarredRemove,
  onBack, 
  navigation,
  route,
  onEdit,
  onFork,
  onUnstar
}) => {
  console.log('🔍 NoteDetailScreen loaded with noteId:', noteId);
  
  // Component state
  const scrollRef = useRef(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef() },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loadingNote, setLoadingNote] = useState(true);
  const [storeNote, setStoreNote] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardScreenY, setKeyboardScreenY] = useState(0);
  
  // Store and auth
  const notesStore = useNotesStore();
  const { getNoteById, updateNote, deleteNote, toggleFavorite, isFavorite, toggleStarred, isStarred } = notesStore;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Test updateNote function on component mount
  useEffect(() => {
    if (updateNote && noteId) {
      console.log('🧪 Testing updateNote function availability:', {
        updateNoteExists: typeof updateNote === 'function',
        noteId,
        notesStoreKeys: Object.keys(notesStore)
      });
    }
  }, [updateNote, noteId, notesStore]);
  
  // Load note data
  useEffect(() => {
    const loadNote = async () => {
      console.log('🔍 Loading note for ID:', noteId);
      setLoadingNote(true);
      
      if (note && note.title !== undefined) {
        console.log('✅ Using passed note:', note.title);
        setStoreNote(note);
        setLoadingNote(false);
        return;
      }
      
      try {
        const foundNote = await getNoteById(noteId);
        console.log('📋 Found note:', foundNote?.title || 'not found');
        setStoreNote(foundNote);
      } catch (error) {
        console.error('❌ Error loading note:', error);
        setStoreNote(null);
      } finally {
        setLoadingNote(false);
      }
    };

    if (noteId) {
      loadNote();
    } else {
      console.warn('⚠️ NoteDetailScreen: noteId is missing');
      setLoadingNote(false);
    }
  }, [noteId]);
  
  // Get display note with fallback
  const displayNote = normalizeNote(storeNote) || {
    id: noteId || 1,
    title: loadingNote ? 'Loading...' : 'Note Not Found',
    content: loadingNote ? 'Loading note content...' : 'This note could not be found.',
    timeAgo: 'Unknown',
    isPublic: false,
    starCount: 0,
    forkCount: 0
  };
  
  // Check if user is author
  const isAuthor = useMemo(() => {
    if (!displayNote || !user) return false;
    return displayNote.user_id === user.id || !displayNote.user_id; // Allow editing if no user_id set
  }, [displayNote?.user_id, user?.id]);
  
  // Initialize content from note data
  useEffect(() => {
    if (displayNote && !loadingNote) {
      setTitle(prev => prev !== displayNote.title ? (displayNote.title || '') : prev);
      
      // Convert existing content to blocks
      if (displayNote.content && displayNote.content.trim()) {
        console.log('🔄 Loading note content:', displayNote.content);
        
        const newBlocks = [];
        const content = displayNote.content;
        
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
              content: cardContent, // Keep all the multiline content within the card
              ref: React.createRef()
            });
          } else if (part.startsWith('🖼️ Image:')) {
            // Image block
            const imageUri = part.replace('🖼️ Image:', '').trim();
            console.log('🖼️ Found image with URI:', imageUri);
            newBlocks.push({
              id: generateId(),
              type: 'image',
              content: imageUri
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
                  ref: React.createRef()
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
            ref: React.createRef()
          });
        }
        
        console.log('🔄 Created blocks from content:', newBlocks.map(b => ({ type: b.type, content: b.content?.substring(0, 50) || 'empty' })));
        setBlocks(newBlocks);
      }
    }
  }, [displayNote?.id, loadingNote]);

  // Handle keyboard events and auto-scroll
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const screenHeight = event.endCoordinates.screenY;
        console.log('🎹 Keyboard event details:', {
          keyboardHeight,
          screenHeight,
          screenY: event.endCoordinates.screenY,
          endCoordinates: event.endCoordinates
        });
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);
        setKeyboardScreenY(event.endCoordinates.screenY);
        
        // Auto-scroll to focused input after keyboard appears
        setTimeout(() => {
          scrollToFocusedInput(keyboardHeight);
        }, 300); // Increased delay to ensure keyboard is fully shown
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('🎹 Keyboard hidden');
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        setKeyboardScreenY(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [focusedIndex, blocks]);

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
      console.log('💾 Auto-save timer triggered after 1 second');
      
      // Get all content from blocks (including cards)
      console.log('🔍 All blocks before filtering:', blocks.map(b => ({ type: b.type, content: b.content?.substring(0, 50) || 'empty' })));
      
      const contentParts = [];
      
      blocks.forEach(block => {
        if (block.type === 'text' && block.content?.trim()) {
          contentParts.push(block.content);
        } else if (block.type === 'card') {
          // Save card even if empty
          const cardContent = block.content?.trim() || '';
          contentParts.push(`📋 Card: ${cardContent}`);
        } else if (block.type === 'image' && block.content) {
          contentParts.push(`🖼️ Image: ${block.content}`);
        }
      });
      
      const blockContent = contentParts.join('\n\n');
      const finalTitle = title?.trim() || displayNote?.title || '';
      const finalContent = cleanLegacyContent(blockContent.trim());
      
      console.log('💾 Content conversion details:', {
        totalBlocks: blocks.length,
        contentParts: contentParts.length,
        rawBlockContent: blockContent.substring(0, 200) + '...',
        finalContent: finalContent.substring(0, 200) + '...',
        contentLength: finalContent.length
      });
      
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
          console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      } else {
        console.log('💾 Auto-save skipped: no content to save');
      }
    }, 1000);

    return () => {
      console.log('🗚 Clearing auto-save timer');
      clearTimeout(timer);
    };
  }, [title, blocks, isAuthor, noteId, loadingNote]);

  // Auto-scroll to focused input when keyboard appears
  const scrollToFocusedInput = useCallback((keyboardHeight) => {
    if (!scrollRef.current || focusedIndex < -1) return;
    
    console.log('📜 Auto-scrolling to focused input, index:', focusedIndex, 'keyboard height:', keyboardHeight);
    
    // Calculate position of focused input more accurately
    let estimatedY = 0;
    
    if (focusedIndex === -1) {
      // Title input - at the top
      estimatedY = 150; // Header (60) + title position
    } else {
      // Calculate position based on all previous elements
      const headerHeight = 60;
      const titleHeight = 80;
      const authorSectionHeight = displayNote.isPublic ? 100 : 0;
      const statsHeight = displayNote.isPublic ? 60 : 0;
      const paddingTop = 20;
      
      // Calculate height of all blocks before focused index
      let blocksBeforeHeight = 0;
      for (let i = 0; i < focusedIndex; i++) {
        const block = blocks[i];
        if (block) {
          if (block.type === 'text') {
            blocksBeforeHeight += 60;
          } else if (block.type === 'card') {
            blocksBeforeHeight += 100;
          } else if (block.type === 'image') {
            blocksBeforeHeight += 220;
          }
        }
      }
      
      estimatedY = headerHeight + titleHeight + authorSectionHeight + statsHeight + paddingTop + blocksBeforeHeight;
    }
    
    // Get screen dimensions
    const screenHeight = Dimensions.get('window').height;
    const safeAreaTop = 50; // Status bar + safe area
    const toolbarHeight = 50; // Toolbar height
    const availableScreenHeight = screenHeight - safeAreaTop - keyboardHeight - toolbarHeight;
    
    // Calculate target scroll position to center the focused input in visible area
    const targetY = Math.max(0, estimatedY - (availableScreenHeight / 3)); // Position in upper third
    
    console.log('📜 Enhanced scroll calculation:', {
      focusedIndex,
      estimatedY,
      keyboardHeight,
      screenHeight,
      availableScreenHeight,
      targetY,
      blocksCount: blocks.length
    });
    
    scrollRef.current.scrollTo({
      y: targetY,
      animated: true
    });
  }, [focusedIndex, displayNote, blocks, scrollRef]);

  // Block management functions
  const handleTextChange = (id, text) => {
    console.log('✏️ Text changed in block:', id, 'New text length:', text.length);
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: text } : b));
  };

  const insertBlockSet = (index, blockSet, focusIndex) => {
    const updated = [...blocks];
    // Replace current block instead of inserting after it
    updated.splice(index, 1, ...blockSet);
    setBlocks(updated);
    
    console.log('🔧 Block set inserted, triggering auto-save');
    
    setTimeout(() => {
      const targetRef = updated[focusIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(focusIndex);
        // Auto-scroll to the focused element
        if (keyboardVisible) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 200);
        }
      }
    }, 100);
  };

  const handleAddCard = (index) => {
    const card = {
      id: generateId(),
      type: 'card',
      content: '',
      ref: React.createRef(),
    };
    const trailingText = {
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
    };
    // Focus on the card (first element in the set)
    insertBlockSet(index, [card, trailingText], index);
  };

  const handleAddImage = async (index) => {
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
      };
      const trailingText = {
        id: generateId(),
        type: 'text',
        content: '',
        ref: React.createRef(),
      };
      // Focus on the trailing text after image (second element in the set)
      insertBlockSet(index, [image, trailingText], index + 1);
    }
  };

  const handleDeleteBlock = (index) => {
    Alert.alert('삭제 확인', '이 블록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: () => {
          const updated = [...blocks];
          updated.splice(index, 1);
          setBlocks(updated);
        }
      }
    ]);
  };

  const handleKeyPress = (block, index, key) => {
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
  };

  useEffect(() => {
    // 항상 마지막에 빈 텍스트 블록 유지
    if (blocks.length === 0 || blocks[blocks.length - 1].type !== 'text') {
      setBlocks(prev => ([
        ...prev,
        { id: generateId(), type: 'text', content: '', ref: React.createRef() }
      ]));
    }
  }, [blocks]);

  // Header handlers
  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);

  const handleSettingsPress = useCallback(() => {
    setShowSettingsMenu(!showSettingsMenu);
  }, [showSettingsMenu]);

  const handleDeleteNote = useCallback(() => {
    setShowSettingsMenu(false);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote(noteId, displayNote.isPublic);
            if (onBack) onBack();
          }
        }
      ]
    );
  }, [noteId, displayNote.isPublic, deleteNote, onBack]);

  const handlePageInfo = useCallback(() => {
    setShowSettingsMenu(false);
    const createdDate = displayNote.createdAt 
      ? new Date(displayNote.createdAt).toLocaleDateString()
      : 'Unknown';
    
    const allContent = blocks
      .filter(block => block.type === 'text')
      .map(block => block.content)
      .join('\n');
    const contentLength = allContent.length;
    const wordCount = allContent.split(/\s+/).filter(word => word.length > 0).length;
    
    Alert.alert(
      'Page Info',
      `Created: ${createdDate}\nCharacters: ${contentLength}\nWords: ${wordCount}`,
      [{ text: 'OK' }]
    );
  }, [displayNote, blocks]);

  const handleAddToPinned = useCallback(() => {
    setShowSettingsMenu(false);
    const wasPinned = isFavorite(noteId);
    toggleFavorite(noteId);
    
    Alert.alert(
      wasPinned ? 'Removed from Pinned' : 'Added to Pinned',
      wasPinned ? 'Note removed from pinned notes.' : 'Note added to pinned notes.',
      [{ text: 'OK' }]
    );
  }, [noteId, isFavorite, toggleFavorite]);
  

  const renderBlock = (block, index) => {
    if (block.type === 'text') {
      return (
        <TextInput
          key={block.id}
          ref={block.ref}
          style={styles.textInput}
          multiline
          placeholder=" "
          value={block.content}
          onChangeText={(text) => handleTextChange(block.id, text)}
          onFocus={() => {
            console.log('🎯 Text/Card block focused, index:', index, 'type:', block.type);
            setFocusedIndex(index);
            if (keyboardVisible) {
              setTimeout(() => scrollToFocusedInput(keyboardHeight), 200);
            }
          }}
          onKeyPress={({ nativeEvent }) => handleKeyPress(block, index, nativeEvent.key)}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textAlignVertical="top"
          editable={isAuthor}
          inputAccessoryViewID={TOOLBAR_ID}
        />
      );
    } else if (block.type === 'card') {
      return (
        <View key={block.id} style={styles.cardBlock}>
          <View style={styles.cardHeader}>
            <TextInput
              ref={block.ref}
              style={styles.cardTitleInput}
              placeholder="Write something"
              multiline
              value={block.content}
              onChangeText={(text) => handleTextChange(block.id, text)}
              onFocus={() => {
                console.log('🎯 Text/Card block focused, index:', index, 'type:', block.type);
                setFocusedIndex(index);
                if (keyboardVisible) {
                  setTimeout(() => scrollToFocusedInput(keyboardHeight), 200);
                }
              }}
              onKeyPress={({ nativeEvent }) => handleKeyPress(block, index, nativeEvent.key)}
                  autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              editable={isAuthor}
          inputAccessoryViewID={TOOLBAR_ID}
              placeholderTextColor={Colors.secondaryText}
            />
            <TouchableOpacity onPress={() => handleDeleteBlock(index)}>
              <Icon name="x" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (block.type === 'image') {
      return (
        <View key={block.id} style={styles.imageBlock}>
          <Image source={{ uri: block.content }} style={styles.image} />
          {isAuthor && (
            <TouchableOpacity style={styles.deleteImageBtn} onPress={() => handleDeleteBlock(index)}>
              <Icon name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return null;
  };

  // Show loading spinner
  if (loadingNote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.floatingButton} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'height' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Settings menu */}
        {showSettingsMenu && (
          <View style={styles.settingsMenu}>
            {isAuthor && (
              <>
                <TouchableOpacity onPress={handleDeleteNote} style={styles.menuItem}>
                  <Icon name="trash-2" size={16} color={Colors.primaryText} />
                  <Text style={styles.menuItemText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={handlePageInfo} style={styles.menuItem}>
              <Icon name="info" size={16} color={Colors.primaryText} />
              <Text style={styles.menuItemText}>Page Info</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddToPinned} style={styles.menuItem}>
              <Icon 
                name="paperclip" 
                size={16} 
                color={isFavorite(noteId) ? Colors.floatingButton : Colors.primaryText}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
              <Text style={styles.menuItemText}>
                {isFavorite(noteId) ? 'Remove from Pinned' : 'Add to Pinned'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Background touch to close menu */}
        <TouchableWithoutFeedback 
          onPress={() => {
            if (showSettingsMenu) {
              setShowSettingsMenu(false);
            }
            // Don't call Keyboard.dismiss() here to prevent interference with TextInput focus
          }}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color={Colors.primaryText} />
              </TouchableOpacity>
              
              <View style={styles.headerActions}>
                {/* Status icon */}
                <View style={styles.statusIcon}>
                  <Icon 
                    name={displayNote.isPublic ? "globe" : "lock"} 
                    size={16} 
                    color={Colors.secondaryText} 
                  />
                </View>
                
                {/* Action buttons for public notes */}
                {displayNote.isPublic && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => toggleStarred(noteId)}
                    >
                      {isStarred(noteId) ? (
                        <Text style={[styles.solidStar, { color: Colors.floatingButton, fontSize: 20 }]}>★</Text>
                      ) : (
                        <Text style={[styles.outlineStar, { color: Colors.secondaryText, fontSize: 20 }]}>☆</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => {
                        console.log('Fork button pressed');
                      }}
                    >
                      <Icon name="git-branch" size={20} color={Colors.secondaryText} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Settings button */}
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleSettingsPress}
                >
                  <Icon name="more-horizontal" size={20} color={Colors.primaryText} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
            >
              {/* Title Input */}
              <TextInput
                style={styles.titleInput}
                placeholder="제목을 입력하세요"
                value={title}
                onChangeText={(newTitle) => {
                  console.log('🏷️ Title changed:', newTitle.length, 'characters');
                  setTitle(newTitle);
                }}
                onFocus={() => {
                  console.log('🎯 Title input focused');
                  setFocusedIndex(-1);
                  if (keyboardVisible) {
                    setTimeout(() => scrollToFocusedInput(keyboardHeight), 200);
                  }
                }} // Special index for title
                multiline
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                editable={isAuthor}
          inputAccessoryViewID={TOOLBAR_ID}
                inputAccessoryViewID={TOOLBAR_ID}
              />

              {/* Author info for public notes */}
              {displayNote.isPublic && (
                <View style={styles.authorSection}>
                  <View style={styles.authorInfo}>
                    <View style={styles.authorAvatar}>
                      <Icon name="user" size={20} color={Colors.secondaryText} />
                    </View>
                    <View style={styles.authorDetails}>
                      <Text style={styles.authorName}>{displayNote.username || 'Unknown'}</Text>
                      <Text style={styles.authorUserId}>@{displayNote.username || 'unknown'}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Stats for public notes */}
              {displayNote.isPublic && (
                <View style={styles.publicStats}>
                  <Text style={styles.statCount}>
                    {displayNote.starCount || 0} stars
                  </Text>
                  <Text style={styles.statCount}>
                    {displayNote.forkCount || 0} forks
                  </Text>
                  {!isAuthor && (
                    <View style={styles.readOnlyIndicator}>
                      <Icon name="eye" size={16} color={Colors.secondaryText} />
                      <Text style={styles.readOnlyText}>Read only</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Content Blocks */}
              {blocks.map((block, index) => (
                <View key={block.id}>{renderBlock(block, index)}</View>
              ))}

              <TouchableWithoutFeedback
                onPress={() => {
                  console.log('🎯 Empty space touched, focusing last text block');
                  const lastTextBlock = blocks.filter(b => b.type === 'text').pop();
                  if (lastTextBlock?.ref?.current) {
                    lastTextBlock.ref.current.focus();
                    setFocusedIndex(blocks.indexOf(lastTextBlock));
                  }
                }}
              >
                <View style={styles.touchableSpacer} />
              </TouchableWithoutFeedback>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>

        {/* Native InputAccessoryView - properly attached to keyboard */}
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={TOOLBAR_ID}>
            <View style={[styles.nativeToolbar, {
              paddingBottom: insets.bottom,
              marginBottom: -insets.bottom,
              height: 50 + insets.bottom,
            }]}>
              {isAuthor ? (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔧 Adding card at current line, index:', focusedIndex);
                      handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
                    }}
                    style={styles.toolbarBtn}
                  >
                    <Icon name="square" size={24} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔧 Adding grid at current line, index:', focusedIndex);
                      // TODO: implement grid functionality
                    }}
                    style={styles.toolbarBtn}
                  >
                    <Icon name="grid" size={24} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('🔧 Adding image at current line, index:', focusedIndex);
                      handleAddImage(focusedIndex >= 0 ? focusedIndex : 0);
                    }}
                    style={styles.toolbarBtn}
                  >
                    <Icon name="image" size={24} color="#333" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.readOnlyToolbar}>
                  <Text style={styles.readOnlyToolbarText}>Read-only mode</Text>
                </View>
              )}
            </View>
          </InputAccessoryView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Layout.spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statusIcon: {
    backgroundColor: Colors.noteCard,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.sm,
  },
  solidStar: {
    textAlign: 'center',
    lineHeight: 20,
  },
  outlineStar: {
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 140,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    color: Colors.primaryText,
  },
  authorSection: {
    marginBottom: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  authorUserId: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  publicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.screen.padding,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius / 2,
    marginLeft: 'auto',
  },
  readOnlyText: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  settingsMenu: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    paddingVertical: Layout.spacing.sm,
    minWidth: 150,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1, 
    shadowRadius: 8,
    elevation: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 9999,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  menuItemText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    marginBottom: 8,
    backgroundColor: 'transparent',
    color: Colors.primaryText,
  },
  cardBlock: {
    backgroundColor: Colors.noteCard,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  cardTitleInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.primaryText,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
  },
  imageBlock: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0006',
    padding: 6,
    borderRadius: 20,
  },
  touchableSpacer: {
    height: 300,
    backgroundColor: 'transparent',
  },
  inputAccessoryContainer: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
  },
  nativeToolbar: {
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
    borderTopWidth: 0,
    // Dynamic padding and margin applied inline
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
    borderTopWidth: 0, // Remove border to eliminate potential white line
    justifyContent: 'flex-start',
    height: 50,
  },
  toolbarBtn: {
    padding: 6,
  },
  readOnlyToolbar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  readOnlyToolbarText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  savingButton: {
    opacity: 0.7,
  },
});

export default NoteDetailScreen;