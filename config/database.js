// Cloudflare D1 Database Configuration
// For local development, we use better-sqlite3 which is D1-compatible
// For production, this will be replaced by the D1 binding in the Worker

let db;
let isD1 = false;

// Check if running in Cloudflare Workers environment
if (typeof globalThis.DB !== 'undefined') {
  // Running in Cloudflare Workers with D1 binding
  db = globalThis.DB;
  isD1 = true;
  console.log('✅ Connected to Cloudflare D1 Database');
} else {
  // Local development - use better-sqlite3
  const Database = require('better-sqlite3');
  const path = require('path');
  require('dotenv').config();
  
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
  db = new Database(dbPath);
  console.log('✅ Connected to Local SQLite Database');
}

// Unified query methods that work with both D1 and better-sqlite3
const run = async (sql, params = []) => {
  if (isD1) {
    const result = await db.prepare(sql).bind(...params).run();
    return { lastID: result.meta.last_row_id, changes: result.meta.changes };
  } else {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { lastID: result.lastInsertRowid, changes: result.changes };
  }
};

const get = async (sql, params = []) => {
  if (isD1) {
    return await db.prepare(sql).bind(...params).first();
  } else {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  }
};

const all = async (sql, params = []) => {
  if (isD1) {
    const result = await db.prepare(sql).bind(...params).all();
    return result.results;
  } else {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_type TEXT NOT NULL CHECK (project_type IN ('tourist-utility-service-system', 'stroke-hand-recovery-system')),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        innovation TEXT CHECK (innovation IN ('low', 'medium', 'high', 'breakthrough') OR innovation IS NULL),
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_project_type ON feedback(project_type)');
    await run('CREATE INDEX IF NOT EXISTS idx_created_at ON feedback(created_at)');
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};

// Only initialize for local development
if (!isD1) {
  initializeDatabase();
}

module.exports = { db, run, get, all, initializeDatabase };
