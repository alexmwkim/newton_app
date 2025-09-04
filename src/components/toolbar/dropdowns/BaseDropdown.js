import React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🏗️ 공통 드롭다운 기반 컴포넌트
export const BaseDropdown = ({
  title,
  children,
  layout = 'list',
  scrollable = true,
  maxHeight = 400,
  style = {},
  animated = true,
  animationValue
}) => {
  console.log('🎯 BaseDropdown: rendering with props:', { title, animated, animationValue, layout });
  const insets = useSafeAreaInsets();
  
  const containerStyle = {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxHeight: maxHeight,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: insets.bottom + 16,
    ...style
  };

  const titleStyle = {
    fontSize: 13,
    fontFamily: 'Avenir Next',
    fontWeight: '500',
    color: '#666666',
    marginBottom: 16,
    textAlign: 'left'
  };

  const contentContainerStyle = {
    flexGrow: 1,
    ...(layout === 'grid-2col' && {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between'
    })
  };

  const Content = () => (
    <View style={containerStyle}>
      {/* 제목 */}
      {title && <Text style={titleStyle}>{title}</Text>}
      
      {/* 콘텐츠 영역 */}
      {scrollable ? (
        <ScrollView
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentContainerStyle}>
          {children}
        </View>
      )}
    </View>
  );

  // 애니메이션이 활성화된 경우
  if (animated && animationValue) {
    return (
      <Animated.View
        style={[
          containerStyle,
          {
            opacity: animationValue,
            transform: [
              {
                translateY: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }
            ]
          }
        ]}
      >
        {/* 제목 */}
        {title && <Text style={titleStyle}>{title}</Text>}
        
        {/* 콘텐츠 영역 */}
        {scrollable ? (
          <ScrollView
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={contentContainerStyle}>
            {children}
          </View>
        )}
      </Animated.View>
    );
  }

  // 일반 렌더링
  return <Content />;
};