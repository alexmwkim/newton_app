/**
 * 빠른 follows 테이블 확인 유틸리티
 */

import { supabase } from '../services/supabase';

const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';

export const checkFollowsTable = async () => {
  console.log('🔍 Quick Follows Table Check');
  console.log('============================');
  
  try {
    // 1. follows 테이블 전체 데이터 확인
    console.log('📊 Checking all follow relationships...');
    const { data: allFollows, error: allError } = await supabase
      .from('follows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (allError) {
      console.error('❌ Error:', allError.message);
      return;
    }
    
    console.log(`📈 Total follow relationships: ${allFollows.length}`);
    
    if (allFollows.length > 0) {
      console.log('\n👥 Follow relationships:');
      allFollows.forEach((follow, index) => {
        const follower = follow.follower_id?.substring(0, 8) + '...';
        const following = follow.following_id?.substring(0, 8) + '...';
        console.log(`  ${index + 1}. ${follower} → ${following} (${follow.created_at?.substring(0, 10)})`);
      });
      
      // Alex Kim 관련 관계 찾기
      const alexAsFollower = allFollows.filter(f => f.follower_id === ALEX_USER_ID);
      const alexAsFollowing = allFollows.filter(f => f.following_id === ALEX_USER_ID);
      
      console.log(`\n👤 Alex Kim (${ALEX_USER_ID.substring(0, 8)}...):`);
      console.log(`  • Following: ${alexAsFollower.length} users`);
      console.log(`  • Followers: ${alexAsFollowing.length} users`);
      
      if (alexAsFollower.length > 0) {
        console.log('  Alex follows:');
        alexAsFollower.forEach((f, i) => {
          console.log(`    ${i + 1}. ${f.following_id?.substring(0, 8)}...`);
        });
      }
      
      if (alexAsFollowing.length > 0) {
        console.log('  Alex\'s followers:');
        alexAsFollowing.forEach((f, i) => {
          console.log(`    ${i + 1}. ${f.follower_id?.substring(0, 8)}...`);
        });
      }
      
    } else {
      console.log('📭 No follow relationships found in database');
      console.log('💡 This explains why Alex Kim has 0 followers/following');
    }
    
    // 2. 다른 사용자들 확인
    console.log('\n👥 Other users in the system:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (!profilesError && profiles) {
      profiles.forEach((profile, index) => {
        const isAlex = profile.user_id === ALEX_USER_ID;
        const marker = isAlex ? ' ⭐ (Alex Kim)' : '';
        console.log(`  ${index + 1}. ${profile.username || 'No username'} (${profile.user_id.substring(0, 8)}...)${marker}`);
      });
    }
    
    console.log('\n============================');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
};

// 테스트 팔로우 관계 생성
export const createTestFollow = async () => {
  console.log('🧪 Creating test follow relationship...');
  
  try {
    // 다른 사용자 찾기
    const { data: otherUsers, error } = await supabase
      .from('profiles')
      .select('user_id, username')
      .neq('user_id', ALEX_USER_ID)
      .limit(1);
      
    if (error || !otherUsers?.length) {
      console.log('❌ No other users found');
      return;
    }
    
    const testUser = otherUsers[0];
    console.log(`👤 Test user: ${testUser.username} (${testUser.user_id.substring(0, 8)}...)`);
    
    // 팔로우 관계 생성: testUser → Alex Kim
    const { data, error: followError } = await supabase
      .from('follows')
      .insert([{
        follower_id: testUser.user_id,
        following_id: ALEX_USER_ID
      }])
      .select()
      .single();
      
    if (followError) {
      if (followError.code === '23505') {
        console.log('⚠️ Follow relationship already exists');
      } else {
        console.error('❌ Follow creation failed:', followError.message);
      }
      return;
    }
    
    console.log('✅ Test follow created!');
    console.log(`${testUser.username} is now following Alex Kim`);
    
    // 재확인
    setTimeout(() => {
      console.log('\n🔄 Rechecking after creation...');
      checkFollowsTable();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test creation failed:', error.message);
  }
};

// 전역 등록
if (typeof global !== 'undefined') {
  global.checkFollowsTable = checkFollowsTable;
  global.createTestFollow = createTestFollow;
}

export default {
  checkFollowsTable,
  createTestFollow
};