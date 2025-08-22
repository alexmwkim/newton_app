/**
 * SettingsSection - 설정 섹션 그룹 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import { Spacing } from '../../../constants/StyleControl';

const SettingsSection = ({ title, children, style }) => (
  <View style={[styles.section, style]}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Spacing.screen.horizontal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Layout.borderRadius,
    marginHorizontal: Spacing.screen.horizontal,
  },
});

export default SettingsSection;