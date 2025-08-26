import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

// Initialize developer dashboard in development
if (__DEV__) {
  try {
    const dashboard = require('./src/utils/DeveloperDashboard');
  } catch (error) {
    console.log('Developer dashboard not available');
  }
}

function GlobalToolbar() {
  const { activeScreenHandlers, focusedIndex, hideKeyboard, keyboardVisible, keyboardHeight } = useSimpleToolbar();
  
  console.log('🔧 GlobalToolbar render - activeScreenHandlers:', !!activeScreenHandlers, 'focusedIndex:', focusedIndex, 'keyboardVisible:', keyboardVisible, 'keyboardHeight:', keyboardHeight);
  
  // Floating toolbar that appears above keyboard (InputAccessoryView 대신 사용)
  if (!keyboardVisible || !activeScreenHandlers || keyboardHeight === 0) {
    return null;
  }
  
  return (
    <View 
      style={{
        position: 'absolute',
        bottom: keyboardHeight, // 키보드 바로 위에 위치
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: 44,
        zIndex: 1000,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Floating toolbar: Add CARD button pressed');
            if (activeScreenHandlers?.handleAddCard) {
              activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
            }
          }}
          style={{
            padding: 6,
            minWidth: 32,
            minHeight: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon name="square" size={18} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Floating toolbar: Add GRID button pressed');
            if (activeScreenHandlers?.handleAddGrid) {
              activeScreenHandlers.handleAddGrid(focusedIndex >= 0 ? focusedIndex : 0);
            }
          }}
          style={{
            padding: 6,
            minWidth: 32,
            minHeight: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon name="grid" size={18} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            console.log('🚨 IMAGE BUTTON CLICKED 🚨');
            
            if (activeScreenHandlers?.handleAddImage) {
              console.log('📱 Calling handleAddImage...');
              activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0).catch(error => {
                console.log('❌ handleAddImage error:', error);
              });
            } else {
              console.log('❌ handleAddImage not available');
            }
          }}
          style={{
            padding: 6,
            minWidth: 32,
            minHeight: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon name="image" size={18} color="#000000" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => {
          console.log('🔧 Floating toolbar: Done button pressed');
          hideKeyboard();
        }}
        style={{
          backgroundColor: '#EB754B', // Newton style guide orange
          paddingHorizontal: 16,
          paddingVertical: 0, // 패딩 제거하고 height로 조정
          borderRadius: 6,
          minWidth: 70,
          height: 32, // 툴바 내부에 맞는 높이
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row', // 텍스트 중앙 정렬 강화
        }}
      >
        <Text style={{ 
          color: '#FFFFFF', 
          fontWeight: 'bold', 
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 14, // 명시적 lineHeight로 수직 중앙 정렬
        }}>Done</Text>
      </TouchableOpacity>
    </View>
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
    <SafeAreaProvider>
      <AuthProvider>
        <SimpleToolbarProvider>
          <AppContent />
          <GlobalToolbar />
        </SimpleToolbarProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}