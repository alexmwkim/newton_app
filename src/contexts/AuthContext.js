import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/auth';
import ProfileService from '../services/profilesClient';
import { testSupabaseConnection } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let authListener = null;

    const initializeAuth = async () => {
      try {
        console.log('🚀 AuthContext: Starting initialization...');
        setLoading(true);
        setInitialized(false);

        // Get current session
        console.log('🔍 AuthContext: Checking initial session...');
        const { session, error: sessionError } = await AuthService.getSession();
        
        if (sessionError) {
          console.error('❌ AuthContext: Session error:', sessionError);
          setLoading(false);
          setInitialized(true);
          return;
        }

        console.log('🚀 AuthContext: Session result:', session?.user?.id || 'No session');
        
        if (session?.user) {
          console.log('🔐 AuthContext: Initial user found, setting user state...');
          setUser(session.user);
          // Skip profile loading for now to speed up initialization
          console.log('⏭️ AuthContext: Skipping profile loading for faster startup');
        } else {
          console.log('❌ AuthContext: No initial session found');
          setUser(null);
          setProfile(null);
        }

        // Set up auth state listener
        console.log('🔄 AuthContext: Setting up auth state listener...');
        const { data: listener } = AuthService.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 AuthContext: Auth state changed:', event, session?.user?.id || 'No user');
            
            if (session?.user) {
              console.log('🔐 AuthContext: Setting user from auth change:', session.user.id);
              setUser(session.user);
              // Load profile in background
              loadUserProfile(session.user.id).catch(err => 
                console.error('Background profile load error:', err)
              );
            } else {
              console.log('🚪 AuthContext: Clearing user state');
              setUser(null);
              setProfile(null);
            }
          }
        );

        authListener = listener;

        console.log('✅ AuthContext: Initialization complete');
        setInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('❌ AuthContext: Initialization error:', error);
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 AuthContext: Cleaning up auth listener');
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      console.log('👤 Loading profile for user:', userId);
      
      // Test network connection first
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.warn('⚠️ Network connection failed, skipping profile load');
        return;
      }
      
      const { data: profileData, error } = await ProfileService.getProfile(userId);
      
      if (error || !profileData) {
        console.log('❌ Profile not found, creating new profile...', error);
        // Profile doesn't exist, create it
        await createUserProfile(userId);
        return;
      }

      console.log('✅ Profile loaded successfully:', profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('Load user profile error:', error);
      // Also try to create profile if there's any error
      console.log('❌ Error loading profile, attempting to create new profile...');
      await createUserProfile(userId);
    }
  };

  const createUserProfile = async (userId, providedUsername = null) => {
    try {
      console.log('🔨 Creating profile for user:', userId);
      
      let username = providedUsername;
      
      if (!username) {
        // Get the username from the user metadata
        const { user, error: getUserError } = await AuthService.getCurrentUser();
        if (getUserError || !user) {
          console.warn('Could not get current user for username, using fallback:', getUserError);
          username = `user_${userId.substring(0, 8)}`;
        } else {
          username = user?.user_metadata?.username || user?.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
        }
      }
      
      console.log('📝 Creating profile with username:', username);
      
      // Try to create profile with multiple attempts for unique username
      let attempt = 0;
      let profileData = null;
      let createError = null;
      
      while (attempt < 5 && !profileData) {
        try {
          // Check if username is available before creating
          const isAvailable = await ProfileService.checkUsernameAvailable(username);
          if (!isAvailable || attempt > 0) {
            // Generate a unique username by appending timestamp and random number
            const timestamp = Date.now().toString().slice(-4);
            const randomSuffix = Math.floor(Math.random() * 1000);
            username = `${username.split('_')[0]}_${timestamp}${randomSuffix}`;
            console.log(`⚠️ Username taken (attempt ${attempt + 1}), trying:`, username);
          }
          
          // Client service returns profile data directly or throws error
          profileData = await ProfileService.createBasicProfile(userId, { username });
          createError = null;
          break;
          
        } catch (error) {
          console.error(`❌ Profile creation attempt ${attempt + 1} failed:`, error);
          createError = error;
          
          // Check if it's a duplicate key error
          if (error.message && (error.message.includes('duplicate key') || error.message.includes('23505'))) {
            console.log(`❌ Duplicate username error (attempt ${attempt + 1}), trying different username`);
            attempt++;
            continue; // Try again with different username
          }
          
          attempt++;
          if (attempt >= 5) {
            break;
          }
        }
      }
      
      if (createError && !profileData) {
        console.error('❌ Failed to create user profile after 5 attempts:', createError);
        return;
      }

      console.log('✅ Created user profile successfully:', profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('Create user profile error:', error);
    }
  };

  const signUp = async (email, password, username) => {
    try {
      setLoading(true);
      
      // Check username availability first
      const isAvailable = await ProfileService.checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      const { data, error } = await AuthService.signUp(email, password, username);
      
      if (error) {
        throw new Error(error);
      }

      // If signup was successful and we have a user, create profile immediately
      if (data?.user?.id) {
        console.log('🔨 Creating profile immediately after signup for:', data.user.id);
        await createUserProfile(data.user.id, username);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await AuthService.signIn(email, password);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out user:', user?.id);
      
      const result = await AuthService.signOut();
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setLoading(false); // Set loading false immediately after clearing state
      
      console.log('✅ Successfully signed out');
      
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      setLoading(false); // Ensure loading is false even on error
      return { error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await ProfileService.updateProfile(user.id, updates);
      
      if (error) {
        throw new Error(error);
      }

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: error.message };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};