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
  Image,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { useNotesStore } from '../store/NotesStore';
import ProfileStore from '../store/ProfileStore';
import RichTextRenderer from '../components/RichTextRenderer';
import FolderNoteScreen from './FolderNoteScreen';
import { useAuth } from '../contexts/AuthContext';

const NoteDetailScreen = ({ noteId, onBack, onEdit, onFork, navigation, note, isStarredNote, onUnstar, onStarredRemove, route }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [content, setContent] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userProfilePhoto, setUserProfilePhoto] = useState(ProfileStore.getProfilePhoto());
  
  const { getNoteById, updateNote, deleteNote, toggleFavorite, isFavorite, toggleStarred, isStarred } = useNotesStore();
  const { user } = useAuth(); // useAuth 훅에서 user 가져오기
  
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
    console.log('🔥 SETTINGS BUTTON PRESSED!');
    console.log('🔥 Current state:', { showSettingsMenu, isAuthor, noteId });
    const newState = !showSettingsMenu;
    setShowSettingsMenu(newState);
    console.log('🔥 Menu state changed from', showSettingsMenu, 'to', newState);
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

  const handleAddToPinned = async () => {
    console.log('🔥 =========================================');
    console.log('🔥 handleAddToPinned called!');
    console.log('🔥 noteId:', noteId);
    console.log('🔥 user:', user?.id);
    setShowSettingsMenu(false);
    
    // This function handles pinned notes
    // regardless of whether it's author's note or not
    const wasPinned = isFavorite(noteId); // isFavorite is legacy alias for isPinned
    console.log('📌 BEFORE toggle - wasPinned:', wasPinned);
    console.log('📌 BEFORE toggle - isAuthor:', isAuthor);
    
    console.log('🔥 About to call toggleFavorite with noteId:', noteId);
    
    try {
      const result = await toggleFavorite(noteId); // toggleFavorite is legacy alias for togglePinned
      console.log('🔥 toggleFavorite returned:', result);
      
      // Check state after toggle
      const isNowPinned = isFavorite(noteId);
      console.log('📌 AFTER toggle - isNowPinned:', isNowPinned);
      
      Alert.alert(
        wasPinned ? 'Removed from Pinned' : 'Added to Pinned',
        wasPinned ? 'Note removed from your pinned notes.' : 'Note added to your pinned notes.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('🔥 toggleFavorite error:', error);
      Alert.alert('Error', 'Failed to update pin status. Please try again.');
    }
    
    console.log('🔥 =========================================');
  };

  const startEditing = (field = 'content') => {
    console.log('✍️ =========================');
    console.log('✍️ startEditing called with field:', field);
    console.log('✍️ 현재 상태 체크:');
    console.log('  - isAuthor:', isAuthor);
    console.log('  - isEditing:', isEditing);
    console.log('  - isStarredNote:', isStarredNote);
    console.log('  - displayNote.isPublic:', displayNote.isPublic);
    console.log('  - displayNote.username:', displayNote.username);
    console.log('  - currentUserId:', user?.id);
    console.log('  - title 길이:', title.length);
    console.log('  - content 길이:', content.length);
    
    // Only allow editing if user is the author
    if (!isAuthor) {
      console.log('🚫 Cannot edit note: User is not the author');
      console.log('🚫 Debug - isAuthor logic result:', isAuthor);
      return;
    }
    
    console.log('✅ 편집 모드 활성화 시작...');
    setIsEditing(true);
    setShowToolbar(true);
    console.log('✅ setIsEditing(true) 호출 완료');
    console.log('✅ setShowToolbar(true) 호출 완료');
    
    setTimeout(() => {
      console.log('⏰ 포커스 setTimeout 실행, 대상 필드:', field);
      if (field === 'title') {
        console.log('🎯 Title input에 포커스 시도...');
        titleInputRef.current?.focus();
      } else {
        console.log('🎯 Content input에 포커스 시도...');
        contentInputRef.current?.focus();
      }
      console.log('⏰ 포커스 작업 완료');
    }, 100);
    
    console.log('✍️ =========================');
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
              console.log('⚠️  Folder creation temporarily disabled - NotesStore not imported');
              const folder = {
                id: Date.now().toString(),
                name: folderName.trim(),
                parentNoteId: noteId,
              };
              
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

  // State for storing the note loaded from store
  const [storeNote, setStoreNote] = useState(null);
  const [loadingNote, setLoadingNote] = useState(true);
  
  // Load note from store asynchronously
  useEffect(() => {
    const loadNote = async () => {
      console.log('🔍 Loading note for ID:', noteId);
      setLoadingNote(true);
      
      if (note) {
        // If note is passed as prop, use it directly
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
    }
  }, [noteId, note]); // Remove getNoteById from deps to prevent infinite rerenders
  
  // Normalize data - convert is_public to isPublic for consistency
  const normalizeNote = (noteData) => {
    if (!noteData) return null;
    return {
      ...noteData,
      isPublic: noteData.isPublic || noteData.is_public || false,
      username: noteData.username || noteData.profiles?.username || 'Unknown',
      author: noteData.author || noteData.profiles?.username || 'Unknown'
    };
  };

  // Get displayNote from store or fallback
  const displayNote = normalizeNote(storeNote) || {
    id: noteId || 1,
    title: loadingNote ? 'Loading...' : 'Note Not Found',
    content: loadingNote ? 'Loading note content...' : 'This note could not be found in the store.',
    timeAgo: 'Unknown',
    isPublic: false,
  };
  
  // Check if current user is the author (can edit) - TEMPORARILY FORCE TRUE
  const isAuthor = React.useMemo(() => {
    if (!displayNote || !user) return false;
    
    console.log('🔍 Author check:', {
      currentUserId: user.id,
      noteUserId: displayNote.user_id,
      noteUsername: displayNote.username,
      userEmail: user.email,
      isStarredNote,
      isPublic: displayNote.isPublic
    });
    
    // TEMP: Force true for testing - ID mismatch issue
    console.log('⚠️ FORCING isAuthor = true for testing');
    return true; // 임시로 항상 true 반환
  }, [displayNote.user_id, user, isStarredNote, displayNote.isPublic]);
  
  console.log('📄 NoteDetailScreen - noteId:', noteId, 'found note:', !!note, 'isAuthor:', isAuthor, 'isStarredNote:', isStarredNote, 'hasStarredRemove:', !!onStarredRemove);
  console.log('📄 Route params:', route?.params);
  console.log('📄 displayNote.isPublic:', displayNote.isPublic, 'displayNote.is_public:', displayNote.is_public);
  console.log('📄 displayNote structure:', JSON.stringify(displayNote, null, 2));
  
  // TEMP: Make functions available globally for console debugging
  React.useEffect(() => {
    global.testPin = () => {
      console.log('🔥 GLOBAL TEST: Calling toggleFavorite for noteId:', noteId);
      toggleFavorite(noteId);
    };
    global.testAddToFavorites = () => {
      console.log('🔥 GLOBAL TEST: Calling handleAddToPinned');
      handleAddToPinned();
    };
    return () => {
      delete global.testPin;
      delete global.testAddToFavorites;
    };
  }, [noteId]);

  const handleFolderPress = (folderId, folderName) => {
    console.log('📁 Opening folder:', folderId, folderName);
    setCurrentFolderId(folderId);
  };

  const handleFolderBack = () => {
    console.log('📁 Closing folder');
    setCurrentFolderId(null);
  };

  // Initialize note data when displayNote changes
  useEffect(() => {
    console.log('🔄 Updating title and content from displayNote:', displayNote.title);
    setTitle(displayNote.title || '');
    setContent(displayNote.content || '');
  }, [displayNote.title, displayNote.content, displayNote.id, loadingNote]); // Include loadingNote to update when loading completes

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

  // Show loading spinner while note is loading
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
      {/* 설정 메뉴를 최상위로 분리 - TouchableWithoutFeedback 밖에 배치 */}
      {showSettingsMenu && (
        <View style={[styles.settingsMenu, {position: 'absolute', top: 100, right: 20, zIndex: 99999}]}>
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
          <TouchableOpacity onPress={handleAddToPinned} style={styles.menuItem}>
            <Icon 
              name={isFavorite(noteId) ? "bookmark" : "bookmark"} 
              size={16} 
              color={isFavorite(noteId) ? Colors.floatingButton : Colors.primaryText}
              fill={isFavorite(noteId) ? Colors.floatingButton : 'none'}
            />
            <Text style={styles.menuItemText}>
              {isFavorite(noteId) ? 'Remove from Pinned' : 'Add to Pinned'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 설정 메뉴 닫기용 TouchableWithoutFeedback */}
      <TouchableWithoutFeedback 
        onPress={() => {
          if (showSettingsMenu) {
            console.log('🔥 Closing settings menu by touching background');
            setShowSettingsMenu(false);
          }
        }}
        style={{ flex: 1 }}
      >
        <View style={styles.containerInner}>
        {/* Header */}
        <View style={styles.header} pointerEvents="box-none">
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
          
          <View style={styles.headerActions} pointerEvents="box-none">
            {/* Status icon - always visible */}
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
                  onPress={() => {
                    const currentlyStarred = isStarred(noteId);
                    console.log('⭐ Star button pressed - currentlyStarred:', currentlyStarred, 'isAuthor:', isAuthor, 'isStarredNote:', isStarredNote);
                    
                    // For ALL public notes (including own notes), use starred system
                    if (displayNote.isPublic) {
                      toggleStarred(noteId);
                      
                      // If removing from starred and we have a callback, call it to update the UI
                      if (currentlyStarred && onStarredRemove) {
                        console.log('🗑️ Notifying starred notes screen to update');
                        setTimeout(() => onStarredRemove(), 100);
                      }
                    } else {
                      // For private notes, use favorites (pinned)
                      toggleFavorite(noteId);
                    }
                  }}
                >
                  {(displayNote.isPublic ? isStarred(noteId) : isFavorite(noteId)) ? (
                    <Text style={[styles.solidStar, { color: Colors.floatingButton, fontSize: 20 }]}>★</Text>
                  ) : (
                    <Text style={[styles.outlineStar, { color: Colors.secondaryText, fontSize: 20 }]}>☆</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleFork}
                >
                  <Icon name="git-branch" size={20} color={Colors.secondaryText} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Settings button with pointer events fix */}
            <View style={styles.settingsContainer} pointerEvents="box-none">
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  console.log('🔥 SETTINGS BUTTON PRESSED!');
                  handleSettingsPress();
                }}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Icon name="more-horizontal" size={20} color={Colors.primaryText} />
              </TouchableOpacity>
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
          <TouchableWithoutFeedback onPress={() => {
            console.log('👆 Title 영역 클릭됨');
            console.log('👆 isAuthor 체크:', isAuthor);
            if (isAuthor) {
              console.log('✅ Author 확인, startEditing 호출');
              startEditing('title');
            } else {
              console.log('❌ Author가 아님, 편집 불가');
            }
          }}>
            <View style={styles.titleContainer}>
              {(() => {
                console.log('🎬 Title 영역 렌더링, isEditing:', isEditing);
                return isEditing ? (
                  <TextInput
                    ref={titleInputRef}
                  style={[styles.title, styles.titleInput]}
                  value={title}
                  onChangeText={(newText) => {
                    console.log('⌨️ Title 키보드 입력 감지:', newText);
                    console.log('⌨️ 이전 title 값:', title);
                    console.log('⌨️ isEditing 상태:', isEditing);
                    setTitle(newText);
                  }}
                  onFocus={() => {
                    console.log('🎯 Title TextInput focused');
                    console.log('🎯 현재 isEditing:', isEditing);
                  }}
                  onBlur={() => {
                    console.log('🎯 Title TextInput blurred');
                  }}
                  placeholder="Title"
                  placeholderTextColor={Colors.secondaryText}
                  multiline={false}
                  returnKeyType="next"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                  editable={true}
                  onSubmitEditing={() => contentInputRef.current?.focus()}
                  />
                ) : (
                  <Text style={styles.title}>{title}</Text>
                );
              })()}
            </View>
          </TouchableWithoutFeedback>
          
          {/* Author Profile Section for Public Notes */}
          {(displayNote.isPublic || isStarredNote) && (
            <View style={styles.authorSection}>
              <View style={styles.authorInfo}>
                <View style={styles.authorAvatar}>
                  {displayNote.user_id === user?.id && userProfilePhoto ? (
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

          {(displayNote.isPublic || isStarredNote) && (
            <View style={styles.publicInfo}>
              <View style={styles.publicMeta}>
                <Text style={styles.statCount}>
                  {displayNote.starCount || 0} stars
                </Text>
                <Text style={styles.statCount}>
                  {displayNote.forksCount || displayNote.forkCount || 0} forks
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

          {/* Fork Button for Starred Notes - only show if not author and not public (avoid duplication) */}
          {isStarredNote && !isAuthor && !displayNote.isPublic && (
            <View style={styles.starredActions}>
              <TouchableOpacity style={styles.forkButton} onPress={handleFork}>
                <Icon name="git-branch" size={16} color={Colors.mainBackground} />
                <Text style={styles.forkButtonText}>Fork</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Note Content */}
          <TouchableWithoutFeedback onPress={() => {
            console.log('👆 Content 영역 클릭됨');
            console.log('👆 isAuthor 체크:', isAuthor);
            if (isAuthor) {
              console.log('✅ Author 확인, startEditing 호출');
              startEditing('content');
            } else {
              console.log('❌ Author가 아님, 편집 불가');
            }
          }}>
            <View style={styles.noteContent}>
              {(() => {
                console.log('🎬 Content 영역 렌더링, isEditing:', isEditing);
                return isEditing ? (
                  <TextInput
                    ref={contentInputRef}
                  style={[styles.contentText, styles.contentInput]}
                  value={content}
                  onChangeText={(newText) => {
                    console.log('⌨️ Content 키보드 입력 감지:', newText.substring(0, 50) + (newText.length > 50 ? '...' : ''));
                    console.log('⌨️ 이전 content 길이:', content.length);
                    console.log('⌨️ 새 content 길이:', newText.length);
                    console.log('⌨️ isEditing 상태:', isEditing);
                    setContent(newText);
                  }}
                  onFocus={() => {
                    console.log('🎯 Content TextInput focused');
                    console.log('🎯 현재 isEditing:', isEditing);
                    console.log('🎯 현재 content 길이:', content.length);
                  }}
                  onBlur={() => {
                    console.log('🎯 Content TextInput blurred');
                  }}
                  placeholder="Start writing..."
                  placeholderTextColor={Colors.secondaryText}
                  multiline={true}
                  textAlignVertical="top"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                  editable={true}
                  />
                ) : (
                  console.log('📝 Rendering RichTextRenderer with content:', typeof content, content?.length || 0, 'chars'),
                  <RichTextRenderer 
                    content={content} 
                    onFolderPress={handleFolderPress}
                    style={styles.contentText}
                  />
                );
              })()}
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
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  containerInner: {
    flex: 1,
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
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    marginRight: Layout.spacing.md,
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
    elevation: 15, // 안드로이드 elevation 증가
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 9999, // z-index 크게 증가
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
  solidStar: {
    textAlign: 'center',
    lineHeight: 20,
  },
  outlineStar: {
    textAlign: 'center',
    lineHeight: 20,
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
});

export default NoteDetailScreen;