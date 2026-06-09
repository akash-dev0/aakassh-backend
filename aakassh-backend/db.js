const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'aakassh.db');

let db;

async function getDb() {
  if (!db) {
    db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    await db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
    await db.exec(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL,
        service    TEXT NOT NULL,
        budget     TEXT,
        message    TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'new',
        ip         TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

const stmts = {
  insertEnquiry: async (data) => {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO enquiries (name, email, service, budget, message, ip) VALUES (?,?,?,?,?,?)`,
      [data.name, data.email, data.service, data.budget || null, data.message, data.ip]
    );
    return { lastInsertRowid: result.lastID };
  },
  getAllEnquiries: async () => {
    const db = await getDb();
    return db.all(`SELECT * FROM enquiries ORDER BY created_at DESC`);
  },
  getEnquiryById: async (id) => {
    const db = await getDb();
    return db.get(`SELECT * FROM enquiries WHERE id = ?`, [id]);
  },
  updateStatus: async (status, id) => {
    const db = await getDb();
    const result = await db.run(
      `UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, id]
    );
    return { changes: result.changes };
  },
  getStats: async () => {
    const db = await getDb();
    return db.get(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='new'     THEN 1 ELSE 0 END) AS new_count,
        SUM(CASE WHEN status='read'    THEN 1 ELSE 0 END) AS read_count,
        SUM(CASE WHEN status='replied' THEN 1 ELSE 0 END) AS replied_count,
        SUM(CASE WHEN status='closed'  THEN 1 ELSE 0 END) AS closed_count,
        SUM(CASE WHEN date(created_at)=date('now') THEN 1 ELSE 0 END) AS today_count
      FROM enquiries
    `);
  },
  deleteEnquiry: async (id) => {
    const db = await getDb();
    const result = await db.run(`DELETE FROM enquiries WHERE id = ?`, [id]);
    return { changes: result.changes };
  },
  filterByStatus: async (status) => {
    const db = await getDb();
    return db.all(`SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC`, [status]);
  },
};

module.exports = { getDb, stmts };