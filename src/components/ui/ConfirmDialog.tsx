interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '删除',
  cancelLabel = '取消',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-light rounded-xl p-6 border border-gray-700 w-80 shadow-xl">
        <h4 className="font-semibold mb-2">{title}</h4>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-surface border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-surface-dark transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-lg text-sm hover:bg-accent-red/30 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
