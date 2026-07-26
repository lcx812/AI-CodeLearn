// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../../src/hooks/useChat'

// ── window.api mock：模拟 ipcRenderer 监听注册/移除语义 ──
type Handler = (...args: any[]) => void
let chunkHandlers: Set<Handler>
let doneHandlers: Set<Handler>
let errHandlers: Set<Handler>
let chatStreamMock: ReturnType<typeof vi.fn>
let cancelStreamMock: ReturnType<typeof vi.fn>

const fire = (handlers: Set<Handler>, ...args: any[]) => handlers.forEach(h => h(...args))
/** 当前流的 streamId（chatStream 调用的第 3 个参数） */
const currentId = () => chatStreamMock.mock.calls.at(-1)![2] as string
const chunk = (t: string, id?: string) => fire(chunkHandlers, id ?? currentId(), t)
const done = (id?: string) => fire(doneHandlers, id ?? currentId())
const fail = (e: string, id?: string) => fire(errHandlers, id ?? currentId(), e)

function channel(set: Set<Handler>) {
  return (cb: Handler) => { set.add(cb); return () => { set.delete(cb) } }
}

beforeEach(() => {
  chunkHandlers = new Set()
  doneHandlers = new Set()
  errHandlers = new Set()
  chatStreamMock = vi.fn(async () => {})
  cancelStreamMock = vi.fn(async () => true)
  const un = vi.fn()
  ;(window as any).api = {
    ai: { chatStream: chatStreamMock, cancelStream: cancelStreamMock, chat: vi.fn() },
    storage: {
      get: vi.fn(async () => null),
      set: vi.fn(async () => true),
      delete: vi.fn(async () => true),
    },
    settings: { getAISettings: vi.fn(), saveAISettings: vi.fn() },
    fs: { openFile: vi.fn() },
    onStreamChunk: channel(chunkHandlers),
    onStreamDone: channel(doneHandlers),
    onStreamError: channel(errHandlers),
    onCourseOutline: () => un,
    onCourseChapter: () => un,
    onCourseDone: () => un,
  }
})

function renderLocal(overrides: Record<string, unknown> = {}) {
  return renderHook((props: any) => useChat(props), {
    initialProps: { scope: 'local', systemPrompt: 'sys', ...overrides } as any,
  })
}

describe('useChat (local scope)', () => {
  it('send 立即追加用户消息并发起流式请求', () => {
    const { result } = renderLocal()
    act(() => result.current.send('你好'))
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: '你好' })
    expect(chatStreamMock).toHaveBeenCalledWith(
      [{ role: 'user', content: '你好' }],
      'sys',
      expect.any(String), // streamId
    )
    expect(result.current.isStreaming).toBe(true)
  })

  it('chunk 累积到 currentStream，done 后落为 assistant 消息', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    act(() => { chunk('Hello'); chunk(' World') })
    expect(result.current.currentStream).toBe('Hello World')
    expect(result.current.isStreaming).toBe(true)
    act(() => done())
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.currentStream).toBe('')
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', content: 'Hello World' })
  })

  it('流式错误：isStreaming 复位，错误作为 assistant 消息展示', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    act(() => fail('boom'))
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', content: '错误: boom' })
  })

  it('done 后从回复中提取章节并回调', () => {
    const onChaptersExtracted = vi.fn()
    const { result } = renderLocal({ onChaptersExtracted })
    act(() => result.current.send('q'))
    const reply = '好的\n```json\n{"chapters":[{"title":"第4章：并发","content":"内容","exercises":[{}],"quiz":[]}]}\n```'
    act(() => { chunk(reply); done() })
    expect(onChaptersExtracted).toHaveBeenCalledTimes(1)
    const chs = onChaptersExtracted.mock.calls[0][0]
    expect(chs).toHaveLength(1)
    expect(chs[0]).toMatchObject({
      title: '第4章：并发',
      content: '内容',
      status: 'pending',
    })
    expect(chs[0].id).toMatch(/^ch_/)
    expect(chs[0].exercises[0].type).toBe('coding') // 默认补齐
  })

  it('回复无 JSON 代码块时不触发章节回调', () => {
    const onChaptersExtracted = vi.fn()
    const { result } = renderLocal({ onChaptersExtracted })
    act(() => result.current.send('q'))
    act(() => { chunk('普通回复'); done() })
    expect(onChaptersExtracted).not.toHaveBeenCalled()
  })

  it('clear 清空消息并终止流', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    act(() => result.current.clear())
    expect(result.current.messages).toHaveLength(0)
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.currentStream).toBe('')
  })

  it('remove 按 id 删除消息', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    const id = result.current.messages[0].id
    act(() => result.current.remove(id))
    expect(result.current.messages).toHaveLength(0)
  })

  it('连续 send 重置流累积（旧流残余被清空）', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q1'))
    act(() => { chunk('第一流数据') })
    expect(result.current.currentStream).toBe('第一流数据')
    act(() => result.current.send('q2'))
    expect(result.current.currentStream).toBe('') // 累积被重置
    act(() => { chunk('第二流数据') })
    expect(result.current.currentStream).toBe('第二流数据')
  })

  it('串扰隔离：其他 streamId 的 chunk/done/error 被忽略', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    act(() => { chunk('别人的数据', 'other-stream-id') })
    expect(result.current.currentStream).toBe('')
    act(() => { done('other-stream-id') })
    expect(result.current.isStreaming).toBe(true) // 不被别人的 done 终止
    act(() => { fail('别人的错误', 'other-stream-id') })
    expect(result.current.isStreaming).toBe(true)
    expect(result.current.messages).toHaveLength(1)
    // 自己的事件正常到达
    act(() => { chunk('自己的数据') })
    expect(result.current.currentStream).toBe('自己的数据')
  })

  it('done 后自动取消订阅（监听器清零）', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    expect(chunkHandlers.size).toBe(1)
    act(() => { chunk('hi'); done() })
    expect(chunkHandlers.size).toBe(0)
    expect(doneHandlers.size).toBe(0)
    expect(errHandlers.size).toBe(0)
  })

  it('clear 取消流时通知后端中断（cancelStream 带 streamId）', () => {
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    const id = currentId()
    act(() => result.current.clear())
    expect(cancelStreamMock).toHaveBeenCalledWith(id)
    expect(chunkHandlers.size).toBe(0)
  })

  it('invoke 直接拒绝（如 API Key 未配置）时走 onError', async () => {
    chatStreamMock.mockRejectedValueOnce(new Error('API Key 未配置'))
    const { result } = renderLocal()
    act(() => result.current.send('q'))
    await act(async () => { await Promise.resolve() })
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: '错误: API Key 未配置',
    })
  })
})
