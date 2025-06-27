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
  Alert
} from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import ToggleButton from '../components/ToggleButton';

const CreateNoteScreen = ({ onBack, onSave, initialNote }) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [visibility, setVisibility] = useState(initialNote?.isPublic ? 'public' : 'private');
  const [showFormatting, setShowFormatting] = useState(false);
  
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
      } else {
        contentInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const visibilityOptions = [
    { icon: '🔒', label: 'Private', value: 'private' },
    { icon: '🌍', label: 'Public', value: 'public' },
  ];

  const formatActions = [
    { label: 'H1', action: () => insertFormat('# ') },
    { label: 'H2', action: () => insertFormat('## ') },
    { label: 'H3', action: () => insertFormat('### ') },
    { label: 'B', action: () => insertFormat('**', '**') },
    { label: 'I', action: () => insertFormat('*', '*') },
    { label: '[]', action: () => insertFormat('- ') },
    { label: '1.', action: () => insertFormat('1. ') },
    { label: '""', action: () => insertFormat('> ') },
    { label: 'Code', action: () => insertFormat('`', '`') },
    { label: 'Link', action: () => insertFormat('[', '](url)') },
  ];

  const insertFormat = (prefix, suffix = '') => {
    const currentText = content;
    const newText = currentText + prefix + suffix;
    setContent(newText);
    
    // Focus the content input after inserting format
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 50);
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
            <Text style={styles.backIcon}>✕</Text>
          </TouchableOpacity>
          
          <ToggleButton
            options={visibilityOptions}
            selectedOption={visibility}
            onToggle={setVisibility}
          />
          
          <TouchableOpacity onPress={() => setShowFormatting(!showFormatting)} style={styles.formatButton}>
            <Text style={styles.formatIcon}>⋯</Text>
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
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />

          {/* Formatting Toolbar */}
          {showFormatting && (
            <View style={styles.formattingToolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.formattingSection}>
                  <Text style={styles.sectionLabel}>Text</Text>
                  <View style={styles.formattingButtons}>
                    {formatActions.slice(0, 5).map((action, index) => (
                      <TouchableOpacity key={index} style={styles.formatButton} onPress={action.action}>
                        <Text style={styles.formatButtonText}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.formattingSection}>
                  <Text style={styles.sectionLabel}>Lists</Text>
                  <View style={styles.formattingButtons}>
                    {formatActions.slice(5, 7).map((action, index) => (
                      <TouchableOpacity key={index} style={styles.formatButton} onPress={action.action}>
                        <Text style={styles.formatButtonText}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.formattingSection}>
                  <Text style={styles.sectionLabel}>Blocks</Text>
                  <View style={styles.formattingButtons}>
                    {formatActions.slice(7).map((action, index) => (
                      <TouchableOpacity key={index} style={styles.formatButton} onPress={action.action}>
                        <Text style={styles.formatButtonText}>{action.label}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.formatButton} onPress={addImage}>
                      <Text style={styles.formatButtonText}>📷</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Content Input */}
          <TouchableOpacity style={styles.contentArea} onPress={() => contentInputRef.current?.focus()}>
            <TextInput
              ref={contentInputRef}
              style={styles.contentInput}
              placeholder="Write something..."
              placeholderTextColor={Colors.secondaryText}
              value={content}
              onChangeText={setContent}
              multiline={true}
              textAlignVertical="top"
            />
          </TouchableOpacity>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => addBlock('quote')}>
              <Text style={styles.quickActionText}>💬 Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => addBlock('code')}>
              <Text style={styles.quickActionText}>💻 Code Block</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => addBlock('divider')}>
              <Text style={styles.quickActionText}>➖ Divider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => addBlock('table')}>
              <Text style={styles.quickActionText}>📊 Table</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
});

export default CreateNoteScreen;