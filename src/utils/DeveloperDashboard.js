/**
 * Developer Dashboard for Newton App
 * Integrates all development and debugging tools
 */

import logAnalyzer from './LogAnalyzer';
import supabaseDebugger from './SupabaseDebugger';
import performanceOptimizer from './PerformanceOptimizer';
import securityUtils from './SecurityUtils';

class DeveloperDashboard {
  constructor() {
    this.isActive = __DEV__;
    this.tools = {
      logAnalyzer,
      supabaseDebugger,
      performanceOptimizer,
      securityUtils
    };

    if (this.isActive) {
      this.initializeDashboard();
    }
  }

  initializeDashboard() {
    console.log('🔧 Newton Developer Dashboard Initialized');
    this.displayWelcomeMessage();
    this.setupGlobalCommands();
    this.runInitialChecks();
  }

  displayWelcomeMessage() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 NEWTON DEVELOPER DASHBOARD              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║ 🔧 Development Tools Active:                                 ║
║   📊 Log Analyzer: Real-time error pattern detection        ║
║   🗄️ Supabase Debugger: Query relationship tracking         ║
║   ⚡ Performance Optimizer: Query & render monitoring        ║
║   🛡️ Security Utils: Environment & input validation         ║
║                                                               ║
║ 💡 Available Commands:                                       ║
║   dashboard()     - Show this dashboard                      ║
║   showLogs()      - Display recent logs and errors          ║
║   showPerf()      - Performance metrics and analysis        ║
║   showSecurity()  - Security audit results                  ║
║   showSupabase()  - Database query debugging info           ║
║   clearAll()      - Clear all caches and logs               ║
║   exportDebug()   - Export debug data for sharing           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  setupGlobalCommands() {
    // Main dashboard command
    global.dashboard = () => this.showDashboard();
    
    // Individual tool commands
    global.showLogs = () => this.showLogsSummary();
    global.showPerf = () => this.showPerformanceSummary();
    global.showSecurity = () => this.showSecuritySummary();
    global.showSupabase = () => this.showSupabaseSummary();
    
    // Utility commands
    global.clearAll = () => this.clearAllData();
    global.exportDebug = () => this.exportDebugData();
    
    // Quick health check
    global.healthCheck = () => this.runHealthCheck();
  }

  runInitialChecks() {
    console.log('🔍 Running initial system checks...');
    
    // Security check
    const securityIssues = this.tools.securityUtils.runSecurityChecks();
    if (securityIssues.environment.some(issue => issue.level === 'CRITICAL')) {
      console.error('🚨 CRITICAL SECURITY ISSUES DETECTED!');
      console.error('Run showSecurity() for details');
    }

    console.log('✅ Initial checks completed');
  }

  showDashboard() {
    const stats = this.gatherAllStats();
    
    console.log(`
╔══════════════════════ NEWTON DASHBOARD ══════════════════════╗
║                                                               ║
║ 📊 LOG ANALYZER STATUS:                                      ║
║   Total Logs: ${stats.logs.total.toString().padStart(8)}                            ║
║   Errors: ${stats.logs.errors.toString().padStart(12)}                               ║
║   Warnings: ${stats.logs.warnings.toString().padStart(10)}                             ║
║                                                               ║
║ 🗄️ SUPABASE DEBUGGER:                                        ║
║   Query Attempts: ${stats.supabase.queries.toString().padStart(7)}                         ║
║   Relationship Errors: ${stats.supabase.relationshipErrors.toString().padStart(2)}                      ║
║                                                               ║
║ ⚡ PERFORMANCE OPTIMIZER:                                     ║
║   Cached Queries: ${stats.performance.cachedQueries.toString().padStart(7)}                         ║
║   Avg Query Time: ${stats.performance.avgQueryTime.toString().padStart(6)}ms                        ║
║   Slow Queries: ${stats.performance.slowQueries.toString().padStart(9)}                           ║
║                                                               ║
║ 🛡️ SECURITY STATUS:                                          ║
║   Critical Issues: ${stats.security.critical.toString().padStart(6)}                          ║
║   Warnings: ${stats.security.warnings.toString().padStart(12)}                               ║
║   Environment OK: ${stats.security.envOk ? '✅' : '❌'}                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

💡 Use specific commands for detailed information:
   showLogs() | showPerf() | showSecurity() | showSupabase()
    `);
  }

