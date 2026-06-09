# Using Pre-edit Hooks with Harmony Repository

## 🎯 Overview

This guide shows how to integrate Cascade Guardian's pre-edit hooks with your Harmony repository to validate code changes **before** devin/cascade applies them.

## 🚀 Quick Setup

### **1. Test Pre-edit Validation**
```bash
# From cascade-guardian directory
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/components/UserButton.tsx validate-edit
```

### **2. Start Integration Service**
```bash
node devin-integration.js start
```

## 📋 Practical Usage Examples

### **Example 1: Validate Existing Harmony Files**
```bash
# Test a component file
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/features/photo-upload/components/photo-upload-flow.tsx validate-edit

# Expected output:
# 🔍 Pre-edit Validation Results:
# ✅ Allowed: true
# 📝 Reason: Edit allowed with 1 warnings
# 💡 Suggestions:
#    - Function should use camelCase (Line 49): Rename function to use camelCase
```

### **Example 2: Validate Route Files**
```bash
# Test API route
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/routes/api.users.$flashId.galleries.$galleryId.images.upload.prepare-single.ts validate-edit

# Test component route
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/routes/design.edit.$foundationId.$projectId.tsx validate-edit
```

### **Example 3: Validate Utility Files**
```bash
# Test utility functions
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/support/functions/format-version-label.ts validate-edit

# Test store files
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/stores/customer-store.ts validate-edit
```

## 🔄 devin/cascade Integration Workflow

### **During a devin/cascade Session**

1. **Start the integration service**
   ```bash
   # Terminal 1: Start pre-edit hooks
   cd /Users/toryrahm/Documents/Repos/cascade-guardian
   node devin-integration.js start
   ```

2. **Begin devin/cascade session**
   - Open your Harmony project in devin/cascade
   - The hooks will automatically validate edits

3. **Make code changes**
   - When devin/cascade generates code, pre-edit hooks validate it
   - You'll see validation feedback immediately

### **Example devin/cascade Session**
```
You: "Create a new component for user profile management"

devin/cascade: [generates code]
export function UserProfileComponent() {
  // implementation
}

Pre-edit Hook: ⚠️ 2 warnings:
  - Function missing JSDoc documentation
  - Function should use camelCase (UserProfileComponent -> userProfileComponent)

devin/cascade: [refines code]
/**
 * Component for displaying and editing user profile information
 * @param user - User data object
 * @returns JSX element
 */
export function userProfileComponent(user) {
  // implementation
}

Pre-edit Hook: ✅ Edit approved - no issues detected

devin/cascade: [applies edit to Harmony codebase]
```

## 🎯 Real-world Scenarios

### **Scenario 1: Adding New API Route**
```bash
# Before devin/cascade creates the route
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/routes/api.new-feature.ts validate-edit

# During devin/cascade session
# The hook will validate the generated route automatically
```

### **Scenario 2: Refactoring Existing Component**
```bash
# Test current component
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/components/ExistingComponent.tsx validate-edit

# devin/cascade refactors with validation
# Hook ensures refactored code maintains quality standards
```

### **Scenario 3: Adding Utility Functions**
```bash
# Validate utility function additions
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/support/utils/new-utility.ts validate-edit
```

## 🔧 Configuration for Harmony

### **Update guardian.config.json**
```json
{
  "sourceDirectories": ["app"],
  "excludeDirectories": ["node_modules", "build", "coverage", "dist"],
  "fileExtensions": [".ts", ".tsx", ".js", ".jsx"],
  "validation": {
    "enableRealTime": true,
    "rules": {
      "jsdoc_completeness": { "enabled": true, "severity": "warning" },
      "naming_conventions": { "enabled": true, "severity": "warning" }
    }
  }
}
```

### **Harmony-Specific Rules**
The pre-edit hooks are already configured for Harmony's structure:
- **Component files** (`app/components/`) - React component validation
- **Route files** (`app/routes/`) - API route validation  
- **Store files** (`app/stores/`) - State management validation
- **Utility files** (`app/support/`) - Helper function validation

## 📊 Integration Benefits for Harmony

### **Code Quality**
- **Consistent JSDoc** - All new functions documented
- **Naming Standards** - camelCase enforcement across components
- **Pattern Consistency** - Harmony-specific patterns maintained

### **Development Speed**
- **Immediate Feedback** - No waiting for file save validation
- **Fewer Revisions** - devin/cascade generates better code initially
- **Quality Assurance** - Prevents bad code from entering codebase

### **Team Collaboration**
- **Shared Standards** - All developers follow same rules
- **Onboarding** - New team members learn patterns quickly
- **Code Reviews** - Automated validation reduces manual review time

## 🚀 Daily Workflow

### **Morning Setup**
```bash
# 1. Start validation service
cd /Users/toryrahm/Documents/Repos/cascade-guardian
node devin-integration.js start

# 2. Start real-time file watcher (optional)
./watch-harmony-minimal.js

# 3. Begin devin/cascade session
# Open Harmony project and start coding
```

### **During Development**
1. **devin/cascade generates code** → Pre-edit hook validates
2. **Issues found** → devin/cascade refines automatically  
3. **Clean code** → Applied to Harmony codebase
4. **File save** → Real-time watcher confirms quality

### **End of Day**
```bash
# Check validation summary
node health-check.js

# Review any persistent issues
./dev-audit.sh /Users/toryrahm/Documents/Repos/harmony
```

## 🎯 Troubleshooting

### **Common Issues**
```bash
# If hooks aren't working:
# 1. Check file paths
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/components/test.tsx validate-edit

# 2. Restart integration service
node devin-integration.js start

# 3. Check file permissions
ls -la /Users/toryrahm/Documents/Repos/harmony/app/components/
```

### **Debug Mode**
```bash
# Enable verbose logging
DEBUG=cascade-guardian:* node devin-integration.js start
```

## 🔄 Advanced Usage

### **Custom Validation Rules**
```javascript
// Add Harmony-specific rules to pre-edit-hook.js
function validateHarmonyPatterns(content, filePath) {
  const violations = [];
  
  // Check for Harmony-specific patterns
  if (filePath.includes('routes/') && !content.includes('export async function')) {
    violations.push({
      type: 'HARMONY_ROUTE_PATTERN',
      severity: 'warning',
      message: 'Harmony routes should use async functions',
      suggested_fix: 'Use export async function for route handlers'
    });
  }
  
  return violations;
}
```

### **Batch Validation**
```bash
# Validate multiple files
find /Users/toryrahm/Documents/Repos/harmony/app -name "*.ts" -exec node pre-edit-hook.js {} validate-edit \;
```

---

## 🎯 Quick Start Summary

```bash
# 1. Test the hooks
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/components/UserButton.tsx validate-edit

# 2. Start integration
node devin-integration.js start

# 3. Use devin/cascade
# The hooks will automatically validate during your session
```

Your Harmony repository now has **pre-edit validation** that ensures code quality before devin/cascade applies any changes! 🚀
