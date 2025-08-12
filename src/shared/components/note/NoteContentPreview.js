/**
 * NoteContentPreview - 노트 내용 미리보기 컴포넌트
 * 마크다운 제거 및 텍스트 정리 기능
 */

import React from 'react';
import { memo, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

// 컨텐츠 정리 및 미리보기 생성
const cleanContentForPreview = (content, maxLength = 150) => {
  if (!content) return '';
  
  // 마크다운 포맷팅 제거
  const cleanContent = content
    .replace(/#{1,6}\s+/g, '')           // 헤더 제거
    .replace(/\*\*(.*?)\*\*/g, '$1')    // 볼드 제거
    .replace(/\*(.*?)\*/g, '$1')        // 이탤릭 제거
    .replace(/`(.*?)`/g, '$1')          // 인라인 코드 제거
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크 제거, 텍스트만 유지
    .replace(/!\[.*?\]\(.*?\)/g, '')    // 이미지 제거
    .replace(/```[\s\S]*?```/g, '')     // 코드 블록 제거
    .replace(/\n+/g, ' ')               // 줄바꿈을 공백으로 변환
    .replace(/\s+/g, ' ')               // 연속된 공백을 하나로
    .trim();
  
  return cleanContent.length > maxLength 
    ? cleanContent.substring(0, maxLength) + '...'
    : cleanContent;
};

const NoteContentPreview = memo(({
  content,
  maxLength = 150,
  maxLines = 3,
  style,
  onPress
}) => {
  // 정리된 컨텐츠 메모이제이션
  const cleanedContent = useMemo(() => 
    cleanContentForPreview(content, maxLength), 
    [content, maxLength]
  );

  if (!cleanedContent) return null;

  return (
    <Text 
      style={[styles.preview, style]}
      numberOfLines={maxLines}
      onPress={onPress}
    >
      {cleanedContent}
    </Text>
  );
});

// 제목 전용 컴포넌트
export const NoteTitle = memo(({
  title,
  maxLines = 2,
  style,
  onPress
}) => {
  if (!title) return null;

  return (
    <Text 
      style={[styles.title, style]}
      numberOfLines={maxLines}
      onPress={onPress}
    >
      {title || 'Untitled'}
    </Text>
  );
});

const styles = StyleSheet.create({
  preview: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    lineHeight: 20,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    lineHeight: 22,
  },
});

NoteContentPreview.displayName = 'NoteContentPreview';
NoteTitle.displayName = 'NoteTitle';

export default NoteContentPreview;