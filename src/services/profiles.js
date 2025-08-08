import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

class ProfileService {
  // 프로필 조회
  async getProfile(userId) {
    try {
      console.log('👤 ProfileService.getProfile called for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('❌ Profile not found in database:', error.code, error.message);
        throw error;
      }

      console.log('✅ Profile found:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Get profile error:', {
        code: error.code || '',
        message: error.message || 'Unknown error',
        details: error.details || 'No details available',
        hint: error.hint || 'Check network connection'
      });
      
      // Return a more user-friendly error for network issues
      if (error.message && error.message.includes('Network request failed')) {
        return { data: null, error: 'Network connection failed. Please check your internet connection.' };
      }
      
      return { data: null, error: error.message || 'Failed to load profile' };
    }
  }

  // 사용자명으로 프로필 조회
  async getProfileByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get profile by username error:', error);
      return { data: null, error: error.message };
    }
  }

  // Profile ID로 프로필 조회 (ExploreScreen에서 사용)
  async getProfileById(profileId) {
    try {
      console.log('👤 ProfileService.getProfileById called for profile:', profileId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        console.log('❌ Profile not found by ID:', error.code, error.message);
        throw error;
      }

      console.log('✅ Profile found by ID:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Get profile by ID error:', error);
      return { data: null, error: error.message || 'Failed to load profile by ID' };
    }
  }

  // 프로필 업데이트
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: error.message };
    }
  }

  // 프로필 생성 (회원가입 시에만 호출되어야 함)
  async createProfile(userId, username, avatarUrl = null, bio = null) {
    try {
      console.log('🔨 ProfileService.createProfile STRICT DUPLICATE PREVENTION - User:', userId, 'username:', username);
      
      // Use service role for profile creation to bypass RLS
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('🚨 SECURITY: Missing Supabase admin configuration in environment variables');
      }
      
      const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // STRICT CHECK: Always check if profile already exists first
      console.log('🛡️ STRICT: Checking if profile already exists for user:', userId);
      const { data: existingProfiles, error: checkError } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (!checkError && existingProfiles && existingProfiles.length > 0) {
        console.log('🚫 BLOCKED: Profile already exists for user, returning existing profile:', existingProfiles[0].username);
        console.log('🚫 Found', existingProfiles.length, 'existing profiles for this user');
        return { data: existingProfiles[0], error: null };
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing profiles:', checkError);
        throw new Error('Failed to check existing profiles: ' + checkError.message);
      }
      
      console.log('✅ CONFIRMED: No existing profile found, safe to create new one');
      
      // CRITICAL: Check if user exists in auth.users before creating profile
      console.log('🔍 Verifying user exists in auth.users table:', userId);
      const { data: authUser, error: authCheckError } = await serviceSupabase.auth.admin.getUserById(userId);
      
      if (authCheckError || !authUser?.user) {
        console.error('❌ User not found in auth.users table:', userId);
        console.error('❌ Auth check error:', authCheckError?.message);
        
        // Try to get current authenticated user instead
        console.log('🔄 Attempting to get current authenticated user...');
        const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
        
        if (currentUserError || !currentUser?.user) {
          throw new Error('No authenticated user found. Please log in first.');
        }
        
        console.log('✅ Using current authenticated user ID:', currentUser.user.id);
        userId = currentUser.user.id; // Use the authenticated user's ID
        
        // Update username from auth metadata if available
        if (!username && currentUser.user.user_metadata?.username) {
          username = currentUser.user.user_metadata.username;
        } else if (!username && currentUser.user.email) {
          username = currentUser.user.email.split('@')[0];
        } else if (!username) {
          username = 'user';
        }
        
        console.log('🔄 Updated userId:', userId, 'username:', username);
      } else {
        console.log('✅ User verified in auth.users:', authUser.user.email);
      }
      
      // Check if username is already taken
      console.log('🔍 Checking username availability:', username);
      const { isAvailable, error: usernameCheckError } = await this.checkUsernameAvailability(username);
      
      if (usernameCheckError) {
        console.error('❌ Username availability check failed:', usernameCheckError);
        // Continue with original username if check fails
      } else if (!isAvailable) {
        // Username is taken, generate a unique one
        console.log('⚠️ Username already taken, generating unique username');
        username = await this.generateUniqueUsername(username, serviceSupabase);
        console.log('✅ Generated unique username:', username);
      }
      
      const { data, error } = await serviceSupabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            username,
            avatar_url: avatarUrl,
            bio,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Profile created successfully with username:', username);
      return { data, error: null };
    } catch (error) {
      console.error('Create profile error:', error);
      return { data: null, error: error.message };
    }
  }

  // Generate unique username by appending numbers
  async generateUniqueUsername(baseUsername, serviceSupabase, attempt = 1) {
    try {
      const candidateUsername = attempt === 1 ? baseUsername : `${baseUsername}${attempt}`;
      console.log('🔍 Checking username candidate:', candidateUsername);
      
      const { data, error } = await serviceSupabase
        .from('profiles')
        .select('username')
        .eq('username', candidateUsername)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Username uniqueness check error:', error);
        return `${baseUsername}_${Date.now()}`; // Fallback to timestamp
      }
      
      if (!data) {
        // Username is available
        console.log('✅ Unique username found:', candidateUsername);
        return candidateUsername;
      }
      
      // Username is taken, try next number
      if (attempt > 100) {
        // Prevent infinite loop, use timestamp fallback
        return `${baseUsername}_${Date.now()}`;
      }
      
      return await this.generateUniqueUsername(baseUsername, serviceSupabase, attempt + 1);
    } catch (error) {
      console.error('Generate unique username error:', error);
      return `${baseUsername}_${Date.now()}`; // Fallback to timestamp
    }
  }

  // 사용자 인증 상태 디버깅
  async debugAuthState() {
    try {
      console.log('🔍 === COMPREHENSIVE AUTH STATE DEBUG ===');
      
      // Check current session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('📱 Current session:', session?.session ? 'EXISTS' : 'NONE');
      console.log('📱 Session user ID:', session?.session?.user?.id);
      console.log('📱 Session user email:', session?.session?.user?.email);
      console.log('📱 Session error:', sessionError?.message);
      
      // Check current user
      const { data: user, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.user ? 'EXISTS' : 'NONE');
      console.log('👤 User ID:', user?.user?.id);
      console.log('👤 User email:', user?.user?.email);
      console.log('👤 User metadata:', JSON.stringify(user?.user?.user_metadata, null, 2));
      console.log('👤 User error:', userError?.message);
      
      // Use service role to check auth.users table
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('🚨 SECURITY: Missing Supabase admin configuration in environment variables');
      }
      
      const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Check all users with Alex or David names
      console.log('🔍 Searching for Alex/David users in auth.users...');
      try {
        const { data: allUsers, error: listError } = await serviceSupabase.auth.admin.listUsers();
        if (listError) {
          console.error('❌ Failed to list users:', listError.message);
        } else {
          const alexDavidUsers = allUsers.users.filter(u => 
            u.email?.toLowerCase().includes('alex') || 
            u.email?.toLowerCase().includes('david') ||
            u.user_metadata?.username?.toLowerCase().includes('alex') ||
            u.user_metadata?.username?.toLowerCase().includes('david')
          );
          
          console.log('👥 Found Alex/David users:', alexDavidUsers.length);
          alexDavidUsers.forEach(u => {
            console.log(`  - ID: ${u.id}, Email: ${u.email}, Username: ${u.user_metadata?.username}`);
          });
        }
      } catch (adminError) {
        console.error('❌ Admin user list error:', adminError.message);
      }
      
      if (user?.user?.id) {
        const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(user.user.id);
        console.log('🔐 Auth.users check for current user:', authUser?.user ? 'EXISTS' : 'NOT FOUND');
        console.log('🔐 Auth.users email:', authUser?.user?.email);
        console.log('🔐 Auth.users error:', authError?.message);
      }
      
      // Also check existing profiles table
      console.log('🔍 Checking existing profiles...');
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
        
        if (profilesError) {
          console.error('❌ Profiles query error:', profilesError.message);
        } else {
          console.log('👤 Existing profiles:', profiles?.length || 0);
          profiles?.forEach(p => {
            console.log(`  - Profile: ${p.username} (user_id: ${p.user_id})`);
          });
        }
      } catch (profileError) {
        console.error('❌ Profiles check error:', profileError.message);
      }
      
      console.log('🔍 === END COMPREHENSIVE AUTH DEBUG ===');
      
      return {
        hasSession: !!session?.session,
        hasUser: !!user?.user,
        userId: user?.user?.id,
        userEmail: user?.user?.email
      };
    } catch (error) {
      console.error('❌ Auth debug error:', error);
      return { error: error.message };
    }
  }

  // 사용자명 중복 확인
  async checkUsernameAvailability(username) {
    try {
      console.log('🔍 Checking username availability for:', username);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle(); // Use maybeSingle() instead of single()

      if (error) {
        console.error('❌ Username availability check error:', error);
        throw error;
      }

      const isAvailable = !data; // If no data found, username is available
      console.log(`✅ Username "${username}" availability:`, isAvailable ? 'AVAILABLE' : 'TAKEN');
      
      return { isAvailable, error: null };
    } catch (error) {
      console.error('Check username availability error:', error);
      // In case of error, assume username is taken to be safe
      return { isAvailable: false, error: error.message };
    }
  }

  // 프로필 리스트 조회 (검색용)
  async searchProfiles(query, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .ilike('username', `%${query}%`)
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Search profiles error:', error);
      return { data: null, error: error.message };
    }
  }

  // 아바타 이미지 업로드 (React Native용)
  async uploadAvatar(userId, imageUri) {
    try {
      console.log('📸 Starting avatar upload for user:', userId);
      
      // Extract file extension from URI
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log('📸 Uploading file:', fileName, 'Size:', blob.size);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExtension}`,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('📸 Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('📸 Upload successful, public URL:', publicUrl);

      // Update profile with new avatar URL
      const { data: updateData, error: updateError } = await this.updateProfile(userId, {
        avatar_url: publicUrl,
      });

      if (updateError) {
        console.error('📸 Profile update error:', updateError);
        throw updateError;
      }

      console.log('📸 Profile updated with new avatar URL');
      return { data: { avatarUrl: publicUrl, profile: updateData }, error: null };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { data: null, error: error.message };
    }
  }

  // 아바타 이미지 삭제
  async deleteAvatar(userId, currentAvatarUrl) {
    try {
      console.log('📸 Deleting avatar for user:', userId);
      
      // Extract file path from current avatar URL if it's a Supabase Storage URL
      if (currentAvatarUrl && currentAvatarUrl.includes('supabase')) {
        const urlParts = currentAvatarUrl.split('/avatars/');
        if (urlParts.length > 1) {
          const filePath = `avatars/${urlParts[1]}`;
          
          // Delete from storage
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([filePath]);
          
          if (deleteError) {
            console.warn('📸 Failed to delete file from storage:', deleteError.message);
          } else {
            console.log('📸 File deleted from storage successfully');
          }
        }
      }
      
      // Update profile to remove avatar_url
      const { data: updateData, error: updateError } = await this.updateProfile(userId, {
        avatar_url: null,
      });
      
      if (updateError) {
        console.error('📸 Profile update error:', updateError);
        throw updateError;
      }
      
      console.log('📸 Avatar deleted and profile updated');
      return { data: updateData, error: null };
    } catch (error) {
      console.error('Delete avatar error:', error);
      return { data: null, error: error.message };
    }
  }
}

// Export class instead of instance to prevent initialization errors
// IMPORTANT: This service has some methods requiring admin keys - use client-safe version instead
export default ProfileService;