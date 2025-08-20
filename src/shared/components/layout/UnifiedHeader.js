/**
 * UnifiedHeader
 * 모든 화면에서 사용하는 통합 헤더 컴포넌트
 * - 일관된 레이아웃과 스타일 제공
 * - 최대 유연성을 위한 다양한 커스터마이징 옵션
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const UnifiedHeader = ({
  // 기본 요소들
  title,
  showBackButton = true,
  onBackPress,
  
  // 좌측 영역 커스터마이징
  leftComponent,
  
  // 우측 영역 커스터마이징 
  rightComponent,
  rightButtons = [],
  
  // 스타일 커스터마이징
  style,
  titleStyle,
  
  // 레이아웃 옵션
  centerTitle = true,
  transparent = false,
  
  // 접근성
  accessibilityLabel = "Header",
  
  ...props
}) => {
  // 뒤로가기 버튼 렌더링
  const renderLeftSection = () => {
    if (leftComponent) {
      return leftComponent;
    }
    
    if (showBackButton) {
      return (
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={Colors.textBlack} />
        </TouchableOpacity>
      );
    }
    
    return <View style={styles.leftSpacer} />;
  };

  // 우측 버튼들 렌더링
  const renderRightSection = () => {
    if (rightComponent) {
      return <View style={styles.rightContainer}>{rightComponent}</View>;
    }
    
    if (rightButtons.length > 0) {
      return (
        <View style={styles.rightContainer}>
          {rightButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              onPress={button.onPress}
              style={[
                styles.rightButton,
                button.disabled && styles.disabledButton
              ]}
              disabled={button.disabled}
              accessibilityLabel={button.accessibilityLabel}
              accessibilityRole="button"
            >
              <Icon 
                name={button.icon} 
                size={button.size || 20} 
                color={button.disabled ? Colors.lightGray : (button.color || Colors.textBlack)} 
              />
              {button.badge && <View style={styles.badge} />}
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    
    return <View style={styles.rightSpacer} />;
  };

  return (
    <View 
      style={[
        styles.header,
        transparent && styles.transparent,
        style
      ]}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {/* 좌측 영역 */}
      {renderLeftSection()}
      
      {/* 타이틀 */}
      {title && (
        <Text 
          style={[
            styles.headerTitle,
            centerTitle && styles.centerTitle,
            titleStyle
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      )}
      
      {/* 우측 영역 */}
      {renderRightSection()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0, // ScreenContainer에 의존
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 56, // 최소 터치 영역 확보
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  
  // 좌측 영역
  backButton: {
    padding: 8,
    marginLeft: 12, // 화면 가장자리에서 20px (ScreenContainer 패딩과 조합)
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  leftSpacer: {
    width: 52, // backButton과 동일한 전체 너비
  },
  
  // 타이틀
  headerTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'left',
  },
  centerTitle: {
    textAlign: 'center',
  },
  
  // 우측 영역
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12, // 화면 가장자리에서 20px
  },
  rightSpacer: {
    width: 52, // rightContainer와 동일한 전체 너비
  },
  rightButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
    position: 'relative',
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // 배지 (알림 등)
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.floatingButton,
  },
});

export default React.memo(UnifiedHeader);