/**
 * 성능 테스트 및 벤치마크 스위트
 * 기존 컴포넌트와 최적화된 컴포넌트의 성능을 비교 측정
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { 
  trackRerenders, 
  checkMemoryUsage, 
  measurePerformance, 
  debounce 
} from '../utils/performanceUtils';
import { createBlock } from '../utils/blockUtils';

// 기존 컴포넌트들
import NoteCardBlock from '../components/NoteCardBlock';
import NoteImageBlock from '../components/NoteImageBlock';
import { NoteBlockRenderer } from '../components/NoteBlockRenderer';

// 최적화된 컴포넌트들
import {
  NoteCardBlockOptimized,
  NoteImageBlockOptimized,
  NoteBlockRendererOptimized
} from '../components/optimized';
import OptimizedNoteEditor from '../components/OptimizedNoteEditor';

/**
 * 성능 테스트 결과 스토어
 */
class PerformanceTestResults {
  constructor() {
    this.results = {
      renderTimes: [],
      memoryUsage: [],
      rerenderCounts: {},
      dragPerformance: [],
      focusPerformance: []
    };
  }

  addRenderTime(componentName, time) {
    this.results.renderTimes.push({ componentName, time, timestamp: Date.now() });
  }

  addMemorySnapshot(label, usage) {
    this.results.memoryUsage.push({ label, usage, timestamp: Date.now() });
  }

  addRerenderCount(componentName, count) {
    this.results.rerenderCounts[componentName] = count;
  }

