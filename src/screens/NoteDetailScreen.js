import React, { useState, useRef, useEffect } from 'react';
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
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { useNotesStore } from '../store/NotesStore';
import ProfileStore from '../store/ProfileStore';
import RichTextRenderer from '../components/RichTextRenderer';
import FolderNoteScreen from './FolderNoteScreen';

const NoteDetailScreen = ({ noteId, onBack, onEdit, onFork, navigation, note, isStarred, onUnstar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [content, setContent] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userProfilePhoto, setUserProfilePhoto] = useState(ProfileStore.getProfilePhoto());
  
  const { getNoteById, updateNote, deleteNote, toggleFavorite, isFavorite } = useNotesStore();
  const currentUser = 'alexnwkim'; // Current logged-in user
  
  useEffect(() => {
    const unsubscribe = ProfileStore.subscribe(() => {
      setUserProfilePhoto(ProfileStore.getProfilePhoto());
    });
    return unsubscribe;
  }, []);
  
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  const handleBack = () => {
    if (isEditing) {
      handleSave();
    }
    if (onBack) onBack();
  };

  const handleSave = () => {
    console.log('💾 NoteDetailScreen saving changes:', { noteId, title, content });
    
    // Update the note in the store
    const updatedNote = updateNote(noteId, {
      title: title.trim(),
      content: content.trim()
    });
    
    if (updatedNote) {
      console.log('✅ Note updated successfully');
    } else {
      console.log('❌ Failed to update note');
    }
    
    setIsEditing(false);
    setShowToolbar(false);
    Keyboard.dismiss();
  };

  const handleFork = () => {
    if (isStarred && onFork) {
      // Use the passed onFork handler for starred notes
      onFork();
    } else {
      // Original fork logic for regular notes
      const forkedNote = {
        ...displayNote,
        title: `Fork of ${displayNote.title}`,
        isPublic: false,
      };
      navigation.navigate('createNote', { initialNote: forkedNote });
    }
  };

  const handleSettingsPress = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleDeleteNote = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote(noteId, displayNote.isPublic);
            setShowSettingsMenu(false);
            if (onBack) onBack();
          }
        }
      ]
    );
  };

  const handleMoveToFolder = () => {
    setShowSettingsMenu(false);
    Alert.alert(
      'Move to Folder',
      'This feature will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  const handlePageInfo = () => {
    setShowSettingsMenu(false);
    
    // Format dates with more detailed information
    const createdDate = displayNote.createdAt 
      ? new Date(displayNote.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : displayNote.timeAgo || 'Unknown';
    
    const lastModified = displayNote.lastModified || displayNote.updatedAt
      ? new Date(displayNote.lastModified || displayNote.updatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : displayNote.timeAgo || 'Unknown';

    // Calculate content statistics
    const contentLength = (displayNote.content || '').length;
    const wordCount = (displayNote.content || '').split(/\s+/).filter(word => word.length > 0).length;
    const lineCount = (displayNote.content || '').split('\n').length;
    
    // Get author information
    const authorName = displayNote.author?.name || displayNote.username || 'Unknown';
    
    Alert.alert(
      'Page Info',
      `Author: ${authorName}\n\nCreated: ${createdDate}\nLast Modified: ${lastModified}\n\nCharacters: ${contentLength}\nWords: ${wordCount}\nLines: ${lineCount}`,
      [{ text: 'OK' }]
    );
  };

  const handleAddToFavorites = () => {
    setShowSettingsMenu(false);
    const wasFavorite = isFavorite(noteId);
    toggleFavorite(noteId);
    
    Alert.alert(
      wasFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      wasFavorite ? 'Note removed from your favorites.' : 'Note added to your favorites.',
      [{ text: 'OK' }]
    );
  };

  const startEditing = (field = 'content') => {
    // Only allow editing if user is the author
    if (!isAuthor) {
      console.log('🚫 Cannot edit note: User is not the author');
      return;
    }
    
    setIsEditing(true);
    setShowToolbar(true);
    
    setTimeout(() => {
      if (field === 'title') {
        titleInputRef.current?.focus();
      } else {
        contentInputRef.current?.focus();
      }
    }, 100);
  };

  const stopEditing = () => {
    setIsEditing(false);
    setShowToolbar(false);
    titleInputRef.current?.blur();
    contentInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const insertLayout = (layoutType) => {
    let template = '';
    switch (layoutType) {
      case 'meeting':
        template = '\n📅 Meeting Notes\n---\n**Date:** \n**Attendees:** \n**Agenda:** \n- \n\n**Action Items:** \n- \n\n';
        break;
      case 'database':
        template = '\n📊 Database\n---\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data 1   | Data 2   | Data 3   |\n\n';
        break;
      case 'tasklist':
        template = '\n✅ Task List\n---\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n';
        break;
      case 'code':
        template = '\n```\n// Your code here\n```\n\n';
        break;
      case 'quote':
        template = '\n> Your quote here\n\n';
        break;
    }
    
    setContent(prev => prev + template);
    setTimeout(() => contentInputRef.current?.focus(), 50);
  };

  const showMoreOptions = () => {
    Alert.alert(
      'More Layout Options',
      'Choose a layout type',
      [
        { text: 'Task List', onPress: () => insertLayout('tasklist') },
        { text: 'Code Block', onPress: () => insertLayout('code') },
        { text: 'Quote', onPress: () => insertLayout('quote') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const createFolder = () => {
    Alert.prompt(
      'Create Folder',
      'Enter folder name',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Create',
          onPress: (folderName) => {
            if (folderName && folderName.trim()) {
              console.log('🆕 Creating folder with name:', folderName.trim());
              console.log('📝 Current content before folder creation:', content);
              
              // Create the folder and insert it into the note content
              const folder = NotesStore.createFolder({
                name: folderName.trim(),
                parentNoteId: noteId,
              });
              
              if (folder) {
                console.log('✅ Created folder:', folder);
                
                // Insert folder graphic into note content with proper line breaks
                const folderGraphic = `\n📁 [${folderName.trim()}](#folder-${folder.id})\n`;
                
                // Calculate the new content first
                const newContent = content + folderGraphic;
                
                // Update the current content to show the folder graphic
                setContent(newContent);
                
                console.log('📝 Previous content:', content);
                console.log('📝 New content after adding folder:', newContent);
                console.log('📝 Added folder graphic:', folderGraphic);
                console.log('👆 User can now click the folder graphic to navigate');
                
                // Debug all folders
                NotesStore.debugFolders();
                
                // Ensure cursor moves to end after folder creation
                setTimeout(() => {
                  if (contentInputRef.current) {
                    contentInputRef.current.focus();
                    
                    // Move cursor to the end of the content
                    setTimeout(() => {
                      if (contentInputRef.current) {
                        const cursorPosition = newContent.length;
                        contentInputRef.current.setNativeProps({
                          selection: { start: cursorPosition, end: cursorPosition }
                        });
                        console.log('📍 Moved cursor to position:', cursorPosition);
                      }
                    }, 50);
                  }
                }, 100);
              } else {
                console.log('❌ Failed to create folder');
                Alert.alert('Error', 'Failed to create folder');
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  // Get the actual note from store or use passed note (for starred notes)
  const storeNote = getNoteById(noteId);
  
  // Fallback note data if none found
  const displayNote = note || storeNote || {
    id: noteId || 1,
    title: 'Note Not Found',
    content: 'This note could not be found in the store.',
    timeAgo: 'Unknown',
    isPublic: false,
  };
  
  // Check if current user is the author (can edit)
  const isAuthor = isStarred ? 
    (displayNote.isOwnNote || displayNote.author?.id === currentUser || displayNote.author?.name === currentUser) : // Starred notes can be editable if owned by user
    displayNote.isPublic ? 
      (displayNote.username === currentUser || displayNote.author === currentUser) : 
      true; // Private notes are always editable by current user
  
  console.log('📄 NoteDetailScreen - noteId:', noteId, 'found note:', !!note, 'isAuthor:', isAuthor);

  const handleFolderPress = (folderId, folderName) => {
    console.log('📁 Opening folder:', folderId, folderName);
    setCurrentFolderId(folderId);
  };

  const handleFolderBack = () => {
    console.log('📁 Closing folder');
    setCurrentFolderId(null);
  };

  // Initialize note data
  useEffect(() => {
    setTitle(displayNote.title);
    setContent(displayNote.content);
  }, [displayNote]);

  // Auto-save for existing notes (debounced)
  useEffect(() => {
    if (!isEditing) return;
    
    const timer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        const noteData = {
          title: title || displayNote.title,
          content: content,
        };
        
        console.log('💾 Auto-saving note changes:', noteData);
        updateNote(noteId, noteData);
      }
    }, 1000); // Auto-save after 1 second of no changes

    return () => clearTimeout(timer);
  }, [title, content, isEditing, noteId, updateNote, displayNote.title]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      console.log('🎹 Keyboard shown in note detail - showing toolbar');
      setShowToolbar(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 Keyboard hidden in note detail - hiding toolbar');
      if (!isEditing) {
        setShowToolbar(false);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isEditing]);

  // If we're in a folder, show the folder screen
  if (currentFolderId) {
    return (
      <FolderNoteScreen 
        folderId={currentFolderId}
        onBack={handleFolderBack}
        navigation={navigation}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (showSettingsMenu) {
        setShowSettingsMenu(false);
      } else if (!isEditing && isAuthor) {
        startEditing();
      }
    }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            // Auto-save before going back
            if (isEditing && (title.trim() || content.trim())) {
              const noteData = {
                title: title || displayNote.title,
                content: content,
              };
              
              console.log('💾 Auto-saving before back navigation:', noteData);
              updateNote(noteId, noteData);
            }
            
            if (onBack) onBack();
          }} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {/* Status icon - always visible */}
            <View style={styles.statusIcon}>
              <Icon 
                name={displayNote.isPublic ? "globe" : "lock"} 
                size={16} 
                color={Colors.secondaryText} 
              />
            </View>
            
            {/* Settings menu - always visible */}
            <View style={styles.settingsContainer}>
              <TouchableOpacity onPress={handleSettingsPress} style={styles.actionButton}>
                <Icon name="more-horizontal" size={20} color={Colors.primaryText} />
              </TouchableOpacity>
              
              {showSettingsMenu && (
                <View style={styles.settingsMenu}>
                  {isAuthor && (
                    <>
                      <TouchableOpacity onPress={handleDeleteNote} style={styles.menuItem}>
                        <Icon name="trash-2" size={16} color={Colors.primaryText} />
                        <Text style={styles.menuItemText}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleMoveToFolder} style={styles.menuItem}>
                        <Icon name="folder" size={16} color={Colors.primaryText} />
                        <Text style={styles.menuItemText}>Move to</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity onPress={handlePageInfo} style={styles.menuItem}>
                    <Icon name="info" size={16} color={Colors.primaryText} />
                    <Text style={styles.menuItemText}>Page Info</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddToFavorites} style={styles.menuItem}>
                    <Icon 
                      name="heart" 
                      size={16} 
                      color={isFavorite(noteId) ? Colors.floatingButton : Colors.primaryText}
                      fill={isFavorite(noteId) ? Colors.floatingButton : 'none'}
                    />
                    <Text style={styles.menuItemText}>
                      {isFavorite(noteId) ? 'Remove from Favorites' : 'Add to Favorites'}
                    </Text>
                  </TouchableOpacity>
                  {(isStarred || (!isAuthor && displayNote.isPublic)) && (
                    <TouchableOpacity onPress={handleFork} style={styles.menuItem}>
                      <Icon name="git-branch" size={16} color={Colors.primaryText} />
                      <Text style={styles.menuItemText}>Fork</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Note Title */}
          <TouchableWithoutFeedback onPress={() => isAuthor && startEditing('title')}>
            <View style={styles.titleContainer}>
              {isEditing ? (
                <TextInput
                  ref={titleInputRef}
                  style={[styles.title, styles.titleInput]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={Colors.secondaryText}
                  multiline={false}
                  returnKeyType="next"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                  onSubmitEditing={() => contentInputRef.current?.focus()}
                />
              ) : (
                <Text style={styles.title}>{title}</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
          
          {/* Author Profile Section for Public Notes */}
          {(displayNote.isPublic || isStarred) && (
            <View style={styles.authorSection}>
              <View style={styles.authorInfo}>
                <View style={styles.authorAvatar}>
                  {displayNote.username === currentUser && userProfilePhoto ? (
                    <Image source={{ uri: userProfilePhoto }} style={styles.authorAvatarImage} />
                  ) : (
                    <Icon name="user" size={20} color={Colors.textGray} />
                  )}
                </View>
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>{displayNote.author?.name || displayNote.username || 'Unknown'}</Text>
                  <Text style={styles.authorUserId}>@{displayNote.username || 'unknown'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Fork Attribution */}
          {displayNote.forkedFrom && (
            <View style={styles.forkAttribution}>
              <View style={styles.forkHeader}>
                <Icon name="git-branch" size={16} color={Colors.floatingButton} />
                <Text style={styles.forkTitle}>Forked from</Text>
              </View>
              <View style={styles.forkInfo}>
                <Text style={styles.forkAuthor}>{displayNote.forkedFrom.author.name}</Text>
                <Text style={styles.forkOriginalTitle}>"{displayNote.forkedFrom.title}"</Text>
                <Text style={styles.forkDate}>
                  Originally created {new Date(displayNote.forkedFrom.originalCreatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          )}

          {(displayNote.isPublic || isStarred) && (
            <View style={styles.publicInfo}>
              <View style={styles.publicMeta}>
                <Text style={styles.forkCount}>
                  <Icon name="git-branch" size={16} color={Colors.secondaryText} /> {displayNote.forksCount || displayNote.forkCount || 0} forks
                </Text>
                {!isAuthor && (
                  <View style={styles.readOnlyIndicator}>
                    <Icon name="eye" size={16} color={Colors.secondaryText} />
                    <Text style={styles.readOnlyText}>Read only</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Fork Button for Starred Notes */}
          {isStarred && (
            <View style={styles.starredActions}>
              <TouchableOpacity style={styles.forkButton} onPress={handleFork}>
                <Icon name="git-branch" size={16} color={Colors.mainBackground} />
                <Text style={styles.forkButtonText}>Fork</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Note Content */}
          <TouchableWithoutFeedback onPress={() => isAuthor && startEditing('content')}>
            <View style={styles.noteContent}>
              {isEditing ? (
                <TextInput
                  ref={contentInputRef}
                  style={[styles.contentText, styles.contentInput]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Start writing..."
                  placeholderTextColor={Colors.secondaryText}
                  multiline={true}
                  textAlignVertical="top"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                />
              ) : (
                <RichTextRenderer 
                  content={content} 
                  onFolderPress={handleFolderPress}
                  style={styles.contentText}
                />
              )}
            </View>
          </TouchableWithoutFeedback>

        </ScrollView>

        {/* Keyboard Toolbar with Layout Options - Show when editing or toolbar needed and user is author */}
        {(showToolbar || isEditing) && isAuthor && (
          <View style={styles.keyboardToolbar}>
            <View style={styles.toolbarLeft}>
              <TouchableOpacity 
                style={styles.layoutButton} 
                onPress={() => insertLayout('meeting')}
              >
                <Icon name="users" size={16} color={Colors.primaryText} />
                <Text style={styles.layoutButtonText}>Meeting</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.layoutButton}
                onPress={() => insertLayout('database')}
              >
                <Icon name="database" size={16} color={Colors.primaryText} />
                <Text style={styles.layoutButtonText}>Database</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.layoutButton}
                onPress={() => showMoreOptions()}
              >
                <Icon name="more-horizontal" size={16} color={Colors.primaryText} />
                <Text style={styles.layoutButtonText}>More</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => createFolder()}
              >
                <Icon name="plus" size={20} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={stopEditing}
            >
              <Text style={styles.doneButtonText}>return</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  backIcon: {
    fontSize: 24,
    color: Colors.primaryText,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    lineHeight: 36,
    marginBottom: Layout.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.sm,
  },
  forkAttribution: {
    backgroundColor: Colors.noteCard,
    borderRadius: 8,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  forkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  forkTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
  },
  forkInfo: {
    gap: Layout.spacing.xs,
  },
  forkAuthor: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
  },
  forkOriginalTitle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  forkDate: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
  },
  starredActions: {
    marginBottom: Layout.spacing.md,
  },
  forkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryText,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: 10,
    gap: Layout.spacing.sm,
    minWidth: 120,
  },
  forkButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.mainBackground,
  },
  metaText: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
  },
  publicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  author: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  publicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  forkCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius / 2,
  },
  readOnlyText: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  noteContent: {
    marginTop: Layout.spacing.md,
  },
  contentText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    lineHeight: 24,
  },
  titleContainer: {
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
  authorAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
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
  contentInput: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    minHeight: 200,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  toolbarButton: {
    padding: Layout.spacing.xs,
    borderRadius: 6,
    backgroundColor: Colors.white,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
  },
  layoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 6,
    backgroundColor: Colors.white,
    minHeight: 32,
    gap: 4,
  },
  layoutButtonText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  addButton: {
    padding: Layout.spacing.xs,
    borderRadius: 6,
    backgroundColor: Colors.white,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
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
  settingsContainer: {
    position: 'relative',
  },
  settingsMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    paddingVertical: Layout.spacing.sm,
    minWidth: 140,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1000,
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
});

export default NoteDetailScreen;