import React, { useState, useRef, useEffect } from 'react';
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
  Keyboard
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
  const { user } = useAuth();
  const notesStore = useNotesStore();
  const noteData = note || initialNote;
  
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

  // Render content with visual card blocks (NO markdown parsing)
  const renderContentWithCards = () => {
    return (
      <View style={styles.contentWithCards}>
        {/* Main text input */}
        <TextInput
          ref={contentInputRef}
          style={[styles.contentText, styles.contentInput]}
          value={content}
          onChangeText={setContent}
          onSelectionChange={(event) => {
            const { start, end } = event.nativeEvent.selection;
            setContentSelection({ start, end });
            setCursorPosition(start);
          }}
          onFocus={() => setActiveInput('content')}
          placeholder="Write your note..."
          placeholderTextColor={Colors.secondaryText}
          multiline={true}
          textAlignVertical="top"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="sentences"
        />
        
        {/* Visual card blocks below text input */}
        <View style={styles.cardsContainer}>
          {cardBlocks.map((card, index) => (
            <View key={card.id} style={styles.cardWrapper}>
              <CardBlock
                card={card}
                onContentChange={handleCardContentChange}
                onDelete={handleDeleteCard}
                isEditing={true}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save notes');
      return;
    }

    const titleText = title.trim();
    const contentText = cleanLegacyContent(content.trim());
    
    if (!titleText) {
      Alert.alert('Error', 'Please enter a title for your note');
      return;
    }

    setIsLoading(true);
    
    try {
      const newNoteData = {
        title: titleText,
        content: contentText,
        isPublic: isPublic,
        // TODO: Add cardBlocks when Supabase schema is updated
        ...(forkedFrom && { forkedFrom }),
      };
      
      console.log('💾 CreateNoteScreen saving note:', newNoteData);
      
      if (isEditing && noteData?.id) {
        // Update existing note
        await notesStore.updateNote(noteData.id, {
          title: titleText,
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
        const createdNote = await notesStore.createNote(newNoteData);
        
        // Save card blocks to local storage for new note
        if (cardBlocks.length > 0 && createdNote?.id) {
          AsyncStorage.setItem(`cardBlocks_${createdNote.id}`, JSON.stringify(cardBlocks));
        }
        
        Alert.alert('Success', 'Note created successfully');
      }
      
      if (onSave) {
        onSave(newNoteData);
      }
      
      // Navigate back
      if (navigation) {
        navigation.goBack();
      } else if (onBack) {
        onBack();
      }
      
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      console.log('🎹 CreateNoteScreen keyboard shown, height:', event.endCoordinates.height);
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 CreateNoteScreen keyboard hidden');
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      setActiveInput(null);
    });

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
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
            autoCapitalize="sentences"
            onFocus={() => setActiveInput('title')}
            onSubmitEditing={() => {
              contentInputRef.current?.focus();
              setActiveInput('content');
            }}
          />

          {/* Content Input with Cards */}
          {renderContentWithCards()}
        </ScrollView>

        {/* Keyboard Toolbar - shows above keyboard when active */}
        {keyboardVisible && (
          <View style={[styles.keyboardToolbar, { bottom: 0 }]}>
            <TouchableOpacity onPress={handleAddCard} style={styles.toolbarIconButton}>
              <Icon name="file-plus" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
            
            {/* Future toolbar options */}
            <TouchableOpacity style={styles.toolbarIconButton}>
              <Icon name="image" size={24} color={Colors.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolbarIconButton}>
              <Icon name="link" size={24} color={Colors.secondaryText} />
            </TouchableOpacity>
            
            <View style={styles.toolbarSpacer} />
            
            <TouchableOpacity 
              onPress={() => Keyboard.dismiss()}
              style={styles.toolbarDoneButton}
            >
              <Text style={styles.toolbarDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
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
    flex: 1,
    minHeight: 400,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: 'System',
    color: Colors.primaryText,
    lineHeight: 24,
    padding: 16,
    minHeight: 300,
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    zIndex: 1000,
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
    flex: 1,
    minHeight: 400,
  },
  cardsContainer: {
    paddingTop: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  cardWrapper: {
    marginBottom: Layout.spacing.sm,
  },
});

// Styles for CardBlock component (identical to NoteDetailScreen)
const cardBlockStyles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
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