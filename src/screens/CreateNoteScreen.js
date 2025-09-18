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
import { useFormatting } from '../components/toolbar/ToolbarFormatting';
// UnifiedToolbar는 App.js에서 전역 렌더링
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

const TOOLBAR_ID = 'newton-create-toolbar'; // ✅ CreateNoteScreen 전용 TOOLBAR_ID

const CreateNoteScreen = ({ onBack, onSave, initialNote, navigation, note, isEditing, isForked, returnToScreen, route }) => {
  const { user, loading: authLoading, initialized } = useAuth();
  const { setActiveScreenHandlers, setFocusedIndex: setGlobalFocusedIndex } = useSimpleToolbar();
  // 🔧 FIX: FormattingProvider 연결 추가
  const { setSetBlocks } = useFormatting();
  const notesStore = useNotesStore();
  const noteData = note || initialNote;
  const styles = createNoteStyles;
  
  // CreateNoteScreen auth state initialized
  
  // Get initial values from route params if available
  const routeParams = route?.params || {};
  const [title, setTitle] = useState(noteData?.title || '');
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef(), layoutMode: 'full', groupId: null, savedFormats: null },
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
        // setCardLayouts function call
        return result;
      });
    } else {
      // setCardLayouts direct call
      setCardLayouts(newLayouts);
    }
  }, []);

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

  // 키보드 다시 포커스 함수 - 드롭다운 전환용
  const refocusCurrentInput = useCallback(() => {
    console.log('🎯 CREATE NOTE REFOCUS: Restoring keyboard after dropdown');
    
    const retryFocus = (attempt = 1) => {
      console.log(`🎯 CreateNote refocus attempt ${attempt}/5`);
      
      // 현재 블록에서 텍스트 블록 찾기
      const textBlocks = blocks.filter(block => block.type === 'text');
      console.log(`🎯 Found ${textBlocks.length} text blocks`);
      
      // 마지막 텍스트 블록부터 시도
      for (let i = textBlocks.length - 1; i >= 0; i--) {
        const block = textBlocks[i];
        console.log(`🎯 Checking block ${i}: ref=${!!block.ref}, current=${!!(block.ref?.current)}`);
        
        if (block.ref?.current) {
          console.log(`🎯 SUCCESS: Block ${i} ref is valid, focusing now`);
          try {
            block.ref.current.focus();
            const blockIndex = blocks.indexOf(block);
            setFocusedIndex(blockIndex);
            console.log(`🎯 Focused on CreateNote block index ${blockIndex}`);
            return;
          } catch (error) {
            console.log(`🎯 Focus failed on block ${i}:`, error);
          }
        }
      }
      
      // 재시도 로직
      if (attempt < 5) {
        console.log(`🎯 All blocks failed, retrying in ${attempt * 100}ms`);
        setTimeout(() => retryFocus(attempt + 1), attempt * 100);
      } else {
        console.log('🎯 All CreateNote refocus attempts failed');
      }
    };
    
    retryFocus(1);
  }, [blocks]);

  // Register handlers with global toolbar
  useEffect(() => {
    setActiveScreenHandlers({
      handleAddCard,
      handleAddImage,
      refocusCurrentInput // 키보드 refocus 함수 추가
    });
    
    return () => {
      setActiveScreenHandlers(null);
    };
  }, [handleAddCard, handleAddImage, refocusCurrentInput, setActiveScreenHandlers]);

  // 🔧 FIX: FormattingProvider에 setBlocks 함수 등록
  useEffect(() => {
    setSetBlocks(setBlocks);
    
    return () => {
      setSetBlocks(null);
    };
  }, [setSetBlocks, setBlocks]);

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
    if (onBack) onBack();
  };


  // Ensure there's always an empty text block at the end
  useEffect(() => {
    if (blocks.length === 0 || blocks[blocks.length - 1].type !== 'text') {
      setBlocks(prev => ([
        ...prev,
        { id: generateId(), type: 'text', content: '', ref: React.createRef(), layoutMode: 'full', groupId: null, savedFormats: null }
      ]));
    }
  }, [blocks]);

  const handleSave = async () => {
    // CreateNoteScreen handleSave called
    
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
      // Auto-focusing title input on load
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const noteHasContent = useMemo(() => {
    return hasContent(title, blocks);
  }, [title, blocks]);

  // CreateNote keyboard state updated

  return (
    <>
    <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          // ✅ 키보드 움직임 방지를 위해 완전 비활성화
          enabled={false}
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
              keyboardDismissMode="none"
              automaticallyAdjustContentInsets={false}
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
                  // 🔧 FIX: multiline에서 Enter 키로 인한 줄바꿈 제거 - 타이틀은 단일 제목
                  const cleanTitle = newTitle.replace(/\n/g, '');
                  console.log('🏷️ Title changed:', cleanTitle.length, 'characters');
                  setTitle(cleanTitle);
                }}
                onFocus={() => {
                  setFocusedIndex(-1);
                }}
                onSelectionChange={({ nativeEvent }) => {
                  console.log('🎯 Create Title selection changed:', nativeEvent.selection);
                  // Selection change indicates proper cursor positioning
                }}
                multiline
                scrollEnabled={false}
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                // ✅ 플로팅 툴바 사용으로 inputAccessoryViewID 제거
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
                      // CreateNoteScreen setBlockPositions called
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
                  // Empty space touched, focusing last text block
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

    {/* ✅ 플로팅 툴바 사용 (키보드 안정성 유지) */}
    {/* UnifiedToolbar는 App.js에서 전역 렌더링됨 */}
    </>
  );
};

export default CreateNoteScreen;