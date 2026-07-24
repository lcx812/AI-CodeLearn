import { useState, useRef, useEffect } from 'react'
import { useCourseStore, genChapterId } from '../stores/course'
import { chatStream } from '../lib/ipc'

interface Props {
  courseId: string
  currentChapterCount: number
  onDone: () => void
}

export default function ChapterExpander({ courseId, currentChapterCount, onDone }: Props) {
  const { courses, addChapters } = useCourseStore()
  const course = courses.find(c => c.id === courseId)

  const maxForTotal = Math.max(1, 500 - currentChapterCount)
  const effectiveMax = Math.min(20, maxForTotal)

  const [chapterCount, setChapterCount] = useState(Math.min(1, effectiveMax))
  const [qCount, setQCount] = useState(3)
  const [extra, setExtra] = useState('')
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const cancelRef = useRef<(() => void) | null>(null)
  const chaptersRef = useRef<any[]>([])
  const streamTextRef = useRef('')
  const detectedChaptersRef = useRef(0)

  useEffect(() => {
    return () => cancelRef.current?.()
  }, [])

  const clampChapter = (v: number) => Math.max(1, Math.min(effectiveMax, v || 1))
  const clampQ = (v: number) => Math.max(1, Math.min(10, v || 1))

  const handleGenerate = () => {
    if (!course) { setError('课程不存在'); return }
    if (chapterCount < 1) { setError('章节数至少为 1'); return }
    if (currentChapterCount + chapterCount > 500) { setError('总章节数不能超过 500'); return }

    setGenerating(true)
    setError('')
    setStatus('正在生成...')
    setProgress(0)
    chaptersRef.current.length = 0
    streamTextRef.current = ''
    detectedChaptersRef.current = 0

    const joined = course.chapters.map(c => c.title).join('、')

    const systemPrompt = `你是编程教育专家。请为课程追加新章节。严格遵循以下规则：

1. 只输出 JSON，不得输出任何解释、问候语、确认语
2. 不要用 \`\`\`json 代码块包裹，直接输出纯 JSON
3. JSON 根对象包含 "chapters" 数组

输出格式：
{"chapters":[{"title":"第X章 标题","content":"Markdown教学内容（含概念讲解和代码示例）","exercises":[{"type":"coding","title":"题目标题","description":"题目描述","starterCode":"初始代码","testCases":[{"input":"输入","expected":"输出"}],"language":"${course?.language}","difficulty":"beginner"}],"quiz":[{"question":"选择题题目","options":["A.选项1","B.选项2","C.选项3","D.选项4"],"correctIndex":0,"explanation":"解析"}]}]}

当前课程：${course?.language} ${course?.title}
已有章节：${joined}
需要生成：${chapterCount} 个新章节，每章 ${qCount} 道题`

    const messages = [
      {
        role: 'user' as const,
        content: `扩写${chapterCount}章，每章${qCount}题。${extra ? `要求：${extra}` : ''}只输出JSON。`
      }
    ]

    const cleanup = chatStream(
      messages,
      systemPrompt,
      (chunk) => {
        streamTextRef.current += chunk
        const matches = streamTextRef.current.match(/第\d+章/g)
        const found = matches ? new Set(matches).size : 0
        if (found > 0 && found !== detectedChaptersRef.current) {
          detectedChaptersRef.current = found
          setStatus(`正在生成第 ${Math.min(found, chapterCount)}/${chapterCount} 章...`)
        }
        const est = Math.min(90, Math.round((streamTextRef.current.length / 5000) * 90))
        setProgress(est)
      },
      () => {
        const text = streamTextRef.current.trim()
        let parsed: any = null

        try { parsed = JSON.parse(text) } catch {}

        if (!parsed) {
          const start = text.indexOf('{')
          const end = text.lastIndexOf('}')
          if (start >= 0 && end > start) {
            try { parsed = JSON.parse(text.slice(start, end + 1)) } catch {}
          }
        }

        if (!parsed) {
          const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
          if (m) {
            try { parsed = JSON.parse(m[1].trim()) } catch {}
          }
        }

        if (!parsed || !parsed.chapters || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
          setError('未能解析生成的章节数据，请重试')
          setGenerating(false)
          return
        }

        const chapters = parsed.chapters.map((ch: any) => ({
          id: genChapterId(),
          title: ch.title || '',
          content: ch.content || '',
          exercises: (ch.exercises || []).map((ex: any) => ({ ...ex, type: ex.type || 'coding' })),
          quiz: ch.quiz || [],
          status: 'done' as const
        }))

        addChapters(courseId, chapters)
        setGenerating(false)
        setProgress(100)
        setStatus('扩写完成！')
        onDone()
      },
      (err) => {
        setError(err)
        setGenerating(false)
        setStatus('')
      }
    )

    cancelRef.current = cleanup
  }

  const handleCancel = () => {
    cancelRef.current?.()
    setGenerating(false)
    setStatus('已取消')
    setProgress(0)
  }

  if (!course) return null

  return (
    <div className="bg-surface-light rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-1">章节扩写</h3>
      <p className="text-sm text-gray-400 mb-4">
        为「{course.title}」追加新章节（已有 {currentChapterCount} 章）
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">章节数</label>
          <input
            type="number"
            min={1}
            max={effectiveMax}
            value={chapterCount}
            onChange={e => setChapterCount(clampChapter(Number(e.target.value)))}
            disabled={generating}
            className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-0.5">1-{effectiveMax}（总量上限 500）</p>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">每章题目数</label>
          <input
            type="number"
            min={1}
            max={10}
            value={qCount}
            onChange={e => setQCount(clampQ(Number(e.target.value)))}
            disabled={generating}
            className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-0.5">1-10</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">额外要求（可选）</label>
        <textarea
          value={extra}
          onChange={e => setExtra(e.target.value)}
          placeholder="例如: 增加实战项目, 多讲高级特性..."
          disabled={generating}
          rows={2}
          className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none disabled:opacity-50"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleGenerate}
          disabled={generating || effectiveMax < 1}
          className="px-5 py-2 bg-accent text-surface-dark rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? '扩写中...' : '开始扩写'}
        </button>
        {generating && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-surface border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-surface-dark transition-colors"
          >
            取消
          </button>
        )}
      </div>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {(generating || progress > 0) && (
        <div className="border-t border-gray-700 pt-4">
          {status && (
            <div className="flex items-center gap-2 mb-3">
              {generating && (
                <svg className="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <p className={`text-sm ${
                status === '扩写完成！' ? 'text-accent-green'
                : status === '已取消' ? 'text-gray-500'
                : 'text-gray-300'
              }`}>
                {status}
              </p>
            </div>
          )}

          {generating && (
            <div className="mb-3">
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, progress)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {effectiveMax < 1 && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3">
          <p className="text-sm text-accent-yellow">课程已达 500 章上限，无法继续扩写</p>
        </div>
      )}
    </div>
  )
}
