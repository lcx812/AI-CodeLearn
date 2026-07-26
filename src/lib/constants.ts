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
import { CheckCircle2, Loader2, Circle, Terminal, Braces, Cog, Zap, Coffee, Hash, FileCode2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const CHAPTER_STATUS_ICON: Record<string, LucideIcon> = {
  done: CheckCircle2,
  generating: Loader2,
  pending: Circle,
}

// ── 语言图标（lucide 无品牌图标，用语义近似的单色图标）──
export const LANGUAGE_ICON: Record<string, LucideIcon> = {
  python: Terminal,
  javascript: Braces,
  typescript: Braces,
  rust: Cog,
  go: Zap,
  java: Coffee,
  c: Hash,
  cpp: FileCode2,
}
