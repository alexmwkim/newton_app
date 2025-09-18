import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';
import { Spacing } from '../../../../constants/StyleControl';

/**
 * README 편집 헤더 컴포넌트
 */
const ReadmeEditHeader = ({ 
  editingTitle, 
  onTitleChange, 
  onSave, 
  onCancel, 
  saving 
}) => (
  <View style={styles.editHeader}>
    <View style={styles.editTitleContainer}>
      <TextInput
        style={styles.titleInput}
        value={editingTitle}
        onChangeText={(newTitle) => {
          // 🔧 FIX: multiline에서 Enter 키로 인한 줄바꿈 제거 - 타이틀은 단일 제목
          const cleanTitle = newTitle.replace(/\n/g, '');
          onTitleChange(cleanTitle);
        }}
        placeholder="README Title"
        placeholderTextColor={Colors.text.secondary}
        maxLength={100}
        onSelectionChange={({ nativeEvent }) => {
          console.log('🎯 Profile README Title selection changed:', nativeEvent.selection);
        }}
        multiline
        scrollEnabled={false}
      />
    </View>
    
    <View style={styles.editActions}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.cancelButton]}
        onPress={onCancel}
        disabled={saving}
      >
        <Icon name="x" size={16} color={Colors.text.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.saveButton]}
        onPress={onSave}
        disabled={saving}
      >
        <Icon 
          name={saving ? "loader" : "check"} 
          size={16} 
          color={Colors.white} 
        />
      </TouchableOpacity>
    </View>
  </View>
);

/**
 * README 표시 헤더 컴포넌트
 */
const ReadmeDisplayHeader = ({ title, onEdit, isOwnProfile }) => (
  <View style={styles.readmeHeader}>
    <View style={styles.readmeTitleContainer}>
      <Icon name="file-text" size={16} color={Colors.text.secondary} />
      <Text style={styles.readmeTitle}>{title}</Text>
    </View>
    
    {isOwnProfile && (
      <TouchableOpacity 
        style={styles.editButton}
        onPress={onEdit}
      >
        <Icon name="edit-2" size={14} color={Colors.text.secondary} />
      </TouchableOpacity>
    )}
  </View>
);

/**
 * README 섹션 메인 컴포넌트
 */
const ReadmeSection = ({
  readmeData,
  isOwnProfile = false,
  onToggleEdit,
  onTitleChange,
  onContentChange,
  onSave,
  onCancel,
  saving = false,
}) => {
  const handleSave = async () => {
    try {
      const success = await onSave();
      if (!success) {
        Alert.alert('Error', 'Failed to save README. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving.');
    }
  };

  return (
    <View style={styles.container}>
      {readmeData.isEditing ? (
        // 편집 모드
        <>
          <ReadmeEditHeader
            editingTitle={readmeData.editingTitle}
            onTitleChange={onTitleChange}
            onSave={handleSave}
            onCancel={onCancel}
            saving={saving}
          />
          
          <View style={styles.editContainer}>
            <TextInput
              style={styles.contentInput}
              value={readmeData.editingContent}
              onChangeText={onContentChange}
              placeholder="Write your README in Markdown..."
              placeholderTextColor={Colors.text.secondary}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </View>
        </>
      ) : (
        // 표시 모드
        <>
          <ReadmeDisplayHeader
            title={readmeData.title}
            onEdit={onToggleEdit}
            isOwnProfile={isOwnProfile}
          />
          
          <View style={styles.markdownContainer}>
            <Markdown 
              style={markdownStyles}
            >
              {readmeData.content}
            </Markdown>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Layout.spacing.medium,
  },
  
  // 편집 모드 스타일
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  editTitleContainer: {
    flex: 1,
    marginRight: Layout.spacing.medium,
  },
  titleInput: {
    ...Typography.heading3,
    color: Colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 2, // 🔧 FIX: 최소 패딩으로 변경 - 텍스트 위쪽 빈 공간 제거
    paddingHorizontal: 0,
    // 🔧 FIX: multiline TextInput 커서 위치 수정 - top 정렬로 변경
    textAlignVertical: 'top',
    // minHeight 제거 - 텍스트 위쪽 클릭 가능 영역 제거
  },
  editActions: {
    flexDirection: 'row',
    gap: Layout.spacing.small,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  editContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: Layout.spacing.medium,
    minHeight: 200,
  },
  contentInput: {
    ...Typography.body,
    color: Colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  
  // 표시 모드 스타일
  readmeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  readmeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readmeTitle: {
    ...Typography.heading3,
    color: Colors.text.primary,
    marginLeft: Layout.spacing.small,
  },
  editButton: {
    padding: Layout.spacing.small,
    borderRadius: 6,
    backgroundColor: Colors.background.secondary,
  },
  markdownContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: Layout.spacing.medium,
  },
});

// Markdown 스타일
const markdownStyles = StyleSheet.create({
  body: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  heading1: {
    ...Typography.heading1,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.medium,
  },
  heading2: {
    ...Typography.heading2,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.small,
    marginTop: Layout.spacing.medium,
  },
  heading3: {
    ...Typography.heading3,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.small,
    marginTop: Layout.spacing.medium,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.medium,
  },
  listItem: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  link: {
    color: Colors.primary,
  },
  blockquote: {
    backgroundColor: Colors.background.tertiary,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: Layout.spacing.medium,
    marginVertical: Layout.spacing.medium,
  },
  code_inline: {
    backgroundColor: Colors.background.tertiary,
    color: Colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
});

export default ReadmeSection;