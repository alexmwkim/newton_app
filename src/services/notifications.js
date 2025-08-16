/**
 * 노티피케이션 서비스
 * Supabase 실시간 기능을 활용한 통합 알림 시스템
 */

import { supabase } from './supabase';

// 노티피케이션 타입 정의
export const NOTIFICATION_TYPES = {
  STAR: 'star',
  FORK: 'fork', 
  FOLLOW: 'follow',
  COMMENT: 'comment',
  MENTION: 'mention',
  SYSTEM: 'system'
};

// 노티피케이션 우선순위
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal', 
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * 노티피케이션 서비스 클래스
 */
class NotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.isInitialized = false;
    this.realtimeEnabled = true; // Start assuming realtime works
    this.channelErrorCount = 0; // Track channel errors
  }

  /**
   * 서비스 초기화
   */
  async initialize(userId) {
    if (this.isInitialized) {
      console.log('🔔 NotificationService already initialized');
      return { success: true, alreadyInitialized: true };
    }
    
    try {
      console.log('🔔 Initializing NotificationService for user:', userId);
      
      // 사용자의 알림 설정 로드
      const settings = await this.getUserNotificationSettings(userId);
      
      // 실시간 구독 시작 (realtime이 활성화된 경우에만)
      if (this.realtimeEnabled) {
        await this.startRealtimeSubscriptions(userId);
      } else {
        console.log('⚠️ Realtime disabled - notifications will work without real-time updates');
      }
      
      this.isInitialized = true;
      console.log('✅ NotificationService initialized successfully');
      
      return { success: true, settings };
    } catch (error) {
      console.error('❌ NotificationService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 사용자 알림 설정 조회
   */
  async getUserNotificationSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // 데이터 없음 에러가 아닌 경우
        // 테이블이 존재하지 않는 경우 기본 설정 반환
        if (error.code === '42P01') {
          console.warn('⚠️ notification_settings table does not exist, using defaults');
          return this.getDefaultSettings(userId);
        }
        throw error;
      }

      // 기본 설정 반환 (데이터가 없는 경우)
      return data || this.getDefaultSettings(userId);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      // 테이블이 없는 경우 기본값 반환
      if (error.code === '42P01') {
        return this.getDefaultSettings(userId);
      }
      throw error;
    }
  }

  /**
   * 기본 설정 반환
   */
  getDefaultSettings(userId) {
    return {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      in_app_notifications: true,
      notification_types: {
        star: true,
        fork: true,
        follow: true,
        comment: true,
        mention: true,
        system: true
      },
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00'
      }
    };
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Notification settings updated:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to update notification settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 새 노티피케이션 생성
   */
  async createNotification({
    recipientId,
    senderId,
    type,
    title,
    message,
    data = {},
    priority = NOTIFICATION_PRIORITY.NORMAL,
    relatedNoteId = null,
    relatedUserId = null
  }) {
    try {
      // 중복 방지를 위한 고유 식별자 생성
      const uniqueId = `${type}_${senderId}_${recipientId}_${relatedNoteId || relatedUserId || ''}_${Date.now()}`;
      
      const notification = {
        id: uniqueId,
        recipient_id: recipientId,
        sender_id: senderId,
        type,
        title,
        message,
        data: JSON.stringify(data),
        priority,
        related_note_id: relatedNoteId,
        related_user_id: relatedUserId,
        is_read: false,
        created_at: new Date().toISOString()
      };

      console.log('📝 Creating notification:', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipient: notification.recipient_id,
        sender: notification.sender_id
      });

      const { data: result, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) {
        // 중복 키 에러인 경우 무시 (이미 같은 알림이 존재)
        if (error.code === '23505') {
          console.log('⚠️ Duplicate notification ignored:', uniqueId);
          return { success: true, isDuplicate: true };
        }
        throw error;
      }

      console.log('✅ Notification created:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 사용자의 노티피케이션 목록 조회
   */
  async getUserNotifications(userId, limit = 20, offset = 0, unreadOnly = false) {
    try {
      console.log(`📱 Loading notifications: page=${Math.floor(offset/limit)}, offset=${offset}, refresh=${offset === 0}`);
      
      // 먼저 간단한 쿼리로 시작 (외래 키 관계 없이)
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch notifications:', error);
        
        // 테이블이 존재하지 않는 경우
        if (error.code === '42P01') {
          console.warn('⚠️ notifications table does not exist, returning empty array');
          return { success: true, data: [] };
        }
        
        // 네트워크 오류 처리
        if (error.message && error.message.includes('Network request failed')) {
          console.error('🌐 Network connectivity issue detected');
          return { success: false, error: 'Network connection failed. Please check your internet connection.' };
        }
        
        throw error;
      }

      // 발신자 정보를 별도로 조회 (외래 키 관계 오류 방지)
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(n => n.sender_id).filter(Boolean))];
        
        if (senderIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, user_id, username, avatar_url')
            .in('user_id', senderIds);

          if (profileError) {
            console.warn('⚠️ Failed to load sender profiles:', profileError);
          }

          // 프로필 정보를 알림에 추가
          if (profiles) {
            const profileMap = {};
            profiles.forEach(profile => {
              profileMap[profile.user_id] = profile;
            });

            data.forEach(notification => {
              if (notification.sender_id && profileMap[notification.sender_id]) {
                notification.sender = profileMap[notification.sender_id];
              } else if (notification.sender_id) {
                // 프로필이 없는 경우 기본 정보 생성
                notification.sender = {
                  user_id: notification.sender_id,
                  username: `User-${notification.sender_id.substring(0, 8)}`,
                  avatar_url: null
                };
              }
            });
          }
        }
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      // 테이블이 없는 경우 빈 배열 반환
      if (error.code === '42P01') {
        return { success: true, data: [] };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 노티피케이션 읽음 표시
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('recipient_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 모든 노티피케이션 읽음 표시
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 읽지 않은 노티피케이션 수 조회
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Failed to get unread count:', error);
        
        // 테이블이 존재하지 않는 경우
        if (error.code === '42P01') {
          console.warn('⚠️ notifications table does not exist, returning count 0');
          return { success: true, count: 0 };
        }
        
        // 네트워크 오류 처리
        if (error.message && error.message.includes('Network request failed')) {
          console.error('🌐 Network connectivity issue detected');
          return { success: false, error: 'Network connection failed. Please check your internet connection.' };
        }
        
        throw error;
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      // 테이블이 없는 경우 0 반환
      if (error.code === '42P01') {
        return { success: true, count: 0 };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 노티피케이션 삭제
   */
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 테이블 realtime 상태 확인
   */
  async checkRealtimeCapability() {
    try {
      console.log('🔍 Checking notifications table realtime capability...');
      
      // 간단한 채널 테스트
      const testChannel = supabase
        .channel('test-realtime-capability')
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Basic realtime capability confirmed');
            supabase.removeChannel(testChannel);
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Realtime capability test failed');
            this.realtimeEnabled = false;
            supabase.removeChannel(testChannel);
          }
        });
        
      return true;
    } catch (error) {
      console.error('❌ Realtime capability check failed:', error);
      this.realtimeEnabled = false;
      return false;
    }
  }

  /**
   * 실시간 노티피케이션 구독 시작
   */
  async startRealtimeSubscriptions(userId) {
    try {
      // 이미 구독 중인 경우 기존 구독 해제
      if (this.subscriptions.has(userId)) {
        await this.stopRealtimeSubscriptions(userId);
      }

      console.log('🔔 Starting realtime notification subscription for user:', userId);

      // 새 노티피케이션 실시간 구독
      const subscription = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔔 New notification received:', payload);
            this.handleRealtimeNotification(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public', 
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔄 Notification updated:', payload);
            this.handleNotificationUpdate(payload.new, payload.old);
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Notification subscription status:', status);
          if (err) {
            console.error('📡 Subscription error:', err);
          }
          
          // Handle different statuses
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Successfully subscribed to notifications');
              break;
            case 'CHANNEL_ERROR':
              this.channelErrorCount++;
              console.error('❌ Channel error - notifications table may not have realtime enabled');
              console.log('💡 To fix: Go to Supabase Dashboard → Database → Replication → Enable for notifications table');
              
              // Disable realtime after multiple failures
              if (this.channelErrorCount >= 3) {
                console.warn('⚠️ Multiple channel errors detected - disabling realtime notifications');
                console.log('📱 Notifications will still work but without real-time updates');
                this.realtimeEnabled = false;
                this.stopRealtimeSubscriptions(userId);
              }
              break;
            case 'TIMED_OUT':
              console.warn('⏰ Subscription timed out - retrying...');
              // Retry after a delay
              setTimeout(() => {
                this.startRealtimeSubscriptions(userId);
              }, 5000);
              break;
            case 'CLOSED':
              console.log('🔒 Subscription closed');
              break;
          }
        });

      this.subscriptions.set(userId, subscription);
      
      return { success: true, subscription };
    } catch (error) {
      console.error('❌ Failed to start realtime subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 실시간 구독 중지
   */
  async stopRealtimeSubscriptions(userId) {
    try {
      const subscription = this.subscriptions.get(userId);
      if (subscription) {
        await supabase.removeChannel(subscription);
        this.subscriptions.delete(userId);
        console.log('🔇 Stopped notification subscription for user:', userId);
      }
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to stop realtime subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 실시간 노티피케이션 처리
   */
  handleRealtimeNotification(notification) {
    // 커스텀 이벤트 발생 (리액트 컴포넌트에서 리스닝)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: notification
      }));
    }

    // React Native에서는 다른 방식 사용
    if (typeof global !== 'undefined' && global.notificationCallbacks) {
      global.notificationCallbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Notification callback error:', error);
        }
      });
    }
  }

  /**
   * 노티피케이션 업데이트 처리
   */
  handleNotificationUpdate(newNotification, oldNotification) {
    if (typeof global !== 'undefined' && global.notificationUpdateCallbacks) {
      global.notificationUpdateCallbacks.forEach(callback => {
        try {
          callback(newNotification, oldNotification);
        } catch (error) {
          console.error('Notification update callback error:', error);
        }
      });
    }
  }

  /**
   * 스타 이벤트로 노티피케이션 생성
   */
  async createStarNotification(noteId, starredByUserId, noteOwnerId) {
    if (starredByUserId === noteOwnerId) {
      // 자신의 노트에 스타한 경우 알림 생성하지 않음
      return { success: true, isSelfStar: true };
    }

    try {
      // 노트 정보 조회
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('title, content')
        .eq('id', noteId)
        .single();

      if (noteError) throw noteError;

      // 스타한 사용자 정보 조회
      const { data: starrer, error: starrerError } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', starredByUserId)
        .single();

      if (starrerError) throw starrerError;

      const title = 'You received a new star';
      const message = `${starrer.username} starred "${note.title || 'Untitled note'}"`;

      return await this.createNotification({
        recipientId: noteOwnerId,
        senderId: starredByUserId,
        type: NOTIFICATION_TYPES.STAR,
        title,
        message,
        data: {
          note_title: note.title,
          starrer_username: starrer.username,
          sender_username: starrer.username,
          sender_id: starredByUserId
        },
        priority: NOTIFICATION_PRIORITY.NORMAL,
        relatedNoteId: noteId,
        relatedUserId: starredByUserId
      });
    } catch (error) {
      console.error('❌ Failed to create star notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 팔로우 이벤트로 노티피케이션 생성
   */
  async createFollowNotification(followerId, followedUserId) {
    if (followerId === followedUserId) {
      // 자신을 팔로우한 경우 알림 생성하지 않음
      return { success: true, isSelfFollow: true };
    }

    try {
      console.log('🔔 Creating follow notification:', { followerId, followedUserId });
      
      // 간단한 노티피케이션 생성 (외래 키 의존성 제거)
      const title = 'You have a new follower';
      const message = 'Someone started following you';

      return await this.createNotification({
        recipientId: followedUserId,
        senderId: followerId,
        type: NOTIFICATION_TYPES.FOLLOW,
        title,
        message,
        data: {
          sender_id: followerId,
          action: 'follow'
        },
        priority: NOTIFICATION_PRIORITY.HIGH,
        relatedUserId: followerId
      });
    } catch (error) {
      console.error('❌ Failed to create follow notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 서비스 정리
   */
  async cleanup() {
    try {
      // 모든 구독 해제
      for (const [userId, subscription] of this.subscriptions) {
        await supabase.removeChannel(subscription);
      }
      this.subscriptions.clear();
      this.isInitialized = false;
      
      console.log('🧹 NotificationService cleaned up');
      return { success: true };
    } catch (error) {
      console.error('❌ NotificationService cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// 싱글톤 인스턴스 생성
const notificationService = new NotificationService();

export default notificationService;