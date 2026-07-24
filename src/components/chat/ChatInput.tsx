import { useState, useRef, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled: boolean
}

const quickPrompts = [
  '我想学一门新语言',
  '解释这个概念',
  '给我一个代码示例',
  '扩写当前课程',
  '帮我调试这段代码',
]

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-700 p-4">
      <div className="flex gap-2 mb-2 flex-wrap">
        {quickPrompts.map(p => (
          <button
            key={p}
            onClick={() => onSend(p)}
            disabled={disabled}
            className="px-3 py-1 text-xs rounded-full bg-surface-light text-gray-400 hover:text-white hover:bg-surface-light/80 transition-colors disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题... (Enter 发送, Shift+Enter 换行)"
          rows={2}
          disabled={disabled}
          className="flex-1 bg-surface-dark border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-accent text-surface-dark rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors self-end"
        >
          发送
        </button>
      </div>
    </div>
  )
}
