/**
 * 팔로우 노티피케이션 디버깅 도구
 * 실시간으로 David Lee → Alex Kim 팔로우 액션을 모니터링하고 노티피케이션 생성을 추적
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

// 사용자 ID는 동적으로 가져오기
const getUserIds = () => {
  // 전역 변수에서 현재 사용자 정보 가져오기
  if (global.currentUser) {
    return {
      currentUserId: global.currentUser.id,
      currentUsername: global.currentUser.username || global.currentUser.email
    };
  }
  
  // 기본값 (테스트용)
  return {
    ALEX_USER_ID: '10663749-9fba-4039-9f22-d6e7add9ea2d',
    DAVID_USER_ID: 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'
  };
};

class FollowNotificationDebugger {
  constructor() {
    this.isMonitoring = false;
    this.debugLogs = [];
  }

  /**
   * 실시간 로그 기록
   */
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    this.debugLogs.push(logEntry);
    
    console.log(`🐛 [${timestamp}] ${message}`);
    if (data) {
      console.log('   Data:', data);
    }
  }

  /**
   * 현재 상황 진단
   */
  async diagnoseCurrent() {
    this.log('🔍 DIAGNOSING CURRENT NOTIFICATION ISSUE');
    this.log('=======================================');
    
    // 1. 사용자 확인
    await this.checkUsers();
    
    // 2. 현재 팔로우 상태 확인
    await this.checkFollowStatus();
    
    // 3. 기존 노티피케이션 확인
    await this.checkExistingNotifications();
    
    // 4. 노티피케이션 서비스 상태 확인
    await this.checkNotificationService();
    
    // 5. 실제 팔로우 액션 테스트
    await this.testFollowAction();
  }

  /**
   * 사용자 확인
   */
  async checkUsers() {
    this.log('👤 Checking user profiles...');
    
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', [ALEX_USER_ID, DAVID_USER_ID]);
      
      if (error) {
        this.log('❌ Error fetching users', error);
        return;
      }
      
      const alex = users.find(u => u.user_id === ALEX_USER_ID);
      const david = users.find(u => u.user_id === DAVID_USER_ID);
      
      this.log('✅ Users found:', { alex, david });
      
      if (!alex) this.log('❌ Alex Kim not found!');
      if (!david) this.log('❌ David Lee not found!');
      
    } catch (error) {
      this.log('❌ Exception checking users', error);
    }
  }

  /**
   * 현재 팔로우 상태 확인
   */
  async checkFollowStatus() {
    this.log('👥 Checking current follow status...');
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', DAVID_USER_ID)
        .eq('following_id', ALEX_USER_ID);
      
      if (error) {
        this.log('❌ Error checking follow status', error);
        return;
      }
      
      const isFollowing = data.length > 0;
      this.log(`📊 David → Alex follow status: ${isFollowing ? 'FOLLOWING' : 'NOT FOLLOWING'}`);
      
      if (isFollowing) {
        this.log('   Follow record:', data[0]);
      }
      
    } catch (error) {
      this.log('❌ Exception checking follow status', error);
    }
  }

  /**
   * 기존 노티피케이션 확인
   */
  async checkExistingNotifications() {
    this.log('🔔 Checking existing notifications...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', ALEX_USER_ID)
        .eq('sender_id', DAVID_USER_ID)
        .eq('type', 'follow')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        this.log('❌ Error checking notifications', error);
        return;
      }
      
      this.log(`📱 Found ${data.length} follow notifications from David to Alex`);
      
      if (data.length > 0) {
        data.forEach((notif, index) => {
          this.log(`   ${index + 1}. ${notif.message} (${notif.created_at})`);
        });
      }
      
    } catch (error) {
      this.log('❌ Exception checking notifications', error);
    }
  }

  /**
   * 노티피케이션 서비스 상태 확인
   */
  async checkNotificationService() {
    this.log('🛠️ Checking notification service...');
    
    try {
      // 초기화 상태 확인
      this.log(`   Service initialized: ${notificationService.isInitialized}`);
      this.log(`   Realtime enabled: ${notificationService.realtimeEnabled}`);
      this.log(`   Channel errors: ${notificationService.channelErrorCount}`);
      
      // 직접 노티피케이션 생성 테스트
      this.log('🧪 Testing direct notification creation...');
      
      const result = await notificationService.createFollowNotification(DAVID_USER_ID, ALEX_USER_ID);
      
      this.log('   Direct creation result:', result);
      
      if (result.success) {
        this.log('✅ Direct notification creation successful');
      } else if (result.isSelfFollow) {
        this.log('ℹ️ Self-follow skipped (unexpected)');
      } else {
        this.log('❌ Direct notification creation failed', result.error);
      }
      
    } catch (error) {
      this.log('❌ Exception checking notification service', error);
    }
  }

  /**
   * 실제 팔로우 액션 테스트
   */
  async testFollowAction() {
    this.log('🚀 Testing actual follow action...');
    
    try {
      // 1. 언팔로우부터 시작 (깨끗한 테스트)
      this.log('   Step 1: Unfollowing first...');
      const unfollowResult = await UnifiedFollowService.unfollowUser(DAVID_USER_ID, ALEX_USER_ID);
      this.log('   Unfollow result:', unfollowResult);
      
      // 2. 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. 팔로우 실행
      this.log('   Step 2: Following...');
      const followResult = await UnifiedFollowService.followUser(DAVID_USER_ID, ALEX_USER_ID);
      this.log('   Follow result:', followResult);
      
      if (followResult.success) {
        this.log('✅ Follow action successful');
        
        // 4. 노티피케이션 생성 대기
        this.log('   Step 3: Waiting for notification creation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 5. 새 노티피케이션 확인
        this.log('   Step 4: Checking for new notification...');
        const { data: newNotifs, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', ALEX_USER_ID)
          .eq('sender_id', DAVID_USER_ID)
          .eq('type', 'follow')
          .gte('created_at', new Date(Date.now() - 60000).toISOString()) // 마지막 1분
          .order('created_at', { ascending: false });
        
        if (error) {
          this.log('❌ Error checking new notifications', error);
        } else if (newNotifs.length > 0) {
          this.log('✅ NEW NOTIFICATION FOUND!', newNotifs[0]);
        } else {
          this.log('❌ NO NEW NOTIFICATION FOUND');
          this.log('   This indicates the notification creation is not working');
        }
      } else {
        this.log('❌ Follow action failed', followResult);
      }
      
    } catch (error) {
      this.log('❌ Exception in follow action test', error);
    }
  }

  /**
   * 로그 내역 출력
   */
  showLogs() {
    console.log('\n📋 DEBUG LOG HISTORY');
    console.log('====================');
    this.debugLogs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.message}`);
      if (log.data) {
        console.log('   Data:', log.data);
      }
    });
  }

  /**
   * 실시간 노티피케이션 생성 강제 테스트
   */
  async forceCreateNotification() {
    this.log('💪 FORCE CREATING NOTIFICATION...');
    
    try {
      const result = await notificationService.createNotification({
        recipientId: ALEX_USER_ID,
        senderId: DAVID_USER_ID,
        type: 'follow',
        title: 'You have a new follower',
        message: 'David Lee started following you',
        data: {
          follower_username: 'David Lee',
          sender_username: 'David Lee',
          sender_id: DAVID_USER_ID
        },
        priority: 'high',
        relatedUserId: DAVID_USER_ID
      });
      
      this.log('Force creation result:', result);
      
      if (result.success) {
        this.log('✅ Force notification creation successful');
        return result;
      } else {
        this.log('❌ Force notification creation failed', result.error);
        return null;
      }
      
    } catch (error) {
      this.log('❌ Exception in force creation', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
const followDebugger = new FollowNotificationDebugger();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.debugFollowNotification = () => followDebugger.diagnoseCurrent();
  global.forceCreateFollowNotification = () => followDebugger.forceCreateNotification();
  global.showNotificationDebugLogs = () => followDebugger.showLogs();
  
  console.log('🐛 Follow notification debugger ready!');
  console.log('💡 Run global.debugFollowNotification() to diagnose the issue');
  console.log('💡 Run global.forceCreateFollowNotification() to force create notification');
}

export default followDebugger;