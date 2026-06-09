/**
 * Database layer for Cascade Guardian - SQLite with FTS5 and vector embeddings
 */
import Database from 'better-sqlite3';
export interface FunctionRecord {
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
    embedding?: Buffer;
    created_at: string;
    updated_at: string;
}
export interface SearchResult {
    functions: FunctionRecord[];
    total: number;
    query_time: number;
}
export interface SearchFilters {
    domain?: string;
    tags?: string[];
    system_layer?: string;
    file_path_pattern?: string;
    tier?: number;
    has_side_effects?: boolean;
    limit?: number;
}
export declare function openDatabase(dbPath: string): Database.Database;
export declare function searchByFTS(db: Database.Database, query: string, filters?: SearchFilters): SearchResult;
export declare function getCallers(db: Database.Database, functionName: string, filePath?: string): FunctionRecord[];
export declare function getCallees(db: Database.Database, functionName: string, filePath?: string): FunctionRecord[];
export declare function getImpact(db: Database.Database, functionName: string, filePath?: string, maxDepth?: number): FunctionRecord[];
export declare function getIndexMetadata(db: Database.Database): any;
export declare function setMetadata(db: Database.Database, key: string, value: string): void;
export declare function clearAllData(db: Database.Database): void;
export declare function getFunctionsByIds(db: Database.Database, ids: number[]): FunctionRecord[];
export declare function listDomains(db: Database.Database): {
    domain: string;
    count: number;
}[];
export declare function listTags(db: Database.Database, domain?: string, limit?: number): {
    tag: string;
    count: number;
}[];
export declare function listSystemLayers(db: Database.Database): {
    systemlayer: string;
    count: number;
}[];
//# sourceMappingURL=db.d.ts.map