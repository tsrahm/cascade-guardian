/**
 * Comprehensive error handling utilities for Cascade Guardian
 * Provides consistent error handling, recovery, and reporting
 */
import { CascadeError } from '../logging/logger.js';
export interface ErrorContext {
    operation: string;
    component: string;
    filePath?: string;
    lineNumber?: number;
    additionalData?: any;
    userId?: string;
    sessionId?: string;
}
export interface ErrorRecoveryStrategy {
    canRecover: boolean;
    recoveryAction?: (error?: CascadeError) => Promise<any>;
    fallbackValue?: any;
    retryCount?: number;
    maxRetries?: number;
}
export interface ErrorReport {
    timestamp: string;
    error: CascadeError;
    context: ErrorContext;
    stackTrace: string;
    systemInfo: SystemInfo;
    recoveryAttempted: boolean;
    recoverySuccessful?: boolean;
}
export interface SystemInfo {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    uptime: number;
}
export declare class ErrorHandler {
    private static instance;
    private errorReports;
    private recoveryStrategies;
    private maxErrorReports;
    private isShuttingDown;
    private constructor();
    static getInstance(): ErrorHandler;
    /**
     * Setup default recovery strategies
     */
    private setupDefaultRecoveryStrategies;
    /**
     * Setup global error handlers
     */
    private setupGlobalErrorHandlers;
    /**
     * Handle errors with context and recovery
     */
    handleError(error: Error, context: ErrorContext, recoveryStrategy?: Partial<ErrorRecoveryStrategy>): Promise<any>;
    /**
     * Handle async operations with error recovery
     */
    handleAsync<T>(operation: () => Promise<T>, context: ErrorContext, recoveryStrategy?: Partial<ErrorRecoveryStrategy>): Promise<T>;
    /**
     * Handle synchronous operations with error recovery
     */
    handleSync<T>(operation: () => T, context: ErrorContext, recoveryStrategy?: Partial<ErrorRecoveryStrategy>): T;
    /**
     * Wrap function with error handling
     */
    wrapFunction<T extends (...args: any[]) => any>(fn: T, context: Partial<ErrorContext>, recoveryStrategy?: Partial<ErrorRecoveryStrategy>): T;
    /**
     * Normalize error to CascadeError
     */
    private normalizeError;
    /**
     * Get log category from error
     */
    private getCategoryFromError;
    /**
     * Create error report
     */
    private createErrorReport;
    /**
     * Get system information
     */
    private getSystemInfo;
    /**
     * Store error report
     */
    private storeErrorReport;
    /**
     * Attempt error recovery
     */
    private attemptRecovery;
    /**
     * Handle global errors
     */
    private handleGlobalError;
    /**
     * Graceful shutdown
     */
    private gracefulShutdown;
    /**
     * Export error reports
     */
    exportErrorReports(filePath?: string): Promise<void>;
    /**
     * Get error statistics
     */
    getErrorStats(): any;
    /**
     * Get recent error reports
     */
    getRecentReports(count?: number): ErrorReport[];
    /**
     * Clear error reports
     */
    clearReports(): void;
    /**
     * Add custom recovery strategy
     */
    addRecoveryStrategy(errorType: string, strategy: ErrorRecoveryStrategy): void;
    /**
     * Remove recovery strategy
     */
    removeRecoveryStrategy(errorType: string): void;
}
export declare const errorHandler: ErrorHandler;
export declare const handleAsync: <T>(operation: () => Promise<T>, context: ErrorContext, recoveryStrategy?: Partial<ErrorRecoveryStrategy>) => Promise<T>;
export declare const handleSync: <T>(operation: () => T, context: ErrorContext, recoveryStrategy?: Partial<ErrorRecoveryStrategy>) => T;
export declare const wrapFunction: <T extends (...args: any[]) => any>(fn: T, context: Partial<ErrorContext>, recoveryStrategy?: Partial<ErrorRecoveryStrategy>) => T;
export declare function withErrorHandling<T extends (...args: any[]) => any>(context: Partial<ErrorContext>, recoveryStrategy?: Partial<ErrorRecoveryStrategy>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(context: Partial<ErrorContext>, recoveryStrategy?: Partial<ErrorRecoveryStrategy>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=error-handler.d.ts.map