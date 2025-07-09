import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

export const RichTextEditor = ({
  value,
  onChangeText,
  placeholder = 'Start writing...',
  onCreateSubPage,
  onCreateFolder,
  currentNoteId
}) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const textInputRef = useRef(null);

  // Keyboard event handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        console.log('⌨️ Keyboard shown');
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        console.log('⌨️ Keyboard hidden');
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Create folder function
  const handleCreateFolder = () => {
    console.log('📁 Opening folder modal');
    setShowFolderModal(true);
  };

  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      Alert.alert('Notice', 'Please enter a folder name.');
      return;
    }

    console.log('📁 Creating folder:', folderName, 'with parent:', currentNoteId);
    
    if (onCreateFolder && currentNoteId) {
      // Create folder as a nested note inside the current note
      onCreateFolder({
        title: folderName,
        parentId: currentNoteId,
        type: 'folder'
      });
    } else {
      console.log('❌ No onCreateFolder function or currentNoteId provided');
    }
    
    setFolderName('');
    setShowFolderModal(false);
  };

  const handleCancelFolder = () => {
    setFolderName('');
    setShowFolderModal(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.editorContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.secondaryText}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Keyboard Toolbar */}
      {isKeyboardVisible && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarContent}>

            {/* Folder Button */}
            <TouchableOpacity
              style={[styles.toolbarButton, styles.subpageButton]}
              onPress={handleCreateFolder}
            >
              <Icon name="folder-plus" size={16} color={Colors.floatingButton} />
              <Text style={[styles.toolbarButtonText, styles.subpageButtonText]}>Folder</Text>
            </TouchableOpacity>
          </View>
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
              <Icon name="folder" size={24} color={Colors.floatingButton} />
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  editorContainer: {
    flex: 1,
    padding: Layout.screen.padding,
  },
  textInput: {
    fontSize: Typography.fontSize.body,
    lineHeight: 24,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
    minHeight: 400,
    textAlignVertical: 'top',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  toolbarButtonText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  subpageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Colors.noteCard,
    borderColor: Colors.floatingButton,
    borderWidth: 1,
  },
  subpageButtonText: {
    color: Colors.floatingButton,
    marginLeft: 4,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.sm,
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