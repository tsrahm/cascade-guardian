/**
 * Vector embeddings for semantic search using Hugging Face transformers
 */
import Database from 'better-sqlite3';
/**
 * Generate vector embedding for text
 */
export declare function generateEmbedding(text: string): Promise<Float32Array>;
/**
 * Semantic search using vector similarity
 */
export declare function semanticSearch(db: Database.Database, query: string, limit?: number): Promise<any[]>;
/**
 * Invalidate embedding cache (for development/testing)
 */
export declare function invalidateCache(): void;
/**
 * Batch generate embeddings for multiple texts
 */
export declare function batchGenerateEmbeddings(texts: string[]): Promise<Float32Array[]>;
//# sourceMappingURL=embeddings.d.ts.map