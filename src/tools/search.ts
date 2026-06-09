/**
 * Semantic search tools for devin/cascade integration
 */

import { openDatabase, searchByFTS, getCallers, getCallees, getImpact, listDomains, listTags, listSystemLayers } from '../database/db.js';
import { resolveConfig } from '../config.js';
import { semanticSearch } from '../embeddings/embeddings.js';
import { CallGraphAnalyzer } from '../call-graph/call-graph-analyzer.js';

// ─── Tool Definitions ───────────────────────────────────────────────────────────

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

// ─── Tool Implementations ─────────────────────────────────────────────────────

/**
 * Hybrid keyword + semantic search over the codebase
 */
export async function searchCodebase(input: SearchInput): Promise<SearchOutput> {
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
    } catch (error) {
      // Fallback to FTS only if semantic search fails
      return ftsResult;
    }
  } finally {
    db.close();
  }
}

/**
 * Find all direct callers of a function
 */
export async function getFunctionCallers(input: CallersInput): Promise<CallersOutput> {
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
  } finally {
    db.close();
  }
}

/**
 * Find all direct dependencies of a function
 */
export async function getFunctionCallees(input: CallersInput): Promise<CallersOutput> {
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
  } finally {
    db.close();
  }
}

/**
 * Analyze blast radius - BFS traversal up the caller graph
 */
export async function analyzeImpact(input: ImpactInput): Promise<ImpactOutput> {
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
  } finally {
    db.close();
  }
}

/**
 * List all business domains in the codebase
 */
export async function listAllDomains(): Promise<{ domains: Array<{ domain: string; count: number }> }> {
  const config = resolveConfig();
  const db = openDatabase(config.databasePath);
  
  try {
    const domains = listDomains(db);
    return { domains };
  } finally {
    db.close();
  }
}

/**
 * List tags with usage counts, optionally filtered by domain
 */
export async function listAllTags(domain?: string, limit: number = 50): Promise<{ tags: Array<{ tag: string; count: number }> }> {
  const config = resolveConfig();
  const db = openDatabase(config.databasePath);
  
  try {
    const tags = listTags(db, domain, limit);
    return { tags };
  } finally {
    db.close();
  }
}

/**
 * List all system layers (architectural tiers)
 */
export async function listAllSystemLayers(): Promise<{ system_layers: Array<{ systemlayer: string; count: number }> }> {
  const config = resolveConfig();
  const db = openDatabase(config.databasePath);
  
  try {
    const systemLayers = listSystemLayers(db);
    return { system_layers: systemLayers };
  } finally {
    db.close();
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function mergeSearchResults(ftsResults: any[], semanticResults: any[]): any[] {
  const seen = new Set<number>();
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
