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
import SingleToggleComponent from '../components/SingleToggleComponent';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';

const CreateNoteScreen = ({ onBack, onSave, initialNote, navigation, note, isEditing, isForked, returnToScreen, route }) => {
  const { user } = useAuth();
  const notesStore = useNotesStore();
  const noteData = note || initialNote;
  
  // Get initial values from route params if available
  const routeParams = route?.params || {};
  const [title, setTitle] = useState(noteData?.title || '');
  const [content, setContent] = useState(noteData?.content || '');
  const [isPublic, setIsPublic] = useState(noteData?.is_public ?? routeParams.isPublic ?? false);
  const [showKeyboardToolbar, setShowKeyboardToolbar] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [forkedFrom, setForkedFrom] = useState(noteData?.forked_from || null);
  const [isLoading, setIsLoading] = useState(false);
  
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const handleBack = () => {
    console.log('Navigate back');
    if (onBack) onBack();
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save notes');
      return;
    }

    const titleText = title.trim();
    const contentText = content.trim();
    
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
        ...(forkedFrom && { forkedFrom }),
      };
      
      console.log('💾 CreateNoteScreen saving note:', newNoteData);
      
      if (isEditing && noteData?.id) {
        // Update existing note
        await notesStore.updateNote(noteData.id, {
          title: titleText,
          content: contentText,
          is_public: isPublic,
        });
        Alert.alert('Success', 'Note updated successfully');
      } else {
        // Create new note
        await notesStore.createNote(newNoteData);
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
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      console.log('🎹 Keyboard shown - showing toolbar');
      setShowKeyboardToolbar(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 Keyboard hidden - hiding toolbar');
      setShowKeyboardToolbar(false);
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

  const visibilityOptions = [
    { icon: 'lock', label: 'Private', value: 'private' },
    { icon: 'globe', label: 'Public', value: 'public' },
  ];

  const insertFormat = (prefix, suffix = '') => {
    if (activeInput === 'title') {
      const newText = title + prefix + suffix;
      setTitle(newText);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    } else {
      const newText = content + prefix + suffix;
      setContent(newText);
      setTimeout(() => contentInputRef.current?.focus(), 50);
    }
  };

  const hideKeyboard = () => {
    Keyboard.dismiss();
    setShowKeyboardToolbar(false);
    setActiveInput(null);
  };

  const addImage = () => {
    Alert.alert(
      'Add Image', 
      'Image upload feature would be implemented here',
      [{ text: 'OK' }]
    );
  };

  const addBlock = (blockType) => {
    let blockText = '';
    switch (blockType) {
      case 'quote':
        blockText = '> ';
        break;
      case 'code':
        blockText = '```\n\n```';
        break;
      case 'divider':
        blockText = '\n---\n';
        break;
      case 'table':
        blockText = '| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
        break;
      default:
        blockText = '';
    }
    setContent(content + '\n' + blockText);
    setTimeout(() => contentInputRef.current?.focus(), 50);
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
    
    if (activeInput === 'content') {
      setContent(prev => prev + template);
      setTimeout(() => contentInputRef.current?.focus(), 50);
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
                parentNoteId: null, // This is for notes inside the main note content
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
                    setActiveInput('content');
                    
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

  const hasContent = title.trim().length > 0 || content.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            onFocus={() => {
              console.log('📱 Title input focused');
              setActiveInput('title');
              setShowKeyboardToolbar(true);
            }}
            onSubmitEditing={() => {
              contentInputRef.current?.focus();
              setActiveInput('content');
            }}
          />

          {/* Content Input */}
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Write something..."
            placeholderTextColor={Colors.secondaryText}
            value={content}
            onChangeText={setContent}
            multiline={true}
            textAlignVertical="top"
            blurOnSubmit={false}
            editable={true}
            autoFocus={false}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            onFocus={() => {
              console.log('📱 Content input focused');
              setActiveInput('content');
              setShowKeyboardToolbar(true);
            }}
            onBlur={() => {
              console.log('Content input blurred');
            }}
          />
        </ScrollView>

        {/* Keyboard Toolbar with Layout Options - Show when focused or keyboard visible */}
        {(showKeyboardToolbar || activeInput) && (
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
              onPress={hideKeyboard}
            >
              <Text style={styles.doneButtonText}>return</Text>
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
  doneButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
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
});

export default CreateNoteScreen;