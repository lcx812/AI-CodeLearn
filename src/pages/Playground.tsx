import { useState, useEffect, useMemo } from 'react'
import { useSettingsStore } from '../stores/settings'
import { useCourseStore } from '../stores/course'
import { getDifficultyLabel } from '../lib/utils'
import Editor from '../components/Editor'
import ExercisePanel from '../components/ExercisePanel'
import { generatePlaygroundExercise, reviewCode, openFile } from '../lib/ipc'
import { Exercise, CodeReview, Chapter } from '../types'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import { useChat } from '../hooks/useChat'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export default function Playground() {
  const isApiReady = useSettingsStore(s => s.isApiReady)
  const courses = useCourseStore(s => s.courses)
  const currentCourseId = useCourseStore(s => s.currentCourseId)

  const [selectedCourseId, setSelectedCourseId] = useState(currentCourseId || '')
  const [selectedChapterId, setSelectedChapterId] = useState('')
  const [exerciseType, setExerciseType] = useState<'project' | 'exercise'>('exercise')
  const [direction, setDirection] = useState('')

  useEffect(() => {
    if (currentCourseId) setSelectedCourseId(currentCourseId)
  }, [currentCourseId])

  useEffect(() => {
    setSelectedChapterId('')
  }, [selectedCourseId])

  useEffect(() => {
    const raw = localStorage.getItem('playground_exercise')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.courseId) setSelectedCourseId(data.courseId)
      if (data.chapterId) setSelectedChapterId(data.chapterId)
      if (data.exercise) {
        setExercise(data.exercise)
        setCode(data.exercise.starterCode || '# 在此编写代码\n')
      }
    } catch { /* ignore */ }
    localStorage.removeItem('playground_exercise')
  }, [])

  const selectedCourse = useMemo(
    () => courses.find(c => c.id === selectedCourseId),
    [courses, selectedCourseId],
  )
  const chapters: Chapter[] = selectedCourse?.chapters || []
  const selectedLang = selectedCourse?.language || 'python'

  const [code, setCode] = useState('# 在此编写代码\n')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(false)
  const [genError, setGenError] = useState('')
  const [review, setReview] = useState<CodeReview | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const [showExercise, setShowExercise] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)

  const [followUpInput, setFollowUpInput] = useState('')

  // 追问上下文：题目 + 当前代码 + 上次审查结果（随状态动态重建）
  const followUpPrompt = useMemo(() => {
    if (!review) return ''
    const ctx = [
      '【题目要求】',
      exercise?.description || '',
      '',
      '【学生代码】',
      '```',
      code,
      '```',
      '',
      '【上次审查结果】',
      JSON.stringify(review, null, 2),
    ].join('\n')
    return ['你是一位编程导师，请基于以下上下文回答学生的追问。', '上下文：', ctx].join('\n')
  }, [exercise, code, review])

  const followUp = useChat({ scope: 'local', systemPrompt: followUpPrompt })

  useEffect(() => {
    if (review) setShowFeedback(true)
  }, [review])

  const buildCourseContext = (): string => {
    if (!selectedCourse) return ''
    const parts = [
      `课程：${selectedCourse.title}（${selectedCourse.language}，${selectedCourse.difficulty}）`,
    ]

    if (selectedChapterId && chapters.length > 0) {
      const ch = chapters.find(c => c.id === selectedChapterId)
      if (ch) {
        parts.push(`当前章节：${ch.title}`)
        parts.push(`章节内容：${ch.content}`)
        if (ch.exercises.length > 0) {
          parts.push(`章节已有练习题：${ch.exercises.map(e => e.title).join('、')}`)
        }
      }
    } else {
      parts.push(`范围：整个课程（共 ${chapters.length} 个章节）`)
      const titles = chapters.map(c => c.title).join('、')
      if (titles) parts.push(`章节列表：${titles}`)
    }

    return parts.join('\n')
  }

  const handleGenerate = async () => {
    if (!isApiReady) return
    setLoading(true)
    setReview(null)
    setGenError('')
    followUp.clear()
    setShowFeedback(false)

    const courseContext = buildCourseContext()
    const typeStr = exerciseType === 'project' ? 'project' : 'exercise'

    try {
      const ex = await generatePlaygroundExercise({
        language: selectedLang,
        direction: direction || '基础编程',
        type: typeStr,
        courseContext,
      }) as Exercise
      if (!ex || typeof ex !== 'object' || 'error' in ex) throw new Error('AI 返回格式异常，请重试')
      setExercise(ex)
      setCode(ex.starterCode || code)
    } catch (e) {
      setGenError(`题目生成失败：${errMsg(e)}`)
    }
    setLoading(false)
  }

  const handleReview = async () => {
    if (!isApiReady || !exercise) return
    setReviewing(true)
    setReviewError('')
    followUp.clear()
    try {
      const r = await reviewCode(code, exercise.description, selectedLang)
      if (!r || typeof r !== 'object' || 'error' in r) throw new Error('AI 返回格式异常，请重试')
      setReview(r)
    } catch (e) {
      setReviewError(`代码审查失败：${errMsg(e)}`)
      setShowFeedback(true)
    }
    setReviewing(false)
  }

  const handleUpload = async () => {
    const result = await openFile()
    if (result) {
      setCode(result.content)
      setReview(null)
      followUp.clear()
    }
  }

  const handleSendFollowUp = () => {
    const q = followUpInput.trim()
    if (!q || followUp.isStreaming || !review) return
    setFollowUpInput('')
    followUp.send(q)
  }

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-accent-green' : s >= 60 ? 'text-accent-yellow' : 'text-accent-red'

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">练习场</h2>
            <button
              onClick={() => setShowExercise(!showExercise)}
              className="px-2 py-1 text-xs rounded bg-surface-light text-gray-400 hover:text-white transition-colors"
              title={showExercise ? '隐藏题目' : '显示题目'}
            >
              {showExercise ? '隐藏题目' : '显示题目'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-surface-light text-gray-300 rounded-lg text-sm font-medium hover:bg-surface-dark transition-colors"
            >
              上传文件
            </button>
            <button
              onClick={handleReview}
              disabled={!exercise || reviewing}
              className="px-4 py-2 bg-accent-green text-surface-dark rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-green/90 transition-colors"
            >
              {reviewing ? '审查中...' : '提交审查'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">课程</label>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="px-2.5 py-1.5 text-sm rounded-lg bg-surface-light text-gray-200 border border-gray-700 focus:outline-none focus:border-accent"
            >
              {courses.length === 0 && (
                <option value="">尚无课程</option>
              )}
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.language})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">章节</label>
            <select
              value={selectedChapterId}
              onChange={e => setSelectedChapterId(e.target.value)}
              className="px-2.5 py-1.5 text-sm rounded-lg bg-surface-light text-gray-200 border border-gray-700 focus:outline-none focus:border-accent"
              disabled={!selectedCourseId || chapters.length === 0}
            >
              <option value="">整个课程</option>
              {chapters.map(ch => (
                <option key={ch.id} value={ch.id}>
                  {ch.title} {ch.status === 'done' ? '✓' : ch.status === 'generating' ? '...' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">类型</label>
            <div className="flex rounded-lg bg-surface-light p-0.5">
              <button
                onClick={() => setExerciseType('project')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  exerciseType === 'project'
                    ? 'bg-accent text-surface-dark font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                综合项目
              </button>
              <button
                onClick={() => setExerciseType('exercise')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  exerciseType === 'exercise'
                    ? 'bg-accent text-surface-dark font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                章节练习
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 whitespace-nowrap">方向</label>
            <input
              value={direction}
              onChange={e => setDirection(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="例如：多线程文件下载器"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-surface-light text-gray-200 placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-1.5 text-sm rounded-lg bg-accent text-surface-dark font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors whitespace-nowrap"
            >
              {loading ? '生成中...' : '生成题目'}
            </button>
          </div>
        </div>

        {selectedCourse && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>语言：{selectedLang}</span>
            <span>|</span>
            <span>难度：{getDifficultyLabel(selectedCourse.difficulty)}</span>
            <span>|</span>
            <span>范围：{selectedChapterId ? chapters.find(c => c.id === selectedChapterId)?.title || '未知章节' : '整个课程'}</span>
          </div>
        )}

        {exercise && genError && <ErrorDisplay message={genError} />}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {showExercise && (
          <div className="w-80 bg-surface-light rounded-xl overflow-hidden flex-shrink-0">
            <ExercisePanel
              exercise={exercise}
              loading={loading}
              error={genError}
              onGenerate={handleGenerate}
            />
          </div>
        )}
        <div className="flex-1 bg-surface-dark rounded-xl overflow-hidden">
          <Editor
            language={exercise?.language || selectedLang}
            value={code}
            onChange={setCode}
          />
        </div>
      </div>

      <div className="flex-shrink-0 mt-4">
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
        >
          <span>AI 反馈</span>
          <span>{showFeedback ? '▼' : '▶'}</span>
          {!showFeedback && review && (
            <span className="w-2 h-2 rounded-full bg-accent-green" />
          )}
        </button>

        {showFeedback && (
          <div className="bg-surface-light rounded-xl mt-2 overflow-hidden">
            <div className="p-4 max-h-80 overflow-auto">
              {reviewError && <ErrorDisplay message={reviewError} />}
              {!review ? (
                !reviewError && (
                  <p className="text-sm text-gray-500">
                    生成题目并提交代码后，AI 反馈将显示在这里
                  </p>
                )
              ) : (
                <>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">正确性：</span>
                      {review.correctness}
                    </div>
                    <div>
                      <span className="text-gray-400">代码风格：</span>
                      {review.style}
                    </div>
                    {review.edgeCases && (
                      <div>
                        <span className="text-gray-400">边界处理：</span>
                        {review.edgeCases}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">评分：</span>
                      <span className={`font-bold ${scoreColor(review.score)}`}>
                        {review.score}/100
                      </span>
                    </div>
                    {review.suggestions.length > 0 && (
                      <div>
                        <div className="text-gray-400 mb-1">改进建议：</div>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          {review.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <div className="space-y-2 mb-3 max-h-40 overflow-auto">
                      {followUp.messages.map((m, i) => (
                        <div
                          key={i}
                          className={`text-sm p-2 rounded-lg ${
                            m.role === 'user'
                              ? 'bg-accent/10 text-blue-300 ml-8'
                              : 'bg-surface-dark text-gray-200 mr-8'
                          }`}
                        >
                          <span className="font-semibold text-xs block mb-0.5">
                            {m.role === 'user' ? '你' : 'AI'}
                          </span>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                      ))}
                      {followUp.isStreaming && (
                        <div className="text-sm p-2 rounded-lg bg-surface-dark text-gray-200 mr-8">
                          <span className="font-semibold text-xs block mb-0.5">AI</span>
                          <div className="whitespace-pre-wrap">
                            {followUp.currentStream}
                            <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={followUpInput}
                        onChange={e => setFollowUpInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendFollowUp()}
                        placeholder="追问..."
                        disabled={followUp.isStreaming}
                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-dark text-gray-200 placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-accent disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendFollowUp}
                        disabled={!followUpInput.trim() || followUp.isStreaming}
                        className="px-4 py-2 text-sm rounded-lg bg-accent text-surface-dark font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors"
                      >
                        发送
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
