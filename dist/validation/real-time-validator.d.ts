/**
 * Real-time validation hooks for immediate code quality feedback
 * Provides instant validation as you write code
 */
interface ValidationResult {
    allowed: boolean;
    violations: CodeViolation[];
    suggestions: string[];
    confidence: number;
    processing_time: number;
}
interface CodeViolation {
    type: 'DRY_VIOLATION' | 'MISSING_JSDOC' | 'PATTERN_INCONSISTENCY' | 'SEMANTIC_SIMILARITY' | 'NAMING_CONVENTION' | 'ARCHITECTURAL_VIOLATION';
    severity: 'error' | 'warning' | 'info';
    message: string;
    line_number?: number;
    column?: number;
    suggested_fix?: string;
    similar_functions?: string[];
}
interface ValidationContext {
    file_path: string;
    content: string;
    cursor_position?: number;
    edit_type: 'create' | 'modify' | 'delete';
    project_path: string;
}
export declare class RealTimeValidator {
    private db;
    private search;
    private config;
    private rules;
    private validationCache;
    private performanceStats;
    constructor(projectPath: string);
    /**
     * Initialize validation rules with default configuration
     */
    private initializeRules;
    /**
     * Validate code changes in real-time
     */
    validateCode(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Extract functions from code content
     */
    private extractFunctions;
    /**
     * Run a specific validation rule
     */
    private runValidationRule;
    /**
     * Check for DRY violations
     */
    private checkDryViolations;
    /**
     * Check JSDoc completeness
     */
    private checkJSDocCompleteness;
    /**
     * Check naming conventions
     */
    private checkNamingConventions;
    /**
     * Check pattern consistency
     */
    private checkPatternConsistency;
    /**
     * Check semantic similarity
     */
    private checkSemanticSimilarity;
    /**
     * Check architectural alignment
     */
    private checkArchitecturalAlignment;
    private extractJSDocInfo;
    private extractFunctionSignature;
    private findSemanticallySimilar;
    private isCamelCase;
    private toCamelCase;
    private detectNamingPattern;
    private followsPattern;
    private getFunctionsInDirectory;
    private getExpectedLayer;
    private getFileDomain;
    private generateCacheKey;
    private calculateConfidence;
    private generateSuggestions;
    private updateAverageTime;
    /**
     * Enable or disable a validation rule
     */
    setRuleEnabled(ruleName: string, enabled: boolean): void;
    /**
     * Configure a validation rule
     */
    configureRule(ruleName: string, config: any): void;
    /**
     * Get validation statistics
     */
    getStats(): any;
    /**
     * Clear validation cache
     */
    clearCache(): void;
    /**
     * Validate a file change
     */
    validateFileChange(filePath: string, content: string, editType: 'create' | 'modify' | 'delete'): Promise<ValidationResult>;
    close(): void;
}
export {};
//# sourceMappingURL=real-time-validator.d.ts.map