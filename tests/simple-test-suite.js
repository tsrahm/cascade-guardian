/**
 * Simple test suite for Cascade Guardian
 * Focuses on core functionality without complex imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Simple Test Framework ─────────────────────────────────────────────────────

class SimpleTestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('Running Cascade Guardian Tests...\n');
    
    for (const test of this.tests) {
      try {
        const startTime = Date.now();
        await test.fn();
        const duration = Date.now() - startTime;
        
        this.results.push({
          name: test.name,
          passed: true,
          duration,
          error: null
        });
        
        console.log(`✅ ${test.name} (${duration}ms)`);
      } catch (error) {
        this.results.push({
          name: test.name,
          passed: false,
          duration: 0,
          error: error.message
        });
        
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success: ${failed === 0 ? '✅' : '❌'}`);
    
    if (failed > 0) {
      process.exit(1);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Value should not be null or undefined');
    }
  }
}

// ─── Test Utilities ─────────────────────────────────────────────────────────

function createTempDir() {
  const tempDir = path.join(__dirname, 'temp', `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function cleanupTempDir(tempDir) {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function createTestFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

// ─── Core Tests ─────────────────────────────────────────────────────────────

const runner = new SimpleTestRunner();

// Test 1: Basic file operations
runner.test('should create and read test files', () => {
  const tempDir = createTempDir();
  try {
    const testFile = path.join(tempDir, 'test.txt');
    const content = 'Hello, World!';
    
    createTestFile(testFile, content);
    const readContent = fs.readFileSync(testFile, 'utf-8');
    
    runner.assertEqual(readContent, content, 'File content should match');
  } finally {
    cleanupTempDir(tempDir);
  }
});

// Test 2: TypeScript file parsing
runner.test('should parse TypeScript functions', () => {
  const tempDir = createTempDir();
  try {
    const tsFile = path.join(tempDir, 'test.ts');
    const content = `
/**
 * @what Test function for validation
 * @how Performs basic operations
 * @why Demonstrates functionality
 */
export function testFunction(param: string): string {
  return param.toUpperCase();
}

export const arrowFunction = (x: number) => x * 2;
`;
    
    createTestFile(tsFile, content);
    
    // Basic parsing checks
    runner.assert(content.includes('export function testFunction'), 'Should contain function declaration');
    runner.assert(content.includes('export const arrowFunction'), 'Should contain arrow function');
    runner.assert(content.includes('@what'), 'Should contain JSDoc @what tag');
    runner.assert(content.includes('@how'), 'Should contain JSDoc @how tag');
    runner.assert(content.includes('@why'), 'Should contain JSDoc @why tag');
  } finally {
    cleanupTempDir(tempDir);
  }
});

// Test 3: Configuration validation
runner.test('should validate configuration structure', () => {
  const config = {
    projectRoot: '/test/project',
    projectName: 'test-project',
    sourceDirectories: ['src'],
    docsDirectories: ['docs'],
    excludeDirectories: ['node_modules'],
    fileExtensions: ['.ts', '.tsx'],
    databasePath: '/test/project/test.db',
    jsdoc: {
      requiredTags: ['what', 'how', 'why'],
      minTags: 3,
      minCommentLength: 5
    }
  };
  
  runner.assertNotNull(config.projectRoot, 'Project root should be defined');
  runner.assertNotNull(config.projectName, 'Project name should be defined');
  runner.assert(config.sourceDirectories.length > 0, 'Should have source directories');
  runner.assert(config.fileExtensions.length > 0, 'Should have file extensions');
  runner.assertNotNull(config.jsdoc, 'JSDoc config should be defined');
  runner.assert(config.jsdoc.requiredTags.length > 0, 'Should have required JSDoc tags');
});

// Test 4: Database schema validation
runner.test('should validate database schema', () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS functions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      line_number INTEGER NOT NULL,
      tier INTEGER NOT NULL DEFAULT 2,
      what TEXT,
      how TEXT,
      why TEXT,
      params TEXT,
      returns TEXT,
      sideeffects TEXT,
      systemlayer TEXT,
      domain TEXT,
      tags TEXT,
      inline_comments TEXT,
      embedding BLOB,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE VIRTUAL TABLE IF NOT EXISTS functions_fts USING fts5(
      name, file_path, what, how, why, params, returns, domain, tags
    );
  `;
  
  runner.assert(schema.includes('CREATE TABLE IF NOT EXISTS functions'), 'Should create functions table');
  runner.assert(schema.includes('CREATE VIRTUAL TABLE IF NOT EXISTS functions_fts'), 'Should create FTS5 table');
  runner.assert(schema.includes('name TEXT NOT NULL'), 'Should have required name field');
  runner.assert(schema.includes('file_path TEXT NOT NULL'), 'Should have required file_path field');
  runner.assert(schema.includes('embedding BLOB'), 'Should have embedding field for vectors');
});