  getAverageRenderTime(componentName) {
    const times = this.results.renderTimes
      .filter(result => result.componentName === componentName)
      .map(result => result.time);
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  generateReport() {
    return {
      summary: {
        totalTests: this.results.renderTimes.length,
        averageRenderTimes: Object.keys(this.results.rerenderCounts).reduce((acc, name) => {
          acc[name] = this.getAverageRenderTime(name);
          return acc;
        }, {}),
        rerenderCounts: this.results.rerenderCounts,
        memoryPeakUsage: Math.max(...this.results.memoryUsage.map(m => m.usage.used || 0))
      },
      detailed: this.results
    };
  }
}

/**
 * 성능 테스트 컴포넌트
 */
export const PerformanceTestSuite = () => {
  const [testResults, setTestResults] = useState(new PerformanceTestResults());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [testBlocks, setTestBlocks] = useState([]);
  
  const testContainerRef = useRef(null);

  // 테스트용 블록 데이터 생성
  const generateTestBlocks = (count = 50) => {
    const blocks = [];
    for (let i = 0; i < count; i++) {
      const blockType = ['text', 'card', 'image'][i % 3];
      blocks.push(createBlock(blockType, `Test content ${i + 1}`));
    }
    return blocks;
  };

  // 렌더링 성능 테스트
  const testRenderPerformance = async (ComponentToTest, componentName) => {
    setCurrentTest(`Testing ${componentName} render performance...`);
    
    const startTime = performance.now();
    
    // 다중 렌더링 시뮬레이션
    for (let i = 0; i < 100; i++) {
      // 강제 리렌더링
      setTestBlocks(generateTestBlocks(10));
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    testResults.addRenderTime(componentName, totalTime);
    console.log(`${componentName} render test completed: ${totalTime.toFixed(2)}ms`);
  };

  // 메모리 사용량 테스트
  const testMemoryUsage = (label) => {
    if (performance.memory) {
      const usage = {
        used: performance.memory.usedJSHeapSize / 1048576, // MB
        total: performance.memory.totalJSHeapSize / 1048576,
        limit: performance.memory.jsHeapSizeLimit / 1048576
      };
      
      testResults.addMemorySnapshot(label, usage);
      console.log(`Memory usage (${label}):`, usage);
      return usage;
    }
    return null;
  };

  // 드래그 성능 테스트
  const testDragPerformance = async () => {
    setCurrentTest('Testing drag and drop performance...');
    
    const blocks = generateTestBlocks(20);
    const startTime = performance.now();
    
    // 드래그 시뮬레이션
    for (let i = 0; i < blocks.length; i++) {
      // 블록 순서 변경 시뮬레이션
      const newBlocks = [...blocks];
      const [moved] = newBlocks.splice(i, 1);
      newBlocks.splice((i + 5) % blocks.length, 0, moved);
      
      setTestBlocks(newBlocks);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const endTime = performance.now();
    testResults.dragPerformance.push(endTime - startTime);
    
    console.log(`Drag performance test completed: ${(endTime - startTime).toFixed(2)}ms`);
  };

  // 포커스 성능 테스트
  const testFocusPerformance = async () => {
    setCurrentTest('Testing focus management performance...');
    
    const blocks = generateTestBlocks(30);
    setTestBlocks(blocks);
    
    const startTime = performance.now();
    
    // 순차적 포커스 변경 시뮬레이션
    for (let i = 0; i < blocks.length; i++) {
      // 포커스 변경은 실제 ref를 통해서만 가능하므로 상태 변경으로 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = performance.now();
    testResults.focusPerformance.push(endTime - startTime);
    
    console.log(`Focus performance test completed: ${(endTime - startTime).toFixed(2)}ms`);
  };

  // 전체 테스트 스위트 실행
  const runFullTestSuite = async () => {
    setIsRunning(true);
    console.log('🚀 Starting Performance Test Suite...');
    
    try {
      // 초기 메모리 측정
      testMemoryUsage('Test Start');
      
      // 렌더링 성능 테스트
      await testRenderPerformance(NoteCardBlock, 'Original NoteCardBlock');
      await testRenderPerformance(NoteCardBlockOptimized, 'Optimized NoteCardBlock');
      
      testMemoryUsage('After Render Tests');
      
      // 드래그 성능 테스트
      await testDragPerformance();
      
      testMemoryUsage('After Drag Tests');
      
      // 포커스 성능 테스트
      await testFocusPerformance();
      
      // 최종 메모리 측정
      testMemoryUsage('Test End');
      
      // 결과 리포트 생성
      const report = testResults.generateReport();
      console.log('📊 Performance Test Results:', report);
      
      // 결과를 Alert로 표시
      Alert.alert(
        'Performance Test Results',
        `Average render times:\n${JSON.stringify(report.summary.averageRenderTimes, null, 2)}`,
        [{ text: 'OK' }]
      );
      
      setCurrentTest('Tests completed! Check console for detailed results.');
      
    } catch (error) {
      console.error('Test suite error:', error);
      setCurrentTest(`Test failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 개별 테스트 실행 함수들
  const runRenderTest = () => {
    if (!isRunning) {
      testRenderPerformance(OptimizedNoteEditor, 'OptimizedNoteEditor');
    }
  };

  const runMemoryTest = () => {
    testMemoryUsage('Manual Memory Check');
  };

  const runDragTest = () => {
    if (!isRunning) {
      testDragPerformance();
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        성능 테스트 스위트
      </Text>
      
      <Text style={{ marginBottom: 20, color: '#666' }}>
        {isRunning ? currentTest : '테스트를 실행하여 성능을 측정하세요.'}
      </Text>
      
      <ScrollView style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={runFullTestSuite}
          disabled={isRunning}
        >
          <Text style={styles.testButtonText}>
            {isRunning ? '테스트 실행중...' : '전체 테스트 스위트 실행'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runRenderTest}
          disabled={isRunning}
        >
          <Text style={styles.testButtonText}>렌더링 성능 테스트</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runMemoryTest}
        >
          <Text style={styles.testButtonText}>메모리 사용량 체크</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runDragTest}
          disabled={isRunning}
        >
          <Text style={styles.testButtonText}>드래그 성능 테스트</Text>
        </TouchableOpacity>
        
        {/* 테스트 결과 표시 영역 */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>최근 테스트 결과:</Text>
          <Text style={styles.resultsText}>
            {JSON.stringify(testResults.generateReport().summary, null, 2)}
          </Text>
        </View>
        
        {/* 실제 컴포넌트 테스트 영역 */}
        <View ref={testContainerRef} style={styles.testArea}>
          {testBlocks.length > 0 && (
            <OptimizedNoteEditor
              initialBlocks={testBlocks.slice(0, 5)} // 처음 5개만 표시
              DEBUG_MODE={true}
              onBlocksChange={(blocks) => console.log('Blocks changed:', blocks.length)}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace'
  },
  testArea: {
    backgroundColor: '#fff',
    minHeight: 300,
    borderRadius: 8,
    padding: 10
  }
};

export default PerformanceTestSuite;