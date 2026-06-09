# Cascade Guardian - Local Development Guide

Complete guide for setting up, maintaining, and using Cascade Guardian for local development with devin/cascade.

## 🚀 Quick Start

### Prerequisites

- **Node.js >= 18** (for TypeScript compilation and Hugging Face transformers)
- **npm** (package manager)
- **Git** (for project root detection)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/cascade-guardian.git
cd cascade-guardian

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify installation
npm test
```

## 📁 Project Structure

```
cascade-guardian/
├── src/                          # Source code
│   ├── config.ts                 # Configuration system
│   ├── database/                 # Database layer
│   ├── embeddings/               # Vector embeddings
│   ├── indexer/                  # Code indexing
│   ├── search/                   # Search tools
│   ├── call-graph/               # Call graph analysis
│   ├── performance/              # Performance optimizations
│   └── devin-integration/        # devin/cascade integration
├── tests/                        # Test suite
├── example-project/              # Example TypeScript project
├── dist/                         # Compiled JavaScript
└── ~/.cascade-guardian/          # Runtime data (auto-created)
```

## ⚙️ Configuration

### Default Configuration

Cascade Guardian automatically detects project structure:

```javascript
{
  projectRoot: "auto-detected",
  sourceDirectories: ["src", "lib"],
  docsDirectories: ["docs"],
  excludeDirectories: ["node_modules", "dist", "build"],
  fileExtensions: [".ts", ".tsx"],
  databasePath: "~/.cascade-guardian/indexes/{project-hash}/code-quality.db",
  jsdoc: {
    requiredTags: ["what", "how", "why", "domain", "tags"],
    minTags: 3,
    minCommentLength: 5
  }
}
```

### Custom Configuration

Create `guardian.config.json` in your project root:

```json
{
  "sourceDirectories": ["src", "lib", "packages"],
  "excludeDirectories": ["node_modules", "dist", "build", "coverage"],
  "fileExtensions": [".ts", ".tsx", ".js"],
  "jsdoc": {
    "requiredTags": ["what", "how", "why", "sideeffects", "systemlayer", "domain", "tags"],
    "minTags": 5,
    "minCommentLength": 10
  }
}
```

### Environment Variables

```bash
export GUARDIAN_PROJECT_ROOT="/path/to/your/project"
export GUARDIAN_HOME="$HOME/.cascade-guardian"
export DEBUG="cascade-guardian:*"  # Enable debug logging
```

## 🔧 Daily Usage

### 1. Build Index for Your Project

```bash
# Build index for current directory
node dist/index.js build-index

# Build index for specific project
node dist/index.js build-index /path/to/your/project

# Use enhanced indexer (recommended)
node -e "
import { buildEnhancedIndex } from './dist/indexer/enhanced-indexer.js';
await buildEnhancedIndex('/path/to/project');
"
```

### 2. Search Your Codebase

```bash
# Basic search
node dist/index.js search /path/to/project "user authentication"

# Advanced search with filters
node -e "
import { AdvancedSemanticSearch } from './dist/search/advanced-semantic-search.js';
const search = new AdvancedSemanticSearch('/path/to/project/db');
const results = await search.search({
  query: 'password hashing',
  domain: 'security',
  limit: 10
});
console.log(results);
"
```

### 3. Analyze Function Impact

```bash
# Get function callers
node dist/index.js get-callers /path/to/project "formatCurrency"

# Get function dependencies
node dist/index.js get-callees /path/to/project "updateUserProfile"

# Analyze change impact
node dist/index.js get-impact /path/to/project "authenticateUser"
```

### 4. List Code Organization

```bash
# List business domains
node dist/index.js list-domains /path/to/project

# List tags with usage counts
node dist/index.js list-tags /path/to/project

# List architectural layers
node dist/index.js list-system-layers /path/to/project
```

## 🎯 devin/cascade Integration

### Tool Registration

```javascript
import { initializeCascadeTools } from './dist/devin-integration/tool-registry.js';

// Initialize tools
const tools = initializeCascadeTools('/path/to/project');

