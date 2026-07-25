interface CourseCardProps {
  title: string
  level: string
  lessonCount: number
  icon: string
}

export default function CourseCard({ title, level, lessonCount, icon }: CourseCardProps) {
  return (
    <div className="bg-surface-light rounded-xl p-5 hover:bg-surface-light/80 transition-colors cursor-pointer border border-gray-700 hover:border-accent/50">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent">{level}</span>
        <span>{lessonCount} 节课</span>
      </div>
    </div>
  )
}
