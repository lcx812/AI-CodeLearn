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
  const unsubs: (() => void)[] = []
  unsubs.push(window.api.onStreamChunk(onChunk))
  unsubs.push(window.api.onStreamDone(onDone))
  unsubs.push(window.api.onStreamError(onError))
  window.api.ai.chatStream(messages, systemPrompt)
  return () => unsubs.forEach(fn => fn())
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
  const unsubs: (() => void)[] = []
  unsubs.push(window.api.onCourseOutline(onOutline))
  unsubs.push(window.api.onCourseChapter(onChapter))
  unsubs.push(window.api.onCourseDone(onDone))
  unsubs.push(window.api.onStreamError(onError))
  window.api.ai.generateCourse(params)
  return () => unsubs.forEach(fn => fn())
}
