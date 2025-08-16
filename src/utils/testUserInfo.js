/**
 * 사용자 정보 표시 테스트 유틸리티
 * 노티피케이션에서 실제 사용자 정보가 표시되는지 확인
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';

/**
 * 현재 사용자의 프로필 정보 확인
 */
export const checkCurrentUserProfile = async (userId) => {
  try {
    console.log('👤 Checking user profile for:', userId);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('❌ Profile not found:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ User profile found:', {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username,
      avatar_url: profile.avatar_url
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('❌ Error checking profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 테스트용 노티피케이션 생성
 */
export const createTestNotification = async (recipientId, senderId, type = 'star') => {
  try {
    console.log('📝 Creating test notification...');
    console.log('Recipient:', recipientId);
    console.log('Sender:', senderId);
    
    // 발신자 정보 조회
    const senderProfile = await checkCurrentUserProfile(senderId);
    if (!senderProfile.success) {
      console.error('❌ Cannot get sender profile');
      return { success: false, error: 'Sender profile not found' };
    }
    
    const senderUsername = senderProfile.profile.username || `User-${senderId.substring(0, 8)}`;
    
    // 테스트 노티피케이션 생성
    const result = await notificationService.createNotification({
      recipientId,
      senderId,
      type,
      title: 'Test Notification',
      message: `${senderUsername} performed a ${type} action`,
      data: {
        sender_username: senderUsername,
        sender_id: senderId,
        test: true
      },
      priority: 'normal'
    });
    
    console.log('📨 Test notification result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 모든 사용자의 프로필 목록 확인
 */
export const listAllProfiles = async () => {
  try {
    console.log('👥 Listing all user profiles...');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, avatar_url, created_at')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Failed to list profiles:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Found ${profiles.length} profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.username || 'No username'} (${profile.user_id.substring(0, 8)}...)`);
    });
    
    return { success: true, profiles };
  } catch (error) {
    console.error('❌ Error listing profiles:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 노티피케이션 데이터 구조 확인
 */
export const debugNotificationData = async (userId) => {
  try {
    console.log('🔍 Debugging notification data for user:', userId);
    
    // 사용자의 최근 알림 조회
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.log('⚠️ No notifications table or data:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`📋 Found ${notifications.length} recent notifications:`);
    
    notifications.forEach((notif, index) => {
      const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
      console.log(`  ${index + 1}. ${notif.type} from ${notif.sender_id?.substring(0, 8) || 'unknown'}:`);
      console.log(`     Title: ${notif.title}`);
      console.log(`     Message: ${notif.message}`);
      console.log(`     Data:`, data);
      console.log(`     Sender info in data:`, {
        sender_username: data?.sender_username,
        sender_id: data?.sender_id,
        starrer_username: data?.starrer_username,
        follower_username: data?.follower_username
      });
    });
    
    return { success: true, notifications };
  } catch (error) {
    console.error('❌ Error debugging notifications:', error);
    return { success: false, error: error.message };
  }
};

export default {
  checkCurrentUserProfile,
  createTestNotification,
  listAllProfiles,
  debugNotificationData
};