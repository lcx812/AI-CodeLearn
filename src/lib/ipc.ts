import { genId } from './utils'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export function getAISettings(): Promise<{
  globalProvider: string
  providers: Record<string, { apiKey: string; baseURL?: string; model?: string }>
  functionOverrides: { chat?: string; review?: string; courseGen?: string }
}> {
  return window.api.settings.getAISettings()
}

export function saveAISettings(ai: unknown): Promise<boolean> {
  return window.api.settings.saveAISettings(ai)
}

export function saveProgress(key: string, value: unknown): Promise<boolean> {
  return window.api.storage.set(key, value)
}

export function loadProgress<T>(key: string): Promise<T | null> {
  return window.api.storage.get(key) as Promise<T | null>
}

export function deleteProgress(key: string): Promise<boolean> {
  return window.api.storage.delete(key)
}

export function chat(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  return window.api.ai.chat(messages, systemPrompt)
}

export function chatStream(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): () => void {
  // streamId 贯穿全链：主进程事件负载带 id，此处按 id 过滤，避免多流/课程生成串扰
  const streamId = genId()
  let active = true

  const unsubs: (() => void)[] = [
    window.api.onStreamChunk((id, chunk) => { if (active && id === streamId) onChunk(chunk) }),
    window.api.onStreamDone((id) => { if (active && id === streamId) { dispose(); onDone() } }),
    window.api.onStreamError((id, err) => { if (active && id === streamId) { dispose(); onError(err) } }),
  ]

  // done/error 后自动取消订阅，避免监听器泄漏
  function dispose() {
    active = false
    unsubs.forEach(fn => fn())
  }

  window.api.ai.chatStream(messages, systemPrompt, streamId)
    .catch(e => { if (active) { dispose(); onError(errMsg(e)) } })

  // 取消：停止监听 + 通知主进程中断流（省 token）
  return () => {
    const wasActive = active
    dispose()
    if (wasActive) window.api.ai.cancelStream(streamId).catch(() => { /* 流可能已结束 */ })
  }
}

export function generateExercise(lang: string, topic: string) {
  return window.api.ai.generateExercise(lang, topic)
}

export function generatePlaygroundExercise(params: {
  language: string; direction: string; type: string; courseContext: string
}) {
  return window.api.ai.generatePlaygroundExercise(params)
}

export function reviewCode(code: string, task: string, lang: string) {
  return window.api.ai.reviewCode(code, task, lang)
}

export function openFile(): Promise<{ name: string; content: string; path: string } | null> {
  return window.api.fs.openFile()
}

/** 流式课程生成 */
export function generateCourse(
  params: { language: string; direction: string; difficulty: string; chapterCount: number; questionsPerChapter: number; extra: string },
  onOutline: (outline: string) => void,
  onChapter: (data: { index: number; total: number; chapterJson: string }) => void,
  onDone: (courseJson: string) => void,
  onError: (err: string) => void
): () => void {
  const streamId = genId()
  let active = true

  const unsubs: (() => void)[] = [
    window.api.onCourseOutline((id, outline) => { if (active && id === streamId) onOutline(outline) }),
    window.api.onCourseChapter((id, data) => { if (active && id === streamId) onChapter(data) }),
    window.api.onCourseDone((id, courseJson) => { if (active && id === streamId) { dispose(); onDone(courseJson) } }),
    window.api.onStreamError((id, err) => { if (active && id === streamId) { dispose(); onError(err) } }),
  ]

  function dispose() {
    active = false
    unsubs.forEach(fn => fn())
  }

  window.api.ai.generateCourse(params, streamId)
    .catch(e => { if (active) { dispose(); onError(errMsg(e)) } })

  return dispose
}
