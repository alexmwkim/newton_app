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
    paddingVertical: 12,
    paddingHorizontal: 0, // 토글과 정확히 정렬 (20px)
    marginBottom: 20,
    color: Colors.primaryText,
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
    paddingVertical: 2,
    paddingHorizontal: 0,
    minHeight: 32, // Increased to accommodate H1 text (fontSize: 24 + lineHeight: 28)
    marginBottom: 6,
    backgroundColor: 'transparent',
    color: Colors.primaryText,
    width: '100%',
    // Industry-standard cursor positioning fixes
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
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
    marginBottom: 12,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
    minHeight: 40,
  },
  cardTitleInput: {
    flex: 1,
    fontSize: 16, // Base font size, will be overridden by getDynamicTextStyle
    color: Colors.primaryText,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    // Dynamic height adjustment for different text styles will be handled by getDynamicTextStyle
  },
  
  // Grid card styles
  gridCardBlock: {
    backgroundColor: Colors.noteCard,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    width: '48%',
    alignSelf: 'flex-start',
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 2,
    minHeight: 30,
  },
  gridCardTitleInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryText,
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    lineHeight: 18,
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
    paddingVertical: 2,
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
    marginBottom: 16,
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
});