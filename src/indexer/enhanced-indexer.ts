/**
 * Enhanced code indexer with better function extraction and JSDoc parsing
 */

import fs from 'fs';
import path from 'path';
import { resolveConfig, ensureDirectories, registerProject } from '../config.js';
import { openDatabase, clearAllData, setMetadata } from '../database/db.js';
import { generateEmbedding, batchGenerateEmbeddings } from '../embeddings/embeddings.js';

// ─── Enhanced Function Types ───────────────────────────────────────────────────

interface ExtractedFunction {
  name: string;
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
  function_type: 'function' | 'arrow' | 'method' | 'export';
  signature?: string;
}

interface ExtractedType {
  name: string;
  file_path: string;
  line_number: number;
  tier: number;
  what?: string;
  domain?: string;
  tags?: string;
  type_kind: 'interface' | 'type' | 'enum' | 'class';
}

// ─── Enhanced Index Building ─────────────────────────────────────────────────────

export async function buildEnhancedIndex(projectPath?: string): Promise<void> {
  const config = resolveConfig(projectPath);
  ensureDirectories(config);
  registerProject(config);
  
  console.log(`Building enhanced index for project: ${config.projectName}`);
  
  const db = openDatabase(config.databasePath);
  
  try {
    // Clear existing data
    clearAllData(db);
    
    // Scan all TypeScript files
    const allFiles: string[] = [];
    
    for (const sourceDir of config.sourceDirectories) {
      const dirPath = path.join(config.projectRoot, sourceDir);
      if (fs.existsSync(dirPath)) {
        const files = getAllTypeScriptFiles(dirPath, config.excludeDirectories, config.fileExtensions);
        allFiles.push(...files);
      }
    }
    
    console.log(`Found ${allFiles.length} TypeScript files`);
    
    // Extract functions and types from all files
    const extractedFunctions: ExtractedFunction[] = [];
    const extractedTypes: ExtractedType[] = [];
    
    for (const filePath of allFiles) {
      console.log(`Processing: ${path.relative(config.projectRoot, filePath)}`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const functions = await extractFunctionsFromContent(content, filePath, config);
        const types = await extractTypesFromContent(content, filePath, config);
        
        extractedFunctions.push(...functions);
        extractedTypes.push(...types);
      } catch (error) {
        console.warn(`Error processing ${filePath}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    console.log(`Extracted ${extractedFunctions.length} functions and ${extractedTypes.length} types`);
    
    // Generate embeddings for functions with descriptions
    const textsToEmbed = extractedFunctions
      .filter(func => func.what || func.how || func.why)
      .map(func => `${func.name} ${func.what || ''} ${func.how || ''} ${func.why || ''} ${func.inline_comments || ''}`)
      .filter(text => text.trim().length > 10);
    
    console.log(`Generating embeddings for ${textsToEmbed.length} functions...`);
    const embeddings = await batchGenerateEmbeddings(textsToEmbed);
    
    // Insert into database
    await insertEnhancedFunctions(db, extractedFunctions, embeddings, config);
    await insertEnhancedTypes(db, extractedTypes, config);
    
    // Update metadata
    setMetadata(db, 'last_updated', new Date().toISOString());
    setMetadata(db, 'total_functions', extractedFunctions.length.toString());
    setMetadata(db, 'total_types', extractedTypes.length.toString());
    
    console.log('Enhanced index built successfully!');
    
  } finally {
    db.close();
  }
}

// ─── Advanced Function Extraction ─────────────────────────────────────────────

async function extractFunctionsFromContent(content: string, filePath: string, config: any): Promise<ExtractedFunction[]> {
  const functions: ExtractedFunction[] = [];
  const lines = content.split('\n');
  const relativePath = path.relative(config.projectRoot, filePath);
  
  // Enhanced regex patterns for different function types
  const patterns = [
    // Export function declarations
    {
      regex: /export\s+(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*[:\s]*[\w\[\]|<>,\s]*\s*\{/g,
      type: 'export' as const,
      extract: extractFunctionFromMatch
    },
    // Export arrow functions
    {
      regex: /export\s+(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*[:\s]*[\w\[\]|<>,\s]*\s*=>/g,
      type: 'export' as const,
      extract: extractArrowFunctionFromMatch
    },
    // Regular function declarations
    {
      regex: /(?:^|\s)(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*[:\s]*[\w\[\]|<>,\s]*\s*\{/gm,
      type: 'function' as const,
      extract: extractFunctionFromMatch
    },
    // Class methods
    {
      regex: /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:\s]*[\w\[\]|<>,\s]*\s*\{/g,
      type: 'method' as const,
      extract: extractMethodFromMatch
    }
  ];
  
  // Apply each pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      try {
        const func = pattern.extract(match, lines, relativePath);
        if (func) {
          functions.push(func);
        }
      } catch (error) {
        console.warn(`Error extracting function:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
  
  return functions;
}

function extractFunctionFromMatch(match: RegExpMatchArray, lines: string[], filePath: string): ExtractedFunction | null {
  const functionName = match[2] || match[1];
  const position = match.index || 0;
  const lineNumber = lines.join('\n').substring(0, position).split('\n').length;
  
  // Extract JSDoc comment before the function
  const jsDocInfo = extractJSDocInfo(lines, lineNumber - 1);
  
  // Extract function signature
  const signature = extractFunctionSignature(lines, lineNumber);
  
  return {
    name: functionName,
    file_path: filePath,
    line_number: lineNumber,
    tier: jsDocInfo.isComplete ? 1 : 2,
    what: jsDocInfo.what,
    how: jsDocInfo.how,
    why: jsDocInfo.why,
    params: jsDocInfo.params,
    returns: jsDocInfo.returns,
    sideeffects: jsDocInfo.sideeffects || 'None',
    systemlayer: jsDocInfo.systemlayer,
    domain: jsDocInfo.domain,
    tags: jsDocInfo.tags,
    inline_comments: extractInlineComments(lines, lineNumber),
    function_type: 'function',
    signature
  };
}

function extractArrowFunctionFromMatch(match: RegExpMatchArray, lines: string[], filePath: string): ExtractedFunction | null {
  const functionName = match[1];
  const position = match.index || 0;
  const lineNumber = lines.join('\n').substring(0, position).split('\n').length;
  
  // Extract JSDoc comment before the arrow function
  const jsDocInfo = extractJSDocInfo(lines, lineNumber - 1);
  
  // Extract function signature
  const signature = extractArrowFunctionSignature(lines, lineNumber);
  
  return {
    name: functionName,
    file_path: filePath,
    line_number: lineNumber,
    tier: jsDocInfo.isComplete ? 1 : 2,
    what: jsDocInfo.what,
    how: jsDocInfo.how,
    why: jsDocInfo.why,
    params: jsDocInfo.params,
    returns: jsDocInfo.returns,
    sideeffects: jsDocInfo.sideeffects || 'None',
    systemlayer: jsDocInfo.systemlayer,
    domain: jsDocInfo.domain,
    tags: jsDocInfo.tags,
    inline_comments: extractInlineComments(lines, lineNumber),
    function_type: 'arrow',
    signature
  };
}

function extractMethodFromMatch(match: RegExpMatchArray, lines: string[], filePath: string): ExtractedFunction | null {
  const methodName = match[1];
  const position = match.index || 0;
  const lineNumber = lines.join('\n').substring(0, position).split('\n').length;
  
  // Extract JSDoc comment before the method
  const jsDocInfo = extractJSDocInfo(lines, lineNumber - 1);
  
  return {
    name: methodName,
    file_path: filePath,
    line_number: lineNumber,
    tier: jsDocInfo.isComplete ? 1 : 2,
    what: jsDocInfo.what,
    how: jsDocInfo.how,
    why: jsDocInfo.why,
    params: jsDocInfo.params,
    returns: jsDocInfo.returns,
    sideeffects: jsDocInfo.sideeffects || 'None',
    systemlayer: jsDocInfo.systemlayer,
    domain: jsDocInfo.domain,
    tags: jsDocInfo.tags,
    inline_comments: extractInlineComments(lines, lineNumber),
    function_type: 'method'
  };
}

// ─── Enhanced JSDoc Extraction ─────────────────────────────────────────────────

function extractJSDocInfo(lines: string[], startLine: number): any {
  const jsDocInfo: any = {
    what: undefined,
    how: undefined,
    why: undefined,
    params: undefined,
    returns: undefined,
    sideeffects: undefined,
    systemlayer: undefined,
    domain: undefined,
    tags: undefined,
    isComplete: false
  };
  
  // Look backwards for JSDoc comment
  let jsDocText = '';
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
    } else if (line.startsWith('*') || line.startsWith('*/')) {
      continue;
    } else if (line.length > 0) {
      // Non-comment line found, stop looking
      break;
    }
  }
  
  if (jsDocText) {
    // Extract tags using regex
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
        const params: string[] = [];
        let match;
        while ((match = pattern.exec(jsDocText)) !== null) {
          params.push(`${match[1]}: ${match[2]}`);
        }
        jsDocInfo.params = params.join(', ');
      } else {
        const match = jsDocText.match(pattern);
        if (match) {
          jsDocInfo[tag] = match[1].trim();
        }
      }
    }
    
    // Check completeness
    jsDocInfo.isComplete = !!(
      jsDocInfo.what && jsDocInfo.how && jsDocInfo.why && 
      jsDocInfo.domain && jsDocInfo.tags && jsDocInfo.sideeffects && 
      jsDocInfo.systemlayer
    );
  }
  
  return jsDocInfo;
}