  gatherAllStats() {
    const logReport = this.tools.logAnalyzer.getDashboardData();
    const perfReport = this.tools.performanceOptimizer.getPerformanceReport();
    const supabaseReport = this.tools.supabaseDebugger.getErrorSummary();
    const securityReport = this.tools.securityUtils.runSecurityChecks();

    return {
      logs: {
        total: logReport?.totalLogs || 0,
        errors: logReport?.errorSummary?.totalErrors || 0,
        warnings: logReport?.recentLogs?.filter(l => l.level === 'WARN').length || 0
      },
      supabase: {
        queries: supabaseReport?.totalErrors || 0,
        relationshipErrors: supabaseReport?.totalErrors || 0
      },
      performance: {
        cachedQueries: perfReport?.cache?.size || 0,
        avgQueryTime: perfReport?.queries?.avgTime || 0,
        slowQueries: perfReport?.queries?.slowQueries || 0
      },
      security: {
        critical: securityReport?.environment?.filter(i => i.level === 'CRITICAL').length || 0,
        warnings: securityReport?.environment?.filter(i => i.level === 'WARNING').length || 0,
        envOk: securityReport?.environment?.length === 0
      }
    };
  }

  showLogsSummary() {
    console.log('📊 LOG ANALYSIS SUMMARY');
    console.log('════════════════════════');
    
    const data = this.tools.logAnalyzer.getDashboardData();
    if (!data) {
      console.log('No log data available');
      return;
    }

    console.table(data.errorSummary?.categorized || {});
    
    console.log('\n🔥 Recent Critical Errors:');
    const criticalErrors = data.errorSummary?.criticalErrors?.slice(0, 5) || [];
    criticalErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message.substring(0, 80)}...`);
    });
  }

  showPerformanceSummary() {
    console.log('⚡ PERFORMANCE ANALYSIS');
    console.log('═══════════════════════');
    
    const report = this.tools.performanceOptimizer.getPerformanceReport();
    if (!report) {
      console.log('No performance data available');
      return;
    }

    console.table({
      'Total Queries': report.queries?.total || 0,
      'Avg Query Time': `${report.queries?.avgTime || 0}ms`,
      'Slow Queries': report.queries?.slowQueries || 0,
      'Failed Queries': report.queries?.failedQueries || 0,
      'Cache Hit Rate': `${report.queries?.cacheHitRate || 0}%`,
      'Cache Size': `${report.cache?.size || 0}/${report.cache?.maxSize || 0}`
    });

    if (report.recommendations?.length > 0) {
      console.log('\n💡 Performance Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }

  showSecuritySummary() {
    console.log('🛡️ SECURITY AUDIT RESULTS');
    console.log('══════════════════════════');
    
    const report = this.tools.securityUtils.runSecurityChecks();
    
    if (report.environment?.length === 0) {
      console.log('✅ No security issues detected');
    } else {
      console.log('🚨 Security Issues Found:');
      report.environment.forEach((issue, index) => {
        const icon = issue.level === 'CRITICAL' ? '🔴' : 
                    issue.level === 'ERROR' ? '🟠' : '🟡';
        console.log(`${icon} ${index + 1}. [${issue.level}] ${issue.issue}`);
        console.log(`   💡 ${issue.recommendation}`);
      });
    }

    const prodWarnings = report.production || [];
    if (prodWarnings.length > 0) {
      console.log('\n⚠️ Production Readiness Warnings:');
      prodWarnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
  }

  showSupabaseSummary() {
    console.log('🗄️ SUPABASE DEBUGGING INFO');
    console.log('═══════════════════════════');
    
    const report = this.tools.supabaseDebugger.getErrorSummary();
    if (!report) {
      console.log('No Supabase debugging data available');
      return;
    }

    if (report.totalErrors === 0) {
      console.log('✅ No relationship errors detected');
    } else {
      console.table(report.errorsByTable || {});
      
      console.log('\n🔍 Recent Relationship Errors:');
      (report.recentErrors || []).forEach((error, index) => {
        console.log(`${index + 1}. [${error.table}] ${error.error.substring(0, 60)}...`);
      });
    }
  }

  runHealthCheck() {
    console.log('🏥 RUNNING HEALTH CHECK...');
    console.log('═══════════════════════════');
    
    const issues = [];
    const warnings = [];

    // Check security
    const securityReport = this.tools.securityUtils.runSecurityChecks();
    const criticalSecurity = securityReport.environment?.filter(i => i.level === 'CRITICAL') || [];
    if (criticalSecurity.length > 0) {
      issues.push(`${criticalSecurity.length} critical security issue(s)`);
    }

    // Check performance
    const perfReport = this.tools.performanceOptimizer.getPerformanceReport();
    if (perfReport?.queries?.slowQueries > 10) {
      warnings.push('High number of slow queries detected');
    }

    // Check logs
    const logData = this.tools.logAnalyzer.getDashboardData();
    const recentErrors = logData?.errorSummary?.totalErrors || 0;
    if (recentErrors > 20) {
      warnings.push('High error rate in application logs');
    }

    // Display results
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ ALL SYSTEMS HEALTHY');
    } else {
      if (issues.length > 0) {
        console.log('🚨 CRITICAL ISSUES:');
        issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue}`);
        });
      }
      
      if (warnings.length > 0) {
        console.log('\n⚠️ WARNINGS:');
        warnings.forEach((warning, index) => {
          console.log(`${index + 1}. ${warning}`);
        });
      }
    }

    console.log('\nRun dashboard() for detailed information');
  }

  clearAllData() {
    console.log('🧹 Clearing all development data...');
    
    this.tools.logAnalyzer.clearLogs();
    this.tools.supabaseDebugger.clearLogs();
    this.tools.performanceOptimizer.clearCache();
    
    console.log('✅ All caches and logs cleared');
  }

  async exportDebugData() {
    console.log('📤 Exporting debug data...');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      logs: this.tools.logAnalyzer.exportLogs(),
      supabase: this.tools.supabaseDebugger.exportLogs(),
      performance: this.tools.performanceOptimizer.getPerformanceReport(),
      security: this.tools.securityUtils.runSecurityChecks(),
      systemInfo: {
        platform: 'React Native',
        isDev: __DEV__,
        userAgent: global.navigator?.userAgent || 'Unknown'
      }
    };

    try {
      // In a real app, this would upload to a service or save to file
      console.log('Debug data exported successfully');
      console.log('Data size:', JSON.stringify(exportData).length, 'characters');
      
      // For development, save to async storage
      if (this.tools.logAnalyzer.exportLogs) {
        await this.tools.logAnalyzer.exportLogs();
      }
      
      return exportData;
    } catch (error) {
      console.error('Failed to export debug data:', error);
    }
  }

  // Method to be called when app starts
  initialize() {
    if (this.isActive) {
      this.displayWelcomeMessage();
      setTimeout(() => {
        this.runHealthCheck();
      }, 2000); // Run health check after 2 seconds
    }
  }
}

// Create global instance
const developerDashboard = new DeveloperDashboard();

// Auto-initialize
if (__DEV__) {
  // Add small delay to ensure all other tools are loaded
  setTimeout(() => {
    developerDashboard.initialize();
  }, 1000);
}

export default developerDashboard;