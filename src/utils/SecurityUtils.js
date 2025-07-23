/**
 * Security Utilities for Newton App
 * Handles security-related functionality and validation
 */

import { Platform } from 'react-native';

class SecurityUtils {
  constructor() {
    this.isProduction = !__DEV__;
  }

  /**
   * Secure logging - only log in development
   */
  secureLog = {
    log: (...args) => {
      if (__DEV__) {
        console.log(...args);
      }
    },
    
    warn: (...args) => {
      if (__DEV__) {
        console.warn(...args);
      } else {
        // In production, send to crash reporting service
        this.reportToCrashlytics('warning', args);
      }
    },
    
    error: (error, context = {}) => {
      if (__DEV__) {
        console.error(error, context);
      } else {
        // In production, send to crash reporting service
        this.reportToCrashlytics('error', { error, context });
      }
    },
    
    sensitive: (message, data = {}) => {
      if (__DEV__) {
        // Never log sensitive data like tokens, passwords, user IDs
        console.log(message, '[SENSITIVE DATA HIDDEN IN PRODUCTION]');
      }
      // Never log sensitive data in production
    }
  };

  /**
   * Input sanitization for user content
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Basic XSS prevention
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Validate Supabase environment variables
   */
  validateEnvironment() {
    const issues = [];

    // Check if service role key is exposed (CRITICAL)
    if (process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      issues.push({
        level: 'CRITICAL',
        issue: 'Service role key exposed in client environment',
        recommendation: 'Remove EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY immediately'
      });
    }

    // Check for required variables
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
      issues.push({
        level: 'ERROR',
        issue: 'EXPO_PUBLIC_SUPABASE_URL not configured',
        recommendation: 'Add Supabase URL to environment variables'
      });
    }

    if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      issues.push({
        level: 'ERROR', 
        issue: 'EXPO_PUBLIC_SUPABASE_ANON_KEY not configured',
        recommendation: 'Add Supabase anon key to environment variables'
      });
    }

    // Warn about development tokens in production
    if (this.isProduction && process.env.SUPABASE_ACCESS_TOKEN) {
      issues.push({
        level: 'WARNING',
        issue: 'Development token present in production build',
        recommendation: 'Remove SUPABASE_ACCESS_TOKEN from production environment'
      });
    }

    return issues;
  }

  /**
   * Content Security Policy for markdown rendering
   */
  sanitizeMarkdown(content) {
    if (!content) return '';
    
    // Basic markdown sanitization
    const sanitized = content
      // Remove dangerous HTML tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*>/gi, '')
      .replace(/<link\b[^<]*>/gi, '')
      // Remove javascript: and data: URLs
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      // Remove on* event handlers
      .replace(/\son\w+\s*=/gi, '');

    return sanitized;
  }

  /**
   * Validate user inputs
   */
  validateUserInput(input, type = 'text') {
    const validation = {
      isValid: true,
      errors: [],
      sanitized: input
    };

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          validation.isValid = false;
          validation.errors.push('Invalid email format');
        }
        break;

      case 'note_title':
        if (!input || input.trim().length === 0) {
          validation.isValid = false;
          validation.errors.push('Title cannot be empty');
        }
        if (input.length > 200) {
          validation.isValid = false;
          validation.errors.push('Title too long (max 200 characters)');
        }
        validation.sanitized = this.sanitizeInput(input);
        break;

      case 'note_content':
        if (input && input.length > 50000) {
          validation.isValid = false;
          validation.errors.push('Content too long (max 50,000 characters)');
        }
        validation.sanitized = this.sanitizeMarkdown(input);
        break;

      case 'username':
        const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
        if (!usernameRegex.test(input)) {
          validation.isValid = false;
          validation.errors.push('Username must be 3-30 characters, alphanumeric, underscore, or dash only');
        }
        break;

      default:
        validation.sanitized = this.sanitizeInput(input);
    }

    return validation;
  }

  /**
   * Check for debug code in production
   */
  checkProductionSafety() {
    if (this.isProduction) {
      const warnings = [];

      // Check if console statements are still present
      if (typeof console.log.toString().includes('native code')) {
        warnings.push('Console logging may still be active in production');
      }

      // Check for debug flags
      if (global.__DEV__) {
        warnings.push('Debug flag still enabled in production build');
      }

      return warnings;
    }
    return [];
  }

  /**
   * Session security helpers
   */
  validateSession(session) {
    if (!session) return false;
    
    // Check if session is expired
    const expiresAt = session.expires_at || session.exp;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      this.secureLog.warn('Session expired');
      return false;
    }

    // Check if user exists
    if (!session.user || !session.user.id) {
      this.secureLog.warn('Invalid session: missing user');
      return false;
    }

    return true;
  }

  /**
   * Secure data storage helpers
   */
  shouldEncryptData(dataType) {
    const sensitiveTypes = [
      'user_credentials',
      'auth_tokens', 
      'personal_notes',
      'user_preferences'
    ];
    
    return sensitiveTypes.includes(dataType);
  }

  /**
   * Generate secure headers for API requests
   */
  getSecureHeaders(includeAuth = false, authToken = null) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Info': 'newton-app-react-native',
    };

    if (includeAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Add security headers
    headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return headers;
  }

  /**
   * Report to crash analytics (placeholder)
   */
  reportToCrashlytics(level, data) {
    // In a real app, integrate with Firebase Crashlytics, Sentry, etc.
    if (__DEV__) {
      console.log(`[${level.toUpperCase()}] Would report to crashlytics:`, data);
    }
  }

  /**
   * Initialize security checks
   */
  runSecurityChecks() {
    const results = {
      environment: this.validateEnvironment(),
      production: this.checkProductionSafety(),
      timestamp: new Date().toISOString()
    };

    // Log critical issues
    const criticalIssues = results.environment.filter(issue => 
      issue.level === 'CRITICAL' || issue.level === 'ERROR'
    );

    if (criticalIssues.length > 0) {
      this.secureLog.error('Critical security issues detected:', criticalIssues);
    }

    return results;
  }
}

// Create global instance
const securityUtils = new SecurityUtils();

// Add to global scope for development debugging
if (__DEV__) {
  global.securityUtils = securityUtils;
  global.runSecurityCheck = () => securityUtils.runSecurityChecks();
}

export default securityUtils;