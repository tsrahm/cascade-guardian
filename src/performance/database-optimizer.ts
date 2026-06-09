/**
 * Performance optimization: Database optimizations
 * Improves query performance with better indexing and caching
 */

import Database from 'better-sqlite3';
import { openDatabase } from '../database/db.js';

// ─── Database Optimization Types ───────────────────────────────────────────────

interface QueryCache {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  stats(): { hits: number; misses: number; size: number };
}

interface OptimizationStats {
  index_optimizations: number;
  cache_hits: number;
  cache_misses: number;
  query_time_saved: number; // in milliseconds
}

// ─── Simple LRU Cache Implementation ───────────────────────────────────────────

class SimpleLRUCache implements QueryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): any {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return undefined;
    }
    
    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.hits++;
    
    return item.value;
  }

  set(key: string, value: any, ttl: number = 300000): void { // 5 minutes default TTL
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    const expiry = ttl > 0 ? Date.now() + ttl : 0;
    this.cache.set(key, { value, expiry });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }
}

// ─── Database Optimizer Implementation ─────────────────────────────────────────

export class DatabaseOptimizer {
  private db: Database.Database;
  private queryCache: QueryCache;
  private stats: OptimizationStats;
  private preparedStatements: Map<string, Database.Statement> = new Map();

  constructor(dbPath: string) {
    this.db = openDatabase(dbPath);
    this.queryCache = new SimpleLRUCache(500); // 500 cached queries
    this.stats = {
      index_optimizations: 0,
      cache_hits: 0,
      cache_misses: 0,
      query_time_saved: 0
    };
    
    this.optimizeDatabase();
  }

  /**
   * Apply database optimizations
   */
  private optimizeDatabase(): void {
    console.log('Optimizing database...');
    
    // Enable performance settings
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 268435456'); // 256MB
    
    // Create optimized indexes
    this.createOptimizedIndexes();
    
    // Analyze database for query planner
    this.db.exec('ANALYZE');
    
    this.stats.index_optimizations = 6;
    console.log('Database optimization completed');
  }

  /**
   * Create optimized indexes for common queries
   */
  private createOptimizedIndexes(): void {
    const indexes = [
      // Composite indexes for common search patterns
      'CREATE INDEX IF NOT EXISTS idx_functions_name_file ON functions(name, file_path)',
      'CREATE INDEX IF NOT EXISTS idx_functions_domain_tier ON functions(domain, tier)',
      'CREATE INDEX IF NOT EXISTS idx_functions_systemlayer ON functions(systemlayer)',
      'CREATE INDEX IF NOT EXISTS idx_functions_file_tier ON functions(file_path, tier)',
      
      // FTS5 optimization
      'CREATE INDEX IF NOT EXISTS idx_functions_fts_rank ON functions_fts(rank)',
      
      // Call graph optimizations
      'CREATE INDEX IF NOT EXISTS idx_call_edges_caller_file ON call_edges(caller_id, file_path)',
      'CREATE INDEX IF NOT EXISTS idx_call_edges_callee_file ON call_edges(callee_id, file_path)',
      'CREATE INDEX IF NOT EXISTS idx_call_edges_file_line ON call_edges(file_path, line_number)',
      
      // Metadata optimization
      'CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key)'
    ];
    
    for (const indexSql of indexes) {
      try {
        this.db.exec(indexSql);
      } catch (error) {
        console.warn(`Failed to create index: ${indexSql}`, error);
      }
    }
  }

  /**
   * Optimized search with caching
   */
  optimizedSearch(query: string, filters: any = {}): any {
    const startTime = Date.now();
    const cacheKey = this.generateSearchCacheKey(query, filters);
    
    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      this.stats.cache_hits++;
      this.stats.query_time_saved += Date.now() - startTime;
      return cached;
    }
    
    this.stats.cache_misses++;
    
    // Execute optimized query
    const result = this.executeOptimizedSearch(query, filters);
    
    // Cache result (short TTL for search results)
    this.queryCache.set(cacheKey, result, 60000); // 1 minute TTL
    