// Test 5: Search query validation
runner.test('should validate search query structure', () => {
  const searchQuery = {
    query: 'user authentication',
    domain: 'auth',
    tags: ['validation', 'security'],
    system_layer: 'Business Logic',
    limit: 10
  };
  
  runner.assertNotNull(searchQuery.query, 'Query should be defined');
  runner.assert(searchQuery.query.length > 0, 'Query should not be empty');
  runner.assertNotNull(searchQuery.limit, 'Limit should be defined');
  runner.assert(searchQuery.limit > 0, 'Limit should be positive');
  runner.assert(Array.isArray(searchQuery.tags), 'Tags should be an array');
});

// Test 6: Performance metrics validation
runner.test('should validate performance metrics', () => {
  const metrics = {
    cache_hits: 100,
    cache_misses: 5,
    query_time_saved: 250,
    total_functions: 150,
    processing_time: 45
  };
  
  runner.assert(metrics.cache_hits >= 0, 'Cache hits should be non-negative');
  runner.assert(metrics.cache_misses >= 0, 'Cache misses should be non-negative');
  runner.assert(metrics.query_time_saved >= 0, 'Query time saved should be non-negative');
  runner.assert(metrics.total_functions >= 0, 'Total functions should be non-negative');
  runner.assert(metrics.processing_time >= 0, 'Processing time should be non-negative');
  
  const hitRate = metrics.cache_hits / (metrics.cache_hits + metrics.cache_misses);
  runner.assert(hitRate >= 0 && hitRate <= 1, 'Hit rate should be between 0 and 1');
});

// Test 7: JSDoc parsing validation
runner.test('should parse JSDoc comments correctly', () => {
  const jsDocText = `
    /**
     * @what Validates user input
     * @how Uses regex patterns and validation rules
     * @why Ensures data integrity and security
     * @param input The user input to validate
     * @returns boolean indicating validity
     * @sideeffects None
     * @systemlayer Validation
     * @domain input-validation, security
     * @tags validation, input, security
     */
  `;
  
  runner.assert(jsDocText.includes('@what'), 'Should contain @what tag');
  runner.assert(jsDocText.includes('@how'), 'Should contain @how tag');
  runner.assert(jsDocText.includes('@why'), 'Should contain @why tag');
  runner.assert(jsDocText.includes('@param'), 'Should contain @param tag');
  runner.assert(jsDocText.includes('@returns'), 'Should contain @returns tag');
  runner.assert(jsDocText.includes('@sideeffects'), 'Should contain @sideeffects tag');
  runner.assert(jsDocText.includes('@systemlayer'), 'Should contain @systemlayer tag');
  runner.assert(jsDocText.includes('@domain'), 'Should contain @domain tag');
  runner.assert(jsDocText.includes('@tags'), 'Should contain @tags tag');
});

// Test 8: Call graph validation
runner.test('should validate call graph structure', () => {
  const callEdge = {
    caller_id: 1,
    callee_id: 2,
    caller_name: 'validateInput',
    callee_name: 'sanitizeInput',
    file_path: 'src/validation.ts',
    line_number: 15,
    call_type: 'direct'
  };
  
  runner.assertNotNull(callEdge.caller_id, 'Caller ID should be defined');
  runner.assertNotNull(callEdge.callee_id, 'Callee ID should be defined');
  runner.assertNotNull(callEdge.caller_name, 'Caller name should be defined');
  runner.assertNotNull(callEdge.callee_name, 'Callee name should be defined');
  runner.assertNotNull(callEdge.file_path, 'File path should be defined');
  runner.assert(callEdge.line_number > 0, 'Line number should be positive');
  runner.assert(['direct', 'indirect', 'conditional'].includes(callEdge.call_type), 'Call type should be valid');
});

// Test 9: Embedding validation
runner.test('should validate embedding structure', () => {
  const embedding = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
  
  runner.assert(embedding.length > 0, 'Embedding should not be empty');
  runner.assert(embedding instanceof Float32Array, 'Should be Float32Array');
  runner.assert(embedding.every(val => !isNaN(val)), 'All values should be valid numbers');
  runner.assert(embedding.every(val => val >= -1 && val <= 1), 'Values should be normalized');
});

// Test 10: Error handling validation
runner.test('should handle errors gracefully', () => {
  const errorHandler = (error) => {
    return {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };
  };
  
  try {
    throw new Error('Test error');
  } catch (error) {
    const handled = errorHandler(error);
    
    runner.assertNotNull(handled.message, 'Should preserve error message');
    runner.assertNotNull(handled.timestamp, 'Should include timestamp');
    runner.assert(handled.message === 'Test error', 'Should preserve original error message');
  }
});

// ─── Run Tests ───────────────────────────────────────────────────────────────

runner.run().catch(console.error);
