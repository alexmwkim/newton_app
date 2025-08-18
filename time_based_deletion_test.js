/**
 * 시간 기반 자동 삭제 테스트
 */

import { supabase } from './src/services/supabase.js';

const DAVID_LEE_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
const ALEX_KIM_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';

async function timeBasedDeletionTest() {
  console.log('⏰ TIME-BASED DELETION TEST');
  console.log('============================');
  
  let checkCount = 0;
  
  // 10초마다 데이터베이스 확인
  const checkInterval = setInterval(async () => {
    checkCount++;
    console.log(`\n⏰ Check ${checkCount} - ${new Date().toLocaleTimeString()}`);
    
    try {
      // David Lee의 팔로우 확인
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', DAVID_LEE_ID)
        .eq('following_id', ALEX_KIM_ID);
      
      if (error) {
        console.error('❌ Query error:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log(`✅ Follow exists: ${data[0].created_at}`);
        const ageMinutes = (Date.now() - new Date(data[0].created_at)) / 60000;
        console.log(`📊 Age: ${ageMinutes.toFixed(1)} minutes`);
      } else {
        console.log('❌ Follow relationship NOT FOUND');
        console.log('🚨 DELETION DETECTED!');
        clearInterval(checkInterval);
        
        // 삭제 시점 기록
        console.log(`🕐 Deletion occurred between check ${checkCount-1} and ${checkCount}`);
        console.log(`⏰ Approximate deletion time: ${new Date().toLocaleTimeString()}`);
      }
    } catch (error) {
      console.error('❌ Check failed:', error);
    }
  }, 10000); // 10초마다 확인
  
  // 5분 후 자동 중지
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('\n⏰ Test completed after 5 minutes');
  }, 300000);
  
  console.log('⏰ Starting monitoring... (checking every 10 seconds for 5 minutes)');
  console.log('📱 Now follow David Lee → Alex Kim and wait...');
}

// React Native 전역에 등록
if (typeof global !== 'undefined') {
  global.timeBasedDeletionTest = timeBasedDeletionTest;
  console.log('💡 사용법: timeBasedDeletionTest()를 실행 후 팔로우하세요');
}

export { timeBasedDeletionTest };