/**
 * Simplified code indexer for Cascade Guardian
 */
import fs from 'fs';
import path from 'path';
import { resolveConfig, ensureDirectories, registerProject } from '../config.js';
import { openDatabase, clearAllData, setMetadata } from '../database/db.js';
// ─── Simple Index Building ─────────────────────────────────────────────────────
export async function buildSimpleIndex(projectPath) {
    const config = resolveConfig(projectPath);
    ensureDirectories(config);
    registerProject(config);
    console.log(`Building simple index for project: ${config.projectName}`);
    const db = openDatabase(config.databasePath);
    try {
        // Clear existing data
        clearAllData(db);
        // Scan all TypeScript files
        const allFiles = [];
        for (const sourceDir of config.sourceDirectories) {
            const dirPath = path.join(config.projectRoot, sourceDir);
            if (fs.existsSync(dirPath)) {
                const files = getAllTypeScriptFiles(dirPath, config.excludeDirectories, config.fileExtensions);
                allFiles.push(...files);
            }
        }
        console.log(`Found ${allFiles.length} TypeScript files`);
        // Insert basic file information
        await insertFileRecords(db, allFiles, config);
        // Update metadata
        setMetadata(db, 'last_updated', new Date().toISOString());
        setMetadata(db, 'total_files', allFiles.length.toString());
        console.log('Simple index built successfully!');
    }
    finally {
        db.close();
    }
}
// ─── File Scanning ───────────────────────────────────────────────────────────
function getAllTypeScriptFiles(dirPath, excludeDirs, extensions) {
    const files = [];
    function scanDirectory(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                // Skip excluded directories
                if (excludeDirs.includes(entry.name))
                    continue;
                scanDirectory(fullPath);
            }
            else if (entry.isFile()) {
                // Check file extension
                const ext = path.extname(entry.name);
                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }
    scanDirectory(dirPath);
    return files;
}
// ─── Database Operations ─────────────────────────────────────────────────────
async function insertFileRecords(db, files, config) {
    const stmt = db.prepare(`
    INSERT INTO functions (
      name, file_path, line_number, tier, what, how, why, domain, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const transaction = db.transaction(() => {
        for (const filePath of files) {
            const relativePath = path.relative(config.projectRoot, filePath);
            const fileName = path.basename(filePath, path.extname(filePath));
            // Insert a basic record for each file
            stmt.run(fileName, // name
            relativePath, // file_path
            1, // line_number
            3, // tier (documentation)
            `File: ${fileName}`, // what
            `TypeScript source file`, // how
            `Source code file in project`, // why
            'source-code', // domain
            'file,typescript,source' // tags
            );
        }
    });
    transaction();
}
// ─── Export Function Extraction (Basic) ───────────────────────────────────────
export async function extractBasicFunctions(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const functions = [];
    // Simple regex-based function extraction
    const functionPatterns = [
        /export\s+function\s+(\w+)\s*\(/g,
        /export\s+const\s+(\w+)\s*=\s*\(/g,
        /export\s+async\s+function\s+(\w+)\s*\(/g,
        /export\s+async\s+const\s+(\w+)\s*=\s*\(/g,
    ];
    const lines = content.split('\n');
    for (const pattern of functionPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const functionName = match[1];
            const position = match.index;
            const lineNumber = content.substring(0, position).split('\n').length;
            // Extract JSDoc comment if present
            const jsDocMatch = extractJSDoc(content, position);
            functions.push({
                name: functionName,
                file_path: filePath,
                line_number: lineNumber,
                tier: jsDocMatch ? 1 : 2,
                what: jsDocMatch?.what,
                how: jsDocMatch?.how,
                why: jsDocMatch?.why,
                domain: jsDocMatch?.domain,
                tags: jsDocMatch?.tags,
            });
        }
    }
    return functions;
}
function extractJSDoc(content, functionPosition) {
    // Look backwards from function position for JSDoc comment
    const beforeFunction = content.substring(0, functionPosition);
    const jsDocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\//);
    if (!jsDocMatch)
        return null;
    const jsDocText = jsDocMatch[1];
    const tags = {};
    // Extract common JSDoc tags
    const tagPatterns = {
        what: /@what\s+(.+)/i,
        how: /@how\s+(.+)/i,
        why: /@why\s+(.+)/i,
        domain: /@domain\s+(.+)/i,
        tags: /@tags\s+(.+)/i,
    };
    for (const [tag, pattern] of Object.entries(tagPatterns)) {
        const match = jsDocText.match(pattern);
        if (match) {
            tags[tag] = match[1].trim();
        }
    }
    return tags;
}
//# sourceMappingURL=simple-indexer.js.map