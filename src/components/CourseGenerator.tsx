import { useState, useRef, useEffect } from 'react'
import { CourseGenParams, Course, Chapter } from '../types'
import { useCourseStore, genId, genChapterId } from '../stores/course'
import { generateCourse } from '../lib/ipc'

interface Props {
  onDone: () => void
}

const difficultyOptions = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' }
]

export default function CourseGenerator({ onDone }: Props) {
  const addCourse = useCourseStore(s => s.addCourse)

  const [params, setParams] = useState<CourseGenParams>({
    language: '',
    direction: '',
    difficulty: 'beginner',
    chapterCount: 5,
    questionsPerChapter: 3,
    extra: ''
  })

  const [generating, setGenerating] = useState(false)
  const [outline, setOutline] = useState('')
  const [status, setStatus] = useState('')
  const [chapterTitles, setChapterTitles] = useState<{ index: number; title: string }[]>([])
  const [currentChapter, setCurrentChapter] = useState(0)
  const [totalChapters, setTotalChapters] = useState(0)
  const [error, setError] = useState('')

  const chaptersRef = useRef<any[]>([])
  const outlineRef = useRef('')
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  const updateParam = (key: keyof CourseGenParams, value: string | number) => {
    setParams(prev => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  const handleGenerate = () => {
    if (!params.language.trim()) { setError('请输入编程语言'); return }
    if (!params.direction.trim()) { setError('请输入学习方向'); return }

    setGenerating(true)
    setError('')
    setOutline('')
    setStatus('正在生成课程大纲...')
    setChapterTitles([])
    setCurrentChapter(0)
    setTotalChapters(params.chapterCount)
    chaptersRef.current = []
    outlineRef.current = ''

    const cleanup = generateCourse(
      params,
      (outlineText) => {
        setOutline(outlineText)
        outlineRef.current = outlineText
        setStatus('大纲已生成，正在生成章节内容...')
      },
      (data) => {
        setCurrentChapter(data.index + 1)
        setTotalChapters(data.total)
        setStatus(`正在生成第 ${data.index + 1}/${data.total} 章...`)
        try {
          const ch = JSON.parse(data.chapterJson)
          chaptersRef.current[data.index] = ch
          setChapterTitles(prev => [...prev, { index: data.index, title: ch.title || `第${data.index + 1}章` }])
        } catch {
          setChapterTitles(prev => [...prev, { index: data.index, title: `第${data.index + 1}章` }])
        }
      },
      () => {
        const chapters: Chapter[] = chaptersRef.current
          .filter(Boolean)
          .map((ch: any) => ({
            id: genChapterId(),
            title: ch.title || '',
            content: ch.content || '',
            exercises: (ch.exercises || []).map((ex: any) => ({ ...ex, type: ex.type || 'coding' })),
            quiz: ch.quiz || [],
            status: 'done' as const
          }))

        const course: Course = {
          id: genId(),
          language: params.language.toLowerCase(),
          title: `${params.language} ${params.direction}`,
          description: outlineRef.current?.slice(0, 200) || '',
          difficulty: params.difficulty as 'beginner' | 'intermediate' | 'advanced',
          chapters,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        addCourse(course)
        setGenerating(false)
        setStatus('生成完成！')
        onDone()
      },
      (err) => {
        setError(err)
        setGenerating(false)
        setStatus('')
      }
    )

    cleanupRef.current = cleanup
  }

  const handleCancel = () => {
    cleanupRef.current?.()
    setGenerating(false)
    setStatus('已取消')
  }

  return (
    <div className="bg-surface-light rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">AI 课程生成</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">编程语言</label>
          <input
            type="text"
            value={params.language}
            onChange={e => updateParam('language', e.target.value)}
            placeholder="例如: Python, Rust, Go..."
            disabled={generating}
            className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">学习方向</label>
          <input
            type="text"
            value={params.direction}
            onChange={e => updateParam('direction', e.target.value)}
            placeholder="例如: 零基础入门, 异步编程..."
            disabled={generating}
            className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">难度</label>
          <select
            value={params.difficulty}
            onChange={e => updateParam('difficulty', e.target.value)}
            disabled={generating}
            className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50"
          >
            {difficultyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">章节数</label>
            <input
              type="number"
              min={1}
              max={20}
              value={params.chapterCount}
              onChange={e => updateParam('chapterCount', Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              disabled={generating}
              className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">每章题目</label>
            <input
              type="number"
              min={1}
              max={10}
              value={params.questionsPerChapter}
              onChange={e => updateParam('questionsPerChapter', Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              disabled={generating}
              className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">额外要求（可选）</label>
        <textarea
          value={params.extra}
          onChange={e => updateParam('extra', e.target.value)}
          placeholder="例如: 多讲实战项目, 重点解释概念原理..."
          disabled={generating}
          rows={2}
          className="w-full bg-surface border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none disabled:opacity-50"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2 bg-accent text-surface-dark rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? '生成中...' : '开始生成'}
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

      {(generating || outline || chapterTitles.length > 0 || status) && (
        <div className="border-t border-gray-700 pt-4">
          {status && (
            <div className="flex items-center gap-2 mb-3">
              {generating && (
                <svg className="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <p className={`text-sm ${status === '生成完成！' ? 'text-accent-green' : status === '已取消' ? 'text-gray-500' : 'text-gray-300'}`}>
                {status}
              </p>
            </div>
          )}

          {generating && totalChapters > 0 && (
            <div className="mb-3">
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${(currentChapter / totalChapters) * 100}%` }}
                />
              </div>
            </div>
          )}

          {outline && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">课程大纲</p>
              <div className="bg-surface rounded-lg p-3 text-sm text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {outline}
              </div>
            </div>
          )}

          {chapterTitles.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                已生成章节 ({chapterTitles.length}{totalChapters > 0 ? `/${totalChapters}` : ''})
              </p>
              <div className="space-y-1">
                {chapterTitles
                  .sort((a, b) => a.index - b.index)
                  .map((ch) => (
                    <div key={ch.index} className="flex items-center gap-2 text-sm text-gray-300 px-2 py-1">
                      <span className="text-accent-green text-xs">&#10003;</span>
                      <span>{ch.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
