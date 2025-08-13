/**
 * Popular Authors Algorithm for Newton App
 * 
 * 단순한 노트 수 기준이 아닌 종합적인 인기도 점수 기반 알고리즘
 * - 활동도, 참여도, 품질, 평판을 종합적으로 고려
 */

class PopularAuthorsAlgorithm {
  constructor() {
    this.config = {
      // 시간 가중치 설정
      recentActivityWindow: 30, // 최근 30일
      timeDecayFactor: 0.7,     // 시간 감쇠 계수
      
      // 점수 가중치
      weights: {
        contentScore: 0.3,      // 콘텐츠 점수 (노트 수, 품질)
        activityScore: 0.25,    // 활동도 점수 (최근성)
        engagementScore: 0.3,   // 참여도 점수 (스타, 포크, 조회수)
        reputationScore: 0.15   // 평판 점수 (팔로워, 인증)
      },
      
      // 정규화를 위한 최대값들
      maxValues: {
        noteCount: 50,          // 예상 최대 노트 수
        followerCount: 1000,    // 예상 최대 팔로워 수
        totalStars: 500,        // 예상 최대 총 스타 수
        totalViews: 10000       // 예상 최대 총 조회수
      }
    };
  }

  /**
   * 작성자 인기도 점수 계산
   * @param {Object} author - 작성자 데이터
   * @param {Array} authorNotes - 작성자의 노트들
   * @param {Object} socialStats - 소셜 통계 (스타, 포크 등)
   * @returns {number} - 인기도 점수 (0-100)
   */
  calculateAuthorPopularityScore(author, authorNotes = [], socialStats = {}) {
    try {
      // 1. 콘텐츠 점수 계산
      const contentScore = this.calculateContentScore(authorNotes);
      
      // 2. 활동도 점수 계산 
      const activityScore = this.calculateActivityScore(authorNotes);
      
      // 3. 참여도 점수 계산
      const engagementScore = this.calculateEngagementScore(socialStats);
      
      // 4. 평판 점수 계산
      const reputationScore = this.calculateReputationScore(author);
      
      // 5. 가중합 계산
      const totalScore = 
        (contentScore * this.config.weights.contentScore) +
        (activityScore * this.config.weights.activityScore) +
        (engagementScore * this.config.weights.engagementScore) +
        (reputationScore * this.config.weights.reputationScore);
      
      // 6. 0-100 범위로 정규화
      const normalizedScore = Math.min(100, Math.max(0, totalScore * 100));
      
      console.log(`📊 Author ${author.username} popularity breakdown:`, {
        contentScore: (contentScore * 100).toFixed(1),
        activityScore: (activityScore * 100).toFixed(1),
        engagementScore: (engagementScore * 100).toFixed(1),
        reputationScore: (reputationScore * 100).toFixed(1),
        totalScore: normalizedScore.toFixed(1)
      });
      
      return normalizedScore;
      
    } catch (error) {
      console.error('❌ Error calculating author popularity:', error);
      return 0;
    }
  }

