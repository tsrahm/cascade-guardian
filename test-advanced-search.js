/**
 * Test script for advanced semantic search
 */

import { AdvancedSemanticSearch } from './dist/search/advanced-semantic-search.js';
import { resolveConfig } from './dist/config.js';

async function testAdvancedSearch() {
  console.log('Testing Advanced Semantic Search...');
  
  try {
    const config = resolveConfig('/Users/toryrahm/Documents/Repos/cascade-guardian/example-project');
    const search = new AdvancedSemanticSearch(config.databasePath);
    
    // Test 1: Basic search
    console.log('\n1. Testing basic search...');
    const basicResults = await search.search({
      query: 'user authentication',
      limit: 10
    });
    
    console.log(`Found ${basicResults.length} results for 'user authentication':`);
    basicResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} (${result.file_path}:${result.line_number})`);
      console.log(`     Score: ${result.score.toFixed(3)}, Type: ${result.match_type}, Confidence: ${result.confidence.toFixed(3)}`);
      if (result.what) console.log(`     Purpose: ${result.what}`);
    });
    
    // Test 2: Weighted search with domain filter
    console.log('\n2. Testing weighted search with domain filter...');
    const weightedResults = await search.search({
      query: 'password',
      domain: 'security',
      weights: {
        keyword: 0.3,
        semantic: 0.7,
        name_match: 0.25,
        domain_match: 0.2
      },
      limit: 5
    });
    
    console.log(`Found ${weightedResults.length} results for 'password' in 'security' domain:`);
    weightedResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} (${result.file_path}:${result.line_number})`);
      console.log(`     Score: ${result.score.toFixed(3)}, Domain: ${result.domain || 'none'}`);
    });
    
    // Test 3: Contextual search
    console.log('\n3. Testing contextual search...');
    const contextualTerms = await search.contextualSearch('validation', 'user input processing');
    console.log(`Contextual terms for 'validation' in 'user input processing':`);
    contextualTerms.forEach((term, index) => {
      console.log(`  ${index + 1}. ${term}`);
    });
    
    // Test 4: High confidence search
    console.log('\n4. Testing high confidence search...');
    const highConfidenceResults = await search.search({
      query: 'hash',
      min_confidence: 0.7,
      boost_recent: true,
      limit: 5
    });
    
    console.log(`Found ${highConfidenceResults.length} high-confidence results for 'hash':`);
    highConfidenceResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} (${result.file_path}:${result.line_number})`);
      console.log(`     Confidence: ${result.confidence.toFixed(3)}, Tier: ${result.tier}`);
    });
    
    // Test 5: Compare with regular search
    console.log('\n5. Comparing advanced vs regular search...');
    
    // Advanced search
    const advancedResults = await search.search({
      query: 'user',
      weights: { keyword: 0.4, semantic: 0.6 },
      limit: 10
    });
    
    // Regular search (keyword only)
    const keywordOnlyResults = await search.search({
      query: 'user',
      weights: { keyword: 1.0, semantic: 0.0 },
      limit: 10
    });
    
    console.log(`Advanced search: ${advancedResults.length} results`);
    console.log(`Keyword-only search: ${keywordOnlyResults.length} results`);
    
    // Show top 3 from each for comparison
    console.log('\nAdvanced search top 3:');
    advancedResults.slice(0, 3).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - Score: ${result.score.toFixed(3)}, Type: ${result.match_type}`);
    });
    
    console.log('\nKeyword-only search top 3:');
    keywordOnlyResults.slice(0, 3).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} - Score: ${result.score.toFixed(3)}, Type: ${result.match_type}`);
    });
    
    // Get search statistics
    const stats = search.getSearchStats();
    console.log('\n📊 Search Statistics:');
    console.log(`   Total functions: ${stats.total_functions}`);
    console.log(`   Indexed functions: ${stats.indexed_functions}`);
    console.log(`   Cache hits: ${stats.cache_stats.hits}`);
    console.log(`   Cache misses: ${stats.cache_stats.misses}`);
    console.log(`   Cache hit rate: ${(stats.cache_stats.hits / (stats.cache_stats.hits + stats.cache_stats.misses) * 100).toFixed(1)}%`);
    
    search.close();
    
    console.log('\n🎉 Advanced semantic search test completed successfully!');
    
  } catch (error) {
    console.error('❌ Advanced search test failed:', error.message);
    console.error(error.stack);
  }
}

testAdvancedSearch();
