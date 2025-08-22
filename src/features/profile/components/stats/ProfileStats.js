import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';
import { Spacing } from '../../../../constants/StyleControl';

/**
 * 개별 통계 항목 컴포넌트
 */
const StatItem = ({ label, count, onPress, isInteractive = false }) => (
  <TouchableOpacity 
    style={[styles.statItem, !isInteractive && styles.statItemDisabled]}
    onPress={isInteractive ? onPress : undefined}
    activeOpacity={isInteractive ? 0.7 : 1}
    disabled={!isInteractive}
  >
    <Text style={styles.statCount}>
      {typeof count === 'number' ? count.toLocaleString() : count}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

/**
 * 프로필 통계 컴포넌트
 * - Notes, Stars, Followers, Following 수치 표시
 */
const ProfileStats = ({
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
  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <StatItem
          label="Notes"
          count={notesCount}
          onPress={onNotesPress}
          isInteractive={!!onNotesPress}
        />
        
        <StatItem
          label="Stars"
          count={starsCount}
          onPress={onStarsPress}
          isInteractive={!!onStarsPress}
        />
        
        <StatItem
          label="Followers"
          count={followersCount}
          onPress={onFollowersPress}
          isInteractive={!!onFollowersPress}
        />
        
        <StatItem
          label="Following"
          count={followingCount}
          onPress={onFollowingPress}
          isInteractive={!!onFollowingPress}
        />
      </View>
      
      {/* 구분선 */}
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen.horizontal,
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
    // 비활성 상태 스타일 (현재는 동일)
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

export default ProfileStats;