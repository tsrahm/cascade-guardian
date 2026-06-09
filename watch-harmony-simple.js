#!/usr/bin/env node

/**
 * Simple real-time validation watcher for Harmony repository
 */

import { RealTimeFileWatcher } from './dist/validation/file-watcher.js';

const PROJECT_PATH = process.argv[2] || '/Users/toryrahm/Documents/Repos/harmony';

console.log('🔍 Starting real-time validation for:', PROJECT_PATH);
console.log('Press Ctrl+C to stop watching');
console.log('');

const watcher = new RealTimeFileWatcher(PROJECT_PATH, {
  debounceMs: 300,
  enableRealTime: true
});

watcher.addHook({
  onValidationComplete: (result) => {
    const violations = result.violations || [];
    if (violations.length === 0) {
      console.log(`✅ ${result.filePath} - No issues found`);
    } else {
      console.log(`⚠️  ${result.filePath} - ${violations.length} issues found`);
      violations.forEach(v => {
        console.log(`   ❌ ${v.rule}: ${v.message}`);
      });
    }
  },
  
  onViolation: (result) => {
    console.log(`🚨 ${result.violation.rule}: ${result.violation.message}`);
    console.log(`   File: ${result.filePath}:${result.violation.line_number}`);
  },
  
  onError: (error) => {
    console.log(`💥 Error: ${error.message}`);
  }
});

watcher.startWatching();
console.log('👀 Watching for file changes...');
