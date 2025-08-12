/**
 * CategoryFilter - 탐색 화면의 카테고리 필터 컴포넌트
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const categories = ['Trending', 'Following', 'Idea', 'Routine', 'Journal'];

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeCategory === category && styles.activeCategoryButton
            ]}
            onPress={() => onCategoryChange(category)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.activeCategoryText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: Layout.spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: Layout.screen.padding,
    gap: Layout.spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryButton: {
    backgroundColor: Colors.primaryText,
    borderColor: Colors.primaryText,
  },
  categoryText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.secondaryText,
  },
  activeCategoryText: {
    color: Colors.mainBackground,
    fontWeight: Typography.fontWeight.semibold,
  },
});

CategoryFilter.displayName = 'CategoryFilter';

export default CategoryFilter;