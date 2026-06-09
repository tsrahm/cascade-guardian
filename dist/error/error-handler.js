/**
 * Comprehensive error handling utilities for Cascade Guardian
 * Provides consistent error handling, recovery, and reporting
 */
import fs from 'fs';
import path from 'path';
import { logger, CascadeError, DatabaseError, SearchError, ValidationError, IndexingError, PerformanceError, LogCategory } from '../logging/logger.js';
// ─── Error Handler Implementation ───────────────────────────────────────────────
export class ErrorHandler {
    static instance;
    errorReports = [];
    recoveryStrategies = new Map();
    maxErrorReports = 1000;
    isShuttingDown = false;
    constructor() {
        this.setupDefaultRecoveryStrategies();
        this.setupGlobalErrorHandlers();
    }
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    /**
     * Setup default recovery strategies
     */
    setupDefaultRecoveryStrategies() {
        // Database connection errors
        this.recoveryStrategies.set('DatabaseError', {
            canRecover: true,
            maxRetries: 3,
            retryCount: 0,
            recoveryAction: async () => {
                // Wait and retry database operation
                await new Promise(resolve => setTimeout(resolve, 1000));
                return { retry: true };
            }
        });
        // File system errors
        this.recoveryStrategies.set('CascadeError', {
            canRecover: true,
            maxRetries: 2,
            retryCount: 0,
            recoveryAction: async (error) => {
                if (error?.message.includes('ENOENT')) {
                    // File not found - create parent directories
                    return { createDirectories: true };
                }
                return { retry: true };
            }
        });
        // Network/timeout errors
        this.recoveryStrategies.set('PerformanceError', {
            canRecover: true,
            maxRetries: 2,
            retryCount: 0,
            recoveryAction: async () => {
                // Increase timeout and retry
                return { increaseTimeout: true };
            }
        });
    }
    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handleGlobalError(error, 'uncaughtException');
        });
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleGlobalError(new Error(`Unhandled rejection: ${reason}`), 'unhandledRejection', { promise });
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            this.gracefulShutdown('SIGTERM');
        });
        process.on('SIGINT', () => {
            this.gracefulShutdown('SIGINT');
        });
    }
    /**
     * Handle errors with context and recovery
     */
    async handleError(error, context, recoveryStrategy) {
        const cascadeError = this.normalizeError(error);
        const report = this.createErrorReport(cascadeError, context);
        // Log the error
        logger.error(this.getCategoryFromError(cascadeError), `${context.operation} failed: ${cascadeError.message}`, cascadeError, context.additionalData);
        // Store error report
        this.storeErrorReport(report);
        // Attempt recovery
        const recovery = await this.attemptRecovery(cascadeError, context, recoveryStrategy);
        if (recovery.successful) {
            logger.info(this.getCategoryFromError(cascadeError), `Recovery successful for ${context.operation}`, { recoveryTime: recovery.duration });
            return recovery.result;
        }
        // If recovery failed, throw or return fallback
        if (recoveryStrategy?.fallbackValue !== undefined) {
            logger.warn(this.getCategoryFromError(cascadeError), `Using fallback value for ${context.operation}`, { fallbackValue: recoveryStrategy.fallbackValue });
            return recoveryStrategy.fallbackValue;
        }
        // No recovery possible, re-throw
        throw cascadeError;
    }
    /**
     * Handle async operations with error recovery
     */
    async handleAsync(operation, context, recoveryStrategy) {
        try {
            return await operation();
        }
        catch (error) {
            return await this.handleError(error, context, recoveryStrategy);
        }
    }
    /**
     * Handle synchronous operations with error recovery
     */
    handleSync(operation, context, recoveryStrategy) {
        try {
            return operation();
        }
        catch (error) {
            // For sync operations, we can't await recovery
            const cascadeError = this.normalizeError(error);
            const report = this.createErrorReport(cascadeError, context);
            logger.error(this.getCategoryFromError(cascadeError), `${context.operation} failed: ${cascadeError.message}`, cascadeError, context.additionalData);
            this.storeErrorReport(report);
            // Check for fallback value
            if (recoveryStrategy?.fallbackValue !== undefined) {
                return recoveryStrategy.fallbackValue;
            }
            throw cascadeError;
        }
    }
    /**
     * Wrap function with error handling
     */
    wrapFunction(fn, context, recoveryStrategy) {
        return ((...args) => {
            const fullContext = {
                operation: fn.name || 'anonymous',
                component: context.component || 'unknown',
                ...context
            };
            if (fn.constructor.name === 'AsyncFunction') {
                return this.handleAsync(() => fn(...args), fullContext, recoveryStrategy);
            }
            else {
                return this.handleSync(() => fn(...args), fullContext, recoveryStrategy);
            }
        });
    }
    /**
     * Normalize error to CascadeError
     */
    normalizeError(error) {
        if (error instanceof CascadeError) {
            return error;
        }
        // Determine error type based on message or properties
        if (error.message.includes('database') || error.message.includes('SQL')) {
            return new DatabaseError(error.message, 'Database operation failed');
        }
        if (error.message.includes('search') || error.message.includes('index')) {
            return new SearchError(error.message, 'Search operation failed');
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
            return new ValidationError(error.message, 'Validation failed');
        }
        if (error.message.includes('index') || error.message.includes('parse')) {
            return new IndexingError(error.message, 'Indexing operation failed');
        }
        if (error.message.includes('timeout') || error.message.includes('performance')) {
            return new PerformanceError(error.message, 'Performance issue detected');
        }
        // Default to generic CascadeError
        return new CascadeError(this.getCategoryFromError(error), error.message, 'Unknown operation', { originalError: error.name });
    }
    /**
     * Get log category from error
     */
    getCategoryFromError(error) {
        if (error instanceof DatabaseError)
            return 'DATABASE';
        if (error instanceof SearchError)
            return 'SEARCH';
        if (error instanceof ValidationError)
            return 'VALIDATION';
        if (error instanceof IndexingError)
            return 'INDEXING';
        if (error instanceof PerformanceError)
            return 'PERFORMANCE';
        if (error instanceof CascadeError)
            return error.category;
        return 'SYSTEM';
    }
    /**
     * Create error report
     */
    createErrorReport(error, context) {
        return {
            timestamp: error.timestamp,
            error,
            context,
            stackTrace: error.stack || '',
            systemInfo: this.getSystemInfo(),
            recoveryAttempted: false
        };
    }
    /**
     * Get system information
     */
    getSystemInfo() {
        const memUsage = process.memoryUsage();
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
            },
            uptime: process.uptime()
        };
    }
    /**
     * Store error report
     */
    storeErrorReport(report) {
        this.errorReports.push(report);
        // Keep only recent reports
        if (this.errorReports.length > this.maxErrorReports) {
            this.errorReports = this.errorReports.slice(-this.maxErrorReports);
        }
    }
    /**
     * Attempt error recovery
     */
    async attemptRecovery(error, context, customStrategy) {
        const startTime = Date.now();
        // Get recovery strategy
        const defaultStrategy = this.recoveryStrategies.get(error.name);
        const strategy = { ...defaultStrategy, ...customStrategy };
        if (!strategy?.canRecover) {
            return { successful: false, duration: Date.now() - startTime };
        }
        try {
            if (strategy.recoveryAction) {
                const result = await strategy.recoveryAction(error);
                // Update recovery report
                const report = this.errorReports[this.errorReports.length - 1];
                if (report) {
                    report.recoveryAttempted = true;
                    report.recoverySuccessful = true;
                }
                return {
                    successful: true,
                    result,
                    duration: Date.now() - startTime
                };
            }
        }
        catch (recoveryError) {
            logger.error(this.getCategoryFromError(error), `Recovery failed for ${context.operation}`, recoveryError instanceof Error ? recoveryError : new Error('Unknown recovery error'));
            // Update recovery report
            const report = this.errorReports[this.errorReports.length - 1];
            if (report) {
                report.recoveryAttempted = true;
                report.recoverySuccessful = false;
            }
        }
        return { successful: false, duration: Date.now() - startTime };
    }
    /**
     * Handle global errors
     */
    handleGlobalError(error, type, additionalData) {
        const cascadeError = this.normalizeError(error);
        logger.fatal(this.getCategoryFromError(cascadeError), `Global ${type}: ${cascadeError.message}`, cascadeError, additionalData);
        const report = this.createErrorReport(cascadeError, {
            operation: type,
            component: 'global',
            additionalData
        });
        this.storeErrorReport(report);
        // For uncaught exceptions, exit gracefully
        if (type === 'uncaughtException') {
            this.gracefulShutdown('uncaughtException');
        }
    }
    /**
     * Graceful shutdown
     */
    gracefulShutdown(signal) {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        logger.info(LogCategory.SYSTEM, `Graceful shutdown initiated by ${signal}`);
        // Export error reports
        this.exportErrorReports();
        // Close logger
        logger.close();
        // Exit
        process.exit(0);
    }
    /**
     * Export error reports
     */
    async exportErrorReports(filePath) {
        const reportPath = filePath || path.join(process.cwd(), 'error-reports.json');
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                totalReports: this.errorReports.length,
                reports: this.errorReports,
                systemInfo: this.getSystemInfo()
            };
            await fs.promises.writeFile(reportPath, JSON.stringify(exportData, null, 2));
            logger.info(LogCategory.SYSTEM, `Error reports exported to ${reportPath}`);
        }
        catch (error) {
            console.error('Failed to export error reports:', error);
        }
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const recentErrors = this.errorReports.slice(-100); // Last 100 errors
        const errorCounts = recentErrors.reduce((acc, report) => {
            const errorType = report.error.constructor.name;
            acc[errorType] = (acc[errorType] || 0) + 1;
            return acc;
        }, {});
        const componentCounts = recentErrors.reduce((acc, report) => {
            const component = report.context.component;
            acc[component] = (acc[component] || 0) + 1;
            return acc;
        }, {});
        const recoveryStats = recentErrors.reduce((acc, report) => {
            if (report.recoveryAttempted) {
                acc.attempted++;
                if (report.recoverySuccessful) {
                    acc.successful++;
                }
            }
            return acc;
        }, { attempted: 0, successful: 0 });
        return {
            totalReports: this.errorReports.length,
            recentReports: recentErrors.length,
            errorCounts,
            componentCounts,
            recoveryStats,
            systemInfo: this.getSystemInfo()
        };
    }
    /**
     * Get recent error reports
     */
    getRecentReports(count = 50) {
        return this.errorReports.slice(-count);
    }
    /**
     * Clear error reports
     */
    clearReports() {
        this.errorReports = [];
        logger.info(LogCategory.SYSTEM, 'Error reports cleared');
    }
    /**
     * Add custom recovery strategy
     */
    addRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }
    /**
     * Remove recovery strategy
     */
    removeRecoveryStrategy(errorType) {
        this.recoveryStrategies.delete(errorType);
    }
}
// ─── Global Error Handler Instance ─────────────────────────────────────────────
export const errorHandler = ErrorHandler.getInstance();
// ─── Convenience Functions ─────────────────────────────────────────────────────
export const handleAsync = (operation, context, recoveryStrategy) => errorHandler.handleAsync(operation, context, recoveryStrategy);
export const handleSync = (operation, context, recoveryStrategy) => errorHandler.handleSync(operation, context, recoveryStrategy);
export const wrapFunction = (fn, context, recoveryStrategy) => errorHandler.wrapFunction(fn, context, recoveryStrategy);
// ─── Error Handling Decorators ─────────────────────────────────────────────────
export function withErrorHandling(context, recoveryStrategy) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = errorHandler.wrapFunction(originalMethod, {
            operation: propertyKey,
            component: target.constructor.name,
            ...context
        }, recoveryStrategy);
        return descriptor;
    };
}
export function withAsyncErrorHandling(context, recoveryStrategy) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            return await errorHandler.handleAsync(() => originalMethod.apply(this, args), {
                operation: propertyKey,
                component: target.constructor.name,
                ...context
            }, recoveryStrategy);
        };
        return descriptor;
    };
}
//# sourceMappingURL=error-handler.js.map