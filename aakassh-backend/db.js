// db.js — SQLite database initialisation
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'aakassh.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ──────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    service     TEXT    NOT NULL,
    budget      TEXT,
    message     TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'new',   -- new | read | replied | closed
    ip          TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT    NOT NULL UNIQUE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT    NOT NULL
  );
`);

// Prepared statements (fast, safe against SQL injection)
const stmts = {
  insertEnquiry: db.prepare(`
    INSERT INTO enquiries (name, email, service, budget, message, ip)
    VALUES (@name, @email, @service, @budget, @message, @ip)
  `),

  getAllEnquiries: db.prepare(`
    SELECT * FROM enquiries ORDER BY created_at DESC
  `),

  getEnquiryById: db.prepare(`
    SELECT * FROM enquiries WHERE id = ?
  `),

  updateStatus: db.prepare(`
    UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?
  `),

  getStats: db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'new'     THEN 1 ELSE 0 END) AS new_count,
      SUM(CASE WHEN status = 'read'    THEN 1 ELSE 0 END) AS read_count,
      SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) AS replied_count,
      SUM(CASE WHEN status = 'closed'  THEN 1 ELSE 0 END) AS closed_count,
      SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS today_count
    FROM enquiries
  `),

  deleteEnquiry: db.prepare(`DELETE FROM enquiries WHERE id = ?`),

  filterByStatus: db.prepare(`
    SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC
  `),
};

module.exports = { db, stmts };
