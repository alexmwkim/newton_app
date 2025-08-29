/**
 * 🎯 통합 툴바 시스템 - 장기적 확장성을 고려한 설계
 * 
 * 핵심 원칙:
 * 1. Single Responsibility: 각 컴포넌트는 하나의 책임만
 * 2. Open/Closed: 새 기능 추가는 쉽게, 기존 코드 수정은 최소화
 * 3. Dependency Injection: 화면별 커스텀 로직 주입 가능
 * 4. Type Safety: TypeScript 준비된 구조
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// =============================================================================
// 🔧 CORE TYPES & INTERFACES (미래 TypeScript 전환 대비)
// =============================================================================

/**
 * 툴바 액션의 기본 구조
 */
const ToolbarActionType = {
  TEXT_FORMAT: 'text_format',  // 텍스트 포맷팅 (bold, italic, heading)
  BLOCK_INSERT: 'block_insert', // 블록 삽입 (card, image, list)
  CONTENT_EDIT: 'content_edit', // 내용 편집 (copy, paste, delete)
  NAVIGATION: 'navigation'      // 네비게이션 (done, cancel)
};

/**
 * 텍스트 포맷 타입 정의
 */
export const TextFormatType = {
  BOLD: 'bold',
  ITALIC: 'italic',
  HEADING_1: 'heading1',
  HEADING_2: 'heading2', 
  HEADING_3: 'heading3',
  STRIKETHROUGH: 'strikethrough',
  CODE: 'code',
  QUOTE: 'quote'
};

/**
 * 블록 타입 정의
 */
export const BlockType = {
  TEXT: 'text',
  CARD: 'card',
  IMAGE: 'image',
  LIST: 'list',
  CHECKLIST: 'checklist',
  CODE_BLOCK: 'code_block',
  DIVIDER: 'divider'
};

// =============================================================================
// 🎨 FORMAT STRATEGIES (Strategy Pattern)
// =============================================================================

/**
 * 텍스트 포맷팅 전략들 - 새 포맷 추가 시 여기만 수정
 */
export const TextFormatStrategies = {
  [TextFormatType.BOLD]: {
    apply: (text) => text.startsWith('**') && text.endsWith('**') 
      ? text.slice(2, -2) 
      : `**${text}**`,
    detect: (text) => text.startsWith('**') && text.endsWith('**'),
    display: { icon: 'B', style: { fontWeight: 'bold' } }
  },
  
  [TextFormatType.ITALIC]: {
    apply: (text) => (text.startsWith('*') && text.endsWith('*') && !text.startsWith('**'))
      ? text.slice(1, -1)
      : `*${text}*`,
    detect: (text) => text.startsWith('*') && text.endsWith('*') && !text.startsWith('**'),
    display: { icon: 'I', style: { fontStyle: 'italic' } }
  },
  
  [TextFormatType.HEADING_1]: {
    apply: (text) => text.startsWith('# ') ? text.slice(2) : `# ${text}`,
    detect: (text) => text.startsWith('# '),
    display: { icon: 'H1', style: { fontWeight: '600', fontSize: 12 } }
  },
  
  [TextFormatType.HEADING_2]: {
    apply: (text) => text.startsWith('## ') ? text.slice(3) : `## ${text}`,
    detect: (text) => text.startsWith('## '),
    display: { icon: 'H2', style: { fontWeight: '600', fontSize: 12 } }
  },
  
  [TextFormatType.HEADING_3]: {
    apply: (text) => text.startsWith('### ') ? text.slice(4) : `### ${text}`,
    detect: (text) => text.startsWith('### '),
    display: { icon: 'H3', style: { fontWeight: '600', fontSize: 12 } }
  }
};

// =============================================================================
// 🔄 TOOLBAR STATE MANAGEMENT
// =============================================================================

/**
 * 툴바 상태 관리 Context
 */
const ToolbarContext = createContext({
  // 현재 상태
  activeScreen: null,
  focusedBlockIndex: -1,
  selectedBlocks: [],
  isAuthor: false,
  keyboardVisible: false,
  keyboardHeight: 0,
  
  // 액션 실행 함수들
  executeTextFormat: () => {},
  executeBlockInsert: () => {},
  executeContentEdit: () => {},
  
  // 상태 업데이트 함수들
  setActiveScreen: () => {},
  setFocusedBlock: () => {},
  registerScreenHandlers: () => {}
});

/**
 * 툴바 Provider - 전역 상태 관리
 */
