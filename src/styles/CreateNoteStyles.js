import { StyleSheet, Platform } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { Spacing } from '../constants/StyleControl';

export const createNoteStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, // 모든 페이지 통일 (20px)
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
  },
  forkedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    marginHorizontal: Spacing.screen.horizontal,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.spacing.sm,
  },
  forkedText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    flex: 1,
  },
  forkedAuthor: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.floatingButton,
  },
  actionButton: {
    padding: Layout.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 18,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  scrollContent: {
    paddingHorizontal: 20, // 모든 페이지 통일 (20px)
    paddingVertical: Layout.screen.padding,
    paddingBottom: 400, // 키보드+툴바 공간 확보
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 8, // 🔧 FIX: 적절한 패딩으로 클릭 영역 확보
    paddingHorizontal: 0, // 토글과 정확히 정렬 (20px)
    marginBottom: 20,
    color: Colors.primaryText,
    // 🔧 FIX: 클릭 감지를 위한 최소 높이 설정 (자연스러운 텍스트 높이)
    minHeight: 30, // fontSize(22) + 여유공간으로 클릭 영역 확보
    lineHeight: 28, // 🔧 FIX: 모든 텍스트와 통일된 lineHeight로 키보드 움직임 방지
    // 🔧 FIX: 플랫폼별 텍스트 렌더링 일관성 확보
    ...Platform.select({
      ios: {
        includeFontPadding: false, // iOS에서 불필요한 폰트 패딩 제거
        // iOS에서는 textAlignVertical 제거 - 기본 동작 사용
      },
      android: {
        includeFontPadding: false, // Android에서 불필요한 폰트 패딩 제거
        textAlignVertical: 'top',
      }
    }),
  },
  
  // Block-related styles
  blocksContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    position: 'relative',
  },
  textInput: {
    // Industry-standard minimal spacing (consistent with NoteDetailStyles)
    paddingVertical: 0, // 🔧 FIX: 패딩 완전 제거로 블록 간 간격 통일
    paddingHorizontal: 0,
    minHeight: 28, // 🔧 FIX: lineHeight와 정확히 일치시켜 키보드 움직임 방지
    marginBottom: 8, // 🔧 FIX: 텍스트 블록 아래 추가 간격으로 카드/이미지와 더 떨어지게
// marginTop 제거 - 카드 marginBottom만으로 간격 조정
    backgroundColor: 'transparent',
    color: Colors.primaryText,
    width: '100%',
    // Industry-standard cursor positioning fixes
    lineHeight: 28, // 🔧 FIX: 모든 텍스트와 통일된 lineHeight로 키보드 움직임 방지
    textAlignVertical: 'top', // Critical for Android cursor positioning
    ...(Platform.OS === 'android' && {
      includeFontPadding: false, // Removes extra padding that affects cursor position
    }),
  },
  
  // Card styles
  cardBlock: {
    backgroundColor: Colors.noteCard,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20, // 🔧 FIX: 카드 블록 간격 조정 (텍스트 lineHeight보다 약간 크게)
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
    minHeight: 28, // 🔧 FIX: MultilineFormattedInput에 맞춰 28로 줄임
  },
  cardTitleInput: {
    flex: 1,
    color: Colors.primaryText,
    minHeight: 24, // 🔧 FIX: MultilineFormattedInput에 맞춰 24로 줄임
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    // Dynamic styling handled by MultilineFormattedInput
  },
  
  cardDragIndicator: {
    borderWidth: 2,
    borderColor: Colors.floatingButton,
    borderStyle: 'dashed',
  },
  cardDragging: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHovered: {
    borderWidth: 3,
    borderColor: Colors.floatingButton,
    borderStyle: 'solid',
    backgroundColor: '#FFF3E0', // Light orange background
    transform: [{ scale: 1.02 }],
    shadowColor: Colors.floatingButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Drop zone indicators
  dropZoneIndicator: {
    height: 4,
    backgroundColor: Colors.floatingButton,
    borderRadius: 2,
    marginVertical: 4,
    opacity: 0.8,
  },
  dropZoneActive: {
    backgroundColor: Colors.floatingButton,
    opacity: 1.0,
    transform: [{ scaleY: 1.5 }],
  },
  layoutModeIndicator: {
    position: 'absolute',
    top: -25,
    right: 0,
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: 8,
    paddingVertical: 0, // 🔧 FIX: 패딩 완전 제거로 블록 간 간격 통일
    borderRadius: 12,
  },
  layoutModeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  
  // Image styles
  imageBlock: {
    position: 'relative',
    marginBottom: 20, // 🔧 FIX: 이미지 블록 간격을 카드와 비슷하게 조정
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0006',
    padding: 6,
    borderRadius: 20,
  },
  
  // Drag guidelines
  dragGuideline: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.floatingButton,
    opacity: 0.7,
    zIndex: 1000,
  },
  dragGuidelineLeft: {
    left: '48%',
  },
  dragGuidelineRight: {
    right: '48%',
  },
  
  // Touch areas
  touchableSpacer: {
    height: 300,
    backgroundColor: 'transparent',
  },
  
  // Toolbar styles - 개선된 안정성과 시각적 피드백
  nativeToolbar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 50, // 최소 높이 보장
  },
  toolbarBtn: {
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    minWidth: 44,
    minHeight: 44,
  },
  
  // Card formatting hint styles
  cardFormattingHint: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF9E6', // 연한 노란색 배경
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4A3', // 노란색 테두리
    borderStyle: 'dashed',
  },
  cardFormattingHintText: {
    fontSize: 11,
    color: '#B8860B', // 어두운 노란색 텍스트
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 14,
  },
});