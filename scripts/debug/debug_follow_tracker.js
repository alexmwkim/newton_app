/**
 * 팔로우 추적기 - 화면에 직접 표시
 */

let followLog = [];

// 전역 함수로 등록
global.trackFollow = (action, data) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `${timestamp} - ${action}: ${JSON.stringify(data)}`;
  
  followLog.push(logEntry);
  
  // 최근 10개만 유지
  if (followLog.length > 10) {
    followLog = followLog.slice(-10);
  }
  
  // 콘솔과 화면 알림 둘 다 출력
  console.log(`📱 FOLLOW TRACKER: ${logEntry}`);
  
  // 중요한 이벤트는 alert로도 표시
  if (action.includes('FOLLOW') || action.includes('UNFOLLOW')) {
    setTimeout(() => {
      alert(`📱 ${action}\n${JSON.stringify(data, null, 2)}`);
    }, 100);
  }
};

// 로그 조회 함수
global.getFollowLog = () => {
  console.log('📱 RECENT FOLLOW ACTIVITY:');
  followLog.forEach(log => console.log(log));
  return followLog;
};

// 로그 초기화
global.clearFollowLog = () => {
  followLog = [];
  console.log('📱 Follow log cleared');
};

console.log('📱 Follow tracker initialized');
console.log('📱 사용법: getFollowLog() - 최근 활동 보기');
console.log('📱 사용법: clearFollowLog() - 로그 초기화');