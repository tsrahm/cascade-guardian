/**
 * Semantic search tools for devin/cascade integration
 */
import { openDatabase, searchByFTS, getCallers, getCallees, getImpact, listDomains, listTags, listSystemLayers } from '../database/db.js';
import { resolveConfig } from '../config.js';
import { semanticSearch } from '../embeddings/embeddings.js';
// ─── Tool Implementations ─────────────────────────────────────────────────────
/**
 * Hybrid keyword + semantic search over the codebase
 */
export async function searchCodebase(input) {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        // First try FTS search
        const ftsResult = searchByFTS(db, input.query, {
            domain: input.domain,
            tags: input.tags,
            system_layer: input.system_layer,
            file_path_pattern: input.file_path_pattern,
            tier: input.tier,
            has_side_effects: input.has_side_effects,
            limit: input.limit || 15,
        });
        // If we have semantic search available, enhance the results
        try {
            const semanticResults = await semanticSearch(db, input.query, input.limit || 15);
            // Merge and deduplicate results, prioritizing semantic matches
            const mergedResults = mergeSearchResults(ftsResult.functions, semanticResults);
            return {
                functions: mergedResults.slice(0, input.limit || 15),
                total: mergedResults.length,
                query_time: ftsResult.query_time,
            };
        }
        catch (error) {
            // Fallback to FTS only if semantic search fails
            return ftsResult;
        }
    }
    finally {
        db.close();
    }
}
/**
 * Find all direct callers of a function
 */
export async function getFunctionCallers(input) {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        const callers = getCallers(db, input.function_name, input.file_path);
        return {
            callers: callers.map(caller => ({
                id: caller.id,
                name: caller.name,
                file_path: caller.file_path,
                line_number: caller.line_number,
                tier: caller.tier,
                what: caller.what,
                how: caller.how,
                why: caller.why,
                domain: caller.domain,
                tags: caller.tags,
            })),
        };
    }
    finally {
        db.close();
    }
}
/**
 * Find all direct dependencies of a function
 */
export async function getFunctionCallees(input) {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        const callees = getCallees(db, input.function_name, input.file_path);
        return {
            callers: callees.map(callee => ({
                id: callee.id,
                name: callee.name,
                file_path: callee.file_path,
                line_number: callee.line_number,
                tier: callee.tier,
                what: callee.what,
                how: callee.how,
                why: callee.why,
                domain: callee.domain,
                tags: callee.tags,
            })),
        };
    }
    finally {
        db.close();
    }
}
/**
 * Analyze blast radius - BFS traversal up the caller graph
 */
export async function analyzeImpact(input) {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        const affectedFunctions = getImpact(db, input.function_name, input.file_path, input.max_depth || 5);
        return {
            affected_functions: affectedFunctions.map(func => ({
                id: func.id,
                name: func.name,
                file_path: func.file_path,
                line_number: func.line_number,
                tier: func.tier,
                what: func.what,
                domain: func.domain,
            })),
            total_affected: affectedFunctions.length,
        };
    }
    finally {
        db.close();
    }
}
/**
 * List all business domains in the codebase
 */
export async function listAllDomains() {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        const domains = listDomains(db);
        return { domains };
    }
    finally {
        db.close();
    }
}
/**
 * List tags with usage counts, optionally filtered by domain
 */
export async function listAllTags(domain, limit = 50) {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        const tags = listTags(db, domain, limit);
        return { tags };
    }
    finally {
        db.close();
    }
}
/**
 * List all system layers (architectural tiers)
 */
export async function listAllSystemLayers() {
    const config = resolveConfig();
    const db = openDatabase(config.databasePath);
    try {
        const systemLayers = listSystemLayers(db);
        return { system_layers: systemLayers };
    }
    finally {
        db.close();
    }
}
// ─── Helper Functions ─────────────────────────────────────────────────────────
function mergeSearchResults(ftsResults, semanticResults) {
    const seen = new Set();
    const merged = [];
    // Add semantic results first (higher priority)
    for (const result of semanticResults) {
        merged.push(result);
        seen.add(result.id);
    }
    // Add FTS results that weren't already included
    for (const result of ftsResults) {
        if (!seen.has(result.id)) {
            merged.push(result);
        }
    }
    return merged;
}
//# sourceMappingURL=search.js.map