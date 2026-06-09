/**
 * Pre-edit validation hooks for devin/cascade
 * Validates code quality before allowing edits to proceed
 */
export interface ValidationResult {
    allowed: boolean;
    reason?: string;
    suggestions?: string[];
    violations?: CodeViolation[];
}
export interface CodeViolation {
    type: 'DRY_VIOLATION' | 'MISSING_JSDOC' | 'PATTERN_INCONSISTENCY' | 'DOCUMENTATION_ROT';
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggested_fix?: string;
    existing_function?: any;
}
export interface EditContext {
    file_path: string;
    old_string?: string;
    new_string?: string;
    entire_content?: string;
}
export declare class CascadeValidationHooks {
    private guardian;
    constructor(projectPath?: string);
    /**
     * Main validation hook - called before any edit
     */
    validateEdit(context: EditContext): Promise<ValidationResult>;
    private checkDryViolation;
    private checkJSDocCompleteness;
    private checkPatternConsistency;
    private isTypeScriptFile;
    private extractFunctionsFromEdit;
    private extractFunctionName;
    private extractJSDocTag;
    private calculateSimilarity;
    private getDirectoryPath;
    private detectNamingPattern;
    private followsPattern;
    private generateSuggestions;
}
/**
 * Initialize validation hooks for devin/cascade
 * Call this during devin/cascade startup to register pre-edit validation
 */
export declare function initializeValidationHooks(projectPath?: string): CascadeValidationHooks;
//# sourceMappingURL=validation-hooks.d.ts.map