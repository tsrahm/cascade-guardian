/**
 * Comprehensive test suite for Cascade Guardian
 * Ensures reliability and prevents regressions
 */

import fs from 'fs';
import path from 'path';

// ─── Test Framework Types ───────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
}

interface TestReport {
  suites: TestSuite[];
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  success: boolean;
}

// ─── Test Framework Implementation ─────────────────────────────────────────────

class TestRunner {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  /**
   * Create a test suite
   */
  suite(name: string, fn: () => void): void {
    const suite: TestSuite = {
      name,
      tests: [],
      duration: 0,
      passed: 0,
      failed: 0
    };
    
    this.currentSuite = suite;
    const startTime = Date.now();
    
    try {
      fn();
    } catch (error) {
      console.error(`Suite ${name} failed:`, error);
    }
    
    suite.duration = Date.now() - startTime;
    this.suites.push(suite);
    this.currentSuite = null;
  }

  /**
   * Run a test
   */
  test(name: string, fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('Test must be run within a suite');
    }
    
    const test: TestResult = {
      name,
      passed: false,
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.then(() => {
          test.passed = true;
          test.duration = Date.now() - startTime;
          this.currentSuite!.tests.push(test);
          this.currentSuite!.passed++;
        }).catch((error) => {
          test.passed = false;
          test.error = error.message;
          test.duration = Date.now() - startTime;
          this.currentSuite!.tests.push(test);
          this.currentSuite!.failed++;
        });
      } else {
        test.passed = true;
        test.duration = Date.now() - startTime;
        this.currentSuite.tests.push(test);
        this.currentSuite.passed++;
      }
    } catch (error) {
      test.passed = false;
      test.error = error instanceof Error ? error.message : 'Unknown error';
      test.duration = Date.now() - startTime;
      this.currentSuite.tests.push(test);
      this.currentSuite.failed++;
    }
  }

  /**
   * Run async test
   */
  async testAsync(name: string, fn: () => Promise<void>): Promise<void> {
    if (!this.currentSuite) {
      throw new Error('Test must be run within a suite');
    }
    
    const test: TestResult = {
      name,
      passed: false,
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      await fn();
      test.passed = true;
      test.duration = Date.now() - startTime;
      this.currentSuite.tests.push(test);
      this.currentSuite.passed++;
    } catch (error) {
      test.passed = false;
      test.error = error instanceof Error ? error.message : 'Unknown error';
      test.duration = Date.now() - startTime;
      this.currentSuite.tests.push(test);
      this.currentSuite.failed++;
    }
  }

  /**
   * Assert condition
   */
  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Assert equals
   */
  assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message || `Expected ${expected}, got ${actual}`}`);
    }
  }

  /**
   * Assert not null
   */
  assertNotNull<T>(value: T | null | undefined, message?: string): void {
    if (value === null || value === undefined) {
      throw new Error(`Assertion failed: ${message || 'Value should not be null or undefined'}`);
    }
  }

  /**
   * Assert array length
   */
  assertArrayLength<T>(array: T[], expectedLength: number, message?: string): void {
    if (array.length !== expectedLength) {
      throw new Error(`Assertion failed: ${message || `Expected array length ${expectedLength}, got ${array.length}`}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport(): TestReport {
    const totalTests = this.suites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = this.suites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.suites.reduce((sum, suite) => sum + suite.failed, 0);
    const totalDuration = this.suites.reduce((sum, suite) => sum + suite.duration, 0);
    
    return {
      suites: this.suites,
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      success: totalFailed === 0
    };
  }

  /**
   * Print test results
   */
  printResults(): void {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('CASCADE GUARDIAN TEST REPORT');
    console.log('='.repeat(60));
    
    for (const suite of report.suites) {
      console.log(`\n${suite.name}:`);
      console.log('-'.repeat(40));
      
      for (const test of suite.tests) {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        const time = `${test.duration}ms`;
        console.log(`  ${status} ${test.name} (${time})`);
        
        if (!test.passed && test.error) {
          console.log(`    Error: ${test.error}`);
        }
      }
      
      console.log(`\n  Results: ${suite.passed} passed, ${suite.failed} failed (${suite.duration}ms)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.totalPassed}`);
    console.log(`Failed: ${report.totalFailed}`);
    console.log(`Duration: ${report.totalDuration}ms`);
    console.log(`Success: ${report.success ? '✅' : '❌'}`);
    
    if (!report.success) {
      process.exit(1);
    }
  }
}

// ─── Test Utilities ─────────────────────────────────────────────────────────

class TestUtils {
  /**
   * Create temporary directory
   */
  static createTempDir(): string {
    const tempDir = path.join(__dirname, 'temp', `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * Clean up temporary directory
   */
  static cleanupTempDir(tempDir: string): void {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Create test file
   */
  static createTestFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }

  /**
   * Read test file
   */
  static readTestFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Wait for async operations
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create mock configuration
   */
  static createMockConfig(projectPath: string): any {
    return {
      projectRoot: projectPath,
      projectName: 'test-project',
      sourceDirectories: ['src'],
      docsDirectories: ['docs'],
      excludeDirectories: ['node_modules', 'dist'],
      fileExtensions: ['.ts', '.tsx'],
      databasePath: path.join(projectPath, 'test.db'),
      installPath: path.join(projectPath, '.guardian'),
      logPath: path.join(projectPath, '.guardian', 'test.log'),
      suggestionsPath: path.join(projectPath, '.guardian', 'suggestions.md'),
      jsdoc: {
        requiredTags: ['what', 'how', 'why', 'domain', 'tags'],
        minTags: 3,
        minCommentLength: 5
      }
    };
  }
}

// ─── Export Test Framework ─────────────────────────────────────────────────

export { TestRunner, TestUtils };

// ─── Test Runner Entry Point ─────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  
  // Import all test modules
  import('./config.test.js');
  import('./database.test.js');
  import('./indexer.test.js');
  import('./search.test.js');
  import('./performance.test.js');
  import('./integration.test.js');
  
  // Wait for all async tests to complete
  setTimeout(() => {
    runner.printResults();
  }, 5000);
}
