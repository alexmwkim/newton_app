import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, InputAccessoryView, TouchableOpacity, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SimpleToolbarProvider, useSimpleToolbar } from './src/contexts/SimpleToolbarContext';

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
  
  // 🚨 DISABLED: Auto-run causing follow data deletion
  // setTimeout(() => {
  //   console.log('\n🚀 Running automatic network diagnostic...');
  //   quickTest.runQuickTest();
  // }, 2000);
  
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
  
  // 🚨 DISABLED: All auto-run tests causing follow data deletion
  // setTimeout(() => {
  //   console.log('\n🧪 Running system integration test...');
  //   integrationTest.runFullIntegrationTest();
  // }, 5000);
  
  // setTimeout(() => {
  //   console.log('\n🔔 Testing notification system after RLS fix...');
  //   if (global.quickNotificationTest) {
  //     global.quickNotificationTest();
  //   }
  // }, 8000);
  
  // setTimeout(() => {
  //   console.log('\n🔧 Fixing follow cache inconsistency...');
  //   if (global.fixFollowCacheIssue) {
  //     global.fixFollowCacheIssue();
  //   }
  // }, 12000);
}

function GlobalToolbar() {
  const { activeScreenHandlers, focusedIndex } = useSimpleToolbar();
  
  return (
    <>
      {/* CreateNoteScreen Toolbar */}
      <InputAccessoryView nativeID="create-note-toolbar">
      <View style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: 44,
        width: '100%',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              console.log('🔧 Global toolbar: Add card button pressed');
              if (activeScreenHandlers?.handleAddCard) {
                activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
              }
            }}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: '#F0F0F0',
              minWidth: 36,
              minHeight: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="square" size={18} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log('🔧 Global toolbar: Add grid button pressed');
              if (activeScreenHandlers?.handleAddGrid) {
                activeScreenHandlers.handleAddGrid(focusedIndex >= 0 ? focusedIndex : 0);
              }
            }}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: '#F0F0F0',
              minWidth: 36,
              minHeight: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="grid" size={18} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log('🔧 Global toolbar: Add image button pressed');
              if (activeScreenHandlers?.handleAddImage) {
                activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0);
              }
            }}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: '#F0F0F0',
              minWidth: 36,
              minHeight: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="image" size={18} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Global toolbar: Done button pressed');
            if (activeScreenHandlers?.handleDone) {
              activeScreenHandlers.handleDone();
            } else {
              Keyboard.dismiss();
            }
          }}
          style={{
            padding: 8,
            borderRadius: 6,
            backgroundColor: 'rgba(235, 117, 75, 1)',
            minWidth: 60,
            minHeight: 36,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Done</Text>
        </TouchableOpacity>
      </View>
      </InputAccessoryView>
      
      {/* NoteDetailScreen Toolbar */}
      <InputAccessoryView nativeID="note-detail-toolbar">
        <View style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 8,
          height: 44,
          width: '100%',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                console.log('🔧 Global toolbar: Add card button pressed (NoteDetail)');
                if (activeScreenHandlers?.handleAddCard) {
                  activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
                }
              }}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#F0F0F0',
                minWidth: 36,
                minHeight: 36,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="square" size={18} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log('🔧 Global toolbar: Add grid button pressed (NoteDetail)');
                if (activeScreenHandlers?.handleAddGrid) {
                  activeScreenHandlers.handleAddGrid(focusedIndex >= 0 ? focusedIndex : 0);
                }
              }}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#F0F0F0',
                minWidth: 36,
                minHeight: 36,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="grid" size={18} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                console.log('🔧 Global toolbar: Add image button pressed (NoteDetail)');
                if (activeScreenHandlers?.handleAddImage) {
                  activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0);
                }
              }}
              style={{
                padding: 8,
                borderRadius: 6,
                backgroundColor: '#F0F0F0',
                minWidth: 36,
                minHeight: 36,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="image" size={18} color="#333" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('🔧 Global toolbar: Done button pressed (NoteDetail)');
              if (activeScreenHandlers?.handleDone) {
                activeScreenHandlers.handleDone();
              } else {
                Keyboard.dismiss();
              }
            }}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: 'rgba(235, 117, 75, 1)',
              minWidth: 60,
              minHeight: 36,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Done</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    </>
  );
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
      <SimpleToolbarProvider>
        <AppContent />
        <GlobalToolbar />
      </SimpleToolbarProvider>
    </AuthProvider>
  );
}
