/**
 * Personalized Recommendation Algorithm for Newton App
 * 
 * 사용자의 행동 패턴을 분석하여 개인화된 노트 추천
 * - 스타한 노트들의 패턴 분석
 * - 팔로우한 작성자들의 콘텐츠 스타일
 * - 검색 히스토리와 관심 키워드
 * - 활동 시간대와 노트 조회 패턴
 */

class PersonalizedAlgorithm {
  constructor() {
    this.config = {
      // 개인화 요소별 가중치
      weights: {
        starredNotesPattern: 0.35,    // 스타한 노트 패턴
        followingAuthorsStyle: 0.25,   // 팔로우 작성자 스타일
        searchKeywords: 0.20,          // 검색 키워드 매칭
        contentSimilarity: 0.15,       // 콘텐츠 유사도
        timeActivityPattern: 0.05      // 활동 시간 패턴
      },
      
      // 분석 기간 설정
      analysisWindow: {
        starredNotes: 60,     // 최근 60일간 스타한 노트
        searchHistory: 30,    // 최근 30일간 검색
        activityPattern: 14   // 최근 14일간 활동 패턴
      },
      
      // 키워드 추출 설정
      keywordExtraction: {
        minLength: 3,         // 최소 키워드 길이
        maxKeywords: 20,      // 최대 키워드 수
        commonWords: [        // 제외할 일반적인 단어들
          'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
          '그리고', '하지만', '그래서', '또는', '그런데', '이런', '저런', '그런', '이것', '저것'
        ]
      }
    };
  }

  /**
   * 사용자를 위한 개인화된 노트 추천
   * @param {Array} allNotes - 모든 공개 노트들
   * @param {Object} userData - 사용자 데이터 (스타, 팔로우, 검색 기록 등)
   * @param {string} userId - 현재 사용자 ID
   * @returns {Array} - 개인화 점수순으로 정렬된 노트들
   */
  async generatePersonalizedFeed(allNotes, userData, userId) {
    try {
      console.log('🎯 Generating personalized feed for user:', userId);
      console.log('🎯 Available notes:', allNotes.length);
      console.log('🎯 User data keys:', Object.keys(userData));

      // 1. 사용자 행동 패턴 분석
      const userProfile = this.analyzeUserBehaviorPattern(userData);
      console.log('🎯 User behavior profile:', userProfile);
      
      // 2. 각 노트에 대한 개인화 점수 계산
      const notesWithPersonalizationScore = allNotes.map(note => ({
        ...note,
        personalization_score: this.calculatePersonalizationScore(note, userProfile, userId)
      }));
      
      // 3. 개인화 점수순으로 정렬
      const sortedNotes = notesWithPersonalizationScore
        .filter(note => note.personalization_score > 0.1) // 최소 점수 필터링
        .sort((a, b) => b.personalization_score - a.personalization_score);
        
      console.log('🎯 Personalized feed generated:', sortedNotes.length, 'notes');
      console.log('🎯 Top 3 personalized notes:');
      sortedNotes.slice(0, 3).forEach((note, index) => {
        console.log(`${index + 1}. "${note.title}" - Score: ${note.personalization_score.toFixed(2)}`);
      });
      
      return sortedNotes.slice(0, 20); // 상위 20개 반환
      
    } catch (error) {
      console.error('❌ Error generating personalized feed:', error);
      return allNotes.slice(0, 20); // 오류시 기본 정렬 반환
    }
  }

