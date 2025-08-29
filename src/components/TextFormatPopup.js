import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const TextFormatPopup = ({ 
  visible, 
  onBold, 
  onItalic, 
  onHeading, 
  onClose,
  position = { x: 0, y: 0 }
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.popupContainer, { 
      left: position.x, 
      top: position.y - 60 // 선택 영역 위에 표시
    }]}>
      <TouchableOpacity style={styles.formatButton} onPress={onBold}>
        <Text style={styles.boldText}>B</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={onItalic}>
        <Text style={styles.italicText}>I</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={() => onHeading(1)}>
        <Text style={styles.headingText}>H1</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={() => onHeading(2)}>
        <Text style={styles.headingText}>H2</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={() => onHeading(3)}>
        <Text style={styles.headingText}>H3</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Icon name="x" size={14} color={Colors.secondaryText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: Colors.mainBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1000,
  },
  formatButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: Colors.cardBackground,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boldText: {
    fontWeight: Typography.fontWeight.bold,
    fontSize: 14,
    color: Colors.primaryText,
  },
  italicText: {
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.semibold,
  },
  headingText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TextFormatPopup;