/**
 * JavaScript file indexer for Cascade Guardian
 * Extends indexing capabilities to support JavaScript files alongside TypeScript
 */
interface JavaScriptFunction {
    name: string;
    type: 'function' | 'arrow' | 'method' | 'constructor' | 'class';
    file_path: string;
    line_number: number;
    tier: number;
    what?: string;
    how?: string;
    why?: string;
    params?: string;
    returns?: string;
    sideeffects?: string;
    systemlayer?: string;
    domain?: string;
    tags?: string;
    inline_comments?: string;
    is_exported: boolean;
    is_async: boolean;
    module_type?: 'es6' | 'commonjs' | 'umd';
}
interface JavaScriptClass {
    name: string;
    file_path: string;
    line_number: number;
    tier: number;
    what?: string;
    how?: string;
    why?: string;
    domain?: string;
    tags?: string;
    inline_comments?: string;
    is_exported: boolean;
    extends?: string;
    methods: string[];
}
interface JavaScriptModule {
    type: 'es6' | 'commonjs' | 'umd';
    imports: string[];
    exports: string[];
    file_path: string;
}
export declare class JavaScriptIndexer {
    private supportedExtensions;
    private jsdocPatterns;
    /**
     * Index JavaScript files in a directory
     */
    indexDirectory(directoryPath: string): Promise<{
        functions: JavaScriptFunction[];
        classes: JavaScriptClass[];
        modules: JavaScriptModule[];
        stats: any;
    }>;
    /**
     * Index a single JavaScript file
     */
    indexFile(filePath: string): Promise<{
        functions: JavaScriptFunction[];
        classes: JavaScriptClass[];
        module: JavaScriptModule;
    }>;
    /**
     * Find all JavaScript files in directory
     */
    private findJavaScriptFiles;
    /**
     * Detect JavaScript module type
     */
    private detectModuleType;
    /**
     * Extract functions from JavaScript content
     */
    private extractFunctions;
    /**
     * Extract classes from JavaScript content
     */
    private extractClasses;
    /**
     * Extract methods from a class
     */
    private extractClassMethods;
    /**
     * Extract module information
     */
    private extractModuleInfo;
    /**
     * Extract JSDoc information from lines
     */
    private extractJSDocInfo;
    /**
     * Extract inline comments
     */
    private extractInlineComments;
    /**
     * Calculate tier based on documentation quality
     */
    private calculateTier;
    /**
     * Get supported file extensions
     */
    getSupportedExtensions(): string[];
    /**
     * Add support for additional file extensions
     */
    addSupportedExtension(extension: string): void;
    /**
     * Check if file is supported
     */
    isFileSupported(filePath: string): boolean;
    /**
     * Get indexing statistics
     */
    getStats(): any;
}
export {};
//# sourceMappingURL=javascript-indexer.d.ts.map