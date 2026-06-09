/**
 * Performance optimization: Incremental indexing
 * Only processes changed files instead of full reindexing
 */
interface IndexingStats {
    total_files: number;
    changed_files: number;
    new_files: number;
    deleted_files: number;
    skipped_files: number;
    processing_time: number;
}
export declare class IncrementalIndexer {
    private db;
    private config;
    private fileMetadata;
    private embeddingCache;
    constructor(projectPath?: string);
    /**
     * Perform incremental index update
     */
    updateIndex(): Promise<IndexingStats>;
    /**
     * Scan all current files and their metadata
     */
    private scanCurrentFiles;
    /**
     * Scan directory recursively
     */
    private scanDirectory;
    /**
     * Calculate file hash for change detection
     */
    private calculateFileHash;
    /**
     * Find files that were deleted
     */
    private findDeletedFiles;
    /**
     * Find new and changed files
     */
    private findNewAndChangedFiles;
    /**
     * Process a single file (index or reindex)
     */
    private processFile;
    /**
     * Remove deleted files from database
     */
    private removeDeletedFiles;
    /**
     * Remove file entries from database
     */
    private removeFileFromDatabase;
    /**
     * Update file metadata
     */
    private updateFileMetadata;
    /**
     * Load existing file metadata
     */
    private loadFileMetadata;
    /**
     * Save file metadata to database
     */
    private saveFileMetadata;
    private extractFunctions;
    private extractTypes;
    private insertFunctions;
    private insertTypes;
    /**
     * Get indexing statistics
     */
    getStats(): {
        total_files: number;
        indexed_files: number;
        cache_stats: any;
    };
    /**
     * Force full reindex
     */
    forceFullReindex(): Promise<void>;
    close(): void;
}
export {};
//# sourceMappingURL=incremental-indexer.d.ts.map