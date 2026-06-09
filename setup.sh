#!/usr/bin/env bash
set -euo pipefail

# ─── Cascade Guardian Local Setup Script ───────────────────────────────────────
#
# Quick setup for local development with devin/cascade
# This script handles installation, configuration, and initial indexing
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[info]${NC}  $1"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $1"; }
error() { echo -e "${RED}[error]${NC} $1"; }

# ─── Installation Check ────────────────────────────────────────────────────────

echo "🚀 Cascade Guardian Local Setup"
echo "================================"

# Check prerequisites
if ! command -v node &> /dev/null; then
  error "Node.js is required but not installed"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  error "npm is required but not installed"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
  warn "Node.js version $NODE_VERSION detected. Version $REQUIRED_VERSION or higher recommended."
fi

ok "Prerequisites check passed"

# ─── Project Setup ───────────────────────────────────────────────────────────

# Install dependencies
info "Installing dependencies..."
npm install
ok "Dependencies installed"

# Build project
info "Building project..."
npm run build
ok "Project built successfully"

# Run tests
info "Running tests..."
npm test
if [ $? -eq 0 ]; then
  ok "All tests passed"
else
  warn "Some tests failed, but setup continues"
fi

# ─── Configuration Setup ───────────────────────────────────────────────────────

# Create guardian home directory
GUARDIAN_HOME="${GUARDIAN_HOME:-$HOME/.cascade-guardian}"
if [ ! -d "$GUARDIAN_HOME" ]; then
  mkdir -p "$GUARDIAN_HOME"
  ok "Created guardian home directory: $GUARDIAN_HOME"
else
  ok "Guardian home directory exists: $GUARDIAN_HOME"
fi

# Create default configuration
CONFIG_FILE="$GUARDIAN_HOME/default-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" << 'EOF'
{
  "sourceDirectories": ["src", "lib"],
  "docsDirectories": ["docs"],
  "excludeDirectories": ["node_modules", "dist", "build", "coverage"],
  "fileExtensions": [".ts", ".tsx", ".js"],
  "jsdoc": {
    "requiredTags": ["what", "how", "why", "sideeffects", "systemlayer", "domain", "tags"],
    "minTags": 5,
    "minCommentLength": 10
  }
}
EOF
  ok "Created default configuration: $CONFIG_FILE"
fi

# ─── Example Project Setup ─────────────────────────────────────────────────────

info "Setting up example project..."
cd example-project

# Build example project index
node ../dist/index.js build-index .
ok "Example project indexed"

# Test search functionality
SEARCH_RESULT=$(node ../dist/index.js search . "user" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d':' -f2)
if [ "$SEARCH_RESULT" -gt 0 ]; then
  ok "Example project search working (${SEARCH_RESULT} results found)"
else
  warn "Example project search returned no results"
fi

cd ..

# ─── Performance Optimization Setup ─────────────────────────────────────────────

info "Setting up performance optimizations..."

# Create performance test script
cat > test-performance.js << 'EOF'
import { getEmbeddingCache } from './dist/performance/embedding-cache.js';
import { getDatabaseOptimizer } from './dist/performance/database-optimizer.js';

async function performanceTest() {
  console.log('Testing performance optimizations...');
  
  const cache = getEmbeddingCache(50);
  await cache.preload(['user authentication', 'password hashing']);
  
  const stats = cache.getStats();
  console.log(`Cache stats: ${stats.hits} hits, ${stats.misses} misses`);
  
  cache.destroy();
  console.log('✅ Performance test completed');
}

performanceTest().catch(console.error);
EOF

node test-performance.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  ok "Performance optimizations working"
else
  warn "Performance test failed, but setup continues"
fi

rm -f test-performance.js

# ─── Development Tools Setup ───────────────────────────────────────────────────

