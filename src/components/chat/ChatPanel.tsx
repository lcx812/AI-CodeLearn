import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../stores/chat'
import { useCourseStore } from '../../stores/course'
import { Course, Chapter } from '../../types'
import { chatStream } from '../../lib/ipc'
import { genChapterId } from '../../stores/course'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

function buildSystemPrompt(lang: string, course: Course | null, chapter: Chapter | null, isExplorer: boolean): string {
  if (isExplorer) {
    return `你是编程语言导览助手。你的职责是向编程新手介绍各种编程语言。

【核心原则】
- 用通俗易懂的简短文字回复（每次不超过 200 字）
- 用中文回复
- 只回答与编程语言相关的问题（用途、历史、特点、开发环境、适用场景、基本语法示例）
- 不生成完整课程、不设计练习题、不进行代码审查
- 如果用户想深入学习，建议他们去"课程"页面

【回答模板】
当被问到某语言时，按此结构回答：
1. 一句话介绍（是什么）
2. 主要用途（2-3 个）
3. 开发环境搭建（1-2 句话）
4. 简短代码示例（3-5 行）
`
  }

  let prompt = `你是 CodeLearn 的 AI 编程导师。

【核心原则】
- 语言平实易懂，专业不生僻
- 用中文回复，代码注释可用英文
- 解释概念由浅入深，先讲"是什么"再讲"为什么"
- 鼓励独立思考，引导学生而非直接给答案
- 发现代码问题友好指出并提供改进方案

【当前上下文】
学习语言：${lang}
`

  if (course) {
    prompt += `当前课程：${course.title}（${course.difficulty === 'beginner' ? '入门' : course.difficulty === 'intermediate' ? '中级' : '高级'}）
课程章节：${course.chapters.map(c => c.title).join('、') || '暂无'}
已完成：${course.chapters.filter(c => c.status === 'done').length} 章
`
  }

  if (chapter) {
    prompt += `正在学习章节：${chapter.title}
章节内容摘要：${chapter.content?.slice(0, 500) || '暂无'}
`
  }

  if (course) {
    prompt += `
【课程操作指令】
当学生要求扩写课程（增加新章节）时，在回复末尾用 \`\`\`json 代码块输出：
{"chapters": [{"title": "新章节标题", "content": "Markdown 内容", "exercises": [...], "quiz": [...]}]}
`
  }

  return prompt
}

function extractJson(text: string): string | null {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (match) return match[1].trim()
  return null
}

interface ChatPanelProps {
  isExplorer?: boolean
  courseId?: string
  chapter?: Chapter | null
}

export default function ChatPanel({ isExplorer = false, courseId, chapter }: ChatPanelProps) {
  const { messages, isStreaming, currentStream, sendMessage, deleteMessage, clearMessages, loadHistory } = useChatStore()
  const { courses, addChapters } = useCourseStore()
  const course = courseId ? courses.find(c => c.id === courseId) || null : null
  const lang = course?.language || 'python'

  const [localMsgs, setLocalMsgs] = useState<{ role: string; content: string }[]>([])
  const [localStreaming, setLocalStreaming] = useState(false)
  const [localStream, setLocalStream] = useState('')
  const streamAccum = useRef('')
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!isExplorer && !courseId) {
      loadHistory()
    }
  }, [loadHistory, isExplorer, courseId])

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  const handleSend = (content: string) => {
    if (isExplorer || courseId) {
      sendLocalMsg(content)
    } else {
      sendMessage(content, buildSystemPrompt(lang, course, chapter || null, isExplorer))
    }
  }

  const sendLocalMsg = (content: string) => {
    cleanupRef.current?.()
    const userMsg = { role: 'user' as const, content }
    const msgs = [...localMsgs, userMsg]
    setLocalMsgs(msgs)
    setLocalStreaming(true)
    setLocalStream('')
    streamAccum.current = ''

    const rawMsgs = msgs.map(m => ({ role: m.role, content: m.content }))

    cleanupRef.current = chatStream(
      rawMsgs,
      buildSystemPrompt(lang, course, chapter || null, isExplorer),
      chunk => {
        streamAccum.current += chunk
        setLocalStream(streamAccum.current)
      },
      () => {
        const final = [...msgs, { role: 'assistant', content: streamAccum.current }]
        setLocalMsgs(final)
        setLocalStream('')
        setLocalStreaming(false)
        cleanupRef.current = null
        tryParseExpand(streamAccum.current)
      },
      err => {
        setLocalMsgs(prev => [...prev, { role: 'assistant', content: `错误: ${err}` }])
        setLocalStreaming(false)
        cleanupRef.current = null
      }
    )
  }

  const tryParseExpand = (text: string) => {
    if (!courseId) return
    const jsonStr = extractJson(text)
    if (!jsonStr) return
    let parsed
    try { parsed = JSON.parse(jsonStr) } catch { return }
    if (parsed?.chapters && Array.isArray(parsed.chapters)) {
      const newChs = parsed.chapters.slice(0, 50).map((ch: any) => ({
        id: genChapterId(),
        title: ch.title || '新章节',
        content: ch.content || '',
        exercises: (ch.exercises || []).map((ex: any) => ({ ...ex, type: ex.type || 'coding' })),
        quiz: ch.quiz || [],
        status: 'pending' as const
      }))
      addChapters(courseId, newChs)
    }
  }

  const handleClear = () => {
    if (isExplorer || courseId) {
      setLocalMsgs([])
    } else {
      clearMessages()
    }
  }

  const displayMsgs = (isExplorer || courseId) ? localMsgs : messages
  const displayStreaming = (isExplorer || courseId) ? localStreaming : isStreaming
  const displayStream = (isExplorer || courseId) ? localStream : currentStream

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-2xl font-bold">
          {isExplorer ? '🌐 语言探索' : courseId ? '💬 AI 提问' : '🤖 AI 导师'}
        </h2>
        <button
          onClick={handleClear}
          className="px-3 py-1 text-xs rounded-lg bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          清空对话
        </button>
      </div>
      <div className="flex-1 bg-surface-dark rounded-xl overflow-hidden flex flex-col min-h-0">
        <MessageList
          messages={displayMsgs.map((m, i) => ({
            id: String(i),
            role: m.role as any,
            content: m.content,
            timestamp: 0
          }))}
          isStreaming={displayStreaming}
          currentStream={displayStream}
          onDelete={(id) => {
            if (isExplorer || courseId) {
              setLocalMsgs(prev => prev.filter((_, i) => String(i) !== id))
            } else {
              deleteMessage(id)
            }
          }}
        />
        <ChatInput onSend={handleSend} disabled={displayStreaming} />
      </div>
    </div>
  )
}
