#!/usr/bin/env node

/**
 * Real-time cascade hook monitor
 * Monitors file changes during cascade sessions and validates edits
 */

import fs from 'fs';
import path from 'path';
import { validateFileContent, checkDryViolations, getAllTypeScriptFiles } from './shared-validation.js';

class CascadeHookMonitor {
  constructor(projectPath = '/Users/toryrahm/Documents/Repos/harmony') {
    this.projectPath = projectPath;
    this.watchedFiles = new Map();
    this.isMonitoring = false;
    this.validationCount = 0;
  }

  /**
   * Start monitoring file changes during cascade session
   */
  startMonitoring() {
    console.log('🔍 Starting cascade hook monitor...');
    console.log(`📁 Project: ${this.projectPath}`);
    console.log('📝 Monitoring for file changes during cascade sessions');
    console.log('');

    this.isMonitoring = true;
    this.scanProjectFiles();
    this.startFileWatcher();
    
    console.log('✅ Monitor ready!');
    console.log('💡 During your cascade session, edits will be validated automatically');
    console.log('🎯 Try creating/editing a file in Harmony to see validation in action');
    console.log('');
  }

  /**
   * Scan existing files to establish baseline
   */
  scanProjectFiles() {
    const scanDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;
      
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      files.forEach(file => {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory() && !file.name.startsWith('.') && 
            !['node_modules', 'dist', 'build', 'coverage'].includes(file.name)) {
          scanDir(fullPath);
        } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            this.watchedFiles.set(fullPath, {
              lastModified: fs.statSync(fullPath).mtime,
              content: content
            });
          } catch (error) {
            // Skip files that can't be read
          }
        }
      });
    };

    scanDir(path.join(this.projectPath, 'app'));
    console.log(`📊 Baseline: Found ${this.watchedFiles.size} TypeScript files`);
  }

  /**
   * Start watching for file changes
   */
  startFileWatcher() {
    const checkInterval = 1000; // Check every second
    let lastCheck = Date.now();

    const monitor = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(monitor);
        return;
      }

      const now = Date.now();
      if (now - lastCheck < checkInterval) return;
      lastCheck = now;

      this.checkForChanges();
    }, 500);

    console.log('👀 File watcher active - monitoring for cascade edits...');
  }

  /**
   * Check for file changes and validate them
   */
  checkForChanges() {
    for (const [filePath, fileData] of this.watchedFiles) {
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.mtime > fileData.lastModified) {
          // File was modified - validate the change
          this.validateFileChange(filePath, fileData.content, stats.mtime);
          
          // Update stored data
          const newContent = fs.readFileSync(filePath, 'utf-8');
          this.watchedFiles.set(filePath, {
            lastModified: stats.mtime,
            content: newContent
          });
        }
      } catch (error) {
        // File might have been deleted or is inaccessible
        this.watchedFiles.delete(filePath);
      }
    }

    // Check for new files
    this.scanForNewFiles();
  }

  /**
   * Validate a file change
   */
  validateFileChange(filePath, oldContent, modificationTime) {
    this.validationCount++;
    const startTime = Date.now();
    
    try {
      const newContent = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.projectPath, filePath);
      
      console.log(`\n🔍 Cascade Edit Detected: ${relativePath}`);
      console.log(`⏰ Time: ${new Date(modificationTime).toLocaleTimeString()}`);
      
      // Create edit context for validation
      const context = {
        file_path: filePath,
        old_string: oldContent,
        new_string: newContent,
        entire_content: newContent
      };

      // Validate the edit using improved validation
      const rawViolations = validateFileContent(filePath, newContent);

      // Dedupe identical violations (workaround for shared-validation double-emit)
      const seen = new Set();
      const violations = rawViolations.filter(v => {
        const key = `${v.rule}|${v.line_number}|${v.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Group violations by severity for better organization
      const errorViolations = violations.filter(v => v.severity === 'error');
      const warningViolations = violations.filter(v => v.severity === 'warning');
      const infoViolations = violations.filter(v => v.severity === 'info');
      
      // Create result object
      const result = {
        allowed: errorViolations.length === 0, // Block on error severity violations
        reason: errorViolations.length > 0 ? `Edit BLOCKED: ${errorViolations.length} critical violations` : violations.length > 0 ? `Edit allowed with ${violations.length} suggestions` : 'Edit approved - no issues detected',
        suggestions: violations.map(v => `${v.message} (Line ${v.line_number}): ${v.suggestion}`),
        violations: violations
      };
      
      const processingTime = Date.now() - startTime;
      console.log(`⏱️  Processing time: ${processingTime}ms`);
      
      if (!result.allowed) {
        console.log(`❌ Edit BLOCKED: ${result.reason}`);
        
        if (errorViolations.length > 0) {
          console.log(`\n🚨 Critical Issues (${errorViolations.length}):`);
          errorViolations.forEach(v => {
            console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
            if (v.suggestion) {
              console.log(`      💡 Fix: ${v.suggestion}`);
            }
          });
        }
        
        if (warningViolations.length > 0) {
          console.log(`\n⚠️  Additional Warnings (${warningViolations.length}):`);
          warningViolations.forEach(v => {
            console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
            if (v.suggestion) {
              console.log(`      💡 Fix: ${v.suggestion}`);
            }
          });
        }
        
        if (infoViolations.length > 0) {
          console.log(`\n💡 Suggestions (${infoViolations.length}):`);
          infoViolations.forEach(v => {
            console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
            if (v.suggestion) {
              console.log(`      💡 Fix: ${v.suggestion}`);
            }
          });
        }
      } else {
        console.log(`✅ Edit Approved`);
        
        if (warningViolations.length > 0) {
          console.log(`\n⚠️  Warnings (${warningViolations.length}):`);
          warningViolations.forEach(v => {
            console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
            if (v.suggestion) {
              console.log(`      💡 Fix: ${v.suggestion}`);
            }
          });
        }
        
        if (infoViolations.length > 0) {
          console.log(`\n💡 Suggestions (${infoViolations.length}):`);
          infoViolations.forEach(v => {
            console.log(`   ${v.rule} (Line ${v.line_number}): ${v.message}`);
            if (v.suggestion) {
              console.log(`      💡 Fix: ${v.suggestion}`);
            }
          });
        } else if (warningViolations.length === 0 && infoViolations.length === 0) {
          console.log(`🎉 Perfect! No issues detected`);
        }
      }
      
      console.log('─'.repeat(80));
      
    } catch (error) {
      console.log(`💥 Validation error: ${error.message}`);
    }
  }

  /**
   * Scan for new files that might have been created
   */
  scanForNewFiles() {
    const scanDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;
      
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      files.forEach(file => {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory() && !file.name.startsWith('.') && 
            !['node_modules', 'dist', 'build', 'coverage'].includes(file.name)) {
          scanDir(fullPath);
        } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
          if (!this.watchedFiles.has(fullPath)) {
            // New file detected
            console.log(`\n🆕 New File Created: ${path.relative(this.projectPath, fullPath)}`);
            
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const rawViolations = validateFileContent(fullPath, content);

              // Dedupe identical violations (workaround for shared-validation double-emit)
              const seen = new Set();
              const violations = rawViolations.filter(v => {
                const key = `${v.rule}|${v.line_number}|${v.message}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              const errorViolations = violations.filter(v => v.rule === 'dry_violation');
              const advisoryViolations = violations.filter(v => v.rule !== 'dry_violation');
              const result = {
                allowed: errorViolations.length === 0, // Block on DRY violations
                reason: errorViolations.length > 0 ? `New file BLOCKED: ${errorViolations.length} critical violations` : violations.length > 0 ? `New file has ${violations.length} issues` : 'New file approved',
                suggestions: violations.map(v => `${v.message} (Line ${v.line_number}): ${v.suggestion}`),
                violations: violations
              };
              
              if (!result.allowed) {
                console.log(`❌ ${result.reason}`);
                errorViolations.forEach(v => {
                  console.log(`   - ${v.rule} (Line ${v.line_number}): ${v.message}`);
                });
                if (advisoryViolations.length > 0) {
                  console.log(`💡 ${advisoryViolations.length} additional suggestions:`);
                  advisoryViolations.forEach(v => {
                    console.log(`   - ${v.message} (Line ${v.line_number}): ${v.suggestion}`);
                  });
                }
              } else {
                console.log(`✅ New file approved`);

                if (result.suggestions && result.suggestions.length > 0) {
                  console.log(`💡 ${result.suggestions.length} suggestions for improvement:`);
                  result.suggestions.forEach(s => console.log(`   - ${s}`));
                } else {
                  console.log(`🎉 Perfect! No issues detected`);
                }
              }

              this.watchedFiles.set(fullPath, {
                lastModified: fs.statSync(fullPath).mtime,
                content: content
              });
              
            } catch (error) {
              console.log(`💥 Error validating new file: ${error.message}`);
            }
          }
        }
      });
    };

    scanDir(path.join(this.projectPath, 'app'));
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    console.log(`\n🛑 Cascade hook monitor stopped`);
    console.log(`📊 Total validations performed: ${this.validationCount}`);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      watchedFiles: this.watchedFiles.size,
      validationCount: this.validationCount,
      isMonitoring: this.isMonitoring
    };
  }
}

// CLI interface
if (process.argv[2] === 'start') {
  const monitor = new CascadeHookMonitor();
  
  monitor.startMonitoring();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    monitor.stopMonitoring();
    process.exit(0);
  });
}

export { CascadeHookMonitor };
