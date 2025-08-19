/**
 * Simple RLS fix verification test
 * Run this in React Native console to test notifications
 */

console.log('🧪 Testing notification creation after RLS fix...');

// Test notification creation
if (typeof global !== 'undefined' && global.testNotificationAfterRLS) {
  console.log('📝 Running notification creation test...');
  global.testNotificationAfterRLS().then(() => {
    console.log('✅ Notification test completed');
  }).catch(error => {
    console.error('❌ Notification test failed:', error);
  });
} else {
  console.log('❌ Test function not available. Make sure app is loaded.');
}

// Test complete follow flow
setTimeout(() => {
  if (typeof global !== 'undefined' && global.testCompleteFollowFlow) {
    console.log('🚀 Running complete follow flow test...');
    global.testCompleteFollowFlow().then(() => {
      console.log('✅ Follow flow test completed');
    }).catch(error => {
      console.error('❌ Follow flow test failed:', error);
    });
  }
}, 2000);