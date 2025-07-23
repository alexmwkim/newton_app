/**
 * Performance Optimizer for Newton App
 * Monitors and optimizes React Native + Supabase performance
 */

import { InteractionManager, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PerformanceOptimizer {
  constructor() {
    this.metrics = new Map();
    this.queryCache = new Map();
    this.componentRenderTimes = new Map();
    this.isEnabled = __DEV__;
    this.screenDimensions = Dimensions.get('window');
    
    // Performance thresholds
    this.thresholds = {
      queryTime: 1000, // 1 second
      renderTime: 16, // 60fps = 16ms per frame
      memoryWarning: 100 * 1024 * 1024, // 100MB
      cacheSize: 50, // Max cached queries
    };

    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  initializeMonitoring() {
    // Monitor interactions for better UX
    this.setupInteractionTracking();
    
    // Monitor memory usage periodically
    this.setupMemoryMonitoring();
    
    console.log('🚀 Performance Optimizer initialized');
  }

  setupInteractionTracking() {
    // Track long-running interactions
    InteractionManager.setDeadline(300); // 300ms deadline
  }

  setupMemoryMonitoring() {
    // Check memory usage every 30 seconds in development
    if (global.performance && global.performance.memory) {
      setInterval(() => {
        const memory = global.performance.memory;
        if (memory.usedJSHeapSize > this.thresholds.memoryWarning) {
          console.warn('⚠️ High memory usage detected:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
          });
        }
      }, 30000);
    }
  }

  /**
   * Measure component render performance
   */
  measureRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();

    const startTime = Date.now();
    const result = renderFn();
    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Track render performance
    const existing = this.componentRenderTimes.get(componentName) || [];
    existing.push(renderTime);
    
    // Keep only last 10 renders
    if (existing.length > 10) {
      existing.shift();
    }
    
    this.componentRenderTimes.set(componentName, existing);

    // Warn about slow renders
    if (renderTime > this.thresholds.renderTime) {
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime}ms`);
    }

    return result;
  }

  /**
   * Query performance monitoring and caching
   */
  async optimizeQuery(queryKey, queryFn, options = {}) {
    const {
      cache = true,
      cacheTime = 5 * 60 * 1000, // 5 minutes default
      background = false
    } = options;

    // Check cache first
    if (cache && this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey);
      const now = Date.now();
      
      if (now - cached.timestamp < cacheTime) {
        console.log(`⚡ Cache hit: ${queryKey}`);
        return cached.data;
      }
    }

    // Measure query performance
    const startTime = Date.now();
    
    try {
      let result;
      
      if (background) {
        // Run in background to avoid blocking UI
        result = await new Promise((resolve, reject) => {
          InteractionManager.runAfterInteractions(async () => {
            try {
              const data = await queryFn();
              resolve(data);
            } catch (error) {
              reject(error);
            }
          });
        });
      } else {
        result = await queryFn();
      }

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Log performance metrics
      this.logQueryPerformance(queryKey, queryTime, 'SUCCESS');

      // Cache the result
      if (cache) {
        this.cacheQuery(queryKey, result);
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      this.logQueryPerformance(queryKey, queryTime, 'ERROR');
      throw error;
    }
  }

  logQueryPerformance(queryKey, time, status) {
    const metric = {
      query: queryKey,
      time,
      status,
      timestamp: Date.now()
    };

    // Store metric
    const existing = this.metrics.get('queries') || [];
    existing.push(metric);
    
    // Keep only last 100 queries
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set('queries', existing);

    // Warn about slow queries
    if (time > this.thresholds.queryTime) {
      console.warn(`🐌 Slow query: ${queryKey} took ${time}ms`);
      
      // Provide optimization suggestions
      this.suggestQueryOptimization(queryKey, time);
    } else {
      console.log(`⚡ Query: ${queryKey} completed in ${time}ms`);
    }
  }

  suggestQueryOptimization(queryKey, time) {
    const suggestions = [];

    if (queryKey.includes('notes') && time > 2000) {
      suggestions.push('Consider adding pagination to large note queries');
      suggestions.push('Use select() to limit returned columns');
    }

    if (queryKey.includes('profile') && time > 1000) {
      suggestions.push('Cache profile data for better performance');
      suggestions.push('Consider using JOIN instead of separate queries');
    }

    if (queryKey.includes('stars') && time > 1500) {
      suggestions.push('Add database indexes on user_id and note_id');
      suggestions.push('Consider denormalizing star counts');
    }

    if (suggestions.length > 0) {
      console.warn('💡 Performance suggestions for', queryKey, ':', suggestions);
    }
  }

  cacheQuery(queryKey, data) {
    // Implement LRU cache logic
    if (this.queryCache.size >= this.thresholds.cacheSize) {
      // Remove oldest cache entry
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now()
    });

    console.log(`💾 Cached query: ${queryKey}`);
  }

  /**
   * Batch queries for better performance
   */
  async batchQueries(queries) {
    console.log(`🔄 Batching ${queries.length} queries`);
    
    const startTime = Date.now();
    const results = await Promise.all(
      queries.map(async ({ key, queryFn, options }) => {
        try {
          const result = await this.optimizeQuery(key, queryFn, options);
          return { key, result, success: true };
        } catch (error) {
          return { key, error, success: false };
        }
      })
    );
    
    const endTime = Date.now();
    console.log(`⚡ Batch completed in ${endTime - startTime}ms`);
    
    return results;
  }

  /**
   * Image optimization suggestions
   */
  optimizeImageDimensions(imageWidth, imageHeight, containerWidth, containerHeight) {
    const screenWidth = this.screenDimensions.width;
    const screenHeight = this.screenDimensions.height;
    
    // Calculate optimal dimensions
    const maxWidth = Math.min(containerWidth || screenWidth, screenWidth);
    const maxHeight = Math.min(containerHeight || screenHeight, screenHeight);
    
    const aspectRatio = imageWidth / imageHeight;
    
    let optimizedWidth, optimizedHeight;
    
    if (imageWidth > maxWidth || imageHeight > maxHeight) {
      if (aspectRatio > 1) {
        // Landscape
        optimizedWidth = maxWidth;
        optimizedHeight = maxWidth / aspectRatio;
      } else {
        // Portrait
        optimizedHeight = maxHeight;
        optimizedWidth = maxHeight * aspectRatio;
      }
      
      console.log(`🖼️ Image optimization: ${imageWidth}x${imageHeight} → ${Math.round(optimizedWidth)}x${Math.round(optimizedHeight)}`);
    } else {
      optimizedWidth = imageWidth;
      optimizedHeight = imageHeight;
    }
    
    return {
      width: Math.round(optimizedWidth),
      height: Math.round(optimizedHeight),
      optimized: optimizedWidth !== imageWidth || optimizedHeight !== imageHeight
    };
  }

  /**
   * Clear cache and reset metrics
   */
  clearCache() {
    this.queryCache.clear();
    this.metrics.clear();
    this.componentRenderTimes.clear();
    console.log('🧹 Performance cache cleared');
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    if (!this.isEnabled) return null;

    const queries = this.metrics.get('queries') || [];
    
    // Calculate averages
    const avgQueryTime = queries.reduce((sum, q) => sum + q.time, 0) / queries.length || 0;
    const slowQueries = queries.filter(q => q.time > this.thresholds.queryTime);
    const failedQueries = queries.filter(q => q.status === 'ERROR');
    
    // Component render performance
    const renderStats = Array.from(this.componentRenderTimes.entries()).map(([component, times]) => ({
      component,
      avgRenderTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      maxRenderTime: Math.max(...times),
      renderCount: times.length
    }));

    return {
      queries: {
        total: queries.length,
        avgTime: Math.round(avgQueryTime),
        slowQueries: slowQueries.length,
        failedQueries: failedQueries.length,
        cacheHitRate: this.calculateCacheHitRate()
      },
      rendering: renderStats,
      cache: {
        size: this.queryCache.size,
        maxSize: this.thresholds.cacheSize
      },
      recommendations: this.generateRecommendations()
    };
  }

  calculateCacheHitRate() {
    // This would need more sophisticated tracking in a real implementation
    return Math.round((this.queryCache.size / Math.max(this.metrics.get('queries')?.length || 1, 1)) * 100);
  }

  generateRecommendations() {
    const recommendations = [];
    const queries = this.metrics.get('queries') || [];
    
    if (queries.filter(q => q.time > this.thresholds.queryTime).length > 5) {
      recommendations.push('Consider implementing query pagination');
      recommendations.push('Add database indexes for commonly used filters');
    }

    if (this.queryCache.size < 10) {
      recommendations.push('Enable more aggressive caching for read-heavy operations');
    }

    const renders = Array.from(this.componentRenderTimes.values()).flat();
    const slowRenders = renders.filter(time => time > this.thresholds.renderTime);
    
    if (slowRenders.length > 10) {
      recommendations.push('Consider using React.memo() for expensive components');
      recommendations.push('Implement virtualized lists for large datasets');
    }

    return recommendations;
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData(userId) {
    console.log('🚀 Preloading critical data for user:', userId);
    
    const criticalQueries = [
      {
        key: `user_profile_${userId}`,
        queryFn: () => this.getUserProfile(userId),
        options: { cache: true, cacheTime: 10 * 60 * 1000 } // 10 minutes
      },
      {
        key: `user_notes_${userId}`,
        queryFn: () => this.getUserNotes(userId, 10), // First 10 notes
        options: { cache: true, background: true }
      }
    ];

    return this.batchQueries(criticalQueries);
  }

  // Placeholder methods - these would be implemented with actual Supabase calls
  async getUserProfile(userId) {
    // Implementation would call actual profile service
    return { id: userId, name: 'User' };
  }

  async getUserNotes(userId, limit) {
    // Implementation would call actual notes service
    return [];
  }
}

// Create global instance
const performanceOptimizer = new PerformanceOptimizer();

// Add to global scope for development debugging
if (__DEV__) {
  global.performanceOptimizer = performanceOptimizer;
  global.showPerformance = () => console.table(performanceOptimizer.getPerformanceReport());
  global.clearPerformanceCache = () => performanceOptimizer.clearCache();
}

export default performanceOptimizer;