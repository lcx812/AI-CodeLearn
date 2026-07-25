import { Message } from '../../types'
import MarkdownRenderer from '../ui/MarkdownRenderer'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  currentStream: string
  onDelete: (id: string) => void
}

export default function MessageList({ messages, isStreaming, currentStream, onDelete }: MessageListProps) {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
          <div className="text-5xl">🤖</div>
          <p>你好！我是你的 AI 编程导师</p>
          <p className="text-sm">有任何编程问题都可以问我</p>
        </div>
      )}
      {messages.map(msg => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
          <div className={`max-w-[80%] rounded-xl p-4 relative ${
            msg.role === 'user' ? 'bg-accent/20 text-white' : 'bg-surface-light text-gray-200'
          }`}>
            <button onClick={() => onDelete(msg.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 text-xs"
              title="删除">✕</button>
            <MarkdownRenderer content={msg.content} />
          </div>
        </div>
      ))}
      {isStreaming && currentStream && (
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-surface-light rounded-xl p-4 text-gray-200">
            <MarkdownRenderer content={currentStream} />
            <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5" />
          </div>
        </div>
      )}
    </div>
  )
}
