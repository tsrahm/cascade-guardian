/**
 * Performance optimization: Database optimizations
 * Improves query performance with better indexing and caching
 */
interface OptimizationStats {
    index_optimizations: number;
    cache_hits: number;
    cache_misses: number;
    query_time_saved: number;
}
export declare class DatabaseOptimizer {
    private db;
    private queryCache;
    private stats;
    private preparedStatements;
    constructor(dbPath: string);
    /**
     * Apply database optimizations
     */
    private optimizeDatabase;
    /**
     * Create optimized indexes for common queries
     */
    private createOptimizedIndexes;
    /**
     * Optimized search with caching
     */
    optimizedSearch(query: string, filters?: any): any;
    /**
     * Execute optimized search query
     */
    private executeOptimizedSearch;
    /**
     * Get or create prepared statement for reuse
     */
    private getPreparedStatement;
    /**
     * Optimized caller/callee queries
     */
    optimizedGetCallers(functionName: string, filePath?: string): any[];
    /**
     * Optimized impact analysis
     */
    optimizedGetImpact(functionName: string, maxDepth?: number): any;
    /**
     * Calculate risk level based on affected functions
     */
    private calculateRiskLevel;
    /**
     * Generate cache key for search queries
     */
    private generateSearchCacheKey;
    /**
     * Batch insert for better performance
     */
    batchInsert(table: string, columns: string[], data: any[][]): void;
    /**
     * Vacuum database to reclaim space
     */
    vacuum(): void;
    /**
     * Get optimization statistics
     */
    getStats(): OptimizationStats & {
        cache_stats: any;
        prepared_statements: number;
    };
    /**
     * Clear caches
     */
    clearCaches(): void;
    /**
     * Close database and clean up
     */
    close(): void;
}
export declare function getDatabaseOptimizer(dbPath: string): DatabaseOptimizer;
export declare function destroyDatabaseOptimizer(): void;
export {};
//# sourceMappingURL=database-optimizer.d.ts.map