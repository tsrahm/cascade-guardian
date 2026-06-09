# Script Audit and Consolidation Plan

## 🎯 Current Scripts Overview

### **Watch Scripts (4 variants)**
- `watch-harmony.js` - Advanced (broken due to FTS5 errors)
- `watch-harmony-simple.js` - Simple (uses database, may have FTS5 issues)
- `watch-harmony-basic.js` - Basic (uses database, may have FTS5 issues)
- `watch-harmony-minimal.js` - **Minimal (working, no database)**

### **Integration Scripts (3 variants)**
- `cascade-hook-monitor.js` - **Real-time cascade integration (working)**
- `devin-integration.js` - Simulation (not real integration)
- `pre-edit-hook.js` - Manual validation tool

### **Shell Scripts (4 variants)**
- `dev-watch.sh` - Shell wrapper for advanced watcher
- `dev-watch-advanced.sh` - Shell wrapper for advanced watcher
- `dev-index.sh` - Build index script
- `dev-audit.sh` - Audit script

### **Documentation (6 files)**
- `HARMONY_INTEGRATION.md` - Harmony setup guide
- `HARMONY_TEST_FINDINGS.md` - Test results and issues
- `PRE_EDIT_HOOKS.md` - Pre-edit hook documentation
- `VALIDATION_SEVERITIES.md` - Severity behavior docs
- `NEXT_STEPS.md` - Development roadmap
- `DEVIN_INTEGRATION.md` - General integration guide

### **Core Files (2 files)**
- `shared-validation.js` - **Core validation logic (working)**
- `health-check.js` - System health check

## 📊 Redundancy Analysis

### **High Redundancy**
1. **Watch Scripts** - 4 variants, only `minimal` works reliably
2. **Integration Scripts** - 3 variants, only `cascade-hook-monitor.js` provides real value
3. **Shell Wrappers** - Mostly obsolete with JavaScript scripts

### **Low Redundancy**
1. **Documentation** - Each serves different purpose
2. **Core Files** - Essential and non-redundant

## 🎯 Consolidation Recommendation

### **Keep (Essential)**
```
✅ watch-harmony-minimal.js          # Primary working watcher
✅ cascade-hook-monitor.js          # Real-time cascade integration  
✅ shared-validation.js              # Core validation logic
✅ pre-edit-hook.js                  # Manual validation tool
✅ dev-index.sh                      # Build index script
✅ health-check.js                   # System health check
```

### **Archive (Obsolete)**
```
📦 watch-harmony.js                  # Broken (FTS5 errors)
📦 watch-harmony-simple.js           # Redundant, may have FTS5 issues
📦 watch-harmony-basic.js            # Redundant, may have FTS5 issues
📦 devin-integration.js               # Simulation, not real integration
📦 dev-watch.sh                      # Shell wrapper, obsolete
📦 dev-watch-advanced.sh             # Shell wrapper, obsolete
```

### **Keep (Documentation)**
```
✅ HARMONY_INTEGRATION.md            # User setup guide
✅ HARMONY_TEST_FINDINGS.md          # Test results
✅ VALIDATION_SEVERITIES.md          # Severity behavior
✅ NEXT_STEPS.md                     # Development roadmap
```

### **Archive (Documentation)**
```
📦 PRE_EDIT_HOOKS.md                 # Can be merged into HARMONY_INTEGRATION.md
📦 DEVIN_INTEGRATION.md               # Redundant with HARMONY_INTEGRATION.md
```

## 🚀 Simplified Workflow

### **For Harmony Development**
```bash
# 1. Build index (one-time setup)
./dev-index.sh /Users/toryrahm/Documents/Repos/harmony

# 2. Real-time validation during cascade sessions
node cascade-hook-monitor.js start

# 3. Manual validation (optional)
node pre-edit-hook.js /path/to/file.tsx validate-edit

# 4. Health check (troubleshooting)
node health-check.js
```

### **For File Watching (Alternative)**
```bash
# If you prefer file-save validation instead of cascade integration
./watch-harmony-minimal.js
```

## 📋 Migration Plan

### **Phase 1: Clean Up Scripts**
1. **Archive broken scripts** to `archive/` directory
2. **Update documentation** to reference only working scripts
3. **Add deprecation notices** to obsolete scripts

### **Phase 2: Consolidate Documentation**
1. **Merge PRE_EDIT_HOOKS.md** into HARMONY_INTEGRATION.md
2. **Archive DEVIN_INTEGRATION.md** (redundant)
3. **Update README.md** with simplified workflow

### **Phase 3: Improve Core Scripts**
1. **Add chokidar** to cascade-hook-monitor.js (performance)
2. **Add config-driven severity** to shared-validation.js
3. **Add error handling** and logging improvements

## 🎯 Benefits of Consolidation

### **Reduced Complexity**
- **From 11 scripts to 6** essential scripts
- **Clearer user experience** - less confusion about which script to use
- **Easier maintenance** - fewer files to update

### **Better Performance**
- **Remove broken FTS5 scripts** that cause errors
- **Focus on working solutions** - minimal watcher + cascade integration
- **Add performance improvements** to remaining scripts

### **Clearer Documentation**
- **Single source of truth** for Harmony integration
- **Focused guides** for specific use cases
- **Reduced documentation overhead**

## 🔧 Implementation

### **Archive Directory Structure**
```
archive/
├── broken-watchers/
│   ├── watch-harmony.js
│   ├── watch-harmony-simple.js
│   └── watch-harmony-basic.js
├── obsolete-scripts/
│   ├── devin-integration.js
│   ├── dev-watch.sh
│   └── dev-watch-advanced.sh
└── old-docs/
    ├── PRE_EDIT_HOOKS.md
    └── DEVIN_INTEGRATION.md
```

### **Updated README.md Structure**
```markdown
## Quick Start
### Option 1: Real-time Cascade Integration (Recommended)
### Option 2: File Save Validation
### Option 3: Manual Validation

## Scripts Reference
### Essential Scripts
### Archive Scripts
```

---

## 🎯 Bottom Line

**Keep**: 6 essential scripts that work reliably
**Archive**: 9 obsolete/broken scripts that cause confusion
**Result**: Simpler, more maintainable codebase with clear workflow
