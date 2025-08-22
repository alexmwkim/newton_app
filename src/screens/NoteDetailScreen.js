import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  SafeAreaView,
  InputAccessoryView,
  Alert,
  Text,
  ActivityIndicator,
  Modal,
  Image,
  Keyboard
} from 'react-native';
// SafeArea fallback - use React Native's built-in SafeAreaView instead
const useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';
import SocialInteractionBar from '../components/SocialInteractionBar';
import { UnifiedHeader } from '../shared/components/layout';

// Separated modules
import { 
  parseNoteContentToBlocks, 
  cleanLegacyContent,
  generateId 
} from '../utils/noteUtils';
import { useKeyboardHandlers } from '../hooks/useKeyboardHandlers';
import { useNoteDetailHandlers } from '../hooks/useNoteDetailHandlers';
import { NoteBlockRenderer } from '../components/NoteBlockRenderer';
import { noteDetailStyles } from '../styles/NoteDetailStyles';
import Avatar from '../components/Avatar';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';


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

const TOOLBAR_ID = 'note-detail-toolbar';

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
  console.log('🔍 NoteDetailScreen rendered with noteId:', noteId, 'note:', note?.title || 'no note');
  
  // Component state
  const { setActiveScreenHandlers, setFocusedIndex: setGlobalFocusedIndex } = useSimpleToolbar();
  const scrollRef = useRef(null);
  const titleInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef() },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loadingNote, setLoadingNote] = useState(true);
  const [storeNote, setStoreNote] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPageInfoModal, setShowPageInfoModal] = useState(false);
  const [contentInitialized, setContentInitialized] = useState(false);
  
  // Drag-to-resize states (legacy - will be replaced)
  const [cardLayoutModes, setCardLayoutModes] = useState({});
  const [dragGuideline, setDragGuideline] = useState({ visible: false, position: 'center' });
  
  // Drag and drop states
  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoverTargetBlockId, setHoverTargetBlockId] = useState(null);
  const [dragMode, setDragMode] = useState('none'); // 'none', 'resize', 'reorder'
  const [blockPositions, setBlockPositions] = useState({}); // Track block positions for drag targeting
  const [cardLayouts, setCardLayouts] = useState({}); // Simple card position tracking
  
  // Wrap setCardLayouts to track when it's called
  const trackedSetCardLayouts = useCallback((newLayouts) => {
    if (typeof newLayouts === 'function') {
      setCardLayouts(prev => {
        const result = newLayouts(prev);
        console.log('🔧 setCardLayouts function call: prev =', Object.keys(prev), '→ result =', Object.keys(result));
        return result;
      });
    } else {
      console.log('🔧 setCardLayouts direct call:', Object.keys(newLayouts));
      setCardLayouts(newLayouts);
    }
  }, []);
  const [hoveredBlockId, setHoveredBlockId] = useState(null); // Which block is being hovered over

  // Debug blockPositions changes
  useEffect(() => {
    console.log('📍 BlockPositions updated:', Object.keys(blockPositions).length, 'blocks tracked');
    Object.entries(blockPositions).forEach(([id, pos]) => {
      console.log('📍', id, ':', pos);
    });
  }, [blockPositions]);

  // Debug cardLayouts changes
  useEffect(() => {
    console.log('🎯 CardLayouts updated:', Object.keys(cardLayouts).length, 'layouts registered');
    Object.entries(cardLayouts).forEach(([id, layout]) => {
      console.log('🎯', id, ':', layout);
    });
  }, [cardLayouts]);

  // Debug blocks changes
  useEffect(() => {
    console.log('🎯 ===== BLOCKS UPDATED =====');
    console.log('🎯 Total blocks:', blocks.length);
    blocks.forEach((block, index) => {
      console.log(`🎯 Block ${index}: ${block.type} (${block.id})`);
    });
    console.log('🎯 ========================');
  }, [blocks]);


  
  // Store and auth
  const notesStore = useNotesStore();
  const { getNoteById, updateNote, deleteNote, toggleFavorite, isFavorite, toggleStarred, isStarred } = notesStore;
  const { user, profile } = useAuth();
  
  // Get current user's username for display (used for current user context)
  const getCurrentUserForDisplay = () => {
    return profile?.username || user?.username || user?.email?.split('@')[0] || 'alexkim';
  };

  // Get note author's username for display
  const getNoteAuthorForDisplay = () => {
    return displayNote?.profiles?.username || 
           displayNote?.username || 
           displayNote?.user?.username || 
           'Unknown Author';
  };
  const insets = useSafeAreaInsets();
  const styles = noteDetailStyles;

  // Get display note with fallback - memoized to prevent unnecessary re-renders
  const displayNote = useMemo(() => {
    if (storeNote) {
      return normalizeNote(storeNote);
    }
    
    // Only show loading state, don't depend on loadingNote in memo
    return {
      id: noteId || 1,
      title: 'Loading...',
      content: 'Loading note content...',
      timeAgo: 'Unknown',
      isPublic: false,
      starCount: 0,
      forkCount: 0
    };
  }, [storeNote, noteId]);
  
  // Check if user is author
  const isAuthor = useMemo(() => {
    if (!displayNote || !user) return false;
    return displayNote.user_id === user.id || !displayNote.user_id;
  }, [displayNote?.user_id, user?.id]);

  // Use separated hooks
  const { keyboardVisible, keyboardHeight, scrollToFocusedInput, preventNextAutoScroll } = useKeyboardHandlers(
    focusedIndex, 
    blocks, 
    scrollRef, 
    titleInputRef
  );

  const { handleAddCard, handleAddGrid, handleAddImage, handleDeleteBlock, handleKeyPress, handleTextChange } = useNoteDetailHandlers(
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
  );

  // Register handlers with global toolbar
  useEffect(() => {
    if (isAuthor) {
      setActiveScreenHandlers({
        handleAddCard,
        handleAddGrid,
        handleAddImage
      });
    }
    
    return () => {
      setActiveScreenHandlers(null);
    };
  }, [handleAddCard, handleAddGrid, handleAddImage, setActiveScreenHandlers, isAuthor]);

  // Sync focusedIndex with global toolbar
  useEffect(() => {
    setGlobalFocusedIndex(focusedIndex);
  }, [focusedIndex, setGlobalFocusedIndex]);

  
  // Load note data - SINGLE useEffect to prevent loops
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounted
    
    const loadNote = async () => {
      console.log('🔍 ===== LOAD NOTE STARTED =====');
      console.log('🔍 Loading note for ID:', noteId);
      console.log('🔍 Passed note prop:', note ? `${note.title} (${note.id})` : 'no note prop');
      
      if (!isMounted) return;
      setLoadingNote(true);
      setContentInitialized(false);
      
      // PRIORITY 1: Use passed note if available
      if (note && note.title !== undefined) {
        console.log('✅ Using passed note (PRIORITY 1):', note.title);
        if (isMounted) {
          setStoreNote(note);
          setLoadingNote(false);
        }
        console.log('🔍 ===== LOAD NOTE COMPLETED (used passed note) =====');
        return;
      }
      
      // PRIORITY 2: Try to get note from store
      try {
        console.log('🔄 Calling getNoteById...');
        const foundNote = await getNoteById(noteId);
        
        if (!isMounted) return;
        
        if (foundNote && foundNote.title) {
          console.log('✅ getNoteById SUCCESS:', foundNote.title);
          setStoreNote(foundNote);
        } else {
          console.log('⚠️ getNoteById returned empty/null result');
          throw new Error('Note not found or empty result');
        }
        
      } catch (error) {
        console.error('❌ getNoteById failed:', error?.message);
        
        if (!isMounted) return;
        
        // PRIORITY 3: Create fallback note to prevent infinite loading
        console.log('🔄 Creating fallback note to prevent infinite loading');
        const fallbackNote = {
          id: noteId,
          title: 'Note Not Found',
          content: 'This note could not be loaded. It may not exist or there may be a connection issue.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: false,
          user_id: user?.id || null
        };
        
        setStoreNote(fallbackNote);
      } finally {
        if (isMounted) {
          console.log('🏁 setLoadingNote(false) called');
          setLoadingNote(false);
          console.log('🔍 ===== LOAD NOTE COMPLETED =====');
        }
      }
    };

    // More lenient noteId validation - accept any truthy value
    if (noteId && noteId !== 'MISSING_NOTE_ID' && noteId !== 'undefined' && noteId !== 'null') {
      console.log('🚀 Starting loadNote for noteId:', noteId);
      loadNote();
    } else {
      console.warn('⚠️ NoteDetailScreen: noteId is missing or invalid:', noteId);
      console.warn('⚠️ Creating empty fallback note');
      
      const emptyNote = {
        id: 'empty',
        title: 'Empty Note',
        content: 'This is a new empty note.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        user_id: user?.id || null
      };
      
      setStoreNote(emptyNote);
      setLoadingNote(false);
    }
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [noteId]); // ONLY noteId dependency to prevent infinite loops
  
  // Initialize content from note data - only run once when note loads
  useEffect(() => {
    if (displayNote && !loadingNote && displayNote.id && !contentInitialized) {
      console.log('🔄 Initializing content for note:', displayNote.id);
      console.log('🔄 DisplayNote content:', displayNote.content);
      
      setTitle(displayNote.title || '');
      
      // Convert existing content to blocks using shared utility
      if (displayNote.content && displayNote.content.trim()) {
        console.log('🔄 Content exists, parsing to blocks...');
        try {
          const newBlocks = parseNoteContentToBlocks(displayNote);
          console.log('🔄 Parsed blocks:', newBlocks.length, 'blocks');
          if (newBlocks.length > 0) {
            setBlocks(newBlocks.map(block => ({
              ...block,
              ref: React.createRef()
            })));
          } else {
            // Fallback if parsing fails
            setBlocks([
              { id: generateId(), type: 'text', content: displayNote.content || '', ref: React.createRef() }
            ]);
          }
        } catch (parseError) {
          console.log('⚠️ Content parsing failed, using fallback:', parseError);
          setBlocks([
            { id: generateId(), type: 'text', content: displayNote.content || '', ref: React.createRef() }
          ]);
        }
      } else {
        console.log('🔄 No content, creating empty text block');
        // Ensure we have at least one text block
        setBlocks([
          { id: generateId(), type: 'text', content: '', ref: React.createRef() }
        ]);
      }
      
      setContentInitialized(true);
      console.log('✅ Content initialization completed');
    }
  }, [displayNote?.id, loadingNote, contentInitialized]); // Keep essential dependencies

  // Ensure there's always an empty text block at the end

  useEffect(() => {
    // Always maintain empty text block at the end - but prevent infinite loops
    if (blocks.length === 0) {
      // Only add block if there are NO blocks at all
      setBlocks([
        { id: generateId(), type: 'text', content: '', ref: React.createRef() }
      ]);
    } else if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'text') {
      // Only add if last block is NOT text AND we have at least one block
      setBlocks(prev => ([
        ...prev,
        { id: generateId(), type: 'text', content: '', ref: React.createRef() }
      ]));
    }
  }, [blocks.length, blocks[blocks.length - 1]?.type]); // More specific dependencies

  // Header handlers
  const handleBack = useCallback(() => {
    console.log('📝 NoteDetailScreen handleBack called');
    console.log('📝 onBack prop exists:', !!onBack);
    console.log('📝 onBack type:', typeof onBack);
    if (onBack) {
      console.log('📝 Calling onBack...');
      onBack();
      console.log('📝 onBack called successfully');
    } else {
      console.log('❌ onBack prop is missing');
    }
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
    setShowPageInfoModal(true);
  }, []);

  // Format dates properly
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createdDate = displayNote.created_at || displayNote.createdAt;
  const updatedDate = displayNote.updated_at || displayNote.updatedAt;
  const createdDateFormatted = formatDate(createdDate);
  const lastModifiedFormatted = formatDate(updatedDate);
  const isPublicNote = displayNote.isPublic || displayNote.is_public;
  const authorName = displayNote.username || displayNote.author || 'Unknown';

  // Dismiss all modals and menus
  const dismissMenus = useCallback(() => {
    if (showSettingsMenu) setShowSettingsMenu(false);
    if (showPageInfoModal) setShowPageInfoModal(false);
  }, [showSettingsMenu, showPageInfoModal]);

  // Block manipulation functions
  const generateGroupId = () => `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const updateBlockLayoutMode = useCallback((blockId, layoutMode, groupId = null) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, layoutMode, groupId }
        : block
    ));
  }, []);

  const reorderBlocks = useCallback((fromIndex, toIndex) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      return newBlocks;
    });
  }, []);

  const groupBlocks = useCallback((blockId1, blockId2) => {
    const groupId = generateGroupId();
    setBlocks(prev => {
      const block1Index = prev.findIndex(b => b.id === blockId1);
      const block2Index = prev.findIndex(b => b.id === blockId2);
      
      if (block1Index === -1 || block2Index === -1) return prev;
      
      return prev.map(block => {
        if (block.id === blockId1) {
          return { ...block, layoutMode: 'grid-left', groupId };
        } else if (block.id === blockId2) {
          return { ...block, layoutMode: 'grid-right', groupId };
        }
        return block;
      });
    });
  }, []);

  const ungroupBlock = useCallback((blockId) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, layoutMode: 'full', groupId: null }
        : block
    ));
  }, []);

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
    <>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'height' : 'height'}
        keyboardVerticalOffset={0} // 오프셋 제거
        enabled={true}
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
                name="bookmark" 
                size={16} 
                color={isFavorite(noteId) ? Colors.floatingButton : Colors.primaryText}
              />
              <Text style={styles.menuItemText}>
                {isFavorite(noteId) ? 'Remove from Pinned' : 'Add to Pinned'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Background touch to close menu and page info modal */}
        <TouchableWithoutFeedback 
          onPress={() => {
            if (showSettingsMenu) {
              setShowSettingsMenu(false);
            }
            if (showPageInfoModal) {
              setShowPageInfoModal(false);
            }
            // Don't call Keyboard.dismiss() here to prevent interference with TextInput focus
          }}
          style={{ flex: 1 }}
        >
          <View 
            style={{ flex: 1 }}
            onTouchStart={() => {
              dismissMenus();
            }}
          >
            {/* Header */}
            <UnifiedHeader
              showBackButton={true}
              onBackPress={handleBack}
              rightElements={[
                // Status icon (지구본/자물쇠)
                {
                  component: (
                    <View style={styles.statusIcon}>
                      <Icon 
                        name={displayNote.isPublic ? "globe" : "lock"} 
                        size={16} 
                        color={Colors.secondaryText} 
                      />
                    </View>
                  )
                },
                // Star button (퍼블릭 노트일 때만)
                ...(displayNote.isPublic ? [{
                  component: (
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
                  )
                }] : []),
                // Fork button (퍼블릭 노트일 때만)
                ...(displayNote.isPublic ? [{
                  name: 'git-branch',
                  size: 20,
                  color: Colors.secondaryText,
                  onPress: () => {
                    console.log('Fork button pressed');
                  }
                }] : []),
                // Settings button (항상 표시)
                {
                  name: 'more-horizontal',
                  size: 24,
                  color: Colors.primaryText,
                  onPress: handleSettingsPress
                }
              ]}
            />

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.scrollContent, {
                paddingBottom: 0 // 완전히 제거 - 툴바 위 여백 없애기
              }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              scrollEnabled={!dragGuideline.visible && dragMode === 'none'}
              showsVerticalScrollIndicator={true}
              automaticallyAdjustContentInsets={false}
              onTouchStart={() => {
                dismissMenus();
              }}
            >
              {/* Drag Guidelines */}
              {dragGuideline.visible && (
                <View style={[
                  styles.dragGuideline,
                  dragGuideline.position === 'left' && styles.dragGuidelineLeft,
                  dragGuideline.position === 'right' && styles.dragGuidelineRight
                ]} />
              )}
              
              {/* Author info for public notes */}
              {displayNote.isPublic && (
                <View style={styles.authorSection}>
                  <View style={styles.authorInfo}>
                    <Avatar
                      size="medium"
                      imageUrl={getConsistentAvatarUrl({
                        userId: displayNote.user_id,
                        currentUser: user,
                        currentProfile: profile,
                        currentProfilePhoto: profile?.avatar_url,
                        profiles: displayNote.profiles,
                        avatarUrl: displayNote.avatar_url || displayNote.user?.avatar_url,
                        username: getNoteAuthorForDisplay()
                      })}
                      username={getConsistentUsername({
                        userId: displayNote.user_id,
                        currentUser: user,
                        currentProfile: profile,
                        profiles: displayNote.profiles,
                        username: displayNote.username
                      })}
                    />
                    <View style={styles.authorDetails}>
                      <Text style={styles.authorName}>{getNoteAuthorForDisplay()}</Text>
                      <Text style={styles.authorUserId}>@{getNoteAuthorForDisplay()}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Social Interaction Bar for public notes or when viewing others' notes */}
              {displayNote && (displayNote.isPublic || displayNote.user_id !== user?.id) && (
                <SocialInteractionBar
                  noteId={displayNote.id}
                  authorId={displayNote.user_id || displayNote.userId}
                  initialStarCount={displayNote.starCount || displayNote.star_count || 0}
                  initialForkCount={displayNote.forkCount || displayNote.fork_count || 0}
                />
              )}

              {/* Title Input */}
              <TextInput
                ref={titleInputRef}
                style={styles.titleInput}
                placeholder="Title"
                value={title}
                onChangeText={(newTitle) => {
                  console.log('🏷️ Title changed:', newTitle.length, 'characters');
                  setTitle(newTitle);
                }}
                onPressIn={() => {
                  console.log('🎯 Title input pressed');
                  dismissMenus();
                }}
                onFocus={() => {
                  dismissMenus();
                  setFocusedIndex(-1);
                }}
                onContentSizeChange={({ nativeEvent }) => {
                  console.log('📏 Title content size changed:', nativeEvent.contentSize);
                  // No action needed - KeyboardAvoidingView handles positioning
                }}
                multiline
                scrollEnabled={false}
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                editable={isAuthor}
              />

              {/* Content Blocks */}
              <View style={styles.blocksContainer}>
                {blocks.map((block, index) => (
                  <View key={`container-${block.id}`}>
                    {/* Drop zone indicator before each block (except first) */}
                    {index > 0 && dragMode === 'reorder' && draggingBlockId && (
                      <View 
                        style={[
                          styles.dropZoneIndicator,
                          hoverTargetBlockId === block.id && styles.dropZoneActive
                        ]} 
                      />
                    )}
                    
                    <NoteBlockRenderer
                      key={block.id}
                      block={block}
                      index={index}
                      blocks={blocks} // Pass blocks array for reorder logic
                      setBlocks={setBlocks} // Add setBlocks for reordering
                    handleTextChange={handleTextChange}
                    setFocusedIndex={setFocusedIndex}
                    keyboardVisible={keyboardVisible}
                    keyboardHeight={keyboardHeight}
                    scrollToFocusedInput={scrollToFocusedInput}
                    handleKeyPress={handleKeyPress}
                    handleDeleteBlock={handleDeleteBlock}
                    // Legacy props
                    cardLayoutModes={cardLayoutModes}
                    setCardLayoutModes={setCardLayoutModes}
                    dragGuideline={dragGuideline}
                    setDragGuideline={setDragGuideline}
                    // New drag and drop props
                    draggingBlockId={draggingBlockId}
                    dragPosition={dragPosition}
                    hoverTargetBlockId={hoverTargetBlockId}
                    dragMode={dragMode}
                    setDraggingBlockId={setDraggingBlockId}
                    setDragPosition={setDragPosition}
                    setHoverTargetBlockId={setHoverTargetBlockId}
                    setDragMode={setDragMode}
                    updateBlockLayoutMode={updateBlockLayoutMode}
                    reorderBlocks={reorderBlocks}
                    groupBlocks={groupBlocks}
                    ungroupBlock={ungroupBlock}
                    // Block position tracking
                    blockPositions={blockPositions}
                    setBlockPositions={(newPositions) => {
                      console.log('📍 NoteDetailScreen setBlockPositions called');
                      setBlockPositions(newPositions);
                    }}
                    // Simple card layout tracking
                    cardLayouts={cardLayouts}
                    setCardLayouts={trackedSetCardLayouts}
                    hoveredBlockId={hoveredBlockId}
                    setHoveredBlockId={setHoveredBlockId}
                    isAuthor={isAuthor}
                    dismissMenus={dismissMenus}
                    preventNextAutoScroll={preventNextAutoScroll}
                    toolbarId={TOOLBAR_ID}
                    useGlobalKeyboard={true}
                    />
                  </View>
                ))}
              </View>

              <TouchableWithoutFeedback
                onPress={() => {
                  console.log('🎯 Empty space touched, focusing last text block');
                  // Close all modals/menus if open
                  if (showPageInfoModal || showSettingsMenu) {
                    dismissMenus();
                    return; // Don't focus input if closing modal/menu
                  }
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

      </KeyboardAvoidingView>
    </SafeAreaView>


    {/* Page Info Modal */}
    <Modal
        visible={showPageInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPageInfoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPageInfoModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.pageInfoModal}>
                <View style={styles.pageInfoHeader}>
                  <Text style={styles.pageInfoTitle}>Page Information</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPageInfoModal(false)}
                    style={styles.pageInfoCloseButton}
                  >
                    <Icon name="x" size={20} color={Colors.primaryText} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pageInfoContent}>
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Title</Text>
                    <Text style={styles.pageInfoValue}>{displayNote.title || 'Untitled'}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Created</Text>
                    <Text style={styles.pageInfoValue}>{createdDateFormatted}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Last Modified</Text>
                    <Text style={styles.pageInfoValue}>{lastModifiedFormatted}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Author</Text>
                    <Text style={styles.pageInfoValue}>{authorName}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Visibility</Text>
                    <View style={styles.visibilityContainer}>
                      <Icon 
                        name={isPublicNote ? "globe" : "lock"} 
                        size={14} 
                        color={Colors.secondaryText} 
                        style={styles.visibilityIcon}
                      />
                      <Text style={styles.pageInfoValue}>
                        {isPublicNote ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default NoteDetailScreen;