/**
 * Call graph analysis for Cascade Guardian
 * Analyzes function dependencies and call relationships
 */

import fs from 'fs';
import path from 'path';
import { openDatabase } from '../database/db.js';

// ─── Call Graph Types ───────────────────────────────────────────────────────────

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

// ─── Call Graph Builder ───────────────────────────────────────────────────────

export class CallGraphAnalyzer {
  private db: any;
  private functionMap: Map<string, number> = new Map();
  private reverseFunctionMap: Map<number, string> = new Map();

  constructor(dbPath: string) {
    this.db = openDatabase(dbPath);
    this.buildFunctionMaps();
  }

  private buildFunctionMaps(): void {
    // Build name -> ID and ID -> name mappings
    const stmt = this.db.prepare(`SELECT id, name, file_path FROM functions`);
    const functions = stmt.all();
    
    for (const func of functions) {
      const key = `${func.name}|${func.file_path}`;
      this.functionMap.set(key, func.id);
      this.reverseFunctionMap.set(func.id, func.name);
    }
  }

  /**
   * Build call graph by analyzing function bodies
   */
  async buildCallGraph(projectRoot: string, sourceDirectories: string[]): Promise<void> {
    console.log('Building call graph...');
    
    // Clear existing call edges
    this.db.exec(`DELETE FROM call_edges`);
    
    // Scan all TypeScript files and extract function calls
    for (const sourceDir of sourceDirectories) {
      const dirPath = path.join(projectRoot, sourceDir);
      if (fs.existsSync(dirPath)) {
        await this.analyzeDirectory(dirPath, projectRoot);
      }
    }
    
    console.log('Call graph built successfully!');
  }

  private async analyzeDirectory(dirPath: string, projectRoot: string): Promise<void> {
    const files = this.getAllTypeScriptFiles(dirPath);
    
    for (const filePath of files) {
      await this.analyzeFile(filePath, projectRoot);
    }
  }

  private getAllTypeScriptFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    function scanDirectory(currentPath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    }
    
