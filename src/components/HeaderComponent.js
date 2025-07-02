import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const HeaderComponent = ({ onBackPress, onSearchPress, onMenuPress, onLogoPress }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onLogoPress}
        accessibilityLabel="Newton Logo - Refresh"
        style={styles.logoButton}
      >
        {!logoError ? (
          <Image 
            source={require('../../assets/logo/logo_app.png')}
            style={styles.logoImage}
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoText}>N</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.rightIcons}>
        <TouchableOpacity 
          onPress={onSearchPress}
          accessibilityLabel="Notifications"
          style={styles.iconButton}
        >
          <Icon name="bell" size={24} color={Colors.textBlack} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onMenuPress}
          accessibilityLabel="Settings"
          style={styles.iconButton}
        >
          <Icon name="settings" size={24} color={Colors.textBlack} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoButton: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  logoFallback: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.textBlack,
    borderRadius: 32,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    minHeight: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});

export default HeaderComponent;