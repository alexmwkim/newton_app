import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  InputAccessoryView,
  Keyboard
} from 'react-native';
// SafeArea fallback
const useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import SingleToggle from '../shared/components/form/SingleToggle';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';
import { UnifiedHeader } from '../shared/components/layout';

// Separated modules
import { 
  parseNoteContentToBlocks, 
  convertBlocksToContent, 
  hasContent,
  generateId 
} from '../utils/noteUtils';
import { useKeyboardHandlers } from '../hooks/useKeyboardHandlers';
import { useNoteInsertHandlers } from '../hooks/useNoteInsertHandlers';
import { NoteBlockRenderer } from '../components/NoteBlockRenderer';
import { createNoteStyles } from '../styles/CreateNoteStyles';

const TOOLBAR_ID = 'create-note-toolbar';

const CreateNoteScreen = ({ onBack, onSave, initialNote, navigation, note, isEditing, isForked, returnToScreen, route }) => {
  const { user, loading: authLoading, initialized } = useAuth();
  const { setActiveScreenHandlers, setFocusedIndex: setGlobalFocusedIndex } = useSimpleToolbar();
  const notesStore = useNotesStore();
  const noteData = note || initialNote;
  const styles = createNoteStyles;
  
  // Debug user state and toolbar rendering
  console.log('🔍 CreateNoteScreen - Auth state:', {
    user: !!user,
    userId: user?.id,
    authLoading,
    initialized
  });
  
  // Get initial values from route params if available
  const routeParams = route?.params || {};
  const [title, setTitle] = useState(noteData?.title || '');
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef() },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isPublic, setIsPublic] = useState(noteData?.is_public ?? routeParams.isPublic ?? false);
  const [forkedFrom, setForkedFrom] = useState(noteData?.forked_from || null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Layout mode state for drag-to-resize cards
  const [cardLayoutModes, setCardLayoutModes] = useState({});
  const [dragGuideline, setDragGuideline] = useState({ visible: false, position: 'center' });
  
  // Drag and Drop state for card reordering
  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [cardLayouts, setCardLayouts] = useState({});
  
  // New drag system states (matching NoteDetailScreen)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoverTargetBlockId, setHoverTargetBlockId] = useState(null);
  const [dragMode, setDragMode] = useState('none');
  const [blockPositions, setBlockPositions] = useState({});
  
  const scrollRef = useRef(null);
  const titleInputRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Use separated hooks
  const { keyboardVisible, keyboardHeight, scrollToFocusedInput } = useKeyboardHandlers(
    focusedIndex, 
    blocks, 
    scrollRef, 
    titleInputRef
  );

  // Drag and drop utility functions (matching NoteDetailScreen)
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
    const generateGroupId = () => `group-${Date.now()}-${Math.random()}`;
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

  // Tracked setCardLayouts function (matching NoteDetailScreen)
  const trackedSetCardLayouts = useCallback((newLayouts) => {
    if (typeof newLayouts === 'function') {
      setCardLayouts(prev => {
        const result = newLayouts(prev);
        console.log('🔧 CreateNote setCardLayouts function call: prev =', Object.keys(prev), '→ result =', Object.keys(result));
        return result;
      });
    } else {
      console.log('🔧 CreateNote setCardLayouts direct call:', Object.keys(newLayouts));
      setCardLayouts(newLayouts);
    }
  }, []);

  const { handleAddCard, handleAddGrid, handleAddImage, handleKeyPress, handleDeleteBlock, handleTextChange } = useNoteInsertHandlers(
    blocks,
    setBlocks,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput,
    cardLayoutModes,
    setCardLayoutModes
  );

  // Register handlers with global toolbar
  useEffect(() => {
    setActiveScreenHandlers({
      handleAddCard,
      handleAddGrid,
      handleAddImage
    });
    
    return () => {
      setActiveScreenHandlers(null);
    };
  }, [handleAddCard, handleAddGrid, handleAddImage, setActiveScreenHandlers]);

  // Sync focusedIndex with global toolbar
  useEffect(() => {
    setGlobalFocusedIndex(focusedIndex);
  }, [focusedIndex, setGlobalFocusedIndex]);


  // Initialize content from note data
  useEffect(() => {
    if (noteData && noteData.content && noteData.content.trim()) {
      const newBlocks = parseNoteContentToBlocks(noteData);
      setBlocks(newBlocks);
    }
  }, [noteData]);

  const handleBack = () => {
    console.log('Navigate back');
    if (onBack) onBack();
  };


  // Ensure there's always an empty text block at the end
  useEffect(() => {
    if (blocks.length === 0 || blocks[blocks.length - 1].type !== 'text') {
      setBlocks(prev => ([
        ...prev,
        { id: generateId(), type: 'text', content: '', ref: React.createRef() }
      ]));
    }
  }, [blocks]);

  const handleSave = async () => {
    console.log('💾 CreateNoteScreen handleSave called');
    
    if (authLoading || !initialized) {
      Alert.alert('Please wait', 'Authentication is still loading. Please try again in a moment.');
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Error', 'You must be logged in to save notes. Please try logging out and back in.');
      return;
    }

    const titleText = title.trim();
    const contentText = convertBlocksToContent(blocks);
    
    if (!titleText && !contentText) {
      Alert.alert('Error', 'Please enter a title or content for your note');
      return;
    }

    setIsLoading(true);
    
    try {
      const newNoteData = {
        title: titleText || 'Untitled',
        content: contentText,
        isPublic: isPublic,
        ...(forkedFrom && { forkedFrom }),
      };
      
      if (isEditing && noteData?.id) {
        await notesStore.updateNote(noteData.id, {
          title: titleText || 'Untitled',
          content: contentText,
          is_public: isPublic,
        });
        Alert.alert('Success', 'Note updated successfully');
      } else {
        const createdNote = await notesStore.createNote(newNoteData);
        Alert.alert('Success', 'Note created successfully');
      }
      
      if (onSave) onSave(newNoteData);
      
      // Navigate back
      if (navigation) {
        navigation.goBack();
      } else if (onBack) {
        onBack();
      }
      
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      Alert.alert('Error', `Failed to save note: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-focus when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🎯 Auto-focusing title input on load');
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const noteHasContent = useMemo(() => {
    return hasContent(title, blocks);
  }, [title, blocks]);

  console.log('🔍 CreateNote render - keyboardVisible:', keyboardVisible, 'keyboardHeight:', keyboardHeight);

  return (
    <>
    <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 25} // iOS: 툴바 높이만큼 오프셋
          enabled={true}
        >
        {/* Header */}
        <UnifiedHeader
          showBackButton={false}
          leftComponent={
            <SingleToggle
              isPublic={isPublic}
              onToggle={setIsPublic}
            />
          }
          rightElements={[
            {
              component: (
                <TouchableOpacity 
                  onPress={noteHasContent ? handleSave : handleBack} 
                  style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.actionButtonText}>Saving...</Text>
                  ) : noteHasContent ? (
                    <Text style={styles.actionButtonText}>Done</Text>
                  ) : (
                    <Icon name="x" size={24} color={Colors.primaryText} />
                  )}
                </TouchableOpacity>
              )
            }
          ]}
        />

        {/* Forked Note Indicator */}
        {forkedFrom && (
          <View style={styles.forkedIndicator}>
            <Icon name="git-branch" size={16} color={Colors.floatingButton} />
            <Text style={styles.forkedText}>
              Forked from <Text style={styles.forkedAuthor}>{forkedFrom.author.name}</Text>'s "{forkedFrom.title}"
            </Text>
          </View>
        )}

        {/* Background touch to close menu */}
        <TouchableWithoutFeedback 
          onPress={() => {
            // Don't call Keyboard.dismiss() here to prevent interference with TextInput focus
          }}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <TextInput
                ref={titleInputRef}
                style={styles.titleInput}
                placeholder="Title"
                placeholderTextColor={Colors.secondaryText}
                value={title}
                onChangeText={(newTitle) => {
                  console.log('🏷️ Title changed:', newTitle.length, 'characters');
                  setTitle(newTitle);
                }}
                onFocus={() => {
                  setFocusedIndex(-1);
                }}
                multiline
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Content Blocks */}
              <View style={styles.blocksContainer}>
                {blocks.map((block, index) => (
                  <NoteBlockRenderer
                    key={block.id}
                    block={block}
                    index={index}
                    blocks={blocks}
                    setBlocks={setBlocks}
                    handleTextChange={handleTextChange}
                    setFocusedIndex={setFocusedIndex}
                    keyboardVisible={keyboardVisible}
                    keyboardHeight={keyboardHeight}
                    scrollToFocusedInput={scrollToFocusedInput}
                    handleKeyPress={handleKeyPress}
                    handleDeleteBlock={handleDeleteBlock}
                    cardLayoutModes={cardLayoutModes}
                    setCardLayoutModes={setCardLayoutModes}
                    dragGuideline={dragGuideline}
                    setDragGuideline={setDragGuideline}
                    draggingBlockId={draggingBlockId}
                    setDraggingBlockId={setDraggingBlockId}
                    hoveredBlockId={hoveredBlockId}
                    setHoveredBlockId={setHoveredBlockId}
                    // New drag and drop props (matching NoteDetailScreen)
                    dragPosition={dragPosition}
                    hoverTargetBlockId={hoverTargetBlockId}
                    dragMode={dragMode}
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
                      console.log('📍 CreateNoteScreen setBlockPositions called');
                      setBlockPositions(newPositions);
                    }}
                    // Simple card layout tracking
                    cardLayouts={cardLayouts}
                    setCardLayouts={trackedSetCardLayouts}
                    toolbarId={TOOLBAR_ID}
                    useGlobalKeyboard={true}
                  />
                ))}
                
                {/* Drag Guidelines */}
                {dragGuideline.visible && (
                  <View style={[
                    styles.dragGuideline,
                    dragGuideline.position === 'left' && styles.dragGuidelineLeft,
                    dragGuideline.position === 'right' && styles.dragGuidelineRight,
                  ]} />
                )}
              </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>


    </>
  );
};

export default CreateNoteScreen;