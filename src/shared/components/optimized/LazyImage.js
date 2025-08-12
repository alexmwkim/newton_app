/**
 * LazyImage - 지연 로딩 이미지 컴포넌트
 * 화면에 보일 때만 이미지를 로드하여 성능 최적화
 */

import React, { memo, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
// import FastImage from 'react-native-fast-image'; // 실제 프로젝트에서는 주석 해제
import { Image as FastImage } from 'react-native'; // 임시로 기본 Image 사용
import Colors from '../../../constants/Colors';

const LazyImage = memo(({
  uri,
  style,
  placeholderStyle,
  placeholderColor = Colors.border,
  fadeDuration = 300,
  threshold = 0.1, // 화면의 몇 % 정도에서 로딩을 시작할지
  onLoad,
  onError,
  priority = 'normal',
  cache = 'immutable',
  ...imageProps
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const containerRef = useRef(null);

  // Intersection Observer 시뮬레이션 (React Native에서는 직접 구현)
  const handleLayout = useCallback(() => {
    if (shouldLoad) return;

    // 실제 구현에서는 Intersection Observer나 onScroll 이벤트로 처리
    // 여기서는 간단히 즉시 로딩하도록 설정
    setShouldLoad(true);
  }, [shouldLoad]);

  // 이미지 로딩 완료 핸들러
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    
    // 페이드 인 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: fadeDuration,
      useNativeDriver: true,
    }).start();
    
    onLoad?.();
  }, [fadeAnim, fadeDuration, onLoad]);

  // 이미지 로딩 에러 핸들러
  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
      {/* 플레이스홀더 */}
      <View
        style={[
          styles.placeholder,
          placeholderStyle,
          { backgroundColor: placeholderColor }
        ]}
      />

      {/* 실제 이미지 */}
      {shouldLoad && !hasError && (
        <Animated.View
          style={[
            styles.imageContainer,
            { opacity: fadeAnim }
          ]}
        >
          <FastImage
            source={{ 
              uri,
              // priority: FastImage.priority[priority], // react-native-fast-image 사용 시
              // cache: FastImage.cacheControl[cache],   // react-native-fast-image 사용 시
            }}
            style={StyleSheet.absoluteFill}
            onLoad={handleImageLoad}
            onError={handleImageError}
            // resizeMode={FastImage.resizeMode.cover} // react-native-fast-image 사용 시
            resizeMode="cover" // 기본 Image 사용 시
            {...imageProps}
          />
        </Animated.View>
      )}

      {/* 에러 상태 표시 */}
      {hasError && (
        <View style={[styles.errorContainer, style]}>
          <View style={styles.errorIcon} />
        </View>
      )}
    </View>
  );
});

// Progressive Image 컴포넌트 (저화질 → 고화질 순차 로딩)
export const ProgressiveImage = memo(({
  lowQualityUri,
  highQualityUri,
  style,
  ...props
}) => {
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);
  const highQualityOpacity = useRef(new Animated.Value(0)).current;

  const handleHighQualityLoad = useCallback(() => {
    setHighQualityLoaded(true);
    
    Animated.timing(highQualityOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [highQualityOpacity]);

  return (
    <View style={[styles.container, style]}>
      {/* 저화질 이미지 (빠른 로딩) */}
      <FastImage
        source={{ uri: lowQualityUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        {...props}
      />
      
      {/* 고화질 이미지 (페이드 인) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: highQualityOpacity }
        ]}
      >
        <FastImage
          source={{ uri: highQualityUri }}
          style={StyleSheet.absoluteFill}
          onLoad={handleHighQualityLoad}
          resizeMode="cover"
          {...props}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.border,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.border,
  },
  errorIcon: {
    width: 24,
    height: 24,
    backgroundColor: Colors.secondaryText,
    borderRadius: 12,
    opacity: 0.5,
  },
});

LazyImage.displayName = 'LazyImage';
ProgressiveImage.displayName = 'ProgressiveImage';

export default LazyImage;