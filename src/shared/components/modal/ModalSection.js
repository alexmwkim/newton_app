/**
 * ModalSection - 모달 내의 섹션 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

const ModalSection = ({ title, children, showDivider = false }) => (
  <View style={styles.section}>
    {title && (
      <Text style={styles.sectionTitle}>{title}</Text>
    )}
    {children}
    {showDivider && <View style={styles.divider} />}
  </View>
);

const styles = StyleSheet.create({
  section: {
    paddingVertical: 12,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondaryText,
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
    marginVertical: 8,
    marginTop: 12,
  },
});

export default ModalSection;