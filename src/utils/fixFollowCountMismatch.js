/**
 * 팔로우 카운트 불일치 문제 긴급 수정
 * 실제 팔로우 상태와 캐시/UI 표시가 다른 문제 해결
 */

import { supabase } from '../services/supabase';
import UnifiedFollowService from '../services/UnifiedFollowService';
import followCacheStore from '../store/FollowCacheStore';

class FollowCountMismatchFixer {
  constructor() {
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
  }

  /**
   * 긴급 수정: 실제 데이터베이스 상태 확인 및 모든 캐시 수정
   */
  async emergencyFixFollowCounts() {
    console.log('🚨 EMERGENCY FIX: FOLLOW COUNT MISMATCH');
    console.log('======================================');
    
    try {
      // 1. 데이터베이스에서 실제 팔로우 관계 확인
      console.log('🔍 Step 1: Checking ACTUAL database state...');
      
      const { data: allFollows, error } = await supabase
        .from('follows')
        .select('follower_id, following_id, created_at')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Database query failed:', error);
        return;
      }
      
      console.log(`📊 Total follow relationships in database: ${allFollows?.length || 0}`);
      
      if (allFollows && allFollows.length > 0) {
        console.log('📋 All follow relationships:');
        allFollows.forEach((follow, index) => {
          const followerName = follow.follower_id === this.davidLeeId ? 'David Lee' : 
                              follow.follower_id === this.alexKimId ? 'Alex Kim' : 'Unknown';
          const followingName = follow.following_id === this.davidLeeId ? 'David Lee' : 
                               follow.following_id === this.alexKimId ? 'Alex Kim' : 'Unknown';
          console.log(`   ${index + 1}. ${followerName} → ${followingName} (${follow.created_at})`);
        });
      } else {
        console.log('📋 NO follow relationships found in database');
      }
      
      // 2. David Lee의 실제 팔로우 상태 계산
      const davidFollowing = allFollows?.filter(f => f.follower_id === this.davidLeeId) || [];
      const davidFollowers = allFollows?.filter(f => f.following_id === this.davidLeeId) || [];
      const davidFollowsAlex = davidFollowing.some(f => f.following_id === this.alexKimId);
      
      console.log('\n👤 DAVID LEE - ACTUAL STATE:');
      console.log(`   Following: ${davidFollowing.length} users`);
      console.log(`   Followers: ${davidFollowers.length} users`);
      console.log(`   Follows Alex: ${davidFollowsAlex ? 'YES' : 'NO'}`);
      
      if (davidFollowing.length > 0) {
        console.log('   David follows:');
        davidFollowing.forEach(f => {
          const name = f.following_id === this.alexKimId ? 'Alex Kim' : f.following_id;
          console.log(`     - ${name}`);
        });
      }
      
      // 3. Alex Kim의 실제 팔로우 상태 계산
      const alexFollowing = allFollows?.filter(f => f.follower_id === this.alexKimId) || [];
      const alexFollowers = allFollows?.filter(f => f.following_id === this.alexKimId) || [];
      
      console.log('\n👤 ALEX KIM - ACTUAL STATE:');
      console.log(`   Following: ${alexFollowing.length} users`);
      console.log(`   Followers: ${alexFollowers.length} users`);
      
      // 4. 모든 캐시 완전 삭제
      console.log('\n🗑️ Step 2: COMPLETELY clearing ALL caches...');
      UnifiedFollowService.clearAllCache();
      followCacheStore.clearAll();
      
      // AsyncStorage에서도 관련 캐시 삭제
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('followCache');
        await AsyncStorage.removeItem(`followCache_${this.davidLeeId}`);
        await AsyncStorage.removeItem(`followCache_${this.alexKimId}`);
        console.log('✅ Cleared AsyncStorage caches');
      } catch (e) {
        console.log('⚠️ AsyncStorage clear failed (may not exist)');
      }
      
      // 5. 정확한 데이터로 모든 캐시 재설정
      console.log('\n🔄 Step 3: Setting CORRECT data in all caches...');
      
      const correctDavidData = {
        followingCount: davidFollowing.length,
        followersCount: davidFollowers.length,
        isFollowing: false // David 자신의 프로필
      };
      
      const correctAlexData = {
        followingCount: alexFollowing.length,
        followersCount: alexFollowers.length,
        isFollowing: davidFollowsAlex // David가 Alex를 팔로우하는지
      };
      
      // UnifiedFollowService 캐시 설정
      UnifiedFollowService.setCache(this.davidLeeId, correctDavidData);
      UnifiedFollowService.setCache(this.alexKimId, correctAlexData);
      
