import { contextBridge, ipcRenderer } from 'electron'

const api = {
  ai: {
    chat: (messages: unknown[], systemPrompt: string) =>
      ipcRenderer.invoke('ai:chat', messages, systemPrompt),
    chatStream: (messages: unknown[], systemPrompt: string, streamId: string) =>
      ipcRenderer.invoke('ai:chat-stream', messages, systemPrompt, streamId),
    cancelStream: (streamId: string) =>
      ipcRenderer.invoke('ai:chat-cancel', streamId),
    generateExercise: (lang: string, topic: string) =>
      ipcRenderer.invoke('ai:generate-exercise', lang, topic),
    generatePlaygroundExercise: (params: unknown) =>
      ipcRenderer.invoke('ai:generate-playground-exercise', params),
    generateCourse: (params: unknown, streamId: string) =>
      ipcRenderer.invoke('ai:generate-course', params, streamId),
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
  onStreamChunk: (cb: (streamId: string, chunk: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { streamId: string; chunk: string }) => cb(data.streamId, data.chunk)
    ipcRenderer.on('ai:stream-chunk', handler)
    return () => ipcRenderer.removeListener('ai:stream-chunk', handler)
  },
  onStreamDone: (cb: (streamId: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { streamId: string }) => cb(data.streamId)
    ipcRenderer.on('ai:stream-done', handler)
    return () => ipcRenderer.removeListener('ai:stream-done', handler)
  },
  onStreamError: (cb: (streamId: string, err: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { streamId: string; message: string }) => cb(data.streamId, data.message)
    ipcRenderer.on('ai:stream-error', handler)
    return () => ipcRenderer.removeListener('ai:stream-error', handler)
  },
  onCourseOutline: (cb: (streamId: string, outline: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { streamId: string; outline: string }) => cb(data.streamId, data.outline)
    ipcRenderer.on('ai:course-outline', handler)
    return () => ipcRenderer.removeListener('ai:course-outline', handler)
  },
  onCourseChapter: (cb: (streamId: string, data: { index: number; total: number; chapterJson: string }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { streamId: string; index: number; total: number; chapterJson: string }) => cb(data.streamId, data)
    ipcRenderer.on('ai:course-chapter', handler)
    return () => ipcRenderer.removeListener('ai:course-chapter', handler)
  },
  onCourseDone: (cb: (streamId: string, courseJson: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { streamId: string; courseJson: string }) => cb(data.streamId, data.courseJson)
    ipcRenderer.on('ai:course-done', handler)
    return () => ipcRenderer.removeListener('ai:course-done', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