# Create development scripts
cat > dev-index.sh << 'EOF'
#!/bin/bash
PROJECT_PATH="${1:-.}"
echo "Building index for: $PROJECT_PATH"
node dist/index.js build-index "$PROJECT_PATH"
EOF

cat > dev-search.sh << 'EOF'
#!/bin/bash
PROJECT_PATH="${1:-.}"
QUERY="${2:-test}"
echo "Searching '$QUERY' in: $PROJECT_PATH"
node dist/index.js search "$PROJECT_PATH" "$QUERY"
EOF

cat > dev-analyze.sh << 'EOF'
#!/bin/bash
PROJECT_PATH="${1:-.}"
FUNCTION="${2:-test}"
echo "Analyzing function '$FUNCTION' in: $PROJECT_PATH"
echo "Callers:"
node dist/index.js get-callers "$PROJECT_PATH" "$FUNCTION"
echo ""
echo "Dependencies:"
node dist/index.js get-callees "$PROJECT_PATH" "$FUNCTION"
echo ""
echo "Impact:"
node dist/index.js get-impact "$PROJECT_PATH" "$FUNCTION"
EOF

cat > dev-audit.sh << 'EOF'
#!/bin/bash
PROJECT_PATH="${1:-.}"
echo "Auditing project: $PROJECT_PATH"
node -e "
import { initializeCascadeSkills } from './dist/devin-integration/skills.js';
const skills = initializeCascadeSkills('$PROJECT_PATH');
skills.auditCodebase().then(console.log);
"
EOF

chmod +x dev-*.sh
ok "Created development scripts"

# ─── Health Check ───────────────────────────────────────────────────────────────

info "Running health check..."

# Create health check script
cat > health-check.js << 'EOF'
import { resolveConfig } from './dist/config.js';
import { openDatabase } from './dist/database/db.js';
import { getEmbeddingCache } from './dist/performance/embedding-cache.js';

async function healthCheck(projectPath = '.') {
  try {
    const config = resolveConfig(projectPath);
    const db = openDatabase(config.databasePath);
    const cache = getEmbeddingCache(50);
    
    const functionCount = db.prepare('SELECT COUNT(*) as count FROM functions').get().count;
    const indexedCount = db.prepare('SELECT COUNT(*) as count FROM functions WHERE embedding IS NOT NULL').get().count;
    
    console.log(`✅ Health Check for ${config.projectName}:`);
    console.log(`   Total functions: ${functionCount}`);
    console.log(`   Indexed functions: ${indexedCount}`);
    console.log(`   Index coverage: ${(indexedCount / functionCount * 100).toFixed(1)}%`);
    console.log(`   Cache status: Ready`);
    
    db.close();
    cache.destroy();
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
EOF

node health-check.js
if [ $? -eq 0 ]; then
  ok "Health check passed"
else
  warn "Health check failed - run 'node health-check.js' for details"
fi

# ─── Usage Instructions ───────────────────────────────────────────────────────

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📚 Documentation:"
echo "   - Local Development Guide: LOCAL_DEVELOPMENT_GUIDE.md"
echo "   - devin/cascade Integration: DEVIN_INTEGRATION.md"
echo "   - README.md"
echo ""
echo "🛠️  Development Scripts:"
echo "   ./dev-index.sh [path]     - Build index for project"
echo "   ./dev-search.sh [path] [query] - Search codebase"
echo "   ./dev-analyze.sh [path] [function] - Analyze function"
echo "   ./dev-audit.sh [path]      - Audit code quality"
echo ""
echo "🔍 Quick Commands:"
echo "   node health-check.js              - Run health check"
echo "   npm test                          - Run test suite"
echo "   npm run build                     - Build project"
echo ""
echo "📊 Example Usage:"
echo "   ./dev-index.sh ./my-project"
echo "   ./dev-search.sh ./my-project 'user auth'"
echo "   ./dev-analyze.sh ./my-project 'validateInput'"
echo ""
echo "🚀 Ready to use Cascade Guardian with devin/cascade!"
