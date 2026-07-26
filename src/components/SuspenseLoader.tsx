import Spinner from './ui/Spinner'

export default function SuspenseLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-accent" />
        <p className="text-sm text-ink-muted">加载中...</p>
      </div>
    </div>
  )
}
