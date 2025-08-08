import { supabase } from '../../config/supabase'; // Supabase 클라이언트
import { ErrorFactory, ErrorLogger } from '../errors/ApiError';

/**
 * 기본 API 클래스
 * 모든 API 서비스가 상속받는 베이스 클래스
 * 
 * 공통 기능:
 * - 에러 처리
 * - 로깅
 * - 재시도 로직
 * - 요청/응답 변환
 */
export class BaseApi {
  constructor(tableName, options = {}) {
    this.tableName = tableName;
    this.options = {
      retryCount: 2,
      retryDelay: 1000,
      timeout: 10000,
      ...options,
    };
    this.supabase = supabase;
  }

  /**
   * 에러 처리 및 로깅
   */
  handleError(error, context = '') {
    const apiError = ErrorFactory.fromSupabase(error, context);
    ErrorLogger.log(apiError, { 
      table: this.tableName, 
      context,
      method: context.split(' ')[0] // GET, POST, etc.
    });
    return apiError;
  }

  /**
   * 성공 응답 로깅 (개발 모드에서만)
   */
  logSuccess(operation, data) {
    if (__DEV__) {
      console.log(`✅ ${this.tableName} ${operation}:`, data);
    }
  }

  /**
   * 재시도 로직이 포함된 요청 실행
   */
  async executeWithRetry(operation, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.retryCount + 1; attempt++) {
      try {
        const result = await operation();
        
        if (result.error) {
          throw this.handleError(result.error, context);
        }

        this.logSuccess(context, result.data);
        return result.data;
      } catch (error) {
        lastError = error;
        
        // 마지막 시도이거나 재시도할 수 없는 에러인 경우
        if (attempt > this.options.retryCount || !this.shouldRetry(error)) {
          throw error;
        }

        // 재시도 전 대기
        await this.delay(this.options.retryDelay * attempt);
      }
    }

    throw lastError;
  }

  /**
   * 재시도 가능한 에러인지 판단
   */
  shouldRetry(error) {
    // 네트워크 에러나 5xx 서버 에러는 재시도 가능
    return (
      error.name === 'NetworkError' ||
      (error.status >= 500 && error.status < 600) ||
      error.code === 'PGRST501' // Service unavailable
    );
  }

  /**
   * 지연 함수
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 기본 CRUD 작업들
   */

  /**
   * 단일 레코드 조회
   */
  async findById(id, select = '*') {
    return this.executeWithRetry(
      () => this.supabase
        .from(this.tableName)
        .select(select)
        .eq('id', id)
        .single(),
      `GET ${this.tableName} by ID`
    );
  }

  /**
   * 조건부 단일 레코드 조회
   */
  async findOne(conditions = {}, select = '*') {
    let query = this.supabase
      .from(this.tableName)
      .select(select);

    // 조건 적용
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return this.executeWithRetry(
      () => query.single(),
      `GET ${this.tableName} findOne`
    );
  }

  /**
   * 다중 레코드 조회
   */
  async findMany(conditions = {}, options = {}) {
    const {
      select = '*',
      orderBy = null,
      ascending = true,
      limit = null,
      offset = null,
    } = options;

    let query = this.supabase
      .from(this.tableName)
      .select(select);

    // 조건 적용
    Object.entries(conditions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });

    // 정렬
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    // 페이지네이션
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    return this.executeWithRetry(
      () => query,
      `GET ${this.tableName} findMany`
    );
  }

  /**
   * 레코드 생성
   */
  async create(data) {
    return this.executeWithRetry(
      () => this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single(),
      `POST ${this.tableName} create`
    );
  }

  /**
   * 레코드 업데이트
   */
  async update(id, data) {
    return this.executeWithRetry(
      () => this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single(),
      `PATCH ${this.tableName} update`
    );
  }

  /**
   * 조건부 업데이트
   */
  async updateWhere(conditions, data) {
    let query = this.supabase
      .from(this.tableName)
      .update(data);

    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return this.executeWithRetry(
      () => query.select(),
      `PATCH ${this.tableName} updateWhere`
    );
  }

  /**
   * 레코드 삭제
   */
  async delete(id) {
    return this.executeWithRetry(
      () => this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select()
        .single(),
      `DELETE ${this.tableName} delete`
    );
  }

  /**
   * 개수 조회
   */
  async count(conditions = {}) {
    let query = this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true });

    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const result = await this.executeWithRetry(
      () => query,
      `GET ${this.tableName} count`
    );

    return result.count || 0;
  }

  /**
   * 존재 여부 확인
   */
  async exists(conditions) {
    try {
      await this.findOne(conditions, 'id');
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return false;
      }
      throw error;
    }
  }
}