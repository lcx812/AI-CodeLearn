export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

/** 选择题 */
export interface ChoiceQuestion {
  question: string
  options: string[]        // 4个选项
  correctIndex: number     // 正确答案索引 (0-3)
  explanation: string      // 解析
}

export interface TestCase {
  input: string
  expected: string
}

export interface Exercise {
  type: 'mc' | 'coding'    // 选择题 | 编程题
  title: string
  description: string
  starterCode: string       // 编程题用
  testCases: TestCase[]
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  // 选择题专用
  question?: string
  options?: string[]
  correctIndex?: number
  explanation?: string
}

export interface CodeReview {
  correctness: string
  style: string
  edgeCases: string
  suggestions: string[]
  score: number
}

export interface Chapter {
  id: string
  title: string
  content: string           // Markdown 教学内容
  exercises: Exercise[]     // 章末编程题
  quiz: ChoiceQuestion[]    // 章末选择题
  status: 'pending' | 'generating' | 'done'
}

export interface Course {
  id: string
  language: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chapters: Chapter[]
  createdAt: number
  updatedAt: number
}

/** 课程生成参数 */
export interface CourseGenParams {
  language: string
  direction: string
  difficulty: string
  chapterCount: number
  questionsPerChapter: number
  extra: string
}

/** 练习场题目生成参数 */
export interface PlaygroundGenParams {
  courseId: string | null
  chapterId: string | null   // null = 整个课程范围
  direction: string
  type: 'project' | 'exercise'  // 综合项目 | 章节练习
}