  /**
   * 사용자 행동 패턴 분석
   * @param {Object} userData - 사용자의 행동 데이터
   * @returns {Object} - 분석된 사용자 프로필
   */
  analyzeUserBehaviorPattern(userData) {
    const profile = {
      preferredKeywords: new Set(),
      preferredAuthors: new Set(),
      preferredCategories: new Set(),
      contentLengthPreference: 'medium', // short, medium, long
      interactionPatterns: {},
      activityTimePattern: []
    };

    try {
      // 1. 스타한 노트들에서 패턴 추출
      if (userData.starredNotes && userData.starredNotes.length > 0) {
        console.log('📊 Analyzing starred notes:', userData.starredNotes.length);
        
        userData.starredNotes.forEach(note => {
          // 키워드 추출
          this.extractKeywords(note.title + ' ' + (note.content || '')).forEach(keyword => {
            profile.preferredKeywords.add(keyword.toLowerCase());
          });
          
          // 작성자 선호도
          if (note.username) {
            profile.preferredAuthors.add(note.username);
          }
          
          // 카테고리 선호도
          if (note.category) {
            profile.preferredCategories.add(note.category);
          }
        });
      }

      // 2. 팔로우한 사용자들에서 패턴 추출
      if (userData.followingUsers && userData.followingUsers.length > 0) {
        console.log('👥 Analyzing following users:', userData.followingUsers.length);
        
        userData.followingUsers.forEach(user => {
          profile.preferredAuthors.add(user.username);
        });
      }

      // 3. 검색 히스토리에서 관심사 추출
      if (userData.searchHistory && userData.searchHistory.length > 0) {
        console.log('🔍 Analyzing search history:', userData.searchHistory.length);
        
        userData.searchHistory.forEach(searchQuery => {
          this.extractKeywords(searchQuery).forEach(keyword => {
            profile.preferredKeywords.add(keyword.toLowerCase());
          });
        });
      }

      // 4. 콘텐츠 길이 선호도 분석
      if (userData.starredNotes && userData.starredNotes.length > 0) {
        const lengths = userData.starredNotes
          .filter(note => note.content)
          .map(note => note.content.length);
        
        if (lengths.length > 0) {
          const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
          profile.contentLengthPreference = avgLength < 300 ? 'short' : 
                                           avgLength < 1000 ? 'medium' : 'long';
        }
      }

      console.log('🎯 User profile analysis complete:', {
        keywords: Array.from(profile.preferredKeywords).slice(0, 10),
        authors: Array.from(profile.preferredAuthors).slice(0, 5),
        categories: Array.from(profile.preferredCategories),
        contentLength: profile.contentLengthPreference
      });

      return profile;
      
    } catch (error) {
      console.error('❌ Error analyzing user behavior:', error);
      return profile;
    }
  }

  /**
   * 노트에 대한 개인화 점수 계산
   * @param {Object} note - 노트 객체
   * @param {Object} userProfile - 사용자 행동 프로필
   * @param {string} userId - 현재 사용자 ID
   * @returns {number} - 개인화 점수 (0~1)
   */
  calculatePersonalizationScore(note, userProfile, userId) {
    try {
      // 자신의 노트는 제외
      if (note.user_id === userId) {
        return 0;
      }

      let score = 0;

      // 1. 키워드 매칭 점수
      const keywordScore = this.calculateKeywordMatchScore(note, userProfile.preferredKeywords);
      score += keywordScore * this.config.weights.searchKeywords;

      // 2. 작성자 선호도 점수
      const authorScore = this.calculateAuthorPreferenceScore(note, userProfile.preferredAuthors);
      score += authorScore * this.config.weights.followingAuthorsStyle;

      // 3. 콘텐츠 유사도 점수
      const similarityScore = this.calculateContentSimilarityScore(note, userProfile);
      score += similarityScore * this.config.weights.contentSimilarity;

      // 4. 스타한 노트 패턴 점수
      const starredPatternScore = this.calculateStarredPatternScore(note, userProfile);
      score += starredPatternScore * this.config.weights.starredNotesPattern;

      // 5. 활동 시간 패턴 점수 (기본값 0.5)
      const timeScore = 0.5;
      score += timeScore * this.config.weights.timeActivityPattern;

      // 최종 점수 정규화 (0~1 범위)
      const normalizedScore = Math.min(Math.max(score, 0), 1);

      return normalizedScore;

    } catch (error) {
      console.error('❌ Error calculating personalization score:', error);
      return 0;
    }
  }

