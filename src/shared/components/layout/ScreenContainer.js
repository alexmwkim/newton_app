/**
 * ScreenContainer
 * 모든 화면의 기본 컨테이너 - 일관된 패딩과 SafeArea 처리
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Layout from '../../../constants/Layout';

const ScreenContainer = ({ 
  children, 
  noPadding = false,
  backgroundColor = Colors.background,
  style,
  ...props 
}) => {
  return (
    <SafeAreaView 
      style={[
        styles.container,
        { backgroundColor },
        !noPadding && styles.withPadding,
        style
      ]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  withPadding: {
    paddingHorizontal: Layout.screen.padding, // 반응형 패딩 (16-32px)
  },
});

export default ScreenContainer;