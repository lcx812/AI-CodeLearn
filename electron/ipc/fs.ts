import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'

export interface OpenFileResult {
  name: string
  content: string
  path: string
}

export function registerFsHandlers() {
  ipcMain.handle('fs:open-file', async (event): Promise<OpenFileResult | null> => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: '选择代码文件',
      filters: [
        { name: '源代码', extensions: ['py', 'js', 'ts', 'go', 'rs', 'java', 'c', 'cpp', 'rb', 'swift', 'kt'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths.length) return null

    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    const name = filePath.split(/[/\\]/).pop() || 'untitled'

    return { name, content, path: filePath }
  })
}
