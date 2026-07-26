import { useState, useRef, useEffect, useCallback } from 'react'
import { chatStream } from '../lib/ipc'

interface UseStreamOptions {
  onDone?: (fullText: string) => void
  onError?: (err: string) => void
}

export function useStream(opts: UseStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const accumRef = useRef('')
  const cleanupRef = useRef<(() => void) | null>(null)

  // 组件卸载时自动取消
  useEffect(() => {
    return () => { cleanupRef.current?.() }
  }, [])

  const start = useCallback(
    (
      messages: { role: string; content: string }[],
      systemPrompt: string,
    ) => {
      // 先取消之前的流
      cleanupRef.current?.()
      accumRef.current = ''
      setStreamText('')
      setIsStreaming(true)

      cleanupRef.current = chatStream(
        messages,
        systemPrompt,
        (chunk) => {
          accumRef.current += chunk
          setStreamText(accumRef.current)
        },
        () => {
          const full = accumRef.current
          accumRef.current = ''
          setStreamText('')
          setIsStreaming(false)
          cleanupRef.current = null
          opts.onDone?.(full)
        },
        (err) => {
          accumRef.current = ''
          setStreamText('')
          setIsStreaming(false)
          cleanupRef.current = null
          opts.onError?.(err)
        },
      )
    },
    [opts.onDone, opts.onError],
  )

  const cancel = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
    setIsStreaming(false)
    setStreamText('')
    accumRef.current = ''
  }, [])

  return { isStreaming, streamText, start, cancel }
}
