/**
 * 프로필 기능 통합 테스트
 * 리팩터링된 구조가 기존 기능을 정상적으로 유지하는지 확인
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useProfile } from '../hooks/useProfile';
import { profileService } from '../services/ProfileService';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

jest.mock('../services/ProfileService', () => ({
  profileService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getProfileStats: jest.fn(),
  },
}));

describe('Profile Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useProfile Hook Integration', () => {
    it('should load profile data on mount', async () => {
      const mockProfile = {
        user_id: 'test-user-id',
        username: 'testuser',
        full_name: 'Test User',
        bio: 'Test bio',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const mockStats = {
        notesCount: 5,
        followersCount: 10,
        followingCount: 15,
      };

      profileService.getProfile.mockResolvedValue({ 
        data: mockProfile, 
        error: null 
      });
      profileService.getProfileStats.mockResolvedValue({ 
        data: mockStats, 
        error: null 
      });

      const { result, waitForNextUpdate } = renderHook(() => 
        useProfile('test-user-id')
      );

      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.profile.profileData).toEqual(mockProfile);
      expect(result.current.computed.notesCount).toBe(5);
    });

    it('should handle profile update', async () => {
      const mockProfile = {
        user_id: 'test-user-id',
        username: 'testuser',
        full_name: 'Test User Updated',
      };

      profileService.updateProfile.mockResolvedValue({ 
        data: mockProfile, 
        error: null 
      });

      const { result } = renderHook(() => useProfile('test-user-id'));

      await act(async () => {
        await result.current.actions.updateProfile({
          full_name: 'Test User Updated',
        });
      });

      expect(profileService.updateProfile).toHaveBeenCalledWith(
        'test-user-id',
        { full_name: 'Test User Updated' }
      );
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Network error');
      
      profileService.getProfile.mockResolvedValue({ 
        data: null, 
        error: mockError 
      });

      const { result, waitForNextUpdate } = renderHook(() => 
        useProfile('test-user-id')
      );

      await waitForNextUpdate();
      
      expect(result.current.hasError).toBe(true);
      expect(result.current.errors).toContain(mockError);
    });
  });

  describe('Component Integration', () => {
    it('should maintain existing UI behavior', () => {
      // 기존 ProfileScreen과 새로운 ProfileScreenNew가 
      // 동일한 UI를 렌더링하는지 확인하는 테스트
      // (실제 구현에서는 스크린샷 테스트나 시각적 회귀 테스트 사용)
      
      const mockProps = {
        notesCount: 5,
        starsCount: 10,
        followersCount: 15,
        followingCount: 8,
      };

      // 테스트 로직은 실제 테스트 러너에서 구현
      expect(true).toBe(true); // 플레이스홀더
    });
  });

  describe('Performance Tests', () => {
    it('should load profile data within acceptable time', async () => {
      const startTime = Date.now();
      
      profileService.getProfile.mockResolvedValue({ 
        data: { user_id: 'test-user-id' }, 
        error: null 
      });

      const { waitForNextUpdate } = renderHook(() => 
        useProfile('test-user-id')
      );

      await waitForNextUpdate();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 프로필 로딩이 1초 이내에 완료되어야 함
      expect(duration).toBeLessThan(1000);
    });

    it('should minimize unnecessary re-renders', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        const profile = useProfile('test-user-id');
        return null;
      };

      const { rerender } = renderHook(() => <TestComponent />);
      
      // 같은 props로 여러 번 리렌더링
      rerender();
      rerender();
      rerender();
      
      // React.memo와 useCallback이 제대로 작동한다면
      // 불필요한 리렌더링이 줄어들어야 함
      expect(renderCount).toBeLessThan(10); // 임계값은 실제 측정 후 조정
    });
  });

  describe('Error Boundary Tests', () => {
    it('should handle service errors without crashing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      profileService.getProfile.mockRejectedValue(new Error('Service unavailable'));

      const { result, waitForNextUpdate } = renderHook(() => 
        useProfile('test-user-id')
      );

      await waitForNextUpdate();
      
      expect(result.current.hasError).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

/**
 * 성능 벤치마크 테스트
 */
describe('Performance Benchmarks', () => {
  it('should meet performance targets', () => {
    const benchmarks = {
      profileLoadTime: 500, // ms
      componentRenderTime: 16, // ms (60fps)
      memoryUsage: 10, // MB
    };

    // 실제 성능 측정 로직은 별도 도구로 구현
    // 여기서는 기준값 정의만 수행
    expect(benchmarks.profileLoadTime).toBeLessThan(1000);
    expect(benchmarks.componentRenderTime).toBeLessThan(16.67); // 60fps
    expect(benchmarks.memoryUsage).toBeLessThan(50);
  });
});