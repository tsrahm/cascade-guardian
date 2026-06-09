/**
 * Configuration system tests
 */

import path from 'path';
import { TestRunner, TestUtils } from './test-runner.js';
import { resolveConfig, detectProjectRoot } from '../src/config.js';

const runner = new TestRunner();

runner.suite('Configuration System', () => {
  runner.test('should detect project root from git', () => {
    const projectRoot = detectProjectRoot('/Users/toryrahm/Documents/Repos/cascade-guardian');
    runner.assertNotNull(projectRoot);
    runner.assert(projectRoot.includes('cascade-guardian'), 'Should detect cascade-guardian project');
  });

  runner.test('should detect project name from package.json', () => {
    const tempDir = TestUtils.createTempDir();
    try {
      TestUtils.createTestFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' })
      );
      
      const projectName = detectProjectName(tempDir);
      runner.assertEqual(projectName, 'test-project');
    } finally {
      TestUtils.cleanupTempDir(tempDir);
    }
  });

  runner.test('should resolve configuration with defaults', () => {
    const tempDir = TestUtils.createTempDir();
    try {
      const config = resolveConfig(tempDir);
      
      runner.assertNotNull(config);
      runner.assertEqual(config.projectName, 'cascade-guardian');
      runner.assertArrayLength(config.sourceDirectories, 1);
      runner.assertEqual(config.sourceDirectories[0], 'src');
      runner.assertArrayLength(config.fileExtensions, 2);
    } finally {
      TestUtils.cleanupTempDir(tempDir);
    }
  });

  runner.test('should load custom configuration', () => {
    const tempDir = TestUtils.createTempDir();
    try {
      TestUtils.createTestFile(
        path.join(tempDir, 'guardian.config.json'),
        JSON.stringify({
          sourceDirectories: ['lib', 'src'],
          excludeDirectories: ['node_modules', 'build'],
          jsdoc: {
            requiredTags: ['what', 'how', 'why'],
            minTags: 3
          }
        })
      );
      
      const config = resolveConfig(tempDir);
      
      runner.assertArrayLength(config.sourceDirectories, 2);
      runner.assertArrayLength(config.excludeDirectories, 2);
      runner.assertArrayLength(config.jsdoc.requiredTags, 3);
    } finally {
      TestUtils.cleanupTempDir(tempDir);
    }
  });
});

export default runner;
