import { resolveConfig } from './dist/config.js';
import { openDatabase } from './dist/database/db.js';
import { getEmbeddingCache } from './dist/performance/embedding-cache.js';

async function healthCheck(projectPath = '.') {
  try {
    const config = resolveConfig(projectPath);
    const db = openDatabase(config.databasePath);
    const cache = getEmbeddingCache(50);
    
    const functionCount = db.prepare('SELECT COUNT(*) as count FROM functions').get().count;
    const indexedCount = db.prepare('SELECT COUNT(*) as count FROM functions WHERE embedding IS NOT NULL').get().count;
    
    console.log(`✅ Health Check for ${config.projectName}:`);
    console.log(`   Total functions: ${functionCount}`);
    console.log(`   Indexed functions: ${indexedCount}`);
    console.log(`   Index coverage: ${(indexedCount / functionCount * 100).toFixed(1)}%`);
    console.log(`   Cache status: Ready`);
    
    db.close();
    cache.destroy();
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
