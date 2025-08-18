/**
 * 노티피케이션 전용 Zustand 스토어
 * 기존 SocialStore와 분리하여 알림 기능만 전담
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notifications';

export const useNotificationStore = create()(
  persist(
    (set, get) => ({
      // 상태
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isInitialized: false,
      settings: null,
      
      // 페이지네이션
      hasMore: true,
      currentPage: 0,
      pageSize: 20,
      
      // 실시간 구독 상태
      isSubscribed: false,
      subscriptionUserId: null,

      // 초기화
      initialize: async (userId) => {
        if (get().isInitialized && get().subscriptionUserId === userId) {
          console.log('📱 NotificationStore already initialized for user:', userId);
          return { success: true };
        }

        try {
          console.log('🚀 Initializing NotificationStore for user:', userId);
          set({ isLoading: true });

          // 서비스 초기화
          const initResult = await notificationService.initialize(userId);
          
          // 안전한 결과 확인
          if (!initResult || typeof initResult !== 'object') {
            console.error('❌ NotificationService.initialize returned invalid result:', initResult);
            throw new Error('NotificationService initialization returned invalid result');
          }
          
          if (!initResult.success) {
            throw new Error(initResult.error || 'NotificationService initialization failed');
          }

          // 초기 데이터 로드
          await get().loadNotifications(userId, true);
          await get().loadUnreadCount(userId);
          await get().loadSettings(userId);

          // 실시간 구독 시작
          await get().startRealtimeSubscription(userId);

          set({ 
            isInitialized: true,
            subscriptionUserId: userId,
            isLoading: false
          });

          console.log('✅ NotificationStore initialized successfully');
          return { success: true };
        } catch (error) {
          console.error('❌ NotificationStore initialization failed:', error);
          console.error('   Error details:', error);
          
          set({ 
            isLoading: false,
            isInitialized: false 
          });
          
          return { 
            success: false, 
            error: error?.message || 'Unknown initialization error'
          };
        }
      },

      // 노티피케이션 목록 로드
      loadNotifications: async (userId, refresh = false) => {
        try {
          const { currentPage, pageSize, hasMore } = get();
          
          if (!refresh && !hasMore) {
            console.log('📱 No more notifications to load');
            return { success: true };
          }

          const page = refresh ? 0 : currentPage;
          const offset = page * pageSize;

          console.log(`📱 Loading notifications: page=${page}, offset=${offset}, refresh=${refresh}`);

          const result = await notificationService.getUserNotifications(
            userId, 
            pageSize, 
            offset
          );

          // 안전한 결과 확인
          if (!result || typeof result !== 'object') {
            console.error('❌ getUserNotifications returned invalid result:', result);
            throw new Error('getUserNotifications returned invalid result');
          }

          if (!result.success) {
            console.error('❌ Failed to load notifications:', result.error);
            
            // 네트워크 오류인 경우 더 구체적인 처리
            if (result.error && result.error.includes('Network connection failed')) {
              set({ isLoading: false });
              return { 
                success: false, 
                error: 'Network connection failed. Please check your internet connection and try again.',
                isNetworkError: true 
              };
            }
            
            throw new Error(result.error);
          }

          const newNotifications = result.data || [];
          
          set(state => {
            let allNotifications;
            if (refresh) {
              allNotifications = newNotifications;
            } else {
              allNotifications = [...state.notifications, ...newNotifications];
            }
            
            // 중복 제거 - ID 기준으로 unique notifications만 유지
            const uniqueNotifications = allNotifications.filter((notification, index, self) => 
              index === self.findIndex(n => n.id === notification.id)
            );
            
            console.log(`📱 Loaded ${newNotifications.length} new, ${uniqueNotifications.length} total unique notifications`);
            
            return {
              notifications: uniqueNotifications,
              currentPage: page + 1,
              hasMore: newNotifications.length === pageSize,
              isLoading: false
            };
          });

          console.log(`✅ Loaded ${newNotifications.length} notifications`);
          return { success: true, data: newNotifications };
        } catch (error) {
          console.error('❌ Failed to load notifications:', error);
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // 읽지 않은 알림 수 로드
      loadUnreadCount: async (userId) => {
        try {
          const result = await notificationService.getUnreadCount(userId);
          
          // 안전한 결과 확인
          if (!result || typeof result !== 'object') {
            console.error('❌ getUnreadCount returned invalid result:', result);
            return { success: false, error: 'getUnreadCount returned invalid result' };
          }
          
          if (result.success) {
            set({ unreadCount: result.count || 0 });
            console.log(`📊 Unread count: ${result.count || 0}`);
          }
          
          return result;
        } catch (error) {
          console.error('❌ Failed to load unread count:', error);
          return { success: false, error: error.message };
        }
      },

      // 알림 설정 로드
      loadSettings: async (userId) => {
        try {
          const settings = await notificationService.getUserNotificationSettings(userId);
          set({ settings });
          return { success: true, data: settings };
        } catch (error) {
          console.error('❌ Failed to load notification settings:', error);
          return { success: false, error: error.message };
        }
      },

      // 알림 설정 업데이트
      updateSettings: async (userId, newSettings) => {
        try {
          const result = await notificationService.updateNotificationSettings(userId, newSettings);
          
          if (result.success) {
            set({ settings: result.data });
          }
          
          return result;
        } catch (error) {
          console.error('❌ Failed to update notification settings:', error);
          return { success: false, error: error.message };
        }
      },

      // 알림 읽음 표시
      markAsRead: async (notificationId, userId) => {
        try {
          // 낙관적 업데이트
          set(state => ({
            notifications: state.notifications.map(notif =>
              notif.id === notificationId 
                ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                : notif
            ),
            unreadCount: Math.max(state.unreadCount - 1, 0)
          }));

          const result = await notificationService.markAsRead(notificationId, userId);
          
          if (!result.success) {
            // 롤백
            set(state => ({
              notifications: state.notifications.map(notif =>
                notif.id === notificationId 
                  ? { ...notif, is_read: false, read_at: null }
                  : notif
              ),
              unreadCount: state.unreadCount + 1
            }));
            throw new Error(result.error);
          }

          return result;
        } catch (error) {
          console.error('❌ Failed to mark notification as read:', error);
          return { success: false, error: error.message };
        }
      },

      // 모든 알림 읽음 표시
      markAllAsRead: async (userId) => {
        try {
          // 낙관적 업데이트
          const originalNotifications = get().notifications;
          const originalUnreadCount = get().unreadCount;

          set(state => ({
            notifications: state.notifications.map(notif => ({
              ...notif,
              is_read: true,
              read_at: notif.is_read ? notif.read_at : new Date().toISOString()
            })),
            unreadCount: 0
          }));

          const result = await notificationService.markAllAsRead(userId);
          
          if (!result.success) {
            // 롤백
            set({
              notifications: originalNotifications,
              unreadCount: originalUnreadCount
            });
            throw new Error(result.error);
          }

          return result;
        } catch (error) {
          console.error('❌ Failed to mark all notifications as read:', error);
          return { success: false, error: error.message };
        }
      },

      // 알림 삭제
      deleteNotification: async (notificationId, userId) => {
        try {
          // 낙관적 업데이트
          const originalNotifications = get().notifications;
          const deletedNotification = originalNotifications.find(n => n.id === notificationId);
          
          set(state => ({
            notifications: state.notifications.filter(notif => notif.id !== notificationId),
            unreadCount: deletedNotification && !deletedNotification.is_read 
              ? Math.max(state.unreadCount - 1, 0)
              : state.unreadCount
          }));

          const result = await notificationService.deleteNotification(notificationId, userId);
          
          if (!result.success) {
            // 롤백
            set({ notifications: originalNotifications });
            throw new Error(result.error);
          }

          return result;
        } catch (error) {
          console.error('❌ Failed to delete notification:', error);
          return { success: false, error: error.message };
        }
      },

      // 모든 알림 삭제
      deleteAllNotifications: async (userId) => {
        try {
          // 낙관적 업데이트
          const originalNotifications = get().notifications;
          const originalUnreadCount = get().unreadCount;

          set({
            notifications: [],
            unreadCount: 0
          });

          const result = await notificationService.deleteAllNotifications(userId);
          
          if (!result.success) {
            // 롤백
            set({
              notifications: originalNotifications,
              unreadCount: originalUnreadCount
            });
            throw new Error(result.error);
          }

          console.log(`🗑️ Deleted ${result.deletedCount} notifications`);
          return result;
        } catch (error) {
          console.error('❌ Failed to delete all notifications:', error);
          return { success: false, error: error.message };
        }
      },

      // 새 알림 추가 (실시간)
      addNotification: (notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
        
        console.log('🔔 New notification added:', notification);
      },

      // 실시간 구독 시작
      startRealtimeSubscription: async (userId) => {
        try {
          if (get().isSubscribed && get().subscriptionUserId === userId) {
            console.log('📡 Already subscribed to notifications for user:', userId);
            return { success: true };
          }

          console.log('📡 Starting realtime notification subscription...');

          // 전역 콜백 등록 (중복 방지)
          if (typeof global !== 'undefined') {
            if (!global.notificationCallbacks) {
              global.notificationCallbacks = [];
              console.log('🚀 Initialized global notification callbacks array');
            }
            
            // 기존 콜백 제거 (중복 방지)
            global.notificationCallbacks = global.notificationCallbacks.filter(
              cb => cb.name !== 'notificationStoreCallback'
            );
            
            const callback = (notification) => {
              console.log('📨 Global callback received notification:', notification);
              get().addNotification(notification);
            };
            callback.name = 'notificationStoreCallback'; // 식별을 위한 이름 추가
            
            global.notificationCallbacks.push(callback);
            console.log(`📡 Registered notification callback. Total callbacks: ${global.notificationCallbacks.length}`);
          }

          // 서비스에서 실시간 구독 시작
          const result = await notificationService.startRealtimeSubscriptions(userId);
          
          if (result.success) {
            set({ 
              isSubscribed: true,
              subscriptionUserId: userId
            });
          }
          
          return result;
        } catch (error) {
          console.error('❌ Failed to start realtime subscription:', error);
          return { success: false, error: error.message };
        }
      },

      // 실시간 구독 중지
      stopRealtimeSubscription: async () => {
        try {
          const { subscriptionUserId } = get();
          
          if (subscriptionUserId) {
            await notificationService.stopRealtimeSubscriptions(subscriptionUserId);
          }

          // 전역 콜백 정리
          if (typeof global !== 'undefined' && global.notificationCallbacks) {
            // 특정 콜백만 제거 (다른 컴포넌트의 콜백은 유지)
            global.notificationCallbacks = global.notificationCallbacks.filter(
              cb => cb.name !== 'notificationStoreCallback'
            );
            console.log(`🧹 Cleaned up notification callbacks. Remaining: ${global.notificationCallbacks.length}`);
          }

          set({ 
            isSubscribed: false,
            subscriptionUserId: null
          });

          console.log('📡 Realtime subscription stopped');
          return { success: true };
        } catch (error) {
          console.error('❌ Failed to stop realtime subscription:', error);
          return { success: false, error: error.message };
        }
      },

      // 새로고침
      refresh: async (userId) => {
        try {
          set({ isLoading: true, currentPage: 0, hasMore: true });
          
          await Promise.all([
            get().loadNotifications(userId, true),
            get().loadUnreadCount(userId)
          ]);
          
          return { success: true };
        } catch (error) {
          console.error('❌ Failed to refresh notifications:', error);
          return { success: false, error: error.message };
        }
      },

      // 상태 초기화
      reset: async () => {
        try {
          await get().stopRealtimeSubscription();
          
          set({
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            isInitialized: false,
            settings: null,
            hasMore: true,
            currentPage: 0,
            isSubscribed: false,
            subscriptionUserId: null
          });

          console.log('🔄 NotificationStore reset');
          return { success: true };
        } catch (error) {
          console.error('❌ Failed to reset NotificationStore:', error);
          return { success: false, error: error.message };
        }
      },

      // 유틸리티 함수들
      getNotificationById: (notificationId) => {
        return get().notifications.find(notif => notif.id === notificationId);
      },

      getUnreadNotifications: () => {
        return get().notifications.filter(notif => !notif.is_read);
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter(notif => notif.type === type);
      },

      hasUnreadNotifications: () => {
        return get().unreadCount > 0;
      }
    }),
    {
      name: 'notification-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      // 실시간 데이터는 지속화하지 않음
      partialize: (state) => ({
        settings: state.settings,
        // notifications와 unreadCount는 새로고침 시마다 서버에서 최신 데이터를 가져옴
      }),
    }
  )
);