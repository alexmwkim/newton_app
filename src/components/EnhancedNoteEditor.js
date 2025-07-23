import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Keyboard,
  ScrollView,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotesStore } from '../store/useNotesStore';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

export const EnhancedNoteEditor = ({
  note,
  onSave,
  onClose,
  onOpenSubpage
}) => {
  const { getChildren, deleteItem, addItem } = useNotesStore();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isPublic, setIsPublic] = useState(note?.isPublic || false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showSubpages, setShowSubpages] = useState(false);
  const [showDoneButton, setShowDoneButton] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  
  const textInputRef = useRef(null);
  const subpages = note?.id ? getChildren(note.id).filter(item => item.type === 'note') : [];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Show done button when content changes
  useEffect(() => {
    const hasChanges = title !== (note?.title || '') || content !== (note?.content || '') || isPublic !== (note?.isPublic || false);
    setShowDoneButton(hasChanges);
  }, [title, content, isPublic, note]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      if (note?.id) {
        const hasChanges = title !== (note?.title || '') || content !== (note?.content || '') || isPublic !== (note?.isPublic || false);
        if (hasChanges) {
          console.log('📄 Auto-saving note:', note.id);
          onSave({ 
            ...note, 
            title, 
            content, 
            isPublic, 
            updatedAt: new Date().toISOString() 
          });
        }
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [title, content, isPublic, note, onSave]);

  const handleSave = () => {
    onSave({ 
      ...note, 
      title, 
      content, 
      isPublic, 
      updatedAt: new Date().toISOString() 
    });
    // Close editor after manual save
    onClose();
  };


  const handleCreateFolder = () => {
    console.log('📁 Opening folder modal');
    setShowFolderModal(true);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      Alert.alert('Notice', 'Please enter a folder name.');
      return;
    }

    if (!note?.id) {
      Alert.alert('Error', 'Note ID not found');
      return;
    }

    addItem({
      title: folderName,
      content: '',
      parentId: note.id,
      type: 'folder',
      isPublic: false,
    });

    setFolderName('');
    setShowFolderModal(false);
    Alert.alert('Success', `Folder "${folderName}" created!`);
  };

  const handleCancelFolder = () => {
    setFolderName('');
    setShowFolderModal(false);
  };

  const handleDeleteSubpage = (subpageId) => {
    Alert.alert(
      'Delete Sub-page',
      'Are you sure you want to delete this sub-page?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteItem(subpageId)
        },
      ]
    );
  };

  // Format application functions
  const applyFormat = (format) => {
    const selection = textInputRef.current?.selection;
    if (!selection) return;

    const { start, end } = selection;
    const selectedText = content.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'text'}*`;
        break;
      case 'heading':
        formattedText = `# ${selectedText || 'Heading'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'List item'}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const renderSubpage = ({ item }) => (
    <TouchableOpacity
      style={styles.subpageItem}
      onPress={() => onOpenSubpage(item)}
      onLongPress={() => handleDeleteSubpage(item.id)}
    >
      <Ionicons name="document-text" size={20} color={Colors.secondaryText} />
      <Text style={styles.subpageTitle} numberOfLines={1}>
        {item.title || 'Untitled'}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.selectedToggle}
          onPress={() => setIsPublic(!isPublic)}
        >
          <Ionicons 
            name={isPublic ? "globe" : "lock"} 
            size={16} 
            color={Colors.primaryText} 
          />
          <Text style={styles.selectedToggleText}>
            {isPublic ? "Public" : "Private"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={showDoneButton ? handleSave : onClose} style={styles.headerButton}>
          {showDoneButton ? (
            <Text style={styles.doneButton}>Done</Text>
          ) : (
            <Ionicons name="close" size={24} color={Colors.primaryText} />
          )}
        </TouchableOpacity>
      </View>

      {/* Sub-pages list */}
      {showSubpages && (
        <View style={styles.subpagesContainer}>
          <View style={styles.subpagesHeader}>
            <Text style={styles.subpagesTitle}>Sub-pages</Text>
            <TouchableOpacity
              style={styles.addSubpageButton}
              onPress={() => console.log('Subpage creation not implemented')}
            >
              <Ionicons name="add" size={20} color={Colors.floatingButton} />
              <Text style={styles.addSubpageText}>New Page</Text>
            </TouchableOpacity>
          </View>
          
          {subpages.length > 0 ? (
            <FlatList
              data={subpages}
              renderItem={renderSubpage}
              keyExtractor={(item) => item.id}
              style={styles.subpagesList}
            />
          ) : (
            <Text style={styles.noSubpagesText}>No sub-pages</Text>
          )}
        </View>
      )}

      {/* Title input */}
      <View style={styles.titleContainer}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Page title"
          placeholderTextColor={Colors.secondaryText}
        />
      </View>

      {/* Content input */}
      <ScrollView style={styles.contentContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Start writing your note..."
          placeholderTextColor={Colors.secondaryText}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Keyboard toolbar */}
      {(isKeyboardVisible || true) && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.toolbarContent}>
              {/* Format buttons */}
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => applyFormat('bold')}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={styles.toolbarButtonTextBold}>B</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => applyFormat('italic')}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={styles.toolbarButtonTextItalic}>I</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => applyFormat('heading')}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={styles.toolbarButtonText}>H</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => applyFormat('list')}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons name="list" size={18} color={Colors.primaryText} />
              </TouchableOpacity>

              <View style={styles.separator} />


              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => setShowSubpages(!showSubpages)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="list-circle" size={18} color={Colors.floatingButton} />
                <Text style={styles.toolbarButtonText}>List</Text>
              </TouchableOpacity>

              {/* Folder creation button */}
              <TouchableOpacity
                style={[styles.toolbarButton, styles.folderButton]}
                onPress={() => {
                  console.log('📁 Folder button pressed!');
                  handleCreateFolder();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="folder-outline" size={18} color={Colors.floatingButton} />
                <Text style={styles.folderButtonText}>Folder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Folder Creation Modal */}
      <Modal
        visible={showFolderModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelFolder}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="folder" size={24} color={Colors.floatingButton} />
              <Text style={styles.modalTitle}>New Folder</Text>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Folder name"
              placeholderTextColor={Colors.secondaryText}
              autoFocus
              onSubmitEditing={handleSaveFolder}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelFolder}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveFolder}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButton: {
    alignItems: 'flex-end',
  },
  doneButton: {
    fontSize: Typography.fontSize.body,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'right',
  },
  subpagesContainer: {
    backgroundColor: Colors.noteCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 200,
  },
  subpagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subpagesTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  addSubpageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.floatingButton,
  },
  addSubpageText: {
    fontSize: Typography.fontSize.small,
    color: Colors.floatingButton,
    marginLeft: 4,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  subpagesList: {
    maxHeight: 120,
  },
  subpageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    marginHorizontal: Layout.screen.padding,
    marginVertical: 2,
    borderRadius: Layout.borderRadius,
  },
  subpageTitle: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.primaryText,
    marginLeft: Layout.spacing.sm,
    fontFamily: Typography.fontFamily.primary,
  },
  noSubpagesText: {
    textAlign: 'center',
    color: Colors.secondaryText,
    fontSize: Typography.fontSize.small,
    paddingVertical: Layout.spacing.xl,
    fontFamily: Typography.fontFamily.primary,
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: Layout.screen.padding,
  },
  contentInput: {
    fontSize: Typography.fontSize.body,
    lineHeight: 24,
    color: Colors.primaryText,
    minHeight: 400,
    textAlignVertical: 'top',
    paddingTop: Layout.spacing.md,
    fontFamily: Typography.fontFamily.primary,
  },
  toolbar: {
    backgroundColor: Colors.noteCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.screen.padding,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    marginRight: Layout.spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 36,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toolbarButtonText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
  },
  toolbarButtonTextBold: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  toolbarButtonTextItalic: {
    fontSize: Typography.fontSize.small,
    fontStyle: 'italic',
    color: Colors.primaryText,
  },
  subpageButton: {
    flexDirection: 'row',
    borderColor: Colors.floatingButton,
    backgroundColor: Colors.noteCard,
  },
  subpageButtonText: {
    fontSize: Typography.fontSize.small,
    color: Colors.floatingButton,
    marginLeft: 4,
    fontWeight: Typography.fontWeight.semibold,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.sm,
  },
  folderButton: {
    flexDirection: 'row',
    borderColor: Colors.floatingButton,
    backgroundColor: Colors.noteCard,
  },
  folderButtonText: {
    fontSize: Typography.fontSize.small,
    color: Colors.floatingButton,
    marginLeft: 4,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    padding: Layout.spacing.xl,
    width: '85%',
    maxWidth: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Layout.spacing.sm,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius,
    padding: Layout.spacing.md,
    fontSize: Typography.fontSize.body,
    marginBottom: Layout.spacing.xl,
    backgroundColor: Colors.noteCard,
    fontFamily: Typography.fontFamily.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.noteCard,
    marginRight: Layout.spacing.sm,
  },
  saveButton: {
    backgroundColor: Colors.floatingButton,
    marginLeft: Layout.spacing.sm,
  },
  cancelButtonText: {
    color: Colors.secondaryText,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  },
});