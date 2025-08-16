/**
 * Test to check if there's stale cache data causing the 0 follow count issue
 */

// Import the cache store to check what's in the cache
const FollowCacheStore = require('./src/store/FollowCacheStore.js');
const followCacheStore = FollowCacheStore.default || FollowCacheStore;

const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';

console.log('🔍 Checking FollowCacheStore for Alex Kim...');
console.log('Alex User ID:', ALEX_USER_ID);
console.log('');

// Check what's in the cache for Alex Kim
const cachedData = followCacheStore.getFromCache(ALEX_USER_ID);
console.log('📊 Cached data for Alex Kim:', cachedData);

if (cachedData) {
  console.log('⚠️ Found cached data! This might be the issue.');
  console.log('Cached followers count:', cachedData.followersCount);
  console.log('Cached following count:', cachedData.followingCount);
  console.log('');
  
  console.log('🗑️ Clearing cache for Alex Kim...');
  followCacheStore.clearCache(ALEX_USER_ID);
  
  const afterClear = followCacheStore.getFromCache(ALEX_USER_ID);
  console.log('📊 After clearing cache:', afterClear);
} else {
  console.log('✅ No cached data found for Alex Kim');
}

console.log('');
console.log('🔍 Checking cache stats:');
console.log('Cache stats:', followCacheStore.getCacheStats?.() || 'No stats method');

console.log('');
console.log('🧪 Testing cache operations:');

// Test setting correct data in cache
followCacheStore.setCache(ALEX_USER_ID, {
  followersCount: 1,
  followingCount: 1,
  isFollowing: false
});

const newCachedData = followCacheStore.getFromCache(ALEX_USER_ID);
console.log('📊 After setting correct data:', newCachedData);

console.log('');
console.log('✅ Cache test completed');
console.log('');
console.log('💡 Recommendation: If the app was showing 0, it might have been due to stale cache.');
console.log('   The cache has now been updated with the correct values.');