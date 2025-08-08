import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const NotificationsScreen = ({ navigation }) => {
  // Mock notification data - empty for now to show empty state
  const [notifications, setNotifications] = useState([]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleMorePress = () => {
    console.log('More options pressed');
    // TODO: Show notification settings or options
  };

  const handleCreateNote = () => {
    console.log('Create note pressed');
    navigation.navigate('createNote');
  };

  // Empty state component with Newton's hand-written style
  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      {/* Hand-drawn style swirl icon inspired by Newton logo */}
      <View style={styles.emptyStateIcon}>
        <Text style={styles.emptyStateSwirl}>∽</Text>
      </View>
      
      <Text style={styles.emptyStateTitle}>All caught up!</Text>
      <Text style={styles.emptyStateSubtitle}>Ready to make good new days</Text>
      
      <Text style={styles.emptyStateDescription}>
        Notifications about your notes, mentions, and followers will appear here
      </Text>
      
      {/* Optional call-to-action */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreateNote}>
        <Icon name="plus" size={16} color={Colors.mainBackground} />
        <Text style={styles.createButtonText}>Create New Note</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="arrow-left" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
            <Icon name="more-horizontal" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            // TODO: Render notifications list when we have data
            <View style={styles.notificationsList}>
              {notifications.map((notification, index) => (
                <View key={index} style={styles.notificationItem}>
                  {/* Notification item content */}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.mainBackground,
  },
  content: {
    flex: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // 단순한 아이콘 스타일 - 배경이나 테두리 없음
  },
  headerTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    letterSpacing: -0.3,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.screen.padding,
  },
  
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xxl,
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    borderRadius: 40,
    marginBottom: Layout.spacing.xl,
  },
  emptyStateSwirl: {
    fontSize: 40,
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.primary,
    transform: [{ rotate: '15deg' }],
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: 25,
    gap: Layout.spacing.xs,
  },
  createButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.mainBackground,
  },
  
  // Future: Notifications List Styles
  notificationsList: {
    paddingTop: Layout.spacing.md,
  },
  notificationItem: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default NotificationsScreen;