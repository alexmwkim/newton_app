/**
 * 개발자 대시보드 - 모든 시스템 상태를 한눈에 확인
 * Newton 앱의 전체적인 상태를 모니터링하고 관리하는 통합 대시보드
 */

// Integration test and monitoring disabled - debug files cleaned up

class DeveloperDashboard {
  constructor() {
    this.isVisible = false;
    this.refreshInterval = null;
  }

  /**
   * 대시보드 표시
   */
  show() {
    if (this.isVisible) {
      console.log('📊 Developer dashboard already visible');
      return;
    }

    this.isVisible = true;
    this.displayHeader();
    this.displayCurrentStatus();
    this.startAutoRefresh();
    this.displayAvailableCommands();
  }

  /**
   * 대시보드 숨김
   */
  hide() {
    this.isVisible = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    console.clear();
    console.log('📊 Developer dashboard hidden');
  }

  /**
   * 대시보드 헤더 표시
   */
  displayHeader() {
    console.log('\n');
    console.log('🚀 ========================================');
    console.log('🚀   NEWTON APP DEVELOPER DASHBOARD');
    console.log('🚀 ========================================');
    console.log(`🕒 ${new Date().toLocaleString()}`);
    console.log('');
  }

  /**
   * 현재 상태 표시
   */
  async displayCurrentStatus() {
    try {
      console.log('📊 CURRENT SYSTEM STATUS');
      console.log('========================');

      // 실시간 메트릭 (disabled for production)
      // Monitoring disabled - debug files cleaned up
      console.log('⚡ System Status:');
      console.log('   Real-time monitoring: Disabled');
      console.log('   Performance: Optimized for production');
      console.log('   Memory usage: Reduced');
      console.log('   Background tasks: Minimal');

      console.log('');
      
    } catch (error) {
      console.error('❌ Error displaying status:', error.message);
    }
  }

  /**
   * 자동 새로고침 시작
   */
  startAutoRefresh() {
    // 30초마다 상태 업데이트
    this.refreshInterval = setInterval(() => {
      if (this.isVisible) {
        console.clear();
        this.displayHeader();
        this.displayCurrentStatus();
        this.displayAvailableCommands();
      }
    }, 30000);
  }

  /**
   * 사용 가능한 명령어 표시
   */
  displayAvailableCommands() {
    console.log('🔧 AVAILABLE COMMANDS');
    console.log('====================');
    console.log('📊 System Monitoring:');
    console.log('   global.showDashboard()        - Show this dashboard');
    console.log('   global.hideDashboard()        - Hide dashboard');
    console.log('   global.runFullIntegrationTest() - Full system test');
    console.log('   global.runSystemHealthCheck() - Quick health check');
    console.log('   global.runPerformanceTest()   - Performance test');
    console.log('');
    console.log('📈 System Performance:');
    console.log('   Real-time monitoring disabled for production');
    console.log('   Use browser dev tools for performance analysis');
    console.log('');
    console.log('🔧 Follow System:');
    console.log('   global.forceRefreshFollowCounts() - Force refresh counts');
    console.log('   global.debugFollowState()      - Debug follow state');
    console.log('');
    console.log('🔔 Notifications (Universal):');
    console.log('   global.testNotificationForAnyUser() - Test with current user');
    console.log('   global.createTestNotificationNow() - Create test notification');
    console.log('   global.checkMyNotifications() - Check my notifications');
    console.log('   global.getCurrentUserInfo() - Show current user info');
    console.log('');
    console.log('🌐 Network:');
    console.log('   global.runQuickTest()         - Network diagnostic');
    console.log('');
    console.log('💡 TIP: Use these commands in the React Native console to debug and monitor your app!');
    console.log('');
  }
}

// 싱글톤 인스턴스
const dashboard = new DeveloperDashboard();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.showDashboard = () => dashboard.show();
  global.hideDashboard = () => dashboard.hide();
  
  // 환영 메시지
  setTimeout(() => {
    console.log('\n🚀 Newton App Developer Tools Ready!');
    console.log('💡 Type global.showDashboard() to see the developer dashboard');
  }, 1000);
}

export default dashboard;