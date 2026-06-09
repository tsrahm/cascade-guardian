/**
 * Call graph analysis for Cascade Guardian
 * Analyzes function dependencies and call relationships
 */
export interface CallEdge {
    caller_id: number;
    callee_id: number;
    caller_name: string;
    callee_name: string;
    file_path: string;
    line_number: number;
    call_type: 'direct' | 'indirect' | 'conditional';
}
export interface CallGraphNode {
    id: number;
    name: string;
    file_path: string;
    line_number: number;
    tier: number;
    callers: CallEdge[];
    callees: CallEdge[];
    depth: number;
    is_leaf: boolean;
    is_root: boolean;
}
export interface CallGraphAnalysis {
    nodes: CallGraphNode[];
    edges: CallEdge[];
    total_functions: number;
    total_calls: number;
    max_depth: number;
    circular_dependencies: string[][];
    hotspots: Array<{
        function: string;
        call_count: number;
        file_path: string;
    }>;
}
export declare class CallGraphAnalyzer {
    private db;
    private functionMap;
    private reverseFunctionMap;
    constructor(dbPath: string);
    private buildFunctionMaps;
    /**
     * Build call graph by analyzing function bodies
     */
    buildCallGraph(projectRoot: string, sourceDirectories: string[]): Promise<void>;
    private analyzeDirectory;
    private getAllTypeScriptFiles;
    private analyzeFile;
    private extractFunctionCalls;
    private removeStringsAndComments;
    private isBuiltinFunction;
    private recordFunctionCall;
    private findCallingFunction;
    private findFunctionByName;
    /**
     * Get comprehensive call graph analysis
     */
    analyzeCallGraph(): CallGraphAnalysis;
    private buildGraphNodes;
    private buildGraphEdges;
    private detectCircularDependencies;
    private findCallHotspots;
    private calculateMaxDepth;
    /**
     * Get impact analysis for a function change
     */
    getImpactAnalysis(functionName: string, filePath?: string, maxDepth?: number): {
        affected_functions: Array<{
            name: string;
            file_path: string;
            depth: number;
        }>;
        total_affected: number;
        risk_level: 'low' | 'medium' | 'high';
    };
    private bfsTraversal;
    close(): void;
}
//# sourceMappingURL=call-graph-analyzer.d.ts.map