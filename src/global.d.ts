export {}

declare global {
  interface Window {
    api: {
      ai: {
        chat: (messages: { role: string; content: string }[], systemPrompt: string) => Promise<string>
        chatStream: (messages: { role: string; content: string }[], systemPrompt: string) => Promise<void>
        generateExercise: (lang: string, topic: string) => Promise<{
          title: string; description: string; starterCode: string
          testCases: { input: string; expected: string }[]
          language: string; difficulty: string
        }>
        generatePlaygroundExercise: (params: {
          language: string; direction: string; type: string
          courseContext: string
        }) => Promise<{
          title: string; description: string; starterCode: string
          testCases: { input: string; expected: string }[]
          language: string; difficulty: string
        }>
        generateCourse: (params: {
          language: string; direction: string; difficulty: string
          chapterCount: number; questionsPerChapter: number; extra: string
        }) => Promise<void>
        reviewCode: (code: string, task: string, lang: string) => Promise<{
          correctness: string; style: string; edgeCases: string; suggestions: string[]; score: number
        }>
      }
      storage: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<boolean>
        delete: (key: string) => Promise<boolean>
      }
      settings: {
        getAISettings: () => Promise<{
          globalProvider: string
          providers: Record<string, { apiKey: string; baseURL?: string; model?: string }>
          functionOverrides: { chat?: string; review?: string; courseGen?: string }
        }>
        saveAISettings: (ai: unknown) => Promise<boolean>
      }
      fs: {
        openFile: () => Promise<{ name: string; content: string; path: string } | null>
      }
      onStreamChunk: (cb: (chunk: string) => void) => () => void
      onStreamDone: (cb: () => void) => () => void
      onStreamError: (cb: (err: string) => void) => () => void
      /** 课程生成专用流事件 */
      onCourseOutline: (cb: (outline: string) => void) => () => void
      onCourseChapter: (cb: (data: { index: number; total: number; chapterJson: string }) => void) => () => void
      onCourseDone: (cb: (courseJson: string) => void) => () => void
    }
  }
}
