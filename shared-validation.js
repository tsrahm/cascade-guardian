import fs from 'fs';
import path from 'path';

// Basic DRY detection - check for exact function duplicates
export function checkDryViolations(content, currentFilePath) {
  const violations = [];
  const projectPath = '/Users/toryrahm/Documents/Repos/harmony';
  
  // Extract functions from current file - use single comprehensive regex to avoid duplicates
  const functionMatches = content.match(/function\s+(\w+)\s*\([^)]*\)\s*:\s*\w+\s*\{[\s\S]*?^}/gm) || [];
  const arrowFunctionMatches = content.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>[^{]*\{[\s\S]*?^}|[^=]*=>)/gm) || [];
  
  const allFunctions = [...functionMatches, ...arrowFunctionMatches];
  
  for (const func of allFunctions) {
    const funcName = func.match(/function\s+(\w+)/)?.[1] || func.match(/(?:const|let|var)\s+(\w+)\s*=/)?.[1];
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
                severity: 'error',
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

export function getAllTypeScriptFiles(dir, exclude = ['node_modules', 'dist', 'build', 'coverage']) {
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

export function validateFileContent(filePath, content) {
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
        severity: 'warning',
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
        severity: 'warning',
        message: 'Arrow function missing JSDoc documentation',
        line_number: lineNum,
        suggestion: 'Add JSDoc comment above the function'
      });
    }
    
    // Check naming conventions (simple) - exempt React components
    // Look for React component patterns in the function and surrounding lines
    const isReactComponent = filePath.endsWith('.tsx') && (
      line.includes('ReactNode') || 
      line.includes('JSX.Element') || 
      line.includes('return (<') ||
      line.includes('return (<' ) ||
      // Check if function returns JSX by looking at the next few lines
      lines.slice(index, index + 5).some(nextLine => 
        nextLine.includes('return (<') || 
        nextLine.includes('return (<') ||
        nextLine.includes('<') && nextLine.includes('>')
      )
    );

    // Check function declarations with PascalCase (but exempt React components)
    const funcMatch = line.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
    if (funcMatch && !isReactComponent) {
      violations.push({
        rule: 'naming_conventions',
        severity: 'warning',
        message: 'Function should use camelCase',
        line_number: lineNum,
        suggestion: 'Rename function to use camelCase'
      });
    }
    
    // Check arrow functions with PascalCase (but exempt React components)
    const arrowMatch = line.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(/);
    if (arrowMatch && !isReactComponent) {
      violations.push({
        rule: 'naming_conventions',
        severity: 'warning',
        message: 'Function should use camelCase',
        line_number: lineNum,
        suggestion: 'Rename function to use camelCase'
      });
    }
  });
  
  return violations;
}
