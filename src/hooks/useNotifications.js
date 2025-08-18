/**
 * 노티피케이션 커스텀 훅
 * 컴포넌트에서 노티피케이션 기능을 쉽게 사용할 수 있도록 하는 훅
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useNotificationStore } from '../store/NotificationStore';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notifications';

/**
 * 메인 노티피케이션 훅
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    isInitialized,
    settings,
    hasMore,
    initialize,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
    reset
  } = useNotificationStore();

  // 자동 초기화
  useEffect(() => {
    if (user?.id && !isInitialized) {
      console.log('🚀 Auto-initializing notifications for user:', user.id);
      initialize(user.id);
    }
  }, [user?.id, isInitialized, initialize]);

  // 사용자 변경 시 리셋
  useEffect(() => {
    return () => {
      if (!user?.id && isInitialized) {
        console.log('🔄 Resetting notifications due to user logout');
        reset();
      }
    };
  }, [user?.id, isInitialized, reset]);

  // 더 많은 알림 로드
  const loadMore = useCallback(async () => {
    if (!user?.id || isLoading || !hasMore) return;
    
    return await loadNotifications(user.id, false);
  }, [user?.id, isLoading, hasMore, loadNotifications]);

  // 새로고침
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    return await refresh(user.id);
  }, [user?.id, refresh]);

  // 알림 읽음 처리
  const handleMarkAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return;
    
    return await markAsRead(notificationId, user.id);
  }, [user?.id, markAsRead]);

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    return await markAllAsRead(user.id);
  }, [user?.id, markAllAsRead]);

  // 알림 삭제
  const handleDeleteNotification = useCallback(async (notificationId) => {
    if (!user?.id) return;
    
    return await deleteNotification(notificationId, user.id);
  }, [user?.id, deleteNotification]);

  // 모든 알림 삭제
  const handleDeleteAllNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    return await deleteAllNotifications(user.id);
  }, [user?.id, deleteAllNotifications]);

  // 읽지 않은 알림 수 업데이트
  const updateUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    return await loadUnreadCount(user.id);
  }, [user?.id, loadUnreadCount]);

  // 메모이제이션된 값들
  const unreadNotifications = useMemo(() => 
    notifications.filter(notif => !notif.is_read), 
    [notifications]
  );

  const hasUnread = useMemo(() => 
    unreadCount > 0, 
    [unreadCount]
  );

  const notificationsByType = useMemo(() => {
    const byType = {};
    notifications.forEach(notif => {
      if (!byType[notif.type]) {
        byType[notif.type] = [];
      }
      byType[notif.type].push(notif);
    });
    return byType;
  }, [notifications]);

  return {
    // 상태
    notifications,
    unreadNotifications,
    unreadCount,
    hasUnread,
    isLoading,
    isInitialized,
    hasMore,
    settings,
    notificationsByType,

    // 액션
    loadMore,
    refresh: refreshNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    deleteAllNotifications: handleDeleteAllNotifications,
    updateUnreadCount,

    // 유틸리티
    getNotificationById: (id) => notifications.find(n => n.id === id),
    isNotificationRead: (id) => {
      const notif = notifications.find(n => n.id === id);
      return notif ? notif.is_read : false;
    }
  };
};

/**
 * 특정 타입의 노티피케이션만 다루는 훅
 */
export const useNotificationsByType = (type) => {
  const { notifications, notificationsByType, ...rest } = useNotifications();
  
  const typeNotifications = useMemo(() => 
    notificationsByType[type] || [], 
    [notificationsByType, type]
  );

  const unreadTypeCount = useMemo(() => 
    typeNotifications.filter(notif => !notif.is_read).length,
    [typeNotifications]
  );

  return {
    ...rest,
    notifications: typeNotifications,
    unreadCount: unreadTypeCount,
    hasUnread: unreadTypeCount > 0
  };
};

/**
 * 노티피케이션 생성을 위한 훅
 */
export const useCreateNotification = () => {
  const { user } = useAuth();

  const createStarNotification = useCallback(async (noteId, noteOwnerId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    return await notificationService.createStarNotification(
      noteId,
      user.id,
      noteOwnerId
    );
  }, [user?.id]);

  const createFollowNotification = useCallback(async (followedUserId) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    return await notificationService.createFollowNotification(
      user.id,
      followedUserId
    );
  }, [user?.id]);

  const createCustomNotification = useCallback(async (notificationData) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    return await notificationService.createNotification({
      senderId: user.id,
      ...notificationData
    });
  }, [user?.id]);

  return {
    createStarNotification,
    createFollowNotification,
    createCustomNotification
  };
};

/**
 * 노티피케이션 설정을 위한 훅
 */
export const useNotificationSettings = () => {
  const { user } = useAuth();
  const { settings, updateSettings, loadSettings } = useNotificationStore();

  // 설정 로드
  const loadUserSettings = useCallback(async () => {
    if (!user?.id) return;
    
    return await loadSettings(user.id);
  }, [user?.id, loadSettings]);

  // 설정 업데이트
  const updateUserSettings = useCallback(async (newSettings) => {
    if (!user?.id) return;
    
    return await updateSettings(user.id, newSettings);
  }, [user?.id, updateSettings]);

  // 특정 타입 알림 토글
  const toggleNotificationType = useCallback(async (type, enabled) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      notification_types: {
        ...settings.notification_types,
        [type]: enabled
      }
    };
    
    return await updateUserSettings(newSettings);
  }, [settings, updateUserSettings]);

  // 푸시 알림 토글
  const togglePushNotifications = useCallback(async (enabled) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      push_notifications: enabled
    };
    
    return await updateUserSettings(newSettings);
  }, [settings, updateUserSettings]);

  // 이메일 알림 토글
  const toggleEmailNotifications = useCallback(async (enabled) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      email_notifications: enabled
    };
    
    return await updateUserSettings(newSettings);
  }, [settings, updateUserSettings]);

  return {
    settings,
    loadSettings: loadUserSettings,
    updateSettings: updateUserSettings,
    toggleNotificationType,
    togglePushNotifications,
    toggleEmailNotifications,
    
    // 편의 함수들
    isNotificationTypeEnabled: (type) => 
      settings?.notification_types?.[type] ?? true,
    isPushEnabled: () => 
      settings?.push_notifications ?? true,
    isEmailEnabled: () => 
      settings?.email_notifications ?? true
  };
};

/**
 * 실시간 노티피케이션 처리를 위한 훅
 */
export const useRealtimeNotifications = (onNewNotification) => {
  const { user } = useAuth();
  const { isInitialized, startRealtimeSubscription, stopRealtimeSubscription } = useNotificationStore();

  useEffect(() => {
    if (!user?.id || !isInitialized) return;

    // 실시간 알림 콜백 등록
    if (onNewNotification && typeof global !== 'undefined') {
      if (!global.notificationCallbacks) {
        global.notificationCallbacks = [];
      }
      
      global.notificationCallbacks.push(onNewNotification);
      
      return () => {
        if (global.notificationCallbacks) {
          const index = global.notificationCallbacks.indexOf(onNewNotification);
          if (index > -1) {
            global.notificationCallbacks.splice(index, 1);
          }
        }
      };
    }
  }, [user?.id, isInitialized, onNewNotification]);

  return {
    isSubscribed: isInitialized,
    startSubscription: () => startRealtimeSubscription(user?.id),
    stopSubscription: stopRealtimeSubscription
  };
};