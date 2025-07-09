import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { RichTextEditor } from './RichTextEditor';

export const NoteEditor = ({
  note,
  onSave,
  onClose,
  onCreateSubPage,
  onCreateFolder,
  subpages,
  onOpenSubpage
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isPublic, setIsPublic] = useState(note?.isPublic || false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsEditing(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsEditing(false)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleSave = () => {
    onSave({ title, content, isPublic });
    onClose();
  };

  const hasContent = title.trim() || content.trim();
  const showDoneButton = hasContent;

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      if (note?.id) {
        const hasChanges = title !== (note?.title || '') || content !== (note?.content || '') || isPublic !== (note?.isPublic || false);
        if (hasChanges) {
          console.log('📄 Auto-saving note:', note.id);
          onSave({ title, content, isPublic });
        }
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [title, content, isPublic, note, onSave]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header with Back/Toggle and X/Done */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Back button for child notes */}
          {note?.parentId && (
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Icon name="arrow-left" size={20} color={Colors.primaryText} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.selectedToggle}
            onPress={() => setIsPublic(!isPublic)}
          >
            <Icon 
              name={isPublic ? "globe" : "lock"} 
              size={16} 
              color={Colors.primaryText} 
            />
            <Text style={styles.selectedToggleText}>
              {isPublic ? "Public" : "Private"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={showDoneButton ? handleSave : onClose} style={styles.headerButton}>
          {showDoneButton ? (
            <Text style={styles.doneButton}>Done</Text>
          ) : (
            <Icon name="x" size={24} color={Colors.primaryText} />
          )}
        </TouchableOpacity>
      </View>

      {/* Title input */}
      <View style={styles.titleContainer}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Note title"
          placeholderTextColor={Colors.secondaryText}
        />
      </View>

      {/* Subpages list */}
      {subpages && subpages.length > 0 && (
        <View style={styles.subpagesContainer}>
          <Text style={styles.subpagesTitle}>Subpages</Text>
          {subpages.map(subpage => (
            <TouchableOpacity
              key={subpage.id}
              style={styles.subpageItem}
              onPress={() => onOpenSubpage && onOpenSubpage(subpage)}
            >
              <Icon 
                name={subpage.type === 'folder' ? 'folder' : 'file-text'} 
                size={16} 
                color={Colors.floatingButton} 
              />
              <Text style={styles.subpageTitle}>{subpage.title || 'Untitled'}</Text>
              <Icon name="chevron-right" size={14} color={Colors.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Rich text editor */}
      <RichTextEditor
        value={content}
        onChangeText={setContent}
        placeholder="Start writing your note..."
        onCreateSubPage={onCreateSubPage}
        onCreateFolder={onCreateFolder}
        currentNoteId={note?.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    alignItems: 'flex-end',
  },
  doneButton: {
    fontSize: Typography.fontSize.body,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'right',
  },
  titleContainer: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.noteCard,
  },
  titleInput: {
    fontSize: Typography.fontSize.xlarge,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
    padding: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Layout.spacing.md,
    padding: Layout.spacing.xs,
  },
  selectedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedToggleText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    marginLeft: Layout.spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  subpagesContainer: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.noteCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subpagesTitle: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.sm,
    fontFamily: Typography.fontFamily.primary,
  },
  subpageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 6,
    marginBottom: 4,
  },
  subpageTitle: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.primaryText,
    marginLeft: Layout.spacing.sm,
    fontFamily: Typography.fontFamily.primary,
  },
});