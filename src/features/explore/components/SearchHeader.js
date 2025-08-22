/**
 * SearchHeader - 탐색 화면의 검색 헤더 컴포넌트
 */

import React, { memo, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import { Spacing } from '../../../constants/StyleControl';

const SearchHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit, 
  isSearching,
  onClearSearch,
  searchResultsCount = 0 
}) => {
  
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
    }
  }, [searchQuery, onSearchSubmit]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
    onClearSearch?.();
  }, [onSearchChange, onClearSearch]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search notes, authors..."
            placeholderTextColor={Colors.secondaryText}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Icon name="x-circle" size={18} color={Colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
        
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSearching && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Searching...</Text>
        </View>
      )}

      {searchQuery.trim().length > 0 && !isSearching && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {searchResultsCount === 0 
              ? 'No results found' 
              : `${searchResultsCount} result${searchResultsCount === 1 ? '' : 's'} found`}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.mainBackground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    paddingHorizontal: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    paddingVertical: Layout.spacing.sm,
    minHeight: 44, // 터치하기 좋은 최소 높이
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  searchButton: {
    backgroundColor: Colors.primaryText,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: Colors.mainBackground,
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  statusContainer: {
    paddingTop: Layout.spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});

SearchHeader.displayName = 'SearchHeader';

export default SearchHeader;