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
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT,
      topic TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      level TEXT DEFAULT 'beginner',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
  migrateTables(db)
}

function migrateTables(db: Database.Database) {
  const cols = db.pragma('table_info(courses)') as { name: string }[]
  const names = cols.map(c => c.name)
  if (!names.includes('updated_at')) {
    db.exec(`ALTER TABLE courses ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`)
  }
}
