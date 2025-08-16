import { useCallback, useEffect, useRef } from 'react';

/**
 * 블록 레이아웃 측정 및 관리 커스텀 훅
 * 블록의 위치와 크기를 안정적으로 추적하여 드래그 앤 드롭에 사용
 */
export const useBlockLayout = ({ 
  blockId, 
  setCardLayouts,
  DEBUG_LAYOUT = false 
}) => {
  const blockRef = useRef(null);
  
  // 통합된 레이아웃 측정 함수
  const measureLayout = useCallback(() => {
    if (blockRef.current) {
      blockRef.current.measureInWindow((pageX, pageY, width, height) => {
        if (height > 0 && pageY >= 0) {
          setCardLayouts(prev => ({
            ...prev,
            [blockId]: { x: pageX, y: pageY, width, height }
          }));
          DEBUG_LAYOUT && console.log(`✅ Layout measured for ${blockId}:`, { pageX, pageY, width, height });
        }
      });
    }
  }, [blockId, setCardLayouts, DEBUG_LAYOUT]);

  // 컴포넌트 마운트 및 언마운트 처리
  useEffect(() => {
    // 초기 측정 (다중 시점에서 측정하여 안정성 확보)
    const timeouts = [
      setTimeout(measureLayout, 50),
      setTimeout(measureLayout, 150),
      setTimeout(measureLayout, 300)
    ];
    
    return () => {
      // 타이머 정리
      timeouts.forEach(clearTimeout);
      
      // 레이아웃 정보 정리
      setCardLayouts(prev => {
        const updated = { ...prev };
        delete updated[blockId];
        return updated;
      });
      DEBUG_LAYOUT && console.log(`🧹 Layout cleaned up for ${blockId}`);
    };
  }, [blockId, measureLayout]);

  // onLayout 핸들러
  const handleLayout = useCallback((event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    DEBUG_LAYOUT && console.log(`📐 onLayout called for ${blockId}:`, { x, y, width, height });
    
    if (height > 0) {
      // onLayout은 로컬 좌표를 제공하므로 measureInWindow로 글로벌 좌표 획득
      if (blockRef.current) {
        blockRef.current.measureInWindow((pageX, pageY, pageWidth, pageHeight) => {
          setCardLayouts(prev => ({
            ...prev,
            [blockId]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
          }));
        });
      } else {
        // fallback to local coordinates
        setCardLayouts(prev => ({
          ...prev,
          [blockId]: { x, y, width, height }
        }));
      }
    }
  }, [blockId, setCardLayouts, DEBUG_LAYOUT]);

  // 콘텐츠 크기 변경 시 레이아웃 재측정
  const handleContentSizeChange = useCallback(() => {
    DEBUG_LAYOUT && console.log(`📏 Content size changed for ${blockId}, remeasuring...`);
    
    // 약간의 딜레이를 두고 재측정 (렌더링 완료 대기)
    setTimeout(() => {
      measureLayout();
    }, 50);
  }, [measureLayout, blockId, DEBUG_LAYOUT]);

  return {
    blockRef,
    handleLayout,
    handleContentSizeChange,
    measureLayout
  };
};