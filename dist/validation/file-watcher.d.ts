/**
 * Real-time file watcher for immediate validation feedback
 * Monitors file changes and triggers validation hooks
 */
interface ValidationHook {
    onValidationComplete?: (result: any) => void;
    onViolation?: (violation: any) => void;
    onError?: (error: Error) => void;
}
interface WatcherConfig {
    debounceMs: number;
    ignorePatterns: string[];
    includePatterns: string[];
    enableRealTime: boolean;
    maxFileSize: number;
}
export declare class RealTimeFileWatcher {
    private validator;
    private config;
    private watcherConfig;
    private hooks;
    private watchers;
    private debounceTimers;
    private isWatching;
    private stats;
    constructor(projectPath: string, watcherConfig?: Partial<WatcherConfig>);
    /**
     * Start watching files for real-time validation
     */
    startWatching(): void;
    /**
     * Stop watching files
     */
    stopWatching(): void;
    /**
     * Add validation hook
     */
    addHook(hook: ValidationHook): void;
    /**
     * Remove validation hook
     */
    removeHook(hook: ValidationHook): void;
    /**
     * Watch a directory recursively
     */
    private watchDirectory;
    /**
     * Handle file change events
     */
    private handleFileChange;
    /**
     * Process a file change
     */
    private processFileChange;
    /**
     * Validate file change
     */
    private validateFile;
    /**
     * Check if file should be processed
     */
    private shouldProcessFile;
    /**
     * Read file content safely
     */
    private readFileContent;
    /**
     * Count files in directory
     */
    private countFiles;
    /**
     * Get watcher statistics
     */
    getStats(): any;
    /**
     * Validate all files in project
     */
    validateProject(): Promise<any>;
    /**
     * Get all files in directory
     */
    private getAllFiles;
    /**
     * Configure watcher settings
     */
    configure(config: Partial<WatcherConfig>): void;
    /**
     * Export validation results to file
     */
    exportResults(filePath: string): Promise<void>;
    /**
     * Close and cleanup
     */
    close(): void;
}
export {};
//# sourceMappingURL=file-watcher.d.ts.map