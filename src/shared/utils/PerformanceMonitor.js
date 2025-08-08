/**
 * 성능 모니터링 유틸리티
 * React Native 앱의 성능을 측정하고 모니터링
 */
import React from 'react';

class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
    this.renderCounts = new Map();
    this.isEnabled = __DEV__; // 개발 모드에서만 활성화
  }

  /**
   * 성능 측정 시작
   */
  start(name) {
    if (!this.isEnabled) return;
    
    this.measurements.set(name, {
      startTime: Date.now(),
      startMemory: this.getCurrentMemoryUsage(),
    });
  }

  /**
   * 성능 측정 종료 및 결과 반환
   */
  end(name) {
    if (!this.isEnabled) return null;

    const measurement = this.measurements.get(name);
    if (!measurement) {
      console.warn(`Performance measurement '${name}' was not started`);
      return null;
    }

    const endTime = Date.now();
    const endMemory = this.getCurrentMemoryUsage();
    
    const result = {
      name,
      duration: endTime - measurement.startTime,
      memoryDelta: endMemory - measurement.startMemory,
      timestamp: new Date().toISOString(),
    };

    this.measurements.delete(name);
    
    // 로그 출력
    this.logPerformance(result);
    
    return result;
  }

  /**
   * 컴포넌트 렌더링 횟수 추적
   */
  trackRender(componentName) {
    if (!this.isEnabled) return;

    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
    
    if (count > 0 && count % 10 === 0) {
      console.log(`🔄 ${componentName} rendered ${count} times`);
    }
  }

  /**
   * 현재 메모리 사용량 추정 (근사값)
   */
  getCurrentMemoryUsage() {
    if (global.performance && global.performance.memory) {
      return global.performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0; // React Native에서는 정확한 메모리 정보를 얻기 어려움
  }

  /**
   * API 호출 성능 측정
   */
  async measureApiCall(name, apiCall) {
    if (!this.isEnabled) {
      return await apiCall();
    }

    this.start(`API_${name}`);
    
    try {
      const result = await apiCall();
      this.end(`API_${name}`);
      return result;
    } catch (error) {
      this.end(`API_${name}`);
      throw error;
    }
  }

  /**
   * 성능 결과 로깅
   */
  logPerformance(result) {
    const { name, duration, memoryDelta } = result;
    
    let emoji = '⚡';
    if (duration > 1000) emoji = '🐌'; // 1초 이상
    else if (duration > 500) emoji = '⚠️'; // 500ms 이상
    else if (duration < 100) emoji = '🚀'; // 100ms 미만

    console.log(
      `${emoji} Performance [${name}]: ${duration}ms` + 
      (memoryDelta !== 0 ? `, Memory: ${memoryDelta.toFixed(2)}MB` : '')
    );
  }

  /**
   * 성능 통계 조회
   */
  getStats() {
    if (!this.isEnabled) return null;

    return {
      renderCounts: Object.fromEntries(this.renderCounts),
      activeMeasurements: Array.from(this.measurements.keys()),
      totalComponents: this.renderCounts.size,
    };
  }

  /**
   * 통계 초기화
   */
  reset() {
    this.measurements.clear();
    this.renderCounts.clear();
  }

  /**
   * React 컴포넌트 성능 측정 HOC
   */
  withPerformanceTracking(Component, componentName) {
    if (!this.isEnabled) return Component;

    const WrappedComponent = (props) => {
      this.trackRender(componentName || Component.name || 'UnnamedComponent');
      return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `withPerformanceTracking(${componentName || Component.name})`;
    return WrappedComponent;
  }

  /**
   * 렌더링 성능 측정 훅
   */
  useRenderPerformance(componentName) {
    if (!this.isEnabled) return () => {};

    return () => {
      this.trackRender(componentName);
    };
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

/**
 * 성능 측정 데코레이터
 */
export const measurePerformance = (name) => {
  return (target, propertyKey, descriptor) => {
    if (!__DEV__) return descriptor;

    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      performanceMonitor.start(`${target.constructor.name}.${propertyKey}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.end(`${target.constructor.name}.${propertyKey}`);
        return result;
      } catch (error) {
        performanceMonitor.end(`${target.constructor.name}.${propertyKey}`);
        throw error;
      }
    };
    
    return descriptor;
  };
};

/**
 * React 컴포넌트용 성능 추적 훅
 */
export const usePerformanceTracking = (componentName) => {
  const trackRender = performanceMonitor.useRenderPerformance(componentName);
  
  React.useEffect(() => {
    trackRender();
  });

  return {
    measureOperation: (name, operation) => {
      return performanceMonitor.measureApiCall(name, operation);
    },
    getStats: () => performanceMonitor.getStats(),
  };
};