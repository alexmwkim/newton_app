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
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NotesStore, { useNotesStore } from '../store/NotesStore';
import RichTextRenderer from '../components/RichTextRenderer';

const FolderNoteScreen = ({ folderId, onBack, navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubFolderId, setCurrentSubFolderId] = useState(null);
  const [showKeyboardToolbar, setShowKeyboardToolbar] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  // Use the store hook to get real-time updates
  const notesStore = useNotesStore();
  
  // Get folder info
  const folder = notesStore.getFolderById(folderId);
  
  const handleBack = () => {
    // Auto-save before going back
    if (title.trim() || content.trim()) {
      const noteData = {
        title: title.trim() || folder?.name || 'Untitled',
        content: content.trim(),
      };
      
      console.log('💾 Auto-saving before back navigation:', noteData);
      notesStore.addNoteToFolder(folderId, noteData);
    }
    
    console.log('Navigate back from folder');
    if (onBack) onBack();
  };

  const handleSave = () => {
    // Always save if there's any content (including folder graphics)
    if (title.trim() || content.trim()) {
      const noteData = {
        title: title.trim() || folder?.name || 'Untitled',
        content: content.trim(),
      };
      
      console.log('💾 FolderNoteScreen saving note to folder:', folderId, noteData);
      
      // Save to folder
      const savedNote = notesStore.addNoteToFolder(folderId, noteData);
      
      if (savedNote) {
        console.log('✅ Note saved successfully:', savedNote);
      } else {
        console.log('❌ Failed to save note to folder');
        Alert.alert('Error', 'Failed to save note to folder');
        return;
      }
    } else {
      console.log('📝 No content to save, just going back');
    }
    
    console.log('🔙 Navigating back from folder');
    handleBack();
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      console.log('🎹 Keyboard shown in folder - showing toolbar');
      setShowKeyboardToolbar(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 Keyboard hidden in folder - hiding toolbar');
      setShowKeyboardToolbar(false);
      setActiveInput(null);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-focus on content input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🎯 Auto-focusing content input in folder');
      setIsEditing(true);
      setActiveInput('content');
      if (contentInputRef.current) {
        contentInputRef.current.focus();
      }
    }, 600); // Increased delay for folder screens

    return () => clearTimeout(timer);
  }, []);

  // Initialize folder as a note page - folder name becomes note title
  useEffect(() => {
    if (folder) {
      // Set title to folder name
      setTitle(folder.name || 'Untitled');
      
      // Load existing content if any
      if (folder.notes && folder.notes.length > 0) {
        const mainNote = folder.notes.find(note => note.title === folder.name);
        if (mainNote && mainNote.content) {
          setContent(mainNote.content);
          console.log('📖 Loaded existing folder content:', mainNote.content);
        } else {
          console.log('📖 No existing content found for folder:', folder.name);
          setContent(''); // Ensure we start with empty content
        }
      } else {
        console.log('📖 No notes found in folder:', folder.name);
        setContent(''); // Ensure we start with empty content
      }
    }
  }, [folder]);

  // Watch for folder updates after subfolder creation - but prevent infinite loops
  useEffect(() => {
    if (folder) {
      console.log('📊 Folder updated:', folder);
      console.log('📊 Folder notes:', folder.notes);
      
      // Only reload content if it's significantly different (not just whitespace/formatting)
      if (folder.notes && folder.notes.length > 0) {
        const mainNote = folder.notes.find(note => note.title === folder.name);
        if (mainNote && mainNote.content) {
          const currentContentTrimmed = content.trim();
          const mainNoteContentTrimmed = mainNote.content.trim();
          
          // Only update if content is actually different
          if (mainNoteContentTrimmed !== currentContentTrimmed) {
            console.log('📖 Reloading updated folder content:', mainNote.content);
            setContent(mainNote.content);
          }
        }
      }
    }
  }, [folder?.notes?.length]); // Only watch the length change, not the entire notes array

  // Auto-save content changes (debounced) - Only when there are actual changes
  useEffect(() => {
    if (!isEditing) return;
    if (!title.trim() && !content.trim()) return; // Don't save empty content
    
    // Check if current content is different from what's already saved
    const existingNote = folder?.notes?.find(note => note.title === folder.name);
    const currentContentTrimmed = content.trim();
    const existingContentTrimmed = existingNote?.content?.trim() || '';
    
    // Don't auto-save if content hasn't changed
    if (currentContentTrimmed === existingContentTrimmed) {
      return;
    }
    
    const timer = setTimeout(() => {
      const noteData = {
        title: title.trim() || folder?.name || 'Untitled',
        content: content.trim(),
      };
      
      console.log('💾 Auto-saving folder content (content changed):', noteData);
      notesStore.addNoteToFolder(folderId, noteData);
    }, 3000); // Increased to 3 seconds to reduce interference

    return () => clearTimeout(timer);
  }, [title, content, isEditing, folderId, folder?.name]); // Removed notesStore from dependencies to prevent loops

  const insertLayout = (layoutType) => {
    console.log('🎯 insertLayout called with:', layoutType, 'activeInput:', activeInput);
    
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
    
    console.log('📝 Template to insert:', template);
    
    // Always insert into content if we're in editing mode
    if (activeInput === 'title') {
      setTitle(prev => {
        const newTitle = prev + template;
        console.log('📝 Updated title to:', newTitle);
        return newTitle;
      });
      setTimeout(() => titleInputRef.current?.focus(), 50);
    } else {
      // Default to content if activeInput is not set properly
      setContent(prev => {
        const newContent = prev + template;
        console.log('📝 Updated content to:', newContent);
        return newContent;
      });
      
      // Ensure we stay in editing mode and focused
      setIsEditing(true);
      setActiveInput('content');
      setTimeout(() => {
        if (contentInputRef.current) {
          contentInputRef.current.focus();
          console.log('🎯 Re-focused content input after layout insertion');
        }
      }, 100);
    }
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

  const createSubFolder = () => {
    Alert.prompt(
      'Create Sub-Folder',
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
              console.log('🆕 Creating sub-folder with name:', folderName.trim());
              console.log('📝 Current content before folder creation:', content);
              
              // Create the sub-folder
              const subFolder = notesStore.createFolder({
                name: folderName.trim(),
                parentNoteId: folderId,
              });
              
              if (subFolder) {
                console.log('✅ Created sub-folder:', subFolder);
                
                // Insert folder graphic into note content with proper line breaks
                const folderGraphic = `\n📁 [${folderName.trim()}](#folder-${subFolder.id})\n`;
                
                // Calculate the new content first
                const newContent = content + folderGraphic;
                
                // Update the current content to show the folder graphic
                setContent(newContent);
                
                console.log('📝 Previous content:', content);
                console.log('📝 New content after adding folder:', newContent);
                
                // IMPORTANT: Save the updated content to the folder's note data
                const noteData = {
                  title: title.trim() || folder?.name || 'Untitled',
                  content: newContent.trim(),
                };
                
                console.log('💾 Saving folder content with new subfolder:', noteData);
                notesStore.addNoteToFolder(folderId, noteData);
                
                console.log('📝 Added folder graphic to current content');
                console.log('👆 User can now click the folder graphic to navigate');
                
                // Ensure editing stays active after folder creation
                setTimeout(() => {
                  setIsEditing(true);
                  setActiveInput('content');
                  
                  setTimeout(() => {
                    if (contentInputRef.current) {
                      contentInputRef.current.focus();
                      console.log('📍 Re-focused input after folder creation');
                    }
                  }, 100);
                }, 100);
              } else {
                console.log('❌ Failed to create sub-folder');
                Alert.alert('Error', 'Failed to create folder');
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const hideKeyboard = () => {
    console.log('🎹 Hiding keyboard manually');
    Keyboard.dismiss();
    setShowKeyboardToolbar(false);
    setActiveInput(null);
    setIsEditing(false); // Exit editing mode when done
  };

  const handleSubFolderBack = () => {
    console.log('📁 Closing sub-folder');
    setCurrentSubFolderId(null);
  };

  const handleFolderPress = (subFolderId, folderName) => {
    console.log('📁 Opening sub-folder from existing notes:', subFolderId, folderName);
    setCurrentSubFolderId(subFolderId);
  };

  const hasContent = title.trim().length > 0 || content.trim().length > 0;

  // If we're in a sub-folder, show another FolderNoteScreen
  if (currentSubFolderId) {
    return (
      <FolderNoteScreen 
        folderId={currentSubFolderId}
        onBack={handleSubFolderBack}
        navigation={navigation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header - Clean like CreateNoteScreen */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.actionButton}>
            <Icon name="arrow-left" size={18} color={Colors.primaryText} />
          </TouchableOpacity>
          
          {/* Empty center - no title in header */}
          <View style={styles.headerCenter} />
          
          {/* Empty space for balance */}
          <View style={styles.actionButton} />
        </View>

        {/* Content - Same layout as main note pages */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Title Input - Like CreateNoteScreen */}
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={Colors.secondaryText}
            value={title}
            onChangeText={(text) => {
              console.log('📝 Title changed to:', text);
              setTitle(text);
            }}
            multiline={true}
            numberOfLines={1}
            maxLength={100}
            returnKeyType="next"
            scrollEnabled={false}
            autoFocus={false}
            editable={true}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            onFocus={() => {
              console.log('📱 Title input focused');
              setActiveInput('title');
              setShowKeyboardToolbar(true);
            }}
            onSubmitEditing={() => {
              console.log('📱 Title submit, moving to content');
              setIsEditing(true);
              contentInputRef.current?.focus();
              setActiveInput('content');
            }}
          />

          {/* Content Area - Always show TextInput when editing */}
          <View style={styles.contentArea}>
            {isEditing ? (
              <TextInput
                ref={contentInputRef}
                style={styles.contentInput}
                placeholder="Write something..."
                placeholderTextColor={Colors.secondaryText}
                value={content}
                onChangeText={(text) => {
                  console.log('✍️ Content changed from length:', content.length, 'to length:', text.length);
                  console.log('✍️ New text:', text);
                  setContent(text);
                }}
                multiline={true}
                textAlignVertical="top"
                blurOnSubmit={false}
                editable={true}
                autoFocus={false}
                keyboardType="default"
                returnKeyType="default"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                onFocus={() => {
                  console.log('📱 Content input focused in folder');
                  setActiveInput('content');
                  setIsEditing(true);
                  setShowKeyboardToolbar(true);
                }}
                onBlur={() => {
                  console.log('📱 Content input blurred in folder');
                  // Keep editing mode active to maintain input functionality
                }}
                onKeyPress={(event) => {
                  console.log('🔤 Key pressed:', event.nativeEvent.key);
                }}
              />
            ) : (
              <TouchableOpacity 
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => {
                  console.log('Content area pressed, setting editing to true');
                  setIsEditing(true);
                  setActiveInput('content');
                  setShowKeyboardToolbar(true); // Force show toolbar
                  setTimeout(() => {
                    if (contentInputRef.current) {
                      contentInputRef.current.focus();
                      console.log('Focused content input after touch');
                    }
                  }, 50);
                }}
              >
                {content ? (
                  <RichTextRenderer 
                    content={content} 
                    onFolderPress={handleFolderPress}
                    style={styles.contentText}
                  />
                ) : (
                  <Text style={[styles.contentText, { color: Colors.secondaryText }]}>
                    Write something...
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Keyboard Toolbar with Layout Options - Show when editing or keyboard is visible */}
        {(showKeyboardToolbar || isEditing) && (
          <View style={styles.keyboardToolbar}>
            <View style={styles.toolbarLeft}>
              <TouchableOpacity 
                style={styles.layoutButton} 
                onPress={() => {
                  console.log('🎯 Meeting button pressed');
                  insertLayout('meeting');
                }}
              >
                <Icon name="users" size={16} color={Colors.primaryText} />
                <Text style={styles.layoutButtonText}>Meeting</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.layoutButton}
                onPress={() => {
                  console.log('🎯 Database button pressed');
                  insertLayout('database');
                }}
              >
                <Icon name="database" size={16} color={Colors.primaryText} />
                <Text style={styles.layoutButtonText}>Database</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.layoutButton}
                onPress={() => {
                  console.log('🎯 More button pressed');
                  showMoreOptions();
                }}
              >
                <Icon name="more-horizontal" size={16} color={Colors.primaryText} />
                <Text style={styles.layoutButtonText}>More</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  console.log('🎯 Plus/Folder button pressed');
                  createSubFolder();
                }}
              >
                <Icon name="plus" size={20} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={hideKeyboard}
            >
              <Text style={styles.doneButtonText}>return</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Debug info - Temporary */}
        {__DEV__ && (
          <View style={{ padding: 10, backgroundColor: 'yellow', opacity: 0.7 }}>
            <Text style={{ fontSize: 10 }}>
              Debug: editing={isEditing ? 'true' : 'false'} | 
              toolbar={showKeyboardToolbar ? 'true' : 'false'} | 
              activeInput={activeInput || 'none'}
            </Text>
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
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTitle: {
    fontSize: Typography.fontSize.large,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    textAlign: 'center',
  },
  folderContents: {
    marginBottom: Layout.spacing.md,
  },
  contentPreview: {
    marginBottom: Layout.spacing.xs,
  },
  actionButton: {
    padding: Layout.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screen.padding,
    paddingTop: Layout.spacing.sm,
  },
  titleInput: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: 0,
    marginBottom: Layout.spacing.md,
    lineHeight: 40,
    minHeight: 56,
    textAlignVertical: 'center',
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
  contentText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 24,
    padding: 16,
    minHeight: 300,
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
  doneButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  },
  existingNotes: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
    fontFamily: Typography.fontFamily.primary,
  },
  existingNote: {
    backgroundColor: Colors.noteCard,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius,
    marginBottom: Layout.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.floatingButton,
  },
  existingNoteTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  existingNoteTime: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  existingNotePreview: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Layout.spacing.md,
  },
});

export default FolderNoteScreen;