  /**
   * 콘텐츠 점수 계산 (노트 수 + 품질)
   */
  calculateContentScore(notes) {
    if (!notes || notes.length === 0) return 0;
    
    // 공개 노트만 카운트
    const publicNotes = notes.filter(note => note.is_public);
    const noteCount = publicNotes.length;
    
    // 노트 수 점수 (로그 스케일)
    const quantityScore = Math.log10(noteCount + 1) / Math.log10(this.config.maxValues.noteCount + 1);
    
    // 노트 품질 점수 (평균 길이, 마크다운 사용 등)
    let qualityScore = 0;
    if (publicNotes.length > 0) {
      const avgLength = publicNotes.reduce((sum, note) => sum + (note.content?.length || 0), 0) / publicNotes.length;
      const hasMarkdownCount = publicNotes.filter(note => 
        note.content && /[#*`\[\]]/g.test(note.content)
      ).length;
      
      qualityScore = Math.min(1, avgLength / 500) * 0.7 + (hasMarkdownCount / publicNotes.length) * 0.3;
    }
    
    return (quantityScore * 0.6 + qualityScore * 0.4);
  }

  /**
   * 활동도 점수 계산 (최근성 기반)
   */
  calculateActivityScore(notes) {
    if (!notes || notes.length === 0) return 0;
    
    const now = new Date();
    const windowMs = this.config.recentActivityWindow * 24 * 60 * 60 * 1000; // 30일을 밀리초로
    
    // 최근 30일 내 노트들
    const recentNotes = notes.filter(note => {
      const noteDate = new Date(note.created_at);
      return (now - noteDate) <= windowMs;
    });
    
    if (recentNotes.length === 0) {
      // 최근 활동이 없으면 전체 노트 중 가장 최신 노트 기준으로 감점
      const latestNote = notes.reduce((latest, note) => 
        new Date(note.created_at) > new Date(latest.created_at) ? note : latest
      );
      const daysSinceLatest = (now - new Date(latestNote.created_at)) / (24 * 60 * 60 * 1000);
      return Math.max(0, 1 - (daysSinceLatest / 365)); // 1년 후 0점
    }
    
    // 최근 활동 점수 (빈도 + 일관성)
    const activityFrequency = recentNotes.length / this.config.recentActivityWindow; // 하루 평균
    const frequencyScore = Math.min(1, activityFrequency * 10); // 하루 0.1개 노트면 만점
    
    // 활동 일관성 (며칠에 걸쳐 분산되어 있는가)
    const uniqueDays = new Set(
      recentNotes.map(note => new Date(note.created_at).toDateString())
    ).size;
    const consistencyScore = Math.min(1, uniqueDays / 14); // 2주간 활동하면 만점
    
    return frequencyScore * 0.6 + consistencyScore * 0.4;
  }

  /**
   * 참여도 점수 계산 (스타, 포크, 조회수)
   */
  calculateEngagementScore(socialStats) {
    const {
      totalStars = 0,
      totalForks = 0,
      totalViews = 0,
      totalComments = 0
    } = socialStats;
    
    // 각 지표를 정규화 (로그 스케일)
    const starScore = Math.log10(totalStars + 1) / Math.log10(this.config.maxValues.totalStars + 1);
    const forkScore = Math.log10(totalForks + 1) / Math.log10(50 + 1); // 포크는 더 희귀하므로 낮은 기준
    const viewScore = Math.log10(totalViews + 1) / Math.log10(this.config.maxValues.totalViews + 1);
    const commentScore = Math.log10(totalComments + 1) / Math.log10(100 + 1);
    
    // 가중합 (스타가 가장 중요)
    return starScore * 0.4 + forkScore * 0.25 + viewScore * 0.2 + commentScore * 0.15;
  }

  /**
   * 평판 점수 계산 (팔로워, 인증 등)
   */
  calculateReputationScore(author) {
    let score = 0;
    
    // 팔로워 수 (로그 스케일)
    const followerCount = author.follower_count || 0;
    const followerScore = Math.log10(followerCount + 1) / Math.log10(this.config.maxValues.followerCount + 1);
    score += followerScore * 0.6;
    
    // 프로필 완성도
    let profileCompleteScore = 0;
    if (author.avatar_url) profileCompleteScore += 0.3;
    if (author.bio && author.bio.length > 10) profileCompleteScore += 0.4;
    if (author.username && author.username.length > 0) profileCompleteScore += 0.3;
    score += profileCompleteScore * 0.25;
    
    // 인증 여부
    if (author.verified) {
      score += 0.15;
    }
    
    return Math.min(1, score);
  }

  /**
   * 작성자 리스트를 인기도 순으로 정렬
   */
  sortAuthorsByPopularity(authorsWithData) {
    return authorsWithData
      .map(authorData => ({
        ...authorData.author,
        popularity_score: this.calculateAuthorPopularityScore(
          authorData.author,
          authorData.notes,
          authorData.socialStats
        ),
        // 디버그 정보 추가
        debug_info: {
          note_count: authorData.notes?.length || 0,
          public_note_count: authorData.notes?.filter(n => n.is_public)?.length || 0,
          total_stars: authorData.socialStats?.totalStars || 0,
          follower_count: authorData.author.follower_count || 0
        }
      }))
      .sort((a, b) => b.popularity_score - a.popularity_score);
  }

  /**
   * 임시 데이터로 소셜 통계 생성 (실제 데이터가 없을 때)
   */
  generateMockSocialStats(author, noteCount) {
    // 작성자별로 일관된 랜덤값 생성 (username 기반 시드)
    const seed = author.username?.charCodeAt(0) || 1;
    const random = (multiplier) => ((seed * multiplier) % 100) / 100;
    
    return {
      totalStars: Math.floor(random(1) * noteCount * 5), // 노트당 0-5개 스타
      totalForks: Math.floor(random(2) * noteCount * 2), // 노트당 0-2개 포크
      totalViews: Math.floor(random(3) * noteCount * 50), // 노트당 0-50뷰
      totalComments: Math.floor(random(4) * noteCount * 3) // 노트당 0-3개 댓글
    };
  }
}

// 싱글톤 인스턴스 생성
const popularAuthorsAlgorithm = new PopularAuthorsAlgorithm();

export default popularAuthorsAlgorithm;