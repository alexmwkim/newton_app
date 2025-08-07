import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

/**
 * Unified Avatar component with consistent styling across all screens
 * @param {string} size - 'small', 'medium', 'large'
 * @param {string} imageUrl - Avatar image URL
 * @param {string} username - Username for fallback initials
 * @param {boolean} showCamera - Show camera icon (for profile editing)
 * @param {function} onPress - Optional press handler
 */
const Avatar = ({ 
  size = 'medium', 
  imageUrl, 
  username = 'U', 
  showCamera = false, 
  onPress,
  style 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { width: 24, height: 24, borderRadius: 12 };
      case 'medium': return { width: 32, height: 32, borderRadius: 16 };
      case 'large': return { width: 48, height: 48, borderRadius: 24 };
      default: return { width: 32, height: 32, borderRadius: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'medium': return 14;
      case 'large': return 20;
      default: return 14;
    }
  };

  const sizeStyle = getSize();
  const Container = onPress ? TouchableOpacity : View;

  // Debug logging for avatar props (comment out for production)
  // console.log('🎭 Avatar props:', { size, imageUrl: imageUrl ? 'has_url' : 'no_url', username });

  return (
    <Container 
      style={[styles.container, style]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.avatar, sizeStyle]}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={[styles.avatarImage, sizeStyle]}
            onError={(error) => {
              console.log('🖼️ Avatar load failed for:', username, error);
            }}
          />
        ) : (
          <Text style={[styles.avatarText, { fontSize: getFontSize() }]}>
            {(username && typeof username === 'string' && username.length > 0) 
              ? username[0].toUpperCase() 
              : 'U'}
          </Text>
        )}
      </View>
      
      {showCamera && (
        <View style={styles.cameraIconContainer}>
          <Icon name="camera" size={10} color={Colors.white} />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.mainBackground,
  },
});

export default Avatar;