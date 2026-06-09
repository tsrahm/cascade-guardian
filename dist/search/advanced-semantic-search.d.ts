/**
 * Advanced semantic search with improved embeddings and ranking
 * Provides more accurate and contextually relevant search results
 */
interface SearchWeights {
    keyword: number;
    semantic: number;
    name_match: number;
    domain_match: number;
    tag_match: number;
    tier_boost: number;
    recency_boost: number;
}
interface SearchResult {
    id: number;
    name: string;
    file_path: string;
    line_number: number;
    tier: number;
    what?: string;
    how?: string;
    why?: string;
    params?: string;
    returns?: string;
    sideeffects?: string;
    systemlayer?: string;
    domain?: string;
    tags?: string;
    inline_comments?: string;
    score: number;
    match_type: 'keyword' | 'semantic' | 'hybrid';
    confidence: number;
    updated_at?: string;
}
interface AdvancedSearchOptions {
    query: string;
    domain?: string;
    tags?: string[];
    system_layer?: string;
    file_path_pattern?: string;
    tier?: number;
    has_side_effects?: boolean;
    limit?: number;
    weights?: Partial<SearchWeights>;
    min_confidence?: number;
    boost_recent?: boolean;
    contextual_search?: boolean;
}
export declare class AdvancedSemanticSearch {
    private db;
    private embeddingCache;
    private defaultWeights;
    constructor(dbPath: string);
    /**
     * Advanced hybrid search with improved ranking
     */
    search(options: AdvancedSearchOptions): Promise<SearchResult[]>;
    /**
     * Enhanced keyword search with better ranking
     */
    private keywordSearch;
    /**
     * Enhanced semantic search with better similarity calculation
     */
    private semanticSearch;
    /**
     * Advanced similarity calculation with multiple metrics
     */
    private calculateAdvancedSimilarity;
    /**
     * Combine keyword and semantic results with smart merging
     */
    private combineResults;
    /**
     * Apply contextual enhancements to search results
     */
    private applyContextualEnhancements;
    /**
     * Final ranking and filtering
     */
    private rankAndFilter;
    /**
     * Calculate keyword search score
     */
    private calculateKeywordScore;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Cosine similarity calculation
     */
    private cosineSimilarity;
    /**
     * Euclidean distance calculation
     */
    private euclideanDistance;
    /**
     * Manhattan distance calculation
     */
    private manhattanDistance;
    /**
     * Contextual search expansion
     */
    contextualSearch(query: string, context: string): Promise<string[]>;
    /**
     * Find semantically related terms
     */
    private findRelatedTerms;
    /**
     * Get search statistics
     */
    getSearchStats(): {
        total_functions: number;
        indexed_functions: number;
        cache_stats: any;
    };
    close(): void;
}
export {};
//# sourceMappingURL=advanced-semantic-search.d.ts.map