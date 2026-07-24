import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco })

interface EditorProps {
  language: string
  value: string
  onChange: (value: string) => void
}

export default function Editor({ language, value, onChange }: EditorProps) {
  return (
    <div className="h-full min-h-0">
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v || '')}
        theme="vs-dark"
        loading={<div className="flex items-center justify-center h-full text-gray-500 text-sm">加载编辑器...</div>}
        options={{
          fontSize: 14,
          fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on'
        }}
      />
    </div>
  )
}
