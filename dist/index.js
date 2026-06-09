/**
 * 🚀 Cascade Guardian - Advanced Semantic Code Index + Real-time Validation
 * Complete code intelligence system for devin/cascade
 */
// Core imports
import { resolveConfig, ensureDirectories, registerProject } from './config.js';
import { buildEnhancedIndex } from './indexer/enhanced-indexer.js';
import { searchCodebase, getFunctionCallers, getFunctionCallees, analyzeImpact, listAllDomains, listAllTags, listAllSystemLayers } from './tools/search.js';
// Advanced features
import { AdvancedSemanticSearch } from './search/advanced-semantic-search.js';
import { RealTimeValidator } from './validation/real-time-validator.js';
import { RealTimeFileWatcher } from './validation/file-watcher.js';
import { JavaScriptIndexer } from './indexer/javascript-indexer.js';
import { getEmbeddingCache } from './performance/embedding-cache.js';
import { getDatabaseOptimizer } from './performance/database-optimizer.js';
import { IncrementalIndexer } from './performance/incremental-indexer.js';
import { logger, LogCategory } from './logging/logger.js';
import { errorHandler, handleAsync, handleSync } from './error/error-handler.js';
// Export advanced search
export { AdvancedSemanticSearch };
// Export validation system
export { RealTimeValidator, RealTimeFileWatcher };
// Export indexing
export { JavaScriptIndexer, IncrementalIndexer };
// Export performance
export { getEmbeddingCache, getDatabaseOptimizer };
// Export logging and error handling
export { logger, LogCategory, errorHandler, handleAsync, handleSync };
// Export configuration
export { resolveConfig, ensureDirectories, registerProject };
// Export utilities
export { searchCodebase, getFunctionCallers, getFunctionCallees, analyzeImpact, listAllDomains, listAllTags, listAllSystemLayers };
// ─── Main API ─────────────────────────────────────────────────────────────────
export class CascadeGuardian {
    config;
    constructor(projectPath) {
        this.config = resolveConfig(projectPath);
        ensureDirectories(this.config);
        registerProject(this.config);
    }
    /**
     * Build the code index for the project
     */
    async buildIndex() {
        await buildEnhancedIndex(this.config.projectRoot);
    }
    /**
     * Search the codebase using hybrid keyword + semantic search
     */
    async search(query, options = {}) {
        return await searchCodebase({
            query,
            ...options,
        });
    }
    /**
     * Find all callers of a function
     */
    async getCallers(functionName, filePath) {
        return await getFunctionCallers({
            function_name: functionName,
            file_path: filePath,
        });
    }
    /**
     * Find all dependencies of a function
     */
    async getCallees(functionName, filePath) {
        return await getFunctionCallees({
            function_name: functionName,
            file_path: filePath,
        });
    }
    /**
     * Analyze the blast radius of a function change
     */
    async getImpact(functionName, filePath, maxDepth) {
        return await analyzeImpact({
            function_name: functionName,
            file_path: filePath,
            max_depth: maxDepth,
        });
    }
    /**
     * List all business domains in the codebase
     */
    async listDomains() {
        return await listAllDomains();
    }
    /**
     * List tags with usage counts
     */
    async listTags(domain, limit) {
        return await listAllTags(domain, limit);
    }
    /**
     * List all system layers
     */
    async listSystemLayers() {
        return await listAllSystemLayers();
    }
    /**
     * Get project configuration
     */
    getConfig() {
        return this.config;
    }
}
// ─── devin/cascade Tool Registration ─────────────────────────────────────────
/**
 * Register Cascade Guardian tools with devin/cascade
 */
export function registerTools() {
    // This would be called by devin/cascade to register the tools
    // The exact implementation depends on devin/cascade's tool registration API
    console.log('Cascade Guardian tools registered');
}
// ─── CLI Interface ───────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const projectPath = process.argv[3];
    const guardian = new CascadeGuardian(projectPath);
    switch (command) {
        case 'build-index':
            guardian.buildIndex()
                .then(() => console.log('Index built successfully'))
                .catch(console.error);
            break;
        case 'search':
            const query = process.argv[4];
            if (!query) {
                console.error('Please provide a search query');
                process.exit(1);
            }
            guardian.search(query)
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(console.error);
            break;
        case 'list-domains':
            guardian.listDomains()
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(console.error);
            break;
        case 'list-tags':
            const domain = process.argv[4];
            guardian.listTags(domain)
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(console.error);
            break;
        case 'list-system-layers':
            guardian.listSystemLayers()
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(console.error);
            break;
        case 'get-callers':
            const functionName = process.argv[4];
            if (!functionName) {
                console.error('Please provide a function name');
                process.exit(1);
            }
            guardian.getCallers(functionName)
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(console.error);
            break;
        case 'get-impact':
            const impactFunctionName = process.argv[4];
            if (!impactFunctionName) {
                console.error('Please provide a function name');
                process.exit(1);
            }
            guardian.getImpact(impactFunctionName)
                .then(results => console.log(JSON.stringify(results, null, 2)))
                .catch(console.error);
            break;
        default:
            console.log(`
Usage:
  cascade-guardian build-index [project-path]
  cascade-guardian search [project-path] "query"
  cascade-guardian list-domains [project-path]
  cascade-guardian list-tags [project-path] [domain]
  cascade-guardian list-system-layers [project-path]
  cascade-guardian get-callers [project-path] "function-name"
  cascade-guardian get-impact [project-path] "function-name"
  
Commands:
  build-index          Build the code index
  search               Search the codebase
  list-domains         List all business domains
  list-tags            List tags with usage counts
  list-system-layers   List architectural layers
  get-callers          Find all callers of a function
  get-impact           Analyze blast radius of a function
      `);
    }
}
//# sourceMappingURL=index.js.map