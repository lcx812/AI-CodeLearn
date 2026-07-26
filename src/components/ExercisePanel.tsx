import { Lightbulb, TerminalSquare } from 'lucide-react'
import { Exercise } from '../types'
import DifficultyBadge from './ui/DifficultyBadge'
import ErrorDisplay from './ui/ErrorDisplay'

interface Props {
  exercise: Exercise | null
  loading: boolean
  error?: string
  onGenerate: () => void
}

export default function ExercisePanel({ exercise, loading, error = '', onGenerate }: Props) {
  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-4">
        <TerminalSquare className="h-10 w-10 text-line" />
        <p className="text-ink-muted text-sm">还没有练习题目</p>
        <ErrorDisplay message={error} />
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-4 py-2 bg-accent text-surface-dark rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? '生成中...' : 'AI 生成题目'}
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      <h3 className="text-lg font-semibold mb-2">{exercise.title}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-sm bg-accent/20 text-accent">
          {exercise.language}
        </span>
        <DifficultyBadge difficulty={exercise.difficulty} />
      </div>

      <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed mb-4">
        {exercise.description}
      </div>

      {exercise.testCases.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-accent">输入输出示例</h4>
          <div className="space-y-2">
            {exercise.testCases.map((tc, i) => (
              <div key={i} className="bg-surface-dark rounded-lg p-3 text-xs font-mono border-l-2 border-accent">
                <div className="text-ink-muted text-2xs mb-1">示例 {i + 1}</div>
                <div className="text-accent">&gt; {tc.input}</div>
                <div className="text-ink-muted">{tc.expected}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-muted mt-4 flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5" /> 在编辑器中完成代码后，点击"提交审查"获取 AI 反馈
      </p>
    </div>
  )
}
