import { useState, useEffect, useCallback } from 'react'
import { useChatStore } from '../stores/chat'
import { useStream } from './useStream'
import { genId, genChapterId, extractJson } from '../lib/utils'
import type { Message, Chapter } from '../types'

export type ChatScope = 'global' | 'course' | 'explorer'

interface UseChatOptions {
  scope: ChatScope
  courseId?: string
  lang?: string
  systemPrompt: string
  onChaptersExtracted?: (chapters: Chapter[]) => void
}

export function useChat({ scope, courseId, systemPrompt, onChaptersExtracted }: UseChatOptions) {
  const globalStore = useChatStore()
  const isLocal = scope !== 'global'

  // 本地状态（course/explorer 场景）
  const [localMsgs, setLocalMsgs] = useState<Message[]>([])

  // 流式 hook
  const stream = useStream({
    onDone: (fullText) => {
      const assistantMsg: Message = { id: genId(), role: 'assistant', content: fullText, timestamp: Date.now() }
      if (isLocal) {
        setLocalMsgs(prev => [...prev, assistantMsg])
      } else {
        // global scope: stream.onDone already handles via chat store sendMessage
      }
      // 尝试从回复中提取章节
      if (courseId && onChaptersExtracted) {
        const jsonStr = extractJson(fullText)
        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr)
            if (parsed?.chapters && Array.isArray(parsed.chapters)) {
              const chs = parsed.chapters.slice(0, 50).map((ch: any) => ({
                id: genChapterId(),
                title: ch.title || '新章节',
                content: ch.content || '',
                exercises: (ch.exercises || []).map((ex: any) => ({ ...ex, type: ex.type || 'coding' })),
                quiz: ch.quiz || [],
                status: 'pending' as const,
              }))
              onChaptersExtracted(chs)
            }
          } catch { /* ignore */ }
        }
      }
    },
  })

  // 初始化加载历史
  useEffect(() => {
    if (scope === 'global') {
      globalStore.loadHistory()
    }
  }, [scope])

  // 统一的消息列表
  const messages = isLocal
    ? localMsgs
    : globalStore.messages

  const isStreaming = stream.isStreaming ||
    (isLocal ? false : globalStore.isStreaming)

  const currentStream = isLocal
    ? stream.streamText
    : globalStore.currentStream

  const send = useCallback((content: string) => {
    if (isLocal) {
      const userMsg: Message = { id: genId(), role: 'user', content, timestamp: Date.now() }
      const msgs = [...localMsgs, userMsg]
      setLocalMsgs(msgs)
      const raw = msgs.map(m => ({ role: m.role, content: m.content }))
      stream.start(raw, systemPrompt)
    } else {
      globalStore.sendMessage(content, systemPrompt)
    }
  }, [isLocal, localMsgs, systemPrompt, stream, globalStore])

  const clear = useCallback(() => {
    if (isLocal) {
      setLocalMsgs([])
    } else {
      globalStore.clearMessages()
    }
    stream.cancel()
  }, [isLocal, globalStore, stream])

  const remove = useCallback((id: string) => {
    if (isLocal) {
      setLocalMsgs(prev => prev.filter(m => m.id !== id))
    } else {
      globalStore.deleteMessage(id)
    }
  }, [isLocal, globalStore])

  return {
    messages,
    isStreaming: isStreaming && !!currentStream,
    currentStream,
    send,
    clear,
    remove,
  }
}