// Register with devin/cascade
const toolList = tools.getTools();
toolList.forEach(tool => {
  devinCascade.registerTool(tool.name, tool.description, tool.parameters);
});

// Execute tools
const results = await tools.executeTool('search_codebase', {
  query: 'user authentication',
  domain: 'auth',
  limit: 10
});
```

### Validation Hooks

```javascript
import { initializeValidationHooks } from './dist/devin-integration/validation-hooks.js';

// Initialize validation hooks
const hooks = initializeValidationHooks('/path/to/project');

// Register pre-edit hook
devinCascade.registerPreEditHook(async (editContext) => {
  const result = await hooks.validateEdit(editContext);
  
  if (!result.allowed) {
    throw new Error(`Code quality violation: ${result.reason}`);
  }
  
  if (result.suggestions?.length > 0) {
    console.log('Suggestions:', result.suggestions);
  }
  
  return editContext;
});
```

### Skills Integration

```javascript
import { initializeCascadeSkills } from './dist/devin-integration/skills.js';

// Initialize skills
const skills = initializeCascadeSkills('/path/to/project');

// Register audit skill
devinCascade.registerSkill('audit-codebase', async () => {
  return await skills.auditCodebase();
});

// Register review skill
devinCascade.registerSkill('review-suggestions', async () => {
  return await skills.reviewSuggestions();
});
```

## 📊 Performance Optimization

### Incremental Indexing

```javascript
import { IncrementalIndexer } from './dist/performance/incremental-indexer.js';

const indexer = new IncrementalIndexer('/path/to/project');

// Only process changed files
const stats = await indexer.updateIndex();
console.log(`Processed ${stats.new_files + stats.changed_files} files`);
```

### Embedding Cache

```javascript
import { getEmbeddingCache } from './dist/performance/embedding-cache.js';

const cache = getEmbeddingCache(100); // 100MB cache

// Preload frequently used embeddings
await cache.preload(['user authentication', 'password hashing', 'database connection']);

// Get cache statistics
const stats = cache.getStats();
console.log(`Cache hit rate: ${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(1)}%`);
```

### Database Optimization

```javascript
import { getDatabaseOptimizer } from './dist/performance/database-optimizer.js';

const optimizer = getDatabaseOptimizer('/path/to/project/database');

// Optimized search with caching
const results = optimizer.optimizedSearch('user authentication', {
  domain: 'auth',
  limit: 10
});

// Get optimization statistics
const stats = optimizer.getStats();
console.log(`Query time saved: ${stats.query_time_saved}ms`);
```

## 🧪 Testing

### Run Test Suite

```bash
# Run all tests
npm test

# Run specific test file
node tests/simple-test-suite.js

# Run performance tests
node test-performance-optimizations.js

# Run integration tests
node test-integration.js
```

### Test Individual Components

```javascript
// Test configuration
import { resolveConfig } from './dist/config.js';
const config = resolveConfig('/path/to/project');
console.log('Configuration:', config);

// Test database
import { openDatabase } from './dist/database/db.js';
const db = openDatabase('/path/to/database');
console.log('Database connected');

