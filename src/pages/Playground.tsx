import { useState, useRef, useEffect, useMemo } from 'react'
import { useSettingsStore } from '../stores/settings'
import { useCourseStore } from '../stores/course'
import Editor from '../components/Editor'
import ExercisePanel from '../components/ExercisePanel'
import { generatePlaygroundExercise, reviewCode, openFile, chatStream } from '../lib/ipc'
import { Exercise, CodeReview, Course, Chapter } from '../types'

export default function Playground() {
  const isApiReady = useSettingsStore(s => s.isApiReady)
  const courses = useCourseStore(s => s.courses)
  const currentCourseId = useCourseStore(s => s.currentCourseId)

  const course = useMemo(() => courses.find(c => c.id === currentCourseId), [courses, currentCourseId])
  const currentLang = course?.language || 'python'

  const [selectedCourseId, setSelectedCourseId] = useState(currentCourseId || '')
  const [selectedChapterId, setSelectedChapterId] = useState('')
  const [exerciseType, setExerciseType] = useState<'project' | 'exercise'>('exercise')
  const [direction, setDirection] = useState('')

  useEffect(() => { if (currentCourseId) setSelectedCourseId(currentCourseId) }, [currentCourseId])
  useEffect(() => { setSelectedChapterId('') }, [selectedCourseId])

  useEffect(() => {
    const raw = localStorage.getItem('playground_exercise')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.courseId) setSelectedCourseId(data.courseId)
      if (data.chapterId) setSelectedChapterId(data.chapterId)
      if (data.exercise) { setExercise(data.exercise); setCode(data.exercise.starterCode || '# 在此编写代码\n') }
    } catch {}
    localStorage.removeItem('playground_exercise')
  }, [])

  const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [courses, selectedCourseId])
  const chapters: Chapter[] = selectedCourse?.chapters || []
  const selectedLang = selectedCourse?.language || 'python'

  const [code, setCode] = useState('# 在此编写代码\n')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<CodeReview | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [showExercise, setShowExercise] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)

  const [followUpInput, setFollowUpInput] = useState('')
  const [followUpMsgs, setFollowUpMsgs] = useState<{ role: string; content: string }[]>([])
  const [followUpStreaming, setFollowUpStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const accumRef = useRef('')
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => { if (review) setShowFeedback(true) }, [review])
  useEffect(() => () => cleanupRef.current?.(), [])

  const buildCourseContext = (): string => {
    if (!selectedCourse) return ''
    const parts = [
      `课程：${selectedCourse.title}（${selectedCourse.language}，${selectedCourse.difficulty}）`,
      `描述：${selectedCourse.description}`,
    ]
    if (selectedChapterId && chapters.length > 0) {
      const ch = chapters.find(c => c.id === selectedChapterId)
      if (ch) {
        parts.push(`当前章节：${ch.title}`)
        parts.push(`章节内容：${ch.content}`)
        if (ch.exercises.length > 0) parts.push(`章节已有练习题：${ch.exercises.map(e => e.title).join('、')}`)
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
    setFollowUpMsgs([])
    setShowFeedback(false)
    const courseContext = buildCourseContext()
    const typeStr = exerciseType === 'project' ? 'project' : 'exercise'
    try {
      const ex = await generatePlaygroundExercise({ language: selectedLang, direction: direction || '基础编程', type: typeStr, courseContext }) as Exercise
      setExercise(ex)
      setCode(ex.starterCode || code)
    } catch {
      const fallbackEx: Exercise = {
        type: 'coding',
        title: 'Hello World 变体',
        description: '写一个函数 greet(name)，接收一个名字参数，返回 "Hello, {name}!" 字符串。\n\n要求：\n1. 函数名为 greet\n2. 如果 name 为空，返回 "Hello, World!"',
        starterCode: currentLang === 'python' ? 'def greet(name):\n    # 在此编写代码\n    pass\n' : 'function greet(name) {\n  // 在此编写代码\n}\n',
        testCases: [{ input: '"Alice"', expected: '"Hello, Alice!"' }, { input: '""', expected: '"Hello, World!"' }],
        language: selectedLang,
        difficulty: 'beginner',
      }
      setExercise(fallbackEx)
      setCode(fallbackEx.starterCode || code)
    }
    setLoading(false)
  }

  const handleReview = async () => {
    if (!isApiReady || !exercise) return
    setReviewing(true)
    setFollowUpMsgs([])
    try {
      const r = await reviewCode(code, exercise.description, selectedLang)
      setReview(r)
    } catch {
      setReview({ correctness: '代码结构基本正确', style: '建议添加类型提示和文档字符串', edgeCases: '未处理空输入边界情况', suggestions: ['考虑边界条件的处理', '可以添加输入验证'], score: 75 })
    }
    setReviewing(false)
  }

  const handleUpload = async () => {
    const result = await openFile()
    if (result) { setCode(result.content); setReview(null); setFollowUpMsgs([]) }
  }

  const handleSendFollowUp = () => {
    const q = followUpInput.trim()
    if (!q || followUpStreaming || !review) return
    const msg = { role: 'user', content: q }
    setFollowUpMsgs(prev => [...prev, msg])
    setFollowUpInput('')
    setFollowUpStreaming(true)
    setStreamingText('')
    accumRef.current = ''
    const ctx = ['【题目要求】', exercise?.description || '', '', '【学生代码】', '```', code, '```', '', '【上次审查结果】', JSON.stringify(review, null, 2)].join('\n')
    const systemPrompt = ['你是一位编程导师，请基于以下上下文回答学生的追问。', '上下文：', ctx].join('\n')
    cleanupRef.current?.()
    cleanupRef.current = chatStream(
      [...followUpMsgs, msg].map(m => ({ role: m.role, content: m.content })),
      systemPrompt,
      chunk => { accumRef.current += chunk; setStreamingText(accumRef.current) },
      () => {
        setFollowUpMsgs(prev => [...prev, { role: 'assistant', content: accumRef.current }])
        accumRef.current = ''; setStreamingText(''); setFollowUpStreaming(false); cleanupRef.current = null
      },
      err => {
        setFollowUpMsgs(prev => [...prev, { role: 'assistant', content: `错误: ${err}` }])
        setFollowUpStreaming(false); cleanupRef.current = null
      },
    )
  }

  const scoreColor = (s: number) => s >= 80 ? 'text-accent-green' : s >= 60 ? 'text-accent-yellow' : 'text-accent-red'
  const diffLabel: Record<string, string> = { beginner: '入门', intermediate: '中级', advanced: '高级' }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">练习场</h2>
            <button onClick={() => setShowExercise(!showExercise)}
              className="px-2 py-1 text-xs rounded bg-surface-light text-gray-400 hover:text-white transition-colors"
              title={showExercise ? '隐藏题目' : '显示题目'}>
              {showExercise ? '隐藏题目' : '显示题目'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleUpload}
              className="px-4 py-2 bg-surface-light text-gray-300 rounded-lg text-sm font-medium hover:bg-surface-dark transition-colors">
              上传文件
            </button>
            <button onClick={handleReview} disabled={!exercise || reviewing}
              className="px-4 py-2 bg-accent-green text-surface-dark rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-green/90 transition-colors">
              {reviewing ? '审查中...' : '提交审查'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">课程</label>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
              className="px-2.5 py-1.5 text-sm rounded-lg bg-surface-light text-gray-200 border border-gray-700 focus:outline-none focus:border-accent">
              {courses.length === 0 && <option value="">尚无课程</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.language})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">章节</label>
            <select value={selectedChapterId} onChange={e => setSelectedChapterId(e.target.value)}
              className="px-2.5 py-1.5 text-sm rounded-lg bg-surface-light text-gray-200 border border-gray-700 focus:outline-none focus:border-accent"
              disabled={!selectedCourseId || chapters.length === 0}>
              <option value="">整个课程</option>
              {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.title} {ch.status === 'done' ? '✓' : ch.status === 'generating' ? '...' : ''}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">类型</label>
            <div className="flex rounded-lg bg-surface-light p-0.5">
              <button onClick={() => setExerciseType('project')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${exerciseType === 'project' ? 'bg-accent text-surface-dark font-medium' : 'text-gray-400 hover:text-white'}`}>
                综合项目
              </button>
              <button onClick={() => setExerciseType('exercise')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${exerciseType === 'exercise' ? 'bg-accent text-surface-dark font-medium' : 'text-gray-400 hover:text-white'}`}>
                章节练习
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 whitespace-nowrap">方向</label>
            <input value={direction} onChange={e => setDirection(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="例如：多线程文件下载器"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-surface-light text-gray-200 placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-accent" />
            <button onClick={handleGenerate} disabled={loading}
              className="px-4 py-1.5 text-sm rounded-lg bg-accent text-surface-dark font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors whitespace-nowrap">
              {loading ? '生成中...' : '生成题目'}
            </button>
          </div>
        </div>

        {selectedCourse && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>语言：{selectedLang}</span>
            <span>|</span>
            <span>难度：{diffLabel[selectedCourse.difficulty] || selectedCourse.difficulty}</span>
            <span>|</span>
            <span>范围：{selectedChapterId ? chapters.find(c => c.id === selectedChapterId)?.title || '未知章节' : '整个课程'}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {showExercise && (
          <div className="w-80 bg-surface-light rounded-xl overflow-hidden flex-shrink-0">
            <ExercisePanel exercise={exercise} loading={loading} onGenerate={handleGenerate} />
          </div>
        )}
        <div className="flex-1 bg-surface-dark rounded-xl overflow-hidden">
          <Editor language={exercise?.language || selectedLang} value={code} onChange={setCode} />
        </div>
      </div>

      <div className="flex-shrink-0 mt-4">
        <button onClick={() => setShowFeedback(!showFeedback)}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors">
          <span>AI 反馈</span>
          <span>{showFeedback ? '▼' : '▶'}</span>
          {!showFeedback && review && <span className="w-2 h-2 rounded-full bg-accent-green" />}
        </button>

        {showFeedback && (
          <div className="bg-surface-light rounded-xl mt-2 overflow-hidden">
            <div className="p-4 max-h-80 overflow-auto">
              {!review ? (
                <p className="text-sm text-gray-500">生成题目并提交代码后，AI 反馈将显示在这里</p>
              ) : (
                <>
                  <div className="space-y-3 text-sm">
                    <div><span className="text-gray-400">正确性：</span>{review.correctness}</div>
                    <div><span className="text-gray-400">代码风格：</span>{review.style}</div>
                    {review.edgeCases && <div><span className="text-gray-400">边界处理：</span>{review.edgeCases}</div>}
                    <div className="flex items-center gap-2"><span className="text-gray-400">评分：</span><span className={`font-bold ${scoreColor(review.score)}`}>{review.score}/100</span></div>
                    {review.suggestions.length > 0 && (
                      <div><div className="text-gray-400 mb-1">改进建议：</div>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          {review.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <div className="space-y-2 mb-3 max-h-40 overflow-auto">
                      {followUpMsgs.map((m, i) => (
                        <div key={i} className={`text-sm p-2 rounded-lg ${m.role === 'user' ? 'bg-accent/10 text-blue-300 ml-8' : 'bg-surface-dark text-gray-200 mr-8'}`}>
                          <span className="font-semibold text-xs block mb-0.5">{m.role === 'user' ? '你' : 'AI'}</span>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                      ))}
                      {followUpStreaming && (
                        <div className="text-sm p-2 rounded-lg bg-surface-dark text-gray-200 mr-8">
                          <span className="font-semibold text-xs block mb-0.5">AI</span>
                          <div className="whitespace-pre-wrap">{streamingText}<span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5" /></div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input value={followUpInput} onChange={e => setFollowUpInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendFollowUp()}
                        placeholder="追问..." disabled={followUpStreaming}
                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-dark text-gray-200 placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-accent disabled:opacity-50" />
                      <button onClick={handleSendFollowUp} disabled={!followUpInput.trim() || followUpStreaming}
                        className="px-4 py-2 text-sm rounded-lg bg-accent text-surface-dark font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors">
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
