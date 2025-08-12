/**
 * ServiceIntegrationCheck - 통합된 서비스들의 기본 동작 확인
 * 실제 앱 실행 시 서비스 통합이 제대로 작동하는지 검증
 */

import logger from '../utils/Logger';

class ServiceIntegrationCheck {
  async runBasicChecks() {
    logger.info('🔍 Starting service integration checks...');

    const results = {
      validation: await this.checkValidation(),
      profileService: await this.checkProfileService(),
      notesService: await this.checkNotesService(),
      logger: await this.checkLogger(),
      securityManager: await this.checkSecurityManager()
    };

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.passed).length;

    logger.info(`✅ Integration check completed: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
      logger.info('🎉 All services integrated successfully!');
    } else {
      logger.warn('⚠️ Some integration issues found. Check details below:');
      Object.entries(results).forEach(([service, result]) => {
        if (!result.passed) {
          logger.error(`❌ ${service}: ${result.error}`);
        }
      });
    }

    return results;
  }

  async checkValidation() {
    try {
      const ValidationUtils = (await import('./ValidationUtils.js')).default;
      
      // Basic validation tests
      const usernameTest = ValidationUtils.validateUsername('testuser123');
      const emailTest = ValidationUtils.validateEmail('test@example.com');
      const uuidTest = ValidationUtils.validateUUID('123e4567-e89b-12d3-a456-426614174000');

      if (!usernameTest.isValid || !emailTest.isValid || !uuidTest.isValid) {
        throw new Error('Basic validation tests failed');
      }

      // SQL injection detection test
      const sqlTest = ValidationUtils.detectSQLInjection('DROP TABLE users');
      if (!sqlTest) {
        throw new Error('SQL injection detection failed');
      }

      return { passed: true, message: 'Validation utilities working correctly' };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkProfileService() {
    try {
      // Import both old and new services
      const ProfileService = (await import('./profiles.js')).default;
      const UnifiedProfileService = (await import('./UnifiedProfileService.js')).default;

      // Check that methods exist
      const requiredMethods = ['getProfile', 'createProfile', 'updateProfile', 'checkUsernameAvailability'];
      
      for (const method of requiredMethods) {
        if (typeof ProfileService[method] !== 'function') {
          throw new Error(`ProfileService.${method} is not a function`);
        }
        if (typeof UnifiedProfileService[method] !== 'function') {
          throw new Error(`UnifiedProfileService.${method} is not a function`);
        }
      }

      return { passed: true, message: 'Profile services integrated correctly' };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkNotesService() {
    try {
      const NotesService = (await import('./notes.js')).default;
      const OptimizedNotesService = (await import('./OptimizedNotesService.js')).default;

      // Check that methods exist
      const requiredMethods = ['getNote', 'createNote', 'updateNote', 'deleteNote', 'getUserNotes'];
      
      for (const method of requiredMethods) {
        if (typeof NotesService[method] !== 'function') {
          throw new Error(`NotesService.${method} is not a function`);
        }
        if (typeof OptimizedNotesService[method] !== 'function') {
          throw new Error(`OptimizedNotesService.${method} is not a function`);
        }
      }

      // Check cache functionality
      const cacheStats = OptimizedNotesService.getCacheStats();
      if (!cacheStats || typeof cacheStats.size !== 'number') {
        throw new Error('Cache functionality not working');
      }

      // Test slug generation
      const slug = OptimizedNotesService.generateSlug('Test Title 123');
      if (!slug || typeof slug !== 'string' || slug.length === 0) {
        throw new Error('Slug generation not working');
      }

      return { passed: true, message: 'Notes service integrated correctly' };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkLogger() {
    try {
      const Logger = (await import('../utils/Logger.js')).default;

      // Test sensitive data filtering
      const testData = { username: 'test', password: 'secret123' };
      const sanitized = Logger.sanitizeLogData(testData);
      
      if (sanitized.password !== '[REDACTED]') {
        throw new Error('Sensitive data filtering not working');
      }

      // Test SQL injection pattern detection
      const hasSqlPattern = Logger.containsSensitiveInfo('DROP TABLE users');
      if (!hasSqlPattern) {
        throw new Error('SQL pattern detection not working');
      }

      return { passed: true, message: 'Logger working correctly' };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async checkSecurityManager() {
    try {
      const SecurityManager = (await import('./SecurityManager.js')).default;

      // Check that methods exist
      const requiredMethods = ['createProfile', 'checkUserExists', 'sanitizeProfileInput'];
      
      for (const method of requiredMethods) {
        if (typeof SecurityManager[method] !== 'function') {
          throw new Error(`SecurityManager.${method} is not a function`);
        }
      }

      // Test input sanitization
      const testData = { username: 'test user!@#', bio: '<script>alert("xss")</script>Hello' };
      const sanitized = SecurityManager.sanitizeProfileInput(testData);
      
      if (!sanitized || typeof sanitized !== 'object') {
        throw new Error('Input sanitization not working');
      }

      return { passed: true, message: 'Security manager working correctly' };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // Quick check that can be called during app initialization
  async quickHealthCheck() {
    try {
      // Just verify that all main modules can be imported
      await import('./UnifiedProfileService.js');
      await import('./OptimizedNotesService.js');
      await import('./ValidationUtils.js');
      await import('./SecurityManager.js');
      await import('../utils/Logger.js');

      logger.info('✅ Quick health check passed - all services available');
      return true;
    } catch (error) {
      logger.error('❌ Quick health check failed:', error.message);
      return false;
    }
  }
}

const serviceIntegrationCheck = new ServiceIntegrationCheck();

export default serviceIntegrationCheck;