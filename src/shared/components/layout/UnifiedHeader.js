/**
 * UnifiedHeader
 * 모든 화면에서 사용하는 통합 헤더 컴포넌트
 * - 일관된 레이아웃과 스타일 제공
 * - 최대 유연성을 위한 다양한 커스터마이징 옵션
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import { Spacing, ComponentStyles } from '../../../constants/StyleControl';

const UnifiedHeader = ({
  // 기본 요소들
  title,
  showBackButton = true,
  onBackPress,
  
  // 좌측 영역 커스터마이징
  leftComponent,
  leftElement, // 새로 추가: 'circleIcon' 등 지원
  onLeftPress,
  
  // 우측 영역 커스터마이징 
  rightComponent,
  rightButtons = [],
  rightElements = [], // 새로 추가: 배열 형태 아이콘들
  
  // 스타일 커스터마이징
  style,
  titleStyle,
  
  // 레이아웃 옵션
  centerTitle = true,
  transparent = false,
  
  // 시스템적 화면 타입 처리
  screenType = 'sub', // 'main' for main tab screens, 'sub' for sub-screens
  
  // 접근성
  accessibilityLabel = "Header",
  
  ...props
}) => {
  const insets = useSafeAreaInsets();
  // 좌측 섹션 렌더링
  const renderLeftSection = () => {
    if (leftComponent) {
      return leftComponent;
    }
    
    if (leftElement === 'logo') {
      return (
        <TouchableOpacity onPress={onLeftPress} style={styles.logoButton}>
          <Image 
            source={require('../../../../assets/logo/logo_app.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }
    
    if (showBackButton) {
      return (
        <TouchableOpacity
          onPress={() => {
            console.log('🚨 UnifiedHeader: Back button PRESSED!');
            console.log('🚨 onBackPress function exists:', !!onBackPress);
            if (onBackPress) {
              console.log('🚨 Calling onBackPress...');
              onBackPress();
            } else {
              console.error('🚨 No onBackPress function provided!');
            }
          }}
          style={styles.backButton}
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.6}
        >
          <Icon name="arrow-left" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      );
    }
    
    return <View style={styles.leftSpacer} />;
  };

  // 우측 버튼들 렌더링
  const renderRightSection = () => {
    if (rightComponent) {
      // rightComponent도 표준 rightContainer로 감싸서 일관된 레이아웃 적용
      return (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      );
    }
    
    if (rightElements.length > 0) {
      return (
        <View style={styles.rightContainer}>
          {rightElements.map((element, index) => {
            // 커스텀 컴포넌트 지원
            if (element.component) {
              return (
                <View key={index} style={styles.rightButton}>
                  {element.component}
                </View>
              );
            }
            
            // 기본 아이콘 버튼
            return (
              <TouchableOpacity
                key={index}
                onPress={element.onPress}
                style={styles.rightButton}
                accessibilityRole="button"
              >
                <Icon 
                  name={element.name} 
                  size={element.size || 24} 
                  color={element.color || Colors.primaryText} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      );
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
                color={button.disabled ? Colors.lightGray : (button.color || Colors.primaryText)} 
              />
              {button.badge && <View style={styles.badge} />}
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    
    // 좌측과 균형을 위한 빈 공간 - 좌측 버튼과 동일한 너비
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
      pointerEvents="box-none"
      {...props}
    >
      {/* 좌측 영역 */}
      <View style={[
        styles.leftSection,
        screenType === 'main' ? styles.leftSectionMain : styles.leftSectionSub
      ]}>
        {renderLeftSection()}
      </View>
      
      {/* 타이틀 - 시스템적 정렬 */}
      {title && (
        <View style={[
          styles.titleSection,
          screenType === 'main' ? styles.titleSectionLeft : styles.titleSectionCenter
        ]}>
          <Text 
            style={[
              styles.headerTitle,
              screenType === 'main' ? styles.leftAlignedTitle : styles.centerTitle,
              titleStyle
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
            pointerEvents="none"
          >
            {title}
          </Text>
        </View>
      )}
      
      {/* 우측 영역 */}
      <View style={[
        styles.rightSection,
        screenType === 'main' ? styles.rightSectionMain : styles.rightSectionSub
      ]}>
        {renderRightSection()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, // NoteDetail과 동일하게 복원
    paddingVertical: Layout.spacing.md, // NoteDetail과 동일하게 복원
    paddingTop: Layout.spacing.lg, // NoteDetail과 동일하게 복원
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 56, // NoteDetail과 동일하게 복원
  },
  
  leftSection: {
    alignItems: 'flex-start', // 왼쪽 정렬
    justifyContent: 'center',
  },
  leftSectionMain: {
    // 메인 탭 화면용 - sub와 동일한 절대 위치 시스템
    position: 'absolute',
    left: 12, // 20px - 8px(패딩) = 12px로 조정
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  leftSectionSub: {
    position: 'absolute', // 서브 화면도 절대 위치로 왼쪽 끝에 배치
    left: 12, // 20px - 8px(패딩) = 12px로 조정하여 아이콘이 정확히 20px에 위치
    top: 0,
    bottom: 0,
    justifyContent: 'center', // 수직 중앙 정렬
  },
  
  titleSection: {
    flex: 1, // 가운데 영역이 확장
  },
  titleSectionCenter: {
    position: 'absolute', // 절대 위치로 아이콘들과 동일한 높이 맞춤
    left: 60, // 뒤로가기 버튼 영역
    right: 60, // 오른쪽 아이콘 영역
    top: 0,
    bottom: 0,
    justifyContent: 'center', // 수직 중앙 정렬
    alignItems: 'center', // 수평 중앙 정렬
  },
  titleSectionLeft: {
    justifyContent: 'center', // 수직 중앙
    alignItems: 'flex-start', // 수평 왼쪽 정렬
    position: 'absolute', // 절대 위치로 왼쪽 끝에 배치
    left: 12, // 20px - 8px(패딩) = 12px로 조정 (뒤로가기 버튼과 동일한 정렬)
    right: 120, // 우측 아이콘 공간 더 넉넉하게 확보
    top: 0,
    bottom: 0,
  },
  
  rightSection: {
    alignItems: 'flex-end', // 오른쪽 정렬
    justifyContent: 'center', // 수직 중앙 정렬
  },
  rightSectionMain: {
    position: 'absolute', // 메인 탭 화면용 - 절대 위치로 오른쪽 끝에 배치
    right: 20, // 표준 마진 (좌측과 동일하게 20px)
    top: 0,
    bottom: 0,
    justifyContent: 'center', // 수직 중앙 정렬 추가
  },
  rightSectionSub: {
    position: 'absolute', // 서브 화면도 절대 위치로 오른쪽 끝에 배치
    right: 20, // 표준 마진 (좌측과 동일하게 20px)
    top: 0,
    bottom: 0,
    justifyContent: 'center', // 수직 중앙 정렬
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingTop: Layout.spacing.lg, // 일반 헤더와 동일한 상단 간격
    paddingVertical: Layout.spacing.md,
  },
  
  // 좌측 영역
  backButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  leftSpacer: {
    width: 60, // backButton과 동일한 전체 너비
  },
  
  // 타이틀 - 시스템적 정렬 처리
  headerTitle: {
    fontSize: Typography.fontSize.title, // 18px - 서브화면 기본
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    letterSpacing: -0.3,
    zIndex: 0,
  },
  centerTitle: {
    textAlign: 'center',
    alignSelf: 'center',
  },
  leftAlignedTitle: {
    textAlign: 'left',
    fontSize: Typography.fontSize.large, // 32px - 메인탭 화면용
    width: '100%', // 전체 너비 사용
    paddingLeft: 8, // 20px 정렬을 위한 패딩 (12px + 8px = 20px)
  },
  
  // 우측 영역
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 표준 아이콘 간격 (터치 영역과 시각적 균형)
  },
  rightSpacer: {
    width: 60, // leftSpacer와 동일한 너비로 균형
  },
  rightButton: {
    padding: 6, // 조금 더 컴팩트하게
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36, // 조금 더 컴팩트하게
    minHeight: 36,
    borderRadius: 18, // 원형 터치 영역
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
  
  // 로고 관련 스타일
  logoButton: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoImage: {
    width: 64,
    height: 64,
  },
});

export default React.memo(UnifiedHeader);