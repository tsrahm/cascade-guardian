/**
 * Comprehensive logging system for Cascade Guardian
 * Provides structured logging with different levels and destinations
 */
import fs from 'fs';
import path from 'path';
// ─── Logger Types ───────────────────────────────────────────────────────────────
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel || (LogLevel = {}));
export var LogCategory;
(function (LogCategory) {
    LogCategory["SYSTEM"] = "system";
    LogCategory["DATABASE"] = "database";
    LogCategory["SEARCH"] = "search";
    LogCategory["VALIDATION"] = "validation";
    LogCategory["INDEXING"] = "indexing";
    LogCategory["PERFORMANCE"] = "performance";
    LogCategory["INTEGRATION"] = "integration";
    LogCategory["CACHE"] = "cache";
})(LogCategory || (LogCategory = {}));
// ─── Logger Implementation ─────────────────────────────────────────────────────
export class Logger {
    static instance;
    config;
    memoryLogs = [];
    fileStreams = new Map();
    stats = {
        totalLogs: 0,
        errorCount: 0,
        warnCount: 0,
        startTime: Date.now()
    };
    constructor() {
        this.config = this.getDefaultConfig();
        this.initializeDestinations();
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    /**
     * Get default logger configuration
     */
    getDefaultConfig() {
        return {
            level: LogLevel.INFO,
            categories: Object.values(LogCategory),
            destinations: [
                { type: 'console', config: { enableColors: true } },
                { type: 'memory', config: { maxEntries: 1000 } }
            ],
            format: 'text',
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            enableColors: true
        };
    }
    /**
     * Initialize log destinations
     */
    initializeDestinations() {
        for (const destination of this.config.destinations) {
            switch (destination.type) {
                case 'console':
                    // Console is always available
                    break;
                case 'file':
                    this.initializeFileDestination(destination.config);
                    break;
                case 'memory':
                    // Memory is always available
                    break;
            }
        }
    }
    /**
     * Initialize file logging destination
     */
    initializeFileDestination(config) {
        const logDir = config.logDir || path.join(process.cwd(), 'logs');
        const logFile = config.logFile || 'cascade-guardian.log';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logPath = path.join(logDir, logFile);
        const stream = fs.createWriteStream(logPath, { flags: 'a' });
        this.fileStreams.set('default', stream);
    }
    /**
     * Configure logger
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        this.initializeDestinations();
    }
    /**
     * Log a message
     */
    log(level, category, message, data, error) {
        if (level < this.config.level)
            return;
        if (!this.config.categories.includes(category))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            data,
            error,
            stack: error?.stack,
            duration: data?.duration
        };
        this.stats.totalLogs++;
        if (level >= LogLevel.ERROR)
            this.stats.errorCount++;
        if (level >= LogLevel.WARN)
            this.stats.warnCount++;
        // Write to all destinations
        for (const destination of this.config.destinations) {
            this.writeToDestination(entry, destination);
        }
    }
    /**
     * Write to specific destination
     */
    writeToDestination(entry, destination) {
        const formattedMessage = this.formatMessage(entry, destination);
        switch (destination.type) {
            case 'console':
                this.writeToConsole(entry, formattedMessage);
                break;
            case 'file':
                this.writeToFile(formattedMessage);
                break;
            case 'memory':
                this.writeToMemory(entry);
                break;
        }
    }
    /**
     * Format log message
     */
    formatMessage(entry, destination) {
        if (this.config.format === 'json') {
            return JSON.stringify(entry);
        }
        const levelName = LogLevel[entry.level];
        const timestamp = entry.timestamp.substring(11, 19); // HH:mm:ss
        const colors = destination.config?.enableColors && this.config.enableColors;
        let message = `[${timestamp}] ${levelName.padEnd(5)} [${entry.category}] ${entry.message}`;
        if (entry.duration) {
            message += ` (${entry.duration}ms)`;
        }
        if (entry.data) {
            message += ` ${JSON.stringify(entry.data)}`;
        }
        if (entry.error) {
            message += `\n${entry.error.stack || entry.error.message}`;
        }
        // Add colors for console
        if (colors && destination.type === 'console') {
            const colorCode = this.getColorCode(entry.level);
            const resetCode = '\x1b[0m';
            message = `${colorCode}${message}${resetCode}`;
        }
        return message;
    }
    /**
     * Get color code for log level
     */
    getColorCode(level) {
        switch (level) {
            case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
            case LogLevel.INFO: return '\x1b[32m'; // Green
            case LogLevel.WARN: return '\x1b[33m'; // Yellow
            case LogLevel.ERROR: return '\x1b[31m'; // Red
            case LogLevel.FATAL: return '\x1b[35m'; // Magenta
            default: return '\x1b[37m'; // White
        }
    }
    /**
     * Write to console
     */
    writeToConsole(entry, formattedMessage) {
        if (entry.level >= LogLevel.ERROR) {
            console.error(formattedMessage);
        }
        else if (entry.level >= LogLevel.WARN) {
            console.warn(formattedMessage);
        }
        else {
            console.log(formattedMessage);
        }
    }
    /**
     * Write to file
     */
    writeToFile(formattedMessage) {
        const stream = this.fileStreams.get('default');
        if (stream && !stream.destroyed) {
            stream.write(formattedMessage + '\n');
        }
    }
    /**
     * Write to memory
     */
    writeToMemory(entry) {
        this.memoryLogs.push(entry);
        // Keep only recent logs
        const maxEntries = 1000;
        if (this.memoryLogs.length > maxEntries) {
            this.memoryLogs = this.memoryLogs.slice(-maxEntries);
        }
    }
    // ─── Convenience Methods ─────────────────────────────────────────────────────
    debug(category, message, data) {
        this.log(LogLevel.DEBUG, category, message, data);
    }
    info(category, message, data) {
        this.log(LogLevel.INFO, category, message, data);
    }
    warn(category, message, data) {
        this.log(LogLevel.WARN, category, message, data);
    }
    error(category, message, error, data) {
        this.log(LogLevel.ERROR, category, message, data, error);
    }
    fatal(category, message, error, data) {
        this.log(LogLevel.FATAL, category, message, data, error);
    }
    // ─── Performance Logging ─────────────────────────────────────────────────────
    /**
     * Log performance metrics
     */
    performance(category, operation, duration, data) {
        this.log(LogLevel.INFO, category, `${operation} completed`, {
            duration,
            operation,
            ...data
        });
    }
    /**
     * Create performance timer
     */
    timer(category, operation) {
        const startTime = Date.now();
        return () => {
            const duration = Date.now() - startTime;
            this.performance(category, operation, duration);
        };
    }
    // ─── Error Handling ─────────────────────────────────────────────────────────
    /**
     * Log error with context
     */
    logError(category, error, context, data) {
        const message = context ? `${context}: ${error.message}` : error.message;
        this.error(category, message, error, data);
    }
    /**
     * Log error with stack trace and context
     */
    logErrorWithContext(category, error, context, additionalData) {
        this.error(category, context, error, {
            ...additionalData,
            errorCode: error.name,
            timestamp: new Date().toISOString()
        });
    }
    // ─── Query and Export Methods ─────────────────────────────────────────────────
    /**
     * Get recent logs from memory
     */
    getRecentLogs(count = 100, category) {
        let logs = this.memoryLogs;
        if (category) {
            logs = logs.filter(log => log.category === category);
        }
        return logs.slice(-count);
    }
    /**
     * Get logs by level
     */
    getLogsByLevel(level) {
        return this.memoryLogs.filter(log => log.level === level);
    }
    /**
     * Get error logs
     */
    getErrorLogs() {
        return this.memoryLogs.filter(log => log.level >= LogLevel.ERROR);
    }
    /**
     * Get performance logs
     */
    getPerformanceLogs() {
        return this.memoryLogs.filter(log => log.category === LogCategory.PERFORMANCE);
    }
    /**
     * Export logs to file
     */
    async exportLogs(filePath, category, level) {
        let logs = this.memoryLogs;
        if (category)
            logs = logs.filter(log => log.category === category);
        if (level !== undefined)
            logs = logs.filter(log => log.level >= level);
        const exportData = {
            timestamp: new Date().toISOString(),
            totalLogs: logs.length,
            stats: this.getStats(),
            logs: logs
        };
        await fs.promises.writeFile(filePath, JSON.stringify(exportData, null, 2));
    }
    /**
     * Get logger statistics
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        return {
            ...this.stats,
            uptime,
            uptimeFormatted: this.formatDuration(uptime),
            logsPerSecond: (this.stats.totalLogs / (uptime / 1000)).toFixed(2),
            errorRate: this.stats.totalLogs > 0 ? (this.stats.errorCount / this.stats.totalLogs * 100).toFixed(2) + '%' : '0%',
            memoryLogsCount: this.memoryLogs.length,
            activeStreams: this.fileStreams.size
        };
    }
    /**
     * Format duration in human readable format
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    /**
     * Clear memory logs
     */
    clearMemoryLogs() {
        this.memoryLogs = [];
    }
    /**
     * Rotate log files
     */
    rotateLogs() {
        for (const [name, stream] of this.fileStreams.entries()) {
            if (!stream.destroyed) {
                stream.end();
                // Create new stream
                const logDir = path.join(process.cwd(), 'logs');
                const logFile = name === 'default' ? 'cascade-guardian.log' : `${name}.log`;
                const logPath = path.join(logDir, logFile);
                const newStream = fs.createWriteStream(logPath, { flags: 'a' });
                this.fileStreams.set(name, newStream);
            }
        }
    }
    /**
     * Close all log streams
     */
    close() {
        for (const stream of this.fileStreams.values()) {
            if (!stream.destroyed) {
                stream.end();
            }
        }
        this.fileStreams.clear();
    }
}
// ─── Global Logger Instance ─────────────────────────────────────────────────────
export const logger = Logger.getInstance();
// ─── Convenience Functions ─────────────────────────────────────────────────────
export const logDebug = (category, message, data) => logger.debug(category, message, data);
export const logInfo = (category, message, data) => logger.info(category, message, data);
export const logWarn = (category, message, data) => logger.warn(category, message, data);
export const logError = (category, message, error, data) => logger.error(category, message, error, data);
export const logFatal = (category, message, error, data) => logger.fatal(category, message, error, data);
export const logPerformance = (category, operation, duration, data) => logger.performance(category, operation, duration, data);
export const createTimer = (category, operation) => logger.timer(category, operation);
// ─── Error Handling Utilities ─────────────────────────────────────────────────────
export class CascadeError extends Error {
    category;
    context;
    data;
    timestamp;
    constructor(category, message, context, data) {
        super(message);
        this.name = 'CascadeError';
        this.category = category;
        this.context = context;
        this.data = data;
        this.timestamp = new Date().toISOString();
        // Log the error automatically
        logger.error(category, context ? `${context}: ${message}` : message, this, data);
    }
}
export class DatabaseError extends CascadeError {
    constructor(message, context, data) {
        super(LogCategory.DATABASE, message, context, data);
        this.name = 'DatabaseError';
    }
}
export class SearchError extends CascadeError {
    constructor(message, context, data) {
        super(LogCategory.SEARCH, message, context, data);
        this.name = 'SearchError';
    }
}
export class ValidationError extends CascadeError {
    constructor(message, context, data) {
        super(LogCategory.VALIDATION, message, context, data);
        this.name = 'ValidationError';
    }
}
export class IndexingError extends CascadeError {
    constructor(message, context, data) {
        super(LogCategory.INDEXING, message, context, data);
        this.name = 'IndexingError';
    }
}
export class PerformanceError extends CascadeError {
    constructor(message, context, data) {
        super(LogCategory.PERFORMANCE, message, context, data);
        this.name = 'PerformanceError';
    }
}
//# sourceMappingURL=logger.js.map