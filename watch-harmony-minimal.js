#!/usr/bin/env node

/**
 * Minimal real-time validation watcher for Harmony repository
 * Completely bypasses search functionality to avoid all FTS5 issues
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_PATH = process.argv[2] || '/Users/toryrahm/Documents/Repos/harmony';

console.log('🔍 Starting minimal real-time validation for:', PROJECT_PATH);
console.log('Press Ctrl+C to stop watching');
console.log('');

// Simple file watcher using Node.js fs.watch
const watchedFiles = new Set();
const debounceTime = 300;
let timeoutId = null;

// Basic DRY detection - check for exact function duplicates
function checkDryViolations(content, currentFilePath) {
  const violations = [];
  const projectPath = '/Users/toryrahm/Documents/Repos/harmony';
  
  // Extract functions from current file
  const functionMatches = content.match(/function\s+(\w+)\s*\([^)]*\)\s*:\s*\w+[^{]*\{[\s\S]*?^}/gm) || [];
  const arrowFunctionMatches = content.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>[^{]*\{[\s\S]*?^}|[^=]*=>)/gm) || [];
  
  const allFunctions = [...functionMatches, ...arrowFunctionMatches];
  
  for (const func of allFunctions) {
    const funcName = func.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/)?.[1] || func.match(/(?:const|let|var)\s+(\w+)\s*=)/)?.[1];
    if (!funcName) continue;
    
    // Get function body (simplified)
    const funcBody = func.replace(/.*?\{/, '').replace(/\}$/, '').trim();
    
    // Check for exact duplicates in other files (basic check)
    try {
      const appDir = path.join(projectPath, 'app');
      if (fs.existsSync(appDir)) {
        const files = getAllTypeScriptFiles(appDir);
        
        for (const file of files) {
          if (file === currentFilePath) continue;
          
          try {
            const fileContent = fs.readFileSync(file, 'utf-8');
            
            // Simple exact match check
            if (fileContent.includes(funcBody) && funcBody.length > 20) {
              violations.push({
                rule: 'dry_violation',
                message: `Duplicate function '${funcName}' found in ${path.relative(projectPath, file)}`,
                line_number: content.split('\n').findIndex(line => line.includes(funcName)) + 1,
                suggestion: 'Extract to shared utility or remove duplicate'
              });
              break;
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Skip if directory doesn't exist
    }
  }
  
  return violations;
}

function getAllTypeScriptFiles(dir, exclude = ['node_modules', 'dist', 'build', 'coverage']) {
  const files = [];
  
  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory() && !exclude.includes(item.name)) {
        scan(fullPath);
      } else if (item.isFile() && /\.(ts|tsx|js|jsx)$/.test(item.name)) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const violations = [];
    
    // Basic DRY detection - check for exact function duplicates
    const dryViolations = checkDryViolations(content, filePath);
    violations.push(...dryViolations);
    
    // Basic validation rules
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for missing JSDoc on functions
      if (line.match(/(export\s+)?(async\s+)?function\s+\w+/) && 
          !lines.slice(0, index).reverse().find(l => l.trim().startsWith('/**'))) {
        violations.push({
          rule: 'jsdoc_completeness',
          message: 'Function missing JSDoc documentation',
          line_number: lineNum,
          suggestion: 'Add JSDoc comment above the function'
        });
      }
      
      // Check for arrow functions without documentation
      if (line.match(/export\s+(const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/) &&
          !lines.slice(0, index).reverse().find(l => l.trim().startsWith('/**'))) {
        violations.push({
          rule: 'jsdoc_completeness',
          message: 'Arrow function missing JSDoc documentation',
          line_number: lineNum,
          suggestion: 'Add JSDoc comment above the function'
        });
      }
      
      // Check naming conventions (simple) - exempt React components
      const isReactComponent = filePath.endsWith('.tsx') && 
        (line.includes('ReactNode') || line.includes('JSX.Element') || 
         line.match(/function\s+([A-Z][a-zA-Z0-9]*)/)?.[1] === line.match(/function\s+([A-Z][a-zA-Z0-9]*)/)?.[1]);
      
      if (line.match(/function\s+([A-Z][a-zA-Z0-9]*)/) && !isReactComponent) {
        violations.push({
          rule: 'naming_conventions',
          message: 'Function should use camelCase',
          line_number: lineNum,
          suggestion: 'Rename function to use camelCase'
        });
      }
      
      // Check arrow functions with PascalCase (but exempt React components)
      if (line.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(/) && !isReactComponent) {
        violations.push({
          rule: 'naming_conventions',
          message: 'Function should use camelCase',
          line_number: lineNum,
          suggestion: 'Rename function to use camelCase'
        });
      }
    });
    
    return violations;
  } catch (error) {
    return [{
      rule: 'file_error',
      message: `Error reading file: ${error.message}`,
      line_number: 1,
      suggestion: 'Check file permissions and encoding'
    }];
  }
}

function watchDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && 
        !['node_modules', 'dist', 'build', 'coverage'].includes(file.name)) {
      watchDirectory(fullPath);
    } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
      watchedFiles.add(fullPath);
      
      fs.watchFile(fullPath, { interval: 100 }, () => {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          console.log(`\n📁 File changed: ${path.relative(PROJECT_PATH, fullPath)}`);
          
          const violations = validateFile(fullPath);
          
          if (violations.length === 0) {
            console.log(`✅ No issues found`);
          } else {
            console.log(`⚠️  ${violations.length} issues found:`);
            violations.forEach(v => {
              console.log(`   ❌ ${v.rule} (Line ${v.line_number}): ${v.message}`);
              if (v.suggestion) {
                console.log(`      💡 ${v.suggestion}`);
              }
            });
          }
          
          console.log('─'.repeat(60));
        }, debounceTime);
      });
    }
  });
}

// Start watching
console.log('👀 Scanning files to watch...');
watchDirectory(path.join(PROJECT_PATH, 'app'));

console.log(`📊 Watching ${watchedFiles.size} TypeScript/JavaScript files`);
console.log('🔧 Minimal validation active (JSDoc + naming + DRY detection)');
console.log('');

console.log('Ready! Edit and save any .ts/.tsx/.js/.jsx file to see validation results.');
