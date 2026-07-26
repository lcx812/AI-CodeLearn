import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  const dbPath = path.join(app.getPath('userData'), 'codelearn.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  initTables(db)
  return db
}

function initTables(db: Database.Database) {
  // 所有持久化（课程、聊天历史、进度）都走 progress KV 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}
