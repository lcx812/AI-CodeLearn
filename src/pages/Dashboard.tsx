import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, Flame, Globe, Terminal } from 'lucide-react'
import { useCourseStore } from '../stores/course'
import { getDifficultyLabel } from '../lib/utils'

export default function Dashboard() {
  const courses = useCourseStore(s => s.courses)
  const currentId = useCourseStore(s => s.currentCourseId)
  const course = courses.find(c => c.id === currentId)
  const currentLang = course?.language || '未选择'
  const totalChapters = courses.reduce((sum, c) => sum + c.chapters.length, 0)
  const doneChapters = courses.reduce((sum, c) =>
    sum + c.chapters.filter(ch => ch.status === 'done').length, 0
  )

  const stats = [
    { icon: Flame, value: 0, label: '连续打卡天数' },
    { icon: BookOpen, value: courses.length, label: '课程总数' },
    { icon: CheckCircle2, value: `${doneChapters}/${totalChapters}`, label: '已完成章节' },
  ]

  const quickLinks = [
    { to: '/courses', icon: BookOpen, title: '浏览课程', desc: courses.length > 0 ? '继续学习或生成新课' : 'AI 生成你的第一门课程' },
    { to: '/playground', icon: Terminal, title: '进入练习场', desc: '动手写代码，AI 即时反馈' },
    { to: '/ai-tutor', icon: Globe, title: '探索编程语言', desc: '了解各种语言的特点和用途' },
    { to: '/progress', icon: BarChart3, title: '查看进度', desc: '追踪学习成果' },
  ]

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">
        <span className="text-ink-muted">$ </span>欢迎回来
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-light border border-line rounded-xl p-5">
            <s.icon className="h-4 w-4 text-ink-muted mb-2" />
            <div className="text-2xl font-bold text-accent">{s.value}</div>
            <div className="text-sm text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {courses.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">我的课程</h3>
          <div className="space-y-2 mb-6">
            {courses.slice(0, 3).map(c => (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className="flex items-center justify-between bg-surface-light border border-line rounded-xl px-5 py-3 hover:bg-surface-hover hover:border-accent/50 transition-colors group"
              >
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-ink-muted">{c.language} · {c.chapters.length} 章 · {
                    getDifficultyLabel(c.difficulty)
                  }</div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-muted group-hover:text-accent transition-colors" />
              </Link>
            ))}
            {courses.length > 3 && (
              <Link to="/courses" className="block text-center text-sm text-ink-muted hover:text-ink py-2">
                查看全部 {courses.length} 门课程
              </Link>
            )}
          </div>
        </>
      )}

      <h3 className="text-lg font-semibold mb-3">快速开始</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(q => (
          <Link key={q.to} to={q.to} className="bg-surface-light border border-line hover:bg-surface-hover hover:border-accent/50 rounded-xl p-4 transition-colors group">
            <q.icon className="h-5 w-5 text-ink-muted group-hover:text-accent transition-colors mb-2" />
            <div className="font-medium">{q.title}</div>
            <div className="text-sm text-ink-muted">{q.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
