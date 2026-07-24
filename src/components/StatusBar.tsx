import { useSettingsStore } from '../stores/settings'
import { useCourseStore } from '../stores/course'

export default function StatusBar() {
  const isApiReady = useSettingsStore(s => s.isApiReady)
  const courses = useCourseStore(s => s.courses)
  const currentId = useCourseStore(s => s.currentCourseId)
  const course = courses.find(c => c.id === currentId)
  const currentLang = course?.language || 'N/A'

  return (
    <footer className="h-7 bg-surface-dark border-t border-white/5 flex items-center justify-between px-4 text-xs shrink-0">
      <span className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${isApiReady ? 'bg-accent-green' : 'bg-accent-red'}`} />
        <span className="text-white/40">AI: {isApiReady ? '就绪' : '未配置'}</span>
      </span>
      <span className="text-white/30">
        当前语言: <span className="text-white/50">{currentLang}</span>
      </span>
    </footer>
  )
}
