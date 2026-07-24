import { ipcMain } from 'electron'
import { getDb } from '../db'

export function registerStorageHandlers() {
  ipcMain.handle('storage:get', (_e, key: string) => {
    const row = getDb().prepare('SELECT value FROM progress WHERE key = ?').get(key) as { value: string } | undefined
    if (!row) return null
    try { return JSON.parse(row.value) }
    catch { console.error('Failed to parse stored value for key:', key); return null }
  })

  ipcMain.handle('storage:set', (_e, key: string, value: unknown) => {
    getDb().prepare(
      'INSERT INTO progress (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime(\'now\')'
    ).run(key, JSON.stringify(value))
    return true
  })

  ipcMain.handle('storage:delete', (_e, key: string) => {
    getDb().prepare('DELETE FROM progress WHERE key = ?').run(key)
    return true
  })
}
