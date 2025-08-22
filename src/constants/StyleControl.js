/**
 * StyleControl - 스타일 통제센터
 * 모든 스타일 상수와 규칙을 중앙 관리
 */

import Colors from './Colors';
import Typography from './Typography';
import Layout from './Layout';

// 🎯 표준 마진/패딩 시스템
export const Spacing = {
  // 화면 표준 마진 (모든 페이지 통일)
  screen: {
    horizontal: 20, // 좌우 마진 표준값
    vertical: 16,   // 상하 마진 표준값
  },
  
  // 컴포넌트 간격
  component: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // 헤더 시스템
  header: {
    marginTop: 24,     // 모든 헤더 상단 마진
    paddingHorizontal: 20, // 헤더 좌우 패딩
    minHeight: 56,     // 헤더 최소 높이
  }
};

// 🎨 통합 컴포넌트 스타일
export const ComponentStyles = {
  // 헤더 스타일 시스템
  header: {
    main: {
      fontSize: Typography.fontSize.large, // 32px (메인탭)
      textAlign: 'left',
      paddingHorizontal: Spacing.screen.horizontal,
    },
    sub: {
      fontSize: Typography.fontSize.title, // 18px (서브화면)
      textAlign: 'center', 
      paddingHorizontal: Spacing.screen.horizontal,
    }
  },
  
  // 스크린 컨테이너
  screen: {
    padding: Spacing.screen.horizontal,
    backgroundColor: Colors.mainBackground,
  },
  
  // 카드 스타일
  card: {
    backgroundColor: Colors.noteCard,
    borderRadius: 10,
    padding: Spacing.component.md,
    marginHorizontal: Spacing.screen.horizontal,
  }
};

// 🚨 스타일 검증 함수들
export const StyleValidation = {
  // 마진 검증
  validateMargin: (value) => {
    const validMargins = [4, 8, 16, 20, 24, 32];
    if (!validMargins.includes(value)) {
      console.warn(`⚠️ 비표준 마진 사용: ${value}px. 표준값 사용 권장: ${validMargins.join(', ')}`);
    }
    return value;
  },
  
  // 색상 검증
  validateColor: (color) => {
    const colorValues = Object.values(Colors);
    if (!colorValues.includes(color) && !color.startsWith('#')) {
      console.warn(`⚠️ 비표준 색상 사용: ${color}`);
    }
    return color;
  }
};

// 📋 사용 중단 예정 상수들 (마이그레이션용)
export const DEPRECATED = {
  // Layout.screen.padding → Spacing.screen.horizontal로 교체
  LAYOUT_SCREEN_PADDING: 'Layout.screen.padding을 Spacing.screen.horizontal(20)로 교체하세요',
  
  // 개별 헤더 컴포넌트들 → UnifiedHeader로 교체
  INDIVIDUAL_HEADERS: 'UserProfileHeader, SearchHeader 등을 UnifiedHeader로 교체하세요'
};

export default {
  Spacing,
  ComponentStyles,
  StyleValidation,
  DEPRECATED
};