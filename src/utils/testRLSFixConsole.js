/**
 * Console test for RLS fix verification
 */

// Test notification creation after RLS fix
const testNotificationAfterRLSFix = async () => {
  try {
    console.log('🧪 TESTING NOTIFICATION CREATION AFTER RLS FIX');
    console.log('===============================================');
    
    const notificationService = require('../services/notifications').default;
    
    // Test creating a follow notification
    console.log('📝 Creating follow notification...');
    const result = await notificationService.createFollowNotification(
      'e7cc75eb-9ed4-42b9-95d6-88ff615aac22', // David Lee
      '10663749-9fba-4039-9f22-d6e7add9ea2d'  // Alex Kim
    );
    
    console.log('📱 Result:', result);
    
    if (result.success) {
      console.log('✅ SUCCESS! Notification created successfully');
      console.log('   Notification ID:', result.data?.id);
      console.log('   Created at:', result.data?.created_at);
      
      // Test fetching notifications
      console.log('\n📬 Fetching notifications for Alex Kim...');
      const fetchResult = await notificationService.getUserNotifications(
        '10663749-9fba-4039-9f22-d6e7add9ea2d',
        5, 0
      );
      
      if (fetchResult.success) {
        console.log(`📨 Found ${fetchResult.data.length} notifications:`);
        fetchResult.data.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.type}: "${notif.message}" (${notif.created_at})`);
        });
      } else {
        console.log('❌ Failed to fetch notifications:', fetchResult.error);
      }
      
    } else {
      console.log('❌ FAILED! Notification creation failed');
      console.log('   Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
};

// Register global function
if (__DEV__ && typeof global !== 'undefined') {
  global.testRLSFix = testNotificationAfterRLSFix;
  console.log('🧪 RLS fix test ready! Run: global.testRLSFix()');
}

export default testNotificationAfterRLSFix;