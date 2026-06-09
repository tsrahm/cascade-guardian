#!/usr/bin/env node

/**
 * Basic real-time validation watcher for Harmony repository
 * Uses simple validation without advanced search to avoid FTS5 issues
 */

import { RealTimeFileWatcher } from './dist/validation/file-watcher.js';

const PROJECT_PATH = process.argv[2] || '/Users/toryrahm/Documents/Repos/harmony';

console.log('🔍 Starting basic real-time validation for:', PROJECT_PATH);
console.log('Press Ctrl+C to stop watching');
console.log('');

const watcher = new RealTimeFileWatcher(PROJECT_PATH, {
  debounceMs: 300,
  enableRealTime: true
});

// Basic validation without advanced search features
watcher.addHook({
  onValidationComplete: (result) => {
    const violations = result.violations || [];
    
    if (violations.length === 0) {
      console.log(`✅ ${result.filePath} - No issues found`);
    } else {
      console.log(`⚠️  ${result.filePath} - ${violations.length} issues found`);
      violations.forEach(v => {
        console.log(`   ❌ ${v.rule}: ${v.message}`);
        if (v.suggestion) {
          console.log(`      💡 ${v.suggestion}`);
        }
      });
    }
  },
  
  onViolation: (result) => {
    console.log(`🚨 ${result.violation.rule}: ${result.violation.message}`);
    console.log(`   File: ${result.filePath}:${result.violation.line_number}`);
    if (result.violation.suggestion) {
      console.log(`   Fix: ${result.violation.suggestion}`);
    }
  },
  
  onError: (error) => {
    console.log(`💥 Error: ${error.message}`);
    // Don't show stack traces for basic validation
  }
});

// Start watching
watcher.startWatching();
console.log('👀 Basic validation active - watching for changes...');
console.log('📊 Will show simple violations without semantic search');
