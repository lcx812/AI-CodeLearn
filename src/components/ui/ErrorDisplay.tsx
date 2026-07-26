import { AlertCircle } from 'lucide-react'

interface ErrorDisplayProps {
  message: string
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  if (!message) return null
  return (
    <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="h-4 w-4 text-accent-red shrink-0 mt-0.5" />
      <p className="text-sm text-accent-red">{message}</p>
    </div>
  )
}
