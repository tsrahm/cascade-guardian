/**
 * Test script for the call graph analyzer
 */

import { CallGraphAnalyzer } from './dist/call-graph/call-graph-analyzer.js';
import { resolveConfig } from './dist/config.js';

async function testCallGraphAnalyzer() {
  console.log('Testing call graph analyzer...');
  
  try {
    const config = resolveConfig('/Users/toryrahm/Documents/Repos/cascade-guardian');
    const analyzer = new CallGraphAnalyzer(config.databasePath);
    
    // Build call graph
    await analyzer.buildCallGraph(config.projectRoot, config.sourceDirectories);
    console.log('✅ Call graph built successfully!');
    
    // Analyze call graph
    const analysis = analyzer.analyzeCallGraph();
    console.log('✅ Call graph analysis complete!');
    console.log(`   - Total functions: ${analysis.total_functions}`);
    console.log(`   - Total calls: ${analysis.total_calls}`);
    console.log(`   - Max depth: ${analysis.max_depth}`);
    console.log(`   - Circular dependencies: ${analysis.circular_dependencies.length}`);
    console.log(`   - Hotspots: ${analysis.hotspots.length}`);
    
    // Test impact analysis
    const impact = analyzer.getImpactAnalysis('resolveConfig');
    console.log('✅ Impact analysis complete!');
    console.log(`   - Affected functions: ${impact.total_affected}`);
    console.log(`   - Risk level: ${impact.risk_level}`);
    
    analyzer.close();
    
  } catch (error) {
    console.error('❌ Call graph analyzer test failed:', error.message);
    console.error(error.stack);
  }
}

testCallGraphAnalyzer();
