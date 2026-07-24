import { Link } from 'react-router-dom'
import { useCourseStore } from '../stores/course'

export default function Dashboard() {
  const courses = useCourseStore(s => s.courses)
  const currentId = useCourseStore(s => s.currentCourseId)
  const course = courses.find(c => c.id === currentId)
  const currentLang = course?.language || '未选择'
  const totalChapters = courses.reduce((sum, c) => sum + c.chapters.length, 0)
  const doneChapters = courses.reduce((sum, c) =>
    sum + c.chapters.filter(ch => ch.status === 'done').length, 0
  )

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">👋 欢迎回来</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-light rounded-xl p-5">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-gray-400">连续打卡天数</div>
        </div>
        <div className="bg-surface-light rounded-xl p-5">
          <div className="text-3xl mb-1">📚</div>
          <div className="text-2xl font-bold">{courses.length}</div>
          <div className="text-sm text-gray-400">课程总数</div>
        </div>
        <div className="bg-surface-light rounded-xl p-5">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-2xl font-bold">{doneChapters}/{totalChapters}</div>
          <div className="text-sm text-gray-400">已完成章节</div>
        </div>
      </div>

      {courses.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">我的课程</h3>
          <div className="space-y-2 mb-6">
            {courses.slice(0, 3).map(c => (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className="flex items-center justify-between bg-surface-light rounded-xl px-5 py-3 hover:bg-surface-light/80 transition-colors"
              >
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-gray-400">{c.language} · {c.chapters.length} 章 · {
                    c.difficulty === 'beginner' ? '入门' : c.difficulty === 'intermediate' ? '中级' : '高级'
                  }</div>
                </div>
                <span className="text-accent text-sm">进入 →</span>
              </Link>
            ))}
            {courses.length > 3 && (
              <Link to="/courses" className="block text-center text-sm text-gray-400 hover:text-white py-2">
                查看全部 {courses.length} 门课程
              </Link>
            )}
          </div>
        </>
      )}

      <h3 className="text-lg font-semibold mb-3">快速开始</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/courses" className="bg-surface-light hover:bg-surface-light/80 rounded-xl p-4 transition-colors">
          <div className="text-xl mb-1">📖</div>
          <div className="font-medium">浏览课程</div>
          <div className="text-sm text-gray-400">{courses.length > 0 ? '继续学习或生成新课' : 'AI 生成你的第一门课程'}</div>
        </Link>
        <Link to="/playground" className="bg-surface-light hover:bg-surface-light/80 rounded-xl p-4 transition-colors">
          <div className="text-xl mb-1">💻</div>
          <div className="font-medium">进入练习场</div>
          <div className="text-sm text-gray-400">动手写代码，AI 即时反馈</div>
        </Link>
        <Link to="/ai-tutor" className="bg-surface-light hover:bg-surface-light/80 rounded-xl p-4 transition-colors">
          <div className="text-xl mb-1">🌐</div>
          <div className="font-medium">探索编程语言</div>
          <div className="text-sm text-gray-400">了解各种语言的特点和用途</div>
        </Link>
        <Link to="/progress" className="bg-surface-light hover:bg-surface-light/80 rounded-xl p-4 transition-colors">
          <div className="text-xl mb-1">📊</div>
          <div className="font-medium">查看进度</div>
          <div className="text-sm text-gray-400">追踪学习成果</div>
        </Link>
      </div>
    </div>
  )
}
