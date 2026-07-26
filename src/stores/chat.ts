import { create } from 'zustand'
import { Message } from '../types'
import { chatStream, loadProgress, saveProgress } from '../lib/ipc'
import { genId } from '../lib/utils'
import { CHAT_HISTORY_LIMIT } from '../lib/constants'

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  currentStream: string
  sendMessage: (content: string, systemPrompt: string) => Promise<void>
  deleteMessage: (id: string) => void
  clearMessages: () => void
  loadHistory: () => Promise<void>
}

let unsubscribeStream: (() => void) | null = null

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentStream: '',

  sendMessage: async (content, systemPrompt) => {
    if (unsubscribeStream) {
      unsubscribeStream()
      unsubscribeStream = null
    }

    const userMsg: Message = { id: genId(), role: 'user', content, timestamp: Date.now() }
    const msgs = [...get().messages, userMsg]
    set({ messages: msgs, isStreaming: true, currentStream: '' })

    const rawMsgs = msgs.map(m => ({ role: m.role, content: m.content }))
    let streamed = ''

    unsubscribeStream = chatStream(
      rawMsgs,
      systemPrompt,
      (chunk) => {
        streamed += chunk
        set({ currentStream: streamed })
      },
      () => {
        const assistantMsg: Message = { id: genId(), role: 'assistant', content: streamed, timestamp: Date.now() }
        const final = [...get().messages, assistantMsg]
        set({ messages: final, isStreaming: false, currentStream: '' })
        saveProgress('chat_history', final.slice(-CHAT_HISTORY_LIMIT))
      },
      (err) => {
        set({ isStreaming: false, currentStream: '' })
        console.error('Stream error:', err)
      }
    )
  },

  deleteMessage: (id) => {
    const filtered = get().messages.filter(m => m.id !== id)
    set({ messages: filtered })
    saveProgress('chat_history', filtered.slice(-CHAT_HISTORY_LIMIT))
  },

  clearMessages: () => {
    set({ messages: [], currentStream: '' })
    saveProgress('chat_history', [])
  },

  loadHistory: async () => {
    const history = await loadProgress<Message[]>('chat_history')
    if (history && Array.isArray(history)) set({ messages: history })
  }
}))
