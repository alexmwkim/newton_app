/**
 * EmptySearchState - 검색 결과 없음 상태 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const EmptySearchState = ({ 
  title = "No results found",
  subtitle = "Try searching with different keywords",
  icon = "search"
}) => (
  <View style={styles.emptyState}>
    <Icon name={icon} size={48} color={Colors.secondaryText} />
    <Text style={styles.emptyStateText}>{title}</Text>
    <Text style={styles.emptyStateSubtext}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginTop: Layout.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
  },
});

export default EmptySearchState;