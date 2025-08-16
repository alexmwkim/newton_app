/**
 * 성능 최적화 관련 유틸리티 함수들
 */

/**
 * 디바운스 함수 - 연속된 함수 호출을 지연시켜 성능 최적화
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * 스로틀 함수 - 일정 시간 간격으로만 함수 실행 허용
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 깊은 비교 함수 - React.memo에서 사용할 수 있는 비교 함수
 */
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

/**
 * 얕은 비교 함수 - props 비교용
 */
export const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
};

/**
 * 메모이제이션 함수 - 계산 결과를 캐시하여 성능 최적화
 */
export const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(null, args);
    cache.set(key, result);
    
    // 캐시 크기 제한 (메모리 누수 방지)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * 배치 업데이트 함수 - 여러 상태 업데이트를 배치로 처리
 */
export const batchUpdates = (updates) => {
  return new Promise((resolve) => {
    // React의 배치 업데이트를 활용하기 위해 setTimeout 사용
    setTimeout(() => {
      updates.forEach(update => {
        if (typeof update === 'function') {
          update();
        }
      });
      resolve();
    }, 0);
  });
};

/**
 * 성능 측정 데코레이터
 */
export const measurePerformance = (name) => (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args) {
    const startTime = performance.now();
    const result = originalMethod.apply(this, args);
    const endTime = performance.now();
    
    console.log(`[Performance] ${name}: ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  };
  
  return descriptor;
};

/**
 * 리렌더링 추적 함수 - 개발 중 컴포넌트 리렌더링 횟수 추적
 */
export const trackRerenders = (componentName) => {
  if (__DEV__) {
    let renderCount = 0;
    
    return () => {
      renderCount++;
      console.log(`[Rerender] ${componentName}: ${renderCount} times`);
    };
  }
  
  return () => {}; // 프로덕션에서는 아무것도 하지 않음
};

/**
 * 메모리 사용량 체크 (개발용)
 */
export const checkMemoryUsage = (label = '') => {
  if (__DEV__ && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    console.log(`[Memory ${label}]`, {
      used: `${(usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    });
  }
};

/**
 * 컴포넌트 마운트/언마운트 추적
 */
export const trackComponentLifecycle = (componentName) => {
  if (__DEV__) {
    console.log(`[Lifecycle] ${componentName} mounted`);
    
    return () => {
      console.log(`[Lifecycle] ${componentName} unmounted`);
    };
  }
  
  return () => {};
};

/**
 * 의존성 배열 변경 추적 (useEffect 디버깅용)
 */
export const trackDependencyChanges = (deps, label = '') => {
  if (__DEV__) {
    const prevDeps = trackDependencyChanges.cache = trackDependencyChanges.cache || new Map();
    
    if (prevDeps.has(label)) {
      const prev = prevDeps.get(label);
      const changes = deps.map((dep, index) => {
        if (dep !== prev[index]) {
          return { index, prev: prev[index], current: dep };
        }
        return null;
      }).filter(Boolean);
      
      if (changes.length > 0) {
        console.log(`[Dependency Changes ${label}]`, changes);
      }
    }
    
    prevDeps.set(label, [...deps]);
  }
};