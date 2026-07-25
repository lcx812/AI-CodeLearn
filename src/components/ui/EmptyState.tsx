import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
      <div className="text-5xl">{icon}</div>
      <p>{title}</p>
      <p className="text-sm">{description}</p>
      {action}
    </div>
  )
}
