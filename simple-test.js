/**
 * Simple test for Cascade Guardian integration
 */

import { CascadeGuardian } from './dist/index.js';

async function simpleTest() {
  console.log('Testing Cascade Guardian...');
  
  try {
    const guardian = new CascadeGuardian('/Users/toryrahm/Documents/Repos/cascade-guardian');
    
    // Test basic search
    const results = await guardian.search('config');
    console.log('✅ Search working:', results.functions.length, 'results');
    
    // Test domains
    const domains = await guardian.listDomains();
    console.log('✅ Domains working:', domains.domains.length, 'domains found');
    
    // Test tags
    const tags = await guardian.listTags();
    console.log('✅ Tags working:', tags.tags.length, 'tags found');
    
    console.log('🎉 Basic functionality working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();
