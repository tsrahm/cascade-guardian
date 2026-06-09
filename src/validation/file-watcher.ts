/**
 * Real-time file watcher for immediate validation feedback
 * Monitors file changes and triggers validation hooks
 */

import fs from 'fs';
import path from 'path';
import { RealTimeValidator } from './real-time-validator.js';
import { resolveConfig } from '../config.js';

// ─── File Watcher Types ───────────────────────────────────────────────────────

interface FileChangeEvent {
  type: 'create' | 'modify' | 'delete';
  path: string;
  timestamp: number;
  content?: string;
}

interface ValidationHook {
  onValidationComplete?: (result: any) => void;
  onViolation?: (violation: any) => void;
  onError?: (error: Error) => void;
}

interface WatcherConfig {
  debounceMs: number;
  ignorePatterns: string[];
  includePatterns: string[];
  enableRealTime: boolean;
  maxFileSize: number;
}

// ─── Real-time File Watcher Implementation ───────────────────────────────────────

export class RealTimeFileWatcher {
  private validator: RealTimeValidator;
  private config: any;
  private watcherConfig: WatcherConfig;
  private hooks: ValidationHook[] = [];
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isWatching = false;
  private stats = {
    files_watched: 0,
    validations_run: 0,
    violations_found: 0,
    errors_encountered: 0
  };

  constructor(projectPath: string, watcherConfig: Partial<WatcherConfig> = {}) {
    this.config = resolveConfig(projectPath);
    this.validator = new RealTimeValidator(projectPath);
    
    this.watcherConfig = {
      debounceMs: 300,
      ignorePatterns: ['node_modules', 'dist', 'build', '.git', 'coverage'],
      includePatterns: this.config.fileExtensions,
      enableRealTime: true,
      maxFileSize: 1024 * 1024, // 1MB
      ...watcherConfig
    };
  }

  /**
   * Start watching files for real-time validation
   */
  startWatching(): void {
    if (this.isWatching) {
      console.log('File watcher already running');
      return;
    }

    console.log('Starting real-time file watcher...');
    
    // Watch each source directory
    for (const sourceDir of this.config.sourceDirectories) {
      const dirPath = path.join(this.config.projectRoot, sourceDir);
      
      if (fs.existsSync(dirPath)) {
        this.watchDirectory(dirPath);
      }
    }

    this.isWatching = true;
    console.log(`Watching ${this.stats.files_watched} files for real-time validation`);
  }

  /**
   * Stop watching files
   */
  stopWatching(): void {
    if (!this.isWatching) return;

    console.log('Stopping file watcher...');
    
    // Clear all watchers
    for (const [path, watcher] of this.watchers.entries()) {
      watcher.close();
    }
    
    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    
    this.watchers.clear();
    this.debounceTimers.clear();
    this.isWatching = false;
    
    console.log('File watcher stopped');
  }

  /**
   * Add validation hook
   */
  addHook(hook: ValidationHook): void {
    this.hooks.push(hook);
  }

  /**
   * Remove validation hook
   */
  removeHook(hook: ValidationHook): void {
    const index = this.hooks.indexOf(hook);
    if (index > -1) {
      this.hooks.splice(index, 1);
    }
  }