function extractFunctionSignature(lines: string[], lineNumber: number): string {
  // Extract the function signature from the lines
  for (let i = lineNumber - 1; i < Math.min(lineNumber + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.includes('function') || line.includes('=>')) {
      // Find the complete signature (might span multiple lines)
      let signature = line;
      let j = i + 1;
      while (j < lines.length && !signature.includes('{')) {
        signature += ' ' + lines[j].trim();
        j++;
      }
      return signature.split('{')[0].trim();
    }
  }
  return '';
}

function extractArrowFunctionSignature(lines: string[], lineNumber: number): string {
  // Similar to function signature but for arrow functions
  for (let i = lineNumber - 1; i < Math.min(lineNumber + 3, lines.length); i++) {
    const line = lines[i].trim();
    if (line.includes('=') && line.includes('=>')) {
      return line.split('=>')[0].trim();
    }
  }
  return '';
}

function extractInlineComments(lines: string[], lineNumber: number): string {
  const comments: string[] = [];
  
  // Look for inline comments in the function body
  let inFunctionBody = false;
  let braceCount = 0;
  
  for (let i = lineNumber; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('{')) {
      inFunctionBody = true;
      braceCount += (line.match(/{/g) || []).length;
    }
    
    if (inFunctionBody) {
      braceCount -= (line.match(/}/g) || []).length;
      
      // Extract inline comments
      const commentMatch = line.match(/\/\/\s*(.+)/);
      if (commentMatch && !commentMatch[1].startsWith('@')) {
        comments.push(commentMatch[1].trim());
      }
      
      if (braceCount <= 0) {
        break;
      }
    }
  }
  
  return comments.join('\n');
}

