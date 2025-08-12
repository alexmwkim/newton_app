/**
 * SocialActions - 소셜 액션 통합 컴포넌트
 * 팔로우, 별표, 포크 등의 소셜 인터랙션을 통합 관리
 */

import React, { memo, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const SocialActions = memo(({
  // 액션 타입 및 대상
  type, // 'follow' | 'star' | 'fork'
  targetId,
  targetData = {}, // 추가 데이터 (username 등)
  
  // 상태
  isActive = false,
  loading = false,
  disabled = false,
  
  // 이벤트 핸들러
  onToggle,
  onOptionsPress,
  
  // 표시 옵션
  showText = true,
  showCount = false,
  count = 0,
  variant = 'primary', // 'primary' | 'secondary' | 'minimal'
  size = 'medium', // 'small' | 'medium' | 'large'
  
  style
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // 액션별 설정
  const actionConfig = {
    follow: {
      activeIcon: 'user-check',
      inactiveIcon: 'user-plus',
      activeText: 'Following',
      inactiveText: 'Follow',
      activeColor: Colors.primaryText,
      inactiveColor: Colors.primaryText,
      confirmMessage: (username) => `Unfollow ${username}?`
    },
    star: {
      activeIcon: 'star',
      inactiveIcon: 'star',
      activeText: 'Starred',
      inactiveText: 'Star',
      activeColor: '#FFD700',
      inactiveColor: Colors.secondaryText,
      confirmMessage: () => 'Remove star?'
    },
    fork: {
      activeIcon: 'git-branch',
      inactiveIcon: 'git-branch',
      activeText: 'Forked',
      inactiveText: 'Fork',
      activeColor: Colors.primaryText,
      inactiveColor: Colors.secondaryText,
      confirmMessage: () => 'This will create a copy of this note in your notes.'
    }
  };

  const config = actionConfig[type];
  if (!config) return null;

  // 토글 핸들러
  const handleToggle = useCallback(async () => {
    if (disabled || loading || isProcessing) return;
    
    // 비활성화 시 확인 대화창
    if (isActive && type === 'follow') {
      Alert.alert(
        'Confirm',
        config.confirmMessage(targetData.username || 'this user'),
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            style: 'destructive',
            onPress: () => executeToggle()
          }
        ]
      );
    } else {
      executeToggle();
    }
  }, [disabled, loading, isProcessing, isActive, type, targetData, config]);

  const executeToggle = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onToggle?.(targetId, !isActive, targetData);
    } catch (error) {
      console.error(`${type} action failed:`, error);
      Alert.alert('Error', `Failed to ${isActive ? 'remove' : 'add'} ${type}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onToggle, targetId, isActive, targetData, type]);

  // 스타일 계산
  const iconColor = isActive ? config.activeColor : config.inactiveColor;
  const textColor = isActive ? config.activeColor : Colors.primaryText;
  const isLoading = loading || isProcessing;
  
  const buttonStyle = [
    styles.button,
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    isActive && styles.buttonActive,
    disabled && styles.buttonDisabled,
    style
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handleToggle}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Icon 
          name={isActive ? config.activeIcon : config.inactiveIcon}
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color={iconColor}
        />
        
        {showText && (
          <Text style={[styles.text, { color: textColor }]}>
            {isActive ? config.activeText : config.inactiveText}
          </Text>
        )}
        
        {showCount && count > 0 && (
          <Text style={styles.count}>
            {count > 999 ? `${Math.floor(count / 1000)}k` : count}
          </Text>
        )}
      </View>
      
      {onOptionsPress && (
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={onOptionsPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="more-horizontal" size={16} color={Colors.secondaryText} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

// 팔로우 버튼 전용 컴포넌트
export const FollowButton = memo((props) => (
  <SocialActions
    {...props}
    type="follow"
    variant="primary"
    showText={true}
  />
));

// 별표 버튼 전용 컴포넌트
export const StarButton = memo((props) => (
  <SocialActions
    {...props}
    type="star"
    variant="minimal"
    showText={false}
    showCount={true}
  />
));

// 포크 버튼 전용 컴포넌트
export const ForkButton = memo((props) => (
  <SocialActions
    {...props}
    type="fork"
    variant="minimal"
    showText={false}
    showCount={true}
  />
));

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonSmall: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    minHeight: 32,
  },
  buttonMedium: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    minHeight: 40,
  },
  buttonLarge: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: Colors.white,
  },
  buttonSecondary: {
    backgroundColor: Colors.noteCard,
  },
  buttonMinimal: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonActive: {
    borderColor: Colors.primaryText,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  text: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  count: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginLeft: Layout.spacing.xs,
  },
  optionsButton: {
    marginLeft: Layout.spacing.xs,
    padding: Layout.spacing.xs,
  },
});

SocialActions.displayName = 'SocialActions';
FollowButton.displayName = 'FollowButton';
StarButton.displayName = 'StarButton';
ForkButton.displayName = 'ForkButton';

export default SocialActions;