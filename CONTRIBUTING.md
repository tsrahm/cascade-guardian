# Contributing to Cascade Guardian

🚀 Welcome to Cascade Guardian! We're excited to have you contribute to this advanced code intelligence system.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)

## 🚀 Getting Started

### Prerequisites

- **Node.js >= 18** (for build tooling and Hugging Face transformers)
- **npm** (package manager)
- **Git** (for version control)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/tsrahm/cascade-guardian.git
cd cascade-guardian

# Install dependencies
npm install

# Build the project
npm run build

# Run setup script
npm run setup

# Verify installation
npm run health-check
```

## 🔧 Development Setup

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test
```

### Environment Setup

```bash
# Enable debug logging
export DEBUG="cascade-guardian:*"

# Set cache size (optional)
export GUARDIAN_CACHE_SIZE=100

# Set log level (optional)
export GUARDIAN_LOG_LEVEL=debug
```

## 📁 Project Structure

```
cascade-guardian/
├── src/                          # Source code
│   ├── config.ts                 # Configuration system
│   ├── database/                  # Database layer
│   ├── search/                    # Search tools
│   ├── indexer/                   # Code indexing
│   ├── validation/                # Real-time validation
│   ├── performance/               # Performance optimizations
│   ├── logging/                   # Logging system
│   ├── error/                     # Error handling
│   ├── call-graph/                # Call graph analysis
│   ├── embeddings/                # Vector embeddings
│   └── devin-integration/         # devin/cascade integration
├── tests/                        # Test suite
├── example-project/              # Example TypeScript project
├── dist/                         # Compiled JavaScript
├── docs/                         # Documentation
└── scripts/                      # Development scripts
```

## 🤝 How to Contribute

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/cascade-guardian.git
cd cascade-guardian

# Add upstream remote
git remote add upstream https://github.com/tsrahm/cascade-guardian.git
```

### 2. Create a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow the [Development Guidelines](#development-guidelines)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass

### 4. Submit a Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Use strict typing with proper interfaces
- **ESLint**: Follow configured linting rules
- **Comments**: Document public APIs and complex logic
- **Error Handling**: Use proper error handling with recovery

### Architecture Principles

1. **Modular Design**: Keep components focused and reusable
2. **Performance First**: Consider caching and optimization
3. **Type Safety**: Use TypeScript for all new code
4. **Testing**: Write tests for all new features
5. **Documentation**: Update README and API docs

### File Organization

- Use descriptive file names
- Keep related functionality together
- Follow existing directory structure
- Use index.ts for module exports

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run performance tests
npm run test:performance

# Run integration tests
npm run test:integration

# Run all test suites
npm run test:all
```

### Test Structure

```
tests/
├── unit/                         # Unit tests
├── integration/                  # Integration tests
├── performance/                  # Performance tests
└── fixtures/                     # Test data
```

### Writing Tests

```typescript
// Example test
import { AdvancedSemanticSearch } from '../src/search/advanced-semantic-search.js';

test('should perform semantic search', async () => {
  const search = new AdvancedSemanticSearch('/path/to/test/db');
  const results = await search.search({
    query: 'user authentication',
    limit: 10
  });
  
  expect(results).toBeDefined();
  expect(results.length).toBeGreaterThan(0);
});
```

## 🎯 Development Guidelines

### Performance Considerations

- Use caching for expensive operations
- Optimize database queries
- Profile performance bottlenecks
- Monitor memory usage

### Error Handling

```typescript
// Use proper error handling
import { handleAsync, LogCategory } from '../src/logging/logger.js';

const result = await handleAsync(
  async () => riskyOperation(),
  { operation: 'database-query', component: 'user-service' },
  { fallbackValue: defaultValue, maxRetries: 3 }
);
```

### Logging

```typescript
// Use structured logging
import { logger, LogCategory } from '../src/logging/logger.js';

logger.info(LogCategory.SEARCH, 'Search completed', {
  query: 'user auth',
  results: 10,
  duration: 45
});
```

## 📋 Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] **Code follows style guidelines**
- [ ] **All tests pass** (`npm run test:all`)
- [ ] **Documentation is updated**
- [ ] **Performance is considered**
- [ ] **Error handling is implemented**
- [ ] **TypeScript types are correct**

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🐛 Bug Reports

### Reporting Bugs

1. **Use GitHub Issues** for bug reports
2. **Provide detailed information**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details
3. **Include logs** if applicable
4. **Add screenshots** for UI issues

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 18.0.0]
- Cascade Guardian: [e.g., 1.0.0]

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Requesting Features

1. **Check existing issues** first
2. **Use GitHub Issues** with "enhancement" label
3. **Provide clear description** of the feature
4. **Explain use case** and benefits
5. **Consider implementation** suggestions

## 📚 Documentation

### Updating Documentation

- **README.md**: Main project documentation
- **API docs**: Function and class documentation
- **Guides**: How-to guides and tutorials
- **Code comments**: Inline documentation

### Documentation Style

- Use clear, concise language
- Include code examples
- Add section headers
- Use proper formatting

## 🏆 Recognition

Contributors are recognized in:

- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributors list

## 📞 Getting Help

### Ways to Get Help

1. **GitHub Issues**: For bugs and feature requests
2. **GitHub Discussions**: For questions and discussions
3. **Documentation**: Check existing docs first
4. **Code Comments**: Read inline documentation

### Community Guidelines

- **Be respectful** and constructive
- **Search before asking** questions
- **Provide context** for issues
- **Help others** when you can

## 📄 License

By contributing, you agree that your contributions will be licensed under the same MIT License as the project.

---

## 🚀 Ready to Contribute?

Thank you for contributing to Cascade Guardian! Your contributions help make this project better for everyone.

If you have any questions, feel free to open an issue or start a discussion.

Happy coding! 🎯
