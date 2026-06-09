#!/usr/bin/env node

/**
 * Pre-edit validation hook for devin/cascade
 * Validates code changes before allowing edits to proceed
 * Uses minimal validation approach to avoid FTS5 issues
 */

import fs from 'fs';
import path from 'path';

function validateFileContent(filePath, content) {
  const violations = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for missing JSDoc on functions
    if (line.match(/(export\s+)?(async\s+)?function\s+\w+/) && 
        !lines.slice(0, index).reverse().find(l => l.trim().startsWith('/**'))) {
      violations.push({
        type: 'MISSING_JSDOC',
        severity: 'warning',
        message: 'Function missing JSDoc documentation',
        line_number: lineNum,
        suggested_fix: 'Add JSDoc comment above the function'
      });
    }
    
    // Check for arrow functions without documentation
    if (line.match(/export\s+(const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/) &&
        !lines.slice(0, index).reverse().find(l => l.trim().startsWith('/**'))) {
      violations.push({
        type: 'MISSING_JSDOC',
        severity: 'warning',
        message: 'Arrow function missing JSDoc documentation',
        line_number: lineNum,
        suggested_fix: 'Add JSDoc comment above the function'
      });
    }
    
    // Check naming conventions (simple)
    if (line.match(/function\s+([A-Z][a-zA-Z0-9]*)/) ||
        line.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/)) {
      violations.push({
        type: 'PATTERN_INCONSISTENCY',
        severity: 'warning',
        message: 'Function should use camelCase',
        line_number: lineNum,
        suggested_fix: 'Rename function to use camelCase'
      });
    }
  });
  
  return violations;
}

function validateEdit(context) {
  const { file_path, old_string, new_string, entire_content } = context;
  
  // Skip validation for non-TypeScript files
  if (!/\.(ts|tsx|js|jsx)$/.test(file_path)) {
    return { allowed: true };
  }
  
  let violations = [];
  
  // If we have the entire content, validate it
  if (entire_content) {
    violations = validateFileContent(file_path, entire_content);
  } else if (new_string) {
    // Validate just the new content being added
    violations = validateFileContent(file_path, new_string);
  }
  
  // Check for error-level violations (none in our minimal setup)
  const errorViolations = violations.filter(v => v.severity === 'error');
  
  if (errorViolations.length > 0) {
    return {
      allowed: false,
      reason: `Critical violations found: ${errorViolations.map(v => v.message).join(', ')}`,
      violations: errorViolations
    };
  }
  
  // Allow edit but provide suggestions for warnings
  const warningViolations = violations.filter(v => v.severity === 'warning');
  
  if (warningViolations.length > 0) {
    return {
      allowed: true,
      reason: `Edit allowed with ${warningViolations.length} warnings`,
      suggestions: warningViolations.map(v => `${v.message} (Line ${v.line_number}): ${v.suggested_fix}`),
      violations: warningViolations
    };
  }
  
  return { allowed: true };
}

// CLI interface for testing
if (process.argv.length >= 4) {
  const filePath = process.argv[2];
  const action = process.argv[3];
  
  if (action === 'validate-edit') {
    const context = {
      file_path: filePath,
      entire_content: fs.readFileSync(filePath, 'utf-8')
    };
    
    const result = validateEdit(context);
    
    console.log('🔍 Pre-edit Validation Results:');
    console.log(`✅ Allowed: ${result.allowed}`);
    
    if (result.reason) {
      console.log(`📝 Reason: ${result.reason}`);
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`💡 Suggestions:`);
      result.suggestions.forEach(s => console.log(`   - ${s}`));
    }
    
    if (result.violations && result.violations.length > 0) {
      console.log(`⚠️  Violations:`);
      result.violations.forEach(v => {
        console.log(`   - ${v.type} (Line ${v.line_number}): ${v.message}`);
      });
    }
    
    process.exit(result.allowed ? 0 : 1);
  }
}

// Export for use as module
export { validateEdit };
