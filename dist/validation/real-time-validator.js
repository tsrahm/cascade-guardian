/**
 * Real-time validation hooks for immediate code quality feedback
 * Provides instant validation as you write code
 */
import path from 'path';
import { resolveConfig } from '../config.js';
import { openDatabase } from '../database/db.js';
import { AdvancedSemanticSearch } from '../search/advanced-semantic-search.js';
// ─── Real-time Validator Implementation ───────────────────────────────────────────
export class RealTimeValidator {
    db;
    search;
    config;
    rules = new Map();
    validationCache = new Map();
    performanceStats = {
        total_validations: 0,
        total_violations: 0,
        cache_hits: 0,
        average_time: 0
    };
    constructor(projectPath) {
        this.config = resolveConfig(projectPath);
        this.db = openDatabase(this.config.databasePath);
        this.search = new AdvancedSemanticSearch(this.config.databasePath);
        this.initializeRules();
    }
    /**
     * Initialize validation rules with default configuration
     */
    initializeRules() {
        const defaultRules = [
            {
                name: 'dry_violation',
                enabled: true,
                severity: 'error',
                config: { similarity_threshold: 0.8, check_semantics: true }
            },
            {
                name: 'jsdoc_completeness',
                enabled: true,
                severity: 'error',
                config: { required_tags: this.config.jsdoc.requiredTags, min_tags: this.config.jsdoc.minTags }
            },
            {
                name: 'naming_conventions',
                enabled: true,
                severity: 'warning',
                config: { enforce_camel_case: true, enforce_pascal_case: true }
            },
            {
                name: 'pattern_consistency',
                enabled: true,
                severity: 'warning',
                config: { check_directory_patterns: true, check_architectural_patterns: true }
            },
            {
                name: 'semantic_similarity',
                enabled: true,
                severity: 'info',
                config: { threshold: 0.7, check_function_purpose: true }
            },
            {
                name: 'architectural_alignment',
                enabled: true,
                severity: 'warning',
                config: { check_layer_violations: true, check_domain_coherence: true }
            }
        ];
        for (const rule of defaultRules) {
            this.rules.set(rule.name, rule);
        }
    }
    /**
     * Validate code changes in real-time
     */
    async validateCode(context) {
        const startTime = Date.now();
        this.performanceStats.total_validations++;
        // Check cache first
        const cacheKey = this.generateCacheKey(context);
        const cached = this.validationCache.get(cacheKey);
        if (cached) {
            this.performanceStats.cache_hits++;
            return cached;
        }
        const violations = [];
        const suggestions = [];
        try {
            // Parse the code to extract functions
            const functions = await this.extractFunctions(context.content, context.file_path);
            // Run enabled validation rules
            for (const [ruleName, rule] of this.rules.entries()) {
                if (!rule.enabled)
                    continue;
                const ruleViolations = await this.runValidationRule(rule, functions, context);
                violations.push(...ruleViolations);
            }
            // Generate suggestions based on violations
            suggestions.push(...this.generateSuggestions(violations, context));
            // Calculate overall confidence
            const confidence = this.calculateConfidence(violations, functions);
            const result = {
                allowed: !violations.some(v => v.severity === 'error'),
                violations,
                suggestions,
                confidence,
                processing_time: Date.now() - startTime
            };
            // Cache result
            this.validationCache.set(cacheKey, result);
            // Update performance stats
            this.performanceStats.total_violations += violations.length;
            this.updateAverageTime(result.processing_time);
            return result;
        }
        catch (error) {
            console.error('Validation error:', error);
            return {
                allowed: true, // Fail open on errors
                violations: [{
                        type: 'SEMANTIC_SIMILARITY',
                        severity: 'info',
                        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                suggestions: ['Please check the code and try again'],
                confidence: 0.5,
                processing_time: Date.now() - startTime
            };
        }
    }
    /**
     * Extract functions from code content
     */
    async extractFunctions(content, filePath) {
        const functions = [];
        const lines = content.split('\n');
        // Enhanced regex patterns for different function types
        const patterns = [
            // Export function declarations
            {
                regex: /export\s+(async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
                type: 'export_function'
            },
            // Export arrow functions
            {
                regex: /export\s+(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
                type: 'export_arrow'
            },
            // Regular function declarations
            {
                regex: /(?:^|\s)(async\s+)?function\s+(\w+)\s*\([^)]*\)/gm,
                type: 'function'
            },
            // Class methods (more restrictive - require explicit access modifier or class context)
            {
                regex: /(?:public|private|protected)\s+(?:async\s+)?(\w+)\s*\([^)]*\)/g,
                type: 'method'
            }
        ];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.regex.exec(content)) !== null) {
                const functionName = match[2] || match[1];
                const position = match.index || 0;
                const lineNumber = content.substring(0, position).split('\n').length;
                // Extract JSDoc comment
                const jsDocInfo = this.extractJSDocInfo(lines, lineNumber - 1);
                functions.push({
                    name: functionName,
                    type: pattern.type,
                    line_number: lineNumber,
                    file_path: filePath,
                    jsdoc: jsDocInfo,
                    signature: this.extractFunctionSignature(lines, lineNumber)
                });
            }
        }
        return functions;
    }
    /**
     * Run a specific validation rule
     */
    async runValidationRule(rule, functions, context) {
        switch (rule.name) {
            case 'dry_violation':
                return this.checkDryViolations(functions, rule.config);
            case 'jsdoc_completeness':
                return this.checkJSDocCompleteness(functions, rule.config);
            case 'naming_conventions':
                return this.checkNamingConventions(functions, rule.config);
            case 'pattern_consistency':
                return this.checkPatternConsistency(functions, context, rule.config);
            case 'semantic_similarity':
                return this.checkSemanticSimilarity(functions, rule.config);
            case 'architectural_alignment':
                return this.checkArchitecturalAlignment(functions, context, rule.config);
            default:
                return [];
        }
    }
    /**
     * Check for DRY violations
     */
    async checkDryViolations(functions, config) {
        const violations = [];
        // Language keywords and common patterns that should not be flagged as duplicates
        const excludedNames = new Set([
            'if', 'for', 'while', 'switch', 'case', 'catch', 'finally', 'else', 'do', 'try',
            'throw', 'return', 'break', 'continue', 'async', 'await', 'yield', 'typeof', 'instanceof',
            'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf',
            'propertyIsEnumerable', 'toLocaleString', 'bind', 'call', 'apply', 'length', 'name'
        ]);
        for (const func of functions) {
            // Skip excluded names, very short names, and constructor functions
            if (excludedNames.has(func.name) ||
                func.name.length < 3 ||
                func.name === 'constructor' ||
                func.name.startsWith('_') || // Skip private/internal functions
                func.type === 'method') { // Skip class methods for now
                continue;
            }
            // Check for exact name matches in different files only
            const exactMatches = functions.filter(f => f.name === func.name &&
                f !== func &&
                f.file_path !== func.file_path &&
                !excludedNames.has(f.name) &&
                f.type !== 'method');
            if (exactMatches.length > 0) {
                violations.push({
                    rule: 'dry_violation',
                    type: 'DRY_VIOLATION',
                    severity: 'error',
                    message: `Function '${func.name}' already exists in ${[...new Set(exactMatches.map(f => f.file_path))].join(', ')}`,
                    line_number: func.line_number,
                    file_path: func.file_path,
                    suggested_fix: `Rename or remove duplicate function '${func.name}'`,
                    similar_functions: exactMatches.map(f => `${f.name} (${f.file_path}:${f.line_number})`)
                });
            }
            // Check for semantic similarity
            if (config.check_semantics && func.jsdoc.what) {
                const similarFunctions = await this.findSemanticallySimilar(func, config.similarity_threshold);
                if (similarFunctions.length > 0) {
                    violations.push({
                        rule: 'semantic_similarity',
                        type: 'SEMANTIC_SIMILARITY',
                        severity: 'warning',
                        message: `Function '${func.name}' is semantically similar to existing functions`,
                        line_number: func.line_number,
                        file_path: func.file_path,
                        suggested_fix: `Consider refactoring to use existing: ${similarFunctions.join(', ')}`,
                        similar_functions: similarFunctions
                    });
                }
            }
        }
        return violations;
    }
    /**
     * Check JSDoc completeness
     */
    checkJSDocCompleteness(functions, config) {
        const violations = [];
        for (const func of functions) {
            if (!func.jsdoc) {
                violations.push({
                    rule: 'jsdoc_completeness',
                    type: 'MISSING_JSDOC',
                    severity: 'error',
                    message: `Function '${func.name}' missing JSDoc documentation`,
                    line_number: func.line_number,
                    file_path: func.file_path,
                    suggested_fix: `Add JSDoc with required tags: ${config.required_tags.join(', ')}`
                });
                continue;
            }
            const missingTags = config.required_tags.filter((tag) => !func.jsdoc[tag]);
            if (missingTags.length > 0) {
                violations.push({
                    rule: 'jsdoc_completeness',
                    type: 'MISSING_JSDOC',
                    severity: 'error',
                    message: `Function '${func.name}' missing JSDoc tags: ${missingTags.join(', ')}`,
                    line_number: func.line_number,
                    file_path: func.file_path,
                    suggested_fix: `Add missing tags: @${missingTags.join(', @')}`
                });
            }
            if (func.jsdoc.tags && func.jsdoc.tags.split(',').length < config.min_tags) {
                violations.push({
                    rule: 'jsdoc_completeness',
                    type: 'MISSING_JSDOC',
                    severity: 'warning',
                    message: `Function '${func.name}' has insufficient tags (${func.jsdoc.tags.split(',').length}/${config.min_tags} required)`,
                    line_number: func.line_number,
                    file_path: func.file_path,
                    suggested_fix: `Add more descriptive tags to reach minimum of ${config.min_tags}`
                });
            }
        }
        return violations;
    }
    /**
     * Check naming conventions
     */
    checkNamingConventions(functions, config) {
        const violations = [];
        for (const func of functions) {
            // Check camelCase for regular functions
            if (config.enforce_camel_case && !this.isCamelCase(func.name)) {
                violations.push({
                    rule: 'naming_conventions',
                    type: 'NAMING_CONVENTION',
                    severity: 'warning',
                    message: `Function '${func.name}' should use camelCase naming convention`,
                    line_number: func.line_number,
                    file_path: func.file_path,
                    suggested_fix: `Rename to '${this.toCamelCase(func.name)}'`
                });
            }
            // Check PascalCase for class methods (if applicable)
            if (func.type === 'method' && config.enforce_pascal_case && !this.isCamelCase(func.name)) {
                violations.push({
                    type: 'NAMING_CONVENTION',
                    severity: 'warning',
                    message: `Method '${func.name}' should use camelCase naming convention`,
                    line_number: func.line_number,
                    suggested_fix: `Rename to '${this.toCamelCase(func.name)}'`
                });
            }
        }
        return violations;
    }
    /**
     * Check pattern consistency
     */
    async checkPatternConsistency(functions, context, config) {
        const violations = [];
        if (config.check_directory_patterns) {
            const dirPath = path.dirname(context.file_path);
            const existingFunctions = await this.getFunctionsInDirectory(dirPath);
            if (existingFunctions.length > 0) {
                const namingPattern = this.detectNamingPattern(existingFunctions.map(f => f.name));
                for (const func of functions) {
                    if (!this.followsPattern(func.name, namingPattern)) {
                        violations.push({
                            rule: 'pattern_consistency',
                            type: 'PATTERN_INCONSISTENCY',
                            severity: 'warning',
                            message: `Function '${func.name}' doesn't follow the naming pattern of this directory (${namingPattern})`,
                            line_number: func.line_number,
                            file_path: func.file_path,
                            suggested_fix: `Rename function to follow established pattern: ${namingPattern}`
                        });
                    }
                }
            }
        }
        return violations;
    }
    /**
     * Check semantic similarity
     */
    async checkSemanticSimilarity(functions, config) {
        const violations = [];
        for (const func of functions) {
            if (!func.jsdoc.what)
                continue;
            const similarFunctions = await this.findSemanticallySimilar(func, config.threshold);
            if (similarFunctions.length > 0) {
                violations.push({
                    type: 'SEMANTIC_SIMILARITY',
                    severity: 'info',
                    message: `Function '${func.name}' has similar purpose to existing functions`,
                    line_number: func.line_number,
                    suggested_fix: `Consider if this function adds unique value or can be refactored`,
                    similar_functions: similarFunctions
                });
            }
        }
        return violations;
    }
    /**
     * Check architectural alignment
     */
    checkArchitecturalAlignment(functions, context, config) {
        const violations = [];
        for (const func of functions) {
            if (config.check_layer_violations && func.jsdoc.systemlayer) {
                const expectedLayer = this.getExpectedLayer(context.file_path);
                if (expectedLayer && func.jsdoc.systemlayer !== expectedLayer) {
                    violations.push({
                        type: 'ARCHITECTURAL_VIOLATION',
                        severity: 'warning',
                        message: `Function '${func.name}' in ${func.jsdoc.systemlayer} layer but file suggests ${expectedLayer}`,
                        line_number: func.line_number,
                        suggested_fix: `Move function to appropriate layer or update systemlayer tag to ${expectedLayer}`
                    });
                }
            }
            if (config.check_domain_coherence && func.jsdoc.domain) {
                const fileDomain = this.getFileDomain(context.file_path);
                if (fileDomain && func.jsdoc.domain !== fileDomain) {
                    violations.push({
                        type: 'ARCHITECTURAL_VIOLATION',
                        severity: 'info',
                        message: `Function '${func.name}' domain '${func.jsdoc.domain}' doesn't match file domain '${fileDomain}'`,
                        line_number: func.line_number,
                        suggested_fix: `Consider if function belongs in this domain or update domain tag`
                    });
                }
            }
        }
        return violations;
    }
    // ─── Helper Methods ─────────────────────────────────────────────────────────────
    extractJSDocInfo(lines, startLine) {
        const jsDocInfo = {};
        let jsDocText = '';
        // Look backwards for JSDoc comment
        for (let i = startLine; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('/**')) {
                // Found start of JSDoc
                for (let j = i; j < lines.length; j++) {
                    const docLine = lines[j].trim();
                    jsDocText += docLine + '\n';
                    if (docLine.endsWith('*/')) {
                        break;
                    }
                }
                break;
            }
            else if (line.length > 0 && !line.startsWith('*')) {
                break;
            }
        }
        if (jsDocText) {
            // Extract tags
            const tagPatterns = {
                what: /@what\s+([^\n]+)/i,
                how: /@how\s+([^\n]+)/i,
                why: /@why\s+([^\n]+)/i,
                params: /@param\s+\{[^}]+\}\s+(\w+)\s+([^\n]+)/gi,
                returns: /@returns\s+\{[^}]+\}\s+([^\n]+)/i,
                sideeffects: /@sideeffects\s+([^\n]+)/i,
                systemlayer: /@systemlayer\s+([^\n]+)/i,
                domain: /@domain\s+([^\n]+)/i,
                tags: /@tags\s+([^\n]+)/i
            };
            for (const [tag, pattern] of Object.entries(tagPatterns)) {
                if (tag === 'params') {
                    const params = [];
                    let match;
                    while ((match = pattern.exec(jsDocText)) !== null) {
                        params.push(`${match[1]}: ${match[2]}`);
                    }
                    jsDocInfo[tag] = params.join(', ');
                }
                else {
                    const match = jsDocText.match(pattern);
                    if (match) {
                        jsDocInfo[tag] = match[1].trim();
                    }
                }
            }
        }
        return jsDocInfo;
    }
    extractFunctionSignature(lines, lineNumber) {
        for (let i = lineNumber - 1; i < Math.min(lineNumber + 5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.includes('function') || line.includes('=>')) {
                return line.split('{')[0].trim();
            }
        }
        return '';
    }
    async findSemanticallySimilar(func, threshold) {
        if (!func.jsdoc.what)
            return [];
        const searchQuery = `${func.name} ${func.jsdoc.what}`;
        const results = await this.search.search({
            query: searchQuery,
            limit: 5
        });
        return results
            .filter(r => r.score > threshold && r.name !== func.name)
            .map(r => r.name);
    }
    isCamelCase(str) {
        return /^[a-z][a-zA-Z0-9]*$/.test(str);
    }
    toCamelCase(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
    detectNamingPattern(names) {
        // Simple pattern detection
        const hasCamelCase = names.some(name => /^[a-z][a-zA-Z0-9]*$/.test(name));
        const hasSnakeCase = names.some(name => /^[a-z][a-z0-9_]*$/.test(name));
        if (hasCamelCase)
            return 'camelCase';
        if (hasSnakeCase)
            return 'snake_case';
        return 'mixed';
    }
    followsPattern(name, pattern) {
        switch (pattern) {
            case 'camelCase':
                return this.isCamelCase(name);
            case 'snake_case':
                return /^[a-z][a-z0-9_]*$/.test(name);
            default:
                return true;
        }
    }
    async getFunctionsInDirectory(dirPath) {
        const stmt = this.db.prepare(`
      SELECT DISTINCT name FROM functions 
      WHERE file_path LIKE ?
    `);
        const results = stmt.all(`${dirPath}%`);
        return results.map((r) => ({ name: r.name }));
    }
    getExpectedLayer(filePath) {
        // Simple layer detection based on file path
        if (filePath.includes('/models/'))
            return 'Model';
        if (filePath.includes('/services/'))
            return 'Business Logic';
        if (filePath.includes('/utils/'))
            return 'Utility';
        if (filePath.includes('/controllers/'))
            return 'Controller';
        return null;
    }
    getFileDomain(filePath) {
        // Simple domain detection based on file path
        if (filePath.includes('/auth/'))
            return 'authentication';
        if (filePath.includes('/user/'))
            return 'user-management';
        if (filePath.includes('/payment/'))
            return 'payment';
        return null;
    }
    generateCacheKey(context) {
        return `${context.file_path}:${context.content.length}:${context.edit_type}`;
    }
    calculateConfidence(violations, functions) {
        if (functions.length === 0)
            return 0.5;
        const errorCount = violations.filter(v => v.severity === 'error').length;
        const warningCount = violations.filter(v => v.severity === 'warning').length;
        const baseConfidence = 1.0 - (errorCount / functions.length);
        const adjustedConfidence = baseConfidence - (warningCount / functions.length * 0.5);
        return Math.max(0, Math.min(1, adjustedConfidence));
    }
    generateSuggestions(violations, context) {
        const suggestions = [];
        // Group violations by type
        const grouped = violations.reduce((acc, violation) => {
            if (!acc[violation.type])
                acc[violation.type] = [];
            acc[violation.type].push(violation);
            return acc;
        }, {});
        // Generate contextual suggestions
        if (grouped.DRY_VIOLATION) {
            suggestions.push('Consider refactoring to eliminate duplicate code');
        }
        if (grouped.MISSING_JSDOC) {
            suggestions.push('Add comprehensive JSDoc documentation for better code understanding');
        }
        if (grouped.NAMING_CONVENTION) {
            suggestions.push('Follow consistent naming conventions across the codebase');
        }
        if (grouped.ARCHITECTURAL_VIOLATION) {
            suggestions.push('Ensure functions are placed in appropriate architectural layers');
        }
        return suggestions;
    }
    updateAverageTime(newTime) {
        const totalTime = this.performanceStats.average_time * (this.performanceStats.total_validations - 1) + newTime;
        this.performanceStats.average_time = totalTime / this.performanceStats.total_validations;
    }
    // ─── Public API Methods ───────────────────────────────────────────────────────
    /**
     * Enable or disable a validation rule
     */
    setRuleEnabled(ruleName, enabled) {
        const rule = this.rules.get(ruleName);
        if (rule) {
            rule.enabled = enabled;
        }
    }
    /**
     * Configure a validation rule
     */
    configureRule(ruleName, config) {
        const rule = this.rules.get(ruleName);
        if (rule) {
            rule.config = { ...rule.config, ...config };
        }
    }
    /**
     * Get validation statistics
     */
    getStats() {
        return {
            ...this.performanceStats,
            rules_enabled: Array.from(this.rules.values()).filter(r => r.enabled).length,
            rules_total: this.rules.size,
            cache_size: this.validationCache.size
        };
    }
    /**
     * Clear validation cache
     */
    clearCache() {
        this.validationCache.clear();
    }
    /**
     * Validate a file change
     */
    async validateFileChange(filePath, content, editType) {
        return this.validateCode({
            file_path: filePath,
            content,
            edit_type: editType,
            project_path: this.config.projectRoot
        });
    }
    close() {
        this.search.close();
        this.db.close();
    }
}
//# sourceMappingURL=real-time-validator.js.map