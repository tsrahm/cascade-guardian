/**
 * Test script for improved error handling and logging
 */

import { logger, LogCategory, CascadeError, DatabaseError, SearchError } from './dist/logging/logger.js';
import { errorHandler, handleAsync, handleSync, withErrorHandling } from './dist/error/error-handler.js';

async function testErrorHandling() {
  console.log('Testing Improved Error Handling and Logging...');
  
  try {
    // Test 1: Basic logging
    console.log('\n1. Testing basic logging...');
    logger.debug(LogCategory.SYSTEM, 'Debug message for testing');
    logger.info(LogCategory.DATABASE, 'Database connection established');
    logger.warn(LogCategory.VALIDATION, 'Validation warning: missing JSDoc');
    logger.error(LogCategory.SEARCH, 'Search operation failed', new Error('Test error'));
    
    // Test 2: Performance logging
    console.log('\n2. Testing performance logging...');
    const timer = logger.timer(LogCategory.PERFORMANCE, 'test operation');
    await new Promise(resolve => setTimeout(resolve, 100));
    timer();
    
    // Test 3: Error handling with recovery
    console.log('\n3. Testing error handling with recovery...');
    
    // Test successful operation
    const result1 = await handleAsync(
      async () => {
        logger.info(LogCategory.SYSTEM, 'Operation starting');
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      },
      {
        operation: 'test-operation',
        component: 'test-component'
      },
      {
        fallbackValue: 'fallback'
      }
    );
    console.log(`  Result: ${result1}`);
    
    // Test failed operation with recovery
    const result2 = await handleAsync(
      async () => {
        logger.info(LogCategory.SYSTEM, 'Failing operation starting');
        throw new DatabaseError('Connection timeout');
      },
      {
        operation: 'failing-operation',
        component: 'test-component'
      },
      {
        fallbackValue: 'recovered-value',
        maxRetries: 2
      }
    );
    console.log(`  Recovered result: ${result2}`);
    
    // Test 4: Custom error types
    console.log('\n4. Testing custom error types...');
    
    try {
      throw new SearchError('Index not found', 'search operation', { query: 'test' });
    } catch (error) {
      console.log(`  Caught error: ${error.constructor.name}`);
      console.log(`  Error message: ${error.message}`);
      console.log(`  Error context: ${error.context}`);
    }
    
    // Test 5: Wrapped functions
    console.log('\n5. Testing wrapped functions...');
    
    const wrappedFunction = errorHandler.wrapFunction(
      (shouldFail = false) => {
        if (shouldFail) {
          throw new Error('Intentional failure');
        }
        return 'success';
      },
      {
        operation: 'wrapped-function',
        component: 'test-wrapper'
      },
      {
        fallbackValue: 'fallback-success'
      }
    );
    
    const result3 = wrappedFunction(false);
    console.log(`  Wrapped function success: ${result3}`);
    
    const result4 = wrappedFunction(true);
    console.log(`  Wrapped function fallback: ${result4}`);
    
    // Test 6: Error statistics
    console.log('\n6. Testing error statistics...');
    const stats = errorHandler.getErrorStats();
    console.log(`  Total error reports: ${stats.totalReports}`);
    console.log(`  Recent error reports: ${stats.recentReports.length}`);
    console.log(`  Error counts:`, stats.errorCounts);
    console.log(`  Component counts:`, stats.componentCounts);
    console.log(`  Recovery stats:`, stats.recoveryStats);
    
    // Test 7: Logger statistics
    console.log('\n7. Testing logger statistics...');
    const loggerStats = logger.getStats();
    console.log(`  Total logs: ${loggerStats.totalLogs}`);
    console.log(`  Error count: ${loggerStats.errorCount}`);
    console.log(`  Warn count: ${loggerStats.warnCount}`);
    console.log(`  Uptime: ${loggerStats.uptimeFormatted}`);
    console.log(`  Logs per second: ${loggerStats.logsPerSecond}`);
    console.log(`  Error rate: ${loggerStats.errorRate}`);
    
    // Test 8: Export functionality
    console.log('\n8. Testing export functionality...');
    await logger.exportLogs('/tmp/cascade-guardian-logs.json');
    await errorHandler.exportErrorReports('/tmp/cascade-guardian-errors.json');
    console.log('  Logs and errors exported successfully');
    
    // Test 9: Recent logs
    console.log('\n9. Testing recent logs...');
    const recentLogs = logger.getRecentLogs(5);
    console.log(`  Recent logs count: ${recentLogs.length}`);
    recentLogs.forEach((log, index) => {
      console.log(`    ${index + 1}. [${log.level}] ${log.category}: ${log.message}`);
    });
    
    // Test 10: Error reports
    console.log('\n10. Testing error reports...');
    const recentReports = errorHandler.getRecentReports(3);
    console.log(`  Recent error reports: ${recentReports.length}`);
    recentReports.forEach((report, index) => {
      console.log(`    ${index + 1}. ${report.error.name}: ${report.error.message}`);
      console.log(`       Component: ${report.context.component}`);
      console.log(`       Recovery attempted: ${report.recoveryAttempted}`);
    });
    
    // Test 11: Performance monitoring
    console.log('\n11. Testing performance monitoring...');
    const perfTimer = logger.timer(LogCategory.PERFORMANCE, 'performance-test');
    
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random() * 100;
    }
    
    perfTimer();
    
    // Test 12: Memory usage monitoring
    console.log('\n12. Testing memory usage...');
    const memUsage = process.memoryUsage();
    console.log(`  Memory used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Memory total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Memory percentage: ${(memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(1)}%`);
    
    // Test 13: Configuration
    console.log('\n13. Testing logger configuration...');
    logger.configure({
      level: 0, // DEBUG
      format: 'text',
      enableColors: true,
      destinations: [
        { type: 'console', config: { enableColors: true } },
        { type: 'memory', config: { maxEntries: 500 } }
      ]
    });
    logger.debug(LogCategory.SYSTEM, 'This debug message should now be visible');
    
    // Test 14: Error recovery strategies
    console.log('\n14. Testing custom recovery strategies...');
    
    errorHandler.addRecoveryStrategy('TestError', {
      canRecover: true,
      maxRetries: 3,
      recoveryAction: async (error) => {
        console.log(`  Custom recovery for ${error?.message}`);
        return { recovered: true, customAction: true };
      },
      fallbackValue: 'custom-fallback'
    });
    
    class TestError extends CascadeError {
      constructor(message) {
        super(LogCategory.VALIDATION, message, 'test-operation');
        this.name = 'TestError';
      }
    }
    
    const customResult = await handleAsync(
      async () => {
        throw new TestError('Custom test error');
      },
      {
        operation: 'custom-error-test',
        component: 'test-module'
      }
    );
    console.log(`  Custom recovery result: ${customResult}`);
    
    // Test 15: Cleanup
    console.log('\n15. Testing cleanup...');
    logger.clearMemoryLogs();
    errorHandler.clearReports();
    console.log('  Memory logs and error reports cleared');
    
    console.log('\n🎉 Error handling and logging test completed successfully!');
    
    // Final statistics
    const finalStats = logger.getStats();
    const finalErrorStats = errorHandler.getErrorStats();
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Logger: ${finalStats.totalLogs} logs, ${finalStats.errorCount} errors`);
    console.log(`   Error Handler: ${finalErrorStats.totalReports} reports`);
    console.log(`   Performance: ${finalStats.logsPerSecond} logs/sec`);
    console.log(`   Uptime: ${finalStats.uptimeFormatted}`);
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    logger.close();
  }
}

testErrorHandling();
