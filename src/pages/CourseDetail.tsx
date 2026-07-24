import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useCourseStore, genChapterId } from '../stores/course'
import { chatStream } from '../lib/ipc'
import type { Chapter, ChoiceQuestion, Exercise } from '../types'
import ChatPanel from '../components/chat/ChatPanel'
import ChapterExpander from '../components/ChapterExpander'

const DIFF: Record<string, string> = { beginner: '入门', intermediate: '中级', advanced: '高级' }
const ST_ICON: Record<string, string> = { done: '📚', generating: '📝', pending: '⬜' }

function extractJson(text: string): string | null {
  const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  return m ? m[1].trim() : null
}

function diffTag(d: string) {
  if (d === 'beginner') return 'bg-accent-green/20 text-accent-green'
  if (d === 'intermediate') return 'bg-accent-yellow/20 text-accent-yellow'
  return 'bg-accent-red/20 text-accent-red'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ================================================================
   选择题卡片
   ================================================================ */
function QuizCard({
  q, qi, answered, chosen, onChoose
}: {
  q: ChoiceQuestion; qi: number; answered: boolean; chosen: number | undefined; onChoose: (oi: number) => void
}) {
  const correct = chosen === q.correctIndex
  return (
    <div className="bg-surface-dark rounded-lg p-4">
      <p className="text-sm font-semibold text-gray-200 mb-3">
        {qi + 1}. {q.question}
      </p>
      <div className="space-y-1.5">
        {q.options.map((opt, oi) => {
          const picked = chosen === oi
          const isCorrect = oi === q.correctIndex
          let cls = 'w-full text-left px-3 py-2 rounded text-sm transition-colors '
          if (!answered) {
            cls += 'hover:bg-surface text-gray-400'
          } else if (isCorrect) {
            cls += 'bg-accent-green/20 text-accent-green'
          } else if (picked && !isCorrect) {
            cls += 'bg-accent-red/20 text-accent-red'
          } else {
            cls += 'text-gray-500'
          }
          return (
            <button key={oi} onClick={() => onChoose(oi)} disabled={answered} className={cls}>
              <span className="mr-2 font-mono text-xs">{'ABCD'[oi]}.</span>
              {opt}
              {answered && isCorrect && ' ✓'}
              {answered && picked && !isCorrect && ' ✗'}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mt-3 p-3 rounded text-sm ${correct ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
          {correct ? '✅ 回答正确！' : `❌ 正确答案是 ${'ABCD'[q.correctIndex]}`}
          {q.explanation && <p className="mt-1.5 text-gray-400 text-xs">{q.explanation}</p>}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   编程题卡片
   ================================================================ */
function ExerciseCard({ ex, onOpen }: { ex: Exercise; onOpen: () => void }) {
  return (
    <div className="bg-surface-dark rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">
          {ex.type === 'coding' ? '💻 编程题' : '📋 选择题'}
        </span>
        <span className="text-xs text-gray-500">{ex.language}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${diffTag(ex.difficulty)}`}>
          {DIFF[ex.difficulty] || ex.difficulty}
        </span>
      </div>
      <h4 className="font-semibold text-sm mb-1.5">{ex.title}</h4>
      <p className="text-xs text-gray-400 mb-3">{ex.description}</p>
      {ex.testCases && ex.testCases.length > 0 && (
        <div className="mb-3">
          <p className="text-2xs text-gray-500 mb-1.5 uppercase tracking-wide">测试用例</p>
          {ex.testCases.slice(0, 3).map((tc, tci) => (
            <div key={tci} className="bg-surface rounded p-2 text-xs font-mono mb-1">
              <div className="text-green-400">&gt; {tc.input}</div>
              <div className="text-blue-400">{tc.expected}</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onOpen}
        className="w-full px-3 py-2 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
        💻 在练习场打开
      </button>
    </div>
  )
}

/* ================================================================
   主组件
   ================================================================ */
export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { courses, deleteCourse, addChapters } = useCourseStore()

  const course = useMemo(() => courses.find(c => c.id === id) || null, [courses, id])

  // ---- state ----
  const [chId, setChId] = useState<string | null>(null)
  const [tab, setTab] = useState<'content' | 'chat'>('content')

  // 扩写
  const [expanding, setExpanding] = useState(false)
  const [showExpander, setShowExpander] = useState(false)
  const [expandText, setExpandText] = useState('')

  // 选择题答案
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  const cleanup = useRef<(() => void) | null>(null)
  const firstRender = useRef(true)

  const ch = useMemo(
    () => course?.chapters.find(c => c.id === chId) || null,
    [course, chId]
  )

  // 默认选中第一章（仅首次）
  useEffect(() => {
    if (firstRender.current && course && course.chapters.length > 0 && !chId) {
      setChId(course.chapters[0].id)
      firstRender.current = false
    }
  }, [course, chId])

  // 切换章节时重置答案状态
  useEffect(() => {
    setAnswers({})
    setRevealed({})
  }, [chId])

  // 卸载清理
  useEffect(() => () => { cleanup.current?.() }, [])

  // 未找到课程
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
        <div className="text-5xl">📚</div>
        <p>课程未找到</p>
        <button onClick={() => nav('/courses')}
          className="px-4 py-2 bg-accent text-surface-dark rounded-lg text-sm">
          返回课程列表
        </button>
      </div>
    )
  }

  // ---- 选择题作答 ----
  function answerQuiz(qi: number, oi: number) {
    setAnswers(prev => ({ ...prev, [qi]: oi }))
    setRevealed(prev => ({ ...prev, [qi]: true }))
  }

  // ---- 扩写 ----
  function handleExpand() {
    if (expanding || course!.chapters.length >= 500) return
    cleanup.current?.()

    const titles = course!.chapters.map(c => c.title).join('、')
    const prompt = `你是课程设计专家。为以下课程扩写 3-5 个新章节（按学习顺序排列）。

课程：${course!.title}（${course!.language}，${DIFF[course!.difficulty]}）
已有章节：${titles || '暂无'}

用 \`\`\`json 输出，格式：{"chapters": [{"title": "第N章: 标题", "content": "Markdown 教学内容", "quiz": [], "exercises": []}]}
只输出 JSON，不要其他文字。`

    setExpanding(true)
    setExpandText('')
    let acc = ''

    cleanup.current = chatStream(
      [{ role: 'user', content: '请为课程扩写新章节' }],
      prompt,
      (ck) => { acc += ck; setExpandText(acc) },
      () => {
        const json = extractJson(acc)
        if (json) {
          try {
            const obj = JSON.parse(json)
            if (obj.chapters && Array.isArray(obj.chapters)) {
              const chs: Chapter[] = obj.chapters.map((c: any, idx: number) => ({
                id: genChapterId(),
                title: c.title || `第${course!.chapters.length + idx + 1}章`,
                content: c.content || '',
                exercises: c.exercises || [],
                quiz: c.quiz || [],
                status: 'pending' as const,
              }))
              addChapters(course!.id, chs)
            }
          } catch { /* ignore parse error */ }
        }
        setExpanding(false)
        setExpandText('')
      },
      (err) => { setExpanding(false); console.error('expand error:', err) }
    )
  }

  // ---- 删除 ----
  function handleDelete() {
    if (confirm(`确定删除课程「${course!.title}」？此操作不可撤销。`)) {
      deleteCourse(course!.id)
      nav('/courses')
    }
  }

  // ---- 在练习场打开 ----
  function openPlayground(ex: Exercise) {
    localStorage.setItem('playground_exercise', JSON.stringify({
      courseId: course!.id,
      chapterId: ch?.id || null,
      exercise: ex,
    }))
    nav('/playground')
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ========== 顶栏 ========== */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => nav('/courses')}
            className="px-3 py-1.5 text-sm rounded-lg bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0">
            ← 返回
          </button>
          <h1 className="text-lg font-bold truncate">{course.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${diffTag(course.difficulty)} shrink-0`}>
            {DIFF[course.difficulty]}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowExpander(!showExpander)}
            disabled={expanding || course.chapters.length >= 500}
            className="px-3 py-1.5 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors">
            {showExpander ? '收起扩写' : '扩写'}
          </button>
          <button onClick={handleDelete}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
            删除
          </button>
        </div>
      </div>

      {/* ========== 扩写面板 ========== */}
      {showExpander && (
        <div className="mb-4 shrink-0">
          <ChapterExpander
            courseId={course.id}
            currentChapterCount={course.chapters.length}
            onDone={() => setShowExpander(false)}
          />
        </div>
      )}

      {/* ========== 主体：左大纲 + 右内容 ========== */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* ---- 左栏：课程大纲 ---- */}
        <aside className="w-56 bg-surface-light rounded-xl flex flex-col shrink-0 overflow-hidden">
          <button onClick={() => setChId(null)}
            className="w-full text-left p-3 border-b border-gray-700 text-sm font-semibold truncate shrink-0 hover:bg-surface-dark transition-colors">
            📚 课程大纲
          </button>
          <nav className="flex-1 overflow-auto p-2">
            {course.chapters.length === 0 ? (
              <p className="p-3 text-xs text-gray-500 text-center">
                暂无章节，点击上方"扩写"生成
              </p>
            ) : (
              course.chapters.map(c => (
                <button key={c.id}
                  onClick={() => { setChId(c.id); setTab('content') }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors mb-0.5 ${
                    chId === c.id
                      ? 'bg-accent/20 text-white'
                      : 'hover:bg-surface-dark text-gray-400'
                  }`}>
                  <span className="text-xs shrink-0">{ST_ICON[c.status] || '⬜'}</span>
                  <span className="truncate">{c.title}</span>
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* ---- 右栏：内容区 + 底部 Tab ---- */}
        <main className="flex-1 bg-surface-light rounded-xl flex flex-col overflow-hidden min-w-0">
          {/* Tab 切换 */}
          <div className="flex border-b border-gray-700 shrink-0">
            {(['content', 'chat'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  tab === t
                    ? 'text-accent border-accent'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}>
                {t === 'content' ? '📖 章节内容' : '💬 AI提问'}
              </button>
            ))}
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-auto min-h-0">
            {tab === 'content' ? (
              <div className="p-6">
                {/* ---- 初始状态：课程概述 ---- */}
                {!ch ? (
                  <div>
                    <h2 className="text-xl font-bold mb-4">{course.title}</h2>

                    {/* 课程信息卡片 */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-surface-dark rounded-lg p-3">
                        <p className="text-2xs text-gray-500 uppercase tracking-wider mb-0.5">语言</p>
                        <p className="text-sm font-semibold">{course.language}</p>
                      </div>
                      <div className="bg-surface-dark rounded-lg p-3">
                        <p className="text-2xs text-gray-500 uppercase tracking-wider mb-0.5">难度</p>
                        <p className="text-sm font-semibold">{DIFF[course.difficulty]}</p>
                      </div>
                      <div className="bg-surface-dark rounded-lg p-3">
                        <p className="text-2xs text-gray-500 uppercase tracking-wider mb-0.5">章节数</p>
                        <p className="text-sm font-semibold">{course.chapters.length} 章</p>
                      </div>
                      <div className="bg-surface-dark rounded-lg p-3">
                        <p className="text-2xs text-gray-500 uppercase tracking-wider mb-0.5">创建时间</p>
                        <p className="text-sm font-semibold">{formatTime(course.createdAt)}</p>
                      </div>
                    </div>

                    {/* 课程描述 */}
                    {course.description && (
                      <div className="bg-surface-dark rounded-lg p-4 mb-4">
                        <p className="text-2xs text-gray-500 uppercase tracking-wider mb-1.5">课程描述</p>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                const s = String(children).replace(/\n$/, '')
                                if (match) {
                                  return (
                                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                                      customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                      {s}
                                    </SyntaxHighlighter>
                                  )
                                }
                                return <code className="bg-surface px-1.5 py-0.5 rounded text-accent text-xs" {...props}>{children}</code>
                              }
                            }}
                          >
                            {course.description}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    <p className="text-gray-500 text-sm">← 点击左侧章节开始学习</p>
                  </div>
                ) : (
                  /* ---- 章节内容 ---- */
                  <div>
                    <h2 className="text-xl font-bold mb-6">{ch.title}</h2>

                    {/* Markdown 内容 */}
                    {ch.content ? (
                      <div className="prose prose-invert prose-sm max-w-none mb-8">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '')
                              const s = String(children).replace(/\n$/, '')
                              if (match) {
                                return (
                                  <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                                    customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                    {s}
                                  </SyntaxHighlighter>
                                )
                              }
                              return <code className="bg-surface px-1.5 py-0.5 rounded text-accent text-xs" {...props}>{children}</code>
                            }
                          }}
                        >
                          {ch.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-16 mb-8">
                        <p className="text-4xl mb-3">📝</p>
                        <p className="text-sm">此章节暂无内容</p>
                        <p className="text-xs mt-1 text-gray-600">切换到「AI提问」让 AI 生成内容</p>
                      </div>
                    )}

                    {/* ===== 章末题目（分隔线 + 全宽） ===== */}
                    <div className="border-t border-gray-700 pt-6 mt-4">
                      <h3 className="text-lg font-bold mb-5">📝 章末题目</h3>

                      {ch.quiz.length === 0 && ch.exercises.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p className="text-sm">暂无题目</p>
                          <p className="text-xs mt-1 text-gray-600">在 AI 提问中让 AI 生成题目</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* 选择题 */}
                          {ch.quiz.map((q, qi) => (
                            <QuizCard key={qi} q={q} qi={qi}
                              answered={!!revealed[qi]} chosen={answers[qi]}
                              onChoose={(oi) => answerQuiz(qi, oi)} />
                          ))}

                          {/* 编程题 */}
                          {ch.exercises.map((ex, ei) => (
                            <ExerciseCard key={ei} ex={ex}
                              onOpen={() => openPlayground(ex)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ---- AI 提问 Tab ---- */
              <ChatPanel courseId={course.id} chapter={ch} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
