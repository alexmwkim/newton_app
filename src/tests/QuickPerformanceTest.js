/**
 * 빠른 성능 테스트 - 콘솔에서 즉시 실행 가능
 * 기존 컴포넌트와 최적화된 컴포넌트의 기본적인 성능 비교
 */

import { createBlock } from '../utils/blockUtils';
import { 
  measurePerformance, 
  checkMemoryUsage,
  trackRerenders 
} from '../utils/performanceUtils';

/**
 * 블록 생성 성능 테스트
 */
export const testBlockCreation = () => {
  console.log('🧪 Starting Block Creation Performance Test...');
  
  const startTime = performance.now();
  
  // 대량 블록 생성
  const blocks = [];
  for (let i = 0; i < 1000; i++) {
    blocks.push(createBlock('text', `Test content ${i}`));
    blocks.push(createBlock('card', `Card content ${i}`));
    blocks.push(createBlock('image', `https://example.com/image${i}.jpg`));
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Created ${blocks.length} blocks in ${duration.toFixed(2)}ms`);
  console.log(`📊 Average: ${(duration / blocks.length).toFixed(4)}ms per block`);
  
  return { blocks, duration, averagePerBlock: duration / blocks.length };
};

/**
 * 메모리 사용량 테스트
 */
export const testMemoryUsage = () => {
  console.log('🧪 Starting Memory Usage Test...');
  
  checkMemoryUsage('Before Test');
  
  // 메모리 집약적 작업 시뮬레이션
  const largeArray = new Array(100000).fill(0).map((_, i) => ({
    id: `block-${i}`,
    type: 'text',
    content: `Large content block ${i}`.repeat(10),
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      version: 1
    }
  }));
  
  checkMemoryUsage('After Large Array Creation');
  
  // 메모리 정리
  largeArray.length = 0;
  
  // Garbage collection 유도 (브라우저 환경에서만)
  if (global.gc) {
    global.gc();
  }
  
  setTimeout(() => {
    checkMemoryUsage('After Cleanup');
  }, 1000);
  
  console.log('✅ Memory usage test completed');
};

/**
 * 드래그 앤 드롭 성능 시뮬레이션
 */
export const testDragPerformance = () => {
  console.log('🧪 Starting Drag Performance Simulation...');
  
  const blocks = Array.from({ length: 50 }, (_, i) => 
    createBlock('card', `Card ${i}`)
  );
  
  const startTime = performance.now();
  
  // 드래그 시뮬레이션 - 모든 블록을 다른 위치로 이동
  for (let i = 0; i < blocks.length; i++) {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(i, 1);
    const newPosition = (i + 10) % blocks.length;
    newBlocks.splice(newPosition, 0, moved);
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Simulated ${blocks.length} drag operations in ${duration.toFixed(2)}ms`);
  console.log(`📊 Average: ${(duration / blocks.length).toFixed(4)}ms per drag`);
  
  return { operations: blocks.length, duration, averagePerOperation: duration / blocks.length };
};

/**
 * 텍스트 변경 성능 테스트
 */
