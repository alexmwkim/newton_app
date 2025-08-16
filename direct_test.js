// Direct test of notification creation after RLS fix
const { supabase } = require('./src/services/supabase');
const notificationService = require('./src/services/notifications').default;

async function testDirectNotification() {
  console.log('🧪 DIRECT NOTIFICATION TEST AFTER RLS FIX');
  console.log('==========================================');

  try {
    // Initialize the service first
    console.log('🔧 Initializing notification service...');
    const initResult = await notificationService.initialize('10663749-9fba-4039-9f22-d6e7add9ea2d');
    console.log('Init result:', initResult);

    // Test creating a simple notification
    console.log('\n📝 Creating test notification...');
    const result = await notificationService.createNotification({
      recipientId: '10663749-9fba-4039-9f22-d6e7add9ea2d', // Alex Kim
      senderId: 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22',    // David Lee
      type: 'follow',
      title: 'You have a new follower',
      message: 'David Lee started following you',
      data: { sender_id: 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22', action: 'follow' },
      priority: 'high',
      relatedUserId: 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'
    });

    console.log('📱 Notification creation result:', result);

    if (result.success) {
      console.log('✅ SUCCESS! Notification created successfully');
      console.log('   ID:', result.data?.id);
      console.log('   Type:', result.data?.type);
      console.log('   Message:', result.data?.message);
    } else {
      console.log('❌ FAILED! Error:', result.error);
    }

    // Test fetching the notification
    console.log('\n📬 Fetching notifications...');
    const fetchResult = await notificationService.getUserNotifications('10663749-9fba-4039-9f22-d6e7add9ea2d', 5, 0);
    
    if (fetchResult.success) {
      console.log(`📨 Found ${fetchResult.data.length} notifications`);
      const recentNotif = fetchResult.data[0];
      if (recentNotif) {
        console.log('   Latest:', recentNotif.type, '-', recentNotif.message);
      }
    } else {
      console.log('❌ Fetch failed:', fetchResult.error);
    }

  } catch (error) {
    console.error('❌ Test exception:', error);
  }
}

if (require.main === module) {
  testDirectNotification();
}

module.exports = testDirectNotification;