// ─── Type Extraction ─────────────────────────────────────────────────────────

async function extractTypesFromContent(content: string, filePath: string, config: any): Promise<ExtractedType[]> {
  const types: ExtractedType[] = [];
  const lines = content.split('\n');
  const relativePath = path.relative(config.projectRoot, filePath);
  
  // Interface extraction
  const interfaceMatches = content.matchAll(/export\s+(?:abstract\s+)?interface\s+(\w+)/g);
  for (const match of interfaceMatches) {
    const position = match.index || 0;
    const lineNumber = content.substring(0, position).split('\n').length;
    const jsDocInfo = extractJSDocInfo(lines, lineNumber - 1);
    
    types.push({
      name: match[1],
      file_path: relativePath,
      line_number: lineNumber,
      tier: jsDocInfo.what ? 1 : 2,
      what: jsDocInfo.what,
      domain: jsDocInfo.domain,
      tags: jsDocInfo.tags,
      type_kind: 'interface'
    });
  }
  
  // Type alias extraction
  const typeMatches = content.matchAll(/export\s+type\s+(\w+)\s*=/g);
  for (const match of typeMatches) {
    const position = match.index || 0;
    const lineNumber = content.substring(0, position).split('\n').length;
    const jsDocInfo = extractJSDocInfo(lines, lineNumber - 1);
    
    types.push({
      name: match[1],
      file_path: relativePath,
      line_number: lineNumber,
      tier: jsDocInfo.what ? 1 : 2,
      what: jsDocInfo.what,
      domain: jsDocInfo.domain,
      tags: jsDocInfo.tags,
      type_kind: 'type'
    });
  }
  
  // Enum extraction
  const enumMatches = content.matchAll(/export\s+enum\s+(\w+)/g);
  for (const match of enumMatches) {
    const position = match.index || 0;
    const lineNumber = content.substring(0, position).split('\n').length;
    const jsDocInfo = extractJSDocInfo(lines, lineNumber - 1);
    
    types.push({
      name: match[1],
      file_path: relativePath,
      line_number: lineNumber,
      tier: jsDocInfo.what ? 1 : 2,
      what: jsDocInfo.what,
      domain: jsDocInfo.domain,
      tags: jsDocInfo.tags,
      type_kind: 'enum'
    });
  }
  
  return types;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getAllTypeScriptFiles(dirPath: string, excludeDirs: string[], extensions: string[]): string[] {
  const files: string[] = [];
  
  function scanDirectory(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        if (excludeDirs.includes(entry.name)) continue;
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(dirPath);
  return files;
}

// ─── Database Operations ─────────────────────────────────────────────────────

async function insertEnhancedFunctions(db: any, functions: ExtractedFunction[], embeddings: Float32Array[], config: any): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO functions (
      name, file_path, line_number, tier, what, how, why, params, returns,
      sideeffects, systemlayer, domain, tags, inline_comments, embedding
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    let embeddingIndex = 0;
    for (const func of functions) {
      let embedding = null;
      
      // Add embedding if function has enough description
      if (func.what || func.how || func.why) {
        const text = `${func.name} ${func.what || ''} ${func.how || ''} ${func.why || ''}`;
        if (text.trim().length > 10 && embeddingIndex < embeddings.length) {
          embedding = Buffer.from(embeddings[embeddingIndex].buffer);
          embeddingIndex++;
        }
      }
      
      stmt.run(
        func.name,
        func.file_path,
        func.line_number,
        func.tier,
        func.what,
        func.how,
        func.why,
        func.params,
        func.returns,
        func.sideeffects,
        func.systemlayer,
        func.domain,
        func.tags,
        func.inline_comments,
        embedding
      );
    }
  });
  
  transaction();
}

async function insertEnhancedTypes(db: any, types: ExtractedType[], config: any): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO functions (
      name, file_path, line_number, tier, what, domain, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    for (const type of types) {
      stmt.run(
        type.name,
        type.file_path,
        type.line_number,
        type.tier,
        type.what,
        type.domain,
        type.tags
      );
    }
  });
  
  transaction();
}