  /**
   * 키워드 매칭 점수 계산
   */
  calculateKeywordMatchScore(note, preferredKeywords) {
    if (preferredKeywords.size === 0) return 0.3; // 기본값

    const noteText = (note.title + ' ' + (note.content || '')).toLowerCase();
    const noteKeywords = this.extractKeywords(noteText);
    
    let matchCount = 0;
    noteKeywords.forEach(keyword => {
      if (preferredKeywords.has(keyword.toLowerCase())) {
        matchCount++;
      }
    });

    return Math.min(matchCount / Math.max(noteKeywords.length, 1), 1);
  }

  /**
   * 작성자 선호도 점수 계산
   */
  calculateAuthorPreferenceScore(note, preferredAuthors) {
    if (preferredAuthors.size === 0) return 0.3; // 기본값

    const noteAuthor = note.username || note.profiles?.username || '';
    return preferredAuthors.has(noteAuthor) ? 1.0 : 0.2;
  }

  /**
   * 콘텐츠 유사도 점수 계산
   */
  calculateContentSimilarityScore(note, userProfile) {
    let score = 0.3; // 기본값

    // 콘텐츠 길이 선호도
    const contentLength = (note.content || '').length;
    const lengthMatch = this.matchesLengthPreference(contentLength, userProfile.contentLengthPreference);
    score += lengthMatch * 0.3;

    // 카테고리 선호도
    if (userProfile.preferredCategories.size > 0 && note.category) {
      score += userProfile.preferredCategories.has(note.category) ? 0.4 : 0;
    }

    return Math.min(score, 1);
  }

  /**
   * 스타한 노트 패턴 점수 계산
   */
  calculateStarredPatternScore(note, userProfile) {
    // 키워드와 작성자 점수의 평균으로 계산
    const keywordScore = this.calculateKeywordMatchScore(note, userProfile.preferredKeywords);
    const authorScore = this.calculateAuthorPreferenceScore(note, userProfile.preferredAuthors);
    
    return (keywordScore + authorScore) / 2;
  }

  /**
   * 키워드 추출 유틸리티
   */
  extractKeywords(text) {
    if (!text) return [];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length >= this.config.keywordExtraction.minLength &&
        !this.config.keywordExtraction.commonWords.includes(word)
      )
      .slice(0, this.config.keywordExtraction.maxKeywords);
  }

  /**
   * 콘텐츠 길이 선호도 매칭
   */
  matchesLengthPreference(contentLength, preference) {
    switch (preference) {
      case 'short':
        return contentLength < 300 ? 1.0 : contentLength < 600 ? 0.5 : 0.2;
      case 'medium':
        return contentLength >= 200 && contentLength <= 1200 ? 1.0 : 0.3;
      case 'long':
        return contentLength > 800 ? 1.0 : contentLength > 400 ? 0.6 : 0.2;
      default:
        return 0.5;
    }
  }

  /**
   * 사용자 데이터 수집 헬퍼 메소드
   */
  async collectUserBehaviorData(userId, notesStore, socialStore) {
    try {
      const userData = {
        starredNotes: [],
        followingUsers: [],
        searchHistory: [],
        activityHistory: []
      };

      // 스타한 노트들 수집 (실제 구현시 Supabase에서 가져오기)
      // userData.starredNotes = await this.getUserStarredNotes(userId);
      
      // 팔로우한 사용자들 수집
      // userData.followingUsers = await this.getUserFollowing(userId);
      
      // 검색 히스토리 수집 (AsyncStorage에서)
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const recentSearches = await AsyncStorage.getItem('recentSearches');
        if (recentSearches) {
          userData.searchHistory = JSON.parse(recentSearches);
        }
      } catch (error) {
        console.log('Search history not available:', error);
      }

      return userData;
      
    } catch (error) {
      console.error('❌ Error collecting user behavior data:', error);
      return {
        starredNotes: [],
        followingUsers: [],
        searchHistory: [],
        activityHistory: []
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const personalizedAlgorithm = new PersonalizedAlgorithm();

export default personalizedAlgorithm;