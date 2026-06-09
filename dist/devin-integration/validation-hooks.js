/**
 * Pre-edit validation hooks for devin/cascade
 * Validates code quality before allowing edits to proceed
 */
import { CascadeGuardian } from '../index.js';
import { extractBasicFunctions } from '../indexer/simple-indexer.js';
// ─── Validation Hook Implementation ─────────────────────────────────────────
export class CascadeValidationHooks {
    guardian;
    constructor(projectPath) {
        this.guardian = new CascadeGuardian(projectPath);
    }
    /**
     * Main validation hook - called before any edit
     */
    async validateEdit(context) {
        // Skip validation for non-TypeScript files
        if (!this.isTypeScriptFile(context.file_path)) {
            return { allowed: true };
        }
        // Extract functions from the edit
        const editedFunctions = await this.extractFunctionsFromEdit(context);
        if (editedFunctions.length === 0) {
            return { allowed: true }; // No functions to validate
        }
        const violations = [];
        // Check each function
        for (const func of editedFunctions) {
            // 1. DRY Violation Check
            const dryViolation = await this.checkDryViolation(func);
            if (dryViolation)
                violations.push(dryViolation);
            // 2. JSDoc Completeness Check
            const jsdocViolation = this.checkJSDocCompleteness(func);
            if (jsdocViolation)
                violations.push(jsdocViolation);
            // 3. Pattern Consistency Check
            const patternViolation = await this.checkPatternConsistency(func, context);
            if (patternViolation)
                violations.push(patternViolation);
        }
        const errors = violations.filter(v => v.severity === 'error');
        const warnings = violations.filter(v => v.severity === 'warning');
        if (errors.length > 0) {
            return {
                allowed: false,
                reason: `Code quality violations detected: ${errors.map(e => e.message).join(', ')}`,
                violations,
                suggestions: this.generateSuggestions(violations)
            };
        }
        if (warnings.length > 0) {
            return {
                allowed: true,
                reason: `Warnings detected: ${warnings.map(w => w.message).join(', ')}`,
                violations,
                suggestions: this.generateSuggestions(warnings)
            };
        }
        return { allowed: true };
    }
    // ─── Validation Checks ─────────────────────────────────────────────────────
    async checkDryViolation(func) {
        // Search for similar existing functions
        const searchResults = await this.guardian.search(func.name, { limit: 5 });
        // Check if any existing function has the same name and similar purpose
        for (const existing of searchResults.functions) {
            if (existing.name === func.name && existing.file_path !== func.file_path) {
                return {
                    type: 'DRY_VIOLATION',
                    severity: 'error',
                    message: `Function '${func.name}' already exists in ${existing.file_path}`,
                    suggested_fix: `Use existing function '${existing.name}' from ${existing.file_path} instead of creating a duplicate`,
                    existing_function: existing
                };
            }
            // Check for semantic similarity (if embeddings are available)
            if (existing.what && func.what && this.calculateSimilarity(existing.what, func.what) > 0.8) {
                return {
                    type: 'DRY_VIOLATION',
                    severity: 'warning',
                    message: `Function '${func.name}' appears to duplicate functionality of '${existing.name}' in ${existing.file_path}`,
                    suggested_fix: `Consider using existing function '${existing.name}' or rename to be more specific`,
                    existing_function: existing
                };
            }
        }
        return null;
    }
    checkJSDocCompleteness(func) {
        const requiredTags = ['what', 'how', 'why', 'domain', 'tags'];
        const missingTags = requiredTags.filter(tag => !func[tag] || func[tag].trim() === '');
        if (missingTags.length > 0) {
            return {
                type: 'MISSING_JSDOC',
                severity: 'error',
                message: `Function '${func.name}' missing required JSDoc tags: ${missingTags.join(', ')}`,
                suggested_fix: `Add JSDoc with @${missingTags.join(', @')} tags to document the function properly`
            };
        }
        return null;
    }
    async checkPatternConsistency(func, context) {
        // Get other functions in the same directory
        const dirPath = this.getDirectoryPath(context.file_path);
        const similarFunctions = await this.guardian.search('', {
            file_path_pattern: `${dirPath}%`,
            limit: 10
        });
        if (similarFunctions.functions.length === 0) {
            return null; // No existing functions to compare against
        }
        // Check naming conventions
        const existingNames = similarFunctions.functions.map((f) => f.name);
        const namingPattern = this.detectNamingPattern(existingNames);
        if (!this.followsPattern(func.name, namingPattern)) {
            return {
                type: 'PATTERN_INCONSISTENCY',
                severity: 'warning',
                message: `Function '${func.name}' doesn't follow the naming pattern of this directory (${namingPattern})`,
                suggested_fix: `Rename function to follow the established naming pattern: ${namingPattern}`
            };
        }
        return null;
    }
    // ─── Helper Functions ─────────────────────────────────────────────────────
    isTypeScriptFile(filePath) {
        return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    }
    async extractFunctionsFromEdit(context) {
        // For new files or complete rewrites
        if (context.entire_content) {
            return await extractBasicFunctions(context.file_path);
        }
        // For edits, extract from the new content
        const content = context.new_string || '';
        if (content.includes('function') || content.includes('const') || content.includes('export')) {
            // Simple extraction - in a full implementation, you'd parse the AST
            return [{
                    name: this.extractFunctionName(content),
                    file_path: context.file_path,
                    what: this.extractJSDocTag(content, 'what'),
                    how: this.extractJSDocTag(content, 'how'),
                    why: this.extractJSDocTag(content, 'why'),
                    domain: this.extractJSDocTag(content, 'domain'),
                    tags: this.extractJSDocTag(content, 'tags')
                }];
        }
        return [];
    }
    extractFunctionName(content) {
        const match = content.match(/(?:function|const)\s+(\w+)/);
        return match ? match[1] : 'unknown';
    }
    extractJSDocTag(content, tag) {
        const regex = new RegExp(`@${tag}\\s+([^\\n]+)`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim() : undefined;
    }
    calculateSimilarity(text1, text2) {
        // Simple similarity calculation - in production, use proper semantic similarity
        const words1 = text1.toLowerCase().split(' ');
        const words2 = text2.toLowerCase().split(' ');
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return intersection.length / union.length;
    }
    getDirectoryPath(filePath) {
        return filePath.split('/').slice(0, -1).join('/');
    }
    detectNamingPattern(names) {
        // Simple pattern detection - could be more sophisticated
        if (names.every(name => name.includes('_')))
            return 'snake_case';
        if (names.every(name => /^[a-z][a-zA-Z]*$/.test(name)))
            return 'camelCase';
        if (names.every(name => /^[A-Z][a-zA-Z]*$/.test(name)))
            return 'PascalCase';
        return 'mixed';
    }
    followsPattern(name, pattern) {
        switch (pattern) {
            case 'snake_case': return /^[a-z][a-z0-9_]*$/.test(name);
            case 'camelCase': return /^[a-z][a-zA-Z0-9]*$/.test(name);
            case 'PascalCase': return /^[A-Z][a-zA-Z0-9]*$/.test(name);
            default: return true;
        }
    }
    generateSuggestions(violations) {
        return violations
            .filter(v => v.suggested_fix)
            .map(v => v.suggested_fix);
    }
}
// ─── devin/cascade Hook Integration ───────────────────────────────────────────
/**
 * Initialize validation hooks for devin/cascade
 * Call this during devin/cascade startup to register pre-edit validation
 */
export function initializeValidationHooks(projectPath) {
    const hooks = new CascadeValidationHooks(projectPath);
    console.log('Cascade Guardian validation hooks initialized for devin/cascade');
    return hooks;
}
//# sourceMappingURL=validation-hooks.js.map