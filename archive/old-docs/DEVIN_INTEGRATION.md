# Cascade Guardian - devin/cascade Integration Guide

This guide explains how to integrate Cascade Guardian with devin/cascade to provide semantic code awareness, DRY prevention, and automated code quality validation.

## Overview

Cascade Guardian provides three main integration points for devin/cascade:

1. **Search Tools** - Semantic search across the codebase
2. **Validation Hooks** - Pre-edit code quality validation
3. **Skills** - Audit and review commands

## Installation

```bash
# Clone and install Cascade Guardian
git clone https://github.com/your-org/cascade-guardian.git
cd cascade-guardian
./install.sh

# Build the project
npm run build
```

## Integration Steps

### 1. Tool Registration

Register Cascade Guardian tools with devin/cascade's tool system:

```typescript
import { initializeCascadeTools } from 'cascade-guardian/src/devin-integration/tool-registry.js';

// Initialize during devin/cascade startup
const toolRegistry = initializeCascadeTools('/path/to/project');

// Register tools with devin/cascade
const tools = toolRegistry.getTools();
devinCascade.registerTools(tools);

// Execute tools
const results = await toolRegistry.executeTool('search_codebase', {
  query: 'user authentication',
  domain: 'auth',
  limit: 10
});
```

### 2. Validation Hooks

Set up pre-edit validation hooks:

```typescript
import { initializeValidationHooks } from 'cascade-guardian/src/devin-integration/validation-hooks.js';

// Initialize validation hooks
const validationHooks = initializeValidationHooks('/path/to/project');

// Register pre-edit hook
devinCascade.registerPreEditHook(async (editContext) => {
  const result = await validationHooks.validateEdit(editContext);
  
  if (!result.allowed) {
    throw new Error(result.reason);
  }
  
  if (result.suggestions?.length > 0) {
    console.log('Suggestions:', result.suggestions);
  }
  
  return editContext;
});
```

### 3. Skills Integration

Register Cascade Guardian skills:

```typescript
import { initializeCascadeSkills } from 'cascade-guardian/src/devin-integration/skills.js';

// Initialize skills
const skills = initializeCascadeSkills('/path/to/project');

// Register skills with devin/cascade
devinCascade.registerSkill('audit-codebase', async () => {
  return await skills.auditCodebase();
});

devinCascade.registerSkill('review-suggestions', async () => {
  return await skills.reviewSuggestions();
});

devinCascade.registerSkill('analyze-patterns', async () => {
  return await skills.analyzePatterns();
});

devinCascade.registerSkill('duplicates-report', async () => {
  return await skills.duplicatesReport();
});
```

## Available Tools

### search_codebase
Hybrid keyword + semantic search across functions, types, and documentation.

```typescript
await toolRegistry.executeTool('search_codebase', {
  query: 'user authentication',
  domain: 'auth',
  tags: ['validation', 'security'],
  system_layer: 'Business Logic',
  file_path_pattern: 'src/services/%',
  limit: 15
});
```

### find_function_callers
Find all functions that call the specified function.

```typescript
await toolRegistry.executeTool('find_function_callers', {
  function_name: 'formatCurrency',
  file_path: 'src/utils/formatting.ts' // optional
});
```

### find_function_dependencies
Find all functions that the specified function calls/depends on.

```typescript
await toolRegistry.executeTool('find_function_dependencies', {
  function_name: 'processPayment'
});
```

### analyze_change_impact
Analyze the blast radius of a function change.

```typescript
await toolRegistry.executeTool('analyze_change_impact', {
  function_name: 'updateUserProfile',
  max_depth: 3
});
```

### list_business_domains
List all business domains in the codebase.

```typescript
await toolRegistry.executeTool('list_business_domains', {});
```

### list_tags
List tags with usage counts.

```typescript
await toolRegistry.executeTool('list_tags', {
  domain: 'auth',
  limit: 50
});
```

### list_architectural_layers
List all system layers.

```typescript
await toolRegistry.executeTool('list_architectural_layers', {});
```

## Validation Rules

### DRY Violation Detection
- Detects functions with identical names
- Identifies semantically similar functions
- Provides suggestions to use existing implementations

### JSDoc Completeness
- Requires `@what`, `@how`, `@why`, `@domain`, `@tags` for all functions
- Validates parameter and return documentation
- Enforces consistent documentation standards

