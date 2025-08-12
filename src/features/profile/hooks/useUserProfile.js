/**
 * useUserProfile - UserProfileScreen 전용 훅
 * 다른 사용자의 프로필을 조회할 때 사용
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotesStore } from '../../../store/NotesStore';
import UnifiedProfileService from '../../../services/UnifiedProfileService';
import OptimizedNotesService from '../../../services/OptimizedNotesService';
import FollowService from '../../../services/followClient';
import logger from '../../../utils/Logger';

export const useUserProfile = (userId, username, profileData, routeIsCurrentUser) => {
  const { user: currentUser, profile: currentProfile } = useAuth();
  
  // 상태 관리
  const [userProfile, setUserProfile] = useState(profileData || null);
  const [userPublicNotes, setUserPublicNotes] = useState([]);
  const [readmeData, setReadmeData] = useState({ title: '', content: '' });
  const [highlightNotes, setHighlightNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 현재 사용자인지 동적으로 계산
  const isCurrentUser = useMemo(() => {
    const calculated = userId === currentUser?.id || profileData?.user_id === currentUser?.id;
    logger.debug('🔍 isCurrentUser calculation:', {
      calculated,
      userId,
      currentUserId: currentUser?.id,
      profileDataUserId: profileData?.user_id
    });
    return calculated;
  }, [userId, profileData?.user_id, currentUser?.id]);

  // 표시할 사용자명 결정
  const displayUsername = useMemo(() => {
    return userProfile?.username || username || profileData?.username || 'Unknown User';
  }, [userProfile?.username, username, profileData?.username]);

  // NotesStore 데이터 (현재 사용자용)
  const { publicNotes, getStarredNotes } = useNotesStore();

  // 프로필 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        logger.debug('👤 Loading user profile:', { userId, username });

        // 프로필 데이터가 이미 있으면 사용, 없으면 로드
        let profile = profileData;
        
        if (!profile && userId) {
          logger.debug('🔍 Loading profile from service for userId:', userId);
          const result = await UnifiedProfileService.getProfile(userId);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          profile = result.data;
        }

        if (profile) {
          setUserProfile(profile);
          
          // README 데이터 설정
          const readmeTitle = profile.readme_title || `Hello from ${displayUsername}!`;
          const readmeContent = profile.readme_content || generateDefaultReadme(displayUsername);
          
          setReadmeData({
            title: readmeTitle,
            content: readmeContent
          });
        }

        logger.debug('✅ Profile loaded successfully');
      } catch (err) {
        logger.error('❌ Error loading profile:', err.message);
        setError(err.message);
        
        // 폴백 README 설정
        setReadmeData({
          title: `Hello from ${displayUsername}!`,
          content: generateDefaultReadme(displayUsername)
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, username, profileData]);

  // 노트 로드
  useEffect(() => {
    const loadNotes = async () => {
      try {
        if (!userProfile && !isCurrentUser) return;

        logger.debug('📥 Loading user notes');

        if (isCurrentUser) {
          // 현재 사용자는 NotesStore 데이터 사용
          logger.debug('✅ Using NotesStore data for current user');
          setUserPublicNotes(publicNotes || []);
          loadHighlightNotesFromStore(publicNotes || []);
        } else {
          // 다른 사용자는 실제 데이터 로드
          const actualUserId = userProfile?.user_id || userId;
          if (!actualUserId) return;

          logger.debug('📥 Loading notes from service for user:', actualUserId);
          const result = await OptimizedNotesService.getUserNotes(actualUserId, true); // public only
          
          if (result.error) {
            throw new Error(result.error);
          }

          const notes = result.data || [];
          setUserPublicNotes(notes);
          loadHighlightNotesFromStore(notes);
        }

        logger.debug('✅ Notes loaded successfully');
      } catch (err) {
        logger.error('❌ Error loading notes:', err.message);
        setUserPublicNotes([]);
        setHighlightNotes([]);
      }
    };

    if (!isLoading && !error) {
      loadNotes();
    }
  }, [userProfile, isCurrentUser, isLoading, error, publicNotes]);

  // 하이라이트 노트 처리
  const loadHighlightNotesFromStore = (notesData) => {
    try {
      logger.debug('📈 Processing highlight notes');
      
      if (!notesData || notesData.length === 0) {
        setHighlightNotes([]);
        return;
      }

      // 공개 노트만 필터링
      const userPublicNotes = notesData.filter(note => 
        note.isPublic !== false || note.is_public !== false
      );

      // 최근 업데이트 순으로 정렬
      const sortedNotes = userPublicNotes.sort((a, b) => {
        const aUpdatedDate = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0);
        const bUpdatedDate = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0);
        return bUpdatedDate.getTime() - aUpdatedDate.getTime();
      });

      // 상위 2개만 하이라이트로 사용
      const highlightData = sortedNotes.slice(0, 2).map(note => ({
        ...note,
        starCount: note.star_count || note.starCount || 0,
        forkCount: note.fork_count || note.forkCount || 0,
      }));

      setHighlightNotes(highlightData);
      logger.debug('✅ Highlight notes processed:', highlightData.length);
    } catch (err) {
      logger.error('❌ Error processing highlight notes:', err.message);
      setHighlightNotes([]);
    }
  };

  // 기본 README 생성
  const generateDefaultReadme = (username) => `## Welcome to my profile!

I'm **${username}** who loves to create and share knowledge. Here's what I'm working on:

- Writing insightful notes and articles
- Sharing ideas with the community
- Always learning new things

### My Interests
- Technology and innovation
- Creative writing
- Knowledge sharing

> "Knowledge shared is knowledge multiplied."

Feel free to check out my public notes below!`;

  // 통계 데이터
  const stats = useMemo(() => ({
    myNotesCount: userPublicNotes.length,
    starredNotesCount: isCurrentUser 
      ? getStarredNotes()?.length || 0 
      : 0 // 다른 사용자의 starred notes는 별도 로드 필요
  }), [userPublicNotes.length, isCurrentUser, getStarredNotes]);

  return {
    // 상태
    isLoading,
    error,
    isCurrentUser,
    
    // 데이터
    userProfile,
    displayUsername,
    userPublicNotes,
    readmeData,
    highlightNotes,
    stats,
    
    // 편의 함수들
    refresh: () => {
      setIsLoading(true);
      setError(null);
      // 다시 로드하도록 트리거
    }
  };
};