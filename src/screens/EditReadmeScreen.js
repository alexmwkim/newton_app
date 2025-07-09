import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const EditReadmeScreen = ({ navigation, route }) => {
  console.log('📝 EditReadmeScreen received route params:', route.params);
  
  const { currentTitle, currentContent } = route.params || {};
  
  console.log('📝 Destructured params:', { currentTitle, currentContent });
  
  const [title, setTitle] = useState(currentTitle || '');
  const [content, setContent] = useState(currentContent || '');

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your readme');
      return;
    }

    console.log('💾 Saving readme:', { title: title.trim(), content: content.trim() });
    
    // Store the new readme data in global so ProfileScreen can pick it up
    global.newReadmeData = {
      title: title.trim(),
      content: content.trim()
    };
    
    console.log('✅ Readme data saved to global:', global.newReadmeData);
    
    navigation.goBack();
  };

  const handleCancel = () => {
    if (title !== currentTitle || content !== currentContent) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Icon name="x" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Readme</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title..."
            placeholderTextColor={Colors.secondaryText}
            autoFocus={true}
          />
        </View>

        {/* Content Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write your readme content..."
            placeholderTextColor={Colors.secondaryText}
            multiline={true}
            textAlignVertical="top"
          />
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>{title || 'Title'}</Text>
            <Text style={styles.previewContent}>{content || 'Your content will appear here...'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.mainBackground,
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
  headerButton: {
    padding: Layout.spacing.xs,
    minWidth: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  saveButton: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
  },
  content: {
    flex: 1,
    padding: Layout.screen.padding,
  },
  inputSection: {
    marginBottom: Layout.spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.sm,
  },
  titleInput: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.md,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentInput: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.md,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  previewSection: {
    marginBottom: Layout.spacing.xl,
  },
  previewLabel: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.sm,
  },
  previewContainer: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTitle: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
  },
  previewContent: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 22,
  },
});

export default EditReadmeScreen;