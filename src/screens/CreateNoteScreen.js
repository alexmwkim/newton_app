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
import ToggleButton from '../components/ToggleButton';

const CreateNoteScreen = ({ onBack, onSave, initialNote }) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [visibility, setVisibility] = useState(initialNote?.isPublic ? 'public' : 'private');
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
      isPublic: visibility === 'public',
      createdAt: new Date().toISOString(),
    };
    
    console.log('Save note:', noteData);
    if (onSave) onSave(noteData);
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

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="x" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          
          <ToggleButton
            options={visibilityOptions}
            selectedOption={visibility}
            onToggle={setVisibility}
          />
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Icon name="check" size={20} color={Colors.white} />
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
            multiline={false}
            returnKeyType="next"
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
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    padding: Layout.spacing.sm,
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
  },
  titleInput: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    paddingVertical: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
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
  saveButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});

export default CreateNoteScreen;