      // FollowCacheStore 캐시 설정
      followCacheStore.setCache(this.davidLeeId, correctDavidData);
      followCacheStore.setCache(this.alexKimId, correctAlexData);
      
      console.log(`✅ Set David Lee cache: Following=${correctDavidData.followingCount}, Followers=${correctDavidData.followersCount}`);
      console.log(`✅ Set Alex Kim cache: Following=${correctAlexData.followingCount}, Followers=${correctAlexData.followersCount}`);
      
      // 6. 검증
      console.log('\n✅ Step 4: VERIFICATION...');
      
      const davidCacheCheck = followCacheStore.getFromCache(this.davidLeeId);
      const alexCacheCheck = followCacheStore.getFromCache(this.alexKimId);
      
      console.log('📊 Current cache states:');
      console.log(`   David Lee cache: ${JSON.stringify(davidCacheCheck)}`);
      console.log(`   Alex Kim cache: ${JSON.stringify(alexCacheCheck)}`);
      
      // 7. 결과 요약
      console.log('\n📋 FINAL RESULT SUMMARY');
      console.log('=======================');
      console.log(`🎯 David Lee should show:`);
      console.log(`   Following: ${correctDavidData.followingCount} (was showing wrong number)`);
      console.log(`   Followers: ${correctDavidData.followersCount}`);
      console.log('');
      console.log(`🎯 Alex Kim should show:`);
      console.log(`   Following: ${correctAlexData.followingCount}`);
      console.log(`   Followers: ${correctAlexData.followersCount}`);
      console.log('');
      
      if (correctDavidData.followingCount === 0) {
        console.log('✅ SUCCESS: David Lee following count is now correctly 0');
        console.log('💡 Profile page should now show Following: 0');
      } else {
        console.log(`ℹ️ David Lee is following ${correctDavidData.followingCount} users`);
      }
      
      console.log('\n💡 Try refreshing the profile page or navigating away and back');
      console.log('💡 The cached data should now be correct');
      
      return {
        success: true,
        davidActual: correctDavidData,
        alexActual: correctAlexData,
        databaseFollows: allFollows?.length || 0
      };
      
    } catch (error) {
      console.error('❌ Emergency fix failed:', error);
      return { success: false, error };
    }
  }

  /**
   * 특정 사용자의 팔로우 관계 완전 삭제 (테스트용)
   */
  async removeAllFollowsForUser(userId) {
    console.log(`🗑️ REMOVING ALL FOLLOWS FOR USER: ${userId}`);
    console.log('===========================================');
    
    try {
      // 사용자가 팔로우하는 모든 관계 삭제
      const { data: removed1, error: error1 } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId);
        
      // 사용자를 팔로우하는 모든 관계 삭제
      const { data: removed2, error: error2 } = await supabase
        .from('follows')
        .delete()
        .eq('following_id', userId);
      
      if (error1 || error2) {
        console.error('❌ Delete failed:', error1 || error2);
        return false;
      }
      
      console.log('✅ Successfully removed all follow relationships');
      console.log('💡 Run emergencyFixFollowCounts() to update caches');
      
      return true;
      
    } catch (error) {
      console.error('❌ Remove follows failed:', error);
      return false;
    }
  }

  /**
   * 팔로우 관계 수동 생성 (테스트용)
   */
  async createFollowRelationship(followerId, followingId) {
    console.log(`➕ CREATING FOLLOW: ${followerId} → ${followingId}`);
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('❌ Create follow failed:', error);
        return false;
      }
      
      console.log('✅ Follow relationship created:', data);
      console.log('💡 Run emergencyFixFollowCounts() to update caches');
      
      return true;
      
    } catch (error) {
      console.error('❌ Create follow failed:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
const followCountMismatchFixer = new FollowCountMismatchFixer();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.emergencyFixFollowCounts = () => followCountMismatchFixer.emergencyFixFollowCounts();
  global.removeAllFollowsForDavid = () => followCountMismatchFixer.removeAllFollowsForUser('e7cc75eb-9ed4-42b9-95d6-88ff615aac22');
  global.createDavidFollowsAlex = () => followCountMismatchFixer.createFollowRelationship('e7cc75eb-9ed4-42b9-95d6-88ff615aac22', '10663749-9fba-4039-9f22-d6e7add9ea2d');
  
  console.log('🚨 Emergency follow count fixer ready!');
  console.log('💡 Commands:');
  console.log('   global.emergencyFixFollowCounts() - Fix all count mismatches');
  console.log('   global.removeAllFollowsForDavid() - Remove all David\'s follows');
  console.log('   global.createDavidFollowsAlex() - Create David → Alex follow');
}

export default followCountMismatchFixer;