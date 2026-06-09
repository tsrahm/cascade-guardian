#!/usr/bin/env node

/**
 * Enhanced minimal real-time validation watcher for Harmony repository
 * Completely bypasses search functionality to avoid all FTS5 issues
 * Includes high-priority features from broken advanced watchers
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const PROJECT_PATH = args[0] || '/Users/toryrahm/Documents/Repos/harmony';
const DEBOUNCE_TIME = parseInt(args[1]) || 300;

console.log('🔍 Starting enhanced minimal real-time validation for:', PROJECT_PATH);
console.log(`⚙️  Debounce time: ${DEBOUNCE_TIME}ms`);
console.log('Press Ctrl+C to stop watching');
console.log('');

// Simple file watcher using Node.js fs.watch
const watchedFiles = new Set();
const debounceTime = DEBOUNCE_TIME;
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
    // Fixed regex - removed unmatched closing parenthesis
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
            const otherContent = fs.readFileSync(file, 'utf-8');
            const otherFunctions = otherContent.match(/function\s+(\w+)\s*\([^)]*\)\s*:\s*\w+[^{]*\{[\s\S]*?^}/gm) || [];
            const otherArrowFunctions = otherContent.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>[^{]*\{[\s\S]*?^}|[^=]*=>)/gm) || [];
            
            for (const otherFunc of [...otherFunctions, ...otherArrowFunctions]) {
              const otherFuncName = otherFunc.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/)?.[1] || otherFunc.match(/(?:const|let|var)\s+(\w+)\s*=)/)?.[1];
              if (otherFuncName === funcName) {
                violations.push({
                  rule: 'dry_violation',
                  type: 'DRY_VIOLATION',
                  severity: 'error',
                  message: `Duplicate function '${funcName}' found in ${path.relative(projectPath, file)}`,
                  line_number: func.line_number,
                  file_path: currentFilePath,
                  suggested_fix: `Rename or remove duplicate function '${funcName}'`
                });
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Continue even if directory doesn't exist
    }
  }
  
  return violations;
}

// Basic JSDoc validation
function checkJSDocCompleteness(content, filePath) {
  const violations = [];
  const lines = content.split('\n');
  
  // Check for functions without JSDoc
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Function declarations
    const funcMatch = line.match(/(?:export\s+)?function\s+(\w+)/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const prevLines = lines.slice(0, index).reverse();
      const hasJSDoc = prevLines.some(l => l.trim().startsWith('/**'));
      
      if (!hasJSDoc) {
        violations.push({
          rule: 'jsdoc_completeness',
          type: 'MISSING_JSDOC',
          severity: 'warning',
          message: `Function '${funcName}' missing JSDoc documentation`,
          line_number: lineNumber,
          file_path: filePath,
          suggested_fix: `Add JSDoc comment above the function`
        });
      }
    }
    
    // Arrow functions
    const arrowMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>)/);
    if (arrowMatch) {
      const funcName = arrowMatch[1];
      const prevLines = lines.slice(0, index).reverse();
      const hasJSDoc = prevLines.some(l => l.trim().startsWith('/**'));
      
      if (!hasJSDoc) {
        violations.push({
          rule: 'jsdoc_completeness',
          type: 'MISSING_JSDOC',
          severity: 'warning',
          message: `Arrow function '${funcName}' missing JSDoc documentation`,
          line_number: lineNumber,
          file_path: filePath,
          suggested_fix: `Add JSDoc comment above the function`
        });
      }
    }
  });
  
  return violations;
}

// Basic naming conventions
function checkNamingConventions(content, filePath) {
  const violations = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for PascalCase functions (but exempt React components)
    const isReactComponent = filePath.endsWith('.tsx') && 
      (line.includes('ReactNode') || line.includes('JSX.Element') || 
       line.includes('return (<') || line.includes('return (<'));

    // Function declarations with PascalCase
    const funcMatch = line.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
    if (funcMatch && !isReactComponent) {
      violations.push({
        rule: 'naming_conventions',
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        message: `Function should use camelCase`,
        line_number: lineNumber,
        file_path: filePath,
        suggested_fix: `Rename function to use camelCase`
      });
    }
    
    // Arrow functions with PascalCase
    const arrowMatch = line.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(/);
    if (arrowMatch && !isReactComponent) {
      violations.push({
        rule: 'naming_conventions',
        type: 'NAMING_CONVENTION',
        severity: 'warning',
        message: `Function should use camelCase`,
        line_number: lineNumber,
        file_path: filePath,
        suggested_fix: `Rename function to use camelCase`
      });
    }
  });
  
  return violations;
}

// Main validation function
function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const violations = [
      ...checkDryViolations(content, filePath),
      ...checkJSDocCompleteness(content, filePath),
      ...checkNamingConventions(content, filePath)
    ];
    
    return violations;
  } catch (error) {
    console.log(`💥 Error reading file: ${error.message}`);
    return [];
  }
}

// Helper function to get all TypeScript files
function getAllTypeScriptFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && 
          !['node_modules', 'dist', 'build', 'coverage'].includes(item)) {
        traverse(fullPath);
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Watch directory for changes
function watchDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && 
        !['node_modules', 'dist', 'build', 'coverage'].includes(item)) {
      watchDirectory(fullPath);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
      watchedFiles.add(fullPath);
      
      fs.watchFile(fullPath, { interval: 100 }, () => {
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          const startTime = Date.now();
          console.log(`\n📁 File changed: ${path.relative(PROJECT_PATH, fullPath)}`);
          
          const violations = validateFile(fullPath);
          const processingTime = Date.now() - startTime;
          
          console.log(`⏱️  Processing time: ${processingTime}ms`);
          
          if (violations.length === 0) {
            console.log(`✅ Perfect! No issues found`);
          } else {
            // Group violations by type for better organization
            const errorViolations = violations.filter(v => v.severity === 'error');
            const warningViolations = violations.filter(v => v.severity === 'warning');
            const infoViolations = violations.filter(v => v.severity === 'info');
            
            console.log(`❌ ${violations.length} issues found:`);
            
            if (errorViolations.length > 0) {
              console.log(`\n🚨 Critical Issues (${errorViolations.length}):`);
              errorViolations.forEach(v => {
                console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
                if (v.suggested_fix) {
                  console.log(`      💡 Fix: ${v.suggested_fix}`);
                }
              });
            }
            
            if (warningViolations.length > 0) {
              console.log(`\n⚠️  Warnings (${warningViolations.length}):`);
              warningViolations.forEach(v => {
                console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
                if (v.suggested_fix) {
                  console.log(`      💡 Fix: ${v.suggested_fix}`);
                }
              });
            }
            
            if (infoViolations.length > 0) {
              console.log(`\n💡 Suggestions (${infoViolations.length}):`);
              infoViolations.forEach(v => {
                console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
                if (v.suggested_fix) {
                  console.log(`      💡 Fix: ${v.suggested_fix}`);
                }
              });
            }
          }
          
          console.log('─'.repeat(60));
        }, debounceTime);
      });
    }
  }
}

// Start watching
console.log(`👀 Watching ${watchedFiles.size} files for real-time validation`);
console.log(`📊 Will show detailed violations and suggestions`);

watchDirectory(PROJECT_PATH);

console.log('👀 Enhanced validation active - watching for changes...');

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  process.exit(0);
});
