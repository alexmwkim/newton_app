/**
 * Newton Trending Algorithm
 * 
 * 주요 플랫폼들의 알고리즘을 분석하여 Newton 앱에 최적화된 trending 점수 계산
 * - Twitter/X: 최근성과 참여도 중심
 * - GitHub: 상대적 성장률과 활동도
 * - Reddit: 로그 가중치와 시간 감쇠
 */

class TrendingAlgorithm {
  constructor() {
    // 알고리즘 설정값들
    this.config = {
      // 시간 관련 설정 (시간 단위)
      timeWindow: 168, // 7일 (168시간)
      peakTimeWindow: 24, // 최고점 시간 (24시간)
      
      // 참여도 가중치
      weights: {
        stars: 2.0,        // 스타 가중치 (가장 중요)
        forks: 1.5,        // 포크 가중치 (실제 사용)
        views: 0.5,        // 조회수 가중치 (기본 관심도)
        comments: 1.2,     // 댓글 가중치 (토론 활성화)
        shares: 1.8        // 공유 가중치 (바이럴성)
      },
      
      // 품질 보너스
      qualityBonus: {
        minContentLength: 100,    // 최소 콘텐츠 길이
        contentLengthBonus: 0.3,  // 길이 보너스
        hasImageBonus: 0.2,       // 이미지 보너스
        hasMarkdownBonus: 0.1,    // 마크다운 보너스
        hasCodeBlockBonus: 0.15   // 코드블록 보너스
      },
      
      // 작성자 팩터
      authorFactor: {
        followerWeight: 0.1,      // 팔로워 가중치
        reputationWeight: 0.2,    // 평판 가중치
        verifiedBonus: 0.3        // 인증 보너스
      }
    };
  }

  /**
   * 메인 trending 점수 계산
   * @param {Object} note - 노트 객체
   * @param {Object} stats - 통계 데이터 (stars, forks, views 등)
   * @param {Object} author - 작성자 정보
   * @returns {number} - trending 점수
   */
  calculateTrendingScore(note, stats = {}, author = {}) {
    try {
      // 1. 참여도 점수 계산
      const engagementScore = this.calculateEngagementScore(stats);
      
      // 2. 시간 감쇠 계산
      const timeDecay = this.calculateTimeDecay(note.created_at);
      
      // 3. 품질 보너스 계산
      const qualityBonus = this.calculateQualityBonus(note);
      
      // 4. 작성자 팩터 계산
      const authorFactor = this.calculateAuthorFactor(author);
      
      // 5. 최종 점수 계산
      const trendingScore = (engagementScore * timeDecay) + qualityBonus + authorFactor;
      
      console.log('📊 Trending Score Calculation:', {
        noteId: note.id,
        engagementScore: engagementScore.toFixed(2),
        timeDecay: timeDecay.toFixed(2),
        qualityBonus: qualityBonus.toFixed(2),
        authorFactor: authorFactor.toFixed(2),
        finalScore: trendingScore.toFixed(2)
      });
      
      return Math.max(0, trendingScore);
      
    } catch (error) {
      console.error('❌ Error calculating trending score:', error);
      return 0;
    }
  }

  /**
   * 참여도 점수 계산 (로그 가중치 적용)
   * Reddit의 로그 가중치 방식을 차용
   */
  calculateEngagementScore(stats) {
    const {
      stars = 0,
      forks = 0,
      views = 0,
      comments = 0,
      shares = 0
    } = stats;
    
    // 로그 가중치 적용 (첫 10개가 다음 100개와 같은 가중치)
    const starScore = Math.log10(stars + 1) * this.config.weights.stars;
    const forkScore = Math.log10(forks + 1) * this.config.weights.forks;
    const viewScore = Math.log10(views + 1) * this.config.weights.views;
    const commentScore = Math.log10(comments + 1) * this.config.weights.comments;
    const shareScore = Math.log10(shares + 1) * this.config.weights.shares;
    
    return starScore + forkScore + viewScore + commentScore + shareScore;
  }

  /**
   * 시간 감쇠 계산
   * Twitter/X의 최근성 중시와 Reddit의 시간 감쇠를 결합
   */
  calculateTimeDecay(createdAt) {
    try {
      const now = new Date();
      const createdTime = new Date(createdAt);
      const ageHours = (now - createdTime) / (1000 * 60 * 60);
      
      // 24시간 이내는 보너스, 7일 후 최소값
      if (ageHours <= this.config.peakTimeWindow) {
        // 24시간 이내는 1.0 ~ 1.2 사이의 보너스
        return 1.2 - (ageHours / this.config.peakTimeWindow) * 0.2;
      } else {
        // 24시간 후부터 7일까지 선형 감소
        const decayFactor = Math.max(0, 1 - (ageHours / this.config.timeWindow));
        return Math.max(0.1, decayFactor); // 최소 0.1 보장
      }
      
    } catch (error) {
      console.error('❌ Error calculating time decay:', error);
      return 0.5; // 기본값
    }
  }

