interface ErrorDisplayProps {
  message: string
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  if (!message) return null
  return (
    <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
      <p className="text-sm text-accent-red">{message}</p>
    </div>
  )
}
