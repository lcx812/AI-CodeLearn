import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Trash2 } from 'lucide-react'
import { useCourseStore } from '../stores/course'
import CourseGenerator from '../components/CourseGenerator'
import { formatDate, getLanguageIcon } from '../lib/utils'
import DifficultyBadge from '../components/ui/DifficultyBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          <span className="text-ink-muted">$ </span>课程
        </h2>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showGenerator
              ? 'bg-surface-light text-ink-muted hover:text-ink'
              : 'bg-accent text-surface-dark hover:bg-accent/90'
          }`}
        >
          {showGenerator ? '收起' : '+ AI 生成课程'}
        </button>
      </div>

      {showGenerator && (
        <div className="mb-6">
          <CourseGenerator onDone={() => setShowGenerator(false)} />
        </div>
      )}

      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterLang('all')}
            className={`px-3 py-1.5 rounded-sm text-xs transition-colors ${
              filterLang === 'all'
                ? 'bg-accent text-surface-dark font-medium'
                : 'bg-surface-light text-ink-muted hover:text-ink'
            }`}
          >
            全部
          </button>
          {languages.map(lang => {
            const LangIcon = getLanguageIcon(lang)
            return (
              <button
                key={lang}
                onClick={() => setFilterLang(lang)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs transition-colors ${
                  filterLang === lang
                    ? 'bg-accent text-surface-dark font-medium'
                    : 'bg-surface-light text-ink-muted hover:text-ink'
                }`}
              >
                <LangIcon className="h-3 w-3" /> {lang}
              </button>
            )
          })}
        </div>
      )}

      {courses.length === 0 && !showGenerator && (
        <EmptyState
          icon={BookOpen}
          title="还没有课程"
          description="AI 将根据你的需求自动生成结构化课程，包含教学大纲、章节内容和配套练习。点击下方按钮开始你的学习之旅。"
          action={
            <button
              onClick={() => setShowGenerator(true)}
              className="px-6 py-3 bg-accent text-surface-dark rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              AI 生成课程
            </button>
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => {
            const CourseIcon = getLanguageIcon(course.language)
            return (
              <div
                key={course.id}
                onClick={() => handleCardClick(course.id)}
                className="bg-surface-light rounded-xl p-5 hover:bg-surface-hover transition-colors cursor-pointer border border-line hover:border-accent/50 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <CourseIcon className="h-5 w-5 text-ink-muted group-hover:text-accent transition-colors" />
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setDeleteId(course.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-ink-muted hover:text-accent-red transition-all px-2 py-0.5 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> 删除
                  </button>
                </div>

                <h3 className="font-semibold text-sm mb-3 truncate text-left w-full">{course.title}</h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <DifficultyBadge difficulty={course.difficulty} />
                  <span className="text-xs text-ink-muted">{course.chapters.length} 章</span>
                  <span className="text-xs text-ink-muted ml-auto">{formatDate(course.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {courses.length > 0 && filtered.length === 0 && (
        <div className="bg-surface-light rounded-xl p-8 text-center">
          <p className="text-sm text-ink-muted">该语言下暂无课程</p>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="确认删除"
        message="删除后无法恢复，确定要删除这个课程吗？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
