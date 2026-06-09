/**
 * Performance optimization: Embedding cache and lazy loading
 * Reduces memory usage and improves search performance
 */
interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
    maxSize: number;
}
export declare class EmbeddingCache {
    private cache;
    private maxCacheSize;
    private currentSize;
    private stats;
    private cleanupInterval;
    constructor(maxCacheSizeMB?: number);
    /**
     * Get embedding from cache or generate if not cached
     */
    getEmbedding(text: string): Promise<Float32Array>;
    /**
     * Get multiple embeddings with batch processing
     */
    getBatchEmbeddings(texts: string[]): Promise<Float32Array[]>;
    /**
     * Add embedding to cache with size management
     */
    private addToCache;
    /**
     * Evict least recently used entry
     */
    private evictLRU;
    /**
     * Clean up old entries (older than 30 minutes)
     */
    private cleanup;
    /**
     * Generate cache key from text
     */
    private generateKey;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Preload embeddings for frequently used texts
     */
    preload(texts: string[]): Promise<void>;
    /**
     * Destroy cache and cleanup interval
     */
    destroy(): void;
}
export declare function getEmbeddingCache(maxSizeMB?: number): EmbeddingCache;
export declare function destroyEmbeddingCache(): void;
export {};
//# sourceMappingURL=embedding-cache.d.ts.map