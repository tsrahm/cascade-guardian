/**
 * Comprehensive logging system for Cascade Guardian
 * Provides structured logging with different levels and destinations
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}
export declare enum LogCategory {
    SYSTEM = "system",
    DATABASE = "database",
    SEARCH = "search",
    VALIDATION = "validation",
    INDEXING = "indexing",
    PERFORMANCE = "performance",
    INTEGRATION = "integration",
    CACHE = "cache"
}
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    data?: any;
    error?: Error;
    duration?: number;
    stack?: string;
}
interface LoggerConfig {
    level: LogLevel;
    categories: LogCategory[];
    destinations: LogDestination[];
    format: 'json' | 'text';
    maxFileSize: number;
    maxFiles: number;
    enableColors: boolean;
}
interface LogDestination {
    type: 'console' | 'file' | 'memory';
    config: any;
}
export declare class Logger {
    private static instance;
    private config;
    private memoryLogs;
    private fileStreams;
    private stats;
    private constructor();
    static getInstance(): Logger;
    /**
     * Get default logger configuration
     */
    private getDefaultConfig;
    /**
     * Initialize log destinations
     */
    private initializeDestinations;
    /**
     * Initialize file logging destination
     */
    private initializeFileDestination;
    /**
     * Configure logger
     */
    configure(config: Partial<LoggerConfig>): void;
    /**
     * Log a message
     */
    log(level: LogLevel, category: LogCategory, message: string, data?: any, error?: Error): void;
    /**
     * Write to specific destination
     */
    private writeToDestination;
    /**
     * Format log message
     */
    private formatMessage;
    /**
     * Get color code for log level
     */
    private getColorCode;
    /**
     * Write to console
     */
    private writeToConsole;
    /**
     * Write to file
     */
    private writeToFile;
    /**
     * Write to memory
     */
    private writeToMemory;
    debug(category: LogCategory, message: string, data?: any): void;
    info(category: LogCategory, message: string, data?: any): void;
    warn(category: LogCategory, message: string, data?: any): void;
    error(category: LogCategory, message: string, error?: Error, data?: any): void;
    fatal(category: LogCategory, message: string, error?: Error, data?: any): void;
    /**
     * Log performance metrics
     */
    performance(category: LogCategory, operation: string, duration: number, data?: any): void;
    /**
     * Create performance timer
     */
    timer(category: LogCategory, operation: string): () => void;
    /**
     * Log error with context
     */
    logError(category: LogCategory, error: Error, context?: string, data?: any): void;
    /**
     * Log error with stack trace and context
     */
    logErrorWithContext(category: LogCategory, error: Error, context: string, additionalData?: any): void;
    /**
     * Get recent logs from memory
     */
    getRecentLogs(count?: number, category?: LogCategory): LogEntry[];
    /**
     * Get logs by level
     */
    getLogsByLevel(level: LogLevel): LogEntry[];
    /**
     * Get error logs
     */
    getErrorLogs(): LogEntry[];
    /**
     * Get performance logs
     */
    getPerformanceLogs(): LogEntry[];
    /**
     * Export logs to file
     */
    exportLogs(filePath: string, category?: LogCategory, level?: LogLevel): Promise<void>;
    /**
     * Get logger statistics
     */
    getStats(): any;
    /**
     * Format duration in human readable format
     */
    private formatDuration;
    /**
     * Clear memory logs
     */
    clearMemoryLogs(): void;
    /**
     * Rotate log files
     */
    rotateLogs(): void;
    /**
     * Close all log streams
     */
    close(): void;
}
export declare const logger: Logger;
export declare const logDebug: (category: LogCategory, message: string, data?: any) => void;
export declare const logInfo: (category: LogCategory, message: string, data?: any) => void;
export declare const logWarn: (category: LogCategory, message: string, data?: any) => void;
export declare const logError: (category: LogCategory, message: string, error?: Error, data?: any) => void;
export declare const logFatal: (category: LogCategory, message: string, error?: Error, data?: any) => void;
export declare const logPerformance: (category: LogCategory, operation: string, duration: number, data?: any) => void;
export declare const createTimer: (category: LogCategory, operation: string) => () => void;
export declare class CascadeError extends Error {
    readonly category: LogCategory;
    readonly context?: string;
    readonly data?: any;
    readonly timestamp: string;
    constructor(category: LogCategory, message: string, context?: string, data?: any);
}
export declare class DatabaseError extends CascadeError {
    constructor(message: string, context?: string, data?: any);
}
export declare class SearchError extends CascadeError {
    constructor(message: string, context?: string, data?: any);
}
export declare class ValidationError extends CascadeError {
    constructor(message: string, context?: string, data?: any);
}
export declare class IndexingError extends CascadeError {
    constructor(message: string, context?: string, data?: any);
}
export declare class PerformanceError extends CascadeError {
    constructor(message: string, context?: string, data?: any);
}
export {};
//# sourceMappingURL=logger.d.ts.map