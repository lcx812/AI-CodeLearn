import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Terminal, Sparkles, BarChart3, Settings } from 'lucide-react'

const links = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/courses', label: '课程', icon: BookOpen },
  { to: '/playground', label: '练习场', icon: Terminal },
  { to: '/ai-tutor', label: 'AI 导师', icon: Sparkles },
  { to: '/progress', label: '进度', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-surface-dark flex flex-col border-r border-line-subtle">
      <div className="h-12 flex items-center px-5 text-sm font-bold tracking-wide">
        <span className="text-accent">~</span>
        <span className="text-ink">/codelearn</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border-l-2 ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium border-accent'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-hover border-transparent'
              }`
            }
          >
            <l.icon className="h-4 w-4 shrink-0" />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-ink-muted/60 border-t border-line-subtle">
        v0.3.0
      </div>
    </aside>
  )
}
