/**
 * Advanced semantic search with improved embeddings and ranking
 * Provides more accurate and contextually relevant search results
 */
import Database from 'better-sqlite3';
import { getEmbeddingCache } from '../performance/embedding-cache.js';
// ─── Advanced Semantic Search Implementation ─────────────────────────────────────
export class AdvancedSemanticSearch {
    db;
    embeddingCache = getEmbeddingCache(100); // 100MB cache
    defaultWeights = {
        keyword: 0.4,
        semantic: 0.6,
        name_match: 0.2,
        domain_match: 0.15,
        tag_match: 0.1,
        tier_boost: 0.1,
        recency_boost: 0.05
    };
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
    }
    /**
     * Advanced hybrid search with improved ranking
     */
    async search(options) {
        const startTime = Date.now();
        // Merge weights with defaults
        const weights = { ...this.defaultWeights, ...options.weights };
        // Step 1: Keyword search (FTS5)
        const keywordResults = await this.keywordSearch(options);
        // Step 2: Semantic search (embeddings)
        const semanticResults = await this.semanticSearch(options);
        // Step 3: Combine and rank results
        const combinedResults = this.combineResults(keywordResults, semanticResults, weights, options);
        // Step 4: Apply contextual enhancements
        const enhancedResults = this.applyContextualEnhancements(combinedResults, options, weights);
        // Step 5: Final ranking and filtering
        const finalResults = this.rankAndFilter(enhancedResults, options);
        console.log(`Advanced search completed in ${Date.now() - startTime}ms`);
        console.log(`  Keyword results: ${keywordResults.length}`);
        console.log(`  Semantic results: ${semanticResults.length}`);
        console.log(`  Final results: ${finalResults.length}`);
        return finalResults;
    }
    /**
     * Enhanced keyword search with better ranking
     */
    async keywordSearch(options) {
        let sql = `
      SELECT f.*, fts.rank as fts_rank, 
             CASE 
               WHEN f.name LIKE ? THEN 1.0
               WHEN f.name LIKE ? THEN 0.8
               ELSE 0.0
             END as name_score
      FROM functions f
      JOIN functions_fts fts ON f.id = fts.rowid
      WHERE functions_fts MATCH ?
    `;
        const params = [
            `${options.query}%`, // Prefix match
            `_%${options.query}%`, // Contains match
            options.query
        ];
        // Apply filters
        if (options.domain) {
            sql += ` AND f.domain = ?`;
            params.push(options.domain);
        }
        if (options.system_layer) {
            sql += ` AND f.systemlayer = ?`;
            params.push(options.system_layer);
        }
        if (options.tier !== undefined) {
            sql += ` AND f.tier = ?`;
            params.push(options.tier);
        }
        if (options.file_path_pattern) {
            sql += ` AND f.file_path LIKE ?`;
            params.push(options.file_path_pattern);
        }
        if (options.tags && options.tags.length > 0) {
            const tagConditions = options.tags.map(() => `f.tags LIKE ?`).join(' OR ');
            sql += ` AND (${tagConditions})`;
            params.push(...options.tags.map(tag => `%${tag}%`));
        }
        sql += ` ORDER BY fts.rank, name_score DESC, f.name LIMIT ?`;
        params.push(options.limit || 50); // Get more results for better combination
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);
        return rows.map((row) => ({
            ...row,
            score: this.calculateKeywordScore(row, options),
            match_type: 'keyword',
            confidence: this.calculateConfidence(row, 'keyword')
        }));
    }
    /**
     * Enhanced semantic search with better similarity calculation
     */
    async semanticSearch(options) {
        // Generate query embedding
        const queryEmbedding = await this.embeddingCache.getEmbedding(options.query);
        // Get all functions with embeddings
        const stmt = this.db.prepare(`
      SELECT id, name, file_path, line_number, tier, what, how, why, params, returns,
             sideeffects, systemlayer, domain, tags, inline_comments, embedding
      FROM functions 
      WHERE embedding IS NOT NULL
    `);
        const functions = stmt.all();
        // Calculate semantic similarities
        const scoredFunctions = await Promise.all(functions.map(async (func) => {
            const funcEmbedding = new Float32Array(func.embedding);
            const similarity = this.calculateAdvancedSimilarity(queryEmbedding, funcEmbedding);
            return {
                ...func,
                embedding: undefined, // Remove embedding from result
                score: similarity,
                match_type: 'semantic',
                confidence: this.calculateConfidence(func, 'semantic', similarity)
            };
        }));
        // Filter by minimum similarity
        const filtered = scoredFunctions.filter(func => func.score > 0.3);
        // Apply filters
        let results = filtered;
        if (options.domain) {
            results = results.filter(func => func.domain === options.domain);
        }
        if (options.system_layer) {
            results = results.filter(func => func.systemlayer === options.system_layer);
        }
        if (options.tier !== undefined) {
            results = results.filter(func => func.tier === options.tier);
        }
        if (options.tags && options.tags.length > 0) {
            results = results.filter(func => options.tags.some(tag => func.tags && func.tags.includes(tag)));
        }
        // Sort by similarity and return top results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, options.limit || 50);
    }
    /**
     * Advanced similarity calculation with multiple metrics
     */
    calculateAdvancedSimilarity(queryEmbedding, docEmbedding) {
        // Cosine similarity
        const cosineSim = this.cosineSimilarity(queryEmbedding, docEmbedding);
        // Euclidean distance (normalized)
        const euclideanDist = this.euclideanDistance(queryEmbedding, docEmbedding);
        const euclideanSim = 1 / (1 + euclideanDist);
        // Manhattan distance (normalized)
        const manhattanDist = this.manhattanDistance(queryEmbedding, docEmbedding);
        const manhattanSim = 1 / (1 + manhattanDist);
        // Weighted combination
        return (cosineSim * 0.6) + (euclideanSim * 0.25) + (manhattanSim * 0.15);
    }
    /**
     * Combine keyword and semantic results with smart merging
     */
    combineResults(keywordResults, semanticResults, weights, options) {
        const combinedMap = new Map();
        // Add keyword results
        for (const result of keywordResults) {
            const weightedScore = result.score * weights.keyword;
            combinedMap.set(result.id, {
                ...result,
                score: weightedScore,
                match_type: 'hybrid'
            });
        }
        // Add/merge semantic results
        for (const result of semanticResults) {
            const existing = combinedMap.get(result.id);
            if (existing) {
                // Merge results
                const semanticScore = result.score * weights.semantic;
                const keywordScore = existing.score * weights.keyword;
                combinedMap.set(result.id, {
                    ...existing,
                    score: keywordScore + semanticScore,
                    match_type: 'hybrid',
                    confidence: Math.max(existing.confidence, result.confidence)
                });
            }
            else {
                // Add semantic-only result
                const weightedScore = result.score * weights.semantic;
                combinedMap.set(result.id, {
                    ...result,
                    score: weightedScore,
                    match_type: 'semantic'
                });
            }
        }
        return Array.from(combinedMap.values());
    }
    /**
     * Apply contextual enhancements to search results
     */
    applyContextualEnhancements(results, options, weights) {
        return results.map(result => {
            let enhancedScore = result.score;
            // Name match boost
            if (result.name.toLowerCase().includes(options.query.toLowerCase())) {
                enhancedScore += weights.name_match;
            }
            // Domain match boost
            if (options.domain && result.domain === options.domain) {
                enhancedScore += weights.domain_match;
            }
            // Tag match boost
            if (options.tags && result.tags) {
                const tagMatches = options.tags.filter(tag => result.tags.includes(tag)).length;
                enhancedScore += (tagMatches / options.tags.length) * weights.tag_match;
            }
            // Tier boost (prefer documented functions)
            if (result.tier === 1) {
                enhancedScore += weights.tier_boost;
            }
            // Recency boost (if enabled)
            if (options.boost_recent && result.updated_at) {
                const daysOld = (Date.now() - new Date(result.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                const recencyBoost = Math.max(0, weights.recency_boost * (1 - daysOld / 365));
                enhancedScore += recencyBoost;
            }
            return {
                ...result,
                score: enhancedScore
            };
        });
    }
    /**
     * Final ranking and filtering
     */
    rankAndFilter(results, options) {
        // Filter by minimum confidence
        let filtered = results;
        if (options.min_confidence) {
            filtered = results.filter(result => result.confidence >= options.min_confidence);
        }
        // Sort by score (descending) then by confidence (descending)
        filtered.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.confidence - a.confidence;
        });
        // Apply limit
        return filtered.slice(0, options.limit || 15);
    }
    /**
     * Calculate keyword search score
     */
    calculateKeywordScore(row, options) {
        let score = row.fts_rank || 0;
        // Name match bonus
        if (row.name_score > 0) {
            score += row.name_score * 0.5;
        }
        // Exact query match bonus
        if (row.what && row.what.toLowerCase().includes(options.query.toLowerCase())) {
            score += 0.3;
        }
        if (row.how && row.how.toLowerCase().includes(options.query.toLowerCase())) {
            score += 0.2;
        }
        if (row.why && row.why.toLowerCase().includes(options.query.toLowerCase())) {
            score += 0.1;
        }
        return Math.min(score, 1.0); // Normalize to 0-1
    }
    /**
     * Calculate confidence score
     */
    calculateConfidence(result, matchType, semanticScore) {
        let confidence = 0.5; // Base confidence
        // Tier-based confidence
        if (result.tier === 1) {
            confidence += 0.3; // Well-documented functions
        }
        else if (result.tier === 2) {
            confidence += 0.1; // Discovered functions
        }
        // Match type confidence
        if (matchType === 'keyword') {
            confidence += 0.2;
        }
        else if (matchType === 'semantic' && semanticScore) {
            confidence += semanticScore * 0.3;
        }
        else if (matchType === 'hybrid') {
            confidence += 0.4;
        }
        // Documentation completeness
        const hasDocs = result.what || result.how || result.why;
        if (hasDocs) {
            confidence += 0.1;
        }
        return Math.min(confidence, 1.0);
    }
    /**
     * Cosine similarity calculation
     */
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    /**
     * Euclidean distance calculation
     */
    euclideanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
    /**
     * Manhattan distance calculation
     */
    manhattanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.abs(a[i] - b[i]);
        }
        return sum;
    }
    /**
     * Contextual search expansion
     */
    async contextualSearch(query, context) {
        // Generate embeddings for context and query
        const [queryEmbedding, contextEmbedding] = await Promise.all([
            this.embeddingCache.getEmbedding(query),
            this.embeddingCache.getEmbedding(context)
        ]);
        // Find related terms from the database
        const relatedTerms = await this.findRelatedTerms(queryEmbedding, contextEmbedding);
        // Expand query with related terms
        return [query, ...relatedTerms.slice(0, 5)];
    }
    /**
     * Find semantically related terms
     */
    async findRelatedTerms(queryEmbedding, contextEmbedding) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT name, what, how, why, tags, embedding
      FROM functions 
      WHERE embedding IS NOT NULL
      LIMIT 100
    `);
        const functions = stmt.all();
        const similarities = await Promise.all(functions.map(async (func) => {
            const funcEmbedding = new Float32Array(func.embedding);
            const querySim = this.cosineSimilarity(queryEmbedding, funcEmbedding);
            const contextSim = this.cosineSimilarity(contextEmbedding, funcEmbedding);
            return {
                name: func.name,
                what: func.what,
                how: func.how,
                why: func.why,
                tags: func.tags,
                similarity: (querySim + contextSim) / 2
            };
        }));
        // Extract key terms from top matches
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10)
            .flatMap(func => {
            const terms = [func.name];
            if (func.what)
                terms.push(...func.what.split(' ').filter((word) => word.length > 3));
            if (func.how)
                terms.push(...func.how.split(' ').filter((word) => word.length > 3));
            if (func.tags)
                terms.push(...func.tags.split(',').map((tag) => tag.trim()));
            return terms;
        })
            .filter((term, index, array) => array.indexOf(term) === index) // Remove duplicates
            .slice(0, 5);
    }
    /**
     * Get search statistics
     */
    getSearchStats() {
        const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM functions');
        const indexedStmt = this.db.prepare('SELECT COUNT(*) as count FROM functions WHERE embedding IS NOT NULL');
        return {
            total_functions: totalStmt.get().count,
            indexed_functions: indexedStmt.get().count,
            cache_stats: this.embeddingCache.getStats()
        };
    }
    close() {
        this.embeddingCache.destroy();
        this.db.close();
    }
}
//# sourceMappingURL=advanced-semantic-search.js.map