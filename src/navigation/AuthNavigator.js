import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import Colors from '../constants/Colors';

const AuthNavigator = ({ onAuthComplete }) => {
  const [currentScreen, setCurrentScreen] = useState('splash');

  const navigate = (screen) => {
    setCurrentScreen(screen);
  };

  const handleAuthComplete = () => {
    onAuthComplete();
  };

  const navigationProps = {
    navigate,
    goBack: () => setCurrentScreen('signIn'),
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onComplete={() => setCurrentScreen('signIn')}
          />
        );
      case 'signIn':
        return (
          <SignInScreen
            navigation={{
              ...navigationProps,
              navigate: (screen) => {
                if (screen === 'main') {
                  handleAuthComplete();
                } else {
                  navigate(screen);
                }
              },
            }}
          />
        );
      case 'signUp':
        return (
          <SignUpScreen
            navigation={navigationProps}
          />
        );
      default:
        return (
          <SignInScreen
            navigation={{
              ...navigationProps,
              navigate: (screen) => {
                if (screen === 'main') {
                  handleAuthComplete();
                } else {
                  navigate(screen);
                }
              },
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});

export default AuthNavigator;