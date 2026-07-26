interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

export default function ProgressBar({ value, max = 100, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`h-1.5 bg-line-subtle overflow-hidden ${className}`}>
      <div
        className="h-full bg-accent transition-all duration-300"
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  )
}