  /**
   * 콘텐츠 품질 보너스 계산
   * GitHub trending의 품질 지표를 노트에 맞게 조정
   */
  calculateQualityBonus(note) {
    let bonus = 0;
    const content = note.content || '';
    
    // 콘텐츠 길이 보너스
    if (content.length > this.config.qualityBonus.minContentLength) {
      const lengthFactor = Math.min(content.length / 1000, 3); // 최대 3배
      bonus += lengthFactor * this.config.qualityBonus.contentLengthBonus;
    }
    
    // 이미지 보너스 (시각적 콘텐츠)
    if (this.hasImages(content)) {
      bonus += this.config.qualityBonus.hasImageBonus;
    }
    
    // 마크다운 포맷팅 보너스
    if (this.hasMarkdownFormatting(content)) {
      bonus += this.config.qualityBonus.hasMarkdownBonus;
    }
    
    // 코드 블록 보너스 (기술적 콘텐츠)
    if (this.hasCodeBlocks(content)) {
      bonus += this.config.qualityBonus.hasCodeBlockBonus;
    }
    
    return bonus;
  }

  /**
   * 작성자 팩터 계산
   * 팔로워 수와 평판을 고려하되 과도한 편향 방지
   */
  calculateAuthorFactor(author) {
    let factor = 0;
    
    // 팔로워 수 정규화 (0~1 범위로)
    const followerCount = author.follower_count || 0;
    const normalizedFollowers = Math.min(Math.log10(followerCount + 1) / 4, 1);
    factor += normalizedFollowers * this.config.authorFactor.followerWeight;
    
    // 평판 점수 (평균 스타 수 등)
    const reputation = author.reputation || 0;
    const normalizedReputation = Math.min(reputation / 10, 1);
    factor += normalizedReputation * this.config.authorFactor.reputationWeight;
    
    // 인증된 사용자 보너스
    if (author.verified) {
      factor += this.config.authorFactor.verifiedBonus;
    }
    
    return factor;
  }

  /**
   * 상대적 성장률 계산 (GitHub 방식)
   * 평소 평균 대비 현재 성장률 비교
   */
  calculateVelocityScore(currentStats, historicalAverage) {
    try {
      const currentTotal = (currentStats.stars || 0) + (currentStats.forks || 0);
      const avgTotal = (historicalAverage.stars || 0) + (historicalAverage.forks || 0);
      
      if (avgTotal === 0) return 1; // 새 노트는 기본값
      
      const velocityRatio = currentTotal / avgTotal;
      
      // 2배 이상 성장시 보너스, 5배 이상시 최대 보너스
      return Math.min(velocityRatio / 2, 2.5);
      
    } catch (error) {
      console.error('❌ Error calculating velocity score:', error);
      return 1;
    }
  }

  /**
   * Wilson Score Confidence Interval 계산 (Reddit 방식)
   * 통계적 신뢰도 기반 점수 계산
   */
  calculateWilsonScore(positive, total, confidence = 0.95) {
    if (total === 0) return 0;
    
    const z = 1.96; // 95% 신뢰구간
    const phat = positive / total;
    
    const numerator = phat + (z * z) / (2 * total) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
    const denominator = 1 + (z * z) / total;
    
    return Math.max(0, numerator / denominator);
  }

  /**
   * 카테고리별 trending 노트 필터링
   */
  filterByCategory(notes, category, timeWindow = 24) {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeWindow * 60 * 60 * 1000);
    
    switch (category.toLowerCase()) {
      case 'trending':
        return notes
          .filter(note => new Date(note.created_at) > cutoffTime)
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, 20);
      
      case 'hot':
        // 최근 6시간 내 높은 참여도
        const hotCutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        return notes
          .filter(note => new Date(note.created_at) > hotCutoff)
          .sort((a, b) => b.engagement_score - a.engagement_score)
          .slice(0, 15);
      
      case 'rising':
        // 성장률 기준 정렬
        return notes
          .filter(note => note.velocity_score > 1.5)
          .sort((a, b) => b.velocity_score - a.velocity_score)
          .slice(0, 10);
      
      default:
        return notes.slice(0, 20);
    }
  }

  // 헬퍼 메서드들
  hasImages(content) {
    return /!\[.*?\]\(.*?\)|<img/.test(content);
  }

  hasMarkdownFormatting(content) {
    return /#{1,6}\s|(\*\*|__).+?\1|(\*|_).+?\2|\[.+?\]\(.+?\)/.test(content);
  }

  hasCodeBlocks(content) {
    return /```[\s\S]*?```|`[^`\n]+`/.test(content);
  }
}

// 싱글톤 인스턴스 생성
const trendingAlgorithm = new TrendingAlgorithm();

export default trendingAlgorithm;