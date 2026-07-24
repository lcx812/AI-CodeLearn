import { contextBridge, ipcRenderer } from 'electron'

const api = {
  ai: {
    chat: (messages: unknown[], systemPrompt: string) =>
      ipcRenderer.invoke('ai:chat', messages, systemPrompt),
    chatStream: (messages: unknown[], systemPrompt: string) =>
      ipcRenderer.invoke('ai:chat-stream', messages, systemPrompt),
    generateExercise: (lang: string, topic: string) =>
      ipcRenderer.invoke('ai:generate-exercise', lang, topic),
    generatePlaygroundExercise: (params: unknown) =>
      ipcRenderer.invoke('ai:generate-playground-exercise', params),
    generateCourse: (params: unknown) =>
      ipcRenderer.invoke('ai:generate-course', params),
    reviewCode: (code: string, task: string, lang: string) =>
      ipcRenderer.invoke('ai:review-code', code, task, lang)
  },
  storage: {
    get: (key: string) => ipcRenderer.invoke('storage:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('storage:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('storage:delete', key)
  },
  settings: {
    getAISettings: () => ipcRenderer.invoke('settings:get-ai'),
    saveAISettings: (ai: unknown) => ipcRenderer.invoke('settings:save-ai', ai)
  },
  fs: {
    openFile: () => ipcRenderer.invoke('fs:open-file')
  },
  onStreamChunk: (cb: (chunk: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, chunk: string) => cb(chunk)
    ipcRenderer.on('ai:stream-chunk', handler)
    return () => ipcRenderer.removeListener('ai:stream-chunk', handler)
  },
  onStreamDone: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('ai:stream-done', handler)
    return () => ipcRenderer.removeListener('ai:stream-done', handler)
  },
  onStreamError: (cb: (err: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, err: string) => cb(err)
    ipcRenderer.on('ai:stream-error', handler)
    return () => ipcRenderer.removeListener('ai:stream-error', handler)
  },
  onCourseOutline: (cb: (outline: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: string) => cb(data)
    ipcRenderer.on('ai:course-outline', handler)
    return () => ipcRenderer.removeListener('ai:course-outline', handler)
  },
  onCourseChapter: (cb: (data: { index: number; total: number; chapterJson: string }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { index: number; total: number; chapterJson: string }) => cb(data)
    ipcRenderer.on('ai:course-chapter', handler)
    return () => ipcRenderer.removeListener('ai:course-chapter', handler)
  },
  onCourseDone: (cb: (courseJson: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: string) => cb(data)
    ipcRenderer.on('ai:course-done', handler)
    return () => ipcRenderer.removeListener('ai:course-done', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
