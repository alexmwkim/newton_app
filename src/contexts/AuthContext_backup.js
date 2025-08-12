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
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(true);
  
  console.log('🚫 DISABLED AuthContext - All services commented out');

  useEffect(() => {
    console.log('🔄 Mock Auth initialization - no services');
    // Mock user to test TabNavigator
    const mockUser = {
      id: '10663749-9fba-4039-9f22-d6e7add9ea2d',
      email: 'test@example.com'
    };
    
    setUser(mockUser);
    setLoading(false);
    setInitialized(true);
  }, []);

  const signUp = async (email, password, username) => {
    console.log('Mock signUp called');
    return { data: null, error: 'Mock function - services disabled' };
  };

  const signIn = async (email, password) => {
    console.log('Mock signIn called');
    return { data: null, error: 'Mock function - services disabled' };
  };

  const signOut = async () => {
    console.log('Mock signOut called');
    setUser(null);
    setProfile(null);
    return { error: null };
  };

  const updateProfile = async (updates) => {
    console.log('Mock updateProfile called');
    return { data: null, error: 'Mock function - services disabled' };
  };

  const refreshProfile = async () => {
    console.log('Mock refreshProfile called');
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