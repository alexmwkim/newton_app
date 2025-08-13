import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  InputAccessoryView
} from 'react-native';
// SafeArea fallback for projects without safe-area-context
let useSafeAreaInsets;
try {
  useSafeAreaInsets = require('react-native-safe-area-context').useSafeAreaInsets;
} catch (e) {
  useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });
}
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import SingleToggleComponent from '../components/SingleToggleComponent';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';

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

const TOOLBAR_ID = 'newton-toolbar';

const CreateNoteScreen = ({ onBack, onSave, initialNote, navigation, note, isEditing, isForked, returnToScreen, route }) => {
  const { user, loading: authLoading, initialized } = useAuth();
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

  const { handleAddCard, handleAddImage, handleKeyPress, handleDeleteBlock, handleTextChange } = useNoteInsertHandlers(
    blocks,
    setBlocks,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput,
    cardLayoutModes,
    setCardLayoutModes
  );

  // 변수 초기화 완료 후 디버그 로그
  console.log('🔧 Toolbar debug:', {
    platform: Platform.OS,
    toolbarId: TOOLBAR_ID,
    keyboardVisible,
    keyboardHeight,
    focusedIndex,
    blocksCount: blocks.length
  });

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
        <View style={styles.header}>
          <SingleToggleComponent
            isPublic={isPublic}
            onToggle={setIsPublic}
          />
          
          <TouchableOpacity 
            onPress={noteHasContent ? handleSave : handleBack} 
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Saving...' : noteHasContent ? 'Done' : 'X'}
            </Text>
          </TouchableOpacity>
        </View>

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
                  console.log('🎯 Title input focused - should show toolbar');
                  setFocusedIndex(-1);
                  if (keyboardVisible) {
                    setTimeout(() => scrollToFocusedInput(keyboardHeight), 50);
                  }
                }} // Special index for title
                multiline
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                inputAccessoryViewID={TOOLBAR_ID}
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
                    cardLayouts={cardLayouts}
                    setCardLayouts={setCardLayouts}
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

    {/* InputAccessoryView - 안정적인 렌더링 보장 */}
    <InputAccessoryView nativeID={TOOLBAR_ID}>
      <View style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: 44,
        width: '100%',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              console.log('🔧 Adding card at current line, index:', focusedIndex);
              handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
            }}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: '#F0F0F0',
              minWidth: 36,
              minHeight: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="square" size={18} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log('🔧 Adding image at current line, index:', focusedIndex);
              handleAddImage(focusedIndex >= 0 ? focusedIndex : 0);
            }}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: '#F0F0F0',
              minWidth: 36,
              minHeight: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="image" size={18} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Done pressed - hiding keyboard');
            // 키보드 숨기기
            if (focusedIndex === -1 && titleInputRef.current) {
              titleInputRef.current.blur();
            } else if (focusedIndex >= 0 && blocks[focusedIndex]?.ref?.current) {
              blocks[focusedIndex].ref.current.blur();
            }
          }}
          style={{
            padding: 8,
            borderRadius: 6,
            backgroundColor: '#007AFF',
            minWidth: 60,
            minHeight: 36,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
    </>
  );
};

export default CreateNoteScreen;