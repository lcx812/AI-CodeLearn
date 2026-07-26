import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Check, Code2, FileText, ListChecks, X } from 'lucide-react'
import { useCourseStore, genChapterId } from '../stores/course'
import { chatStream } from '../lib/ipc'
import type { Chapter, ChoiceQuestion, Exercise } from '../types'
import ChatPanel from '../components/chat/ChatPanel'
import ChapterExpander from '../components/ChapterExpander'
import { CHAPTER_LIMIT } from '../lib/constants'
import { extractJson, formatDate, getDifficultyLabel, getStatusIcon } from '../lib/utils'
import MarkdownRenderer from '../components/ui/MarkdownRenderer'
import DifficultyBadge from '../components/ui/DifficultyBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

/* ================================================================
   QuizCard
   ================================================================ */
function QuizCard({
  q, qi, answered, chosen, onChoose
}: {
  q: ChoiceQuestion; qi: number; answered: boolean; chosen: number | undefined; onChoose: (oi: number) => void
}) {
  const correct = chosen === q.correctIndex
  return (
    <div className="bg-surface-dark border border-line rounded-lg p-4">
      <p className="text-sm font-semibold text-ink mb-3">
        {qi + 1}. {q.question}
      </p>
      <div className="space-y-1.5">
        {q.options.map((opt, oi) => {
          const picked = chosen === oi
          const isCorrect = oi === q.correctIndex
          let cls = 'w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center '
          if (!answered) {
            cls += 'hover:bg-surface text-ink-muted'
          } else if (isCorrect) {
            cls += 'bg-accent-green/20 text-accent-green'
          } else if (picked && !isCorrect) {
            cls += 'bg-accent-red/20 text-accent-red'
          } else {
            cls += 'text-ink-muted/60'
          }
          return (
            <button key={oi} onClick={() => onChoose(oi)} disabled={answered} className={cls}>
              <span className="mr-2 font-mono text-xs">{'ABCD'[oi]}.</span>
              {opt}
              {answered && isCorrect && <Check className="h-3.5 w-3.5 ml-auto" />}
              {answered && picked && !isCorrect && <X className="h-3.5 w-3.5 ml-auto" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mt-3 p-3 rounded text-sm ${correct ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
          {correct ? '回答正确！' : `正确答案是 ${'ABCD'[q.correctIndex]}`}
          {q.explanation && <p className="mt-1.5 text-ink-muted text-xs">{q.explanation}</p>}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   ExerciseCard
   ================================================================ */
function ExerciseCard({ ex, onOpen }: { ex: Exercise; onOpen: () => void }) {
  return (
    <div className="bg-surface-dark border border-line rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-sm text-xs bg-accent/20 text-accent flex items-center gap-1">
          {ex.type === 'coding' ? <><Code2 className="h-3 w-3" /> 编程题</> : <><ListChecks className="h-3 w-3" /> 选择题</>}
        </span>
        <span className="text-xs text-ink-muted">{ex.language}</span>
        <DifficultyBadge difficulty={ex.difficulty} />
      </div>
      <h4 className="font-semibold text-sm mb-1.5">{ex.title}</h4>
      <p className="text-xs text-ink-muted mb-3">{ex.description}</p>
      {ex.testCases && ex.testCases.length > 0 && (
        <div className="mb-3">
          <p className="text-2xs text-ink-muted mb-1.5 uppercase tracking-wide">Test Cases</p>
          {ex.testCases.slice(0, 3).map((tc, tci) => (
            <div key={tci} className="bg-surface rounded p-2 text-xs font-mono mb-1">
              <div className="text-accent">&gt; {tc.input}</div>
              <div className="text-ink-muted">{tc.expected}</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onOpen}
        className="w-full px-3 py-2 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors flex items-center justify-center gap-1.5">
        <Code2 className="h-3.5 w-3.5" /> 在练习场打开
      </button>
    </div>
  )
}

/* ================================================================
   Main
   ================================================================ */
export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { courses, deleteCourse, addChapters } = useCourseStore()

  const course = useMemo(() => courses.find(c => c.id === id) || null, [courses, id])

  const [chId, setChId] = useState<string | null>(null)
  const [tab, setTab] = useState<'content' | 'chat'>('content')

  const [expanding, setExpanding] = useState(false)
  const [showExpander, setShowExpander] = useState(false)
  const [expandText, setExpandText] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  const cleanup = useRef<(() => void) | null>(null)
  const firstRender = useRef(true)

  const ch = useMemo(
    () => course?.chapters.find(c => c.id === chId) || null,
    [course, chId]
  )

  useEffect(() => {
    if (firstRender.current && course && course.chapters.length > 0 && !chId) {
      setChId(course.chapters[0].id)
      firstRender.current = false
    }
  }, [course, chId])

  useEffect(() => {
    setAnswers({})
    setRevealed({})
  }, [chId])

  useEffect(() => () => { cleanup.current?.() }, [])

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-muted gap-4">
        <BookOpen className="h-10 w-10 text-line" />
        <p>课程未找到</p>
        <button onClick={() => nav('/courses')}
          className="px-4 py-2 bg-accent text-surface-dark rounded-lg text-sm">
          返回课程列表
        </button>
      </div>
    )
  }

  function answerQuiz(qi: number, oi: number) {
    setAnswers(prev => ({ ...prev, [qi]: oi }))
    setRevealed(prev => ({ ...prev, [qi]: true }))
  }

  function handleExpand() {
    if (expanding || course!.chapters.length >= CHAPTER_LIMIT) return
    cleanup.current?.()

    const titles = course!.chapters.map(c => c.title).join('、')
    const prompt = `你是课程设计专家。为以下课程扩写 3-5 个新章节（按学习顺序排列）。

课程：${course!.title}（${course!.language}，${getDifficultyLabel(course!.difficulty)}）
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

  function handleDelete() {
    setConfirmOpen(true)
  }

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
      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => nav('/courses')}
            className="px-3 py-1.5 text-sm rounded-lg bg-surface-light text-ink-muted hover:text-ink transition-colors shrink-0 flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回
          </button>
          <h1 className="text-lg font-bold truncate">{course.title}</h1>
          <DifficultyBadge difficulty={course.difficulty} />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowExpander(!showExpander)}
            disabled={expanding || course.chapters.length >= CHAPTER_LIMIT}
            className="px-3 py-1.5 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors">
            {showExpander ? '收起扩写' : '扩写'}
          </button>
          <button onClick={handleDelete}
            className="px-3 py-1.5 text-sm rounded-lg bg-accent-red/10 text-accent-red border border-accent-red/30 hover:bg-accent-red/20 transition-colors">
            删除
          </button>
        </div>
      </div>

      {/* Expander */}
      {showExpander && (
        <div className="mb-4 shrink-0">
          <ChapterExpander
            courseId={course.id}
            currentChapterCount={course.chapters.length}
            onDone={() => setShowExpander(false)}
          />
        </div>
      )}

      {/* Main: left outline + right content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: outline */}
        <aside className="w-56 bg-surface-light border border-line rounded-xl flex flex-col shrink-0 overflow-hidden">
          <button onClick={() => setChId(null)}
            className="w-full text-left p-3 border-b border-line text-sm font-semibold truncate shrink-0 hover:bg-surface-dark transition-colors">
            课程大纲
          </button>
          <nav className="flex-1 overflow-auto p-2">
            {course.chapters.length === 0 ? (
              <p className="p-3 text-xs text-ink-muted text-center">
                暂无章节，点击上方“扩写”生成
              </p>
            ) : (
              course.chapters.map(c => {
                const StatusIcon = getStatusIcon(c.status)
                return (
                <button key={c.id}
                  onClick={() => { setChId(c.id); setTab('content') }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors mb-0.5 ${
                    chId === c.id
                      ? 'bg-accent/10 text-accent'
                      : 'hover:bg-surface-dark text-ink-muted'
                  }`}>
                  <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${c.status === 'generating' ? 'animate-spin' : ''}`} />
                  <span className="truncate">{c.title}</span>
                </button>
                )
              })
            )}
          </nav>
        </aside>

        {/* Right: content + tabs */}
        <main className="flex-1 bg-surface-light border border-line rounded-xl flex flex-col overflow-hidden min-w-0">
          {/* Tabs */}
          <div className="flex border-b border-line shrink-0">
            {(['content', 'chat'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors border-b ${
                  tab === t
                    ? 'text-accent border-accent'
                    : 'text-ink-muted border-transparent hover:text-ink'
                }`}>
                {t === 'content' ? '章节内容' : 'AI 提问'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto min-h-0">
            {tab === 'content' ? (
              <div className="p-6">
                {!ch ? (
                  <div>
                    <h2 className="text-xl font-bold mb-4">{course.title}</h2>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-surface-dark border border-line rounded-lg p-3">
                        <p className="text-2xs text-ink-muted uppercase tracking-wider mb-0.5">Language</p>
                        <p className="text-sm font-semibold">{course.language}</p>
                      </div>
                      <div className="bg-surface-dark border border-line rounded-lg p-3">
                        <p className="text-2xs text-ink-muted uppercase tracking-wider mb-0.5">Difficulty</p>
                        <p className="text-sm font-semibold">{getDifficultyLabel(course.difficulty)}</p>
                      </div>
                      <div className="bg-surface-dark border border-line rounded-lg p-3">
                        <p className="text-2xs text-ink-muted uppercase tracking-wider mb-0.5">Chapters</p>
                        <p className="text-sm font-semibold">{course.chapters.length} chapters</p>
                      </div>
                      <div className="bg-surface-dark border border-line rounded-lg p-3">
                        <p className="text-2xs text-ink-muted uppercase tracking-wider mb-0.5">Created</p>
                        <p className="text-sm font-semibold">{formatDate(course.createdAt)}</p>
                      </div>
                    </div>

                    <p className="text-ink-muted text-sm">← 点击左侧章节开始学习</p>
                  </div>
                ) : (
                  /* Chapter content */
                  <div>
                    <h2 className="text-xl font-bold mb-6">{ch.title}</h2>

                    {ch.content ? (
                      <MarkdownRenderer content={ch.content} />
                    ) : (
                      <div className="text-center text-ink-muted py-16 mb-8">
                        <FileText className="h-10 w-10 text-line mx-auto mb-3" />
                        <p className="text-sm">此章节暂无内容</p>
                        <p className="text-xs mt-1 text-ink-muted/60">切换到「AI 提问」让 AI 生成内容</p>
                      </div>
                    )}

                    {/* Chapter exercises */}
                    <div className="border-t border-line pt-6 mt-4">
                      <h3 className="text-lg font-bold mb-5">章末题目</h3>

                      {ch.quiz.length === 0 && ch.exercises.length === 0 ? (
                        <div className="text-center text-ink-muted py-8">
                          <p className="text-sm">暂无题目</p>
                          <p className="text-xs mt-1 text-ink-muted/60">在 AI 提问中让 AI 生成题目</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {ch.quiz.map((q, qi) => (
                            <QuizCard key={qi} q={q} qi={qi}
                              answered={!!revealed[qi]} chosen={answers[qi]}
                              onChoose={(oi) => answerQuiz(qi, oi)} />
                          ))}

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
              /* AI Chat tab */
              <ChatPanel courseId={course.id} chapter={ch} />
            )}
          </div>
        </main>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={`确定删除课程「${course.title}」？此操作不可撤销。`}
        onConfirm={() => { deleteCourse(course.id); nav('/courses') }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
