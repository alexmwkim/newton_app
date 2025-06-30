import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const HeaderComponent = ({ onBackPress, onSearchPress, onMenuPress, onLogoPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onLogoPress}
        accessibilityLabel="Newton Logo - Refresh"
        style={styles.logoButton}
      >
        <Image 
          source={require('../../assets/logo/logo_bk copy/logo_png-min.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
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