import { useCourseStore } from '../stores/course'
import ProgressBar from '../components/ui/ProgressBar'

export default function Progress() {
  const courses = useCourseStore(s => s.courses)
  const totalChapters = courses.reduce((sum, c) => sum + c.chapters.length, 0)
  const doneChapters = courses.reduce((sum, c) =>
    sum + c.chapters.filter(ch => ch.status === 'done').length, 0
  )

  const courseItems = courses.length > 0
    ? courses.map(c => ({
        label: c.title,
        pct: c.chapters.length > 0
          ? Math.round((c.chapters.filter(ch => ch.status === 'done').length / c.chapters.length) * 100)
          : 0
      }))
    : [
        { label: '暂无课程', pct: 0 },
      ]

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">📊 学习进度</h2>

      <div className="bg-surface-light rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-4">课程概览</h3>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500">还没有课程，去课程页生成你的第一门课程吧！</p>
        ) : (
          <div className="space-y-4">
            {courseItems.map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="text-gray-400">{item.pct}%</span>
                </div>
                <ProgressBar value={item.pct} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-light rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-accent">{courses.length}</div>
          <div className="text-sm text-gray-400">课程总数</div>
        </div>
        <div className="bg-surface-light rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-accent-green">{doneChapters}</div>
          <div className="text-sm text-gray-400">已完成章节</div>
        </div>
        <div className="bg-surface-light rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-accent-yellow">{totalChapters}</div>
          <div className="text-sm text-gray-400">总章节数</div>
        </div>
      </div>
    </div>
  )
}
