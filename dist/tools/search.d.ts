/**
 * Semantic search tools for devin/cascade integration
 */
export interface SearchInput {
    query: string;
    domain?: string;
    tags?: string[];
    system_layer?: string;
    file_path_pattern?: string;
    tier?: number;
    has_side_effects?: boolean;
    limit?: number;
}
export interface SearchOutput {
    functions: Array<{
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
    }>;
    total: number;
    query_time: number;
}
export interface CallersInput {
    function_name: string;
    file_path?: string;
}
export interface CallersOutput {
    callers: Array<{
        id: number;
        name: string;
        file_path: string;
        line_number: number;
        tier: number;
        what?: string;
        how?: string;
        why?: string;
        domain?: string;
        tags?: string;
    }>;
}
export interface ImpactInput {
    function_name: string;
    file_path?: string;
    max_depth?: number;
}
export interface ImpactOutput {
    affected_functions: Array<{
        id: number;
        name: string;
        file_path: string;
        line_number: number;
        tier: number;
        what?: string;
        domain?: string;
    }>;
    total_affected: number;
}
/**
 * Hybrid keyword + semantic search over the codebase
 */
export declare function searchCodebase(input: SearchInput): Promise<SearchOutput>;
/**
 * Find all direct callers of a function
 */
export declare function getFunctionCallers(input: CallersInput): Promise<CallersOutput>;
/**
 * Find all direct dependencies of a function
 */
export declare function getFunctionCallees(input: CallersInput): Promise<CallersOutput>;
/**
 * Analyze blast radius - BFS traversal up the caller graph
 */
export declare function analyzeImpact(input: ImpactInput): Promise<ImpactOutput>;
/**
 * List all business domains in the codebase
 */
export declare function listAllDomains(): Promise<{
    domains: Array<{
        domain: string;
        count: number;
    }>;
}>;
/**
 * List tags with usage counts, optionally filtered by domain
 */
export declare function listAllTags(domain?: string, limit?: number): Promise<{
    tags: Array<{
        tag: string;
        count: number;
    }>;
}>;
/**
 * List all system layers (architectural tiers)
 */
export declare function listAllSystemLayers(): Promise<{
    system_layers: Array<{
        systemlayer: string;
        count: number;
    }>;
}>;
//# sourceMappingURL=search.d.ts.map