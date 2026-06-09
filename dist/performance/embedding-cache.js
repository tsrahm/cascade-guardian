/**
 * Performance optimization: Embedding cache and lazy loading
 * Reduces memory usage and improves search performance
 */
import { generateEmbedding, batchGenerateEmbeddings } from '../embeddings/embeddings.js';
// ─── Embedding Cache Implementation ─────────────────────────────────────────────
export class EmbeddingCache {
    cache = new Map();
    maxCacheSize; // in bytes
    currentSize = 0;
    stats;
    cleanupInterval;
    constructor(maxCacheSizeMB = 100) {
        this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert MB to bytes
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            maxSize: this.maxCacheSize
        };
        // Cleanup old entries every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    /**
     * Get embedding from cache or generate if not cached
     */
    async getEmbedding(text) {
        const key = this.generateKey(text);
        const cached = this.cache.get(key);
        if (cached) {
            this.stats.hits++;
            // Update timestamp for LRU
            cached.timestamp = Date.now();
            return cached.embedding;
        }
        this.stats.misses++;
        // Generate embedding
        const embedding = await generateEmbedding(text);
        const size = embedding.byteLength;
        // Add to cache
        this.addToCache(key, embedding, size);
        return embedding;
    }
    /**
     * Get multiple embeddings with batch processing
     */
    async getBatchEmbeddings(texts) {
        const uncachedTexts = [];
        const uncachedIndices = [];
        const results = new Array(texts.length);
        // Check cache first
        texts.forEach((text, index) => {
            const key = this.generateKey(text);
            const cached = this.cache.get(key);
            if (cached) {
                results[index] = cached.embedding;
                cached.timestamp = Date.now(); // Update for LRU
                this.stats.hits++;
            }
            else {
                uncachedTexts.push(text);
                uncachedIndices.push(index);
                this.stats.misses++;
            }
        });
        // Generate embeddings for uncached texts in batch
        if (uncachedTexts.length > 0) {
            const newEmbeddings = await batchGenerateEmbeddings(uncachedTexts);
            // Add to cache and results
            uncachedIndices.forEach((index, i) => {
                const embedding = newEmbeddings[i];
                results[index] = embedding;
                const key = this.generateKey(uncachedTexts[i]);
                const size = embedding.byteLength;
                this.addToCache(key, embedding, size);
            });
        }
        return results;
    }
    /**
     * Add embedding to cache with size management
     */
    addToCache(key, embedding, size) {
        // Evict if necessary
        while (this.currentSize + size > this.maxCacheSize && this.cache.size > 0) {
            this.evictLRU();
        }
        // Add new entry
        this.cache.set(key, {
            embedding,
            timestamp: Date.now(),
            size
        });
        this.currentSize += size;
        this.stats.totalSize = this.currentSize;
    }
    /**
     * Evict least recently used entry
     */
    evictLRU() {
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (cached.timestamp < oldestTime) {
                oldestTime = cached.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            const evicted = this.cache.get(oldestKey);
            this.cache.delete(oldestKey);
            this.currentSize -= evicted.size;
            this.stats.evictions++;
        }
    }
    /**
     * Clean up old entries (older than 30 minutes)
     */
    cleanup() {
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        const toDelete = [];
        for (const [key, cached] of this.cache.entries()) {
            if (cached.timestamp < thirtyMinutesAgo) {
                toDelete.push(key);
            }
        }
        toDelete.forEach(key => {
            const cached = this.cache.get(key);
            this.cache.delete(key);
            this.currentSize -= cached.size;
            this.stats.evictions++;
        });
        this.stats.totalSize = this.currentSize;
    }
    /**
     * Generate cache key from text
     */
    generateKey(text) {
        // Simple hash function for cache key
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
        this.currentSize = 0;
        this.stats.totalSize = 0;
        this.stats.evictions += this.cache.size;
    }
    /**
     * Preload embeddings for frequently used texts
     */
    async preload(texts) {
        console.log(`Preloading ${texts.length} embeddings...`);
        // Filter out already cached texts
        const uncachedTexts = texts.filter(text => {
            const key = this.generateKey(text);
            return !this.cache.has(key);
        });
        if (uncachedTexts.length > 0) {
            await this.getBatchEmbeddings(uncachedTexts);
            console.log(`Preloaded ${uncachedTexts.length} new embeddings`);
        }
    }
    /**
     * Destroy cache and cleanup interval
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}
// ─── Singleton Cache Instance ───────────────────────────────────────────────────
let globalCache = null;
export function getEmbeddingCache(maxSizeMB = 100) {
    if (!globalCache) {
        globalCache = new EmbeddingCache(maxSizeMB);
    }
    return globalCache;
}
export function destroyEmbeddingCache() {
    if (globalCache) {
        globalCache.destroy();
        globalCache = null;
    }
}
//# sourceMappingURL=embedding-cache.js.map