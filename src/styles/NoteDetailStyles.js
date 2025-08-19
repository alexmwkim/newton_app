import { StyleSheet, Platform } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

export const noteDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // 단순한 아이콘 스타일 - 배경이나 테두리 없음
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statusIcon: {
    backgroundColor: Colors.noteCard,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.sm,
  },
  solidStar: {
    textAlign: 'center',
    lineHeight: 20,
  },
  outlineStar: {
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: Layout.screen.padding, // 반응형 패딩 (16-32px)
    paddingBottom: 400, // 키보드+툴바 공간 확보
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 12,
    paddingHorizontal: 0, // scrollContent에서 이미 20px 패딩
    marginBottom: 20,
    color: Colors.primaryText,
  },
  
  // Author section
  authorSection: {
    marginBottom: Layout.spacing.sm,
    paddingBottom: Layout.spacing.sm,
    paddingHorizontal: 0,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  authorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  authorUserId: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  
  // Public stats
  publicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.screen.padding,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  readOnlyContainer: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'flex-end',
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius / 2,
  },
  readOnlyText: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
  
  // Settings menu
  settingsMenu: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    paddingVertical: Layout.spacing.sm,
    minWidth: 150,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1, 
    shadowRadius: 8,
    elevation: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 9999,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  menuItemText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  
  // Block styles - reuse from CreateNoteStyles but add NoteDetail specific ones
  blocksContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 0, // scrollContent에서 이미 20px 패딩
    minHeight: 50,
    marginBottom: 8,
    backgroundColor: 'transparent',
    color: Colors.primaryText,
    width: '100%', // Ensure text blocks take full width
  },
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
    fontSize: 15,
    color: Colors.primaryText,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
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
  touchableSpacer: {
    height: 300,
    backgroundColor: 'transparent',
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
  
  // Toolbar
  nativeToolbar: {
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
    borderTopWidth: 0,
  },
  toolbarBtn: {
    padding: 6,
  },
  readOnlyToolbar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  readOnlyToolbarText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  pageInfoModal: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 20,
  },
  pageInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageInfoTitle: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  pageInfoCloseButton: {
    padding: Layout.spacing.xs,
  },
  pageInfoContent: {
    padding: Layout.spacing.lg,
  },
  pageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
    minHeight: 24,
  },
  pageInfoLabel: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.secondaryText,
    width: 100,
    flexShrink: 0,
  },
  pageInfoValue: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    flex: 1,
    textAlign: 'left',
    lineHeight: 20,
  },
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visibilityIcon: {
    marginRight: Layout.spacing.xs,
  },
});