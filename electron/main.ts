import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { registerStorageHandlers } from './ipc/storage'
import { registerAiHandlers } from './ipc/ai'
import { registerFsHandlers } from './ipc/fs'
import { getDb } from './db'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'CodeLearn',
    backgroundColor: '#1e1e2e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

registerStorageHandlers()
registerAiHandlers()
registerFsHandlers()

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  try { getDb().close() } catch { /* db may not have been opened */ }
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
