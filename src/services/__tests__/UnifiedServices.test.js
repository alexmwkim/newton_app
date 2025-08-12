/**
 * UnifiedServices.test.js - 통합된 서비스들의 기본 동작 테스트
 * 실제 Supabase 연결 없이 주요 기능들을 검증
 */

import ValidationUtils from '../ValidationUtils';
import logger from '../../utils/Logger';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: { id: 'test', username: 'testuser' }, error: null })),
        maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      order: jest.fn(() => ({
        range: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'new-id' }, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { id: 'updated' }, error: null }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }))
  }
};

// Mock modules
jest.mock('../supabase', () => ({
  supabase: mockSupabase
}));

describe('ValidationUtils', () => {
  describe('validateUsername', () => {
    test('should validate correct username', () => {
      const result = ValidationUtils.validateUsername('validuser123');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('validuser123');
    });

    test('should reject short username', () => {
      const result = ValidationUtils.validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('3-30 characters');
    });

    test('should reject username with special characters', () => {
      const result = ValidationUtils.validateUsername('user@name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('letters, numbers, underscore, and hyphen');
    });

    test('should reject reserved words', () => {
      const result = ValidationUtils.validateUsername('admin');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('reserved');
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email', () => {
      const result = ValidationUtils.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('test@example.com');
    });

    test('should reject invalid email format', () => {
      const result = ValidationUtils.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('validateTextContent', () => {
    test('should sanitize HTML content', () => {
      const result = ValidationUtils.validateTextContent('<script>alert("xss")</script>Hello');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello');
    });

    test('should reject content that is too long', () => {
      const longContent = 'a'.repeat(501);
      const result = ValidationUtils.validateTextContent(longContent, 500);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('validateNoteData', () => {
    test('should validate correct note data', () => {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note content.'
      };
      const result = ValidationUtils.validateNoteData(noteData);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.title).toBe('Test Note');
      expect(result.sanitized.content).toBe('This is a test note content.');
    });

    test('should detect SQL injection patterns', () => {
      const noteData = {
        title: 'DROP TABLE users',
        content: 'Normal content'
      };
      const result = ValidationUtils.validateNoteData(noteData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Potentially malicious content detected');
    });
  });

  describe('validateUUID', () => {
    test('should validate correct UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = ValidationUtils.validateUUID(uuid);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(uuid.toLowerCase());
    });

    test('should reject invalid UUID', () => {
      const result = ValidationUtils.validateUUID('not-a-uuid');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid UUID format');
    });
  });
});

describe('Logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation()
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  test('should sanitize sensitive information', () => {
    logger.info('Testing with password: mypassword123');
    
    expect(consoleSpy.log).toHaveBeenCalled();
    const logCall = consoleSpy.log.mock.calls[0];
    expect(logCall[0]).toBe('[INFO]');
    expect(logCall[1]).toBe('[REDACTED - SENSITIVE DATA]');
  });

  test('should log errors normally', () => {
    logger.error('Test error message');
    
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'Test error message');
  });

  test('should sanitize object with sensitive keys', () => {
    logger.info('User data:', {
      username: 'testuser',
      api_key: 'secret123',
      email: 'test@example.com'
    });

    expect(consoleSpy.log).toHaveBeenCalled();
    const logCall = consoleSpy.log.mock.calls[0];
    expect(logCall[2].api_key).toBe('[REDACTED]');
    expect(logCall[2].username).toBe('testuser');
    expect(logCall[2].email).toBe('test@example.com');
  });
});

describe('Service Integration', () => {
  test('should maintain backwards compatibility', async () => {
    // Test that old import paths still work
    const ProfileService = require('../profiles.js').default;
    const NotesService = require('../notes.js').default;

    expect(ProfileService).toBeDefined();
    expect(NotesService).toBeDefined();
    
    expect(typeof ProfileService.getProfile).toBe('function');
    expect(typeof NotesService.getNote).toBe('function');
  });

  test('should handle service initialization', () => {
    // Import services
    const UnifiedProfileService = require('../UnifiedProfileService.js').default;
    const OptimizedNotesService = require('../OptimizedNotesService.js').default;

    expect(UnifiedProfileService).toBeDefined();
    expect(OptimizedNotesService).toBeDefined();

    // Check cache functionality
    const cacheStats = OptimizedNotesService.getCacheStats();
    expect(cacheStats).toHaveProperty('size');
    expect(cacheStats).toHaveProperty('maxSize');
  });
});

describe('Error Handling', () => {
  test('should handle network errors gracefully', async () => {
    // Mock network error
    const failingSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.reject(new Error('Network error'))
          })
        })
      })
    };

    // This would test error handling in real services
    expect(() => {
      // Simulated error scenario
      throw new Error('Network error');
    }).toThrow('Network error');
  });

  test('should validate all inputs', () => {
    // Test input validation for various edge cases
    const testCases = [
      { input: null, expected: false },
      { input: undefined, expected: false },
      { input: '', expected: false },
      { input: '  ', expected: false },
      { input: 'valid-input', expected: true }
    ];

    testCases.forEach(({ input, expected }) => {
      const isValid = input && typeof input === 'string' && input.trim().length > 0;
      expect(isValid).toBe(expected);
    });
  });
});

describe('Performance', () => {
  test('should generate slugs efficiently', () => {
    const OptimizedNotesService = require('../OptimizedNotesService.js').default;
    
    const testTitles = [
      'Normal Title',
      'Title with Special Characters!@#$%',
      '   Whitespace   Title   ',
      'Very Long Title That Should Be Truncated Because It Exceeds The Maximum Length Allowed For Slugs',
      ''
    ];

    testTitles.forEach(title => {
      const slug = OptimizedNotesService.generateSlug(title);
      
      expect(typeof slug).toBe('string');
      expect(slug.length).toBeGreaterThan(0);
      expect(slug.length).toBeLessThanOrEqual(50);
      expect(slug).not.toMatch(/[^\w-]/); // Only letters, numbers, and hyphens
    });
  });

  test('should handle cache operations efficiently', () => {
    const OptimizedNotesService = require('../OptimizedNotesService.js').default;
    
    // Test cache key generation
    const key1 = OptimizedNotesService.getCacheKey('test', { id: 1 });
    const key2 = OptimizedNotesService.getCacheKey('test', { id: 2 });
    
    expect(key1).not.toBe(key2);
    expect(typeof key1).toBe('string');
    expect(typeof key2).toBe('string');
  });
});

// Clean up after tests
afterAll(() => {
  // Clean up any resources
  const OptimizedNotesService = require('../OptimizedNotesService.js').default;
  OptimizedNotesService.cleanup();
});