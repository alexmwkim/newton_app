/**
 * Performance Optimization Utilities
 * 성능 최적화를 위한 유틸리티 함수들
 */

import React from 'react';
import { useMemo, useCallback, useRef } from 'react';

/**
 * 배열 연산 최적화 훅
 * 복잡한 배열 필터링/정렬을 메모이제이션
 */
export const useOptimizedArrayOperations = (
  data,
  filterFn,
  sortFn,
  dependencies = []
) => {
  return useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    let result = data;
    
    // 필터링 적용
    if (filterFn) {
      result = result.filter(filterFn);
    }
    
    // 정렬 적용
    if (sortFn) {
      result = result.sort(sortFn);
    }
    
    return result;
  }, [data, filterFn, sortFn, ...dependencies]);
};

/**
 * 검색 최적화 훅
 * 디바운싱과 메모이제이션을 결합한 검색
 */
export const useOptimizedSearch = (data, searchQuery, searchFields, delay = 300) => {
  const searchTimeoutRef = useRef(null);
  
  return useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase().trim();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFields]);
};

/**
 * 렌더링 최적화를 위한 안정적인 핸들러 생성
 */
export const createStableHandlers = (handlers) => {
  return Object.keys(handlers).reduce((stable, key) => {
    stable[key] = useCallback(handlers[key], []);
    return stable;
  }, {});
};

/**
 * FlatList 아이템 렌더러 최적화
 */
export const createOptimizedRenderItem = (Component) => {
  return useCallback(({ item, index }) => (
    <Component item={item} index={index} />
  ), []);
};

/**
 * 키 추출기 최적화
 */
export const createOptimizedKeyExtractor = () => {
  return useCallback((item, index) => {
    return item.id?.toString() || item.key?.toString() || index.toString();
  }, []);
};

/**
 * 메모리 사용량 모니터링
 */
export const useMemoryMonitoring = (componentName) => {
  const renderCount = useRef(0);
  
  renderCount.current += 1;
  
  if (__DEV__ && renderCount.current % 50 === 0) {
    console.log(`📊 ${componentName} rendered ${renderCount.current} times`);
    
    if (global.performance && global.performance.memory) {
      const memory = global.performance.memory;
      console.log(`💾 Memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
    }
  }
};

/**
 * 렌더링 성능 측정
 */
export const useRenderPerformance = (componentName) => {
  const startTime = useRef(Date.now());
  
  if (__DEV__) {
    const renderTime = Date.now() - startTime.current;
    if (renderTime > 16) { // 60fps = 16ms per frame
      console.warn(`⚠️ Slow render: ${componentName} took ${renderTime}ms`);
    }
  }
};

/**
 * 복잡한 계산 최적화
 */
export const useExpensiveCalculation = (calculateFn, dependencies) => {
  return useMemo(() => {
    if (__DEV__) {
      const start = Date.now();
      const result = calculateFn();
      const time = Date.now() - start;
      if (time > 10) {
        console.log(`🧮 Expensive calculation took ${time}ms`);
      }
      return result;
    }
    return calculateFn();
  }, dependencies);
};

/**
 * 이미지 크기 최적화
 */
export const getOptimizedImageSize = (originalWidth, originalHeight, containerWidth, containerHeight) => {
  const containerAspect = containerWidth / containerHeight;
  const imageAspect = originalWidth / originalHeight;
  
  let optimizedWidth, optimizedHeight;
  
  if (imageAspect > containerAspect) {
    // 이미지가 더 넓음 - 너비에 맞춤
    optimizedWidth = containerWidth;
    optimizedHeight = containerWidth / imageAspect;
  } else {
    // 이미지가 더 높음 - 높이에 맞춤
    optimizedHeight = containerHeight;
    optimizedWidth = containerHeight * imageAspect;
  }
  
  return {
    width: Math.round(optimizedWidth),
    height: Math.round(optimizedHeight),
    needsOptimization: optimizedWidth !== originalWidth || optimizedHeight !== originalHeight
  };
};

/**
 * 배치 업데이트 최적화
 */
export const createBatchUpdater = (updateFn, delay = 100) => {
  let timeoutId = null;
  const pendingUpdates = [];
  
  return (update) => {
    pendingUpdates.push(update);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      const updates = [...pendingUpdates];
      pendingUpdates.length = 0;
      updateFn(updates);
    }, delay);
  };
};