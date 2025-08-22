import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import { Spacing } from '../../../constants/StyleControl';

const ToggleButtons = ({ 
  activeTab = "private", 
  onTabChange 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          activeTab === "private" ? styles.activeButton : styles.inactiveButton
        ]}
        onPress={() => onTabChange?.("private")}
        accessibilityRole="button"
        accessibilityState={{ selected: activeTab === "private" }}
      >
        <Icon 
          name="lock" 
          size={12} 
          color={activeTab === "private" ? Colors.textWhite : Colors.textBlack} 
        />
        <Text 
          style={[
            styles.buttonText,
            activeTab === "private" ? styles.activeText : styles.inactiveText
          ]}
        >
          Private
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.button,
          activeTab === "public" ? styles.activeButton : styles.inactiveButton
        ]}
        onPress={() => onTabChange?.("public")}
        accessibilityRole="button"
        accessibilityState={{ selected: activeTab === "public" }}
      >
        <Icon 
          name="globe" 
          size={12} 
          color={activeTab === "public" ? Colors.textWhite : Colors.textBlack} 
        />
        <Text 
          style={[
            styles.buttonText,
            activeTab === "public" ? styles.activeText : styles.inactiveText
          ]}
        >
          Public
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 24, // 원래대로 복원
    marginBottom: 24, // 원래대로 복원
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    width: 95,
    gap: 4,
  },
  activeButton: {
    backgroundColor: Colors.textBlack,
  },
  inactiveButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.noteCard,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
  },
  activeText: {
    color: Colors.textWhite,
  },
  inactiveText: {
    color: Colors.textBlack,
  },
});

export default ToggleButtons;