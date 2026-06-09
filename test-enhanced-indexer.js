/**
 * Test script for the enhanced indexer
 */

import { buildEnhancedIndex } from './dist/indexer/enhanced-indexer.js';

async function testEnhancedIndexer() {
  console.log('Testing enhanced indexer...');
  
  try {
    // Build enhanced index
    await buildEnhancedIndex('/Users/toryrahm/Documents/Repos/cascade-guardian');
    console.log('✅ Enhanced index built successfully!');
    
  } catch (error) {
    console.error('❌ Enhanced indexer test failed:', error.message);
    console.error(error.stack);
  }
}

testEnhancedIndexer();
