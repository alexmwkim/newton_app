/**
 * NotificationsScreen
 * Display and manage all user notifications
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from '../components/NotificationItem';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { ScreenContainer, UnifiedHeader } from '../shared/components/layout';

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    markAllAsRead,
    hasUnread,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();

  // Refresh when screen focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('📱 NotificationsScreen focused, refreshing...');
      refresh();
    });

    return unsubscribe;
  }, [navigation, refresh]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Refreshing notifications...');
    await refresh();
  }, [refresh]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      console.log('📄 Loading more notifications...');
      await loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  // Mark all as read handler
  const handleMarkAllAsRead = useCallback(async () => {
    if (!hasUnread) return;

    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await markAllAsRead();
            if (!result.success) {
              Alert.alert('Error', 'Failed to mark notifications as read.');
            }
          },
        },
      ]
    );
  }, [hasUnread, markAllAsRead]);

  // Delete all notifications handler
  const handleDeleteAll = useCallback(async () => {
    if (notifications.length === 0) return;

    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Starting bulk delete of all notifications');
              
              const result = await deleteAllNotifications();
              
              if (result?.success) {
                console.log(`✅ Successfully deleted ${result.deletedCount} notifications`);
                
                // Refresh the list
                console.log('🔄 Refreshing notifications list...');
                await refresh();
                
                // Show success message
                if (result.deletedCount > 0) {
                  Alert.alert('Success', `Deleted ${result.deletedCount} notifications.`);
                } else {
                  Alert.alert('Info', 'No notifications to delete.');
                }
              } else {
                console.error('❌ Failed to delete notifications:', result?.error);
                Alert.alert('Error', result?.error || 'Failed to delete all notifications.');
              }
            } catch (error) {
              console.error('❌ Error deleting all notifications:', error);
              Alert.alert('Error', 'Failed to delete all notifications.');
            }
          },
        },
      ]
    );
  }, [notifications, deleteAllNotifications, refresh]);

  // 우측 헤더 버튼들 렌더링
  const renderRightComponent = () => (
    <View style={styles.rightButtonsContainer}>
      {hasUnread && (
        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          style={styles.markAllButton}
        >
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      )}
      
      {notifications.length > 0 && (
        <TouchableOpacity
          onPress={handleDeleteAll}
          style={styles.deleteAllButton}
        >
          <Icon name="trash-2" size={20} color={Colors.danger} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bell-off" size={64} color={Colors.lightGray} />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        New stars and follows will appear here
      </Text>
    </View>
  );

  // Footer loading component
  const renderFooter = () => {
    if (!isLoading || notifications.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  // Notification item renderer
  const renderNotificationItem = useCallback(({ item, index }) => (
    <NotificationItem
      notification={item}
      onPress={() => {
        // Navigate to related screen when notification clicked
        console.log('Notification pressed:', item);
        // TODO: Implement navigation logic based on notification type
      }}
    />
  ), []);

  // Key extractor - use index as fallback for duplicate IDs
  const keyExtractor = useCallback((item, index) => {
    return item.id ? `${item.id}_${index}` : `notification_${index}`;
  }, []);

  return (
    <ScreenContainer noPadding>
      <UnifiedHeader
        title="Notifications"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={renderRightComponent()}
      />
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && notifications.length === 0}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  // 기본 컨테이너 스타일 (ScreenContainer로 대체되었지만 호환성 유지)
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // UnifiedHeader에서 사용하는 커스텀 버튼 스타일들
  rightButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  deleteAllButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textBlack,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.secondaryText,
  },
});

export default NotificationsScreen;