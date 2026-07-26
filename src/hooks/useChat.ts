import { useState, useEffect, useCallback } from 'react'
import { useChatStore } from '../stores/chat'
import { useStream } from './useStream'
import { genId, genChapterId, extractJson } from '../lib/utils'
import type { Message, Chapter } from '../types'

export type ChatScope = 'global' | 'local'

interface UseChatOptions {
  scope: ChatScope
  systemPrompt: string
  /** 回复中提取到章节 JSON 时回调（仅 local scope 使用） */
  onChaptersExtracted?: (chapters: Chapter[]) => void
}

/** 从回复文本提取章节 JSON，无则返回 null */
function extractChapters(text: string): Chapter[] | null {
  const jsonStr = extractJson(text)
  if (!jsonStr) return null
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed?.chapters || !Array.isArray(parsed.chapters)) return null
    return parsed.chapters.slice(0, 50).map((ch: any) => ({
      id: genChapterId(),
      title: ch.title || '新章节',
      content: ch.content || '',
      exercises: (ch.exercises || []).map((ex: any) => ({ ...ex, type: ex.type || 'coding' })),
      quiz: ch.quiz || [],
      status: 'pending' as const,
    }))
  } catch {
    return null
  }
}

/**
 * 统一聊天逻辑：
 * - scope 'global'：全局 AI 导师，委托 useChatStore（持久化历史）
 * - scope 'local'：课程内/探索/追问等局部对话，组件级状态，不持久化
 */
export function useChat({ scope, systemPrompt, onChaptersExtracted }: UseChatOptions) {
  const globalStore = useChatStore()
  const isLocal = scope === 'local'

  const [localMsgs, setLocalMsgs] = useState<Message[]>([])

  const stream = useStream({
    onDone: (fullText) => {
      if (isLocal) {
        const assistantMsg: Message = { id: genId(), role: 'assistant', content: fullText, timestamp: Date.now() }
        setLocalMsgs(prev => [...prev, assistantMsg])
      }
      if (onChaptersExtracted) {
        const chs = extractChapters(fullText)
        if (chs) onChaptersExtracted(chs)
      }
    },
    onError: (err) => {
      if (isLocal) {
        const errMsg: Message = { id: genId(), role: 'assistant', content: `错误: ${err}`, timestamp: Date.now() }
        setLocalMsgs(prev => [...prev, errMsg])
      }
    },
  })

  // 全局历史加载
  useEffect(() => {
    if (!isLocal) globalStore.loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocal])

  const messages = isLocal ? localMsgs : globalStore.messages
  const isStreaming = isLocal ? stream.isStreaming : globalStore.isStreaming
  const currentStream = isLocal ? stream.streamText : globalStore.currentStream

  const send = useCallback((content: string) => {
    if (isLocal) {
      const userMsg: Message = { id: genId(), role: 'user', content, timestamp: Date.now() }
      const msgs = [...localMsgs, userMsg]
      setLocalMsgs(msgs)
      stream.start(msgs.map(m => ({ role: m.role, content: m.content })), systemPrompt)
    } else {
      globalStore.sendMessage(content, systemPrompt)
    }
  }, [isLocal, localMsgs, systemPrompt, stream, globalStore])

  const clear = useCallback(() => {
    if (isLocal) setLocalMsgs([])
    else globalStore.clearMessages()
    stream.cancel()
  }, [isLocal, globalStore, stream])

  const remove = useCallback((id: string) => {
    if (isLocal) setLocalMsgs(prev => prev.filter(m => m.id !== id))
    else globalStore.deleteMessage(id)
  }, [isLocal, globalStore])

  return { messages, isStreaming, currentStream, send, clear, remove }
}
