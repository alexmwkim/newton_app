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
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const NoteDetailScreen = ({ note, onBack, onEdit, onFork, navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  
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
    // Save note logic here
    console.log('Saving note:', { title, content });
    setIsEditing(false);
    setShowToolbar(false);
    Keyboard.dismiss();
  };

  const handleFork = () => {
    const forkedNote = {
      ...displayNote,
      title: `Fork of ${displayNote.title}`,
      isPublic: false,
    };
    navigation.navigate('createNote', { initialNote: forkedNote });
  };

  const startEditing = (field = 'content') => {
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

  // Mock note data if none provided
  const displayNote = note || {
    id: 1,
    title: 'Sample Note Title',
    content: `# This is a sample note

This note demonstrates how the note detail view works in the Newton app.

## Features
- Clean, readable typography
- Markdown-like formatting
- Easy navigation back to the list
- Fork functionality for public notes

## Lorem Ipsum
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.

### Sub-section
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    createdAt: '2 hours ago',
    updatedAt: '1 hour ago',
    author: '@sampleuser',
    isPublic: true,
    forkCount: 12,
  };

  // Initialize note data
  useEffect(() => {
    setTitle(displayNote.title);
    setContent(displayNote.content);
  }, [displayNote]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setShowToolbar(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (!isEditing) {
        setShowToolbar(false);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isEditing]);

  return (
    <TouchableWithoutFeedback onPress={() => !isEditing && startEditing()}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {isEditing ? (
              <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                <Icon name="check" size={20} color={Colors.primaryText} />
              </TouchableOpacity>
            ) : (
              <>
                {displayNote.isPublic && (
                  <TouchableOpacity onPress={handleFork} style={styles.actionButton}>
                    <Icon name="git-branch" size={20} color={Colors.primaryText} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => startEditing()} style={styles.actionButton}>
                  <Icon name="edit-3" size={20} color={Colors.primaryText} />
                </TouchableOpacity>
              </>
            )}
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
          <TouchableWithoutFeedback onPress={() => startEditing('title')}>
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
                  onSubmitEditing={() => contentInputRef.current?.focus()}
                />
              ) : (
                <Text style={styles.title}>{title}</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
          
          {/* Note Meta */}
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              Created {displayNote.createdAt}
            </Text>
            {displayNote.updatedAt && displayNote.updatedAt !== displayNote.createdAt && (
              <Text style={styles.metaText}>
                • Updated {displayNote.updatedAt}
              </Text>
            )}
          </View>

          {displayNote.isPublic && (
            <View style={styles.publicInfo}>
              <Text style={styles.author}>by {displayNote.author}</Text>
              <Text style={styles.forkCount}>
                <Icon name="git-branch" size={16} color={Colors.secondaryText} /> {displayNote.forkCount} forks
              </Text>
            </View>
          )}

          {/* Note Content */}
          <TouchableWithoutFeedback onPress={() => startEditing('content')}>
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
                />
              ) : (
                <Text style={styles.contentText}>{content}</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {/* Seamless Keyboard Toolbar */}
        {showToolbar && (
          <View style={styles.keyboardToolbar}>
            <View style={styles.toolbarLeft}>
              <TouchableOpacity 
                style={styles.toolbarButton} 
                onPress={() => {
                  const newContent = content + '\n# ';
                  setContent(newContent);
                }}
              >
                <Icon name="hash" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => {
                  const newContent = content + '**bold**';
                  setContent(newContent);
                }}
              >
                <Icon name="bold" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => {
                  const newContent = content + '*italic*';
                  setContent(newContent);
                }}
              >
                <Icon name="italic" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarButton}
                onPress={() => {
                  const newContent = content + '\n- ';
                  setContent(newContent);
                }}
              >
                <Icon name="list" size={18} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={stopEditing}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
  forkCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
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
  doneButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default NoteDetailScreen;