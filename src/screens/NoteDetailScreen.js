import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
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


// CardBlock component for draggable cards within notes
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
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(true);
  const [storeNote, setStoreNote] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Refs
  const titleInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const contentInputRef = useRef(null);

  // Card blocks state
  const [cardBlocks, setCardBlocks] = useState([]);

  // Add card functionality (matching CreateNoteScreen)
  const handleAddCard = () => {
    const cardId = `card-${Date.now()}`;
    const newCard = {
      id: cardId,
      content: '',
      layout: 'single',
      position: cardBlocks.length
    };
    
    setCardBlocks(prev => [...prev, newCard]);
    console.log('✅ Added visual card block:', cardId);
    Keyboard.dismiss();
  };

  // Card management functions (matching CreateNoteScreen)
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
  
  // Store and auth
  const notesStore = useNotesStore();
  const { getNoteById, updateNote, deleteNote, toggleFavorite, isFavorite, toggleStarred, isStarred } = notesStore;
  const { user } = useAuth();
  
  // Load note data and card blocks
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

    const loadCardBlocks = async () => {
      if (!noteId) return;
      
      try {
        const savedCards = await AsyncStorage.getItem(`cardBlocks_${noteId}`);
        if (savedCards) {
          const parsedCards = JSON.parse(savedCards);
          setCardBlocks(parsedCards);
          console.log('📋 Loaded saved card blocks:', parsedCards.length);
        }
      } catch (error) {
        console.log('❌ Error loading card blocks:', error);
      }
    };
    
    if (noteId) {
      loadNote();
      loadCardBlocks();
    } else {
      console.warn('⚠️ NoteDetailScreen: noteId is missing');
      setLoadingNote(false);
    }
  }, [noteId]); // Removed note and getNoteById to prevent loop
  
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
  }, [displayNote?.user_id, user?.id]); // More specific dependencies
  
  // Initialize content from note data
  useEffect(() => {
    if (displayNote && !loadingNote) {
      setTitle(prev => prev !== displayNote.title ? (displayNote.title || '') : prev);
      setContent(prev => prev !== displayNote.content ? (displayNote.content || '') : prev);
    }
  }, [displayNote?.id, loadingNote]);
  
  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      console.log('🎹 Keyboard shown, height:', event.endCoordinates.height);
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 Keyboard hidden');
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Auto-save changes (debounced) - including card blocks
  useEffect(() => {
    if (!isAuthor || loadingNote || !noteId) return;
    
    const timer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        console.log('💾 Auto-saving changes');
        updateNote(noteId, {
          title: title || displayNote.title,
          content: cleanLegacyContent(content)
        });
        
        // Save card blocks to AsyncStorage
        if (cardBlocks.length > 0) {
          AsyncStorage.setItem(`cardBlocks_${noteId}`, JSON.stringify(cardBlocks));
          console.log('💾 Auto-saved card blocks:', cardBlocks.length);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, cardBlocks, isAuthor, noteId, loadingNote]);
  
  // Handlers
  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);
  
  const handleSave = useCallback(() => {
    console.log('💾 Manual save triggered');
    updateNote(noteId, {
      title: title.trim(),
      content: cleanLegacyContent(content.trim())
    });
    
    // Save card blocks to AsyncStorage
    if (cardBlocks.length > 0) {
      AsyncStorage.setItem(`cardBlocks_${noteId}`, JSON.stringify(cardBlocks));
      console.log('💾 Manual saved card blocks:', cardBlocks.length);
    }
    
    setIsEditing(false);
  }, [noteId, title, content, cardBlocks, updateNote]);
  
  const startEditing = useCallback((field = 'content') => {
    if (!isAuthor) return;
    
    setIsEditing(true);
    setTimeout(() => {
      if (field === 'title' && titleInputRef.current) {
        titleInputRef.current.focus();
      } else if (field === 'content' && contentInputRef.current) {
        contentInputRef.current.focus();
      }
    }, 100);
  }, [isAuthor]);
  
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
    
    const contentLength = (displayNote.content || '').length;
    const wordCount = (displayNote.content || '').split(/\s+/).filter(word => word.length > 0).length;
    
    Alert.alert(
      'Page Info',
      `Created: ${createdDate}\nCharacters: ${contentLength}\nWords: ${wordCount}`,
      [{ text: 'OK' }]
    );
  }, [displayNote]);

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

  
  // Focus content input
  const focusContent = () => {
    if (!isAuthor) return;
    
    setTimeout(() => {
      if (contentInputRef.current) {
        contentInputRef.current.focus();
        console.log('✅ Content TextInput focused');
      }
    }, 100);
  };
  
  // Simple full-page content input
  const renderContent = useCallback(() => {
    return (
      <TouchableWithoutFeedback onPress={focusContent}>
        <View style={styles.contentArea}>
          <TextInput
            ref={contentInputRef}
            style={styles.fullPageTextInput}
            value={content}
            onChangeText={setContent}
            placeholder="Start writing..."
            placeholderTextColor={Colors.secondaryText}
            multiline={true}
            editable={isAuthor}
            focusable={true}
            textAlignVertical="top"
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="sentences"
            onFocus={() => console.log('🎯 Content TextInput focused')}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }, [content, isAuthor, focusContent]);

  
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

  console.log('🔍 NoteDetail render - keyboardVisible:', keyboardVisible, 'keyboardHeight:', keyboardHeight);

  return (
    <SafeAreaView style={styles.container}>
      <>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
          style={{ flex: 1 }}
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
      
      {/* Background touch to close menu */}
      <TouchableWithoutFeedback 
        onPress={() => {
          if (showSettingsMenu) {
            setShowSettingsMenu(false);
          }
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
                  // Fork functionality - can be implemented later
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

      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { flexGrow: 1, minHeight: '100%', paddingBottom: 100 }]}
        keyboardShouldPersistTaps="always"
        automaticallyAdjustContentInsets={true}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
      >
        {/* Note Title */}
        <TouchableWithoutFeedback onPress={() => startEditing('title')}>
          <View style={styles.titleContainer}>
            {isEditing ? (
              <TextInput
                ref={titleInputRef}
                style={[styles.title, styles.titleInput]}
                value={title}
                onChangeText={setTitle}
                onFocus={() => {
                  console.log('🎯 Title TextInput focused');
                }}
                placeholder="Title"
                placeholderTextColor={Colors.secondaryText}
                multiline={false}
                returnKeyType="next"
                editable={isAuthor}
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                autoCapitalize="sentences"
                onBlur={() => setIsEditing(false)}
              />
            ) : (
              <Text style={styles.title}>{title || 'Untitled'}</Text>
            )}
          </View>
        </TouchableWithoutFeedback>
        
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

        {/* Note Content - Full Page Text Input */}
        <View style={styles.noteContent}>
          {renderContent()}
        </View>

        {/* Visual card blocks immediately after text */}
        <View style={styles.cardsContainer}>
          {cardBlocks.map((card, index) => (
            <View key={card.id} style={[styles.cardWrapper, { pointerEvents: 'auto', zIndex: 1 }]}>
              <CardBlock
                card={card}
                onContentChange={handleCardContentChange}
                onDelete={handleDeleteCard}
                isEditing={isAuthor}
              />
            </View>
          ))}
        </View>

          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Unified Keyboard Toolbar - matching CreateNoteScreen exactly */}
      {keyboardVisible && (
        <View style={{
          position: 'absolute',
          bottom: keyboardHeight, // This positions it ABOVE the keyboard
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
              console.log('📎 NoteDetail toolbar - Add card pressed');
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
      </>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
  },
  titleContainer: {
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    lineHeight: 36,
    marginBottom: Layout.spacing.md,
  },
  titleInput: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
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
  noteContent: {
    marginTop: Layout.spacing.md,
  },
  contentText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    lineHeight: 24,
  },
  contentInput: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    minHeight: 200,
  },
  textBlockInput: {
    borderWidth: 0,
    padding: 8,
    margin: 0,
    backgroundColor: 'transparent',
    minHeight: 40,
    marginBottom: 8,
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
  cardBlocksContainer: {
    marginTop: Layout.spacing.lg,
    paddingHorizontal: Layout.screen.padding,
  },
  contentArea: {
    minHeight: 50,
    position: 'relative',
  },
  fullPageTextInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    minHeight: 50, // Much smaller minimum height
    width: '100%',
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  cardsContainer: {
    paddingTop: 0,
    gap: Layout.spacing.sm,
  },
  cardWrapper: {
    marginBottom: 0,
    zIndex: 1,
  },
});

// Styles for CardBlock component
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
  // Native keyboard toolbar styles (Apple Notes style)
  nativeKeyboardToolbar: {
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
  nativeToolbarButton: {
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
  nativeToolbarDoneButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 6,
  },
  nativeToolbarDoneText: {
    color: Colors.white,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  },
  // Block type styles
  imageBlock: {
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    padding: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkBlock: {
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    padding: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
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

export default NoteDetailScreen;