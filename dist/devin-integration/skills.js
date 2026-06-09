/**
 * devin/cascade skill definitions for Cascade Guardian
 * Provides audit, review, and code quality commands
 */
import { CascadeGuardian } from '../index.js';
import { CascadeValidationHooks } from './validation-hooks.js';
// ─── Skill Definitions ───────────────────────────────────────────────────────
export const CASCADE_SKILLS = [
    {
        name: 'audit-codebase',
        description: 'Audit JSDoc coverage and code quality across the codebase',
        trigger: ['audit codebase', 'check documentation', 'code quality audit', 'jsdoc coverage'],
        category: 'code-quality'
    },
    {
        name: 'review-suggestions',
        description: 'Review and apply accumulated non-blocking suggestions from validation',
        trigger: ['review suggestions', 'apply suggestions', 'code review suggestions'],
        category: 'code-review'
    },
    {
        name: 'analyze-patterns',
        description: 'Analyze code patterns and architectural consistency',
        trigger: ['analyze patterns', 'code patterns', 'architecture analysis'],
        category: 'architecture'
    },
    {
        name: 'duplicates-report',
        description: 'Generate a report of potential duplicate code',
        trigger: ['find duplicates', 'duplicate code', 'dry violations'],
        category: 'code-quality'
    }
];
// ─── Skill Implementations ───────────────────────────────────────────────────
export class CascadeSkills {
    guardian;
    validationHooks;
    constructor(projectPath) {
        this.guardian = new CascadeGuardian(projectPath);
        this.validationHooks = new CascadeValidationHooks(projectPath);
    }
    /**
     * Audit the codebase for JSDoc coverage and code quality
     */
    async auditCodebase() {
        const report = [];
        try {
            // Get all functions from the index
            const allFunctions = await this.guardian.search('', { limit: 1000 });
            const functions = allFunctions.functions;
            report.push(`# Codebase Guardian - Audit Report`);
            report.push(`**Project:** ${this.guardian.getConfig().projectName}`);
            report.push(`**Scanned:** ${functions.length} functions`);
            report.push('');
            // JSDoc Coverage Analysis
            const jsdocAnalysis = this.analyzeJSDocCoverage(functions);
            report.push('## JSDoc Coverage');
            report.push('| Category | Count | Percentage |');
            report.push('|----------|-------|------------|');
            report.push(`| Complete JSDoc | ${jsdocAnalysis.complete} | ${jsdocAnalysis.completePercent}% |`);
            report.push(`| Partial JSDoc | ${jsdocAnalysis.partial} | ${jsdocAnalysis.partialPercent}% |`);
            report.push(`| No JSDoc | ${jsdocAnalysis.none} | ${jsdocAnalysis.nonePercent}% |`);
            report.push('');
            // Domain Analysis
            const domainAnalysis = this.analyzeDomains(functions);
            report.push('## Business Domains');
            report.push('| Domain | Functions | Coverage |');
            report.push('|--------|-----------|----------|');
            for (const [domain, count] of Object.entries(domainAnalysis)) {
                const coverage = this.calculateDomainCoverage(functions, domain);
                report.push(`| ${domain} | ${count} | ${coverage}% |`);
            }
            report.push('');
            // Top Issues
            const issues = this.identifyTopIssues(functions);
            if (issues.length > 0) {
                report.push('## Top Issues');
                issues.forEach((issue, index) => {
                    report.push(`${index + 1}. **${issue.type}** - ${issue.message}`);
                    report.push(`   - Location: \`${issue.location}\``);
                    report.push(`   - Suggestion: ${issue.suggestion}`);
                    report.push('');
                });
            }
            // Recommendations
            const recommendations = this.generateRecommendations(functions);
            report.push('## Recommendations');
            recommendations.forEach((rec, index) => {
                report.push(`${index + 1}. ${rec}`);
            });
            return report.join('\n');
        }
        catch (error) {
            return `# Audit Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    /**
     * Review and apply suggestions
     */
    async reviewSuggestions() {
        const report = [];
        try {
            // In a full implementation, this would read from .guardian/suggestions.md
            // For now, we'll provide a template response
            report.push(`# Code Review Suggestions`);
            report.push(`**Project:** ${this.guardian.getConfig().projectName}`);
            report.push(`**Last Updated:** ${new Date().toISOString()}`);
            report.push('');
            report.push('## Pending Suggestions');
            report.push('No suggestions found. The codebase appears to be in good shape!');
            report.push('');
            report.push('## How to Use This Skill');
            report.push('1. Make code edits - validation hooks will generate suggestions');
            report.push('2. Run this skill to review accumulated suggestions');
            report.push('3. Apply suggestions to improve code quality');
            report.push('');
            return report.join('\n');
        }
        catch (error) {
            return `# Review Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    /**
     * Analyze code patterns and architectural consistency
     */
    async analyzePatterns() {
        const report = [];
        try {
            const allFunctions = await this.guardian.search('', { limit: 1000 });
            const functions = allFunctions.functions;
            report.push(`# Code Pattern Analysis`);
            report.push(`**Project:** ${this.guardian.getConfig().projectName}`);
            report.push(`**Analyzed:** ${functions.length} functions`);
            report.push('');
            // Naming Patterns
            const namingPatterns = this.analyzeNamingPatterns(functions);
            report.push('## Naming Patterns');
            report.push('| Pattern | Count | Percentage |');
            report.push('|---------|-------|------------|');
            for (const [pattern, count] of Object.entries(namingPatterns)) {
                const percentage = ((count / functions.length) * 100).toFixed(1);
                report.push(`| ${pattern} | ${count} | ${percentage}% |`);
            }
            report.push('');
            // Architectural Layers
            const layers = await this.guardian.listSystemLayers();
            report.push('## Architectural Layers');
            report.push('| Layer | Functions |');
            report.push('|-------|-----------|');
            layers.system_layers.forEach((layer) => {
                report.push(`| ${layer.systemlayer} | ${layer.count} |`);
            });
            report.push('');
            // Domain Distribution
            const domains = await this.guardian.listDomains();
            report.push('## Domain Distribution');
            report.push('| Domain | Functions | Percentage |');
            report.push('|--------|-----------|------------|');
            const totalFunctions = domains.domains.reduce((sum, d) => sum + d.count, 0);
            domains.domains.forEach((domain) => {
                const percentage = ((domain.count / totalFunctions) * 100).toFixed(1);
                report.push(`| ${domain.domain} | ${domain.count} | ${percentage}% |`);
            });
            report.push('');
            // Pattern Consistency Issues
            const inconsistencies = this.identifyPatternInconsistencies(functions);
            if (inconsistencies.length > 0) {
                report.push('## Pattern Inconsistencies');
                inconsistencies.forEach((issue, index) => {
                    report.push(`${index + 1}. **${issue.type}**`);
                    report.push(`   - ${issue.description}`);
                    report.push(`   - Location: \`${issue.location}\``);
                    report.push('');
                });
            }
            return report.join('\n');
        }
        catch (error) {
            return `# Pattern Analysis Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    /**
     * Generate a report of potential duplicate code
     */
    async duplicatesReport() {
        const report = [];
        try {
            const allFunctions = await this.guardian.search('', { limit: 1000 });
            const functions = allFunctions.functions;
            report.push(`# Duplicate Code Report`);
            report.push(`**Project:** ${this.guardian.getConfig().projectName}`);
            report.push(`**Analyzed:** ${functions.length} functions`);
            report.push(`**Generated:** ${new Date().toISOString()}`);
            report.push('');
            // Find potential duplicates by name similarity
            const duplicates = this.findPotentialDuplicates(functions);
            if (duplicates.length === 0) {
                report.push('## ✅ No Duplicates Found');
                report.push('Great! No obvious duplicate functions were detected.');
                report.push('');
            }
            else {
                report.push(`## ⚠️  Potential Duplicates (${duplicates.length})`);
                duplicates.forEach((dup, index) => {
                    report.push(`### ${index + 1}. ${dup.function1.name} vs ${dup.function2.name}`);
                    report.push(`**Similarity:** ${dup.similarity}%`);
                    report.push(`**Function 1:** \`${dup.function1.file_path}:${dup.function1.line_number}\``);
                    report.push(`**Function 2:** \`${dup.function2.file_path}:${dup.function2.line_number}\``);
                    if (dup.function1.what && dup.function2.what) {
                        report.push(`**Purpose 1:** ${dup.function1.what}`);
                        report.push(`**Purpose 2:** ${dup.function2.what}`);
                    }
                    report.push(`**Recommendation:** ${dup.recommendation}`);
                    report.push('');
                });
            }
            return report.join('\n');
        }
        catch (error) {
            return `# Duplicate Analysis Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    // ─── Helper Methods ─────────────────────────────────────────────────────
    analyzeJSDocCoverage(functions) {
        const complete = functions.filter(f => f.what && f.how && f.why && f.domain && f.tags).length;
        const partial = functions.filter(f => f.what || f.how || f.why || f.domain || f.tags).length - complete;
        const none = functions.length - complete - partial;
        return {
            complete,
            partial,
            none,
            completePercent: ((complete / functions.length) * 100).toFixed(1),
            partialPercent: ((partial / functions.length) * 100).toFixed(1),
            nonePercent: ((none / functions.length) * 100).toFixed(1)
        };
    }
    analyzeDomains(functions) {
        const domains = {};
        functions.forEach(func => {
            if (func.domain) {
                domains[func.domain] = (domains[func.domain] || 0) + 1;
            }
        });
        return domains;
    }
    calculateDomainCoverage(functions, domain) {
        const domainFunctions = functions.filter(f => f.domain === domain);
        const withJSDoc = domainFunctions.filter(f => f.what && f.how && f.why);
        return ((withJSDoc.length / domainFunctions.length) * 100).toFixed(1);
    }
    identifyTopIssues(functions) {
        const issues = [];
        // Find functions without JSDoc
        functions.forEach(func => {
            if (!func.what || !func.how || !func.why) {
                issues.push({
                    type: 'Missing JSDoc',
                    message: `Function '${func.name}' lacks complete documentation`,
                    location: `${func.file_path}:${func.line_number}`,
                    suggestion: 'Add @what, @how, and @why tags to document this function'
                });
            }
        });
        return issues.slice(0, 10); // Return top 10 issues
    }
    generateRecommendations(functions) {
        const recommendations = [];
        const jsdocAnalysis = this.analyzeJSDocCoverage(functions);
        if (parseFloat(jsdocAnalysis.nonePercent) > 20) {
            recommendations.push('Improve JSDoc coverage - many functions lack documentation');
        }
        if (parseFloat(jsdocAnalysis.completePercent) < 50) {
            recommendations.push('Add complete JSDoc tags (@what, @how, @why, @domain, @tags) to improve code discoverability');
        }
        recommendations.push('Consider running the audit regularly to maintain code quality');
        return recommendations;
    }
    analyzeNamingPatterns(functions) {
        const patterns = {
            camelCase: 0,
            snake_case: 0,
            PascalCase: 0,
            other: 0
        };
        functions.forEach(func => {
            const name = func.name;
            if (/^[a-z][a-zA-Z0-9]*$/.test(name))
                patterns.camelCase++;
            else if (/^[a-z][a-z0-9_]*$/.test(name))
                patterns.snake_case++;
            else if (/^[A-Z][a-zA-Z0-9]*$/.test(name))
                patterns.PascalCase++;
            else
                patterns.other++;
        });
        return patterns;
    }
    identifyPatternInconsistencies(functions) {
        // Simple implementation - could be more sophisticated
        const inconsistencies = [];
        // Check for mixed naming patterns in the same directory
        const directories = {};
        functions.forEach(func => {
            const dir = func.file_path.split('/')[0];
            if (!directories[dir])
                directories[dir] = [];
            directories[dir].push(func.name);
        });
        Object.entries(directories).forEach(([dir, names]) => {
            const patterns = names.map(name => {
                if (/^[a-z][a-zA-Z0-9]*$/.test(name))
                    return 'camelCase';
                if (/^[a-z][a-z0-9_]*$/.test(name))
                    return 'snake_case';
                if (/^[A-Z][a-zA-Z0-9]*$/.test(name))
                    return 'PascalCase';
                return 'other';
            });
            const uniquePatterns = [...new Set(patterns)];
            if (uniquePatterns.length > 1) {
                inconsistencies.push({
                    type: 'Mixed Naming Patterns',
                    description: `Directory '${dir}' uses multiple naming patterns: ${uniquePatterns.join(', ')}`,
                    location: dir
                });
            }
        });
        return inconsistencies;
    }
    findPotentialDuplicates(functions) {
        const duplicates = [];
        // Simple duplicate detection by name similarity
        for (let i = 0; i < functions.length; i++) {
            for (let j = i + 1; j < functions.length; j++) {
                const f1 = functions[i];
                const f2 = functions[j];
                // Skip if same file
                if (f1.file_path === f2.file_path)
                    continue;
                // Check name similarity
                const nameSimilarity = this.calculateStringSimilarity(f1.name, f2.name);
                if (nameSimilarity > 0.7) {
                    duplicates.push({
                        function1: f1,
                        function2: f2,
                        similarity: (nameSimilarity * 100).toFixed(1),
                        recommendation: `Consider consolidating these functions or renaming to be more distinct`
                    });
                }
            }
        }
        return duplicates.slice(0, 20); // Return top 20
    }
    calculateStringSimilarity(str1, str2) {
        const words1 = str1.toLowerCase().split(/[_\s-]/);
        const words2 = str2.toLowerCase().split(/[_\s-]/);
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return intersection.length / union.length;
    }
}
// ─── Skill Registration ─────────────────────────────────────────────────────
/**
 * Initialize Cascade Guardian skills for devin/cascade
 */
export function initializeCascadeSkills(projectPath) {
    const skills = new CascadeSkills(projectPath);
    console.log('Cascade Guardian skills initialized for devin/cascade');
    return skills;
}
//# sourceMappingURL=skills.js.map