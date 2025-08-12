/**
 * NoteAuthorSection - 노트 작성자 정보 표시 컴포넌트
 * 작성자 정보와 시간 표시를 위한 재사용 가능한 컴포넌트
 */

import React from 'react';
import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import { UserInfo } from '../user';

// 시간 포맷팅 유틸리티
export const formatTimeAgo = (dateString) => {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}개월 전`;
  } catch {
    return '방금 전';
  }
};

const NoteAuthorSection = memo(({
  note,
  currentUser,
  currentProfile,
  onAuthorPress,
  showTime = true,
  size = 'medium',
  style
}) => {
  const handleAuthorPress = () => {
    if (onAuthorPress && note.profiles?.id) {
      onAuthorPress(note.profiles.id);
    }
  };

  if (!note.profiles) return null;

  return (
    <View style={[styles.container, style]}>
      <UserInfo
        user={note.profiles}
        currentUser={currentUser}
        currentProfile={currentProfile}
        size={size}
        showFullName={false}
        onPress={handleAuthorPress}
        style={styles.userInfo}
      />
      
      {showTime && note.created_at && (
        <Text style={styles.timeText}>
          {formatTimeAgo(note.created_at)}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginLeft: Layout.spacing.sm,
  },
});

NoteAuthorSection.displayName = 'NoteAuthorSection';

export default NoteAuthorSection;