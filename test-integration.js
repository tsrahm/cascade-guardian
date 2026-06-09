/**
 * Test script for Cascade Guardian devin/cascade integration
 */

import { initializeCascadeTools } from './dist/devin-integration/tool-registry.js';
import { initializeValidationHooks } from './dist/devin-integration/validation-hooks.js';
import { initializeCascadeSkills } from './dist/devin-integration/skills.js';

async function testIntegration() {
  console.log('Testing Cascade Guardian integration...');
  
  try {
    // Test tool registry
    const tools = initializeCascadeTools('/Users/toryrahm/Documents/Repos/cascade-guardian');
    console.log('✅ Tool registry initialized');
    
    // Test basic search
    const searchResults = await tools.executeTool('search_codebase', {
      query: 'database',
      limit: 5
    });
    console.log('✅ Search tool working:', searchResults.functions.length, 'results found');
    
    // Test validation hooks
    const hooks = initializeValidationHooks('/Users/toryrahm/Documents/Repos/cascade-guardian');
    console.log('✅ Validation hooks initialized');
    
    // Test validation with a simple edit
    const validationResult = await hooks.validateEdit({
      file_path: 'src/test.ts',
      new_string: 'export function testFunction() { return true; }'
    });
    console.log('✅ Validation hook working:', validationResult.allowed ? 'allowed' : 'blocked');
    
    // Test skills
    const skills = initializeCascadeSkills('/Users/toryrahm/Documents/Repos/cascade-guardian');
    console.log('✅ Skills initialized');
    
    // Test audit skill
    const auditResult = await skills.auditCodebase();
    console.log('✅ Audit skill working, generated', auditResult.split('\n').length, 'lines');
    
    console.log('\n🎉 All integration components working successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

testIntegration();
