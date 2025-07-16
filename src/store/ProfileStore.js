import AsyncStorage from '@react-native-async-storage/async-storage';

let profilePhoto = null;
let listeners = [];

// Load profile photo from storage
const loadProfilePhoto = async () => {
  try {
    const saved = await AsyncStorage.getItem('profilePhoto');
    if (saved) {
      profilePhoto = saved;
      console.log('📸 Loaded profile photo from storage');
      // Notify all listeners
      listeners.forEach(listener => listener());
    }
  } catch (error) {
    console.log('Error loading profile photo:', error);
  }
};

// Initialize profile photo on app start
loadProfilePhoto();

// Simple store for profile data
const ProfileStore = {
  getProfilePhoto: () => profilePhoto,
  
  setProfilePhoto: (photoUri) => {
    profilePhoto = photoUri;
    // Notify all listeners
    listeners.forEach(listener => listener());
  },
  
  // Subscribe to changes
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

export default ProfileStore;