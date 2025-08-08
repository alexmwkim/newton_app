import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotesStore } from '../../../store/NotesStore';

/**
 * 프로필 노트 관리를 위한 커스텀 훅
 * - 하이라이트 노트 선별
 * - 즐겨찾기 노트 관리
 * - 노트 통계 계산
 */
export const useProfileNotes = (userId, displayUsername) => {
  const { 
    privateNotes, 
    publicNotes, 
    globalPublicNotes, 
    isFavorite, 
    toggleFavorite, 
    getStarredNotes, 
    starredNotes 
  } = useNotesStore();

  const [highlightNotes, setHighlightNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자의 즐겨찾기 노트 필터링
  const userStarredNotes = useMemo(() => {
    return starredNotes.filter(note => 
      note.user_id === userId || note.username === displayUsername
    );
  }, [starredNotes, userId, displayUsername]);

  // 노트 통계 계산
  const notesStats = useMemo(() => {
    const myNotesCount = publicNotes.length;
    const starredNotesCount = userStarredNotes.length;
    
    // 총 스타 수 계산 (공개 노트들의 스타 수 합계)
    const totalStars = publicNotes.reduce((sum, note) => {
      return sum + (note.star_count || 0);
    }, 0);

    return {
      myNotesCount,
      starredNotesCount,
      totalStars,
      privateNotesCount: privateNotes.length,
    };
  }, [publicNotes, privateNotes, userStarredNotes]);

  // 하이라이트 노트 생성 (최신 2개의 공개 노트)
  const generateHighlightNotes = useCallback(() => {
    try {
      if (!publicNotes || publicNotes.length === 0) {
        setHighlightNotes([]);
        return;
      }

      // 공개 노트를 최신 순으로 정렬하고 상위 2개 선택
      const sortedNotes = [...publicNotes]
        .filter(note => note.isPublic !== false)
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at);
          const dateB = new Date(b.updated_at || b.created_at);
          return dateB - dateA;
        })
        .slice(0, 2);

      // 하이라이트 노트 형식으로 변환
      const highlights = sortedNotes.map(note => ({
        id: note.id,
        title: note.title || 'Untitled Note',
        forkCount: note.fork_count || 0,
        starCount: note.star_count || 0,
        username: displayUsername,
        content: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at,
        isPublic: note.isPublic,
      }));

      setHighlightNotes(highlights);
    } catch (err) {
      console.error('Error generating highlight notes:', err);
      setError('Failed to generate highlight notes');
    }
  }, [publicNotes, displayUsername]);

  // 노트에 스타 토글
  const handleStarToggle = useCallback(async (noteId) => {
    try {
      await toggleFavorite(noteId);
      // 즐겨찾기 상태가 변경된 후 노트 목록 갱신
      await getStarredNotes();
    } catch (err) {
      console.error('Star toggle error:', err);
      setError('Failed to toggle star');
    }
  }, [toggleFavorite, getStarredNotes]);

  // 특정 노트가 즐겨찾기 되어있는지 확인
  const isNoteStarred = useCallback((noteId) => {
    return isFavorite(noteId);
  }, [isFavorite]);

  // 하이라이트 노트 새로고침
  const refreshHighlightNotes = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      generateHighlightNotes();
    } catch (err) {
      setError('Failed to refresh highlight notes');
    } finally {
      setLoading(false);
    }
  }, [generateHighlightNotes]);

  // 공개 노트가 변경될 때마다 하이라이트 노트 업데이트
  useEffect(() => {
    generateHighlightNotes();
  }, [generateHighlightNotes]);

  // 즐겨찾기 노트 로드
  useEffect(() => {
    if (userId) {
      getStarredNotes().catch(err => {
        console.error('Failed to load starred notes:', err);
        setError('Failed to load starred notes');
      });
    }
  }, [userId, getStarredNotes]);

  return {
    // Data
    highlightNotes,
    userStarredNotes,
    publicNotes,
    privateNotes,
    
    // Stats
    notesStats,
    
    // State
    loading,
    error,
    
    // Actions
    handleStarToggle,
    isNoteStarred,
    refreshHighlightNotes,
    clearError: () => setError(null),
    
    // Utils
    generateHighlightNotes,
  };
};