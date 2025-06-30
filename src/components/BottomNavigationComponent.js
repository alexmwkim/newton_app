import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';

const BottomNavigationComponent = ({ 
  activeTab = 0, 
  onTabChange 
}) => {
  const navItems = [
    { icon: "home", label: "Home" },
    { icon: "search", label: "Search" },
    { icon: "zap", label: "Explore" },
    { icon: "user", label: "Profile" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navContent}>
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.navItem,
              activeTab === index && styles.activeNavItem
            ]}
            onPress={() => onTabChange?.(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === index }}
            accessibilityLabel={item.label}
          >
            <Icon
              name={item.icon}
              size={24}
              color={activeTab === index ? Colors.textBlack : Colors.textGray}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#Ffffff',
    borderRadius: 40,
    marginTop: 20,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  navItem: {
    padding: 8,
  },
  activeNavItem: {
    opacity: 1,
  },
});

export default BottomNavigationComponent;