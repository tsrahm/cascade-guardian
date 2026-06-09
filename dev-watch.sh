#!/bin/bash

PROJECT_PATH="${1:-/Users/toryrahm/Documents/Repos/harmony}"
echo "🔍 Starting real-time validation for: $PROJECT_PATH"
echo "Press Ctrl+C to stop watching"
echo ""

node -e "
import { RealTimeFileWatcher } from './dist/validation/file-watcher.js';
import { logger, LogCategory } from './dist/logging/logger.js';

const watcher = new RealTimeFileWatcher('$PROJECT_PATH', {
  debounceMs: 300,
  enableRealTime: true
});

// Add validation hooks
watcher.addHook({
  onValidationComplete: (result) => {
    const violations = result.violations || [];
    if (violations.length === 0) {
      console.log(\`✅ \${result.filePath} - No issues found\`);
    } else {
      console.log(\`⚠️  \${result.filePath} - \${violations.length} issues found\`);
      violations.forEach(v => {
        console.log(\`   ❌ \${v.rule}: \${v.message}\`);
      });
    }
  },
  
  onViolation: (result) => {
    console.log(\`🚨 \${result.violation.rule}: \${result.violation.message}\`);
    console.log(\`   File: \${result.filePath}:\${result.violation.line_number}\`);
  },
  
  onError: (error) => {
    console.log(\`💥 Error: \${error.message}\`);
  }
});

// Start watching
watcher.startWatching();
console.log('👀 Watching for file changes...');
"
