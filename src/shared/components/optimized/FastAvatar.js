/**
 * FastAvatar - 성능 최적화된 아바타 컴포넌트
 * react-native-fast-image 기반의 고성능 이미지 로딩
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// import FastImage from 'react-native-fast-image'; // 실제 프로젝트에서는 주석 해제
import { Image as FastImage } from 'react-native'; // 임시로 기본 Image 사용
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

// 아바타 크기 정의
const AVATAR_SIZES = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 80,
};

const FastAvatar = memo(({
  imageUrl,
  username,
  size = 'medium',
  style,
  fallbackBackgroundColor,
  onPress,
  priority = 'normal', // 'low' | 'normal' | 'high'
  cache = 'immutable',  // 'web' | 'cacheOnly' | 'immutable'
}) => {
  const avatarSize = AVATAR_SIZES[size] || AVATAR_SIZES.medium;
  
  // 이니셜 생성 (사용자명 첫 글자들)
  const initials = useMemo(() => {
    if (!username) return '?';
    
    const words = username.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }, [username]);

  // 폴백 배경색 생성 (사용자명 기반)
  const backgroundColor = useMemo(() => {
    if (fallbackBackgroundColor) return fallbackBackgroundColor;
    
    if (!username) return Colors.border;
    
    // 사용자명을 해시하여 일관된 색상 생성
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 55%)`;
  }, [username, fallbackBackgroundColor]);

  // 폴백 이미지 URL 생성
  const fallbackImageUrl = useMemo(() => {
    if (!username) return null;
    
    // UI Avatars 서비스 사용 (무료)
    const encodedName = encodeURIComponent(username);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=${avatarSize * 2}&background=${backgroundColor.replace('#', '')}&color=fff&format=png`;
  }, [username, avatarSize, backgroundColor]);

  // 아바타 스타일
  const avatarStyle = useMemo(() => ({
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
  }), [avatarSize]);

  // FastImage props 최적화
  const imageProps = useMemo(() => ({
    source: { 
      uri: imageUrl,
      // priority: FastImage.priority[priority], // react-native-fast-image 사용 시
      // cache: FastImage.cacheControl[cache],   // react-native-fast-image 사용 시
    },
    style: [avatarStyle, style],
    // resizeMode: FastImage.resizeMode.cover, // react-native-fast-image 사용 시
    resizeMode: 'cover', // 기본 Image 사용 시
  }), [imageUrl, avatarStyle, style, priority, cache]);

  // 이미지가 있는 경우
  if (imageUrl) {
    return (
      <FastImage
        {...imageProps}
        onError={() => {
          // 이미지 로딩 실패 시 폴백 처리
          console.log('Avatar image failed to load:', imageUrl);
        }}
      />
    );
  }

  // 폴백 UI (이니셜 표시)
  return (
    <View
      style={[
        avatarStyle,
        styles.fallbackContainer,
        { backgroundColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: avatarSize * 0.4 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
});

// 아바타 그룹 컴포넌트 (여러 사용자 표시용)
export const AvatarGroup = memo(({
  users = [],
  size = 'small',
  maxVisible = 3,
  style,
}) => {
  const avatarSize = AVATAR_SIZES[size] || AVATAR_SIZES.small;
  const overlap = avatarSize * 0.3;
  
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <View style={[styles.avatarGroup, style]}>
      {visibleUsers.map((user, index) => (
        <View
          key={user.id || index}
          style={[
            styles.avatarGroupItem,
            { marginLeft: index > 0 ? -overlap : 0 }
          ]}
        >
          <FastAvatar
            imageUrl={user.avatar_url}
            username={user.username}
            size={size}
          />
        </View>
      ))}
      
      {remainingCount > 0 && (
        <View
          style={[
            styles.avatarGroupItem,
            styles.remainingCount,
            avatarSize && { 
              width: avatarSize, 
              height: avatarSize, 
              borderRadius: avatarSize / 2,
              marginLeft: -overlap
            }
          ]}
        >
          <Text
            style={[
              styles.remainingText,
              { fontSize: avatarSize * 0.3 }
            ]}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGroupItem: {
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 50,
  },
  remainingCount: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
  },
});

FastAvatar.displayName = 'FastAvatar';
AvatarGroup.displayName = 'AvatarGroup';

export default FastAvatar;