/**
 * JavaScript file indexer for Cascade Guardian
 * Extends indexing capabilities to support JavaScript files alongside TypeScript
 */
import fs from 'fs';
import path from 'path';
import { logger, LogCategory } from '../logging/logger.js';
// ─── Simple IndexingError Class ───────────────────────────────────────────────────
class IndexingError extends Error {
    context;
    data;
    constructor(message, context, data) {
        super(message);
        this.name = 'IndexingError';
        this.context = context;
        this.data = data;
    }
}
// ─── JavaScript Indexer Implementation ───────────────────────────────────────────
export class JavaScriptIndexer {
    supportedExtensions = ['.js', '.jsx', '.mjs', '.cjs'];
    jsdocPatterns = {
        singleLine: /\/\/\/\s*@(\w+)\s+(.+)$/gm,
        multiLine: /\/\*\*\s*\n([\s\S]*?)\s*\*\//gm,
        tagPattern: /@(\w+)\s+(.+)$/gm
    };
    /**
     * Index JavaScript files in a directory
     */
    async indexDirectory(directoryPath) {
        logger.info(LogCategory.INDEXING, `Starting JavaScript indexing for ${directoryPath}`);
        const timer = logger.timer(LogCategory.PERFORMANCE, 'javascript-indexing');
        try {
            const jsFiles = this.findJavaScriptFiles(directoryPath);
            logger.info(LogCategory.INDEXING, `Found ${jsFiles.length} JavaScript files`);
            const results = {
                functions: [],
                classes: [],
                modules: [],
                stats: {
                    files_processed: 0,
                    functions_extracted: 0,
                    classes_extracted: 0,
                    modules_detected: 0,
                    processing_time: 0
                }
            };
            for (const filePath of jsFiles) {
                try {
                    const fileResults = await this.indexFile(filePath);
                    results.functions.push(...fileResults.functions);
                    results.classes.push(...fileResults.classes);
                    results.modules.push(fileResults.module);
                    results.stats.files_processed++;
                    results.stats.functions_extracted += fileResults.functions.length;
                    results.stats.classes_extracted += fileResults.classes.length;
                    results.stats.modules_detected++;
                }
                catch (error) {
                    logger.error(LogCategory.INDEXING, `Failed to index file ${filePath}`, error);
                }
            }
            // Processing time will be calculated by the timer
            logger.info(LogCategory.INDEXING, `JavaScript indexing completed`, results.stats);
            timer();
            return results;
        }
        catch (error) {
            throw new IndexingError(`JavaScript indexing failed for ${directoryPath}`, 'index-directory', { directoryPath });
        }
    }
    /**
     * Index a single JavaScript file
     */
    async indexFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        // Detect module type
        const moduleType = this.detectModuleType(content, filePath);
        // Extract functions
        const functions = this.extractFunctions(content, lines, filePath, moduleType);
        // Extract classes
        const classes = this.extractClasses(content, lines, filePath, moduleType);
        // Extract module information
        const module = this.extractModuleInfo(content, filePath, moduleType);
        return { functions, classes, module };
    }
    /**
     * Find all JavaScript files in directory
     */
    findJavaScriptFiles(directoryPath) {
        const files = [];
        const scanDirectory = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    // Skip node_modules and other common excludes
                    if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
                        scanDirectory(fullPath);
                    }
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (this.supportedExtensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        };
        scanDirectory(directoryPath);
        return files;
    }
    /**
     * Detect JavaScript module type
     */
    detectModuleType(content, filePath) {
        const hasES6Imports = content.includes('import ') || content.includes('export ');
        const hasCommonJS = content.includes('require(') || content.includes('module.exports');
        const hasUMD = content.includes('(function (root, factory)') || content.includes('typeof exports');
        if (hasUMD)
            return 'umd';
        if (hasES6Imports)
            return 'es6';
        if (hasCommonJS)
            return 'commonjs';
        // Default based on file extension
        if (filePath.endsWith('.mjs'))
            return 'es6';
        if (filePath.endsWith('.cjs'))
            return 'commonjs';
        return 'commonjs'; // Default to CommonJS for .js files
    }
    /**
     * Extract functions from JavaScript content
     */
    extractFunctions(content, lines, filePath, moduleType) {
        const functions = [];
        // Enhanced regex patterns for JavaScript functions
        const patterns = [
            // ES6 function declarations
            {
                regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
                type: 'function',
                isExported: (match) => match.includes('export'),
                isAsync: (match) => match.includes('async')
            },
            // ES6 arrow functions
            {
                regex: /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
                type: 'arrow',
                isExported: (match) => match.includes('export'),
                isAsync: (match) => match.includes('async')
            },
            // ES6 method definitions
            {
                regex: /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,
                type: 'method',
                isExported: () => false,
                isAsync: (match) => match.includes('async')
            },
            // CommonJS exports
            {
                regex: /exports\.(\w+)\s*=\s*(?:async\s+)?function\s*\([^)]*\)/g,
                type: 'function',
                isExported: () => true,
                isAsync: (match) => match.includes('async')
            },
            // CommonJS arrow exports
            {
                regex: /exports\.(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
                type: 'arrow',
                isExported: () => true,
                isAsync: (match) => match.includes('async')
            },
            // Class constructors
            {
                regex: /constructor\s*\([^)]*\)/g,
                type: 'constructor',
                isExported: () => false,
                isAsync: () => false
            }
        ];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.regex.exec(content)) !== null) {
                const functionName = match[1];
                const position = match.index || 0;
                const lineNumber = content.substring(0, position).split('\n').length;
                // Extract JSDoc information
                const jsDocInfo = this.extractJSDocInfo(lines, lineNumber - 1);
                // Determine tier based on documentation quality
                const tier = this.calculateTier(jsDocInfo);
                const functionInfo = {
                    name: functionName,
                    type: pattern.type,
                    file_path: filePath,
                    line_number: lineNumber,
                    tier,
                    what: jsDocInfo.what,
                    how: jsDocInfo.how,
                    why: jsDocInfo.why,
                    params: jsDocInfo.params,
                    returns: jsDocInfo.returns,
                    sideeffects: jsDocInfo.sideeffects || 'Unknown',
                    systemlayer: jsDocInfo.systemlayer,
                    domain: jsDocInfo.domain,
                    tags: jsDocInfo.tags,
                    inline_comments: this.extractInlineComments(lines, lineNumber),
                    is_exported: pattern.isExported(match[0]),
                    is_async: pattern.isAsync(match[0]),
                    module_type: moduleType
                };
                functions.push(functionInfo);
            }
        }
        return functions;
    }
    /**
     * Extract classes from JavaScript content
     */
    extractClasses(content, lines, filePath, moduleType) {
        const classes = [];
        // ES6 class patterns
        const classPatterns = [
            // ES6 class declarations
            {
                regex: /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/g,
                isExported: (match) => match.includes('export')
            },
            // CommonJS class exports
            {
                regex: /exports\.(\w+)\s*=\s*class\s+(?:\w+)?(?:\s+extends\s+(\w+))?\s*\{/g,
                isExported: () => true
            }
        ];
        for (const pattern of classPatterns) {
            let match;
            while ((match = pattern.regex.exec(content)) !== null) {
                const className = match[1];
                const extendsClass = match[2];
                const position = match.index || 0;
                const lineNumber = content.substring(0, position).split('\n').length;
                // Extract JSDoc information
                const jsDocInfo = this.extractJSDocInfo(lines, lineNumber - 1);
                // Extract methods from class
                const methods = this.extractClassMethods(content, className, lineNumber);
                const tier = this.calculateTier(jsDocInfo);
                const classInfo = {
                    name: className,
                    file_path: filePath,
                    line_number: lineNumber,
                    tier,
                    what: jsDocInfo.what,
                    how: jsDocInfo.how,
                    why: jsDocInfo.why,
                    domain: jsDocInfo.domain,
                    tags: jsDocInfo.tags,
                    inline_comments: this.extractInlineComments(lines, lineNumber),
                    is_exported: pattern.isExported(match[0]),
                    extends: extendsClass,
                    methods
                };
                classes.push(classInfo);
            }
        }
        return classes;
    }
    /**
     * Extract methods from a class
     */
    extractClassMethods(content, className, startLine) {
        const methods = [];
        // Find class body
        const classStart = content.indexOf(`class ${className}`, startLine * 100);
        if (classStart === -1)
            return methods;
        let braceCount = 0;
        let inClass = false;
        let classEnd = classStart;
        for (let i = classStart; i < content.length; i++) {
            if (content[i] === '{') {
                braceCount++;
                inClass = true;
            }
            else if (content[i] === '}') {
                braceCount--;
                if (inClass && braceCount === 0) {
                    classEnd = i;
                    break;
                }
            }
        }
        const classBody = content.substring(classStart, classEnd);
        // Extract method names
        const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
        let match;
        while ((match = methodPattern.exec(classBody)) !== null) {
            if (match[1] !== 'constructor') {
                methods.push(match[1]);
            }
        }
        return methods;
    }
    /**
     * Extract module information
     */
    extractModuleInfo(content, filePath, moduleType) {
        const imports = [];
        const exports = [];
        if (moduleType === 'es6') {
            // ES6 imports
            const importPattern = /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
            let match;
            while ((match = importPattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
            // ES6 exports
            const exportPattern = /export\s+(?:\{[^}]+\}|\*\s+as\s+\w+|(?:default\s+)?(?:class|function|const|let|var)\s+(\w+))/g;
            while ((match = exportPattern.exec(content)) !== null) {
                exports.push(match[1] || match[0]);
            }
        }
        else if (moduleType === 'commonjs') {
            // CommonJS requires
            const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            let match;
            while ((match = requirePattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
            // CommonJS exports
            const exportPattern = /exports\.(\w+)|module\.exports\s*=|exports\./g;
            while ((match = exportPattern.exec(content)) !== null) {
                exports.push(match[1] || match[0]);
            }
        }
        return {
            type: moduleType,
            imports,
            exports,
            file_path: filePath
        };
    }
    /**
     * Extract JSDoc information from lines
     */
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
            // Extract tags using regex
            const tagPatterns = {
                what: /@what\s+([^\n]+)/i,
                how: /@how\s+([^\n]+)/i,
                why: /@why\s+([^\n]+)/i,
                params: /@param\s+\{[^}]*\}\s+(\w+)\s+([^\n]+)/gi,
                returns: /@returns\s+\{[^}]*\}\s+([^\n]+)/i,
                sideeffects: /@sideeffects\s+([^\n]+)/i,
                systemlayer: /@systemlayer\s+([^\n]+)/i,
                domain: /@domain\s+([^\n]+)/i,
                tags: /@tags?\s+([^\n]+)/i
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
    /**
     * Extract inline comments
     */
    extractInlineComments(lines, lineNumber) {
        const comments = [];
        // Look for inline comments on the same line and next few lines
        for (let i = lineNumber; i < Math.min(lineNumber + 3, lines.length); i++) {
            const line = lines[i].trim();
            if (line.startsWith('//') && !line.startsWith('///')) {
                comments.push(line.substring(2).trim());
            }
        }
        return comments.join(' ');
    }
    /**
     * Calculate tier based on documentation quality
     */
    calculateTier(jsDocInfo) {
        const hasDocumentation = jsDocInfo.what || jsDocInfo.how || jsDocInfo.why;
        const hasRequiredTags = jsDocInfo.what && jsDocInfo.how && jsDocInfo.why;
        if (hasRequiredTags) {
            return 1; // Well-documented
        }
        else if (hasDocumentation) {
            return 2; // Partially documented
        }
        else {
            return 3; // Undocumented
        }
    }
    /**
     * Get supported file extensions
     */
    getSupportedExtensions() {
        return [...this.supportedExtensions];
    }
    /**
     * Add support for additional file extensions
     */
    addSupportedExtension(extension) {
        if (!this.supportedExtensions.includes(extension)) {
            this.supportedExtensions.push(extension);
            logger.info(LogCategory.INDEXING, `Added support for ${extension} files`);
        }
    }
    /**
     * Check if file is supported
     */
    isFileSupported(filePath) {
        const ext = path.extname(filePath);
        return this.supportedExtensions.includes(ext);
    }
    /**
     * Get indexing statistics
     */
    getStats() {
        return {
            supported_extensions: this.supportedExtensions,
            jsdoc_patterns: Object.keys(this.jsdocPatterns).length
        };
    }
}
//# sourceMappingURL=javascript-indexer.js.map