    return result;
  }

  /**
   * Execute optimized search query
   */
  private executeOptimizedSearch(query: string, filters: any): any {
    let sql = `
      SELECT f.* FROM functions f
      JOIN functions_fts fts ON f.id = fts.rowid
      WHERE functions_fts MATCH ?
    `;
    
    const params: any[] = [query];
    
    // Apply filters efficiently
    if (filters.domain) {
      sql += ` AND f.domain = ?`;
      params.push(filters.domain);
    }
    
    if (filters.system_layer) {
      sql += ` AND f.systemlayer = ?`;
      params.push(filters.system_layer);
    }
    
    if (filters.tier !== undefined) {
      sql += ` AND f.tier = ?`;
      params.push(filters.tier);
    }
    
    if (filters.file_path_pattern) {
      sql += ` AND f.file_path LIKE ?`;
      params.push(filters.file_path_pattern);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => `f.tags LIKE ?`).join(' OR ');
      sql += ` AND (${tagConditions})`;
      params.push(...filters.tags.map((tag: string) => `%${tag}%`));
    }
    
    // Use index-aware ordering
    sql += ` ORDER BY fts.rank, f.name LIMIT ?`;
    params.push(filters.limit || 15);
    
    const stmt = this.getPreparedStatement(sql);
    const functions = stmt.all(...params);
    
    return {
      functions,
      total: functions.length,
      query_time: Date.now() - Date.now()
    };
  }

  /**
   * Get or create prepared statement for reuse
   */
  private getPreparedStatement(sql: string): Database.Statement {
    let stmt = this.preparedStatements.get(sql);
    
    if (!stmt) {
      stmt = this.db.prepare(sql);
      this.preparedStatements.set(sql, stmt);
    }
    
    return stmt;
  }

  /**
   * Optimized caller/callee queries
   */
  optimizedGetCallers(functionName: string, filePath?: string): any[] {
    const cacheKey = `callers_${functionName}_${filePath || 'all'}`;
    
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      this.stats.cache_hits++;
      return cached;
    }
    
    this.stats.cache_misses++;
    
    let sql = `
      SELECT DISTINCT f.* FROM functions f
      JOIN call_edges ce ON f.id = ce.caller_id
      JOIN functions callee ON ce.callee_id = callee.id
      WHERE callee.name = ?
    `;
    
    const params = [functionName];
    
    if (filePath) {
      sql += ` AND f.file_path = ?`;
      params.push(filePath);
    }
    
    sql += ` ORDER BY f.file_path, f.line_number`;
    
    const stmt = this.getPreparedStatement(sql);
    const result = stmt.all(...params);
    
    // Cache with longer TTL for call graph data
    this.queryCache.set(cacheKey, result, 300000); // 5 minutes TTL
    
    return result;
  }

  /**
   * Optimized impact analysis
   */
  optimizedGetImpact(functionName: string, maxDepth: number = 5): any {
    const cacheKey = `impact_${functionName}_${maxDepth}`;
    
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      this.stats.cache_hits++;
      return cached;
    }
    
    this.stats.cache_misses++;
    
    // Use recursive CTE for efficient impact analysis
    const sql = `
      WITH RECURSIVE impact_tree AS (
        SELECT callee_id as id, 0 as depth, file_path
        FROM call_edges ce
        JOIN functions f ON ce.callee_id = f.id
        WHERE f.name = ?
        
        UNION ALL
        
        SELECT ce.callee_id, it.depth + 1, ce.file_path
        FROM call_edges ce
        JOIN impact_tree it ON ce.caller_id = it.id
        WHERE it.depth < ?
      )
      SELECT DISTINCT f.*, it.depth, it.file_path
      FROM impact_tree it
      JOIN functions f ON it.id = f.id
      WHERE it.depth > 0
      ORDER BY it.depth, f.file_path
    `;
    
    const stmt = this.getPreparedStatement(sql);
    const result = stmt.all(functionName, maxDepth);
    
    const affectedFunctions = result.map((row: any) => ({
      name: row.name,
      file_path: row.file_path,
      depth: row.depth
    }));
    
    const impact = {
      affected_functions: affectedFunctions,
      total_affected: affectedFunctions.length,
      risk_level: this.calculateRiskLevel(affectedFunctions.length)
    };
    
    // Cache impact analysis
    this.queryCache.set(cacheKey, impact, 180000); // 3 minutes TTL
    
    return impact;
  }

  /**
   * Calculate risk level based on affected functions
   */
  private calculateRiskLevel(count: number): 'low' | 'medium' | 'high' {
    if (count > 50) return 'high';
    if (count > 10) return 'medium';
    return 'low';
  }

  /**
   * Generate cache key for search queries
   */
  private generateSearchCacheKey(query: string, filters: any): string {
    const filterStr = JSON.stringify(filters || {});
    return `search_${query}_${filterStr}`;
  }

  /**
   * Batch insert for better performance
   */
  batchInsert(table: string, columns: string[], data: any[][]): void {
    if (data.length === 0) return;
    
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const stmt = this.getPreparedStatement(sql);
    
    const transaction = this.db.transaction(() => {
      for (const row of data) {
        stmt.run(...row);
      }
    });
    
    transaction();
  }

  /**
   * Vacuum database to reclaim space
   */
  vacuum(): void {
    console.log('Vacuuming database...');
    this.db.exec('VACUUM');
    console.log('Database vacuum completed');
  }

  /**
   * Get optimization statistics
   */
  getStats(): OptimizationStats & { cache_stats: any; prepared_statements: number } {
    return {
      ...this.stats,
      cache_stats: this.queryCache.stats(),
      prepared_statements: this.preparedStatements.size
    };
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.queryCache.clear();
  }

  /**
   * Close database and clean up
   */
  close(): void {
    this.clearCaches();
    this.preparedStatements.clear();
    this.db.close();
  }
}

// ─── Singleton Optimizer Instance ─────────────────────────────────────────────

let globalOptimizer: DatabaseOptimizer | null = null;

export function getDatabaseOptimizer(dbPath: string): DatabaseOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = new DatabaseOptimizer(dbPath);
  }
  return globalOptimizer;
}

export function destroyDatabaseOptimizer(): void {
  if (globalOptimizer) {
    globalOptimizer.close();
    globalOptimizer = null;
  }
}
