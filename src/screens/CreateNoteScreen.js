import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  InputAccessoryView,
  Image,
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
import SingleToggleComponent from '../components/SingleToggleComponent';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';

let blockId = 0;
const generateId = () => `block-${blockId++}`;
const TOOLBAR_ID = 'newton-toolbar';

// Keyboard-aware helper functions based on react-native-keyboard-aware-scroll-view
const getKeyboardAwareConfig = () => {
  return {
    keyboardVerticalOffset: Platform.OS === 'ios' ? 56 : 0, // Includes toolbar
    extraScrollHeight: Platform.OS === 'ios' ? 80 : 100,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    enableOnAndroid: true,
    keyboardShouldPersistTaps: 'handled',
    scrollEventThrottle: 16
  };
};

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

const CreateNoteScreen = ({ onBack, onSave, initialNote, navigation, note, isEditing, isForked, returnToScreen, route }) => {
  const { user, loading: authLoading, initialized } = useAuth();
  const notesStore = useNotesStore();
  const noteData = note || initialNote;
  
  // Debug user state
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardScreenY, setKeyboardScreenY] = useState(0);
  
  const scrollRef = useRef(null);
  const titleInputRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Initialize content from note data (similar to NoteDetailScreen)
  useEffect(() => {
    if (noteData && noteData.content && noteData.content.trim()) {
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
  }, [noteData]);

  const handleBack = () => {
    console.log('Navigate back');
    if (onBack) onBack();
  };

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
        }, Platform.OS === 'ios' ? 300 : 350); // Natural timing like Apple Notes
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

  // Natural auto-scroll like Apple Notes - subtle and consistent
  const scrollToFocusedInput = useCallback((keyboardHeight) => {
    if (!scrollRef.current || focusedIndex < -1 || keyboardHeight <= 0) return;
    
    console.log('📜 Starting natural auto-scroll, focusedIndex:', focusedIndex, 'keyboardHeight:', keyboardHeight);
    
    // Get the focused input element
    let targetRef = null;
    if (focusedIndex === -1) {
      // Title input case - likely doesn't need scroll
      return; // Title is usually already visible
    } else {
      // Get the focused block's ref
      const focusedBlock = blocks[focusedIndex];
      if (!focusedBlock?.ref?.current) return;
      targetRef = focusedBlock.ref.current;
    }
    
    // Measure with shorter delay for responsiveness
    setTimeout(() => {
      targetRef.measureInWindow((x, y, width, height) => {
        const screenHeight = Dimensions.get('window').height;
        const inputBottom = y + height;
        
        // Apple Notes style: only scroll if input is actually close to keyboard
        const keyboardTop = screenHeight - keyboardHeight;
        const comfortZone = 120; // 120px comfort zone above keyboard
        const scrollTriggerPoint = keyboardTop - comfortZone;
        
        console.log('📐 Natural scroll check:', {
          screenHeight,
          keyboardHeight,
          keyboardTop,
          comfortZone,
          scrollTriggerPoint,
          inputY: y,
          inputHeight: height,
          inputBottom,
          needsScroll: inputBottom > scrollTriggerPoint
        });
        
        // Only scroll if input would actually be in the discomfort zone
        if (inputBottom > scrollTriggerPoint) {
          // Move input to a consistent comfortable position - not too high
          const targetComfortableY = scrollTriggerPoint - height - 20; // 20px buffer
          const scrollOffset = Math.max(0, y - targetComfortableY);
          
          console.log('📜 Applying natural scroll:', {
            targetComfortableY,
            currentInputY: y,
            scrollOffset,
            scrollDistance: scrollOffset
          });
          
          scrollRef.current.scrollTo({
            y: scrollOffset,
            animated: true,
            duration: 300 // Smooth animation duration
          });
        } else {
          console.log('📜 Input is in comfort zone - no scroll needed');
        }
      });
    }, 50); // Shorter delay for more responsive feel
  }, [focusedIndex, blocks, scrollRef, titleInputRef]);

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
    
    console.log('🔧 Block set inserted');
    
    setTimeout(() => {
      const targetRef = updated[focusIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(focusIndex);
        // Auto-scroll to the focused element
        if (keyboardVisible) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
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

  // Handle backspace navigation between blocks
  const handleKeyPress = (block, index, key) => {
    if (key === 'Backspace') {
      // If current block is empty and user presses backspace
      if (block.content === '' && index > 0) {
        const previous = blocks[index - 1];
        
        // If previous block is text, merge/focus to it
        if (previous.type === 'text') {
          const updated = [...blocks];
          // Remove current empty block
          updated.splice(index, 1);
          setBlocks(updated);
          
          // Focus on previous block at the end
          setTimeout(() => {
            previous.ref?.current?.focus();
            const textLength = previous.content.length;
            previous.ref?.current?.setSelection(textLength, textLength);
          }, 50);
        }
      }
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


  useEffect(() => {
    // 항상 마지막에 빈 텍스트 블록 유지
    if (blocks.length === 0 || blocks[blocks.length - 1].type !== 'text') {
      setBlocks(prev => ([
        ...prev,
        { id: generateId(), type: 'text', content: '', ref: React.createRef() }
      ]));
    }
  }, [blocks]);

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
            console.log('🎯 Text block focused, index:', index, 'type:', block.type);
            setFocusedIndex(index);
            if (keyboardVisible) {
              setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
            }
          }}
          onKeyPress={({ nativeEvent }) => {
            handleKeyPress(block, index, nativeEvent.key);
          }}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textAlignVertical="top"
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
                console.log('🎯 Card block focused, index:', index, 'type:', block.type);
                setFocusedIndex(index);
                if (keyboardVisible) {
                  setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                handleKeyPress(block, index, nativeEvent.key);
              }}
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
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
          <TouchableOpacity style={styles.deleteImageBtn} onPress={() => handleDeleteBlock(index)}>
            <Icon name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const handleSave = async () => {
    console.log('💾 CreateNoteScreen handleSave called');
    console.log('👤 User full object:', user);
    console.log('👤 User ID:', user?.id);
    console.log('👤 User email:', user?.email);
    
    if (authLoading || !initialized) {
      console.log('⏳ Auth still loading, please wait...');
      Alert.alert('Please wait', 'Authentication is still loading. Please try again in a moment.');
      return;
    }

    if (!user || !user.id) {
      console.log('❌ No user or user ID available');
      console.log('❌ User object:', user);
      console.log('❌ Auth loading:', authLoading);
      console.log('❌ Auth initialized:', initialized);
      Alert.alert('Error', 'You must be logged in to save notes. Please try logging out and back in.');
      return;
    }

    const titleText = title.trim();
    
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
    const contentText = cleanLegacyContent(blockContent.trim());
    
    console.log('💾 Content conversion details:', {
      totalBlocks: blocks.length,
      contentParts: contentParts.length,
      rawBlockContent: blockContent.substring(0, 200) + '...',
      finalContent: contentText.substring(0, 200) + '...',
      contentLength: contentText.length
    });
    
    console.log('📝 Processed data:', { titleText, contentLength: contentText.length, isPublic });
    
    if (!titleText && !contentText) {
      console.log('❌ No title or content provided');
      Alert.alert('Error', 'Please enter a title or content for your note');
      return;
    }

    console.log('⏳ Starting save process...');
    setIsLoading(true);
    
    try {
      const newNoteData = {
        title: titleText || 'Untitled',
        content: contentText,
        isPublic: isPublic,
        ...(forkedFrom && { forkedFrom }),
      };
      
      console.log('💾 CreateNoteScreen saving note:', newNoteData);
      
      if (isEditing && noteData?.id) {
        // Update existing note
        await notesStore.updateNote(noteData.id, {
          title: titleText || 'Untitled',
          content: contentText,
          is_public: isPublic,
        });
        
        Alert.alert('Success', 'Note updated successfully');
      } else {
        // Create new note
        console.log('🆕 Creating new note with data:', newNoteData);
        const createdNote = await notesStore.createNote(newNoteData);
        console.log('✅ Note created:', createdNote);
        
        Alert.alert('Success', 'Note created successfully');
      }
      
      if (onSave) {
        console.log('🔄 Calling onSave callback');
        onSave(newNoteData);
      }
      
      // Navigate back
      console.log('🔙 Navigating back');
      if (navigation) {
        navigation.goBack();
      } else if (onBack) {
        onBack();
      }
      
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      console.error('❌ Error details:', error.message);
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

  const hasContent = useMemo(() => {
    const titleHasContent = title.trim().length > 0;
    const blocksHaveContent = blocks.some(block => 
      (block.type === 'text' && block.content?.trim()) ||
      (block.type === 'card' && block.content?.trim()) ||
      (block.type === 'image' && block.content)
    );
    return titleHasContent || blocksHaveContent;
  }, [title, blocks]);

  console.log('🔍 CreateNote render - keyboardVisible:', keyboardVisible, 'keyboardHeight:', keyboardHeight);

  return (
    <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'height' : 'height'}
          keyboardVerticalOffset={0}
        >
        {/* Header */}
        <View style={styles.header}>
          <SingleToggleComponent
            isPublic={isPublic}
            onToggle={setIsPublic}
          />
          
          <TouchableOpacity 
            onPress={hasContent ? handleSave : handleBack} 
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Saving...' : hasContent ? 'Done' : 'X'}
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
                  console.log('🎯 Title input focused');
                  setFocusedIndex(-1);
                  if (keyboardVisible) {
                    setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
                  }
                }} // Special index for title
                multiline
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                inputAccessoryViewID={TOOLBAR_ID}
              />

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
      </KeyboardAvoidingView>

      {/* Native InputAccessoryView - properly attached to keyboard */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={TOOLBAR_ID}>
          <View style={[styles.nativeToolbar, {
            paddingBottom: insets.bottom,
            marginBottom: -insets.bottom,
            height: 50 + insets.bottom,
          }]}>
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
          </View>
        </InputAccessoryView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
  },
  forkedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    marginHorizontal: Layout.screen.padding,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.spacing.sm,
  },
  forkedText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    flex: 1,
  },
  forkedAuthor: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.floatingButton,
  },
  actionButton: {
    padding: Layout.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  backIcon: {
    fontSize: 18,
    color: Colors.primaryText,
  },
  formatButton: {
    padding: Layout.spacing.sm,
  },
  formatIcon: {
    fontSize: 18,
    color: Colors.primaryText,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screen.padding,
    paddingTop: Layout.spacing.sm, // Add some top padding
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    color: Colors.primaryText,
  },
  formattingToolbar: {
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  formattingSection: {
    marginHorizontal: Layout.spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  formattingButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  formatButtonText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primaryText,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: 6,
    overflow: 'hidden',
  },
  contentArea: {
    minHeight: 50,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: 'System',
    color: Colors.primaryText,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    minHeight: 50,
    backgroundColor: 'transparent',
    borderWidth: 0,
    margin: 0,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.lg,
  },
  quickAction: {
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
  },
  quickActionText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primaryText,
    marginLeft: 6,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  keyboardToolbar: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    minHeight: 50,
  },
  toolbarIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarDoneButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 6,
  },
  toolbarDoneText: {
    color: Colors.white,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  },
  scrollContent: {
    padding: 20,
    // Apply keyboard-aware-scroll-view padding formula
    paddingBottom: Platform.OS === 'ios' ? 120 : 160, // keyboard height + 20~40 for iOS, +60 for Android
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    backgroundColor: 'transparent',
    color: Colors.primaryText,
    width: '100%',
    marginBottom: 8,
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
  nativeToolbar: {
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
    borderTopWidth: 0,
  },
  toolbarBtn: {
    padding: 6,
  },
});

export default CreateNoteScreen;