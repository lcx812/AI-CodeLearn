export {}

declare global {
  interface Window {
    api: {
      ai: {
        chat: (messages: { role: string; content: string }[], systemPrompt: string) => Promise<string>
        chatStream: (messages: { role: string; content: string }[], systemPrompt: string, streamId: string) => Promise<void>
        cancelStream: (streamId: string) => Promise<boolean>
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
        }, streamId: string) => Promise<void>
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
      onStreamChunk: (cb: (streamId: string, chunk: string) => void) => () => void
      onStreamDone: (cb: (streamId: string) => void) => () => void
      onStreamError: (cb: (streamId: string, err: string) => void) => () => void
      /** 课程生成专用流事件 */
      onCourseOutline: (cb: (streamId: string, outline: string) => void) => () => void
      onCourseChapter: (cb: (streamId: string, data: { index: number; total: number; chapterJson: string }) => void) => () => void
      onCourseDone: (cb: (streamId: string, courseJson: string) => void) => () => void
    }
  }
}
