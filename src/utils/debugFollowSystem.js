/**
 * 팔로우 시스템 디버깅 유틸리티
 * Alex Kim의 팔로우 카운트가 0인 이유 확인
 */

import { supabase } from '../services/supabase';
import UnifiedFollowService from '../services/UnifiedFollowService';

const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';

/**
 * 팔로우 시스템 전체 진단
 */
export const debugFollowSystem = async () => {
  console.log('🔍 Follow System Debug for Alex Kim');
  console.log('=====================================');
  console.log('User ID:', ALEX_USER_ID);
  
  try {
    // 1. follows 테이블 존재 확인
    console.log('\n📋 1. Checking follows table...');
    try {
      const { data: followsTest, error: followsError } = await supabase
        .from('follows')
        .select('count')
        .limit(1);
        
      if (followsError) {
        if (followsError.code === '42P01') {
          console.log('❌ follows table does not exist!');
          console.log('💡 You need to create the follows table in Supabase');
          return;
        } else {
          console.log('❌ follows table error:', followsError.message);
          return;
        }
      }
      
      console.log('✅ follows table exists');
    } catch (error) {
      console.error('❌ Error checking follows table:', error.message);
      return;
    }
    
    // 2. 모든 팔로우 관계 확인
    console.log('\n👥 2. Checking all follow relationships...');
    try {
      const { data: allFollows, error: allFollowsError } = await supabase
        .from('follows')
        .select('*')
        .limit(50);
        
      if (allFollowsError) {
        console.log('❌ Error fetching follows:', allFollowsError.message);
      } else {
        console.log(`📊 Total follow relationships in database: ${allFollows.length}`);
        
        if (allFollows.length > 0) {
          console.log('First few relationships:');
          allFollows.slice(0, 5).forEach((follow, index) => {
            console.log(`  ${index + 1}. ${follow.follower_id?.substring(0, 8)} → ${follow.following_id?.substring(0, 8)}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error listing follows:', error.message);
    }
    
    // 3. Alex Kim의 팔로워 확인 (following_id = Alex)
    console.log('\n👤 3. Checking Alex Kim\'s followers...');
    try {
      const { data: followers, error: followersError } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', ALEX_USER_ID);
        
      if (followersError) {
        console.log('❌ Error getting followers:', followersError.message);
      } else {
        console.log(`📈 Alex Kim has ${followers.length} followers`);
        followers.forEach((follow, index) => {
          console.log(`  Follower ${index + 1}: ${follow.follower_id?.substring(0, 8)}`);
        });
      }
    } catch (error) {
      console.error('❌ Error checking followers:', error.message);
    }
    
    // 4. Alex Kim이 팔로잉하는 사용자 확인 (follower_id = Alex)
    console.log('\n👥 4. Checking who Alex Kim follows...');
    try {
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', ALEX_USER_ID);
        
      if (followingError) {
        console.log('❌ Error getting following:', followingError.message);
      } else {
        console.log(`📈 Alex Kim follows ${following.length} users`);
        following.forEach((follow, index) => {
          console.log(`  Following ${index + 1}: ${follow.following_id?.substring(0, 8)}`);
        });
      }
    } catch (error) {
      console.error('❌ Error checking following:', error.message);
    }
    
    // 5. UnifiedFollowService 테스트
    console.log('\n🔧 5. Testing UnifiedFollowService...');
    try {
      const followersResult = await UnifiedFollowService.getFollowersCount(ALEX_USER_ID);
      const followingResult = await UnifiedFollowService.getFollowingCount(ALEX_USER_ID);
      
      console.log('Service results:');
      console.log(`  Followers: ${followersResult.success ? followersResult.count : 'ERROR - ' + followersResult.error}`);
      console.log(`  Following: ${followingResult.success ? followingResult.count : 'ERROR - ' + followingResult.error}`);
    } catch (error) {
      console.error('❌ UnifiedFollowService test failed:', error.message);
    }
    
    // 6. 프로필 정보 확인
    console.log('\n👤 6. Checking Alex Kim\'s profile...');
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', ALEX_USER_ID)
        .single();
        
      if (profileError) {
        console.log('❌ Error getting profile:', profileError.message);
      } else {
        console.log('✅ Profile found:', {
          username: profile.username,
          created_at: profile.created_at,
          id: profile.id
        });
      }
    } catch (error) {
      console.error('❌ Error checking profile:', error.message);
    }
    
    console.log('\n=====================================');
    console.log('Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

/**
 * 테스트 팔로우 관계 생성
 */
export const createTestFollowRelationship = async () => {
  console.log('🧪 Creating test follow relationship...');
  
  try {
    // 다른 사용자 ID가 있는지 확인
    const { data: otherUsers, error } = await supabase
      .from('profiles')
      .select('user_id, username')
      .neq('user_id', ALEX_USER_ID)
      .limit(1);
      
    if (error || !otherUsers || otherUsers.length === 0) {
      console.log('❌ No other users found for test');
      return;
    }
    
    const testUserId = otherUsers[0].user_id;
    console.log('👤 Test user:', otherUsers[0].username, testUserId.substring(0, 8));
    
    // 테스트 팔로우 관계 생성: testUser → Alex
    const result = await UnifiedFollowService.followUser(testUserId, ALEX_USER_ID);
    
    if (result.success) {
      console.log('✅ Test follow relationship created!');
      console.log(`${otherUsers[0].username} is now following Alex Kim`);
      
      // 즉시 카운트 확인
      const followersResult = await UnifiedFollowService.getFollowersCount(ALEX_USER_ID);
      console.log('Updated followers count:', followersResult.count);
    } else {
      console.log('❌ Failed to create test relationship:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test creation failed:', error.message);
  }
};

// 전역에서 쉽게 접근할 수 있도록 등록
if (typeof global !== 'undefined') {
  global.debugFollowSystem = debugFollowSystem;
  global.createTestFollowRelationship = createTestFollowRelationship;
}

export default {
  debugFollowSystem,
  createTestFollowRelationship
};