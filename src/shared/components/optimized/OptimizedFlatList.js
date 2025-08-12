/**
 * OptimizedFlatList - 성능 최적화된 FlatList 컴포넌트
 * React Native FlatList의 성능을 극대화하는 최적화 설정
 */

import React, { memo, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';

const OptimizedFlatList = memo(({
  data,
  renderItem,
  keyExtractor,
  
  // 성능 최적화 Props
  itemHeight = null,           // 고정 높이 아이템용 (성능 최대화)
  estimatedItemSize = 100,     // 가변 높이 아이템용 추정 크기
  initialNumToRender = 15,     // 초기 렌더링 수 (기본 10 → 15)
  maxToRenderPerBatch = 8,     // 배치당 렌더링 수 (기본 10 → 8)
  windowSize = 8,              // 렌더링 윈도우 크기 (기본 21 → 8)
  updateCellsBatchingPeriod = 50, // 업데이트 배칭 주기 (ms)
  removeClippedSubviews = true,   // 화면 밖 컴포넌트 제거
  
  // 추가 최적화 Props
  enableVirtualization = true,  // 가상화 활성화
  optimizeForMemory = false,    // 메모리 최적화 모드 (더 적은 아이템 렌더링)
  scrollEventThrottle = 16,     // 스크롤 이벤트 스로틀링 (60fps)
  
  // 기본 FlatList Props
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  refreshControl,
  onScroll,
  contentContainerStyle,
  style,
  ...otherProps
}) => {
  // 아이템 레이아웃 최적화 (고정 높이일 때)
  const getItemLayout = useCallback((data, index) => {
    if (!itemHeight) return undefined;
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  }, [itemHeight]);

  // 성능 최적화 설정 계산
  const optimizedProps = useMemo(() => {
    const baseProps = {
      initialNumToRender: optimizeForMemory ? 10 : initialNumToRender,
      maxToRenderPerBatch: optimizeForMemory ? 5 : maxToRenderPerBatch,
      windowSize: optimizeForMemory ? 5 : windowSize,
      updateCellsBatchingPeriod,
      removeClippedSubviews: enableVirtualization ? removeClippedSubviews : false,
      scrollEventThrottle,
      onEndReachedThreshold,
      // 성능 최적화를 위한 추가 Props
      legacyImplementation: false,
      disableVirtualization: !enableVirtualization,
    };

    // 고정 높이 아이템의 경우 getItemLayout 추가
    if (itemHeight) {
      baseProps.getItemLayout = getItemLayout;
    }

    return baseProps;
  }, [
    itemHeight,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    updateCellsBatchingPeriod,
    removeClippedSubviews,
    enableVirtualization,
    optimizeForMemory,
    scrollEventThrottle,
    onEndReachedThreshold,
    getItemLayout
  ]);

  // 키 추출기 최적화
  const optimizedKeyExtractor = useCallback((item, index) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    // 기본 키 추출 로직
    return item.id?.toString() || item.key?.toString() || index.toString();
  }, [keyExtractor]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={optimizedKeyExtractor}
      onEndReached={onEndReached}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={refreshControl}
      onScroll={onScroll}
      contentContainerStyle={contentContainerStyle}
      style={style}
      {...optimizedProps}
      {...otherProps}
    />
  );
});

// 사전 정의된 최적화 프리셋
export const FlatListPresets = {
  // 사용자 리스트 (아바타 + 텍스트)
  userList: {
    itemHeight: 72,
    initialNumToRender: 20,
    maxToRenderPerBatch: 10,
    windowSize: 10,
  },
  
  // 노트 카드 리스트 (가변 높이)
  noteList: {
    estimatedItemSize: 120,
    initialNumToRender: 12,
    maxToRenderPerBatch: 6,
    windowSize: 8,
  },
  
  // 작은 아이템 리스트 (태그, 카테고리 등)
  smallItemList: {
    itemHeight: 44,
    initialNumToRender: 25,
    maxToRenderPerBatch: 12,
    windowSize: 12,
  },
  
  // 메모리 제약이 있는 환경용
  memoryOptimized: {
    optimizeForMemory: true,
    initialNumToRender: 8,
    maxToRenderPerBatch: 4,
    windowSize: 4,
  },
};

OptimizedFlatList.displayName = 'OptimizedFlatList';

export default OptimizedFlatList;