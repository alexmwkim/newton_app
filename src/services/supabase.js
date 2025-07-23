import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// 🔒 SECURITY: Supabase Client Configuration (Anon Key Only)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; 

// Validate environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 Missing Supabase configuration. Check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('🚨 Supabase URL must use HTTPS for security.');
}

// 🛡️ SECURE: Client configured with anon key + RLS protection only
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Session timeout for better security
    sessionRefreshMargin: 60, // Refresh 60 seconds before expiry
  },
  global: {
    headers: {
      'X-Client-Info': 'newton-app-react-native',
      'X-Client-Version': '1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// 🔍 Security validation on client creation
if (__DEV__) {
  // Warn if service role patterns are detected (shouldn't happen but safety check)
  if (supabaseAnonKey.includes('service_role')) {
    console.error('🚨 SECURITY ALERT: Service role key detected in client!');
    console.error('This is a critical security vulnerability!');
  }
  
  console.log('🔒 Supabase client initialized securely with anon key + RLS');
}

export default supabase;