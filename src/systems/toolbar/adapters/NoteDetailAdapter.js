/**
 * 📱 NoteDetailScreen Toolbar 어댑터
 * 
 * 역할:
 * 1. 기존 NoteDetailScreen 로직을 ToolbarSystem과 연결
 * 2. 화면별 특화 로직 처리
 * 3. 점진적 마이그레이션 지원
 */

import { useEffect, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useScreenToolbar, TextFormatType, BlockType } from '../ToolbarSystem';

/**
 * NoteDetailScreen용 툴바 어댑터 훅
 */
export const useNoteDetailToolbarAdapter = ({
  // NoteDetailScreen의 기존 상태들
  blocks,
  setBlocks,
  focusedIndex,
  setFocusedIndex,
  isAuthor,
  
  // 기존 핸들러들 (점진적 마이그레이션)
  handleAddCard,
  handleAddGrid,
  handleAddImage,
  handleTextChange
}) => {

  // =============================================================================
  // 🔄 TEXT FORMAT HANDLERS (통합된 방식)
  // =============================================================================

  /**
   * 통합된 텍스트 포맷팅 핸들러
   * - Strategy Pattern으로 포맷 적용
   * - 기존 블록 시스템과 호환
   */
  const handleTextFormat = useCallback((blockIndex, formatType, strategy) => {
    if (blockIndex >= 0 && blocks[blockIndex]) {
      const currentBlock = blocks[blockIndex];
      
      if (currentBlock.type === 'text') {
        const newContent = strategy.apply(currentBlock.content);
        
        const updatedBlocks = [...blocks];
        updatedBlocks[blockIndex] = { ...currentBlock, content: newContent };
        
        setBlocks(updatedBlocks);
        
        console.log('🔧 NoteDetailAdapter: Applied format', formatType, 'to block', blockIndex);
        
        // 포맷 적용 후 포커스 유지
        setTimeout(() => {
          if (currentBlock.ref?.current) {
            currentBlock.ref.current.focus();
          }
        }, 50);
      }
    }
  }, [blocks, setBlocks]);

  /**
   * 통합된 블록 삽입 핸들러
   * - 기존 핸들러들을 래핑
   * - 일관된 인터페이스 제공
   */
  const handleBlockInsert = useCallback((blockType, afterIndex) => {
    switch (blockType) {
      case BlockType.CARD:
        handleAddCard?.(afterIndex);
        break;
      case BlockType.IMAGE:
        handleAddImage?.(afterIndex);
        break;
      case 'grid': // 레거시 지원
        handleAddGrid?.(afterIndex);
        break;
      default:
        console.warn('🚨 NoteDetailAdapter: Unknown block type:', blockType);
    }
  }, [handleAddCard, handleAddImage, handleAddGrid]);

  // =============================================================================
  // 🔌 TOOLBAR SYSTEM 연결
  // =============================================================================

  const { executeTextFormat, executeBlockInsert } = useScreenToolbar('note-detail', {
    textFormat: handleTextFormat,
    blockInsert: handleBlockInsert
  });

  // =============================================================================
  // 🎯 LEGACY COMPATIBILITY LAYER
  // =============================================================================

  /**
   * 레거시 개별 핸들러들 (기존 코드와의 호환성)
   * 점진적으로 제거 예정
   */
  const legacyHandlers = {
    handleBold: () => executeTextFormat(TextFormatType.BOLD, focusedIndex),
    handleItalic: () => executeTextFormat(TextFormatType.ITALIC, focusedIndex),
    handleHeading1: () => executeTextFormat(TextFormatType.HEADING_1, focusedIndex),
    handleHeading2: () => executeTextFormat(TextFormatType.HEADING_2, focusedIndex),
    handleHeading3: () => executeTextFormat(TextFormatType.HEADING_3, focusedIndex),
  };

  // =============================================================================
  // 🎛️ ENHANCED FEATURES
  // =============================================================================

  /**
   * 키보드 단축키 지원 (미래 확장)
   */
  const handleKeyboardShortcut = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          executeTextFormat(TextFormatType.BOLD, focusedIndex);
          break;
        case 'i':
          event.preventDefault();
          executeTextFormat(TextFormatType.ITALIC, focusedIndex);
          break;
      }
    }
  }, [executeTextFormat, focusedIndex]);

  /**
   * 스마트 포맷 감지 (미래 확장)
   * 사용자가 "## " 입력 시 자동으로 헤딩으로 변환
   */
  const handleSmartFormat = useCallback((blockIndex, newText) => {
    // 마크다운 패턴 감지
    const patterns = {
      '# ': TextFormatType.HEADING_1,
      '## ': TextFormatType.HEADING_2,
      '### ': TextFormatType.HEADING_3,
      '**': TextFormatType.BOLD,
      '*': TextFormatType.ITALIC
    };

    // TODO: 패턴 매칭 및 자동 변환 로직
  }, []);

  return {
    // 새로운 통합 시스템
    executeTextFormat,
    executeBlockInsert,
    
    // 레거시 호환성
    ...legacyHandlers,
    
    // 향후 확장 기능들
    handleKeyboardShortcut,
    handleSmartFormat
  };
};

/**
 * SimpleToolbarContext 호환성 래퍼
 * 기존 코드와의 브릿지 역할
 */
export const useSimpleToolbarCompatibility = (adapterResult) => {
  const handleDone = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // 기존 SimpleToolbarContext 인터페이스 모방
  return {
    ...adapterResult,
    hideKeyboard: handleDone
  };
};