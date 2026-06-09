# Cascade Guardian - Recommended Next Steps

## 🎯 Current Status (June 2026)

### ✅ **Working Features**
- **Code Indexing** - Successfully indexed 7,163 functions and 396 types from Harmony
- **Basic Real-time Validation** - `watch-harmony-minimal.js` working without database issues
- **JSDoc Validation** - Detects missing documentation on functions and arrow functions
- **Naming Convention Checks** - Validates camelCase compliance
- **File Watching** - Monitors 606+ TypeScript/JavaScript files in real-time
- **Development Scripts** - Ready-to-use scripts for Harmony integration

### ❌ **Known Issues**
- **FTS5 Search Errors** - "no such column: step" error in advanced semantic search
- **Advanced Validation** - DRY violation detection and semantic similarity broken
- **Database Schema** - FTS5 virtual table query syntax issues

---

## 🚀 **Priority 1: Fix FTS5 Search Issues**

### **Root Cause**
The FTS5 virtual table queries are failing with "no such column: step" errors. This affects:
- Advanced semantic search
- DRY violation detection  
- Code similarity analysis

### **Immediate Actions**
1. **Investigate FTS5 Implementation**
   ```bash
   # Debug the FTS5 table structure
   sqlite3 ~/.cascade-guardian/indexes/{project-hash}/code-quality.db ".schema functions_fts"
   ```

2. **Fix Query Syntax**
   - Review `src/search/advanced-semantic-search.ts` line 93
   - Check FTS5 MATCH clause syntax
   - Verify virtual table column definitions

3. **Test Incremental Fixes**
   ```bash
   npm run build
   ./watch-harmony.js  # Test after each fix
   ```

### **Expected Resolution**
- Advanced search working without SQLite errors
- DRY violation detection functional
- Semantic similarity analysis operational

---

## 🔧 **Priority 2: Enhanced Validation Rules**

### **Current Limitations**
Minimal validation only covers:
- JSDoc completeness
- Basic naming conventions

### **Add Missing Rules**
1. **Pattern Consistency**
   - Directory-level naming patterns
   - File organization validation

2. **Architectural Alignment**
   - Layer coherence checking
   - Domain boundary validation

3. **Advanced DRY Detection**
   - Function signature similarity
   - Code pattern duplication

### **Implementation Path**
```javascript
// Extend watch-harmony-minimal.js with more rules
function validateAdvancedRules(content, filePath) {
  // Add pattern consistency checks
  // Add architectural alignment validation
  // Add enhanced DRY detection
}
```

---

## 🎨 **Priority 3: User Experience Improvements**

### **Script Organization**
- **Consistent Naming** - Standardize script names and usage
- **Better Error Messages** - More descriptive validation feedback
- **Configuration Management** - Improve guardian.config.json handling

### **Performance Optimizations**
- **Debouncing** - Optimal file change detection timing
- **Memory Management** - Efficient large codebase handling
- **Incremental Updates** - Only validate changed files

### **Integration Enhancements**
- **devin/cascade Hooks** - Pre-edit validation integration
- **IDE Extensions** - VS Code/IntelliJ plugin potential
- **CI/CD Integration** - GitHub Actions workflow

---

## 📊 **Priority 4: Advanced Features**

### **Semantic Search Enhancement**
- **Vector Embeddings** - Improve similarity calculations
- **Contextual Search** - Domain-aware results
- **Query Expansion** - Related term suggestions

### **Code Intelligence**
- **Call Graph Analysis** - Dependency visualization
- **Impact Analysis** - Change blast radius calculation
- **Refactoring Suggestions** - Automated improvement recommendations

### **Collaboration Features**
- **Team Configuration** - Shared validation rules
- **Code Review Integration** - PR validation automation
- **Metrics Dashboard** - Code quality analytics

---

## 🛠️ **Development Workflow**

### **For Harmony Development**
```bash
# Daily workflow
./watch-harmony-minimal.js  # Start validation
# Edit files in Harmony/
# See real-time validation results
```

### **For Cascade Guardian Development**
```bash
# Development cycle
npm run build              # Compile changes
npm test                   # Run tests
./watch-harmony.js         # Test advanced features
git commit -m "Fix FTS5 issue"  # Document progress
```

### **Testing Strategy**
1. **Unit Tests** - Individual validation rules
2. **Integration Tests** - Full workflow testing
3. **Performance Tests** - Large codebase handling
4. **User Acceptance** - Real-world usage validation

---

## 📈 **Success Metrics**

### **Technical Metrics**
- **Zero SQLite Errors** - All search functionality working
- **<100ms Validation Time** - Sub-100ms file validation
- **99%+ Uptime** - Reliable file watching
- **Memory Efficiency** - <100MB for large codebases

### **User Metrics**
- **Reduced Code Duplicates** - 50% reduction in duplicate functions
- **Improved Documentation** - 90% JSDoc coverage
- **Faster Code Reviews** - 30% reduction in review time
- **Better Code Quality** - Measurable improvement in maintainability

---

## 🎯 **Immediate Next Actions (This Week)**

1. **Fix FTS5 Search**
   - Debug the "step" column error
   - Test with simple FTS5 queries
   - Restore advanced validation

2. **Enhance Minimal Script**
   - Add more validation rules
   - Improve error messages
   - Add configuration support

3. **Documentation**
   - Update README with working features
   - Create troubleshooting guide
   - Document API changes

4. **Testing**
   - Add unit tests for validation rules
   - Test with different codebases
   - Performance benchmarking

---

## 🔄 **Long-term Vision**

Cascade Guardian should become the **memory layer** for devin/cascade, providing:
- **Context Awareness** - Understanding existing code patterns
- **Quality Enforcement** - Preventing codebase degradation
- **Developer Assistance** - Intelligent code suggestions
- **Team Collaboration** - Shared coding standards

The foundation is solid with real-time validation working. The next phase focuses on restoring advanced features and expanding capabilities.
