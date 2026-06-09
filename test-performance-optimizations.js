/**
 * Test script for performance optimizations
 */

import { IncrementalIndexer } from './dist/performance/incremental-indexer.js';
import { getDatabaseOptimizer, destroyDatabaseOptimizer } from './dist/performance/database-optimizer.js';
import { getEmbeddingCache, destroyEmbeddingCache } from './dist/performance/embedding-cache.js';
import { resolveConfig } from './dist/config.js';

async function testPerformanceOptimizations() {
  console.log('Testing Cascade Guardian performance optimizations...');
  
  try {
    const config = resolveConfig('/Users/toryrahm/Documents/Repos/cascade-guardian/example-project');
    
    // Test 1: Embedding Cache
    console.log('\n1. Testing Embedding Cache...');
    const cache = getEmbeddingCache(50); // 50MB cache
    
    const testTexts = [
      'user authentication service',
      'password hashing function',
      'database connection management',
      'validation helper utility',
      'token generation logic'
    ];
    
    console.log('Preloading embeddings...');
    const startTime = Date.now();
    await cache.preload(testTexts);
    const preloadTime = Date.now() - startTime;
    console.log(`✅ Preload completed in ${preloadTime}ms`);
    
    // Test cache performance
    console.log('Testing cache hits...');
    const cacheTestStart = Date.now();
    for (let i = 0; i < 100; i++) {
      await cache.getEmbedding(testTexts[i % testTexts.length]);
    }
    const cacheTestTime = Date.now() - cacheTestStart;
    console.log(`✅ Cache test completed in ${cacheTestTime}ms`);
    
    const cacheStats = cache.getStats();
    console.log(`Cache stats: ${cacheStats.hits} hits, ${cacheStats.misses} misses, ${(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}% hit rate`);
    
    // Test 2: Database Optimizer
    console.log('\n2. Testing Database Optimizer...');
    const optimizer = getDatabaseOptimizer(config.databasePath);
    
    // Test optimized search
    console.log('Testing optimized search...');
    const searchStart = Date.now();
    for (let i = 0; i < 50; i++) {
      optimizer.optimizedSearch('user', { limit: 10 });
    }
    const searchTime = Date.now() - searchStart;
    console.log(`✅ 50 optimized searches completed in ${searchTime}ms`);
    
    // Test optimized call graph
    console.log('Testing optimized call graph...');
    const callGraphStart = Date.now();
    for (let i = 0; i < 20; i++) {
      optimizer.optimizedGetCallers('hashPassword');
    }
    const callGraphTime = Date.now() - callGraphStart;
    console.log(`✅ 20 call graph queries completed in ${callGraphTime}ms`);
    
    const dbStats = optimizer.getStats();
    console.log(`Database stats: ${dbStats.cache_hits} hits, ${dbStats.cache_misses} misses, ${dbStats.prepared_statements} prepared statements`);
    console.log(`Query time saved: ${dbStats.query_time_saved}ms`);
    
    // Test 3: Incremental Indexer
    console.log('\n3. Testing Incremental Indexer...');
    const indexer = new IncrementalIndexer('/Users/toryrahm/Documents/Repos/cascade-guardian/example-project');
    
    // First run (full index)
    console.log('Running first incremental update...');
    const firstRunStart = Date.now();
    const firstStats = await indexer.updateIndex();
    const firstRunTime = Date.now() - firstRunStart;
    console.log(`✅ First run completed in ${firstRunTime}ms`);
    console.log(`   Files processed: ${firstStats.new_files + firstStats.changed_files}`);
    
    // Second run (should be minimal changes)
    console.log('Running second incremental update...');
    const secondRunStart = Date.now();
    const secondStats = await indexer.updateIndex();
    const secondRunTime = Date.now() - secondRunStart;
    console.log(`✅ Second run completed in ${secondRunTime}ms`);
    console.log(`   Files processed: ${secondStats.new_files + secondStats.changed_files}`);
    
    const indexerStats = indexer.getStats();
    console.log(`Indexer stats: ${indexerStats.total_files} total files, ${indexerStats.indexed_files} indexed`);
    
    // Performance comparison
    console.log('\n📊 Performance Summary:');
    console.log(`   Embedding cache: ${cacheStats.hits} hits, ${(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}% hit rate`);
    console.log(`   Database optimization: ${dbStats.query_time_saved}ms saved, ${dbStats.prepared_statements} prepared statements`);
    console.log(`   Incremental indexing: ${firstRunTime}ms (first) vs ${secondRunTime}ms (second)`);
    console.log(`   Speedup: ${(firstRunTime / secondRunTime).toFixed(1)}x faster on subsequent runs`);
    
    // Cleanup
    indexer.close();
    destroyDatabaseOptimizer();
    destroyEmbeddingCache();
    
    console.log('\n🎉 All performance optimizations tested successfully!');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    console.error(error.stack);
  }
}

testPerformanceOptimizations();
