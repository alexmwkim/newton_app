/**
 * SearchChip - 검색 칩 컴포넌트
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const SearchChip = ({ 
  text, 
  onPress, 
  icon = "trending-up",
  style 
}) => (
  <TouchableOpacity style={[styles.chip, style]} onPress={onPress}>
    <Icon name={icon} size={16} color={Colors.secondaryText} />
    <Text style={styles.chipText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
    marginBottom: Layout.spacing.sm,
  },
  chipText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginLeft: Layout.spacing.xs,
  },
});

export default SearchChip;