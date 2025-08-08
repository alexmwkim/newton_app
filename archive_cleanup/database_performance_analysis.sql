-- ===========================
-- NEWTON APP DATABASE PERFORMANCE ANALYSIS SYSTEM
-- ===========================
-- This file contains comprehensive queries for analyzing and optimizing the Newton app database

-- ===========================
-- 1. CURRENT DATABASE HEALTH CHECK
-- ===========================

-- Check table sizes and row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
    AND tablename IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
ORDER BY tablename, attname;

-- Get table sizes and bloat information
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes,
    pg_stat_get_tuples_fetched(c.oid) as selects
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public' 
    AND tablename IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ===========================
-- 2. INDEX ANALYSIS AND OPTIMIZATION
-- ===========================

-- Check existing indexes and their usage
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
    AND tablename IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
ORDER BY tablename, idx_scan DESC;

-- Find missing indexes for foreign keys
SELECT 
    c.conname AS constraint_name,
    t.relname AS table_name,
    array_agg(a.attname ORDER BY unnest(c.conkey)) AS columns,
    'CREATE INDEX idx_' || t.relname || '_' || array_to_string(array_agg(a.attname ORDER BY unnest(c.conkey)), '_') || 
    ' ON public.' || t.relname || '(' || array_to_string(array_agg(a.attname ORDER BY unnest(c.conkey)), ', ') || ');' AS suggested_index
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
    AND t.relname IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
    AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class ic ON i.indexrelid = ic.oid
        WHERE i.indrelid = t.oid
        AND i.indkey::int[] = c.conkey::int[]
    )
GROUP BY c.conname, t.relname
ORDER BY t.relname;

-- ===========================
-- 3. QUERY PERFORMANCE ANALYSIS
-- ===========================

-- Slow query detection (requires pg_stat_statements extension)
-- Enable with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT 
    substring(query, 1, 100) AS query_snippet,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE query ILIKE '%notes%' OR query ILIKE '%profiles%' OR query ILIKE '%stars%'
ORDER BY mean_time DESC
LIMIT 10;

-- ===========================
-- 4. NEWTON APP SPECIFIC OPTIMIZATIONS
-- ===========================

-- Composite indexes for common Newton app queries

-- For home feed: Get user's notes ordered by updated_at
-- EXPLAIN ANALYZE SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20;
CREATE INDEX IF NOT EXISTS idx_notes_user_updated_desc ON public.notes(user_id, updated_at DESC);

-- For explore feed: Get public notes with high star count
-- EXPLAIN ANALYZE SELECT * FROM notes WHERE is_public = true ORDER BY star_count DESC, created_at DESC LIMIT 20;
CREATE INDEX IF NOT EXISTS idx_notes_public_popularity ON public.notes(is_public, star_count DESC, created_at DESC) WHERE is_public = true;

-- For user profile: Get user's public notes
-- EXPLAIN ANALYZE SELECT * FROM notes WHERE user_id = $1 AND is_public = true ORDER BY created_at DESC;
CREATE INDEX IF NOT EXISTS idx_notes_user_public_created ON public.notes(user_id, is_public, created_at DESC) WHERE is_public = true;

-- For starred notes: Get notes starred by user with note details
-- EXPLAIN ANALYZE SELECT n.* FROM notes n JOIN stars s ON n.id = s.note_id WHERE s.user_id = $1 ORDER BY s.created_at DESC;
CREATE INDEX IF NOT EXISTS idx_stars_user_created_desc ON public.stars(user_id, created_at DESC);

-- For pinned notes: Get pinned notes by user
-- EXPLAIN ANALYZE SELECT n.* FROM notes n JOIN user_pinned_notes p ON n.id = p.note_id WHERE p.user_id = $1 ORDER BY p.created_at DESC;
CREATE INDEX IF NOT EXISTS idx_pinned_user_created_desc ON public.user_pinned_notes(user_id, created_at DESC);

-- For fork relationships: Get notes forked from specific note
-- EXPLAIN ANALYZE SELECT * FROM notes WHERE forked_from = $1;
CREATE INDEX IF NOT EXISTS idx_notes_forked_from ON public.notes(forked_from) WHERE forked_from IS NOT NULL;

-- For search functionality: Full-text search on title and content
CREATE INDEX IF NOT EXISTS idx_notes_fulltext_search ON public.notes USING gin(to_tsvector('english', title || ' ' || COALESCE(content, ''))) WHERE is_public = true;

