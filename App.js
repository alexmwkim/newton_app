import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthComplete = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <TabNavigator logout={handleLogout} />
      ) : (
        <AuthNavigator onAuthComplete={handleAuthComplete} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
