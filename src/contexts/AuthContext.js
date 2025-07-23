import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/auth';
import ProfileService from '../services/profiles';

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

  const createUserProfile = async (userId) => {
    try {
      console.log('🔨 Creating profile for user:', userId);
      // Get the username from the user metadata
      const { data: { user } } = await AuthService.getCurrentUser();
      const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
      
      console.log('📝 Creating profile with username:', username);
      const { data: profileData, error } = await ProfileService.createProfile(userId, username);
      
      if (error) {
        console.error('❌ Failed to create user profile:', error);
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
      const { isAvailable } = await ProfileService.checkUsernameAvailability(username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      const { data, error } = await AuthService.signUp(email, password, username);
      
      if (error) {
        throw new Error(error);
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