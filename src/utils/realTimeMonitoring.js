/**
 * 실시간 시스템 모니터링
 * 앱이 실행되는 동안 지속적으로 시스템 상태를 모니터링
 */

import UnifiedFollowService from '../services/UnifiedFollowService';
import notificationService from '../services/notifications';

class RealTimeMonitor {
  constructor() {
    this.isRunning = false;
    this.metrics = {
      followActionsCount: 0,
      notificationsSent: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
      errorCount: 0,
      lastError: null
    };
    this.interval = null;
    this.actionTimes = [];
  }

  /**
   * 모니터링 시작
   */
  start(intervalMs = 30000) { // 30초마다 체크
    if (this.isRunning) {
      console.log('📊 Real-time monitoring already running');
      return;
    }

    console.log('🚀 Starting real-time system monitoring...');
    this.isRunning = true;

    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // 초기 메트릭 수집
    this.collectMetrics();
  }

  /**
   * 모니터링 중지
   */
  stop() {
    if (!this.isRunning) {
      console.log('📊 Real-time monitoring not running');
      return;
    }

    console.log('🛑 Stopping real-time system monitoring...');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * 메트릭 수집
   */
  async collectMetrics() {
    try {
      console.log('📊 Collecting system metrics...');

      // 캐시 통계
      const cacheStats = UnifiedFollowService.getCacheStats();
      if (cacheStats) {
        this.metrics.cacheHitRate = Math.round((cacheStats.size / cacheStats.maxSize) * 100);
      }

      // 평균 응답 시간 계산
      if (this.actionTimes.length > 0) {
        this.metrics.avgResponseTime = Math.round(
          this.actionTimes.reduce((a, b) => a + b, 0) / this.actionTimes.length
        );
        
        // 최근 10개 액션만 유지
        if (this.actionTimes.length > 10) {
          this.actionTimes = this.actionTimes.slice(-10);
        }
      }

      // 메트릭 출력
      this.reportMetrics();

    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.lastError = error.message;
      console.error('❌ Error collecting metrics:', error);
    }
  }

  /**
   * 팔로우 액션 기록
   */
  recordFollowAction(responseTime) {
    this.metrics.followActionsCount++;
    if (responseTime) {
      this.actionTimes.push(responseTime);
    }
    console.log(`📈 Follow action recorded: ${responseTime}ms`);
  }

  /**
   * 노티피케이션 전송 기록
   */
  recordNotification() {
    this.metrics.notificationsSent++;
    console.log('📢 Notification sent recorded');
  }

  /**
   * 에러 기록
   */
  recordError(error) {
    this.metrics.errorCount++;
    this.metrics.lastError = error;
    console.error('❌ Error recorded:', error);
  }

  /**
   * 메트릭 보고
   */
  reportMetrics() {
    const timestamp = new Date().toLocaleTimeString();
    
    console.log('\n📊 REAL-TIME SYSTEM METRICS');
    console.log('===========================');
    console.log(`Time: ${timestamp}`);
    console.log(`🎯 Follow Actions: ${this.metrics.followActionsCount}`);
    console.log(`📢 Notifications: ${this.metrics.notificationsSent}`);
    console.log(`💾 Cache Hit Rate: ${this.metrics.cacheHitRate}%`);
    console.log(`⚡ Avg Response: ${this.metrics.avgResponseTime}ms`);
    console.log(`❌ Error Count: ${this.metrics.errorCount}`);
    
    if (this.metrics.lastError) {
      console.log(`🔍 Last Error: ${this.metrics.lastError}`);
    }
    
    console.log('===========================\n');
  }

  /**
   * 상세 리포트 생성
   */
  generateReport() {
    const uptime = this.isRunning ? 'Running' : 'Stopped';
    
    return {
      status: uptime,
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 성능 개선 권장사항 생성
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.avgResponseTime > 500) {
      recommendations.push('⚠️ Average response time is high. Consider optimizing database queries.');
    }

    if (this.metrics.cacheHitRate < 50) {
      recommendations.push('💾 Low cache hit rate. Consider increasing cache size or improving caching strategy.');
    }

    if (this.metrics.errorCount > 5) {
      recommendations.push('❌ High error count. Check system logs and fix issues.');
    }

    if (this.metrics.avgResponseTime < 200) {
      recommendations.push('🚀 Excellent response times! System is performing well.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ System is running smoothly with good performance.');
    }

    return recommendations;
  }

  /**
   * 현재 메트릭 반환
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 메트릭 리셋
   */
  resetMetrics() {
    this.metrics = {
      followActionsCount: 0,
      notificationsSent: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
      errorCount: 0,
      lastError: null
    };
    this.actionTimes = [];
    console.log('🔄 Metrics reset');
  }
}

// 싱글톤 인스턴스
const monitor = new RealTimeMonitor();

// 글로벌 함수 등록 (개발 모드)
if (__DEV__ && typeof global !== 'undefined') {
  global.startMonitoring = () => monitor.start();
  global.stopMonitoring = () => monitor.stop();
  global.getMetrics = () => monitor.getMetrics();
  global.generateReport = () => monitor.generateReport();
  global.resetMetrics = () => monitor.resetMetrics();
  
  // 자동 시작 (앱 시작 후 10초 뒤)
  setTimeout(() => {
    console.log('🔄 Auto-starting real-time monitoring...');
    monitor.start();
  }, 10000);
}

export default monitor;