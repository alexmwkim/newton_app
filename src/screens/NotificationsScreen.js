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

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    markAllAsRead,
    hasUnread
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

  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.textBlack} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      {hasUnread && (
        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          style={styles.markAllButton}
        >
          <Text style={styles.markAllText}>Mark All Read</Text>
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

  // Key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textBlack,
    ...Typography.title,
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