#!/usr/bin/env node

/**
 * Real-time validation watcher for Harmony repository
 */

import { RealTimeFileWatcher } from './dist/validation/file-watcher.js';

const PROJECT_PATH = process.argv[2] || '/Users/toryrahm/Documents/Repos/harmony';

console.log('🔍 Starting advanced real-time validation for:', PROJECT_PATH);
console.log('Press Ctrl+C to stop watching');
console.log('');

const watcher = new RealTimeFileWatcher(PROJECT_PATH, {
  debounceMs: 300,
  enableRealTime: true
});

// Advanced validation with detailed reporting
watcher.addHook({
  onValidationComplete: (result) => {
    const violations = result.violations || [];
    const suggestions = result.suggestions || [];
    
    console.log(`\n📁 File: ${result.filePath}`);
    console.log(`⏱️  Processing time: ${result.processingTime}ms`);
    
    if (violations.length === 0 && suggestions.length === 0) {
      console.log(`✅ Perfect! No issues found`);
    } else {
      if (violations.length > 0) {
        console.log(`\n❌ ${violations.length} Violations:`);
        violations.forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.rule} (Line ${v.line_number}): ${v.message}`);
          if (v.suggestion) {
            console.log(`      💡 Suggestion: ${v.suggestion}`);
          }
        });
      }
      
      if (suggestions.length > 0) {
        console.log(`\n💡 ${suggestions.length} Suggestions:`);
        suggestions.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.type}: ${s.message}`);
        });
      }
    }
    console.log('─'.repeat(60));
  },
  
  onViolation: (result) => {
    console.log(`\n🚨 Immediate Alert:`);
    console.log(`   Rule: ${result.violation.rule}`);
    console.log(`   File: ${result.filePath}:${result.violation.line_number}`);
    console.log(`   Issue: ${result.violation.message}`);
    if (result.violation.suggestion) {
      console.log(`   Fix: ${result.violation.suggestion}`);
    }
  },
  
  onError: (error) => {
    console.log(`\n💥 Validation Error:`);
    console.log(`   ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
    }
  }
});

// Start watching
watcher.startWatching();
console.log('👀 Advanced validation active - watching for changes...');
console.log('📊 Will show detailed violations and suggestions');
