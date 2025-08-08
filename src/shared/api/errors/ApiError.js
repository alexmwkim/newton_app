/**
 * API 에러 클래스들
 * 다양한 종류의 API 에러를 처리하기 위한 계층화된 에러 시스템
 */

/**
 * 기본 API 에러 클래스
 */
export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Supabase 에러 전용 클래스
 */
export class SupabaseError extends ApiError {
  constructor(supabaseError, context = '') {
    const message = supabaseError?.message || 'Unknown Supabase error';
    super(message, {
      code: supabaseError?.code,
      status: supabaseError?.status,
      details: supabaseError?.details,
    });
    
    this.name = 'SupabaseError';
    this.context = context;
    this.originalError = supabaseError;
  }
}

/**
 * 네트워크 에러 클래스
 */
export class NetworkError extends ApiError {
  constructor(message = 'Network request failed', options = {}) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

/**
 * 인증 에러 클래스
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required', options = {}) {
    super(message, { ...options, status: 401 });
    this.name = 'AuthenticationError';
  }
}

/**
 * 권한 에러 클래스
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Permission denied', options = {}) {
    super(message, { ...options, status: 403 });
    this.name = 'AuthorizationError';
  }
}

/**
 * 유효성 검사 에러 클래스
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', validationErrors = [], options = {}) {
    super(message, { ...options, status: 400 });
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * 리소스를 찾을 수 없는 에러
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', options = {}) {
    super(`${resource} not found`, { ...options, status: 404 });
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/**
 * 에러 팩토리 - Supabase 에러를 적절한 에러 클래스로 변환
 */
export class ErrorFactory {
  static fromSupabase(supabaseError, context = '') {
    if (!supabaseError) {
      return new ApiError('Unknown error occurred');
    }

    // Supabase 에러 코드에 따라 적절한 에러 클래스 반환
    switch (supabaseError.code) {
      case 'PGRST116': // Not found
        return new NotFoundError(context || 'Resource', { 
          details: supabaseError.details 
        });
        
      case '42501': // Insufficient privileges
      case 'PGRST301': // RLS policy violation
        return new AuthorizationError(
          `Access denied${context ? ` for ${context}` : ''}`,
          { details: supabaseError.details }
        );
        
      case 'PGRST102': // Invalid request format
      case '23505': // Unique constraint violation
        return new ValidationError(
          supabaseError.message,
          [],
          { details: supabaseError.details }
        );
        
      default:
        return new SupabaseError(supabaseError, context);
    }
  }

  static fromError(error, context = '') {
    if (error instanceof ApiError) {
      return error;
    }

    if (error?.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError('Network connection failed');
    }

    return new ApiError(
      error?.message || 'Unknown error occurred',
      { details: error?.stack }
    );
  }
}

/**
 * 에러 로깅 유틸리티
 */
export class ErrorLogger {
  static log(error, context = {}) {
    const errorData = {
      error: error instanceof ApiError ? error.toJSON() : error,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      timestamp: new Date().toISOString(),
    };

    // 개발 환경에서는 콘솔에 출력
    if (__DEV__) {
      console.error('API Error:', errorData);
    }

    // 프로덕션 환경에서는 에러 추적 서비스로 전송
    // if (!__DEV__) {
    //   Analytics.captureException(error, errorData);
    // }

    return errorData;
  }
}