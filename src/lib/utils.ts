import { Circle, FileCode } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DIFFICULTY_LABEL, DIFFICULTY_CLASS, CHAPTER_STATUS_ICON, LANGUAGE_ICON } from './constants'

/** 从文本中提取 ```json 代码块内容（裸 JSON 返回 null） */
export function extractJson(text: string): string | null {
  const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  return m ? m[1].trim() : null
}

/** 时间戳 → YYYY-MM-DD */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 难度 → 中文标签 */
export function getDifficultyLabel(d: string): string {
  return DIFFICULTY_LABEL[d] || d
}

/** 难度 → Tailwind 颜色类 */
export function getDifficultyClass(d: string): string {
  return DIFFICULTY_CLASS[d] || 'bg-gray-500/20 text-gray-400'
}

/** 章节状态 → 图标组件 */
export function getStatusIcon(status: string): LucideIcon {
  return CHAPTER_STATUS_ICON[status] || Circle
}

/** 语言 → 图标组件（含回退） */
export function getLanguageIcon(lang: string): LucideIcon {
  return LANGUAGE_ICON[lang.toLowerCase()] || FileCode
}

/** 生成唯一 ID */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 生成章节 ID */
export function genChapterId(): string {
  return 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** 数值 clamp */
export function clampNumber(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v || min))
}
