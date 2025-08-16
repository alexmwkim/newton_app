/**
 * 노티피케이션 시스템과 소셜 액션 연동 테스트 유틸리티
 */

import { useSocialStore } from '../store/SocialStore';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

/**
 * 스타 액션 테스트
 */
export const testStarNotificationIntegration = async (noteId, noteOwnerId) => {
  try {
    const { user } = useAuth();
    const { starNote } = useSocialStore();
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    if (user.id === noteOwnerId) {
      console.log('⚠️ Cannot star own note - no notification will be sent');
      return;
    }
    
    console.log('🧪 Testing star notification integration...');
    console.log('📝 Note ID:', noteId);
    console.log('👤 Starring user:', user.id);
    console.log('👤 Note owner:', noteOwnerId);
    
    // 스타 액션 실행 (노티피케이션 자동 생성 포함)
    const result = await starNote(noteId, user.id);
    
    console.log('✅ Star action completed:', result);
    console.log('📱 Notification should be created for user:', noteOwnerId);
    
    return result;
  } catch (error) {
    console.error('❌ Star notification test failed:', error);
    throw error;
  }
};

/**
 * 팔로우 액션 테스트
 */
export const testFollowNotificationIntegration = async (userIdToFollow) => {
  try {
    const { user } = useAuth();
    const { followUser } = useSocialStore();
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    if (user.id === userIdToFollow) {
      console.log('⚠️ Cannot follow self - no notification will be sent');
      return;
    }
    
    console.log('🧪 Testing follow notification integration...');
    console.log('👤 Following user:', user.id);
    console.log('👤 User to follow:', userIdToFollow);
    
    // 팔로우 액션 실행 (노티피케이션 자동 생성 포함)
    const result = await followUser(user.id, userIdToFollow);
    
    console.log('✅ Follow action completed:', result);
    console.log('📱 Notification should be created for user:', userIdToFollow);
    
    return result;
  } catch (error) {
    console.error('❌ Follow notification test failed:', error);
    throw error;
  }
};

/**
 * 노티피케이션 시스템 상태 확인
 */
export const checkNotificationSystemStatus = () => {
  try {
    const { user } = useAuth();
    const { notifications, unreadCount, isLoading, hasUnread } = useNotifications();
    
    console.log('📊 Notification System Status:');
    console.log('👤 Current user:', user?.id || 'Not authenticated');
    console.log('📬 Total notifications:', notifications.length);
    console.log('🔴 Unread count:', unreadCount);
    console.log('📱 Has unread:', hasUnread);
    console.log('⏳ Loading:', isLoading);
    console.log('📝 Recent notifications:', notifications.slice(0, 3).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      isRead: n.is_read,
      createdAt: n.created_at
    })));
    
    return {
      user,
      notifications,
      unreadCount,
      hasUnread,
      isLoading,
      systemActive: notifications !== null
    };
  } catch (error) {
    console.error('❌ Failed to check notification system status:', error);
    return null;
  }
};

/**
 * 통합 테스트 시나리오
 */
export const runIntegrationTest = async (testNoteId, testUserId) => {
  try {
    console.log('🚀 Starting notification integration test...');
    
    // 1. 시스템 상태 확인
    const systemStatus = checkNotificationSystemStatus();
    if (!systemStatus?.systemActive) {
      throw new Error('Notification system is not active');
    }
    
    // 2. 스타 테스트
    if (testNoteId) {
      await testStarNotificationIntegration(testNoteId, testUserId);
    }
    
    // 3. 팔로우 테스트
    if (testUserId) {
      await testFollowNotificationIntegration(testUserId);
    }
    
    // 4. 결과 확인
    setTimeout(() => {
      console.log('🔍 Checking results after 2 seconds...');
      checkNotificationSystemStatus();
    }, 2000);
    
    console.log('✅ Integration test completed successfully');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
};

export default {
  testStarNotificationIntegration,
  testFollowNotificationIntegration,
  checkNotificationSystemStatus,
  runIntegrationTest
};