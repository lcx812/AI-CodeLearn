import { useCourseStore } from '../../stores/course'
import { Chapter } from '../../types'

interface CourseDrawerProps {
  courseId: string
  onChapterClick: (ch: Chapter) => void
  onExpand: () => void
}

export default function CourseDrawer({ courseId, onChapterClick, onExpand }: CourseDrawerProps) {
  const courses = useCourseStore(s => s.courses)
  const course = courses.find(c => c.id === courseId)

  if (!course) return null

  return (
    <div className="w-56 bg-surface-dark border-r border-gray-700 flex flex-col shrink-0">
      <div className="p-3 border-b border-gray-700 text-sm font-semibold truncate">
        📚 {course.title}
      </div>
      <div className="flex-1 overflow-auto">
        {course.chapters.length === 0 ? (
          <div className="p-3 text-xs text-gray-500 text-center">暂无章节</div>
        ) : (
          course.chapters.map(ch => (
            <button
              key={ch.id}
              onClick={() => onChapterClick(ch)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-light flex items-center gap-2 transition-colors"
            >
              <span className="text-xs">
                {ch.status === 'done' ? '📚' : ch.status === 'generating' ? '📝' : '⬜'}
              </span>
              <span className="truncate">{ch.title}</span>
            </button>
          ))
        )}
      </div>
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={onExpand}
          disabled={course.chapters.length >= 500}
          className="w-full px-3 py-2 text-xs rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors"
        >
          + 扩写课程（{course.chapters.length}/500）
        </button>
      </div>
    </div>
  )
}
