/**
 * Comprehensive logging system for Cascade Guardian
 * Provides structured logging with different levels and destinations
 */

import fs from 'fs';
import path from 'path';

// ─── Logger Types ───────────────────────────────────────────────────────────────

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export enum LogCategory {
  SYSTEM = 'system',
  DATABASE = 'database',
  SEARCH = 'search',
  VALIDATION = 'validation',
  INDEXING = 'indexing',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  CACHE = 'cache'
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

// ─── Logger Implementation ─────────────────────────────────────────────────────

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private memoryLogs: LogEntry[] = [];
  private fileStreams: Map<string, fs.WriteStream> = new Map();
  private stats = {
    totalLogs: 0,
    errorCount: 0,
    warnCount: 0,
    startTime: Date.now()
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeDestinations();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Get default logger configuration
   */
  private getDefaultConfig(): LoggerConfig {
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
  private initializeDestinations(): void {
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
  private initializeFileDestination(config: any): void {
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
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeDestinations();
  }

  /**
   * Log a message
   */
  log(level: LogLevel, category: LogCategory, message: string, data?: any, error?: Error): void {
    if (level < this.config.level) return;
    if (!this.config.categories.includes(category)) return;

    const entry: LogEntry = {
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
    if (level >= LogLevel.ERROR) this.stats.errorCount++;
    if (level >= LogLevel.WARN) this.stats.warnCount++;

    // Write to all destinations
    for (const destination of this.config.destinations) {
      this.writeToDestination(entry, destination);
    }
  }

  /**
   * Write to specific destination
   */
  private writeToDestination(entry: LogEntry, destination: LogDestination): void {
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
  private formatMessage(entry: LogEntry, destination: LogDestination): string {
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
  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.FATAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[37m'; // White
    }
  }

  /**
   * Write to console
   */
  private writeToConsole(entry: LogEntry, formattedMessage: string): void {
    if (entry.level >= LogLevel.ERROR) {
      console.error(formattedMessage);
    } else if (entry.level >= LogLevel.WARN) {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Write to file
   */
  private writeToFile(formattedMessage: string): void {
    const stream = this.fileStreams.get('default');
    if (stream && !stream.destroyed) {
      stream.write(formattedMessage + '\n');
    }
  }

  /**
   * Write to memory
   */
  private writeToMemory(entry: LogEntry): void {
    this.memoryLogs.push(entry);
    
    // Keep only recent logs
    const maxEntries = 1000;
    if (this.memoryLogs.length > maxEntries) {
      this.memoryLogs = this.memoryLogs.slice(-maxEntries);
    }
  }

  // ─── Convenience Methods ─────────────────────────────────────────────────────

  debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: LogCategory, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data, error);
  }

  fatal(category: LogCategory, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.FATAL, category, message, data, error);
  }

  // ─── Performance Logging ─────────────────────────────────────────────────────

  /**
   * Log performance metrics
   */
  performance(category: LogCategory, operation: string, duration: number, data?: any): void {
    this.log(LogLevel.INFO, category, `${operation} completed`, { 
      duration, 
      operation, 
      ...data 
    });
  }

  /**
   * Create performance timer
   */
  timer(category: LogCategory, operation: string): () => void {
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
  logError(category: LogCategory, error: Error, context?: string, data?: any): void {
    const message = context ? `${context}: ${error.message}` : error.message;
    this.error(category, message, error, data);
  }

  /**
   * Log error with stack trace and context
   */
  logErrorWithContext(category: LogCategory, error: Error, context: string, additionalData?: any): void {
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
  getRecentLogs(count: number = 100, category?: LogCategory): LogEntry[] {
    let logs = this.memoryLogs;
    
    if (category) {
      logs = logs.filter(log => log.category === category);
    }
    
    return logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.memoryLogs.filter(log => log.level === level);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): LogEntry[] {
    return this.memoryLogs.filter(log => log.level >= LogLevel.ERROR);
  }

  /**
   * Get performance logs
   */
  getPerformanceLogs(): LogEntry[] {
    return this.memoryLogs.filter(log => log.category === LogCategory.PERFORMANCE);
  }

  /**
   * Export logs to file
   */
  async exportLogs(filePath: string, category?: LogCategory, level?: LogLevel): Promise<void> {
    let logs = this.memoryLogs;
    
    if (category) logs = logs.filter(log => log.category === category);
    if (level !== undefined) logs = logs.filter(log => log.level >= level);
    
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
  getStats(): any {
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
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Clear memory logs
   */
  clearMemoryLogs(): void {
    this.memoryLogs = [];
  }

  /**
   * Rotate log files
   */
  rotateLogs(): void {
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
  close(): void {
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

export const logDebug = (category: LogCategory, message: string, data?: any) => logger.debug(category, message, data);
export const logInfo = (category: LogCategory, message: string, data?: any) => logger.info(category, message, data);
export const logWarn = (category: LogCategory, message: string, data?: any) => logger.warn(category, message, data);
export const logError = (category: LogCategory, message: string, error?: Error, data?: any) => logger.error(category, message, error, data);
export const logFatal = (category: LogCategory, message: string, error?: Error, data?: any) => logger.fatal(category, message, error, data);
export const logPerformance = (category: LogCategory, operation: string, duration: number, data?: any) => logger.performance(category, operation, duration, data);
export const createTimer = (category: LogCategory, operation: string) => logger.timer(category, operation);

// ─── Error Handling Utilities ─────────────────────────────────────────────────────

export class CascadeError extends Error {
  public readonly category: LogCategory;
  public readonly context?: string;
  public readonly data?: any;
  public readonly timestamp: string;

  constructor(category: LogCategory, message: string, context?: string, data?: any) {
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
  constructor(message: string, context?: string, data?: any) {
    super(LogCategory.DATABASE, message, context, data);
    this.name = 'DatabaseError';
  }
}

export class SearchError extends CascadeError {
  constructor(message: string, context?: string, data?: any) {
    super(LogCategory.SEARCH, message, context, data);
    this.name = 'SearchError';
  }
}

export class ValidationError extends CascadeError {
  constructor(message: string, context?: string, data?: any) {
    super(LogCategory.VALIDATION, message, context, data);
    this.name = 'ValidationError';
  }
}

export class IndexingError extends CascadeError {
  constructor(message: string, context?: string, data?: any) {
    super(LogCategory.INDEXING, message, context, data);
    this.name = 'IndexingError';
  }
}

export class PerformanceError extends CascadeError {
  constructor(message: string, context?: string, data?: any) {
    super(LogCategory.PERFORMANCE, message, context, data);
    this.name = 'PerformanceError';
  }
}
