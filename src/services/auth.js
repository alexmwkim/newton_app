import { supabase } from './supabase';

class AuthService {
  // 회원가입
  async signUp(email, password, username) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error.message };
    }
  }

  // 로그인
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error.message };
    }
  }

  // 로그아웃
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error.message };
    }
  }

  // 현재 사용자 정보 가져오기
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      return { user, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error: error.message };
    }
  }

  // 사용자 세션 가져오기
  async getSession() {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        return { session, error: null };
      } catch (error) {
        console.error(`Get session error (attempt ${attempt}/3):`, error);
        
        if (attempt < 3 && (error.message?.includes('Network request failed') || error.name?.includes('Fetch'))) {
          console.log(`⏰ 세션 확인 재시도 ${attempt}/3...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        return { session: null, error: error.message };
      }
    }
  }

  // 비밀번호 재설정
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error.message };
    }
  }

  // 인증 상태 변화 리스너
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // 사용자 프로필 업데이트
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: error.message };
    }
  }
}

export default new AuthService();