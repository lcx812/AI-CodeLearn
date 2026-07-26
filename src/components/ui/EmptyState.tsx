import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-ink-muted gap-3 py-12">
      <Icon className="h-10 w-10 text-line" />
      <p className="text-ink">{title}</p>
      <p className="text-sm max-w-md text-center">{description}</p>
      {action}
    </div>
  )
}