export const ToolbarProvider = ({ children }) => {
  // 상태들
  const [activeScreen, setActiveScreen] = useState(null);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState(-1);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHandlers, setScreenHandlers] = useState({});

  // 🎯 핵심: 통합된 액션 실행 시스템
  const executeTextFormat = useCallback((formatType, blockIndex = focusedBlockIndex) => {
    const handler = screenHandlers[activeScreen]?.textFormat;
    if (handler && TextFormatStrategies[formatType]) {
      const strategy = TextFormatStrategies[formatType];
      handler(blockIndex, formatType, strategy);
      
      console.log('🔧 ToolbarSystem: Executed text format', formatType, 'on block', blockIndex);
    }
  }, [activeScreen, focusedBlockIndex, screenHandlers]);

  const executeBlockInsert = useCallback((blockType, afterIndex = focusedBlockIndex) => {
    const handler = screenHandlers[activeScreen]?.blockInsert;
    if (handler) {
      handler(blockType, afterIndex);
      
      console.log('🔧 ToolbarSystem: Inserted block', blockType, 'after index', afterIndex);
    }
  }, [activeScreen, focusedBlockIndex, screenHandlers]);

  // 화면별 핸들러 등록 (각 화면에서 호출)
  const registerScreenHandlers = useCallback((screenId, handlers) => {
    setScreenHandlers(prev => ({
      ...prev,
      [screenId]: handlers
    }));
    
    console.log('🔧 ToolbarSystem: Registered handlers for screen', screenId);
  }, []);

  // 컨텍스트 값
  const contextValue = useMemo(() => ({
    // 상태
    activeScreen,
    focusedBlockIndex,
    selectedBlocks,
    isAuthor,
    keyboardVisible,
    keyboardHeight,
    
    // 액션 실행
    executeTextFormat,
    executeBlockInsert,
    
    // 상태 업데이트
    setActiveScreen,
    setFocusedBlock: setFocusedBlockIndex,
    registerScreenHandlers
  }), [
    activeScreen,
    focusedBlockIndex,
    selectedBlocks,
    isAuthor,
    keyboardVisible,
    keyboardHeight,
    executeTextFormat,
    executeBlockInsert,
    registerScreenHandlers
  ]);

  return (
    <ToolbarContext.Provider value={contextValue}>
      {children}
    </ToolbarContext.Provider>
  );
};

// =============================================================================
// 🪝 CUSTOM HOOKS
// =============================================================================

/**
 * 툴바 시스템 사용 훅
 */
export const useToolbarSystem = () => {
  const context = useContext(ToolbarContext);
  if (!context) {
    throw new Error('useToolbarSystem must be used within ToolbarProvider');
  }
  return context;
};

/**
 * 화면별 툴바 연결 훅 - 각 화면에서 사용
 */
export const useScreenToolbar = (screenId, handlers) => {
  const { registerScreenHandlers, setActiveScreen, executeTextFormat, executeBlockInsert } = useToolbarSystem();
  
  // 화면 활성화 시 핸들러 등록
  useState(() => {
    registerScreenHandlers(screenId, handlers);
    setActiveScreen(screenId);
    
    return () => {
      setActiveScreen(null);
    };
  }, [screenId, handlers, registerScreenHandlers, setActiveScreen]);
  
  return {
    executeTextFormat,
    executeBlockInsert
  };
};

// =============================================================================
// 🎛️ TOOLBAR CONFIGURATION
// =============================================================================

/**
 * 툴바 버튼 구성 - 쉬운 커스터마이징
 */
export const ToolbarConfig = {
  // 기본 텍스트 포맷팅 버튼들
  textFormats: [
    TextFormatType.BOLD,
    TextFormatType.ITALIC,
    TextFormatType.HEADING_1,
    TextFormatType.HEADING_2,
    TextFormatType.HEADING_3
  ],
  
  // 블록 삽입 버튼들
  blockInserts: [
    BlockType.CARD,
    BlockType.IMAGE,
    BlockType.LIST,
    BlockType.CHECKLIST
  ],
  
  // 화면별 커스텀 구성
  screenConfigs: {
    'note-detail': {
      textFormats: [
        TextFormatType.BOLD,
        TextFormatType.ITALIC,
        TextFormatType.HEADING_1,
        TextFormatType.HEADING_2,
        TextFormatType.HEADING_3
      ],
      blockInserts: [
        BlockType.CARD,
        BlockType.IMAGE
      ]
    },
    'note-create': {
      textFormats: [
        TextFormatType.BOLD,
        TextFormatType.ITALIC
      ],
      blockInserts: [
        BlockType.CARD,
        BlockType.IMAGE,
        BlockType.LIST
      ]
    }
  }
};

export default ToolbarContext;