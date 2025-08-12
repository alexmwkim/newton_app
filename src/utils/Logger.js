/**
 * Logger - 안전한 로깅 시스템
 * 민감한 정보 필터링 및 개발/프로덕션 환경 구분
 */

class Logger {
  constructor() {
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? 'debug' : 'error';
    
    // 민감한 키워드 패턴
    this.sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /auth/i,
      /credential/i,
      /api[_-]?key/i,
      /service[_-]?role/i,
      /admin[_-]?key/i,
      /supabase[_-]?key/i,
      /expo[_-]?public/i,
      /process\.env/i
    ];
  }

  /**
   * 민감한 정보 필터링
   */
  sanitizeLogData(data) {
    if (typeof data === 'string') {
      // 문자열에서 민감한 패턴 체크
      if (this.containsSensitiveInfo(data)) {
        return '[REDACTED - SENSITIVE DATA]';
      }
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(data)) {
        // 키 자체가 민감한 경우
        if (this.containsSensitiveInfo(key)) {
          sanitized[key] = '[REDACTED]';
        } 
        // 값이 민감한 경우
        else if (typeof value === 'string' && this.containsSensitiveInfo(value)) {
          sanitized[key] = '[REDACTED]';
        }
        // 중첩 객체 재귀 처리
        else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeLogData(value);
        }
        // 안전한 데이터
        else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return data;
  }

  /**
   * 민감한 정보 포함 여부 확인
   */
  containsSensitiveInfo(text) {
    if (typeof text !== 'string') return false;
    
    return this.sensitivePatterns.some(pattern => pattern.test(text));
  }

  /**
   * 개발 환경에서만 로깅
   */
  debug(...args) {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
      console.log('[DEBUG]', ...sanitizedArgs);
    }
  }

  /**
   * 정보성 로깅 (프로덕션에서도 허용)
   */
  info(...args) {
    const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
    console.log('[INFO]', ...sanitizedArgs);
  }

  /**
   * 경고 로깅
   */
  warn(...args) {
    const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
    console.warn('[WARN]', ...sanitizedArgs);
  }

  /**
   * 에러 로깅 (항상 허용)
   */
  error(...args) {
    const sanitizedArgs = args.map(arg => this.sanitizeLogData(arg));
    console.error('[ERROR]', ...sanitizedArgs);
  }

  /**
   * 사용자 액션 로깅 (분석용)
   */
  userAction(action, data = {}) {
    if (this.isDevelopment) {
      const sanitizedData = this.sanitizeLogData(data);
      console.log(`[USER_ACTION] ${action}:`, sanitizedData);
    }
  }

  /**
   * 성능 로깅
   */
  performance(operation, duration, data = {}) {
    if (this.isDevelopment) {
      const sanitizedData = this.sanitizeLogData(data);
      console.log(`[PERF] ${operation}: ${duration}ms`, sanitizedData);
    }
  }

  /**
   * API 요청/응답 로깅 (민감한 데이터 제외)
   */
  api(method, url, data = {}, response = {}) {
    if (this.isDevelopment) {
      const sanitizedData = this.sanitizeLogData(data);
      const sanitizedResponse = this.sanitizeLogData(response);
      
      console.log(`[API] ${method.toUpperCase()} ${url}`);
      if (Object.keys(sanitizedData).length > 0) {
        console.log('[API_DATA]', sanitizedData);
      }
      if (Object.keys(sanitizedResponse).length > 0) {
        console.log('[API_RESPONSE]', sanitizedResponse);
      }
    }
  }

  /**
   * 보안 관련 로깅 (항상 기록, 하지만 민감한 데이터 제외)
   */
  security(event, data = {}) {
    const sanitizedData = this.sanitizeLogData(data);
    console.warn(`[SECURITY] ${event}:`, sanitizedData);
  }

  /**
   * 기존 console.log 대체용 (안전한 로깅)
   */
  log(...args) {
    if (this.isDevelopment) {
      this.debug(...args);
    }
  }
}

// 싱글톤 인스턴스
const logger = new Logger();

// 기존 console.log를 대체하는 안전한 래퍼
export const safeLog = (...args) => logger.log(...args);
export const safeDebug = (...args) => logger.debug(...args);
export const safeInfo = (...args) => logger.info(...args);
export const safeWarn = (...args) => logger.warn(...args);
export const safeError = (...args) => logger.error(...args);

export default logger;