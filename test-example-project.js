/**
 * Test script for the example TypeScript project with Cascade Guardian
 */

import { CascadeGuardian } from './dist/index.js';

async function testExampleProject() {
  console.log('Testing Cascade Guardian with example TypeScript project...');
  
  try {
    const guardian = new CascadeGuardian('/Users/toryrahm/Documents/Repos/cascade-guardian/example-project');
    
    // Build enhanced index for the example project
    console.log('Building index for example project...');
    await guardian.buildIndex();
    console.log('✅ Index built successfully!');
    
    // Test semantic search
    console.log('\nTesting semantic search...');
    const searchResults = await guardian.search('user authentication');
    console.log(`Found ${searchResults.functions.length} functions related to 'user authentication':`);
    searchResults.functions.forEach((func, index) => {
      console.log(`  ${index + 1}. ${func.name} (${func.file_path}:${func.line_number})`);
      if (func.what) console.log(`     Purpose: ${func.what}`);
      if (func.domain) console.log(`     Domain: ${func.domain}`);
    });
    
    // Test domain analysis
    console.log('\nTesting domain analysis...');
    const domains = await guardian.listDomains();
    console.log('Business domains found:');
    domains.domains.forEach((domain, index) => {
      console.log(`  ${index + 1}. ${domain.domain} (${domain.count} functions)`);
    });
    
    // Test impact analysis
    console.log('\nTesting impact analysis...');
    const impact = await guardian.getImpact('createUser');
    console.log(`Impact analysis for 'createUser':`);
    console.log(`  Affected functions: ${impact.total_affected}`);
    console.log(`  Risk level: ${impact.risk_level}`);
    
    // Test pattern analysis
    console.log('\nTesting architectural layers...');
    const layers = await guardian.listSystemLayers();
    console.log('Architectural layers found:');
    layers.system_layers.forEach((layer, index) => {
      console.log(`  ${index + 1}. ${layer.systemlayer} (${layer.count} functions)`);
    });
    
    // Test call graph functionality
    console.log('\nTesting call graph analysis...');
    const callers = await guardian.getCallers('hashPassword');
    console.log(`Functions calling 'hashPassword': ${callers.callers.length}`);
    callers.callers.forEach((caller, index) => {
      console.log(`  ${index + 1}. ${caller.name} (${caller.file_path}:${caller.line_number})`);
    });
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Functions indexed: ${searchResults.total || 0}`);
    console.log(`   - Business domains: ${domains.domains.length}`);
    console.log(`   - Architectural layers: ${layers.system_layers.length}`);
    console.log(`   - Call graph relationships: ${callers.callers.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testExampleProject();
