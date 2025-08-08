import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';

/**
 * 최적화된 개별 통계 항목 컴포넌트
 * React.memo와 useCallback을 사용하여 불필요한 리렌더링 방지
 */
const OptimizedStatItem = memo(({ label, count, onPress, isInteractive = false }) => {
  const handlePress = useCallback(() => {
    if (isInteractive && onPress) {
      onPress();
    }
  }, [isInteractive, onPress]);

  return (
    <TouchableOpacity 
      style={[styles.statItem, !isInteractive && styles.statItemDisabled]}
      onPress={handlePress}
      activeOpacity={isInteractive ? 0.7 : 1}
      disabled={!isInteractive}
    >
      <Text style={styles.statCount}>
        {typeof count === 'number' ? count.toLocaleString() : count}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

OptimizedStatItem.displayName = 'OptimizedStatItem';

/**
 * 최적화된 프로필 통계 컴포넌트
 * 
 * 최적화 기법:
 * - React.memo로 props 변경 시에만 리렌더링
 * - useCallback으로 핸들러 메모이제이션
 * - 개별 StatItem도 메모이제이션
 */
const OptimizedProfileStats = memo(({
  notesCount = 0,
  starsCount = 0,
  followersCount = 0,
  followingCount = 0,
  onNotesPress,
  onStarsPress,
  onFollowersPress,
  onFollowingPress,
  isOwnProfile = false,
}) => {
  // 핸들러들을 메모이제이션
  const handleNotesPress = useCallback(() => {
    onNotesPress?.();
  }, [onNotesPress]);

  const handleStarsPress = useCallback(() => {
    onStarsPress?.();
  }, [onStarsPress]);

  const handleFollowersPress = useCallback(() => {
    onFollowersPress?.();
  }, [onFollowersPress]);

  const handleFollowingPress = useCallback(() => {
    onFollowingPress?.();
  }, [onFollowingPress]);

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <OptimizedStatItem
          label="Notes"
          count={notesCount}
          onPress={handleNotesPress}
          isInteractive={!!onNotesPress}
        />
        
        <OptimizedStatItem
          label="Stars"
          count={starsCount}
          onPress={handleStarsPress}
          isInteractive={!!onStarsPress}
        />
        
        <OptimizedStatItem
          label="Followers"
          count={followersCount}
          onPress={handleFollowersPress}
          isInteractive={!!onFollowersPress}
        />
        
        <OptimizedStatItem
          label="Following"
          count={followingCount}
          onPress={handleFollowingPress}
          isInteractive={!!onFollowingPress}
        />
      </View>
      
      <View style={styles.divider} />
    </View>
  );
});

OptimizedProfileStats.displayName = 'OptimizedProfileStats';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Layout.spacing.small,
    borderRadius: 8,
  },
  statItemDisabled: {
    // 비활성 상태 스타일
  },
  statCount: {
    ...Typography.heading3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Layout.spacing.medium,
    opacity: 0.3,
  },
});

export default OptimizedProfileStats;