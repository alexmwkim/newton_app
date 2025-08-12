/**
 * SearchBar - 재사용 가능한 검색 바 컴포넌트
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = "Search...", 
  onClear,
  style 
}) => (
  <View style={[styles.searchContainer, style]}>
    <View style={styles.searchInputContainer}>
      <Icon name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Icon name="x" size={20} color={Colors.secondaryText} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  searchContainer: {
    marginVertical: Layout.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mainBackground,
    borderRadius: 8,
    paddingHorizontal: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#D4CCC2',
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
});

export default SearchBar;