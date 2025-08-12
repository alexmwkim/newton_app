/**
 * ModalOverlay - 모달의 배경 및 컨테이너
 */

import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';

const ModalOverlay = ({ 
  visible, 
  onClose, 
  children,
  position,
  containerStyle 
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[
          styles.dropdownContainer,
          position && { top: position.top, right: position.right },
          containerStyle
        ]}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  dropdownContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: Colors.mainBackground,
    borderRadius: 16,
    minWidth: 220,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
  },
});

export default ModalOverlay;