-- ===========================
-- 5. PERFORMANCE MONITORING FUNCTIONS
-- ===========================

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        (SELECT COUNT(*) FROM (SELECT 1 FROM pg_class WHERE relname = t.tablename LIMIT 1000000) s)::BIGINT as estimated_rows,
        pg_size_pretty(pg_relation_size('public.'||t.tablename))::TEXT,
        pg_size_pretty(pg_indexes_size('public.'||t.tablename))::TEXT,
        pg_size_pretty(pg_total_relation_size('public.'||t.tablename))::TEXT
    FROM pg_tables t
    WHERE t.schemaname = 'public' 
        AND t.tablename IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
    ORDER BY pg_total_relation_size('public.'||t.tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(query_text TEXT)
RETURNS TABLE(
    execution_plan TEXT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' || query_text;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 6. REAL-TIME MONITORING VIEWS
-- ===========================

-- View for monitoring table activity
CREATE OR REPLACE VIEW table_activity_monitor AS
SELECT 
    schemaname,
    relname as table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public' 
    AND relname IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks');

-- View for monitoring index usage
CREATE OR REPLACE VIEW index_usage_monitor AS
SELECT 
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
    AND relname IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
ORDER BY idx_scan DESC;

-- ===========================
-- 7. CACHE OPTIMIZATION STRATEGIES
-- ===========================

-- Materialized view for popular public notes (refresh every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_notes_cache AS
SELECT 
    n.id,
    n.title,
    n.content,
    n.slug,
    n.star_count,
    n.fork_count,
    n.created_at,
    p.username,
    p.avatar_url
FROM notes n
JOIN profiles p ON n.user_id = p.user_id
WHERE n.is_public = true
    AND n.star_count > 0
ORDER BY n.star_count DESC, n.created_at DESC
LIMIT 100;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_notes_cache_stars ON popular_notes_cache(star_count DESC, created_at DESC);

-- Function to refresh popular notes cache
CREATE OR REPLACE FUNCTION refresh_popular_notes_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW popular_notes_cache;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 8. PARTITIONING STRATEGY (for large datasets)
-- ===========================

-- Partitioning strategy for notes table by date (implement when > 1M notes)
/*
-- Create parent table for partitioned notes
CREATE TABLE notes_partitioned (
    LIKE notes INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE notes_y2024m01 PARTITION OF notes_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE notes_y2024m02 PARTITION OF notes_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... continue for other months
*/

-- ===========================
-- 9. VACUUM AND MAINTENANCE AUTOMATION
-- ===========================

-- Function to analyze table bloat and recommend vacuum
CREATE OR REPLACE FUNCTION check_table_bloat()
RETURNS TABLE(
    table_name TEXT,
    bloat_ratio NUMERIC,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        relname::TEXT,
        CASE 
            WHEN n_dead_tup > 0 THEN 
                ROUND((n_dead_tup::NUMERIC / (n_live_tup + n_dead_tup)) * 100, 2)
            ELSE 0
        END as bloat_ratio,
        CASE 
            WHEN n_dead_tup > 1000 AND (n_dead_tup::NUMERIC / (n_live_tup + n_dead_tup)) > 0.1 THEN 
                'VACUUM ANALYZE recommended'
            WHEN n_dead_tup > 10000 THEN 
                'VACUUM FULL may be needed'
            ELSE 'No action needed'
        END as recommendation
    FROM pg_stat_user_tables
    WHERE schemaname = 'public' 
        AND relname IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks');
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 10. USAGE EXAMPLES AND MONITORING QUERIES
-- ===========================

-- Example: Check current database health
-- SELECT * FROM get_table_stats();

-- Example: Monitor table activity
-- SELECT * FROM table_activity_monitor ORDER BY inserts + updates + deletes DESC;

-- Example: Check index usage
-- SELECT * FROM index_usage_monitor WHERE times_used < 10;

-- Example: Check for table bloat
-- SELECT * FROM check_table_bloat();

-- Example: Analyze a specific query
-- SELECT * FROM analyze_query_performance('SELECT * FROM notes WHERE user_id = ''123e4567-e89b-12d3-a456-426614174000'' ORDER BY created_at DESC LIMIT 10');

-- Example: Refresh popular notes cache (run via cron job every hour)
-- SELECT refresh_popular_notes_cache();

-- ===========================
-- 11. ALERTING QUERIES (for monitoring systems)
-- ===========================

-- Alert: Tables with high bloat ratio
SELECT 'HIGH_BLOAT_ALERT' as alert_type, table_name, bloat_ratio
FROM check_table_bloat()
WHERE bloat_ratio > 20;

-- Alert: Unused indexes (candidates for removal)
SELECT 'UNUSED_INDEX_ALERT' as alert_type, table_name, index_name, index_size
FROM index_usage_monitor
WHERE times_used < 5 AND index_size != '8192 bytes'; -- Exclude small indexes

-- Alert: Tables needing vacuum
SELECT 'VACUUM_NEEDED_ALERT' as alert_type, relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public' 
    AND relname IN ('notes', 'profiles', 'stars', 'user_pinned_notes', 'forks')
    AND n_dead_tup > 1000
    AND (last_autovacuum IS NULL OR last_autovacuum < NOW() - INTERVAL '1 day');