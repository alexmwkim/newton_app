/**
 * Quick check of Alex Kim's follow count issue
 * This script connects directly to Supabase to investigate the follows table
 */

// Using CommonJS require since Node.js environment
const { createClient } = require('@supabase/supabase-js');

// Load environment from the secure loader
require('dotenv').config();

const SUPABASE_URL = 'https://kmhmoxzhsljtnztywfre.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase keys in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkFollowSystem() {
  console.log('🔍 Investigating Alex Kim\'s follow count issue');
  console.log('=====================================');
  console.log('Alex User ID:', ALEX_USER_ID);
  console.log('');

  try {
    // 1. Check if follows table exists and get all data
    console.log('📋 1. Checking follows table...');
    const { data: allFollows, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (followsError) {
      console.error('❌ Error accessing follows table:', followsError.message);
      if (followsError.code === '42P01') {
        console.log('💡 The follows table does not exist!');
        return;
      }
    } else {
      console.log(`✅ Found ${allFollows.length} total follow relationships`);
      
      if (allFollows.length > 0) {
        console.log('\n👥 Recent follow relationships:');
        allFollows.slice(0, 5).forEach((follow, i) => {
          const follower = follow.follower_id?.substring(0, 8) + '...';
          const following = follow.following_id?.substring(0, 8) + '...';
          const date = follow.created_at?.substring(0, 10);
          console.log(`  ${i + 1}. ${follower} → ${following} (${date})`);
        });
      } else {
        console.log('📭 No follow relationships found in database');
        console.log('💡 This explains why Alex Kim has 0 followers/following!');
      }
    }

    // 2. Check specifically for Alex Kim's relationships
    console.log('\n👤 2. Checking Alex Kim specifically...');
    
    // Alex as follower (who Alex follows)
    const { data: alexFollowing, error: followingError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', ALEX_USER_ID);

    if (!followingError) {
      console.log(`📈 Alex follows: ${alexFollowing.length} users`);
      if (alexFollowing.length > 0) {
        alexFollowing.forEach((f, i) => {
          console.log(`  ${i + 1}. ${f.following_id?.substring(0, 8)}...`);
        });
      }
    }

    // Alex as following (who follows Alex)
    const { data: alexFollowers, error: followersError } = await supabase
      .from('follows')
      .select('*')
      .eq('following_id', ALEX_USER_ID);

    if (!followersError) {
      console.log(`📈 Alex followers: ${alexFollowers.length} users`);
      if (alexFollowers.length > 0) {
        alexFollowers.forEach((f, i) => {
          console.log(`  ${i + 1}. ${f.follower_id?.substring(0, 8)}...`);
        });
      }
    }

    // 3. Check other users in the system
    console.log('\n👥 3. Checking other users for potential test follows...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!profilesError && profiles) {
      console.log(`Found ${profiles.length} users in profiles table:`);
      profiles.forEach((profile, i) => {
        const isAlex = profile.user_id === ALEX_USER_ID;
        const marker = isAlex ? ' ⭐ (Alex Kim)' : '';
        console.log(`  ${i + 1}. ${profile.username || 'No username'} (${profile.user_id.substring(0, 8)}...)${marker}`);
      });

      // 4. Create a test follow relationship if there are other users
      const otherUsers = profiles.filter(p => p.user_id !== ALEX_USER_ID);
      if (otherUsers.length > 0) {
        console.log('\n🧪 4. Creating test follow relationship...');
        const testUser = otherUsers[0];
        console.log(`Creating: ${testUser.username} → Alex Kim`);

        const { data: newFollow, error: createError } = await supabase
          .from('follows')
          .insert([{
            follower_id: testUser.user_id,
            following_id: ALEX_USER_ID
          }])
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505') {
            console.log('⚠️ Follow relationship already exists');
          } else {
            console.error('❌ Failed to create test follow:', createError.message);
          }
        } else {
          console.log('✅ Test follow relationship created!');
          console.log('Follow data:', newFollow);
          
          // Verify the count again
          const { count: newCount, error: countError } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', ALEX_USER_ID);

          if (!countError) {
            console.log(`🎉 Alex Kim now has ${newCount} followers!`);
          }
        }
      } else {
        console.log('⚠️ No other users found to create test relationships');
      }
    }

    console.log('\n=====================================');
    console.log('Investigation completed!');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

// Run the check
checkFollowSystem().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});