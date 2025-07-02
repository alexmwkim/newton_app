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
import NotesStore from '../store/NotesStore';

const CreateNoteScreen = ({ onBack, onSave, initialNote, navigation }) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [isPublic, setIsPublic] = useState(initialNote?.isPublic || false);
  const [showKeyboardToolbar, setShowKeyboardToolbar] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  const handleBack = () => {
    console.log('Navigate back');
    if (onBack) onBack();
  };

  const handleSave = () => {
    const noteData = {
      title: title.trim(),
      content: content.trim(),
      isPublic: isPublic,
      createdAt: new Date().toISOString(),
    };
    
    console.log('💾 CreateNoteScreen saving note:', noteData);
    
    // Save to store directly
    NotesStore.addNote(noteData);
    
    console.log('🔙 Navigating back to home');
    // Navigate back
    handleBack();
  };

  // Auto-focus when screen loads, like Notion
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!title) {
        titleInputRef.current?.focus();
        setActiveInput('title');
      } else {
        contentInputRef.current?.focus();
        setActiveInput('content');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setShowKeyboardToolbar(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setShowKeyboardToolbar(false);
      setActiveInput(null);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
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
          
          <TouchableOpacity onPress={hasContent ? handleSave : handleBack} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              {hasContent ? 'Done' : 'X'}
            </Text>
          </TouchableOpacity>
        </View>

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
            onFocus={() => setActiveInput('title')}
            onSubmitEditing={() => {
              contentInputRef.current?.focus();
              setActiveInput('content');
            }}
          />

          {/* Content Input */}
          <TouchableOpacity style={styles.contentArea} onPress={() => {
            contentInputRef.current?.focus();
            setActiveInput('content');
          }}>
            <TextInput
              ref={contentInputRef}
              style={styles.contentInput}
              placeholder="Write something..."
              placeholderTextColor={Colors.secondaryText}
              value={content}
              onChangeText={setContent}
              multiline={true}
              textAlignVertical="top"
              onFocus={() => setActiveInput('content')}
            />
          </TouchableOpacity>
        </ScrollView>

        {/* Seamless Keyboard Toolbar */}
        {showKeyboardToolbar && (
          <View style={styles.keyboardToolbar}>
            <View style={styles.toolbarLeft}>
              <TouchableOpacity 
                style={styles.toolbarButton} 
                onPress={() => insertFormat('# ')}
              >
                <Icon name="hash" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => insertFormat('**', '**')}
              >
                <Icon name="bold" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => insertFormat('*', '*')}
              >
                <Icon name="italic" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => insertFormat('\n- ')}
              >
                <Icon name="list" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => insertFormat('> ')}
              >
                <Icon name="message-square" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={hideKeyboard}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
  actionButton: {
    padding: Layout.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 24,
    paddingVertical: Layout.spacing.md,
    minHeight: 300,
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
});

export default CreateNoteScreen;