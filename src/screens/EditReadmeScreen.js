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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { Spacing } from '../constants/StyleControl';
import { UnifiedHeader } from '../shared/components/layout';

const EditReadmeScreen = ({ navigation, route }) => {
  console.log('📝 EditReadmeScreen received route params:', route.params);
  
  const { currentTitle, currentContent } = route.params || {};
  
  console.log('📝 Destructured params:', { currentTitle, currentContent });
  
  const [title, setTitle] = useState(currentTitle || '');
  const [content, setContent] = useState(currentContent || '');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your readme');
      return;
    }

    console.log('💾 Saving readme:', { title: title.trim(), content: content.trim() });
    
    const readmeData = {
      title: title.trim(),
      content: content.trim()
    };
    
    try {
      // Store in AsyncStorage for persistence
      await AsyncStorage.setItem('userReadmeData', JSON.stringify(readmeData));
      console.log('✅ Readme data saved to AsyncStorage');
      
      // Also store in global for immediate update
      global.newReadmeData = readmeData;
      
      console.log('✅ Readme data saved to global:', global.newReadmeData);
    } catch (error) {
      console.error('❌ Failed to save readme data:', error);
      Alert.alert('Error', 'Failed to save readme data');
      return;
    }
    
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
      <UnifiedHeader
        title="Readme"
        showBackButton={false}
        leftComponent={
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Icon name="x" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
        }
        rightElements={[
          {
            component: (
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )
          }
        ]}
        screenType="sub"
      />

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={(newTitle) => {
              // 🔧 FIX: multiline에서 Enter 키로 인한 줄바꿈 제거 - 타이틀은 단일 제목
              const cleanTitle = newTitle.replace(/\n/g, '');
              setTitle(cleanTitle);
            }}
            placeholder="Enter title..."
            placeholderTextColor={Colors.secondaryText}
            autoFocus={true}
            onSelectionChange={({ nativeEvent }) => {
              console.log('🎯 Edit README Title selection changed:', nativeEvent.selection);
            }}
            multiline
            scrollEnabled={false}
          />
        </View>

        {/* Content Input */}
        <View style={styles.inputSection}>
          <View style={styles.contentHeader}>
            <Text style={styles.inputLabel}>Content</Text>
            <Text style={styles.markdownHint}>Supports Markdown</Text>
          </View>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write your readme content using Markdown...\n\n**Bold text**\n*Italic text*\n# Heading 1\n## Heading 2\n### Heading 3\n[Link](url)\n- List item"
            placeholderTextColor={Colors.secondaryText}
            multiline={true}
            textAlignVertical="top"
          />
        </View>

        {/* Markdown Guide */}
        <View style={styles.guideSection}>
          <Text style={styles.guideLabel}>Markdown Guide</Text>
          <View style={styles.guideContainer}>
            <Text style={styles.guideText}>**Bold** • *Italic* • # H1 • ## H2 • ### H3</Text>
            <Text style={styles.guideText}>[Link](url) • - List • {'>'} Quote</Text>
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>{title || 'Title'}</Text>
            <ScrollView style={styles.markdownScroll} nestedScrollEnabled={true}>
              <Markdown 
                style={markdownStyles}
                mergeStyle={false}
              >
                {content || '*Your markdown content will appear here...*'}
              </Markdown>
            </ScrollView>
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
  cancelButton: {
    padding: Layout.spacing.xs,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screen.horizontal,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
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
    padding: Layout.spacing.sm, // 🔧 FIX: 패딩 줄임 - 텍스트 위쪽 빈 공간 제거  
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
    // 🔧 FIX: multiline TextInput 커서 위치 수정 - top 정렬로 변경
    textAlignVertical: 'top',
    // minHeight 제거 - 텍스트 위쪽 클릭 가능 영역 제거
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
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  markdownHint: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
  guideSection: {
    marginBottom: Layout.spacing.xl,
  },
  guideLabel: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.sm,
  },
  guideContainer: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    lineHeight: 18,
  },
  markdownScroll: {
    maxHeight: 200,
  },
});

// Markdown styles for preview
const markdownStyles = {
  body: {
    fontSize: Typography.fontSize.body,
    fontFamily: 'System',
    color: Colors.primaryText,
    lineHeight: 22,
  },
  heading1: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: 'System',
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
    lineHeight: 28,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 8,
    marginTop: 12,
    lineHeight: 24,
  },
  heading3: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: 'System',
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
    lineHeight: 20,
  },
  strong: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  em: {
    fontStyle: 'italic',
    color: Colors.primaryText,
  },
  link: {
    color: Colors.floatingButton,
    textDecorationLine: 'underline',
  },
  paragraph: {
    marginBottom: Layout.spacing.sm,
    lineHeight: 22,
  },
  list_item: {
    marginBottom: Layout.spacing.xs,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
    paddingLeft: Layout.spacing.md,
    marginLeft: Layout.spacing.sm,
    fontStyle: 'italic',
    color: Colors.secondaryText,
  },
  code_inline: {
    backgroundColor: Colors.noteCard,
    fontFamily: 'Courier',
    fontSize: Typography.fontSize.small,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: Colors.noteCard,
    fontFamily: 'Courier',
    fontSize: Typography.fontSize.small,
    padding: Layout.spacing.md,
    borderRadius: 8,
    marginVertical: Layout.spacing.sm,
  },
};

export default EditReadmeScreen;