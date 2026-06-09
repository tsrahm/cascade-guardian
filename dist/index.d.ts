/**
 * 🚀 Cascade Guardian - Advanced Semantic Code Index + Real-time Validation
 * Complete code intelligence system for devin/cascade
 */
import { resolveConfig, ensureDirectories, registerProject } from './config.js';
import { searchCodebase, getFunctionCallers, getFunctionCallees, analyzeImpact, listAllDomains, listAllTags, listAllSystemLayers } from './tools/search.js';
import { AdvancedSemanticSearch } from './search/advanced-semantic-search.js';
import { RealTimeValidator } from './validation/real-time-validator.js';
import { RealTimeFileWatcher } from './validation/file-watcher.js';
import { JavaScriptIndexer } from './indexer/javascript-indexer.js';
import { getEmbeddingCache } from './performance/embedding-cache.js';
import { getDatabaseOptimizer } from './performance/database-optimizer.js';
import { IncrementalIndexer } from './performance/incremental-indexer.js';
import { logger, LogCategory } from './logging/logger.js';
import { errorHandler, handleAsync, handleSync } from './error/error-handler.js';
export { AdvancedSemanticSearch };
export { RealTimeValidator, RealTimeFileWatcher };
export { JavaScriptIndexer, IncrementalIndexer };
export { getEmbeddingCache, getDatabaseOptimizer };
export { logger, LogCategory, errorHandler, handleAsync, handleSync };
export { resolveConfig, ensureDirectories, registerProject };
export { searchCodebase, getFunctionCallers, getFunctionCallees, analyzeImpact, listAllDomains, listAllTags, listAllSystemLayers };
export declare class CascadeGuardian {
    private config;
    constructor(projectPath?: string);
    /**
     * Build the code index for the project
     */
    buildIndex(): Promise<void>;
    /**
     * Search the codebase using hybrid keyword + semantic search
     */
    search(query: string, options?: {
        domain?: string;
        tags?: string[];
        system_layer?: string;
        file_path_pattern?: string;
        tier?: number;
        has_side_effects?: boolean;
        limit?: number;
    }): Promise<any>;
    /**
     * Find all callers of a function
     */
    getCallers(functionName: string, filePath?: string): Promise<any>;
    /**
     * Find all dependencies of a function
     */
    getCallees(functionName: string, filePath?: string): Promise<any>;
    /**
     * Analyze the blast radius of a function change
     */
    getImpact(functionName: string, filePath?: string, maxDepth?: number): Promise<any>;
    /**
     * List all business domains in the codebase
     */
    listDomains(): Promise<any>;
    /**
     * List tags with usage counts
     */
    listTags(domain?: string, limit?: number): Promise<any>;
    /**
     * List all system layers
     */
    listSystemLayers(): Promise<any>;
    /**
     * Get project configuration
     */
    getConfig(): any;
}
/**
 * Register Cascade Guardian tools with devin/cascade
 */
export declare function registerTools(): void;
//# sourceMappingURL=index.d.ts.map