export const testTextChangePerformance = () => {
  console.log('🧪 Starting Text Change Performance Test...');
  
  const blocks = Array.from({ length: 100 }, (_, i) => 
    createBlock('text', `Initial content ${i}`)
  );
  
  const startTime = performance.now();
  
  // 모든 블록의 텍스트 변경 시뮬레이션
  for (let i = 0; i < blocks.length; i++) {
    blocks[i] = {
      ...blocks[i],
      content: `Updated content ${i} - ${Date.now()}`
    };
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Updated ${blocks.length} text blocks in ${duration.toFixed(2)}ms`);
  console.log(`📊 Average: ${(duration / blocks.length).toFixed(4)}ms per update`);
  
  return { updates: blocks.length, duration, averagePerUpdate: duration / blocks.length };
};

/**
 * 종합 성능 벤치마크
 */
export const runComprehensiveBenchmark = () => {
  console.log('🚀 Starting Comprehensive Performance Benchmark...');
  console.log('=' .repeat(50));
  
  const results = {};
  
  // 각 테스트 실행
  results.blockCreation = testBlockCreation();
  console.log('-'.repeat(30));
  
  results.dragPerformance = testDragPerformance();
  console.log('-'.repeat(30));
  
  results.textChange = testTextChangePerformance();
  console.log('-'.repeat(30));
  
  testMemoryUsage();
  console.log('-'.repeat(30));
  
  // 종합 결과 출력
  console.log('📊 BENCHMARK SUMMARY:');
  console.log('=' .repeat(50));
  console.log(`Block Creation: ${results.blockCreation.averagePerBlock.toFixed(4)}ms/block`);
  console.log(`Drag Operations: ${results.dragPerformance.averagePerOperation.toFixed(4)}ms/operation`);
  console.log(`Text Updates: ${results.textChange.averagePerUpdate.toFixed(4)}ms/update`);
  console.log('=' .repeat(50));
  
  return results;
};

/**
 * React 컴포넌트 렌더링 성능 테스트 (모의)
 */
export const testRenderingPerformance = () => {
  console.log('🧪 Starting Rendering Performance Test (Simulation)...');
  
  const componentRenderTimes = [];
  const numTests = 100;
  
  for (let i = 0; i < numTests; i++) {
    const startTime = performance.now();
    
    // 렌더링 로직 시뮬레이션
    const mockProps = {
      blocks: Array.from({ length: 20 }, (_, j) => createBlock('text', `Content ${j}`)),
      isAuthor: true,
      focusedIndex: i % 20
    };
    
    // 컴포넌트 로직 시뮬레이션 (실제 React 렌더링 없이)
    const processedBlocks = mockProps.blocks.map(block => ({
      ...block,
      processed: true,
      renderTime: Date.now()
    }));
    
    const endTime = performance.now();
    componentRenderTimes.push(endTime - startTime);
  }
  
  const averageRenderTime = componentRenderTimes.reduce((sum, time) => sum + time, 0) / componentRenderTimes.length;
  const maxRenderTime = Math.max(...componentRenderTimes);
  const minRenderTime = Math.min(...componentRenderTimes);
  
  console.log(`✅ Completed ${numTests} render simulations`);
  console.log(`📊 Average render time: ${averageRenderTime.toFixed(4)}ms`);
  console.log(`📊 Max render time: ${maxRenderTime.toFixed(4)}ms`);
  console.log(`📊 Min render time: ${minRenderTime.toFixed(4)}ms`);
  
  return {
    tests: numTests,
    average: averageRenderTime,
    max: maxRenderTime,
    min: minRenderTime,
    times: componentRenderTimes
  };
};

// 즉시 실행 가능한 테스트 함수
export const quickTest = () => {
  console.log('⚡ Running Quick Performance Test...');
  
  const start = performance.now();
  
  // 빠른 테스트들
  testBlockCreation();
  testDragPerformance();
  testTextChangePerformance();
  
  const end = performance.now();
  
  console.log(`⚡ Quick test completed in ${(end - start).toFixed(2)}ms`);
};

// 개발 환경에서 자동 실행
if (__DEV__ && typeof global !== 'undefined') {
  // 콘솔에서 사용할 수 있도록 global에 추가
  global.performanceTest = {
    quick: quickTest,
    comprehensive: runComprehensiveBenchmark,
    blockCreation: testBlockCreation,
    dragPerformance: testDragPerformance,
    textChange: testTextChangePerformance,
    memoryUsage: testMemoryUsage,
    rendering: testRenderingPerformance
  };
  
  console.log('🛠️ Performance test functions available:');
  console.log('   performanceTest.quick()');
  console.log('   performanceTest.comprehensive()');
  console.log('   performanceTest.blockCreation()');
  console.log('   performanceTest.dragPerformance()');
  console.log('   performanceTest.textChange()');
  console.log('   performanceTest.memoryUsage()');
  console.log('   performanceTest.rendering()');
}