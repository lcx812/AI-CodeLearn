// ── 章节限制 ──
export const CHAPTER_LIMIT = 500
export const CHAPTER_COUNT_MAX = 20
export const QUESTIONS_PER_CHAPTER_MAX = 10

// ── 聊天 ──
export const CHAT_HISTORY_LIMIT = 50

// ── 难度映射 ──
export const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '高级',
}

export const DIFFICULTY_CLASS: Record<string, string> = {
  beginner: 'bg-accent-green/20 text-accent-green',
  intermediate: 'bg-accent-yellow/20 text-accent-yellow',
  advanced: 'bg-accent-red/20 text-accent-red',
}

// ── 章节状态图标 ──
export const CHAPTER_STATUS_ICON: Record<string, string> = {
  done: '📚',
  generating: '📝',
  pending: '⬜',
}

// ── 语言图标 ──
export const LANGUAGE_ICON: Record<string, string> = {
  python: '🐍',
  javascript: '💛',
  typescript: '💙',
  rust: '🦀',
  go: '🔵',
  java: '☕',
  c: '⚙️',
  cpp: '🔧',
}