// Test search
import { AdvancedSemanticSearch } from './dist/search/advanced-semantic-search.js';
const search = new AdvancedSemanticSearch('/path/to/database');
const results = await search.search({ query: 'test' });
console.log('Search results:', results);
```

## 🔍 Debugging

### Enable Debug Logging

```bash
export DEBUG="cascade-guardian:*"
node dist/index.js build-index /path/to/project
```

### Common Issues

#### 1. Database Not Found
```bash
# Build index first
node dist/index.js build-index /path/to/project
```

#### 2. No Search Results
```bash
# Check if functions are indexed
sqlite3 ~/.cascade-guardian/indexes/*/code-quality.db "SELECT COUNT(*) FROM functions;"
```

#### 3. Performance Issues
```bash
# Check cache statistics
node -e "
import { getEmbeddingCache } from './dist/performance/embedding-cache.js';
console.log(getEmbeddingCache().getStats());
"
```

#### 4. Memory Issues
```bash
# Reduce cache size
export GUARDIAN_CACHE_SIZE=50  # 50MB instead of 100MB
```

## 📈 Monitoring

### Performance Metrics

```javascript
// Get comprehensive statistics
const stats = {
  database: optimizer.getStats(),
  cache: embeddingCache.getStats(),
  indexer: indexer.getStats()
};

console.log('Performance Metrics:', stats);
```

### Health Check

```javascript
async function healthCheck(projectPath: string) {
  const config = resolveConfig(projectPath);
  const db = openDatabase(config.databasePath);
  
  const functionCount = db.prepare('SELECT COUNT(*) as count FROM functions').get().count;
  const indexedCount = db.prepare('SELECT COUNT(*) as count FROM functions WHERE embedding IS NOT NULL').get().count;
  
  console.log(`Health Check for ${config.projectName}:`);
  console.log(`  Total functions: ${functionCount}`);
  console.log(`  Indexed functions: ${indexedCount}`);
  console.log(`  Index coverage: ${(indexedCount / functionCount * 100).toFixed(1)}%`);
  
  db.close();
}
```

## 🔄 Maintenance

### Regular Tasks

#### Weekly
```bash
# Run tests
npm test

# Check performance
node test-performance-optimizations.js

# Update dependencies
npm update
```

#### Monthly
```bash
# Rebuild all indexes
find ~/.cascade-guardian/indexes -name "*.db" -delete
node dist/index.js build-index /path/to/your/project

# Clean up old logs
find ~/.cascade-guardian/logs -name "*.log" -mtime +30 -delete
```

### Backup and Restore

```bash
# Backup indexes
cp -r ~/.cascade-guardian/indexes ~/backup/cascade-guardian-$(date +%Y%m%d)

# Restore indexes
cp -r ~/backup/cascade-guardian-20240101/indexes ~/.cascade-guardian/
```

## 🛠️ Development

### Adding New Features

1. **Create feature branch**
```bash
git checkout -b feature/new-feature
```

2. **Implement feature**
- Add to appropriate `src/` directory
- Follow existing patterns
- Add tests

3. **Test thoroughly**
```bash
npm test
node test-integration.js
```

4. **Update documentation**
- Update this guide
- Update README.md
- Add examples

5. **Submit PR**
```bash
git push origin feature/new-feature
```

### Code Style

- **TypeScript** - Use strict typing
- **Comments** - Document public APIs
- **Error Handling** - Use try/catch blocks
- **Performance** - Consider caching and optimization

## 📚 API Reference

### Core Classes

- `CascadeGuardian` - Main API class
- `AdvancedSemanticSearch` - Enhanced search
- `IncrementalIndexer` - Fast incremental indexing
- `CallGraphAnalyzer` - Dependency analysis
- `EmbeddingCache` - Performance optimization

### Key Functions

- `buildEnhancedIndex()` - Index TypeScript code
- `search()` - Hybrid semantic search
- `getCallers()` - Find function callers
- `getImpact()` - Analyze change impact
- `validateEdit()` - Code quality validation

## 🆘 Troubleshooting

### Getting Help

1. **Check logs** - Look for error messages
2. **Run tests** - Verify installation
3. **Check configuration** - Verify paths and settings
4. **Performance** - Monitor cache and database stats

### Common Solutions

- **Rebuild index** - Clear and rebuild
- **Check permissions** - Ensure file access
- **Update dependencies** - npm update
- **Clear cache** - Delete ~/.cascade-guardian

## 🎯 Best Practices

### For Daily Use

1. **Build index after major changes**
2. **Use semantic search for concept queries**
3. **Check impact before refactoring**
4. **Review validation suggestions regularly**

### For Development

1. **Write tests for new features**
2. **Profile performance optimizations**
3. **Document public APIs**
4. **Handle errors gracefully**

### For Maintenance

1. **Monitor performance metrics**
2. **Backup indexes regularly**
3. **Update dependencies**
4. **Clean up old data**

---

## 📞 Support

For issues or questions:

1. **Check this guide** - Most common issues are covered
2. **Run health check** - Diagnose problems
3. **Check GitHub issues** - Known problems and solutions
4. **Create new issue** - For bugs or feature requests

Happy coding with Cascade Guardian! 🚀
