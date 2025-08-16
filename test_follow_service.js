/**
 * Test the followClient.getBatchFollowData method specifically for Alex Kim
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = 'https://kmhmoxzhsljtnztywfre.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase anon key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simulate the followClient.getBatchFollowData method
async function testBatchFollowData(userId, currentUserId = null) {
  try {
    if (!userId) {
      return { 
        success: false, 
        followersCount: 0, 
        followingCount: 0, 
        isFollowing: false,
        error: 'No user ID provided' 
      };
    }

    console.log('🚀 Testing batch follow data for user:', userId);

    // 병렬로 모든 데이터 가져오기 (exact same as in followClient.js)
    const promises = [
      // 팔로워 수
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      
      // 팔로잉 수
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ];

    // 현재 사용자가 있고 다른 사용자의 프로필을 보는 경우에만 팔로우 상태 확인
    if (currentUserId && currentUserId !== userId) {
      promises.push(
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .single()
      );
    }

    const results = await Promise.all(promises);
    
    const [followersResult, followingResult, followStatusResult] = results;

    console.log('🔍 Raw query results:');
    console.log('1. Followers query result:', {
      count: followersResult.count,
      error: followersResult.error?.message,
      errorCode: followersResult.error?.code
    });
    console.log('2. Following query result:', {
      count: followingResult.count,
      error: followingResult.error?.message,
      errorCode: followingResult.error?.code
    });
    
    if (followStatusResult) {
      console.log('3. Follow status result:', {
        data: followStatusResult.data,
        error: followStatusResult.error?.message,
        errorCode: followStatusResult.error?.code
      });
    }

    // 결과 처리 (exact same logic as followClient.js)
    const followersCount = followersResult.error ? 0 : (followersResult.count || 0);
    const followingCount = followingResult.error ? 0 : (followingResult.count || 0);
    const isFollowing = followStatusResult 
      ? (followStatusResult.error && followStatusResult.error.code !== 'PGRST116' 
         ? false 
         : !!followStatusResult.data)
      : false;

    console.log('✅ Processed results:', {
      followersCount,
      followingCount,
      isFollowing,
      hasCurrentUser: !!currentUserId
    });

    return {
      success: true,
      followersCount,
      followingCount,
      isFollowing,
      error: null
    };

  } catch (error) {
    console.error('❌ Exception in testBatchFollowData:', error);
    return { 
      success: false, 
      followersCount: 0, 
      followingCount: 0, 
      isFollowing: false,
      error 
    };
  }
}

async function runTest() {
  console.log('🧪 Testing followClient.getBatchFollowData behavior');
  console.log('====================================================');
  console.log('Alex User ID:', ALEX_USER_ID);
  console.log('');

  // Test 1: Alex Kim's own profile (no currentUserId)
  console.log('📊 Test 1: Alex Kim viewing his own profile');
  const result1 = await testBatchFollowData(ALEX_USER_ID);
  console.log('Result:', result1);
  console.log('');

  // Test 2: Get other user to test with currentUserId
  console.log('📊 Test 2: Getting other users for cross-user testing');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username')
    .neq('user_id', ALEX_USER_ID)
    .limit(1);

  if (profiles && profiles.length > 0) {
    const otherUser = profiles[0];
    console.log('Other user:', otherUser.username, '(' + otherUser.user_id.substring(0, 8) + '...)');
    
    // Test Alex's profile from another user's perspective
    console.log('📊 Test 3: ' + otherUser.username + ' viewing Alex Kim\'s profile');
    const result2 = await testBatchFollowData(ALEX_USER_ID, otherUser.user_id);
    console.log('Result:', result2);
    console.log('');
    
    // Test other user's profile from Alex's perspective
    console.log('📊 Test 4: Alex Kim viewing ' + otherUser.username + '\'s profile');
    const result3 = await testBatchFollowData(otherUser.user_id, ALEX_USER_ID);
    console.log('Result:', result3);
  } else {
    console.log('⚠️ No other users found for cross-user testing');
  }

  console.log('====================================================');
  console.log('🏁 Test completed');
}

runTest().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});