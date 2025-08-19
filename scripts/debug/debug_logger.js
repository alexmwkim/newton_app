/**
 * 앱 새로고침 시 로그 추적기
 */

let refreshLogs = [];

// 새로고침 시작 시 호출
global.startRefreshLogging = () => {
  refreshLogs = [];
  console.log('🔄 REFRESH LOGGING STARTED');
  console.log('============================');
  
  // console.log를 가로채서 파일에 저장
  const originalLog = console.log;
  console.log = (...args) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${args.join(' ')}`;
    refreshLogs.push(logEntry);
    originalLog(...args);
  };
};

// 새로고침 후 로그 분석
global.analyzeRefreshLogs = () => {
  console.log('🔍 REFRESH LOG ANALYSIS');
  console.log('========================');
  
  const followLogs = refreshLogs.filter(log => 
    log.includes('FOLLOW') || 
    log.includes('UNFOLLOW') || 
    log.includes('follows') ||
    log.includes('FIXING FOLLOW CACHE') ||
    log.includes('Profile') ||
    log.includes('Auth')
  );
  
  console.log(`📊 Total logs: ${refreshLogs.length}`);
  console.log(`🎯 Follow-related logs: ${followLogs.length}`);
  
  followLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  return followLogs;
};

// 로그 내보내기
global.exportRefreshLogs = () => {
  const logText = refreshLogs.join('\n');
  console.log('📄 FULL LOG EXPORT:');
  console.log(logText);
  return logText;
};

console.log('🔄 Refresh Logger initialized');
console.log('사용법:');
console.log('1. startRefreshLogging() - 새로고침 전 실행');
console.log('2. 앱 새로고침');
console.log('3. analyzeRefreshLogs() - 분석');