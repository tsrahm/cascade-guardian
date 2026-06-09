/**
 * Database layer for Cascade Guardian - SQLite with FTS5 and vector embeddings
 */
import Database from 'better-sqlite3';
// ─── Database Schema ─────────────────────────────────────────────────────────
const SCHEMA = `
-- Functions table with full-text search and vector embeddings
CREATE TABLE IF NOT EXISTS functions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  tier INTEGER NOT NULL DEFAULT 2,
  what TEXT,
  how TEXT,
  why TEXT,
  params TEXT,
  returns TEXT,
  sideeffects TEXT,
  systemlayer TEXT,
  domain TEXT,
  tags TEXT,
  inline_comments TEXT,
  embedding BLOB,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS functions_fts USING fts5(
  name,
  what,
  how,
  why,
  params,
  returns,
  sideeffects,
  systemlayer,
  domain,
  tags,
  inline_comments,
  content='functions',
  content_rowid='id'
);

-- Triggers to keep FTS in sync with main table
CREATE TRIGGER IF NOT EXISTS functions_fts_insert AFTER INSERT ON functions BEGIN
  INSERT INTO functions_fts(
    rowid, name, what, how, why, params, returns, sideeffects,
    systemlayer, domain, tags, inline_comments
  ) VALUES (
    new.id, new.name, new.what, new.how, new.why, new.params,
    new.returns, new.sideeffects, new.systemlayer, new.domain,
    new.tags, new.inline_comments
  );
END;

CREATE TRIGGER IF NOT EXISTS functions_fts_delete AFTER DELETE ON functions BEGIN
  INSERT INTO functions_fts(
    functions_fts, rowid, name, what, how, why, params, returns, sideeffects,
    systemlayer, domain, tags, inline_comments
  ) VALUES (
    'delete', old.id, old.name, old.what, old.how, old.why, old.params,
    old.returns, old.sideeffects, old.systemlayer, old.domain,
    old.tags, old.inline_comments
  );
END;

CREATE TRIGGER IF NOT EXISTS functions_fts_update AFTER UPDATE ON functions BEGIN
  INSERT INTO functions_fts(
    functions_fts, rowid, name, what, how, why, params, returns, sideeffects,
    systemlayer, domain, tags, inline_comments
  ) VALUES (
    'delete', old.id, old.name, old.what, old.how, old.why, old.params,
    old.returns, old.sideeffects, old.systemlayer, old.domain,
    old.tags, old.inline_comments
  );
  INSERT INTO functions_fts(
    rowid, name, what, how, why, params, returns, sideeffects,
    systemlayer, domain, tags, inline_comments
  ) VALUES (
    new.id, new.name, new.what, new.how, new.why, new.params,
    new.returns, new.sideeffects, new.systemlayer, new.domain,
    new.tags, new.inline_comments
  );
END;

-- Call graph tables
CREATE TABLE IF NOT EXISTS call_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id INTEGER NOT NULL,
  callee_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  FOREIGN KEY (caller_id) REFERENCES functions(id),
  FOREIGN KEY (callee_id) REFERENCES functions(id),
  UNIQUE(caller_id, callee_id, file_path, line_number)
);

CREATE INDEX IF NOT EXISTS idx_call_edges_caller ON call_edges(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_edges_callee ON call_edges(callee_id);

-- Metadata table
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_functions_name ON functions(name);
CREATE INDEX IF NOT EXISTS idx_functions_file_path ON functions(file_path);
CREATE INDEX IF NOT EXISTS idx_functions_tier ON functions(tier);
CREATE INDEX IF NOT EXISTS idx_functions_domain ON functions(domain);
CREATE INDEX IF NOT EXISTS idx_functions_systemlayer ON functions(systemlayer);
`;
// ─── Database Connection ─────────────────────────────────────────────────────
export function openDatabase(dbPath) {
    const db = new Database(dbPath);
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    // Initialize schema
    db.exec(SCHEMA);
    return db;
}
// ─── Search Functions ───────────────────────────────────────────────────────
export function searchByFTS(db, query, filters = {}) {
    const startTime = Date.now();
    let sql = `
    SELECT f.* FROM functions f
    JOIN functions_fts fts ON f.id = fts.rowid
    WHERE functions_fts MATCH ?
  `;
    const params = [query];
    // Apply filters
    if (filters.domain) {
        sql += ` AND f.domain = ?`;
        params.push(filters.domain);
    }
    if (filters.system_layer) {
        sql += ` AND f.systemlayer = ?`;
        params.push(filters.system_layer);
    }
    if (filters.tier !== undefined) {
        sql += ` AND f.tier = ?`;
        params.push(filters.tier);
    }
    if (filters.has_side_effects !== undefined) {
        sql += ` AND f.sideeffects != ?`;
        params.push(filters.has_side_effects ? 'None' : 'None');
    }
    if (filters.file_path_pattern) {
        sql += ` AND f.file_path LIKE ?`;
        params.push(filters.file_path_pattern);
    }
    if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => `f.tags LIKE ?`).join(' OR ');
        sql += ` AND (${tagConditions})`;
        params.push(...filters.tags.map(tag => `%${tag}%`));
    }
    sql += ` ORDER BY rank, f.name LIMIT ?`;
    params.push(filters.limit || 15);
    const stmt = db.prepare(sql);
    const functions = stmt.all(...params);
    return {
        functions,
        total: functions.length,
        query_time: Date.now() - startTime,
    };
}
export function getCallers(db, functionName, filePath) {
    let sql = `
    SELECT DISTINCT f.* FROM functions f
    JOIN call_edges ce ON f.id = ce.caller_id
    JOIN functions callee ON callee.id = ce.callee_id
    WHERE callee.name = ?
  `;
    const params = [functionName];
    if (filePath) {
        sql += ` AND callee.file_path = ?`;
        params.push(filePath);
    }
    sql += ` ORDER BY f.file_path, f.line_number`;
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}
export function getCallees(db, functionName, filePath) {
    let sql = `
    SELECT DISTINCT f.* FROM functions f
    JOIN call_edges ce ON f.id = ce.callee_id
    JOIN functions caller ON caller.id = ce.caller_id
    WHERE caller.name = ?
  `;
    const params = [functionName];
    if (filePath) {
        sql += ` AND caller.file_path = ?`;
        params.push(filePath);
    }
    sql += ` ORDER BY f.file_path, f.line_number`;
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}
export function getImpact(db, functionName, filePath, maxDepth = 5) {
    // BFS traversal up the call graph
    const visited = new Set();
    const result = [];
    const queue = [];
    // Find the target function
    let sql = `SELECT id FROM functions WHERE name = ?`;
    let params = [functionName];
    if (filePath) {
        sql += ` AND file_path = ?`;
        params.push(filePath);
    }
    const targetStmt = db.prepare(sql);
    const target = targetStmt.get(...params);
    if (!target)
        return result;
    queue.push({ id: target.id, depth: 0 });
    visited.add(target.id);
    while (queue.length > 0) {
        const { id, depth } = queue.shift();
        if (depth >= maxDepth)
            continue;
        // Find all callers
        const callerStmt = db.prepare(`
      SELECT DISTINCT f.* FROM functions f
      JOIN call_edges ce ON f.id = ce.caller_id
      WHERE ce.callee_id = ?
    `);
        const callers = callerStmt.all(id);
        for (const caller of callers) {
            if (!visited.has(caller.id)) {
                visited.add(caller.id);
                result.push(caller);
                queue.push({ id: caller.id, depth: depth + 1 });
            }
        }
    }
    return result;
}
// ─── Metadata Functions ───────────────────────────────────────────────────────
export function getIndexMetadata(db) {
    const metadataStmt = db.prepare(`SELECT * FROM metadata`);
    const metadata = Object.fromEntries(metadataStmt.all().map(row => [row.key, row.value]));
    // Get function counts by tier
    const tierCountsStmt = db.prepare(`
    SELECT tier, COUNT(*) as count FROM functions GROUP BY tier ORDER BY tier
  `);
    const tierCounts = Object.fromEntries(tierCountsStmt.all().map(row => [row.tier, row.count]));
    // Get domain counts
    const domainCountsStmt = db.prepare(`
    SELECT domain, COUNT(*) as count FROM functions 
    WHERE domain IS NOT NULL AND domain != '' 
    GROUP BY domain ORDER BY count DESC
  `);
    const domainCounts = Object.fromEntries(domainCountsStmt.all().map(row => [row.domain, row.count]));
    return {
        ...metadata,
        tier_counts: tierCounts,
        domain_counts: domainCounts,
        last_updated: metadata.last_updated || new Date().toISOString(),
    };
}
export function setMetadata(db, key, value) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)`);
    stmt.run(key, value);
}
// ─── Utility Functions ───────────────────────────────────────────────────────
export function clearAllData(db) {
    db.exec(`
    DELETE FROM functions;
    DELETE FROM call_edges;
    DELETE FROM functions_fts;
    DELETE FROM metadata;
  `);
}
export function getFunctionsByIds(db, ids) {
    if (ids.length === 0)
        return [];
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT * FROM functions WHERE id IN (${placeholders})`);
    return stmt.all(...ids);
}
export function listDomains(db) {
    const stmt = db.prepare(`
    SELECT domain, COUNT(*) as count FROM functions 
    WHERE domain IS NOT NULL AND domain != '' 
    GROUP BY domain ORDER BY count DESC
  `);
    return stmt.all();
}
export function listTags(db, domain, limit = 50) {
    let sql = `
    SELECT tag, COUNT(*) as count FROM (
      SELECT TRIM(tag) as tag FROM (
        SELECT 
          CASE 
            WHEN tags LIKE '%,%' THEN substr(tags, 1, instr(tags, ',') - 1)
            WHEN tags LIKE '% %' THEN substr(tags, 1, instr(tags, ' ') - 1)
            ELSE tags
          END as tag
        FROM functions 
        WHERE tags IS NOT NULL AND tags != ''
  `;
    const params = [];
    if (domain) {
        sql += ` AND domain = ?`;
        params.push(domain);
    }
    sql += `
      )
      WHERE tag != ''
    )
    GROUP BY tag ORDER BY count DESC LIMIT ?
  `;
    params.push(limit);
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}
export function listSystemLayers(db) {
    const stmt = db.prepare(`
    SELECT systemlayer, COUNT(*) as count FROM functions 
    WHERE systemlayer IS NOT NULL AND systemlayer != '' 
    GROUP BY systemlayer ORDER BY count DESC
  `);
    return stmt.all();
}
//# sourceMappingURL=db.js.map