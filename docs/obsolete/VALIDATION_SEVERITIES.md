# Validation Severity Behavior in Cascade Guardian

## 🎯 Overview

This document clarifies how validation severities actually behave across different watcher variants, addressing the confusion between configuration settings and implementation.

## 📊 Current Severity Behavior

### **Minimal Watcher (`watch-harmony-minimal.js`)**
- **All violations are advisory** - Edit always "Approved"
- **No blocking behavior** - Even "error" severity rules don't block
- **Real-time feedback** - Shows suggestions but allows all edits

### **Basic Watcher (`watch-harmony-basic.js`)**  
- **All violations are advisory** - Edit always "Approved"
- **No blocking behavior** - Same as minimal
- **Uses database** - Attempts advanced search but falls back to advisory

### **Advanced Watcher (`watch-harmony.js`)**
- **Intended to block** - But currently broken due to FTS5 errors
- **Would respect severity** - Error severity should block edits
- **Currently non-functional** - SQLite errors prevent operation

## 🚨 Key Finding: Severity vs Implementation Mismatch

### **Configuration vs Reality**
```json
// guardian.config.json
"validation": {
  "rules": {
    "dry_violation": { "enabled": true, "severity": "error" },
    "jsdoc_completeness": { "enabled": true, "severity": "warning" },
    "naming_conventions": { "enabled": true, "severity": "warning" }
  }
}
```

**Reality**: All watchers currently treat all rules as advisory, regardless of configured severity.

### **Why This Happens**
1. **Minimal/Basic watchers** - Simplified implementations that ignore severity
2. **Advanced watcher** - Would respect severity but broken by FTS5 issues
3. **Pre-edit hooks** - Also advisory by design

## 🔧 Fixed Issues (June 2026)

### **1. DRY Detection Added to Minimal Watcher**
- **Before**: Only JSDoc + naming checks
- **After**: JSDoc + naming + DRY detection
- **Impact**: Byte-for-byte duplicates now detected

### **2. React Component Naming Fixed**
- **Before**: PascalCase components flagged as needing camelCase
- **After**: React components in `.tsx` files exempted
- **Impact**: `HookTestComponent` no longer false positive

### **3. Banner Updated**
- **Before**: "Minimal validation active (JSDoc + naming only)"
- **After**: "Minimal validation active (JSDoc + naming + DRY detection)"

## 📋 Actual Rule Coverage by Watcher

### **Minimal Watcher** ✅ Working
- ✅ **JSDoc completeness** - Missing documentation detection
- ✅ **Naming conventions** - camelCase enforcement (with React exemption)
- ✅ **DRY detection** - Exact function duplicate detection
- ❌ **Semantic similarity** - Not implemented
- ❌ **Pattern consistency** - Not implemented
- ❌ **Architectural alignment** - Not implemented

### **Basic Watcher** ⚠️ Partially Working
- ✅ **JSDoc completeness** - Via database
- ✅ **Naming conventions** - Via database  
- ✅ **DRY detection** - Via database (when working)
- ❌ **Advanced search** - Broken by FTS5 errors
- ❌ **Semantic similarity** - Broken by FTS5 errors

### **Advanced Watcher** ❌ Broken
- ❌ **All rules** - FTS5 SQLite errors prevent operation
- ❌ **Blocking behavior** - Cannot test due to errors

## 🎯 Severity Implementation Plan

### **Phase 1: Fix FTS5 Issues**
```bash
# Priority: High
# Fix "no such column: step" errors
# Restore advanced watcher functionality
# Enable actual blocking behavior
```

### **Phase 2: Implement True Blocking**
```javascript
// In advanced watcher
if (errorViolations.length > 0) {
  return {
    allowed: false,  // Actually block the edit
    reason: `Critical violations: ${errorViolations.map(v => v.message).join(', ')}`,
    violations: errorViolations
  };
}
```

### **Phase 3: Severity-Aware Minimal Watcher**
```javascript
// Enhanced minimal watcher
const errorViolations = violations.filter(v => v.severity === 'error');
if (errorViolations.length > 0) {
  console.log(`❌ Edit BLOCKED: ${errorViolations.length} critical violations`);
  return false; // Block the edit
}
```

## 🔄 Current Behavior Summary

### **What Works Now**
- **Real-time validation** - Files validated on change
- **JSDoc detection** - Missing documentation flagged
- **Naming checks** - camelCase enforcement (React-aware)
- **DRY detection** - Exact duplicates found
- **Advisory feedback** - Suggestions provided

### **What Doesn't Work**
- **Blocking edits** - No rule actually prevents changes
- **Severity respect** - All rules treated as warnings
- **Advanced search** - FTS5 errors prevent operation
- **Semantic analysis** - Not available in minimal watcher

### **User Experience**
```
🔍 Cascade Edit Detected: app/components/NewComponent.tsx
✅ Edit Approved
💡 4 suggestions for improvement:
   - Duplicate function 'clamp' found in app/utils/math.ts
   - Function missing JSDoc documentation (Line 15)
   - Function should use camelCase (Line 23)
   - Arrow function missing JSDoc documentation (Line 28)
```

**Note**: Even DRY violations (severity: "error") are currently advisory.

## 🎯 Recommendations

### **For Immediate Use**
1. **Use minimal watcher** - Most reliable option
2. **Treat all suggestions seriously** - Even "error" rules are advisory
3. **Manual code review** - Verify DRY violations manually

### **For Future Development**
1. **Fix FTS5 search** - Restore advanced functionality
2. **Implement blocking** - Make severity meaningful
3. **Add semantic analysis** - Beyond exact duplicates
4. **User preferences** - Allow configurable blocking

### **Configuration Clarification**
```json
{
  "validation": {
    "blockOnError": true,  // New: Actually block on error severity
    "rules": {
      "dry_violation": { 
        "enabled": true, 
        "severity": "error",  // Currently advisory, would block if fixed
        "action": "block"    // New: Explicit blocking action
      }
    }
  }
}
```

---

## 🚀 Quick Test

```bash
# Test current behavior
./watch-harmony-minimal.js

# Create a file with duplicate function
# Edit will be "Approved" with DRY suggestion
# No actual blocking occurs
```

**Bottom Line**: All current watchers are advisory despite severity configuration. True blocking requires FTS5 fixes and implementation updates.
