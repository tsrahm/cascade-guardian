/**
 * Vector embeddings for semantic search using Hugging Face transformers
 */
import { pipeline } from '@huggingface/transformers';
// ─── Embedding Pipeline ───────────────────────────────────────────────────────
let embeddingPipeline = null;
/**
 * Initialize the embedding pipeline (lazy loading)
 */
async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { device: 'cpu' });
    }
    return embeddingPipeline;
}
/**
 * Generate vector embedding for text
 */
export async function generateEmbedding(text) {
    const pipeline = await getEmbeddingPipeline();
    const result = await pipeline(text, { pooling: 'mean', normalize: true });
    // Convert to Float32Array if needed
    if (result instanceof Float32Array) {
        return result;
    }
    else if (Array.isArray(result)) {
        return new Float32Array(result);
    }
    else {
        // Handle different output formats
        const data = result.data || result;
        return new Float32Array(data);
    }
}
/**
 * Semantic search using vector similarity
 */
export async function semanticSearch(db, query, limit = 15) {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);
        // Get all functions with embeddings
        const stmt = db.prepare(`
      SELECT id, name, file_path, line_number, tier, what, how, why, params, returns,
             sideeffects, systemlayer, domain, tags, inline_comments, embedding
      FROM functions 
      WHERE embedding IS NOT NULL
    `);
        const functions = stmt.all();
        // Calculate similarity scores
        const scoredFunctions = functions.map(func => {
            const funcEmbedding = new Float32Array(func.embedding);
            const similarity = cosineSimilarity(queryEmbedding, funcEmbedding);
            return {
                ...func,
                similarity,
            };
        });
        // Sort by similarity and return top results
        scoredFunctions.sort((a, b) => b.similarity - a.similarity);
        return scoredFunctions
            .filter(func => func.similarity > 0.3) // Filter out low similarity
            .slice(0, limit)
            .map(func => {
            // Remove embedding from output to save space
            const { embedding, ...rest } = func;
            return rest;
        });
    }
    catch (error) {
        console.error('Semantic search failed:', error);
        return [];
    }
}
/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
/**
 * Invalidate embedding cache (for development/testing)
 */
export function invalidateCache() {
    // In a production environment, you might want to implement
    // proper caching. For now, this is a no-op.
}
/**
 * Batch generate embeddings for multiple texts
 */
export async function batchGenerateEmbeddings(texts) {
    const embeddings = [];
    for (const text of texts) {
        try {
            const embedding = await generateEmbedding(text);
            embeddings.push(embedding);
        }
        catch (error) {
            console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`);
            // Add a zero vector as fallback
            embeddings.push(new Float32Array(384)); // MiniLM-L6-v2 outputs 384 dimensions
        }
    }
    return embeddings;
}
//# sourceMappingURL=embeddings.js.map