### Pattern Consistency
- Checks naming conventions within directories
- Validates architectural layer alignment
- Ensures domain coherence

## Skills Usage

### audit-codebase
Triggers: `audit codebase`, `check documentation`, `code quality audit`

Generates a comprehensive report covering:
- JSDoc coverage statistics
- Domain analysis
- Top code quality issues
- Recommendations for improvement

### review-suggestions
Triggers: `review suggestions`, `apply suggestions`, `code review suggestions`

Reviews accumulated suggestions from validation hooks and provides actionable recommendations.

### analyze-patterns
Triggers: `analyze patterns`, `code patterns`, `architecture analysis`

Analyzes code patterns including:
- Naming conventions
- Architectural layer distribution
- Domain organization
- Pattern inconsistencies

### duplicates-report
Triggers: `find duplicates`, `duplicate code`, `dry violations`

Identifies potential duplicate code and provides consolidation recommendations.

## Configuration

### Project Configuration
Create `guardian.config.json` in your project root:

```json
{
  "sourceDirectories": ["src", "lib"],
  "docsDirectories": ["docs"],
  "excludeDirectories": ["node_modules", "dist", "build"],
  "fileExtensions": [".ts", ".tsx"],
  "jsdoc": {
    "requiredTags": ["what", "how", "why", "sideeffects", "systemlayer", "domain", "tags"],
    "minTags": 3,
    "minCommentLength": 5
  }
}
```

### Environment Variables
```bash
export GUARDIAN_PROJECT_ROOT="/path/to/project"
export GUARDIAN_HOME="$HOME/.cascade-guardian"
```

## Example Workflow

### 1. Initial Setup
```bash
# Build index for the project
cascade-guardian build-index /path/to/project

# Verify installation
cascade-guardian list-domains /path/to/project
```

### 2. During Development
```typescript
// Before making changes
const impact = await toolRegistry.executeTool('analyze_change_impact', {
  function_name: 'updateUserProfile'
});

console.log(`This change will affect ${impact.total_affected} functions`);

// Search for existing implementations
const existing = await toolRegistry.executeTool('search_codebase', {
  query: 'user profile validation',
  domain: 'auth'
});

if (existing.functions.length > 0) {
  console.log('Found existing validation code:', existing.functions);
}
```

### 3. Code Quality Assurance
```typescript
// Run audit
const audit = await skills.auditCodebase();
console.log(audit);

// Check for duplicates
const duplicates = await skills.duplicatesReport();
console.log(duplicates);
```

## Advanced Usage

### Custom Validation Rules
Extend the validation hooks with custom rules:

```typescript
class CustomValidationHooks extends CascadeValidationHooks {
  async validateEdit(context: EditContext): Promise<ValidationResult> {
    const baseResult = await super.validateEdit(context);
    
    // Add custom validation logic
    const customViolation = await this.checkCustomRules(context);
    if (customViolation) {
      baseResult.violations?.push(customViolation);
    }
    
    return baseResult;
  }
  
  private async checkCustomRules(context: EditContext): Promise<CodeViolation | null> {
    // Custom validation logic here
    return null;
  }
}
```

### Custom Skills
Create custom skills for project-specific needs:

```typescript
class CustomSkills extends CascadeSkills {
  async analyzePerformance(): Promise<string> {
    // Custom performance analysis
    return '# Performance Analysis\n\nCustom analysis results...';
  }
}
```

## Troubleshooting

### Common Issues

1. **Database not found**: Run `cascade-guardian build-index` first
2. **No search results**: Check that the project has TypeScript files and JSDoc
3. **Validation too strict**: Adjust `guardian.config.json` requirements
4. **Performance issues**: Limit search results and exclude large directories

### Debug Mode
Enable debug logging:

```bash
export DEBUG=cascade-guardian:*
cascade-guardian search /path/to/project "test query"
```

## Performance Considerations

- **Index Size**: Large projects may have big databases - consider excluding test files
- **Search Performance**: Use specific filters (domain, tags) for faster results
- **Validation Overhead**: Validation hooks add minimal overhead (~10-50ms per edit)
- **Memory Usage**: Embeddings are loaded on-demand and cached

## Contributing

To contribute to the devin/cascade integration:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## Support

For issues with the devin/cascade integration:
- Check the troubleshooting guide
- Review the GitHub issues
- Create a new issue with detailed reproduction steps
