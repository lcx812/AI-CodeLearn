import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../stores/course'
import CourseGenerator from '../components/CourseGenerator'

const langIcons: Record<string, string> = {
  python: '🐍',
  javascript: '💛',
  typescript: '💙',
  rust: '🦀',
  go: '🔵',
  java: '☕',
  c: '⚙️',
  cpp: '🔧'
}

function getIcon(lang: string) {
  return langIcons[lang.toLowerCase()] || '📄'
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diffBadge(d: string) {
  const map: Record<string, { label: string; cls: string }> = {
    beginner: { label: '入门', cls: 'bg-accent-green/20 text-accent-green' },
    intermediate: { label: '中级', cls: 'bg-accent-yellow/20 text-accent-yellow' },
    advanced: { label: '高级', cls: 'bg-accent-red/20 text-accent-red' }
  }
  const m = map[d] || { label: d, cls: 'bg-gray-500/20 text-gray-400' }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>
}

export default function Courses() {
  const { courses, languages, deleteCourse, setCurrentCourse } = useCourseStore()
  const navigate = useNavigate()

  const [showGenerator, setShowGenerator] = useState(false)
  const [filterLang, setFilterLang] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = filterLang === 'all'
    ? courses
    : courses.filter(c => c.language.toLowerCase() === filterLang.toLowerCase())

  const handleCardClick = (id: string) => {
    setCurrentCourse(id)
    navigate('/courses/' + id)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteCourse(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">课程</h2>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showGenerator
              ? 'bg-surface-light text-gray-400 hover:text-white'
              : 'bg-accent text-surface-dark hover:bg-accent/90'
          }`}
        >
          {showGenerator ? '收起' : '+ AI 生成课程'}
        </button>
      </div>

      {/* 课程生成器 */}
      {showGenerator && (
        <div className="mb-6">
          <CourseGenerator onDone={() => setShowGenerator(false)} />
        </div>
      )}

      {/* 语言筛选栏 */}
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterLang('all')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filterLang === 'all'
                ? 'bg-accent text-surface-dark font-medium'
                : 'bg-surface-light text-gray-400 hover:text-white'
            }`}
          >
            全部
          </button>
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setFilterLang(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterLang === lang
                  ? 'bg-accent text-surface-dark font-medium'
                  : 'bg-surface-light text-gray-400 hover:text-white'
              }`}
            >
              {getIcon(lang)} {lang}
            </button>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {courses.length === 0 && !showGenerator && (
        <div className="bg-surface-light rounded-xl p-12 text-center">
          <div className="text-6xl mb-5">📚</div>
          <h3 className="text-xl font-semibold mb-3">还没有课程</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            AI 将根据你的需求自动生成结构化课程，包含教学大纲、章节内容和配套练习。点击下方按钮开始你的学习之旅。
          </p>
          <button
            onClick={() => setShowGenerator(true)}
            className="px-6 py-3 bg-accent text-surface-dark rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            AI 生成课程
          </button>
        </div>
      )}

      {/* 课程卡片列表 */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => (
            <div
              key={course.id}
              onClick={() => handleCardClick(course.id)}
              className="bg-surface-light rounded-xl p-5 hover:bg-surface-light/80 transition-colors cursor-pointer border border-gray-700 hover:border-accent/50 group"
            >
              {/* 头部 */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{getIcon(course.language)}</span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setDeleteId(course.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-accent-red transition-all px-2 py-0.5"
                >
                  删除
                </button>
              </div>

              {/* 标题 */}
              <h3 className="font-semibold text-sm mb-3 truncate text-left w-full">{course.title}</h3>

              {/* 元信息 */}
              <div className="flex items-center gap-2 flex-wrap">
                {diffBadge(course.difficulty)}
                <span className="text-xs text-gray-500">{course.chapters.length} 章</span>
                <span className="text-xs text-gray-500 ml-auto">{fmtDate(course.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {courses.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-light rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">该语言下暂无课程</p>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-xl p-6 border border-gray-700 w-80 shadow-xl">
            <h4 className="font-semibold mb-2">确认删除</h4>
            <p className="text-sm text-gray-400 mb-4">删除后无法恢复，确定要删除这个课程吗？</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-surface border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-surface-dark transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-lg text-sm hover:bg-accent-red/30 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
