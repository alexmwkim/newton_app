/**
 * ScreenContainer
 * 모든 화면의 기본 컨테이너 - 일관된 패딩과 SafeArea 처리
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import Layout from '../../../constants/Layout';
import { Spacing } from '../../../constants/StyleControl';

const ScreenContainer = ({ 
  children, 
  noPadding = false,
  hasHeader = false,
  backgroundColor = Colors.background,
  style,
  ...props 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor,
          paddingTop: hasHeader ? insets.top : insets.top, // SafeArea만 적용, 헤더에서 추가 간격 처리
          paddingBottom: insets.bottom 
        },
        !noPadding && styles.withPadding,
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  withPadding: {
    paddingHorizontal: 20, // NoteDetail 기준 20px로 통일
  },
});

export default ScreenContainer;