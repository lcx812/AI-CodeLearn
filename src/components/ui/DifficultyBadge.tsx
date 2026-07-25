import { getDifficultyClass, getDifficultyLabel } from '../../lib/utils'

interface DifficultyBadgeProps {
  difficulty: string
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyClass(difficulty)}`}>
      {getDifficultyLabel(difficulty)}
    </span>
  )
}
