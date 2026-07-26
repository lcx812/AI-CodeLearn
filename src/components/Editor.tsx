import { useEffect } from 'react'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useThemeStore } from '../stores/theme'
import { ThemePalette, rgbTripletToHex } from '../lib/themes'

loader.config({ monaco })

const THEME = 'codelearn-theme'

/** Monaco 不认 CSS 变量，从 palette 三元组生成主题定义 */
function defineTheme(m: typeof monaco, p: ThemePalette) {
  const hex = (t: string) => rgbTripletToHex(t).slice(1) // Monaco 要 RRGGBB（无 #）
  m.editor.defineTheme(THEME, {
    base: p.monacoBase,
    inherit: true,
    rules: [
      { token: 'comment', foreground: hex(p.inkMuted), fontStyle: 'italic' },
      { token: 'keyword', foreground: hex(p.accent) },
      { token: 'string', foreground: hex(p.ink) },
      { token: 'number', foreground: hex(p.accentYellow) },
      { token: 'type', foreground: hex(p.accent) },
    ],
    colors: {
      'editor.background': rgbTripletToHex(p.surface),
      'editor.lineHighlightBackground': rgbTripletToHex(p.surfaceLight),
      'editorLineNumber.foreground': rgbTripletToHex(p.line),
      'editorCursor.foreground': rgbTripletToHex(p.accent),
      'editor.selectionBackground': rgbTripletToHex(p.accent) + '30',
      'editorIndentGuide.background1': rgbTripletToHex(p.lineSubtle),
      'editorWidget.background': rgbTripletToHex(p.surfaceLight),
      'editorWidget.border': rgbTripletToHex(p.line),
    },
  })
}

interface EditorProps {
  language: string
  value: string
  onChange: (value: string) => void
}

export default function Editor({ language, value, onChange }: EditorProps) {
  const palette = useThemeStore(s => s.palette)

  // 主题切换时重新定义并应用（defineTheme 同名覆盖，setTheme 立即生效）
  useEffect(() => {
    defineTheme(monaco, palette)
    monaco.editor.setTheme(THEME)
  }, [palette])

  return (
    <div className="h-full min-h-0">
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v || '')}
        theme={THEME}
        beforeMount={(m) => defineTheme(m, palette)}
        loading={<div className="flex items-center justify-center h-full text-ink-muted text-sm">加载编辑器...</div>}
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
