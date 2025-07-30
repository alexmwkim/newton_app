import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  InputAccessoryView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import SingleToggleComponent from '../components/SingleToggleComponent';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';

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

// CardBlock component for draggable cards within notes (same as NoteDetailScreen)
const CardBlock = ({ card, onContentChange, onDelete, isEditing, style }) => {
  const [localContent, setLocalContent] = useState(card.content || '');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalContent(card.content || '');
  }, [card.content]);

  const handleContentChange = (text) => {
    setLocalContent(text);
    onContentChange(card.id, text);
  };

  return (
    <View style={[cardBlockStyles.container, style, isDragging && cardBlockStyles.dragging]}>
      <View style={cardBlockStyles.card}>
        {/* Drag handle */}
        <View style={cardBlockStyles.dragHandle}>
          <Icon name="move" size={12} color={Colors.secondaryText} />
        </View>
        
        <View style={cardBlockStyles.cardContent}>
          <TextInput
            style={cardBlockStyles.cardInput}
            value={localContent}
            onChangeText={handleContentChange}
            placeholder="Enter card content..."
            placeholderTextColor={Colors.secondaryText}
            multiline={true}
            editable={isEditing && !isDragging}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
            textContentType="none"
            clearButtonMode="never"
            enablesReturnKeyAutomatically={false}
          />
          {isEditing && (
            <TouchableOpacity 
              style={cardBlockStyles.deleteButton}
              onPress={() => onDelete(card.id)}
            >
              <Icon name="x" size={16} color={Colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
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
  const [content, setContent] = useState(cleanLegacyContent(noteData?.content) || '');
  const [isPublic, setIsPublic] = useState(noteData?.is_public ?? routeParams.isPublic ?? false);
  const [forkedFrom, setForkedFrom] = useState(noteData?.forked_from || null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardBlocks, setCardBlocks] = useState(noteData?.cardBlocks || []);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [contentSelection, setContentSelection] = useState({ start: 0, end: 0 });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [activeInput, setActiveInput] = useState(null);
  const [textInputLayout, setTextInputLayout] = useState({ y: 0, height: 0 });
  
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const handleBack = () => {
    console.log('Navigate back');
    if (onBack) onBack();
  };

  // Card management handlers - pure visual card system
  const handleAddCard = () => {
    const cardId = `card-${Date.now()}`;
    
    // Create card data with position but NO text insertion
    const newCard = {
      id: cardId,
      content: '',
      layout: 'single',
      position: cardBlocks.length // Simple index-based positioning
    };
    
    setCardBlocks(prev => [...prev, newCard]);
    
    console.log('✅ Added visual card block:', cardId);
    
    // Dismiss keyboard and auto-focus new card
    Keyboard.dismiss();
    
    // Auto-focus the new card after a short delay
    setTimeout(() => {
      // TODO: Implement card focus when card refs are available
      console.log('🎯 Auto-focusing new card:', cardId);
    }, 150);
  };

  const handleCardContentChange = (cardId, content) => {
    setCardBlocks(prev => 
      prev.map(card => 
        card.id === cardId ? { ...card, content } : card
      )
    );
  };

  const handleDeleteCard = (cardId) => {
    setCardBlocks(prev => prev.filter(card => card.id !== cardId));
    console.log('🗑️ Deleted visual card block:', cardId);
  };

  // Calculate cursor position based on touch location
  const calculateCursorPosition = (touchY, textInputY) => {
    const fontSize = 16;
    const lineHeight = 24;
    const padding = 16;
    
    // Calculate relative Y position within the text input
    const relativeY = touchY - textInputY - padding;
    
    if (relativeY < 0) {
      // Touched above text, place cursor at start
      return 0;
    }
    
    // Estimate which line was touched
    const lineNumber = Math.floor(relativeY / lineHeight);
    const lines = content.split('\n');
    
    if (lineNumber >= lines.length) {
      // Touched below all text, place cursor at end
      return content.length;
    }
    
    // Calculate character index for the touched line
    let characterIndex = 0;
    for (let i = 0; i < lineNumber; i++) {
      characterIndex += lines[i].length + 1; // +1 for newline
    }
    
    // For now, place cursor at end of the touched line
    // Could be enhanced to handle X position as well
    characterIndex += lines[lineNumber].length;
    
    return Math.min(characterIndex, content.length);
  };

  // Focus the main content input with touch position
  const focusMainContentAtPosition = useCallback((touchEvent = null) => {
    console.log('🎯 focusMainContentAtPosition called');
    console.log('📊 Debug info:', {
      contentInputRefCurrent: !!contentInputRef.current,
      contentLength: content.length,
      hasTouchEvent: !!touchEvent
    });
    
    setTimeout(() => {
      console.log('🎯 Attempting to focus main TextInput');
      
      if (contentInputRef.current) {
        contentInputRef.current.focus();
        
        // Calculate cursor position based on touch location
        setTimeout(() => {
          if (contentInputRef.current) {
            let cursorPosition = content.length; // Default to end
            
            if (touchEvent && touchEvent.nativeEvent && typeof touchEvent.nativeEvent.pageY === 'number') {
              // Get touch coordinates
              const { pageY } = touchEvent.nativeEvent;
              
              // Use actual text input position from layout
              const textInputY = textInputLayout.y || 200; // Fallback to estimation
              cursorPosition = calculateCursorPosition(pageY, textInputY);
              
              console.log('🎯 Touch Y:', pageY, 'TextInput Y:', textInputY, 'Calculated cursor position:', cursorPosition);
            } else {
              console.log('⚠️ No valid touch event, using default cursor position');
            }
            
            contentInputRef.current.setSelection(cursorPosition, cursorPosition);
            console.log('🎯 Cursor set to position:', cursorPosition);
          }
        }, 50);
        
        setActiveInput('content');
        console.log('✅ Main TextInput focus called');
      } else {
        console.log('❌ Main TextInput ref is null');
      }
    }, 100);
  }, [content]);

  // Legacy function for backward compatibility
  const focusMainContent = useCallback(() => {
    focusMainContentAtPosition(null);
  }, [focusMainContentAtPosition]);

  // Render content with visual card blocks and full touch coverage
  const renderContentWithCards = () => {
    return (
      <View style={styles.contentWithCards}>
        {/* Main text input - flows with content */}
        <View
          style={{ marginBottom: 0, paddingBottom: 0 }}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            setTextInputLayout({ y, height });
            console.log('📐 TextInput layout:', { y, height });
          }}
        >
          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentText, 
              styles.contentInput,
              {
                fontSize: 16,
                lineHeight: 24,
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 0, // Remove bottom padding
                textAlignVertical: 'top',
                minHeight: 100, // Reasonable minimum height for touch area
                marginBottom: 0, // Remove any margin
              }
            ]}
            value={content}
            onChangeText={setContent}
            onSelectionChange={(event) => {
              const { start, end } = event.nativeEvent.selection;
              setContentSelection({ start, end });
              setCursorPosition(start);
            }}
            onFocus={() => {
              console.log('🎯 CreateNote Content focused - ref exists:', !!contentInputRef.current);
              setActiveInput('content');
            }}
            placeholder="Write your note..."
            placeholderTextColor={Colors.secondaryText}
            multiline={true}
            editable={true}
            focusable={true}
            textAlignVertical="top"
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
            textContentType="none"
            clearButtonMode="never"
            enablesReturnKeyAutomatically={false}
            keyboardType="default"
            returnKeyType="default"
            inputAccessoryViewID="emptyAccessory"
          />
        </View>
        
        {/* Visual card blocks immediately after text */}
        <View style={styles.cardsContainer}>
          {cardBlocks.map((card, index) => (
            <View key={card.id} style={[styles.cardWrapper, { pointerEvents: 'auto', zIndex: 1 }]}>
              <CardBlock
                card={card}
                onContentChange={handleCardContentChange}
                onDelete={handleDeleteCard}
                isEditing={true}
              />
            </View>
          ))}
        </View>

        {/* Larger clickable area below cards for better touch coverage */}
        <TouchableWithoutFeedback onPress={(event) => {
          // Extract touch coordinates immediately to avoid event pooling issues
          const touchY = event.nativeEvent.pageY;
          console.log('🎯 Touch captured, Y:', touchY);
          
          // Create a persistent event object
          const persistentEvent = {
            nativeEvent: {
              pageY: touchY
            }
          };
          
          focusMainContentAtPosition(persistentEvent);
        }}>
          <View style={{ minHeight: 200, width: '100%', backgroundColor: 'transparent' }} />
        </TouchableWithoutFeedback>
      </View>
    );
  };

  const handleSave = async () => {
    console.log('💾 CreateNoteScreen handleSave called');
    console.log('👤 User full object:', user);
    console.log('👤 User ID:', user?.id);
    console.log('👤 User email:', user?.email);
    console.log('📝 Title:', title.trim(), 'Content length:', content.trim().length);
    
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
    const contentText = cleanLegacyContent(content.trim());
    
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
        // TODO: Add cardBlocks when Supabase schema is updated
        ...(forkedFrom && { forkedFrom }),
      };
      
      console.log('💾 CreateNoteScreen saving note:', newNoteData);
      
      if (isEditing && noteData?.id) {
        // Update existing note
        await notesStore.updateNote(noteData.id, {
          title: titleText || 'Untitled',
          content: contentText,
          is_public: isPublic,
          // TODO: Add cardBlocks when Supabase schema is updated
        });
        
        // Save card blocks to local storage for now
        if (cardBlocks.length > 0) {
          AsyncStorage.setItem(`cardBlocks_${noteData.id}`, JSON.stringify(cardBlocks));
        }
        Alert.alert('Success', 'Note updated successfully');
      } else {
        // Create new note
        console.log('🆕 Creating new note with data:', newNoteData);
        const createdNote = await notesStore.createNote(newNoteData);
        console.log('✅ Note created:', createdNote);
        
        // Save card blocks to local storage for new note
        if (cardBlocks.length > 0 && createdNote?.id) {
          console.log('💾 Saving card blocks for note:', createdNote.id);
          AsyncStorage.setItem(`cardBlocks_${createdNote.id}`, JSON.stringify(cardBlocks));
        }
        
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

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        console.log('🎹 CreateNoteScreen keyboard shown, height:', event.endCoordinates.height);
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('🎹 CreateNoteScreen keyboard hidden');
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        setActiveInput(null);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-focus when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🎯 Auto-focusing title input on load');
      setActiveInput('title');
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);


  const hasContent = title.trim().length > 0 || content.trim().length > 0;

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

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustContentInsets={true}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
        >
          {/* Title Input */}
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={Colors.secondaryText}
            value={title}
            onChangeText={setTitle}
            multiline={true}
            numberOfLines={1}
            maxLength={100}
            returnKeyType="next"
            scrollEnabled={false}
            autoFocus={true}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
            textContentType="none"
            clearButtonMode="never"
            enablesReturnKeyAutomatically={false}
            keyboardType="default"
            returnKeyType="default"
            inputAccessoryViewID="emptyAccessory"
            onFocus={() => {
              console.log('🎯 CreateNote Title focused');
              setActiveInput('title');
            }}
            onSubmitEditing={() => {
              contentInputRef.current?.focus();
              setActiveInput('content');
            }}
          />

          {/* Content Input with Cards */}
          {renderContentWithCards()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Keyboard Toolbar - positioned ABOVE keyboard */}
      {keyboardVisible && (
      <View style={{
        position: 'absolute',
        bottom: keyboardHeight, // Position directly above keyboard
        left: 0,
        right: 0,
        backgroundColor: '#f8f9fa',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        zIndex: 1000,
      }}>
          <TouchableOpacity 
            onPress={() => {
              console.log('📎 CreateNote toolbar - Add card pressed');
              handleAddCard();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="file-plus" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <Icon name="image" size={24} color={Colors.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <Icon name="link" size={24} color={Colors.secondaryText} />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }} />
          
          <TouchableOpacity 
            onPress={() => Keyboard.dismiss()}
            style={{
              backgroundColor: Colors.floatingButton,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: '600',
            }}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Empty InputAccessoryView to suppress prediction bar */}
      <InputAccessoryView nativeID="emptyAccessory">
        <View style={{ height: 0 }} />
      </InputAccessoryView>
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
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: 0, // Ensure no horizontal padding to prevent cutting
    marginBottom: Layout.spacing.md,
    lineHeight: 40, // Add proper line height for 32px font size
    minHeight: 56, // Ensure sufficient height for large text
    textAlignVertical: 'center', // Center text vertically
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
  contentWithCards: {
    minHeight: 50,
  },
  cardsContainer: {
    paddingTop: 0,
    gap: Layout.spacing.sm,
  },
  cardWrapper: {
    marginBottom: 0,
  },
});

// Styles for CardBlock component (identical to NoteDetailScreen)
const cardBlockStyles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    padding: Layout.spacing.md,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    minHeight: 100,
  },
  dragging: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    position: 'absolute',
    top: 4,
    left: 4,
    padding: 4,
    borderRadius: 4,
    backgroundColor: Colors.white,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    position: 'relative',
    marginTop: 20, // Space for drag handle
  },
  cardInput: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    lineHeight: 22,
    fontFamily: Typography.fontFamily.primary,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingRight: 30, // Space for delete button
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: Layout.spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default CreateNoteScreen;