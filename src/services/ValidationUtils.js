/**
 * ValidationUtils - 입력 검증 및 sanitization 유틸리티
 * SQL Injection 및 XSS 공격 방지
 */

class ValidationUtils {
  /**
   * 사용자명 검증
   */
  static validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();
    
    // 길이 검증
    if (trimmed.length < 3 || trimmed.length > 30) {
      return { isValid: false, error: 'Username must be 3-30 characters long' };
    }

    // 허용된 문자만 사용 (영문, 숫자, 밑줄, 하이픈)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(trimmed)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscore, and hyphen' };
    }

    // 예약어 검사
    const reservedWords = ['admin', 'root', 'system', 'null', 'undefined', 'api', 'www'];
    if (reservedWords.includes(trimmed.toLowerCase())) {
      return { isValid: false, error: 'Username is reserved' };
    }

    return { isValid: true, sanitized: trimmed };
  }

  /**
   * 이메일 검증
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();
    
    // 기본 이메일 패턴 검증
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // 길이 제한
    if (trimmed.length > 254) {
      return { isValid: false, error: 'Email too long' };
    }

    return { isValid: true, sanitized: trimmed };
  }

  /**
   * Bio/텍스트 콘텐츠 검증 및 sanitization
   */
  static validateTextContent(content, maxLength = 500) {
    if (!content) {
      return { isValid: true, sanitized: '' };
    }

    if (typeof content !== 'string') {
      return { isValid: false, error: 'Content must be text' };
    }

    const trimmed = content.trim();
    
    // 길이 검증
    if (trimmed.length > maxLength) {
      return { isValid: false, error: `Content too long (max ${maxLength} characters)` };
    }

    // 기본적인 HTML 태그 제거 (XSS 방지)
    const sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script 태그 제거
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // iframe 태그 제거
      .replace(/javascript:/gi, '') // javascript: URL 제거
      .replace(/on\w+\s*=/gi, ''); // 이벤트 핸들러 제거

    return { isValid: true, sanitized };
  }

  /**
   * URL 검증
   */
  static validateUrl(url) {
    if (!url) {
      return { isValid: true, sanitized: null };
    }

    if (typeof url !== 'string') {
      return { isValid: false, error: 'URL must be text' };
    }

    const trimmed = url.trim();

    try {
      const urlObj = new URL(trimmed);
      
      // HTTPS만 허용 (보안)
      if (urlObj.protocol !== 'https:') {
        return { isValid: false, error: 'Only HTTPS URLs are allowed' };
      }

      // 허용된 도메인만 (예: 이미지 호스팅 서비스들)
      const allowedDomains = [
        'supabase.co',
        'supabase.in', 
        'amazonaws.com',
        'cloudflare.com',
        'imgur.com',
        'gravatar.com',
        'googleusercontent.com'
      ];

      const isAllowedDomain = allowedDomains.some(domain => 
        urlObj.hostname.endsWith(domain)
      );

      if (!isAllowedDomain) {
        console.warn('⚠️ URL from non-whitelisted domain:', urlObj.hostname);
        // 경고만 하고 허용 (너무 제한적이면 사용성 저해)
      }

      return { isValid: true, sanitized: trimmed };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * 노트 제목 검증
   */
  static validateNoteTitle(title) {
    if (!title || typeof title !== 'string') {
      return { isValid: false, error: 'Note title is required' };
    }

    const trimmed = title.trim();
    
    if (trimmed.length < 1 || trimmed.length > 100) {
      return { isValid: false, error: 'Title must be 1-100 characters long' };
    }

    // 기본적인 sanitization
    const sanitized = trimmed
      .replace(/[<>]/g, '') // HTML 태그 방지
      .replace(/[\x00-\x1F\x7F]/g, ''); // 제어 문자 제거

    return { isValid: true, sanitized };
  }

  /**
   * 노트 콘텐츠 검증 (마크다운 허용)
   */
  static validateNoteContent(content, maxLength = 50000) {
    if (!content) {
      return { isValid: true, sanitized: '' };
    }

    if (typeof content !== 'string') {
      return { isValid: false, error: 'Content must be text' };
    }

    const trimmed = content.trim();
    
    if (trimmed.length > maxLength) {
      return { isValid: false, error: `Content too long (max ${maxLength} characters)` };
    }

    // 마크다운은 허용하되 위험한 HTML만 제거
    const sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    return { isValid: true, sanitized };
  }

  /**
   * UUID 검증
   */
  static validateUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
      return { isValid: false, error: 'UUID is required' };
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidPattern.test(uuid)) {
      return { isValid: false, error: 'Invalid UUID format' };
    }

    return { isValid: true, sanitized: uuid.toLowerCase() };
  }

  /**
   * SQL Injection 패턴 감지
   */
  static detectSQLInjection(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(UNION\s+SELECT)/i,
      /(OR\s+1\s*=\s*1)/i,
      /(AND\s+1\s*=\s*1)/i,
      /(\bXP_\w+)/i,
      /(\bSP_\w+)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\b(WAITFOR|DELAY)\s+)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * 통합 검증 함수
   */
  static validateProfileData(profileData) {
    const errors = [];
    const sanitized = {};

    // 사용자명 검증
    if (profileData.username) {
      const usernameResult = this.validateUsername(profileData.username);
      if (!usernameResult.isValid) {
        errors.push(usernameResult.error);
      } else {
        sanitized.username = usernameResult.sanitized;
      }
    }

    // Bio 검증
    if (profileData.bio) {
      const bioResult = this.validateTextContent(profileData.bio, 500);
      if (!bioResult.isValid) {
        errors.push(bioResult.error);
      } else {
        sanitized.bio = bioResult.sanitized;
      }
    }

    // Avatar URL 검증
    if (profileData.avatar_url) {
      const urlResult = this.validateUrl(profileData.avatar_url);
      if (!urlResult.isValid) {
        errors.push(urlResult.error);
      } else {
        sanitized.avatar_url = urlResult.sanitized;
      }
    }

    // README 검증
    if (profileData.readme_content) {
      const readmeResult = this.validateTextContent(profileData.readme_content, 5000);
      if (!readmeResult.isValid) {
        errors.push(readmeResult.error);
      } else {
        sanitized.readme_content = readmeResult.sanitized;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * 노트 데이터 검증
   */
  static validateNoteData(noteData) {
    const errors = [];
    const sanitized = {};

    // 제목 검증
    if (noteData.title) {
      const titleResult = this.validateNoteTitle(noteData.title);
      if (!titleResult.isValid) {
        errors.push(titleResult.error);
      } else {
        sanitized.title = titleResult.sanitized;
      }
    }

    // 콘텐츠 검증
    if (noteData.content) {
      const contentResult = this.validateNoteContent(noteData.content);
      if (!contentResult.isValid) {
        errors.push(contentResult.error);
      } else {
        sanitized.content = contentResult.sanitized;
      }
    }

    // SQL Injection 패턴 감지
    if (this.detectSQLInjection(noteData.title) || this.detectSQLInjection(noteData.content)) {
      errors.push('Potentially malicious content detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
}

export default ValidationUtils;