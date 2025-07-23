/**
 * React Native Log Analyzer
 * Advanced logging system with error pattern detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class LogAnalyzer {
  constructor() {
    this.logs = [];
    this.errorPatterns = new Map();
    this.performanceMetrics = new Map();
    this.isEnabled = __DEV__;
    this.maxLogs = 1000; // Prevent memory issues
    
    // Initialize patterns we want to track
    this.initializePatterns();
    
    // Override console methods to capture logs
    if (this.isEnabled) {
      this.interceptConsole();
    }
  }

  initializePatterns() {
    // React Native specific error patterns
    this.errorPatterns.set('METRO_CONNECTION', {
      pattern: /Could not connect to development server|Metro|development server/i,
      category: 'DEVELOPMENT',
      severity: 'HIGH',
      suggestion: 'Check Metro bundler and development server connection',
    });

    this.errorPatterns.set('SUPABASE_AUTH', {
      pattern: /authentication|auth|login|session/i,
      category: 'AUTHENTICATION', 
      severity: 'HIGH',
      suggestion: 'Check Supabase authentication setup and user session',
    });

    this.errorPatterns.set('SUPABASE_QUERY', {
      pattern: /relationship|foreign key|RLS|row level security/i,
      category: 'DATABASE',
      severity: 'HIGH', 
      suggestion: 'Database relationship or permission issue - check schema',
    });

    this.errorPatterns.set('NAVIGATION', {
      pattern: /navigation|navigator|screen|route/i,
      category: 'NAVIGATION',
      severity: 'MEDIUM',
      suggestion: 'React Navigation routing issue',
    });

    this.errorPatterns.set('RENDER_ERROR', {
      pattern: /render|component|element type is invalid|undefined is not a function/i,
      category: 'RENDERING',
      severity: 'HIGH',
      suggestion: 'Component or rendering error - check imports and props',
    });

    this.errorPatterns.set('NETWORK', {
      pattern: /network|fetch|request|timeout|connection/i,
      category: 'NETWORK',
      severity: 'MEDIUM',
      suggestion: 'Network connectivity or API request issue',
    });
  }

  interceptConsole() {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      this.addLog('ERROR', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addLog('WARN', args);
      originalWarn.apply(console, args);
    };

    console.log = (...args) => {
      this.addLog('LOG', args);
      originalLog.apply(console, args);
    };
  }

  addLog(level, args) {
    if (!this.isEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      args: args,
      stack: level === 'ERROR' ? new Error().stack : null,
    };

    // Analyze the log for patterns
    const analysis = this.analyzeLogEntry(logEntry);
    if (analysis) {
      logEntry.analysis = analysis;
    }

    this.logs.push(logEntry);

    // Keep only recent logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // For critical errors, show immediate notification
    if (level === 'ERROR' && analysis && analysis.severity === 'HIGH') {
      this.notifyImportantError(logEntry);
    }
  }

  analyzeLogEntry(logEntry) {
    const message = logEntry.message.toLowerCase();
    
    for (const [patternName, patternData] of this.errorPatterns) {
      if (patternData.pattern.test(message)) {
        return {
          pattern: patternName,
          category: patternData.category,
          severity: patternData.severity,
          suggestion: patternData.suggestion,
          matchedText: message,
        };
      }
    }

    return null;
  }

  notifyImportantError(logEntry) {
    const notification = {
      title: `🚨 ${logEntry.analysis.category} Error Detected`,
      message: logEntry.analysis.suggestion,
      error: logEntry.message.substring(0, 100) + '...',
      timestamp: logEntry.timestamp,
    };

    console.warn('🔍 LOG ANALYZER ALERT:', notification);
  }

  // Get logs by category
  getLogsByCategory(category) {
    return this.logs.filter(log => 
      log.analysis && log.analysis.category === category
    );
  }

  // Get error summary
  getErrorSummary() {
    const errors = this.logs.filter(log => log.level === 'ERROR');
    const categorized = errors.reduce((acc, error) => {
      const category = error.analysis?.category || 'UNKNOWN';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const recentErrors = errors.slice(-10);

    return {
      totalErrors: errors.length,
      categorized,
      recentErrors,
      criticalErrors: errors.filter(e => e.analysis?.severity === 'HIGH'),
    };
  }

  // Performance monitoring
  startPerformanceTimer(label) {
    if (!this.isEnabled) return;
    
    this.performanceMetrics.set(label, {
      startTime: Date.now(),
      label,
    });
  }

  endPerformanceTimer(label) {
    if (!this.isEnabled) return;

    const metric = this.performanceMetrics.get(label);
    if (!metric) return;

    const duration = Date.now() - metric.startTime;
    const result = {
      ...metric,
      endTime: Date.now(),
      duration,
      timestamp: new Date().toISOString(),
    };

    // Log slow operations
    if (duration > 1000) {
      console.warn(`⏱️ SLOW OPERATION: ${label} took ${duration}ms`);
    }

    this.performanceMetrics.set(label, result);
    return result;
  }

  // Network request monitoring
  monitorNetworkRequest(url, method = 'GET') {
    if (!this.isEnabled) return { end: () => {} };

    const requestId = `${method}_${url}_${Date.now()}`;
    this.startPerformanceTimer(requestId);

    return {
      end: (success = true, statusCode = null) => {
        const result = this.endPerformanceTimer(requestId);
        
        const networkLog = {
          timestamp: new Date().toISOString(),
          level: success ? 'LOG' : 'ERROR',
          message: `${method} ${url} - ${success ? 'SUCCESS' : 'FAILED'}`,
          args: [{
            url,
            method,
            success,
            statusCode,
            duration: result?.duration,
          }],
          analysis: {
            category: 'NETWORK',
            severity: success ? 'LOW' : 'MEDIUM',
            suggestion: success 
              ? 'Network request completed successfully'
              : 'Network request failed - check connectivity and API status',
          }
        };

        this.logs.push(networkLog);
      }
    };
  }

  // Export logs for debugging
  async exportLogs() {
    if (!this.isEnabled) return null;

    const exportData = {
      logs: this.logs,
      summary: this.getErrorSummary(),
      performance: Array.from(this.performanceMetrics.entries()),
      exportedAt: new Date().toISOString(),
      appInfo: {
        platform: 'React Native',
      },
    };

    try {
      await AsyncStorage.setItem('@newton_logs_export', JSON.stringify(exportData));
      console.log('📤 Logs exported to AsyncStorage');
      return exportData;
    } catch (error) {
      console.error('Failed to export logs:', error);
      return exportData;
    }
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.performanceMetrics.clear();
    console.log('🧹 Log analyzer cleared');
  }

  // Get debugging dashboard data
  getDashboardData() {
    if (!this.isEnabled) return null;

    const recentLogs = this.logs.slice(-50);
    const errorSummary = this.getErrorSummary();
    
    return {
      recentLogs,
      errorSummary,
      totalLogs: this.logs.length,
      performanceMetrics: Array.from(this.performanceMetrics.entries())
        .filter(([key, value]) => value.duration)
        .sort((a, b) => b[1].duration - a[1].duration)
        .slice(0, 10),
    };
  }
}

// Create global instance
const logAnalyzer = new LogAnalyzer();

// Add to global scope for easy access in development
if (__DEV__) {
  global.logAnalyzer = logAnalyzer;
  
  // Add helpful debugging commands
  global.showLogs = () => console.table(logAnalyzer.getDashboardData());
  global.clearLogs = () => logAnalyzer.clearLogs();
  global.exportLogs = () => logAnalyzer.exportLogs();
}

export default logAnalyzer;