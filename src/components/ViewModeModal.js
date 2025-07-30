import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useViewMode } from '../store/ViewModeStore';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const ViewModeModal = ({ visible, onClose, position }) => {
  const { 
    currentViewMode, 
    setViewMode, 
    viewModes, 
    viewModeNames, 
    viewModeDescriptions 
  } = useViewMode();

  // Display Options state (for future features)
  const [showBodyText, setShowBodyText] = useState(true);
  const [showImages, setShowImages] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const handleViewModeSelect = (mode) => {
    console.log('👁️ ViewModeModal: Selecting view mode:', mode);
    setViewMode(mode);
    onClose(); // Close modal after selection
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Semi-transparent background */}
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        {/* Dropdown Menu positioned at top-right */}
        <View style={[styles.dropdownContainer, position && { top: position.top, right: position.right }]}>
          {/* View Mode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👁️ View Mode</Text>
            
            {Object.entries(viewModes).map(([key, mode]) => (
              <TouchableOpacity
                key={mode}
                style={styles.menuItem}
                onPress={() => handleViewModeSelect(mode)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons 
                    name={mode === viewModes.TITLE_ONLY ? 'text-outline' : 'reader-outline'} 
                    size={18} 
                    color={Colors.primaryText} 
                  />
                  <Text style={styles.menuItemText}>
                    {viewModeNames[mode]}
                  </Text>
                </View>
                
                {/* Check mark for selected option */}
                {currentViewMode === mode && (
                  <Ionicons name="checkmark" size={18} color={Colors.floatingButton} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Display Options Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Display Options</Text>
            
            {/* Show body text */}
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemText}>Show body text</Text>
              </View>
              <Switch
                value={showBodyText}
                onValueChange={setShowBodyText}
                trackColor={{ false: Colors.border, true: Colors.floatingButton }}
                thumbColor={showBodyText ? Colors.white : Colors.secondaryText}
                ios_backgroundColor={Colors.border}
                style={styles.switch}
              />
            </View>

            {/* Show images (disabled) */}
            <View style={[styles.menuItem, styles.menuItemDisabled]}>
              <View style={styles.menuItemLeft}>
                <Text style={[styles.menuItemText, styles.menuItemTextDisabled]}>Show images</Text>
              </View>
              <Switch
                value={showImages}
                onValueChange={setShowImages}
                disabled={true}
                trackColor={{ false: Colors.border, true: Colors.border }}
                thumbColor={Colors.secondaryText}
                ios_backgroundColor={Colors.border}
                style={styles.switch}
              />
            </View>

            {/* Show tags (disabled) */}
            <View style={[styles.menuItem, styles.menuItemDisabled]}>
              <View style={styles.menuItemLeft}>
                <Text style={[styles.menuItemText, styles.menuItemTextDisabled]}>Show tags</Text>
              </View>
              <Switch
                value={showTags}
                onValueChange={setShowTags}
                disabled={true}
                trackColor={{ false: Colors.border, true: Colors.border }}
                thumbColor={Colors.secondaryText}
                ios_backgroundColor={Colors.border}
                style={styles.switch}
              />
            </View>
          </View>
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
    top: 80, // Default position below header
    right: 16,
    backgroundColor: Colors.mainBackground,
    borderRadius: 16, // Increased for more modern look
    minWidth: 220,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15, // Slightly reduced for cleaner look
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8, // Consistent outer padding
  },
  
  section: {
    paddingVertical: 12, // Consistent section padding
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.secondaryText,
    paddingHorizontal: 20, // Consistent horizontal padding
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // Consistent horizontal padding
    paddingVertical: 12, // Consistent vertical padding
    minHeight: 48, // Slightly taller for better touch targets
  },
  
  menuItemDisabled: {
    opacity: 0.5,
  },
  
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  menuItemText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginLeft: 12, // Consistent spacing from icon
    flex: 1,
  },
  
  menuItemTextDisabled: {
    color: Colors.secondaryText,
  },
  
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20, // Match horizontal padding
    marginVertical: 8, // Add vertical spacing around divider
  },
  
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }], // Slightly larger than before
  },
});

export default ViewModeModal;