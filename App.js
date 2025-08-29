import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SimpleToolbarProvider } from './src/contexts/SimpleToolbarContext';
import { FormattingProvider } from './src/components/toolbar/ToolbarFormatting';
import { UnifiedToolbar } from './src/components/toolbar/UnifiedToolbar';
// import { CustomKeyboardToolbar } from './src/components/toolbar/CustomKeyboardToolbar'; // 비활성화

// Initialize debug tools in development (temporarily disabled for debugging)
if (__DEV__ && false) {
  require('./src/utils/LogAnalyzer');
  require('./src/utils/SupabaseDebugger');
  require('./src/utils/PerformanceOptimizer');
  require('./src/utils/SecurityUtils');
  require('./src/utils/DeveloperDashboard');
}

// Initialize developer dashboard in development
if (__DEV__) {
  try {
    const dashboard = require('./src/utils/DeveloperDashboard');
  } catch (error) {
    console.log('Developer dashboard not available');
  }
}

// GlobalToolbar는 UnifiedToolbar 컴포넌트로 대체됨

function AppContent() {
  const { user, loading, initialized } = useAuth();

  // App render state updated
  
  
  // 글로벌 사용자 정보 설정 (디버깅용)
  if (__DEV__ && user) {
    global.currentUser = user;
    // Global user set for debugging
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
    <SafeAreaProvider>
      <AuthProvider>
        <FormattingProvider>
          <SimpleToolbarProvider>
            <AppContent />
            <UnifiedToolbar />
          </SimpleToolbarProvider>
        </FormattingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}