/**
 * 전역 툴바 상수 정의
 * 업계 표준에 따른 단일 InputAccessoryView 시스템
 */

export const GLOBAL_TOOLBAR_ID = 'newton-global-toolbar';
export const TOOLBAR_HEIGHT = 44;

// 툴바 버튼 정의 (기존 UI 스타일 유지)
export const TOOLBAR_ACTIONS = {
  CARD: 'card',
  GRID: 'grid', 
  IMAGE: 'image',
  DONE: 'done'
};

// 툴바 표시 조건
export const TOOLBAR_DISPLAY_CONDITIONS = {
  ALWAYS_SHOW: true,
  AUTH_REQUIRED: true,
  AUTHOR_ONLY: false // 모든 사용자에게 표시 (읽기 전용일 때는 버튼 비활성화)
};