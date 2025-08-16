import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Initialize debug tools in development (temporarily disabled for debugging)
if (__DEV__ && false) {
  require('./src/utils/LogAnalyzer');
  require('./src/utils/SupabaseDebugger');
  require('./src/utils/PerformanceOptimizer');
  require('./src/utils/SecurityUtils');
  require('./src/utils/DeveloperDashboard');
}

// Initialize network test utility in development
if (__DEV__) {
  const quickTest = require('./src/utils/quickNetworkTest');
  // Make tests available in console
  global.runQuickTest = quickTest.runQuickTest;
  global.testNotificationSystem = quickTest.testNotificationSystem;
  
  // Auto-run basic network test on app start (after a delay)
  setTimeout(() => {
    console.log('\n🚀 Running automatic network diagnostic...');
    quickTest.runQuickTest();
  }, 2000);
  
  // Initialize system integration testing
  const integrationTest = require('./src/utils/systemIntegrationTest');
  global.runSystemHealthCheck = integrationTest.systemHealthCheck;
  global.runPerformanceTest = integrationTest.performanceTest;
  global.runFullIntegrationTest = integrationTest.runFullIntegrationTest;
  
  // Initialize real-time monitoring (disabled for production)
  // const monitor = require('./src/utils/realTimeMonitoring');
  
  // Initialize developer dashboard
  const dashboard = require('./src/utils/DeveloperDashboard');
  
  // Initialize notification realtime diagnostics
  const notificationFix = require('./src/utils/notificationRealtimeFix');
  
  // Initialize notification testing tools
  const notificationTester = require('./src/utils/testNotifications');
  
  // Initialize follow notification debugger
  const followDebugger = require('./src/utils/debugFollowNotification');
  
  // Initialize universal notification tester
  const universalTester = require('./src/utils/universalNotificationTest');
  
  // Initialize instant notification test
  const instantTest = require('./src/utils/instantNotificationTest');
  
  // Initialize simple notification test
  const simpleTest = require('./src/utils/simpleNotificationTest');
  
  // Initialize follow count debugger
  const followCountDebugger = require('./src/utils/followCountDebugger');
  
  // Initialize quick follow check
  const quickFollowCheck = require('./src/utils/quickFollowCheck');
  
  // Initialize RLS fix test
  const testRLSFixConsole = require('./src/utils/testRLSFixConsole');
  
  // Initialize follow cache issue fixer
  const fixFollowCacheIssue = require('./src/utils/fixFollowCacheIssue');
  
  // Initialize quick notification RLS test
  const quickNotificationRLSTest = require('./src/utils/quickNotificationRLSTest');
  
  // Initialize test after SQL fix
  const testAfterSQLFix = require('./src/utils/testAfterSQLFix');
  
  // Initialize follow services conflict debugger
  const debugFollowServicesConflict = require('./src/utils/debugFollowServicesConflict');
  
  // Initialize network diagnostic
  const networkDiagnostic = require('./src/utils/networkDiagnostic');
  
  // Initialize follow system unifier
  const unifyFollowSystem = require('./src/utils/unifyFollowSystem');
  
  // Initialize emergency follow count fixer
  const fixFollowCountMismatch = require('./src/utils/fixFollowCountMismatch');
  
  // Initialize working pattern restorer
  const revertToWorkingPattern = require('./src/utils/revertToWorkingPattern');
  
  // Auto-run system integration test (after network test)
  setTimeout(() => {
    console.log('\n🧪 Running system integration test...');
    integrationTest.runFullIntegrationTest();
  }, 5000);
  
  // Auto-run notification RLS test (after app loads)
  setTimeout(() => {
    console.log('\n🔔 Testing notification system after RLS fix...');
    if (global.quickNotificationTest) {
      global.quickNotificationTest();
    }
  }, 8000);
  
  // Auto-run follow cache fix (after notification test)
  setTimeout(() => {
    console.log('\n🔧 Fixing follow cache inconsistency...');
    if (global.fixFollowCacheIssue) {
      global.fixFollowCacheIssue();
    }
  }, 12000);
}

function AppContent() {
  const { user, loading, initialized } = useAuth();

  console.log('🔍 App render - user:', !!user, 'loading:', loading, 'initialized:', initialized);
  
  // 글로벌 사용자 정보 설정 (디버깅용)
  if (__DEV__ && user) {
    global.currentUser = user;
    console.log('🔧 Global user set for debugging:', user.id, user.email);
  }

  // Force show AuthNavigator for now to test
  const showAuthNavigation = false;

  if (!initialized || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Loading Newton App...</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          Initialized: {initialized ? 'Yes' : 'No'} | Loading: {loading ? 'Yes' : 'No'}
        </Text>
      </View>
    );
  }

  if (showAuthNavigation) {
    return (
      <>
        <AuthNavigator onAuthComplete={() => console.log('Auth completed')} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      {user ? (
        <TabNavigator />
      ) : (
        <AuthNavigator onAuthComplete={() => console.log('Auth completed')} />
      )}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
