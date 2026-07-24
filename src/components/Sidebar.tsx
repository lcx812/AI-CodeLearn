import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '仪表盘', icon: '▦' },
  { to: '/courses', label: '课程', icon: '▤' },
  { to: '/playground', label: '练习场', icon: '▶' },
  { to: '/ai-tutor', label: 'AI 导师', icon: '◆' },
  { to: '/progress', label: '进度', icon: '▣' },
  { to: '/settings', label: '设置', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-surface-dark flex flex-col border-r border-white/5">
      <div className="h-12 flex items-center px-5 text-lg font-bold tracking-wide text-accent">
        CodeLearn
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              }`
            }
          >
            <span className="w-5 text-center">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-white/30 border-t border-white/5">
        v0.2.0
      </div>
    </aside>
  )
}
