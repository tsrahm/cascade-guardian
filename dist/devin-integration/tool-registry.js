/**
 * Tool registry for devin/cascade integration
 * Registers Cascade Guardian search and analysis tools
 */
import { CascadeGuardian } from '../index.js';
// ─── Tool Definitions for devin/cascade ───────────────────────────────────────
export const CASCADE_TOOLS = [
    {
        name: 'search_codebase',
        description: 'Hybrid keyword + semantic search across functions, types, and documentation. Use this to find existing code patterns, implementations, or similar functionality.',
        parameters: {
            query: { type: 'string', description: 'Search query (natural language or keywords)', required: true },
            domain: { type: 'string', description: 'Filter by business domain (e.g., "authentication", "data-processing")' },
            tags: { type: 'array', description: 'Filter by tags (e.g., ["validation", "api", "utils"])' },
            system_layer: { type: 'string', description: 'Filter by architectural layer (e.g., "Business Logic", "Data Layer", "UI Helper")' },
            file_path_pattern: { type: 'string', description: 'SQL LIKE pattern for file path (e.g., "src/services/%")' },
            limit: { type: 'number', description: 'Maximum results (default 15, max 50)' }
        }
    },
    {
        name: 'find_function_callers',
        description: 'Find all functions that call the specified function. Use this to understand the impact of changing a function.',
        parameters: {
            function_name: { type: 'string', description: 'Name of the function to analyze', required: true },
            file_path: { type: 'string', description: 'Optional file path to disambiguate functions with the same name' }
        }
    },
    {
        name: 'find_function_dependencies',
        description: 'Find all functions that the specified function calls/depends on. Use this to understand what a function needs.',
        parameters: {
            function_name: { type: 'string', description: 'Name of the function to analyze', required: true },
            file_path: { type: 'string', description: 'Optional file path to disambiguate functions with the same name' }
        }
    },
    {
        name: 'analyze_change_impact',
        description: 'Analyze the blast radius of a function change - find all functions that would be affected. Use this before modifying functions.',
        parameters: {
            function_name: { type: 'string', description: 'Name of the function to analyze', required: true },
            file_path: { type: 'string', description: 'Optional file path to disambiguate functions with the same name' },
            max_depth: { type: 'number', description: 'Maximum depth to traverse the call graph (default 5)' }
        }
    },
    {
        name: 'list_business_domains',
        description: 'List all business domains in the codebase with function counts. Use this to understand the business areas covered.',
        parameters: {}
    },
    {
        name: 'list_tags',
        description: 'List tags with usage counts, optionally filtered by domain. Use this to discover common patterns and keywords.',
        parameters: {
            domain: { type: 'string', description: 'Optional domain to filter tags by' },
            limit: { type: 'number', description: 'Maximum results (default 50, max 200)' }
        }
    },
    {
        name: 'list_architectural_layers',
        description: 'List all system layers (architectural tiers) with function counts. Use this to understand the codebase structure.',
        parameters: {}
    }
];
// ─── Tool Implementation ─────────────────────────────────────────────────────
export class CascadeToolRegistry {
    guardian;
    constructor(projectPath) {
        this.guardian = new CascadeGuardian(projectPath);
    }
    async executeTool(toolName, parameters) {
        switch (toolName) {
            case 'search_codebase':
                return await this.guardian.search(parameters.query, {
                    domain: parameters.domain,
                    tags: parameters.tags,
                    system_layer: parameters.system_layer,
                    file_path_pattern: parameters.file_path_pattern,
                    limit: parameters.limit
                });
            case 'find_function_callers':
                return await this.guardian.getCallers(parameters.function_name, parameters.file_path);
            case 'find_function_dependencies':
                return await this.guardian.getCallees(parameters.function_name, parameters.file_path);
            case 'analyze_change_impact':
                return await this.guardian.getImpact(parameters.function_name, parameters.file_path, parameters.max_depth);
            case 'list_business_domains':
                return await this.guardian.listDomains();
            case 'list_tags':
                return await this.guardian.listTags(parameters.domain, parameters.limit);
            case 'list_architectural_layers':
                return await this.guardian.listSystemLayers();
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    getTools() {
        return CASCADE_TOOLS;
    }
}
// ─── devin/cascade Integration Hook ─────────────────────────────────────────
/**
 * Initialize Cascade Guardian tools for devin/cascade
 * Call this during devin/cascade startup
 */
export function initializeCascadeTools(projectPath) {
    const registry = new CascadeToolRegistry(projectPath);
    // Register tools with devin/cascade
    // This would integrate with devin/cascade's tool registration system
    console.log('Cascade Guardian tools initialized for devin/cascade');
    return registry;
}
//# sourceMappingURL=tool-registry.js.map