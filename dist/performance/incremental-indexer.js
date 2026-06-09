/**
 * Performance optimization: Incremental indexing
 * Only processes changed files instead of full reindexing
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolveConfig } from '../config.js';
import { openDatabase } from '../database/db.js';
import { getEmbeddingCache } from './embedding-cache.js';
// ─── Incremental Indexer Implementation ───────────────────────────────────────────
export class IncrementalIndexer {
    db;
    config;
    fileMetadata = new Map();
    embeddingCache = getEmbeddingCache(50); // 50MB cache for embeddings
    constructor(projectPath) {
        this.config = resolveConfig(projectPath);
        this.db = openDatabase(this.config.databasePath);
        this.loadFileMetadata();
    }
    /**
     * Perform incremental index update
     */
    async updateIndex() {
        const startTime = Date.now();
        console.log('Starting incremental index update...');
        const stats = {
            total_files: 0,
            changed_files: 0,
            new_files: 0,
            deleted_files: 0,
            skipped_files: 0,
            processing_time: 0
        };
        try {
            // 1. Scan current files
            const currentFiles = this.scanCurrentFiles();
            stats.total_files = currentFiles.length;
            // 2. Find deleted files
            const deletedFiles = this.findDeletedFiles(currentFiles);
            stats.deleted_files = deletedFiles.length;
            // 3. Find new and changed files
            const { newFiles, changedFiles } = this.findNewAndChangedFiles(currentFiles);
            stats.new_files = newFiles.length;
            stats.changed_files = changedFiles.length;
            // 4. Process files that need updating
            const filesToProcess = [...newFiles, ...changedFiles];
            console.log(`Processing ${filesToProcess.length} files (${newFiles.length} new, ${changedFiles.length} changed)`);
            for (const file of filesToProcess) {
                await this.processFile(file);
            }
            // 5. Remove deleted files from database
            await this.removeDeletedFiles(deletedFiles);
            // 6. Update metadata
            await this.updateFileMetadata(currentFiles);
            stats.processing_time = Date.now() - startTime;
            console.log(`Incremental update completed in ${stats.processing_time}ms`);
            console.log(`  Total files: ${stats.total_files}`);
            console.log(`  New files: ${stats.new_files}`);
            console.log(`  Changed files: ${stats.changed_files}`);
            console.log(`  Deleted files: ${stats.deleted_files}`);
            console.log(`  Skipped files: ${stats.skipped_files}`);
            return stats;
        }
        catch (error) {
            stats.processing_time = Date.now() - startTime;
            console.error('Incremental update failed:', error);
            throw error;
        }
    }
    /**
     * Scan all current files and their metadata
     */
    scanCurrentFiles() {
        const files = [];
        for (const sourceDir of this.config.sourceDirectories) {
            const dirPath = path.join(this.config.projectRoot, sourceDir);
            if (fs.existsSync(dirPath)) {
                const dirFiles = this.scanDirectory(dirPath);
                files.push(...dirFiles);
            }
        }
        return files;
    }
    /**
     * Scan directory recursively
     */
    scanDirectory(dirPath) {
        const files = [];
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                // Skip excluded directories
                if (this.config.excludeDirectories.includes(entry.name))
                    continue;
                files.push(...this.scanDirectory(fullPath));
            }
            else if (entry.isFile()) {
                // Check file extension
                const ext = path.extname(entry.name);
                if (this.config.fileExtensions.includes(ext)) {
                    const stats = fs.statSync(fullPath);
                    const relativePath = path.relative(this.config.projectRoot, fullPath);
                    const hash = this.calculateFileHash(fullPath);
                    files.push({
                        path: relativePath,
                        hash,
                        modified: stats.mtimeMs,
                        size: stats.size,
                        indexed: false
                    });
                }
            }
        }
        return files;
    }
    /**
     * Calculate file hash for change detection
     */
    calculateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        }
        catch (error) {
            console.warn(`Could not calculate hash for ${filePath}:`, error);
            return '';
        }
    }
    /**
     * Find files that were deleted
     */
    findDeletedFiles(currentFiles) {
        const currentPaths = new Set(currentFiles.map(f => f.path));
        const deletedFiles = [];
        for (const [path, metadata] of this.fileMetadata.entries()) {
            if (!currentPaths.has(path)) {
                deletedFiles.push(path);
            }
        }
        return deletedFiles;
    }
    /**
     * Find new and changed files
     */
    findNewAndChangedFiles(currentFiles) {
        const newFiles = [];
        const changedFiles = [];
        for (const file of currentFiles) {
            const existing = this.fileMetadata.get(file.path);
            if (!existing) {
                // New file
                newFiles.push(file);
            }
            else if (existing.hash !== file.hash) {
                // Changed file
                changedFiles.push(file);
            }
        }
        return { newFiles, changedFiles };
    }
    /**
     * Process a single file (index or reindex)
     */
    async processFile(file) {
        try {
            const fullPath = path.join(this.config.projectRoot, file.path);
            const content = fs.readFileSync(fullPath, 'utf-8');
            // Remove existing entries for this file
            await this.removeFileFromDatabase(file.path);
            // Extract functions and types
            const functions = await this.extractFunctions(content, file.path);
            const types = await this.extractTypes(content, file.path);
            // Generate embeddings for functions with descriptions
            const textsToEmbed = functions
                .filter(func => func.what || func.how || func.why)
                .map(func => `${func.name} ${func.what || ''} ${func.how || ''} ${func.why || ''}`)
                .filter(text => text.trim().length > 10);
            const embeddings = textsToEmbed.length > 0
                ? await this.embeddingCache.getBatchEmbeddings(textsToEmbed)
                : [];
            // Insert into database
            await this.insertFunctions(functions, embeddings);
            await this.insertTypes(types);
            file.indexed = true;
        }
        catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
        }
    }
    /**
     * Remove deleted files from database
     */
    async removeDeletedFiles(deletedFiles) {
        for (const filePath of deletedFiles) {
            await this.removeFileFromDatabase(filePath);
            this.fileMetadata.delete(filePath);
        }
    }
    /**
     * Remove file entries from database
     */
    async removeFileFromDatabase(filePath) {
        const stmt = this.db.prepare(`DELETE FROM functions WHERE file_path = ?`);
        stmt.run(filePath);
        const edgeStmt = this.db.prepare(`
      DELETE FROM call_edges 
      WHERE file_path = ? OR 
      caller_id IN (SELECT id FROM functions WHERE file_path = ?) OR 
      callee_id IN (SELECT id FROM functions WHERE file_path = ?)
    `);
        edgeStmt.run(filePath, filePath, filePath);
    }
    /**
     * Update file metadata
     */
    async updateFileMetadata(currentFiles) {
        // Clear existing metadata
        this.fileMetadata.clear();
        // Add current files
        for (const file of currentFiles) {
            this.fileMetadata.set(file.path, file);
        }
        // Save to database
        await this.saveFileMetadata();
    }
    /**
     * Load existing file metadata
     */
    loadFileMetadata() {
        try {
            const metadata = this.db.prepare(`SELECT value FROM metadata WHERE key = 'file_metadata'`).get();
            if (metadata) {
                const data = JSON.parse(metadata.value);
                for (const [path, fileData] of Object.entries(data)) {
                    this.fileMetadata.set(path, fileData);
                }
            }
        }
        catch (error) {
            console.warn('Could not load file metadata:', error);
        }
    }
    /**
     * Save file metadata to database
     */
    async saveFileMetadata() {
        const data = {};
        for (const [path, metadata] of this.fileMetadata.entries()) {
            data[path] = metadata;
        }
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO metadata (key, value) VALUES ('file_metadata', ?)
    `);
        stmt.run(JSON.stringify(data));
    }
    // ─── Function and Type Extraction (simplified versions) ───────────────────────
    async extractFunctions(content, filePath) {
        // Simplified function extraction - in production, use the enhanced indexer
        const functions = [];
        const lines = content.split('\n');
        // Extract function declarations
        const patterns = [
            /export\s+(async\s+)?function\s+(\w+)/g,
            /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
            /function\s+(\w+)/g,
            /const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g
        ];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const functionName = match[2] || match[1];
                const position = match.index || 0;
                const lineNumber = content.substring(0, position).split('\n').length;
                functions.push({
                    name: functionName,
                    file_path: filePath,
                    line_number: lineNumber,
                    tier: 2, // Default tier
                    what: null,
                    how: null,
                    why: null,
                    params: null,
                    returns: null,
                    sideeffects: 'None',
                    systemlayer: null,
                    domain: null,
                    tags: null,
                    inline_comments: ''
                });
            }
        }
        return functions;
    }
    async extractTypes(content, filePath) {
        // Simplified type extraction
        const types = [];
        // Extract interfaces
        const interfaceMatches = content.matchAll(/export\s+interface\s+(\w+)/g);
        for (const match of interfaceMatches) {
            const position = match.index || 0;
            const lineNumber = content.substring(0, position).split('\n').length;
            types.push({
                name: match[1],
                file_path: filePath,
                line_number: lineNumber,
                tier: 2,
                what: null,
                domain: null,
                tags: null
            });
        }
        return types;
    }
    async insertFunctions(functions, embeddings) {
        const stmt = this.db.prepare(`
      INSERT INTO functions (
        name, file_path, line_number, tier, what, how, why, params, returns,
        sideeffects, systemlayer, domain, tags, inline_comments, embedding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const transaction = this.db.transaction(() => {
            let embeddingIndex = 0;
            for (const func of functions) {
                let embedding = null;
                if (func.what || func.how || func.why) {
                    if (embeddingIndex < embeddings.length) {
                        embedding = Buffer.from(embeddings[embeddingIndex].buffer);
                        embeddingIndex++;
                    }
                }
                stmt.run(func.name, func.file_path, func.line_number, func.tier, func.what, func.how, func.why, func.params, func.returns, func.sideeffects, func.systemlayer, func.domain, func.tags, func.inline_comments, embedding);
            }
        });
        transaction();
    }
    async insertTypes(types) {
        const stmt = this.db.prepare(`
      INSERT INTO functions (
        name, file_path, line_number, tier, what, domain, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const transaction = this.db.transaction(() => {
            for (const type of types) {
                stmt.run(type.name, type.file_path, type.line_number, type.tier, type.what, type.domain, type.tags);
            }
        });
        transaction();
    }
    /**
     * Get indexing statistics
     */
    getStats() {
        const indexedFiles = Array.from(this.fileMetadata.values()).filter(f => f.indexed).length;
        return {
            total_files: this.fileMetadata.size,
            indexed_files: indexedFiles,
            cache_stats: this.embeddingCache.getStats()
        };
    }
    /**
     * Force full reindex
     */
    async forceFullReindex() {
        console.log('Starting full reindex...');
        // Clear all data
        this.db.exec(`DELETE FROM functions`);
        this.db.exec(`DELETE FROM call_edges`);
        this.db.exec(`DELETE FROM metadata WHERE key = 'file_metadata'`);
        // Clear file metadata
        this.fileMetadata.clear();
        // Clear embedding cache
        this.embeddingCache.clear();
        // Perform full index
        const files = this.scanCurrentFiles();
        console.log(`Processing ${files.length} files...`);
        for (const file of files) {
            await this.processFile(file);
        }
        await this.updateFileMetadata(files);
        console.log('Full reindex completed!');
    }
    close() {
        this.embeddingCache.destroy();
        this.db.close();
    }
}
//# sourceMappingURL=incremental-indexer.js.map