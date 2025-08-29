import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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

  // 포맷 토글 함수들 - 현재 포커스된 블록에 즉시 저장
  const toggleBold = useCallback(() => {
    setActiveFormats(prev => {
      const newBoldState = !prev.bold;
      const newFormats = { ...prev, bold: newBoldState };
      
      // 현재 포커스된 블록에 포맷 저장 (분리된 저장소 사용 - auto-save 트리거 방지)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      return newFormats;
    });
  }, [currentFocusedIndex]); // activeFormats 제거!

  const toggleItalic = useCallback(() => {
    setActiveFormats(prev => {
      const newItalicState = !prev.italic;
      const newFormats = { ...prev, italic: newItalicState };
      
      // 현재 포커스된 블록에 포맷 저장 (분리된 저장소 사용 - auto-save 트리거 방지)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      return newFormats;
    });
  }, [currentFocusedIndex]);

  const toggleHeading1 = useCallback(() => {
    setActiveFormats(prev => {
      const newFormats = {
        bold: false,
        italic: false,
        heading1: !prev.heading1,
        heading2: false,
        heading3: false
      };
      
      // 현재 포커스된 블록에 포맷 저장 (분리된 저장소 사용 - auto-save 트리거 방지)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      return newFormats;
    });
  }, [currentFocusedIndex]);

  const toggleHeading2 = useCallback(() => {
    setActiveFormats(prev => {
      const newFormats = {
        bold: false,
        italic: false,
        heading1: false,
        heading2: !prev.heading2,
        heading3: false
      };
      
      // 현재 포커스된 블록에 포맷 저장 (분리된 저장소 사용 - auto-save 트리거 방지)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      return newFormats;
    });
  }, [currentFocusedIndex]);

  const toggleHeading3 = useCallback(() => {
    setActiveFormats(prev => {
      const newFormats = {
        bold: false,
        italic: false,
        heading1: false,
        heading2: false,
        heading3: !prev.heading3
      };
      
      // 현재 포커스된 블록에 포맷 저장 (분리된 저장소 사용 - auto-save 트리거 방지)
      if (currentFocusedIndex >= 0) {
        setBlockFormats(prevFormats => ({
          ...prevFormats,
          [currentFocusedIndex]: { ...newFormats }
        }));
      }
      return newFormats;
    });
  }, [currentFocusedIndex]);

  // 동적 스타일 계산 - 블록별 포맷 저장 지원
  const getDynamicTextStyle = useCallback((blockIndex, block = null) => {
    // 업계 표준에 맞는 타이포그래피 설정
    const baseStyle = {
      fontWeight: 'normal',
      fontStyle: 'normal', 
      fontSize: 16,     // 기본 폰트 크기
      lineHeight: 20,   // 22 → 20으로 축소 (더 컴팩트)
      ...(Platform.OS === 'ios' && {
        fontFamily: 'System'
      })
    };

    // 포커스 상태 확인
    const isFocused = blockIndex === currentFocusedIndex;

    // 포맷 정보 결정: 각 블록의 독립적인 포맷 상태 보장
    let formatsToUse = null;
    
    if (isFocused) {
      // 포커스된 블록: activeFormats 사용 (실시간 업데이트)
      formatsToUse = activeFormats;
    } else {
      // 포커스되지 않은 블록: 분리된 저장소만 사용 (독립성 보장)
      formatsToUse = blockFormats[blockIndex] || null;
      // block?.savedFormats는 사용하지 않음 - 공유 문제 방지
      // 블록별 포맷 사용
    }

    // 포맷 정보가 없으면 기본 스타일 반환
    if (!formatsToUse) {
      // 기본 스타일 사용
      return baseStyle;
    }

    // 스타일 계산
    const styledResult = { ...baseStyle };

    // 헤딩 스타일 - 컴팩트하게 조정
    if (formatsToUse.heading1) {
      styledResult.fontSize = 24;
      styledResult.lineHeight = 28; // 32 → 28로 축소 (더 컴팩트)
      styledResult.fontWeight = Platform.OS === 'ios' ? '700' : 'bold';
    } else if (formatsToUse.heading2) {
      styledResult.fontSize = 20;
      styledResult.lineHeight = 24; // 28 → 24로 축소
      styledResult.fontWeight = Platform.OS === 'ios' ? '700' : 'bold';
    } else if (formatsToUse.heading3) {
      styledResult.fontSize = 18;
      styledResult.lineHeight = 22; // 25 → 22로 축소
      styledResult.fontWeight = Platform.OS === 'ios' ? '700' : 'bold';
    } else {
      // 헤딩이 아닐 때만 볼드/이탤릭 적용
      if (formatsToUse.bold && formatsToUse.italic) {
        styledResult.fontWeight = Platform.OS === 'ios' ? '600' : 'bold';
        styledResult.fontStyle = 'italic';
        // 한글/영어 모두 지원하는 Bold + Italic 효과
        if (Platform.OS === 'ios') {
          styledResult.fontFamily = 'System';
          styledResult.transform = [{ skewX: '-12deg' }]; // 텍스트를 12도 기울임
        }
      } else if (formatsToUse.bold) {
        styledResult.fontWeight = Platform.OS === 'ios' ? '600' : 'bold';
      } else if (formatsToUse.italic) {
        styledResult.fontStyle = 'italic';
        // 한글/영어 모두 지원하는 이탤릭 효과
        if (Platform.OS === 'ios') {
          // iOS에서 한글도 지원하는 시스템 폰트 사용하되, transform으로 기울기 강화
          styledResult.fontFamily = 'System';
          // CSS transform을 React Native에서 지원하는 방식으로 변환
          styledResult.transform = [{ skewX: '-12deg' }]; // 텍스트를 12도 기울임
        }
        // Korean-compatible italic applied
      }
    }

    // 스타일 적용 완료
    
    return styledResult;
  }, [activeFormats, currentFocusedIndex, blockFormats]);

  // 포맷 초기화
  const resetFormats = useCallback(() => {
    setActiveFormats({
      bold: false,
      italic: false,
      heading1: false,
      heading2: false,
      heading3: false
    });
    // 포맷 리셋 완료
  }, []);

  // 포커스 변경 시 해당 블록의 포맷을 로드
  const setCurrentFocusedIndexWithoutReset = useCallback((newIndex, blocks = []) => {
    setCurrentFocusedIndex(newIndex);
    
    // Update current blocks data
    if (blocks.length > 0) {
      setCurrentBlocks(blocks);
    }
    
    // Use current blocks or passed blocks
    const blocksToUse = blocks.length > 0 ? blocks : currentBlocks;
    
    // 분리된 저장소에서 포맷 먼저 확인
    if (newIndex >= 0 && blockFormats[newIndex]) {
      const savedFormats = blockFormats[newIndex];
      setActiveFormats(savedFormats);
      // Loaded formats from blockFormats
    } else if (newIndex >= 0 && blocksToUse[newIndex]?.savedFormats) {
      const savedFormats = blocksToUse[newIndex].savedFormats;
      setActiveFormats(savedFormats);
      // Loaded saved formats from block
    } else {
      // 저장된 포맷이 없으면 기본 포맷으로 리셋 (새 줄/새 블록)
      const defaultFormats = {
        bold: false,
        italic: false,
        heading1: false,
        heading2: false,
        heading3: false
      };
      setActiveFormats(defaultFormats);
      // Reset to default for new block/line
    }
  }, [currentFocusedIndex, blockFormats]);

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