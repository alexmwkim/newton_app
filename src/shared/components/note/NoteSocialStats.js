/**
 * NoteSocialStats - 노트 소셜 통계 표시 컴포넌트
 * 별표, 포크, 가시성 등의 정보를 표시
 */

import React from 'react';
import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

// 개별 통계 아이템
const StatItem = memo(({ icon, count, color = Colors.secondaryText }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={14} color={color} />
    <Text style={[styles.statText, { color }]}>{count || 0}</Text>
  </View>
));

// 포크 배지
const ForkBadge = memo(() => (
  <View style={styles.forkBadge}>
    <Icon name="git-branch" size={12} color={Colors.orange} />
    <Text style={styles.forkBadgeText}>포크됨</Text>
  </View>
));

// 가시성 배지
const VisibilityBadge = memo(({ isPublic }) => {
  const badgeStyle = [
    styles.visibilityBadge,
    isPublic ? styles.publicBadge : styles.privateBadge
  ];
  
  const textStyle = [
    styles.visibilityText,
    isPublic ? styles.publicText : styles.privateText
  ];

  return (
    <View style={badgeStyle}>
      <Icon
        name={isPublic ? "globe" : "lock"}
        size={12}
        color={isPublic ? Colors.green : Colors.secondaryText}
      />
      <Text style={textStyle}>
        {isPublic ? '공개' : '비공개'}
      </Text>
    </View>
  );
});

const NoteSocialStats = memo(({
  starCount = 0,
  forkCount = 0,
  isPublic = false,
  isForked = false,
  showVisibility = true,
  layout = 'horizontal', // 'horizontal' | 'vertical'
  style
}) => {
  const containerStyle = [
    styles.container,
    layout === 'vertical' && styles.verticalLayout,
    style
  ];

  return (
    <View style={containerStyle}>
      {/* 통계 영역 */}
      <View style={styles.statsSection}>
        <StatItem icon="star" count={starCount} />
        <StatItem icon="git-branch" count={forkCount} />
        
        {isForked && <ForkBadge />}
      </View>

      {/* 가시성 배지 */}
      {showVisibility && (
        <VisibilityBadge isPublic={isPublic} />
      )}
    </View>
  );
});

// 컴팩트 버전 (아이콘만)
export const CompactSocialStats = memo((props) => (
  <NoteSocialStats 
    {...props} 
    showVisibility={false}
    style={[styles.compact, props.style]}
  />
));

// 세로 레이아웃 버전
export const VerticalSocialStats = memo((props) => (
  <NoteSocialStats 
    {...props} 
    layout="vertical"
    style={[styles.verticalContainer, props.style]}
  />
));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verticalLayout: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
  },
  verticalContainer: {
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
  },
  forkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange + '20',
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  forkBadgeText: {
    fontSize: Typography.fontSize.tiny,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.orange,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  publicBadge: {
    backgroundColor: Colors.green + '20',
  },
  privateBadge: {
    backgroundColor: Colors.secondaryText + '20',
  },
  visibilityText: {
    fontSize: Typography.fontSize.tiny,
    fontFamily: Typography.fontFamily.primary,
  },
  publicText: {
    color: Colors.green,
  },
  privateText: {
    color: Colors.secondaryText,
  },
  compact: {
    gap: Layout.spacing.sm,
  },
});

StatItem.displayName = 'StatItem';
ForkBadge.displayName = 'ForkBadge';
VisibilityBadge.displayName = 'VisibilityBadge';
NoteSocialStats.displayName = 'NoteSocialStats';
CompactSocialStats.displayName = 'CompactSocialStats';
VerticalSocialStats.displayName = 'VerticalSocialStats';

export default NoteSocialStats;