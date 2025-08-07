/**
 * Avatar utilities for consistent avatar URL resolution across the app
 */
import ProfileStore from '../store/ProfileStore';

/**
 * Get consistent avatar URL for any user
 * @param {Object} options - Options object
 * @param {string} options.userId - User ID to get avatar for
 * @param {Object} options.currentUser - Current authenticated user object
 * @param {Object} options.currentProfile - Current user's profile object
 * @param {string} options.currentProfilePhoto - Current user's profile photo from ProfileStore
 * @param {Object} options.profiles - Profile data from note/user (profiles table)
 * @param {string} options.avatarUrl - Direct avatar URL if available
 * @param {string} options.username - Username for fallback
 * @returns {string|null} Avatar URL or null if not available
 */
export const getConsistentAvatarUrl = ({
  userId,
  currentUser,
  currentProfile,
  currentProfilePhoto,
  profiles,
  avatarUrl,
  username
}) => {
  // If this is the current user, use their profile photo from ProfileStore (most up-to-date)
  if (userId && currentUser?.id && userId === currentUser.id) {
    // Get the most up-to-date profile photo from ProfileStore
    const storeProfilePhoto = ProfileStore.getProfilePhoto();
    return storeProfilePhoto || currentProfilePhoto || currentProfile?.avatar_url;
  }
  
  // For other users, prioritize profiles table data, then fallback to direct avatarUrl
  if (profiles?.avatar_url) {
    return profiles.avatar_url;
  }
  
  if (avatarUrl) {
    return avatarUrl;
  }
  
  // No avatar available
  return null;
};

/**
 * Get consistent username for display
 * @param {Object} options - Options object
 * @param {string} options.userId - User ID 
 * @param {Object} options.currentUser - Current authenticated user object
 * @param {Object} options.currentProfile - Current user's profile object
 * @param {Object} options.profiles - Profile data from note/user
 * @param {string} options.username - Direct username if available
 * @returns {string} Username for display
 */
export const getConsistentUsername = ({
  userId,
  currentUser,
  currentProfile,
  profiles,
  username
}) => {
  // If this is the current user, use their current profile data
  if (userId && currentUser?.id && userId === currentUser.id) {
    return currentProfile?.username || currentUser?.username || currentUser?.email?.split('@')[0];
  }
  
  // For other users, prioritize profiles table data
  if (profiles?.username) {
    return profiles.username;
  }
  
  if (username) {
    return username;
  }
  
  return 'Unknown';
};