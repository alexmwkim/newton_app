/**
 * Block Type Definitions and Props Interfaces
 * 블록 타입 정의 및 Props 인터페이스
 */

/**
 * 블록 공통 Props 인터페이스
 */
export const BlockCommonProps = {
  block: null,           // Block data object
  index: 0,             // Block position in array
  isAuthor: true,       // User can edit this block
  onFocus: () => {},    // Block focus handler
  onDelete: () => {},   // Block delete handler
  onDismiss: () => {}   // Menu dismiss handler
};

/**
 * 텍스트 블록 Props 인터페이스
 */
export const TextBlockProps = {
  ...BlockCommonProps,
  onTextChange: () => {},    // Text content change handler
  onKeyPress: () => {},      // Key press handler
  keyboardConfig: {          // Keyboard configuration
    visible: false,
    height: 0,
    accessoryViewID: 'newton-toolbar'
  }
};

/**
 * 카드 블록 Props 인터페이스
 */
export const CardBlockProps = {
  ...BlockCommonProps,
  blocks: [],              // All blocks array (for reordering)
  onBlocksUpdate: () => {},  // Blocks array update handler
  layoutConfig: {          // Layout configuration
    layouts: {},           // Current layouts map
    onLayoutUpdate: () => {}, // Layout update handler
    dragState: {           // Drag state
      dragging: null,      // Currently dragging block ID
      hovering: null,      // Currently hovering block ID
      position: { x: 0, y: 0 }
    }
  },
  textConfig: {            // Text editing configuration
    onTextChange: () => {},
    onKeyPress: () => {}
  }
};

/**
 * 이미지 블록 Props 인터페이스
 */
export const ImageBlockProps = {
  ...BlockCommonProps,
  blocks: [],              // All blocks array (for reordering)
  onBlocksUpdate: () => {},  // Blocks array update handler
  layoutConfig: {          // Layout configuration
    layouts: {},
    onLayoutUpdate: () => {},
    dragState: {
      dragging: null,
      hovering: null
    }
  }
};

/**
 * 블록 타입별 필수 Props 검증
 */
export const validateBlockProps = (blockType, props) => {
  const requiredProps = {
    text: ['block', 'onTextChange', 'onKeyPress'],
    card: ['block', 'blocks', 'onBlocksUpdate', 'layoutConfig'],
    'grid-card': ['block', 'onTextChange', 'onKeyPress'],
    image: ['block', 'blocks', 'onBlocksUpdate', 'layoutConfig']
  };

  const required = requiredProps[blockType] || [];
  const missing = required.filter(prop => !(prop in props));
  
  if (missing.length > 0) {
    console.warn(`🚨 Missing required props for ${blockType} block:`, missing);
    return false;
  }
  
  return true;
};

/**
 * Props 그룹화 유틸리티
 */
export const groupBlockProps = (allProps) => {
  return {
    // 공통 Props
    common: {
      block: allProps.block,
      index: allProps.index,
      isAuthor: allProps.isAuthor
    },
    
    // 텍스트 관련 Props
    text: {
      onTextChange: allProps.handleTextChange,
      onKeyPress: allProps.handleKeyPress,
      onFocus: allProps.setFocusedIndex
    },
    
    // 레이아웃 관련 Props
    layout: {
      layouts: allProps.cardLayouts || {},
      onLayoutUpdate: allProps.setCardLayouts || (() => {}),
      dragState: {
        dragging: allProps.draggingBlockId,
        hovering: allProps.hoveredBlockId,
        position: allProps.dragPosition || { x: 0, y: 0 }
      }
    },
    
    // 블록 배열 관련 Props
    blocks: {
      blocks: allProps.blocks || [],
      onUpdate: allProps.setBlocks || (() => {})
    },
    
    // 키보드 관련 Props
    keyboard: {
      visible: allProps.keyboardVisible || false,
      height: allProps.keyboardHeight || 0,
      scrollToInput: allProps.scrollToFocusedInput || (() => {}),
      accessoryViewID: 'newton-toolbar'
    },
    
    // 이벤트 핸들러
    events: {
      onDelete: allProps.handleDeleteBlock || (() => {}),
      onDismiss: allProps.dismissMenus || (() => {}),
      onPreventScroll: allProps.preventNextAutoScroll || (() => {})
    }
  };
};