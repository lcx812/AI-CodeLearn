import { useCourseStore } from '../../stores/course'
import type { Chapter } from '../../types'
import { buildTutorPrompt, buildExplorerPrompt } from '../../lib/prompts'
import { useChat } from '../../hooks/useChat'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

interface ChatPanelProps {
  isExplorer?: boolean
  courseId?: string
  chapter?: Chapter | null
}

export default function ChatPanel({ isExplorer = false, courseId, chapter }: ChatPanelProps) {
  const { courses, addChapters } = useCourseStore()
  const course = courseId ? courses.find(c => c.id === courseId) || null : null
  const lang = course?.language || 'python'

  // scope: local for course/explorer, global store for global AI tutor
  const scopeLocal = !!(isExplorer || courseId)
  const systemPrompt = isExplorer
    ? buildExplorerPrompt()
    : buildTutorPrompt(lang, course, chapter || null)

  const { messages, isStreaming, currentStream, send, clear, remove } = useChat({
    scope: scopeLocal ? 'local' : 'global',
    systemPrompt,
    onChaptersExtracted: courseId ? (chs) => addChapters(courseId, chs) : undefined,
  })

  const title = isExplorer ? '语言探索' : courseId ? 'AI 提问' : 'AI 导师'

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-2xl font-bold">
          <span className="text-ink-muted">$ </span>{title}
        </h2>
        <button
          onClick={clear}
          className="px-3 py-1 text-xs rounded-lg bg-surface-light text-ink-muted hover:text-ink transition-colors"
        >
          清空对话
        </button>
      </div>
      <div className="flex-1 bg-surface-dark border border-line rounded-xl overflow-hidden flex flex-col min-h-0">
        <MessageList
          messages={messages}
          isStreaming={isStreaming && !!currentStream}
          currentStream={currentStream}
          onDelete={remove}
        />
        <ChatInput onSend={send} disabled={isStreaming} />
      </div>
    </div>
  )
}
