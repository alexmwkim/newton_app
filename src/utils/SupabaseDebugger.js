/**
 * Supabase Query Debugger
 * Automatically tracks and analyzes relationship query errors
 */

class SupabaseDebugger {
  constructor() {
    this.errorLog = [];
    this.queryAttempts = new Map();
    this.relationshipCache = new Map();
    this.isEnabled = __DEV__; // Only enable in development
  }

  /**
   * Log a relationship query error with context
   */
  logRelationshipError(tableName, relationshipField, error, query = null) {
    if (!this.isEnabled) return;

    const errorEntry = {
      timestamp: new Date().toISOString(),
      type: 'RELATIONSHIP_ERROR',
      table: tableName,
      field: relationshipField,
      error: error.message,
      errorCode: error.code,
      query: query,
      stack: error.stack,
    };

    this.errorLog.push(errorEntry);
    console.error('🔗❌ Relationship Query Error:', errorEntry);
    
    // Suggest fix based on known patterns
    this.suggestFix(errorEntry);
  }

  /**
   * Log successful query attempts to understand working patterns
   */
  logSuccessfulQuery(tableName, query, result) {
    if (!this.isEnabled) return;

    const queryKey = `${tableName}_${JSON.stringify(query)}`;
    this.queryAttempts.set(queryKey, {
      table: tableName,
      query,
      success: true,
      timestamp: new Date().toISOString(),
      resultCount: result?.length || (result ? 1 : 0),
    });

    console.log('🔗✅ Successful Query:', {
      table: tableName,
      resultCount: result?.length || (result ? 1 : 0),
    });
  }

  /**
   * Analyze error patterns and suggest fixes
   */
  suggestFix(errorEntry) {
    const { table, field, error } = errorEntry;

    // Pattern 1: Could not find relationship
    if (error.includes('Could not find a relationship')) {
      console.warn('🔧 SUGGESTED FIX:', {
        problem: 'Schema cache issue or incorrect foreign key reference',
        solution: 'Use separate queries instead of JOIN',
        example: `
// Instead of this:
.select('*, ${field}(*)')

// Use this approach:
.select('*') // Get main data first
// Then get related data separately
.from('${field.replace(':', '')}').select('*').in('id', ids)
        `,
      });
    }

    // Pattern 2: RLS (Row Level Security) issues
    if (error.includes('RLS') || error.includes('permission')) {
      console.warn('🔧 SUGGESTED FIX:', {
        problem: 'Row Level Security blocking query',
        solution: 'Check RLS policies and user authentication',
        example: `
// Ensure user is authenticated
const user = await supabase.auth.getUser();
console.log('Auth user:', user.data?.user?.id);

// Use auth.uid() in RLS policies
CREATE POLICY "Users can view own data" ON ${table}
  FOR SELECT USING (auth.uid() = user_id);
        `,
      });
    }

    // Pattern 3: Foreign key mismatch
    if (error.includes('foreign key') || table === 'stars') {
      console.warn('🔧 SUGGESTED FIX:', {
        problem: 'Foreign key reference mismatch',
        solution: 'Check which table the foreign key actually references',
        knownIssue: 'stars.user_id references profiles.id, not auth.users(id)',
        example: `
// For stars table, first get profile.id:
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', authUserId)
  .single();

// Then use profile.id for stars query:
const { data: stars } = await supabase
  .from('stars')
  .select('*')
  .eq('user_id', profile.id);
        `,
      });
    }
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary() {
    if (!this.isEnabled) return null;

    const relationshipErrors = this.errorLog.filter(
      (log) => log.type === 'RELATIONSHIP_ERROR'
    );

    const errorsByTable = relationshipErrors.reduce((acc, error) => {
      acc[error.table] = (acc[error.table] || 0) + 1;
      return acc;
    }, {});

    const commonErrors = relationshipErrors.reduce((acc, error) => {
      const key = error.error.substring(0, 50);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      totalErrors: relationshipErrors.length,
      errorsByTable,
      commonErrors,
      recentErrors: relationshipErrors.slice(-5),
    };
  }

  /**
   * Clear error logs
   */
  clearLogs() {
    this.errorLog = [];
    this.queryAttempts.clear();
    console.log('🧹 Supabase debugger logs cleared');
  }

  /**
   * Export logs for analysis
   */
  exportLogs() {
    if (!this.isEnabled) return null;

    return {
      errors: this.errorLog,
      queries: Array.from(this.queryAttempts.entries()),
      summary: this.getErrorSummary(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Wrap a Supabase query with automatic error tracking
   */
  async wrapQuery(tableName, queryFn, queryDescription = '') {
    try {
      const result = await queryFn();
      
      if (result.error) {
        // Check if it's a relationship error
        if (result.error.message?.includes('relationship') || 
            result.error.message?.includes('foreign key') ||
            result.error.message?.includes('RLS')) {
          this.logRelationshipError(
            tableName, 
            queryDescription, 
            result.error,
            queryDescription
          );
        }
        throw result.error;
      }

      this.logSuccessfulQuery(tableName, queryDescription, result.data);
      return result;
    } catch (error) {
      // Log any unexpected errors
      if (error.message?.includes('relationship') || 
          error.message?.includes('foreign key') ||
          error.message?.includes('RLS')) {
        this.logRelationshipError(tableName, queryDescription, error, queryDescription);
      }
      throw error;
    }
  }
}

// Create global instance
const supabaseDebugger = new SupabaseDebugger();

// Add to global scope for easy access in development
if (__DEV__) {
  global.supabaseDebugger = supabaseDebugger;
}

export default supabaseDebugger;