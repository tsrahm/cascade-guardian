/**
 * Test script for JavaScript file indexer
 */

import { JavaScriptIndexer } from './dist/indexer/javascript-indexer.js';
import fs from 'fs';
import path from 'path';

async function testJavaScriptIndexer() {
  console.log('Testing JavaScript File Indexer...');
  
  try {
    // Create a temporary directory with JavaScript files
    const tempDir = '/tmp/cascade-guardian-js-test';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Test 1: Create sample JavaScript files
    console.log('\n1. Creating sample JavaScript files...');
    
    // ES6 module file
    const es6Content = `
/**
 * @what Handles user authentication
 * @how Uses JWT tokens and bcrypt for password hashing
 * @why Provides secure user authentication and authorization
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<object>} Authentication result with token
 * @sideeffects Creates session token
 * @systemlayer Business Logic
 * @domain authentication, security
 * @tags auth, jwt, security
 */
export async function authenticateUser(email, password) {
  // Hash password comparison
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate JWT token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  
  return { user: { id: user.id, email: user.email }, token };
}

/**
 * @what Creates a new user account
 * @how Validates input and hashes password before storing
 * @why Enables user registration with secure password storage
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Created user information
 * @sideeffects Creates database record
 * @systemlayer Business Logic
 * @domain user-management
 * @tags user, registration, create
 */
export const createUser = async (userData) => {
  const { email, password, name } = userData;
  
  // Validate input
  if (!email || !password || !name) {
    throw new Error('Missing required fields');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user in database
  const user = await db.users.create({
    email,
    passwordHash,
    name,
    createdAt: new Date()
  });
  
  return { id: user.id, email: user.email, name: user.name };
};

class UserService {
  /**
   * @what Manages user-related operations
   * @how Provides methods for CRUD operations on users
   * @why Centralizes user management logic
   * @domain user-management
   * @tags user, service, crud
   */
  constructor(database) {
    this.db = database;
  }
  
  async findById(id) {
    return await this.db.users.findByPk(id);
  }
  
  async updateProfile(id, updates) {
    return await this.db.users.update(updates, { where: { id } });
  }
}

export default UserService;
`;

    // CommonJS module file
    const commonjsContent = `
/**
 * @what Validates user input data
 * @how Uses regex patterns and validation rules
 * @why Ensures data integrity and security
 * @param {object} data - Input data to validate
 * @returns {boolean} Validation result
 * @sideeffects None
 * @systemlayer Validation
 * @domain input-validation
 * @tags validation, input, security
 */
function validateUserInput(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const required = ['email', 'password'];
  for (const field of required) {
    if (!data[field]) {
      return false;
    }
  }
  
  // Email validation
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return false;
  }
  
  // Password validation
  if (data.password.length < 8) {
    return false;
  }
  
  return true;
}

/**
 * @what Formats user data for API response
 * @how Removes sensitive information and formats dates
 * @why Provides consistent API responses
 * @param {object} user - User object from database
 * @returns {object} Formatted user data
 * @sideeffects None
 * @systemlayer Utility
 * @domain formatting
 * @tags user, format, api
 */
const formatUserData = (user) => {
  const { passwordHash, ...safeUser } = user;
  
  return {
    ...safeUser,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null
  };
};

// Export functions
module.exports = {
  validateUserInput,
  formatUserData,
  hashPassword: async (password) => {
    return await bcrypt.hash(password, 10);
  },
  verifyToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
};
`;

    // UMD module file
    const umdContent = `
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else if (typeof module === 'object' && module.exports) {
    factory(module.exports);
  } else {
    factory((root.utils = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {
  
  /**
   * @what Utility functions for string manipulation
   * @how Provides various string processing methods
   * @why Common string operations needed across the application
   * @domain utilities
   * @tags string, utils, helpers
   */
  const stringUtils = {
    capitalize: (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    slugify: (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\\s+/g, '-')
        .replace(/-+/g, '-');
    },
    
    truncate: (str, length) => {
      return str.length > length ? str.substring(0, length) + '...' : str;
    }
  };
  
  exports.stringUtils = stringUtils;
  
}));
`;

    // Write test files
    fs.writeFileSync(path.join(tempDir, 'auth-service.mjs'), es6Content);
    fs.writeFileSync(path.join(tempDir, 'validator.js'), commonjsContent);
    fs.writeFileSync(path.join(tempDir, 'utils.js'), umdContent);

    console.log('  Created auth-service.mjs (ES6 module)');
    console.log('  Created validator.js (CommonJS module)');
    console.log('  Created utils.js (UMD module)');

    // Test 2: Initialize JavaScript indexer
    console.log('\n2. Initializing JavaScript indexer...');
    const indexer = new JavaScriptIndexer();
    
    console.log(`  Supported extensions: ${indexer.getSupportedExtensions().join(', ')}`);

    // Test 3: Index the directory
    console.log('\n3. Indexing JavaScript files...');
    const results = await indexer.indexDirectory(tempDir);
    
    console.log(`  Files processed: ${results.stats.files_processed}`);
    console.log(`  Functions extracted: ${results.stats.functions_extracted}`);
    console.log(`  Classes extracted: ${results.stats.classes_extracted}`);
    console.log(`  Modules detected: ${results.stats.modules_detected}`);

    // Test 4: Display extracted functions
    console.log('\n4. Extracted functions:');
    results.functions.forEach((func, index) => {
      console.log(`  ${index + 1}. ${func.name} (${func.type})`);
      console.log(`     File: ${path.basename(func.file_path)}`);
      console.log(`     Line: ${func.line_number}`);
      console.log(`     Tier: ${func.tier}`);
      console.log(`     Exported: ${func.is_exported}`);
      console.log(`     Async: ${func.is_async}`);
      console.log(`     Module: ${func.module_type}`);
      if (func.what) console.log(`     Purpose: ${func.what}`);
      if (func.domain) console.log(`     Domain: ${func.domain}`);
      if (func.tags) console.log(`     Tags: ${func.tags}`);
      console.log('');
    });

    // Test 5: Display extracted classes
    console.log('\n5. Extracted classes:');
    results.classes.forEach((cls, index) => {
      console.log(`  ${index + 1}. ${cls.name}`);
      console.log(`     File: ${path.basename(cls.file_path)}`);
      console.log(`     Line: ${cls.line_number}`);
      console.log(`     Exported: ${cls.is_exported}`);
      if (cls.extends) console.log(`     Extends: ${cls.extends}`);
      if (cls.methods.length > 0) console.log(`     Methods: ${cls.methods.join(', ')}`);
      if (cls.what) console.log(`     Purpose: ${cls.what}`);
      console.log('');
    });

    // Test 6: Display module information
    console.log('\n6. Module information:');
    results.modules.forEach((module, index) => {
      console.log(`  ${index + 1}. ${path.basename(module.file_path)} (${module.type})`);
      if (module.imports.length > 0) console.log(`     Imports: ${module.imports.join(', ')}`);
      if (module.exports.length > 0) console.log(`     Exports: ${module.exports.slice(0, 3).join(', ')}${module.exports.length > 3 ? '...' : ''}`);
      console.log('');
    });

    // Test 7: Test individual file indexing
    console.log('\n7. Testing individual file indexing...');
    const es6Results = await indexer.indexFile(path.join(tempDir, 'auth-service.mjs'));
    console.log(`  ES6 file: ${es6Results.functions.length} functions, ${es6Results.classes.length} classes`);
    
    const commonjsResults = await indexer.indexFile(path.join(tempDir, 'validator.js'));
    console.log(`  CommonJS file: ${commonjsResults.functions.length} functions, ${commonjsResults.classes.length} classes`);

    // Test 8: Test file support checking
    console.log('\n8. Testing file support...');
    console.log(`  auth-service.mjs supported: ${indexer.isFileSupported('auth-service.mjs')}`);
    console.log(`  validator.js supported: ${indexer.isFileSupported('validator.js')}`);
    console.log(`  utils.js supported: ${indexer.isFileSupported('utils.js')}`);
    console.log(`  test.ts supported: ${indexer.isFileSupported('test.ts')}`);

    // Test 9: Test extension management
    console.log('\n9. Testing extension management...');
    indexer.addSupportedExtension('.jsx');
    console.log(`  Added .jsx support`);
    console.log(`  Current extensions: ${indexer.getSupportedExtensions().join(', ')}`);

    // Test 10: Performance test
    console.log('\n10. Performance test...');
    const perfStart = Date.now();
    
    // Index multiple times to test performance
    for (let i = 0; i < 5; i++) {
      await indexer.indexDirectory(tempDir);
    }
    
    const perfEnd = Date.now();
    console.log(`  5 indexing operations completed in ${perfEnd - perfStart}ms`);
    console.log(`  Average: ${((perfEnd - perfStart) / 5).toFixed(2)}ms per operation`);

    // Cleanup
    console.log('\n11. Cleanup...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('  Temporary files cleaned up');

    console.log('\n🎉 JavaScript indexer test completed successfully!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total functions indexed: ${results.functions.length}`);
    console.log(`   Total classes indexed: ${results.classes.length}`);
    console.log(`   Module types detected: ${[...new Set(results.modules.map(m => m.type))].join(', ')}`);
    console.log(`   Documentation coverage: ${results.functions.filter(f => f.tier === 1).length}/${results.functions.length} well-documented`);
    console.log(`   Exported functions: ${results.functions.filter(f => f.is_exported).length}/${results.functions.length}`);
    console.log(`   Async functions: ${results.functions.filter(f => f.is_async).length}/${results.functions.length}`);

  } catch (error) {
    console.error('❌ JavaScript indexer test failed:', error.message);
    console.error(error.stack);
  }
}

testJavaScriptIndexer();
