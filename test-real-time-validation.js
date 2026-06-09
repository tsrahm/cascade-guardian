/**
 * Test script for real-time validation hooks
 */

import { RealTimeFileWatcher } from './dist/validation/file-watcher.js';
import { RealTimeValidator } from './dist/validation/real-time-validator.js';

async function testRealTimeValidation() {
  console.log('Testing Real-time Validation Hooks...');
  
  try {
    // Test 1: Standalone validator
    console.log('\n1. Testing standalone validator...');
    const validator = new RealTimeValidator('/Users/toryrahm/Documents/Repos/cascade-guardian/example-project');
    
    // Test validation with sample code
    const sampleCode = `
/**
 * @what Processes user input for validation
 * @how Uses regex patterns and validation rules
 * @why Ensures data integrity and security
 * @param input The user input to validate
 * @returns boolean indicating validity
 * @sideeffects None
 * @systemlayer Validation
 * @domain input-validation, security
 * @tags validation, input, security
 */
export function validateUserInput(input: string): boolean {
  if (!input || input.length === 0) {
    return false;
  }
  
  // Basic validation logic
  return input.length > 3 && input.match(/^[a-zA-Z0-9]+$/);
}

// Function without JSDoc (should trigger violation)
export function processUser(data: any) {
  return data.transform();
}

// Duplicate function name (should trigger violation)
export function validateUserInput(input: string): boolean {
  return input !== null;
}
`;
    
    const validationResult = await validator.validateFileChange(
      'src/validation/test.ts',
      sampleCode,
      'create'
    );
    
    console.log(`Validation results:`);
    console.log(`  Allowed: ${validationResult.allowed}`);
    console.log(`  Violations: ${validationResult.violations.length}`);
    console.log(`  Suggestions: ${validationResult.suggestions.length}`);
    console.log(`  Confidence: ${(validationResult.confidence * 100).toFixed(1)}%`);
    console.log(`  Processing time: ${validationResult.processing_time}ms`);
    
    // Display violations
    validationResult.violations.forEach((violation, index) => {
      const icon = violation.severity === 'error' ? '❌' : 
                  violation.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`    ${icon} ${violation.message}`);
      if (violation.suggested_fix) {
        console.log(`       💡 ${violation.suggested_fix}`);
      }
    });
    
    // Display suggestions
    validationResult.suggestions.forEach((suggestion, index) => {
      console.log(`    💡 ${suggestion}`);
    });
    
    // Test 2: File watcher setup
    console.log('\n2. Testing file watcher setup...');
    const watcher = new RealTimeFileWatcher('/Users/toryrahm/Documents/Repos/cascade-guardian/example-project', {
      debounceMs: 500,
      enableRealTime: true
    });
    
    // Add validation hooks
    watcher.addHook({
      onValidationComplete: (result) => {
        console.log(`\n🔍 Validation completed for ${result.file_path}:`);
        console.log(`   Violations: ${result.result.violations.length}`);
        console.log(`   Confidence: ${(result.result.confidence * 100).toFixed(1)}%`);
      },
      onViolation: (result) => {
        const icon = result.violation.severity === 'error' ? '❌' : 
                    result.violation.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${result.violation.message}`);
      },
      onError: (error) => {
        console.log(`   ⚠️ Error: ${error.message}`);
      }
    });
    
    console.log('File watcher configured with validation hooks');
    
    // Test 3: Project validation
    console.log('\n3. Testing project-wide validation...');
    const projectResults = await watcher.validateProject();
    console.log(`Project validation completed:`);
    console.log(`   Files processed: ${projectResults.files_processed}`);
    console.log(`   Total violations: ${projectResults.total_violations}`);
    
    // Test 4: Statistics
    console.log('\n4. Testing statistics...');
    const validatorStats = validator.getStats();
    const watcherStats = watcher.getStats();
    
    console.log('Validator Statistics:');
    console.log(`   Total validations: ${validatorStats.total_validations}`);
    console.log(`   Total violations: ${validatorStats.total_violations}`);
    console.log(`   Cache hits: ${validatorStats.cache_hits}`);
    console.log(`   Average time: ${validatorStats.average_time.toFixed(2)}ms`);
    console.log(`   Rules enabled: ${validatorStats.rules_enabled}/${validatorStats.rules_total}`);
    
    console.log('\nWatcher Statistics:');
    console.log(`   Files watched: ${watcherStats.files_watched}`);
    console.log(`   Validations run: ${watcherStats.validations_run}`);
    console.log(`   Violations found: ${watcherStats.violations_found}`);
    console.log(`   Errors encountered: ${watcherStats.errors_encountered}`);
    console.log(`   Is watching: ${watcherStats.is_watching}`);
    console.log(`   Active watchers: ${watcherStats.active_watchers}`);
    
    // Test 5: Rule configuration
    console.log('\n5. Testing rule configuration...');
    
    // Disable DRY violation check
    validator.setRuleEnabled('dry_violation', false);
    console.log('Disabled DRY violation check');
    
    // Configure naming conventions
    validator.configureRule('naming_conventions', {
      enforce_camel_case: true,
      enforce_pascal_case: false
    });
    console.log('Configured naming conventions');
    
    // Re-validate with new rules
    const newValidationResult = await validator.validateFileChange(
      'src/validation/test.ts',
      sampleCode,
      'modify'
    );
    
    console.log(`Re-validation with new rules:`);
    console.log(`   Violations: ${newValidationResult.violations.length} (was ${validationResult.violations.length})`);
    
    // Test 6: Performance test
    console.log('\n6. Testing performance...');
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await validator.validateFileChange(
        `src/test/performance-${i}.ts`,
        sampleCode,
        'create'
      );
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 10;
    
    console.log(`Performance test completed:`);
    console.log(`   10 validations in ${endTime - startTime}ms`);
    console.log(`   Average time: ${avgTime.toFixed(2)}ms per validation`);
    
    // Export results
    console.log('\n7. Exporting validation results...');
    await watcher.exportResults('/tmp/validation-report.json');
    console.log('Validation report exported to /tmp/validation-report.json');
    
    // Cleanup
    validator.close();
    watcher.close();
    
    console.log('\n🎉 Real-time validation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Real-time validation test failed:', error.message);
    console.error(error.stack);
  }
}

testRealTimeValidation();
