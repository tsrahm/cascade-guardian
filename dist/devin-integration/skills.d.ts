/**
 * devin/cascade skill definitions for Cascade Guardian
 * Provides audit, review, and code quality commands
 */
export declare const CASCADE_SKILLS: {
    name: string;
    description: string;
    trigger: string[];
    category: string;
}[];
export declare class CascadeSkills {
    private guardian;
    private validationHooks;
    constructor(projectPath?: string);
    /**
     * Audit the codebase for JSDoc coverage and code quality
     */
    auditCodebase(): Promise<string>;
    /**
     * Review and apply suggestions
     */
    reviewSuggestions(): Promise<string>;
    /**
     * Analyze code patterns and architectural consistency
     */
    analyzePatterns(): Promise<string>;
    /**
     * Generate a report of potential duplicate code
     */
    duplicatesReport(): Promise<string>;
    private analyzeJSDocCoverage;
    private analyzeDomains;
    private calculateDomainCoverage;
    private identifyTopIssues;
    private generateRecommendations;
    private analyzeNamingPatterns;
    private identifyPatternInconsistencies;
    private findPotentialDuplicates;
    private calculateStringSimilarity;
}
/**
 * Initialize Cascade Guardian skills for devin/cascade
 */
export declare function initializeCascadeSkills(projectPath?: string): CascadeSkills;
//# sourceMappingURL=skills.d.ts.map