  /**
   * Watch a directory recursively
   */
  private watchDirectory(dirPath: string): void {
    const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      const fullPath = path.join(dirPath, filename);
      this.handleFileChange(eventType, fullPath);
    });

    this.watchers.set(dirPath, watcher);
    
    // Count existing files
    this.stats.files_watched += this.countFiles(dirPath);
  }

  /**
   * Handle file change events
   */
  private handleFileChange(eventType: string, filePath: string): void {
    // Check if file should be processed
    if (!this.shouldProcessFile(filePath)) {
      return;
    }

    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.processFileChange(eventType, filePath);
      this.debounceTimers.delete(filePath);
    }, this.watcherConfig.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Process a file change
   */
  private async processFileChange(eventType: string, filePath: string): Promise<void> {
    try {
      let content: string | undefined;
      let changeType: 'create' | 'modify' | 'delete';

      if (eventType === 'rename') {
        if (fs.existsSync(filePath)) {
          // File created or modified
          content = await this.readFileContent(filePath);
          changeType = 'modify';
        } else {
          // File deleted
          changeType = 'delete';
        }
      } else {
        // File modified
        content = await this.readFileContent(filePath);
        changeType = 'modify';
      }

      const event: FileChangeEvent = {
        type: changeType,
        path: filePath,
        timestamp: Date.now(),
        content
      };

      await this.validateFile(event);
      
    } catch (error) {
      this.stats.errors_encountered++;
      console.error(`Error processing file ${filePath}:`, error);
      
      // Notify error hooks
      this.hooks.forEach(hook => {
        if (hook.onError) {
          hook.onError(error instanceof Error ? error : new Error('Unknown error'));
        }
      });
    }
  }

  /**
   * Validate file change
   */
  private async validateFile(event: FileChangeEvent): Promise<void> {
    if (event.type === 'delete' || !event.content) {
      return; // Skip validation for deleted files
    }

    try {
      const result = await this.validator.validateFileChange(
        event.path,
        event.content,
        event.type
      );

      this.stats.validations_run++;
      this.stats.violations_found += result.violations.length;

      // Notify completion hooks
      this.hooks.forEach(hook => {
        if (hook.onValidationComplete) {
          hook.onValidationComplete({
            file_path: event.path,
            result,
            timestamp: event.timestamp
          });
        }
      });

      // Notify violation hooks
      result.violations.forEach(violation => {
        this.hooks.forEach(hook => {
          if (hook.onViolation) {
            hook.onViolation({
              file_path: event.path,
              violation,
              timestamp: event.timestamp
            });
          }
        });
      });

      // Log violations to console
      if (result.violations.length > 0) {
        console.log(`\n🔍 Validation Results for ${event.path}:`);
        result.violations.forEach((violation, index) => {
          const icon = violation.severity === 'error' ? '❌' : 
                      violation.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${violation.message}`);
          if (violation.suggested_fix) {
            console.log(`     💡 ${violation.suggested_fix}`);
          }
        });
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Processing time: ${result.processing_time}ms`);
      }

    } catch (error) {
      this.stats.errors_encountered++;
      console.error(`Validation error for ${event.path}:`, error);
    }
  }

  /**
   * Check if file should be processed
   */
  private shouldProcessFile(filePath: string): boolean {
    const relativePath = path.relative(this.config.projectRoot, filePath);
    
    // Check ignore patterns
    for (const pattern of this.watcherConfig.ignorePatterns) {
      if (relativePath.includes(pattern)) {
        return false;
      }
    }

    // Check include patterns
    const hasIncludePattern = this.watcherConfig.includePatterns.some(pattern => 
      relativePath.endsWith(pattern)
    );
    
    if (!hasIncludePattern) {
      return false;
    }

    // Check file size
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.watcherConfig.maxFileSize) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Read file content safely
   */
  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Count files in directory
   */
  private countFiles(dirPath: string): number {
    let count = 0;
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.watcherConfig.ignorePatterns.includes(entry.name)) {
            count += this.countFiles(fullPath);
          }
        } else if (entry.isFile()) {
          if (this.shouldProcessFile(fullPath)) {
            count++;
          }
        }
      }
    } catch (error) {
      console.warn(`Error counting files in ${dirPath}:`, error);
    }
    
    return count;
  }

  /**
   * Get watcher statistics
   */
  getStats(): any {
    return {
      ...this.stats,
      is_watching: this.isWatching,
      active_watchers: this.watchers.size,
      debounce_timers: this.debounceTimers.size,
      validator_stats: this.validator.getStats()
    };
  }

  /**
   * Validate all files in project
   */
  async validateProject(): Promise<any> {
    console.log('Validating entire project...');
    
    const results = {
      files_processed: 0,
      total_violations: 0,
      file_results: [] as any[]
    };

    for (const sourceDir of this.config.sourceDirectories) {
      const dirPath = path.join(this.config.projectRoot, sourceDir);
      
      if (fs.existsSync(dirPath)) {
        const files = this.getAllFiles(dirPath);
        
        for (const filePath of files) {
          try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const result = await this.validator.validateFileChange(filePath, content, 'modify');
            
            results.files_processed++;
            results.total_violations += result.violations.length;
            results.file_results.push({
              file_path: filePath,
              violations: result.violations.length,
              confidence: result.confidence
            });
            
            if (result.violations.length > 0) {
              console.log(`📁 ${filePath}: ${result.violations.length} violations`);
            }
            
          } catch (error) {
            console.error(`Error validating ${filePath}:`, error);
          }
        }
      }
    }

    console.log(`\n📊 Project Validation Summary:`);
    console.log(`   Files processed: ${results.files_processed}`);
    console.log(`   Total violations: ${results.total_violations}`);
    console.log(`   Average confidence: ${(results.file_results.reduce((sum: number, r: any) => sum + r.confidence, 0) / results.file_results.length * 100).toFixed(1)}%`);
    
    return results;
  }

  /**
   * Get all files in directory
   */
  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.watcherConfig.ignorePatterns.includes(entry.name)) {
            files.push(...this.getAllFiles(fullPath));
          }
        } else if (entry.isFile()) {
          if (this.shouldProcessFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Error getting files in ${dirPath}:`, error);
    }
    
    return files;
  }

  /**
   * Configure watcher settings
   */
  configure(config: Partial<WatcherConfig>): void {
    this.watcherConfig = { ...this.watcherConfig, ...config };
    
    // Restart watcher if already running
    if (this.isWatching) {
      this.stopWatching();
      this.startWatching();
    }
  }

  /**
   * Export validation results to file
   */
  async exportResults(filePath: string): Promise<void> {
    const stats = this.getStats();
    const report = {
      timestamp: new Date().toISOString(),
      project: this.config.projectName,
      stats,
      configuration: this.watcherConfig
    };
    
    await fs.promises.writeFile(filePath, JSON.stringify(report, null, 2));
    console.log(`Validation report exported to ${filePath}`);
  }

  /**
   * Close and cleanup
   */
  close(): void {
    this.stopWatching();
    this.validator.close();
  }
}
