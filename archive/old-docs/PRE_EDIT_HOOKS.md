# Pre-edit Hooks for devin/cascade Integration

## 🎯 Overview

Pre-edit hooks validate code changes **before** devin/cascade applies them, providing immediate feedback and preventing quality issues from entering the codebase.

## 🚀 Setup

### **1. Basic Hook Script**
```bash
# Test pre-edit validation on a file
node pre-edit-hook.js /path/to/file.tsx validate-edit
```

### **2. devin/cascade Integration**
```bash
# Start integration service
node devin-integration.js start
```

## 📋 How It Works

### **Validation Process**
1. **devin/cascade** prepares an edit
2. **Pre-edit hook** validates the change
3. **Result**: Allow/Block with suggestions
4. **devin/cascade** applies or rejects the edit

### **Validation Rules**
- **JSDoc Completeness** - Missing documentation on functions
- **Naming Conventions** - camelCase compliance
- **Pattern Consistency** - Directory-level naming patterns
- **Documentation Quality** - Comprehensive comments

## 🔧 Usage Examples

### **Manual Validation**
```bash
# Validate a specific file
node pre-edit-hook.js /Users/toryrahm/Documents/Repos/harmony/app/components/UserButton.tsx validate-edit

# Expected output:
# 🔍 Pre-edit Validation Results:
# ✅ Allowed: true
# 📝 Reason: Edit allowed with 1 warnings
# 💡 Suggestions:
#    - Function should use camelCase (Line 49): Rename function to use camelCase
```

### **Integration with devin/cascade**
```javascript
import { validateEdit } from './pre-edit-hook.js';

// In devin/cascade's edit flow
const context = {
  file_path: 'app/components/NewComponent.tsx',
  new_string: 'export function NewComponent() { ... }',
  entire_content: fullFileContent
};

const result = await validateEdit(context);

if (!result.allowed) {
  throw new Error(`Edit blocked: ${result.reason}`);
}

// Apply edit with suggestions
console.log('Suggestions:', result.suggestions);
```

## 🎯 Hook Interface

### **EditContext**
```typescript
interface EditContext {
  file_path: string;           // Path to file being edited
  old_string?: string;         // Content being replaced
  new_string?: string;         // New content
  entire_content?: string;     // Full file content after edit
}
```

### **ValidationResult**
```typescript
interface ValidationResult {
  allowed: boolean;            // Can the edit proceed?
  reason?: string;             // Why allowed/blocked
  suggestions?: string[];      // Improvement suggestions
  violations?: CodeViolation[]; // Specific issues found
}
```

## 🚨 Blocking vs. Warning

### **Blocking Violations** (Edit Rejected)
- Critical syntax errors
- Breaking changes to public APIs
- Security vulnerabilities

### **Warning Violations** (Edit Allowed)
- Missing JSDoc documentation
- Naming convention issues
- Pattern inconsistencies

## 🔧 Configuration

### **Custom Rules**
```javascript
// Extend pre-edit-hook.js with custom validation
function customValidation(content, filePath) {
  // Add your own validation logic
  return violations;
}
```

### **Severity Levels**
```javascript
const violations = [
  {
    type: 'CUSTOM_RULE',
    severity: 'error' | 'warning' | 'info',
    message: 'Description of the issue',
    line_number: 42,
    suggested_fix: 'How to fix it'
  }
];
```

## 📊 Integration Benefits

### **For devin/cascade**
- **Quality Gate** - Prevents bad code from entering
- **Context Awareness** - Understands existing patterns
- **Immediate Feedback** - No waiting for file save

### **For Developers**
- **Real-time Guidance** - Suggestions during editing
- **Consistent Standards** - Enforced coding practices
- **Learning Tool** - Improves code quality over time

## 🔄 Workflow Integration

### **During devin/cascade Session**
1. **User requests edit** - "Add a new function"
2. **devin/cascade generates code** - Creates the implementation
3. **Pre-edit hook runs** - Validates the generated code
4. **Feedback provided** - "Add JSDoc, use camelCase"
5. **Code refined** - devin/cascade improves the implementation
6. **Edit applied** - Clean code enters the codebase

### **Example Flow**
```
User: "Create a user authentication function"

devin/cascade: [generates code]
function AuthenticateUser() {
  // implementation
}

Pre-edit Hook: ⚠️ 2 warnings:
  - Function missing JSDoc documentation
  - Function should use camelCase

devin/cascade: [refines code]
/**
 * Authenticates a user with provided credentials
 * @param credentials - User login information
 * @returns Authentication result
 */
export function authenticateUser(credentials) {
  // implementation
}

Pre-edit Hook: ✅ Edit approved - no issues detected

devin/cascade: [applies edit]
```

## 🎯 Next Steps

### **Enhanced Integration**
1. **devin/cascade Plugin** - Native integration
2. **IDE Extensions** - VS Code/IntelliJ support
3. **CI/CD Pipeline** - Pre-commit validation

### **Advanced Features**
1. **Semantic Analysis** - Understanding code purpose
2. **Dependency Impact** - Change blast radius
3. **Refactoring Suggestions** - Automated improvements

### **Performance**
1. **Caching** - Fast validation for repeated patterns
2. **Incremental** - Only validate changed parts
3. **Parallel** - Multiple file validation

---

## 🚀 Quick Start

```bash
# 1. Test pre-edit validation
node pre-edit-hook.js /path/to/your/file.tsx validate-edit

# 2. Start integration service
node devin-integration.js start

# 3. Use with devin/cascade
# The hooks will automatically validate edits during your session
```

Pre-edit hooks provide the **memory layer** that devin/cascade needs to maintain code quality and consistency across your codebase!
