import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

// 포맷팅 상태 관리 Context
const FormattingContext = createContext(null);

export const useFormatting = () => {
  const context = useContext(FormattingContext);
  if (!context) {
    throw new Error('useFormatting must be used within FormattingProvider');
  }
  return context;
};

// 포맷팅 제공자 컴포넌트
export const FormattingProvider = ({ children }) => {
  // FormattingProvider initialized
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    heading1: false,
    heading2: false,
    heading3: false
  });

  const [currentFocusedIndex, setCurrentFocusedIndex] = useState(-1);
  const [currentBlockRef, setCurrentBlockRef] = useState(null); // 현재 포커스된 TextInput ref 저장
  const setBlocksRef = useRef(null); // Dynamic setBlocks reference
  const [currentBlocks, setCurrentBlocks] = useState([]); // Real-time blocks data
  const [blockFormats, setBlockFormats] = useState({}); // Separate format storage: {blockIndex: formats}
  
  // 🆕 포커스된 블록의 저장된 포맷을 activeFormats에 동기화 (새로고침 후 복원 포함)
  useEffect(() => {
    if (currentFocusedIndex >= 0) {
      const savedFormats = blockFormats[currentFocusedIndex] || 
                          currentBlocks[currentFocusedIndex]?.savedFormats;
      
      if (savedFormats) {
        setActiveFormats(savedFormats);
      } else {
        // 저장된 포맷이 없으면 기본값으로 초기화
        setActiveFormats({
          bold: false,
          italic: false,
          heading1: false,
          heading2: false,
          heading3: false
        });
      }
    }
  }, [currentFocusedIndex, currentBlocks, blockFormats]); // blockFormats 의존성 복원

  // 🆕 실제 블록에 포맷 정보 저장하는 함수
  const saveFormatsToBlocks = useCallback((newFormats) => {
    if (currentFocusedIndex >= 0 && setBlocksRef.current) {
      setBlocksRef.current(prevBlocks => {
        return prevBlocks.map((block, index) => {
          if (index === currentFocusedIndex) {
            // 🔧 FIX: 포커스 유지를 위해 단순히 savedFormats만 업데이트
            return { ...block, savedFormats: { ...newFormats } };
          }
          return block;
        });
      });
    }
  }, [currentFocusedIndex]);

  // 포맷 토글 함수들 - 현재 포커스된 블록에 즉시 저장
  const toggleBold = useCallback(() => {
    setActiveFormats(prev => {
      const newBoldState = !prev.bold;
      const newFormats = { ...prev, bold: newBoldState };
      
      // 메모리 저장 (실시간 UI 업데이트용)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      
      // 🆕 실제 블록에 저장 (영구 보존용)
      saveFormatsToBlocks(newFormats);
      
      return newFormats;
    });
  }, [currentFocusedIndex, saveFormatsToBlocks]);

  const toggleItalic = useCallback(() => {
    setActiveFormats(prev => {
      const newItalicState = !prev.italic;
      const newFormats = { ...prev, italic: newItalicState };
      
      // 메모리 저장 (실시간 UI 업데이트용)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      
      // 🆕 실제 블록에 저장 (영구 보존용)
      saveFormatsToBlocks(newFormats);
      
      return newFormats;
    });
  }, [currentFocusedIndex, saveFormatsToBlocks]);

  const toggleHeading1 = useCallback(() => {
    setActiveFormats(prev => {
      const newFormats = {
        bold: false,
        italic: false,
        heading1: !prev.heading1,
        heading2: false,
        heading3: false
      };
      
      // 메모리 저장 (실시간 UI 업데이트용)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      
      // 🆕 실제 블록에 저장 (영구 보존용)
      saveFormatsToBlocks(newFormats);
      
      return newFormats;
    });
  }, [currentFocusedIndex, saveFormatsToBlocks]);

  const toggleHeading2 = useCallback(() => {
    setActiveFormats(prev => {
      const newFormats = {
        bold: false,
        italic: false,
        heading1: false,
        heading2: !prev.heading2,
        heading3: false
      };
      
      // 메모리 저장 (실시간 UI 업데이트용)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      
      // 🆕 실제 블록에 저장 (영구 보존용)
      saveFormatsToBlocks(newFormats);
      
      return newFormats;
    });
  }, [currentFocusedIndex, saveFormatsToBlocks]);

  const toggleHeading3 = useCallback(() => {
    setActiveFormats(prev => {
      const newFormats = {
        bold: false,
        italic: false,
        heading1: false,
        heading2: false,
        heading3: !prev.heading3
      };
      
      // 메모리 저장 (실시간 UI 업데이트용)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      
      // 🆕 실제 블록에 저장 (영구 보존용)
      saveFormatsToBlocks(newFormats);
      
      return newFormats;
    });
  }, [currentFocusedIndex, saveFormatsToBlocks]);

  // 동적 스타일 계산 - 블록별 포맷 저장 지원
  const getDynamicTextStyle = useCallback((blockIndex, block = null) => {
    // 업계 표준에 맞는 타이포그래피 설정
    const baseStyle = {
      fontWeight: 'normal',
      fontStyle: 'normal', 
      fontSize: 16,     // 기본 폰트 크기
      lineHeight: 28,   // 🔧 FIX: 모든 헤딩과 통일된 lineHeight로 키보드 움직임 방지
      ...(Platform.OS === 'ios' && {
        fontFamily: 'System'
      })
    };

    // 포커스 상태 확인
    const isFocused = blockIndex === currentFocusedIndex;

    // 포맷 정보 결정: 각 블록의 독립적인 포맷 상태 보장
    let formatsToUse = null;
    
    // 🔍 DEBUG: 블록 정보 로그 (포커스된 블록만)
    if (isFocused) {
      console.log(`🔍 getDynamicTextStyle for FOCUSED block ${blockIndex}:`, {
        blockHasSavedFormats: !!block?.savedFormats,
        savedFormats: block?.savedFormats,
        activeFormats: activeFormats
      });
    }
    
    if (isFocused) {
      // 🔧 FIX: 포커스된 블록은 항상 activeFormats 우선 사용 (실시간 변경 반영)
      formatsToUse = activeFormats;
      console.log(`🎯 Using activeFormats for focused block ${blockIndex} (real-time):`, formatsToUse);
    } else {
      // 포커스되지 않은 블록: 저장된 포맷 사용 (포맷 유지)
      formatsToUse = blockFormats[blockIndex] || block?.savedFormats || null;
      console.log(`📝 Using saved formats for unfocused block ${blockIndex}:`, {
        fromBlockFormats: blockFormats[blockIndex],
        fromBlockSavedFormats: block?.savedFormats,
        finalFormats: formatsToUse
      });
    }

    // 포맷 정보가 없으면 기본 스타일 반환
    if (!formatsToUse) {
      // 기본 스타일 사용
      return baseStyle;
    }

    // 스타일 계산
    const styledResult = { ...baseStyle };

    // 헤딩 스타일 - 🔧 FIX: 일정한 lineHeight로 키보드 글씨 움직임 방지
    if (formatsToUse.heading1) {
      styledResult.fontSize = 24;
      styledResult.lineHeight = 28; // 고정된 lineHeight
      styledResult.fontWeight = Platform.OS === 'ios' ? '700' : 'bold';
    } else if (formatsToUse.heading2) {
      styledResult.fontSize = 20;
      styledResult.lineHeight = 28; // 🔧 FIX: H1과 동일한 lineHeight로 통일
      styledResult.fontWeight = Platform.OS === 'ios' ? '700' : 'bold';
    } else if (formatsToUse.heading3) {
      styledResult.fontSize = 18;
      styledResult.lineHeight = 28; // 🔧 FIX: H1, H2와 동일한 lineHeight로 통일
      styledResult.fontWeight = Platform.OS === 'ios' ? '700' : 'bold';
      console.log(`🔍 H3 style applied to block ${blockIndex}:`, {
        fontSize: styledResult.fontSize,
        fontWeight: styledResult.fontWeight,
        platform: Platform.OS
      });
    } else {
      // 헤딩이 아닐 때만 볼드/이탤릭 적용
      if (formatsToUse.bold && formatsToUse.italic) {
        // Simple standard bold + italic
        styledResult.fontWeight = Platform.OS === 'ios' ? '600' : 'bold';
        styledResult.fontStyle = 'italic';
      } else if (formatsToUse.bold) {
        styledResult.fontWeight = Platform.OS === 'ios' ? '600' : 'bold';
        console.log(`🔍 Bold style applied to block ${blockIndex}:`, {
          fontWeight: styledResult.fontWeight,
          platform: Platform.OS
        });
      } else if (formatsToUse.italic) {
        // Simple standard italic
        styledResult.fontStyle = 'italic';
      }
    }

    // 스타일 적용 완료
    
    return styledResult;
  }, [activeFormats, currentFocusedIndex, blockFormats]);

  // 포맷 초기화 (새 블록용 - 기존 블록은 유지)
  const resetFormats = useCallback(() => {
    setActiveFormats({
      bold: false,
      italic: false,
      heading1: false,
      heading2: false,
      heading3: false
    });
    
    // 🔧 FIX: blockFormats는 건드리지 않음 - 기존 블록의 포맷 유지
    // blockFormats는 각 블록의 저장된 포맷이므로 유지되어야 함
    console.log('📝 Format reset: only activeFormats cleared, blockFormats preserved');
  }, []);

  // 포커스 변경 시 해당 블록의 포맷을 로드
  const setCurrentFocusedIndexWithoutReset = useCallback((newIndex, blocks = []) => {
    console.log(`🎯 setCurrentFocusedIndex called: ${newIndex}`, {
      blocksLength: blocks.length,
      currentBlocksLength: currentBlocks.length
    });
    
    setCurrentFocusedIndex(newIndex);
    
    // Update current blocks data
    if (blocks.length > 0) {
      setCurrentBlocks(blocks);
    }
    
    // Use current blocks or passed blocks
    const blocksToUse = blocks.length > 0 ? blocks : currentBlocks;
    
    console.log(`🔍 Looking for formats for block ${newIndex}:`, {
      inBlockFormats: blockFormats[newIndex],
      inBlockSavedFormats: blocksToUse[newIndex]?.savedFormats,
      blockExists: !!blocksToUse[newIndex]
    });
    
    // 분리된 저장소에서 포맷 먼저 확인
    if (newIndex >= 0 && blockFormats[newIndex]) {
      const savedFormats = blockFormats[newIndex];
      console.log(`✅ Loading formats from blockFormats[${newIndex}]:`, savedFormats);
      setActiveFormats(savedFormats);
    } else if (newIndex >= 0 && blocksToUse[newIndex]?.savedFormats) {
      const savedFormats = blocksToUse[newIndex].savedFormats;
      console.log(`✅ Loading formats from block.savedFormats[${newIndex}]:`, savedFormats);
      setActiveFormats(savedFormats);
    } else {
      // 저장된 포맷이 없으면 기본 포맷으로 리셋 (새 줄/새 블록)
      const defaultFormats = {
        bold: false,
        italic: false,
        heading1: false,
        heading2: false,
        heading3: false
      };
      console.log(`📝 No saved formats found for block ${newIndex}, using defaults`);
      setActiveFormats(defaultFormats);
    }
  }, [currentFocusedIndex, blockFormats, currentBlocks]);

  // 새 블록 생성 시에만 포맷 초기화하는 함수
  const resetFormatsForNewBlock = useCallback(() => {
    resetFormats();
    // Formats reset for new block
  }, [resetFormats]);

  // 텍스트가 비어있을 때 해당 블록의 포맷을 초기화하는 함수
  const resetFormatsIfTextEmpty = useCallback((blockIndex, textContent) => {
    // 텍스트가 완전히 비어있으면 해당 블록의 포맷 초기화
    if (!textContent || textContent.trim() === '') {
      // blockFormats에서 해당 블록의 포맷 제거
      setBlockFormats(prevFormats => {
        const newFormats = { ...prevFormats };
        delete newFormats[blockIndex];
        return newFormats;
      });
      
      // 현재 포커스된 블록이라면 activeFormats도 초기화
      if (blockIndex === currentFocusedIndex) {
        const defaultFormats = {
          bold: false,
          italic: false,
          heading1: false,
          heading2: false,
          heading3: false
        };
        setActiveFormats(defaultFormats);
      }
    }
  }, [currentFocusedIndex]);

  // 🔄 포커스 변경 시 savedFormats를 activeFormats에 동기화 (React 렌더 사이클 밖에서 처리)
  useEffect(() => {
    if (currentFocusedIndex >= 0) {
      // 🔧 FIX: blockFormats 우선 확인, 없으면 현재 블록의 savedFormats 사용
      const savedFormats = blockFormats[currentFocusedIndex] || 
                          currentBlocks[currentFocusedIndex]?.savedFormats;
      
      if (savedFormats) {
        console.log(`🔄 Syncing saved formats to activeFormats for block ${currentFocusedIndex}:`, savedFormats);
        setActiveFormats(savedFormats);
      } else {
        // 저장된 포맷이 없으면 기본값으로 초기화
        const defaultFormats = {
          bold: false,
          italic: false,
          heading1: false,
          heading2: false,
          heading3: false
        };
        console.log(`📝 No saved formats found for block ${currentFocusedIndex}, using defaults`);
        setActiveFormats(defaultFormats);
      }
    }
  }, [currentFocusedIndex, blockFormats]); // 🔧 FIX: currentBlocks 제거로 무한 루프 방지

  const contextValue = {
    // 상태
    activeFormats,
    currentFocusedIndex,
    
    // 액션들
    toggleBold,
    toggleItalic,
    toggleHeading1,
    toggleHeading2,
    toggleHeading3,
    resetFormats,
    
    // 유틸리티
    getDynamicTextStyle,
    setCurrentFocusedIndex: setCurrentFocusedIndexWithoutReset, // 포맷 유지 버전
    resetFormatsForNewBlock, // 새 블록용 포맷 초기화
    resetFormatsIfTextEmpty, // 텍스트 비어있을 때 포맷 초기화
    setCurrentBlockRef, // 현재 포커스된 TextInput ref 설정
    setActiveFormats,
    
    // Dynamic setBlocks setter for screen-level control
    setSetBlocks: (newSetBlocks) => {
      setBlocksRef.current = newSetBlocks;
    }
  };

  return (
    <FormattingContext.Provider value={contextValue}>
      {children}
    </FormattingContext.Provider>
  );
};