import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../../stores/chat'
import { useCourseStore } from '../../stores/course'
import type { Chapter } from '../../types'
import { chatStream } from '../../lib/ipc'
import { genId, genChapterId, extractJson } from '../../lib/utils'
import { buildTutorPrompt, buildExplorerPrompt } from '../../lib/prompts'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

interface ChatPanelProps {
  isExplorer?: boolean
  courseId?: string
  chapter?: Chapter | null
}

export default function ChatPanel({ isExplorer = false, courseId, chapter }: ChatPanelProps) {
  const { courses, addChapters } = useCourseStore()
  const globalChat = useChatStore()
  const course = courseId ? courses.find(c => c.id === courseId) || null : null
  const lang = course?.language || 'python'

  // scope: local state for course/explorer, global store for global AI tutor
  const scopeLocal = !!(isExplorer || courseId)
  const systemPrompt = isExplorer
    ? buildExplorerPrompt()
    : buildTutorPrompt(lang, course, chapter || null)

  // local state (course/explorer scenarios)
  const [localMsgs, setLocalMsgs] = useState<{ role: string; content: string }[]>([])
  const [localStreaming, setLocalStreaming] = useState(false)
  const [localStream, setLocalStream] = useState('')
  const cleanupRef = useRef<(() => void) | null>(null)

  // load global history on mount
  useEffect(() => {
    if (!scopeLocal) globalChat.loadHistory()
  }, [])

  // auto-cleanup on unmount
  useEffect(() => () => cleanupRef.current?.(), [])

  const sendLocal = (content: string) => {
    cleanupRef.current?.()
    const userMsg = { role: 'user' as const, content }
    const msgs = [...localMsgs, userMsg]
    setLocalMsgs(msgs)
    setLocalStreaming(true)
    setLocalStream('')
    const acc: string[] = []

    cleanupRef.current = chatStream(
      msgs,
      systemPrompt,
      chunk => { acc.push(chunk); setLocalStream(acc.join('')) },
      () => {
        const full = acc.join('')
        setLocalMsgs(prev => [...prev, { role: 'assistant', content: full }])
        setLocalStream('')
        setLocalStreaming(false)
        cleanupRef.current = null
        // try extracting chapters from response
        if (courseId) tryParseChapters(full)
      },
      err => {
        setLocalMsgs(prev => [...prev, { role: 'assistant', content: `错误: ${err}` }])
        setLocalStreaming(false)
        cleanupRef.current = null
      },
    )
  }

  const tryParseChapters = (text: string) => {
    const jsonStr = extractJson(text)
    if (!jsonStr) return
    let parsed
    try { parsed = JSON.parse(jsonStr) } catch { return }
    if (parsed?.chapters && Array.isArray(parsed.chapters)) {
      const chs = parsed.chapters.slice(0, 50).map((ch: any) => ({
        id: genChapterId(),
        title: ch.title || '新章节',
        content: ch.content || '',
        exercises: (ch.exercises || []).map((ex: any) => ({ ...ex, type: ex.type || 'coding' })),
        quiz: ch.quiz || [],
        status: 'pending' as const,
      }))
      addChapters(courseId!, chs)
    }
  }

  const handleSend = (content: string) => {
    scopeLocal ? sendLocal(content) : globalChat.sendMessage(content, systemPrompt)
  }

  const handleClear = () => {
    scopeLocal ? setLocalMsgs([]) : globalChat.clearMessages()
  }

  const handleDelete = (id: string) => {
    scopeLocal
      ? setLocalMsgs(prev => prev.filter((_, i) => String(i) !== id))
      : globalChat.deleteMessage(id)
  }

  // unified display data
  const displayMsgs = scopeLocal ? localMsgs : globalChat.messages
  const displayStreaming = scopeLocal ? localStreaming : globalChat.isStreaming
  const displayStream = scopeLocal ? localStream : globalChat.currentStream

  const title = isExplorer ? '🌐 语言探索' : courseId ? '💬 AI 提问' : '🤖 AI 导师'

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-2xl font-bold">{title}</h2>
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
            id: scopeLocal ? String(i) : (m as any).id || String(i),
            role: m.role as any,
            content: m.content,
            timestamp: 0,
          }))}
          isStreaming={displayStreaming && !!displayStream}
          currentStream={displayStream}
          onDelete={handleDelete}
        />
        <ChatInput onSend={handleSend} disabled={displayStreaming} />
      </div>
    </div>
  )
}