    scanDirectory(dirPath);
    return files;
  }

  private async analyzeFile(filePath: string, projectRoot: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(projectRoot, filePath);
    const lines = content.split('\n');
    
    // Extract function calls from each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const calls = this.extractFunctionCalls(line);
      
      for (const call of calls) {
        await this.recordFunctionCall(call, relativePath, i + 1);
      }
    }
  }

  private extractFunctionCalls(line: string): string[] {
    const calls: string[] = [];
    
    // Remove strings and comments to avoid false positives
    const cleanLine = this.removeStringsAndComments(line);
    
    // Common function call patterns
    const patterns = [
      // Direct function calls: functionName()
      /(\w+)\s*\(/g,
      // Method calls: object.functionName()
      /(\w+)\.(\w+)\s*\(/g,
      // Static method calls: ClassName.methodName()
      /([A-Z]\w*)\.(\w+)\s*\(/g,
      // Constructor calls: new ClassName()
      /new\s+([A-Z]\w*)\s*\(/g,
      // Chain calls: .functionName()
      /\.(\w+)\s*\(/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(cleanLine)) !== null) {
        // Get the function name (last match group)
        const functionName = match[match.length - 1];
        
        // Skip common JavaScript/TypeScript built-ins
        if (!this.isBuiltinFunction(functionName)) {
          calls.push(functionName);
        }
      }
    }
    
    return [...new Set(calls)]; // Remove duplicates
  }

  private removeStringsAndComments(line: string): string {
    // Remove string literals
    let result = line.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '');
    
    // Remove single-line comments
    result = result.replace(/\/\/.*$/, '');
    
    // Remove multi-line comments (basic)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return result;
  }

  private isBuiltinFunction(name: string): boolean {
    const builtins = new Set([
      'console', 'log', 'error', 'warn', 'info', 'debug',
      'Math', 'Date', 'Array', 'Object', 'String', 'Number',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite',
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'Promise', 'resolve', 'reject', 'all', 'race',
      'JSON', 'parse', 'stringify',
      'require', 'import', 'export',
      'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'finally', 'throw', 'new', 'this', 'super'
    ]);
    
    return builtins.has(name);
  }

  private async recordFunctionCall(callName: string, filePath: string, lineNumber: number): Promise<void> {
    // Find the calling function (the function that contains this line)
    const caller = this.findCallingFunction(filePath, lineNumber);
    if (!caller) return;
    
    // Find the called function
    const calleeId = this.findFunctionByName(callName, filePath);
    if (!calleeId) return;
    
    // Record the call edge
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO call_edges (caller_id, callee_id, file_path, line_number)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(caller.id, calleeId, filePath, lineNumber);
  }

  private findCallingFunction(filePath: string, lineNumber: number): any {
    // Find the function that contains the given line number
    const stmt = this.db.prepare(`
      SELECT * FROM functions 
      WHERE file_path = ? AND line_number <= ?
      ORDER BY line_number DESC
      LIMIT 1
    `);
    
    return stmt.get(filePath, lineNumber);
  }

  private findFunctionByName(name: string, filePath: string): number | null {
    // Try exact match in the same file first
    const sameFileKey = `${name}|${filePath}`;
    if (this.functionMap.has(sameFileKey)) {
      return this.functionMap.get(sameFileKey)!;
    }
    
    // Try exact match in any file
    for (const [key, id] of this.functionMap.entries()) {
      if (key.startsWith(`${name}|`)) {
        return id;
      }
    }
    
    // Try partial match (for methods)
    for (const [key, id] of this.functionMap.entries()) {
      const [funcName] = key.split('|');
      if (funcName.includes(name) || name.includes(funcName)) {
        return id;
      }
    }
    
    return null;
  }

  // ─── Call Graph Analysis Methods ─────────────────────────────────────────────

  /**
   * Get comprehensive call graph analysis
   */
  analyzeCallGraph(): CallGraphAnalysis {
    const nodes = this.buildGraphNodes();
    const edges = this.buildGraphEdges();
    const circularDependencies = this.detectCircularDependencies(nodes);
    const hotspots = this.findCallHotspots(edges);
    
    return {
      nodes,
      edges,
      total_functions: nodes.length,
      total_calls: edges.length,
      max_depth: this.calculateMaxDepth(nodes),
      circular_dependencies: circularDependencies,
      hotspots
    };
  }

  private buildGraphNodes(): CallGraphNode[] {
    const stmt = this.db.prepare(`
      SELECT f.id, f.name, f.file_path, f.line_number, f.tier,
             COUNT(ce.caller_id) as caller_count,
             COUNT(ce2.callee_id) as callee_count
      FROM functions f
      LEFT JOIN call_edges ce ON f.id = ce.callee_id
      LEFT JOIN call_edges ce2 ON f.id = ce2.caller_id
      GROUP BY f.id
    `);
    
    const functions = stmt.all();
    
    return functions.map((func: any) => ({
      id: func.id,
      name: func.name,
      file_path: func.file_path,
      line_number: func.line_number,
      tier: func.tier,
      callers: [],
      callees: [],
      depth: 0,
      is_leaf: func.callee_count === 0,
      is_root: func.caller_count === 0
    }));
  }

  private buildGraphEdges(): CallEdge[] {
    const stmt = this.db.prepare(`
      SELECT ce.caller_id, ce.callee_id, f1.name as caller_name, f2.name as callee_name,
             ce.file_path, ce.line_number
      FROM call_edges ce
      JOIN functions f1 ON ce.caller_id = f1.id
      JOIN functions f2 ON ce.callee_id = f2.id
    `);
    
    const edges = stmt.all();
    
    return edges.map((edge: any) => ({
      caller_id: edge.caller_id,
      callee_id: edge.callee_id,
      caller_name: edge.caller_name,
      callee_name: edge.callee_name,
      file_path: edge.file_path,
      line_number: edge.line_number,
      call_type: 'direct' as const
    }));
  }

  private detectCircularDependencies(nodes: CallGraphNode[]): string[][] {
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    const cycles: string[][] = [];
    
    const self = this;
    function dfs(nodeId: number, path: number[]): void {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).map(id => self.reverseFunctionMap.get(id) || 'unknown');
        cycles.push(cycle);
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        for (const edge of node.callees) {
          dfs(edge.callee_id, [...path, nodeId]);
        }
      }
      
      recursionStack.delete(nodeId);
    }
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }
    
    return cycles;
  }

  private findCallHotspots(edges: CallEdge[]): Array<{function: string; call_count: number; file_path: string}> {
    const callCounts = new Map<string, {count: number; file_path: string}>();
    
    for (const edge of edges) {
      const key = edge.callee_name;
      const existing = callCounts.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        callCounts.set(key, {count: 1, file_path: edge.file_path});
      }
    }
    
    return Array.from(callCounts.entries())
      .map(([name, data]) => ({function: name, call_count: data.count, file_path: data.file_path}))
      .sort((a, b) => b.call_count - a.call_count)
      .slice(0, 10);
  }

  private calculateMaxDepth(nodes: CallGraphNode[]): number {
    let maxDepth = 0;
    
    function calculateDepth(nodeId: number, depth: number): void {
      maxDepth = Math.max(maxDepth, depth);
      
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        for (const edge of node.callees) {
          calculateDepth(edge.callee_id, depth + 1);
        }
      }
    }
    
    // Start from root nodes (functions with no callers)
    for (const node of nodes.filter(n => n.is_root)) {
      calculateDepth(node.id, 0);
    }
    
    return maxDepth;
  }

  /**
   * Get impact analysis for a function change
   */
  getImpactAnalysis(functionName: string, filePath?: string, maxDepth: number = 5): {
    affected_functions: Array<{name: string; file_path: string; depth: number}>;
    total_affected: number;
    risk_level: 'low' | 'medium' | 'high';
  } {
    const functionId = this.findFunctionByName(functionName, filePath || '');
    if (!functionId) {
      return { affected_functions: [], total_affected: 0, risk_level: 'low' };
    }
    
    const affected = this.bfsTraversal(functionId, maxDepth, 'up');
    
    // Calculate risk level based on number of affected functions
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (affected.length > 50) riskLevel = 'high';
    else if (affected.length > 10) riskLevel = 'medium';
    
    return {
      affected_functions: affected.map(func => ({
        name: this.reverseFunctionMap.get(func.id) || 'unknown',
        file_path: func.file_path,
        depth: func.depth
      })),
      total_affected: affected.length,
      risk_level: riskLevel
    };
  }

  private bfsTraversal(startId: number, maxDepth: number, direction: 'up' | 'down'): any[] {
    const visited = new Set<number>();
    const queue: Array<{id: number; depth: number; file_path: string}> = [{id: startId, depth: 0, file_path: ''}];
    const result: any[] = [];
    
    while (queue.length > 0) {
      const {id, depth, file_path} = queue.shift()!;
      
      if (depth >= maxDepth || visited.has(id)) continue;
      
      visited.add(id);
      
      if (depth > 0) {
        result.push({id, depth, file_path});
      }
      
      // Get neighbors based on direction
      const stmt = direction === 'up' 
        ? this.db.prepare(`SELECT ce.caller_id as id, f.file_path FROM call_edges ce JOIN functions f ON ce.caller_id = f.id WHERE ce.callee_id = ?`)
        : this.db.prepare(`SELECT ce.callee_id as id, f.file_path FROM call_edges ce JOIN functions f ON ce.callee_id = f.id WHERE ce.caller_id = ?`);
      
      const neighbors = stmt.all(id);
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          queue.push({id: neighbor.id, depth: depth + 1, file_path: neighbor.file_path});
        }
      }
    }
    
    return result;
  }

  close(): void {
    this.db.close();
  }
}
