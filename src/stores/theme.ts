import { create } from 'zustand'
import { loadProgress, saveProgress } from '../lib/ipc'
import {
  ThemePalette, TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplate, deriveFromBg
} from '../lib/themes'

const STORAGE_KEY = 'theme'

interface ThemeState {
  templateId: string
  customAccent: string
  customBg: string
  palette: ThemePalette
  applyTemplate: (id: string) => void
  setCustomAccent: (hex: string) => void
  setCustomBg: (hex: string) => void
  reset: () => void
  load: () => Promise<void>
}

/** 把色板写到 :root CSS 变量（tailwind 的 rgb(var(--c-*) / <alpha-value>) 消费） */
function applyPalette(p: ThemePalette) {
  const el = document.documentElement
  const vars: Record<string, string> = {
    '--c-accent': p.accent,
    '--c-accent-green': p.accentGreen,
    '--c-accent-red': p.accentRed,
    '--c-accent-yellow': p.accentYellow,
    '--c-surface': p.surface,
    '--c-surface-light': p.surfaceLight,
    '--c-surface-dark': p.surfaceDark,
    '--c-surface-hover': p.surfaceHover,
    '--c-line': p.line,
    '--c-line-subtle': p.lineSubtle,
    '--c-ink': p.ink,
    '--c-ink-muted': p.inkMuted,
  }
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v)
}

const defaultPalette = getTemplate(DEFAULT_TEMPLATE_ID)!.palette

export const useThemeStore = create<ThemeState>((set, get) => {
  /** 统一出口：更新状态 + 写 CSS 变量 + 持久化 */
  function commit(next: Partial<ThemeState> & { palette: ThemePalette }) {
    set(next)
    applyPalette(next.palette)
    const { templateId, customAccent, customBg } = get()
    saveProgress(STORAGE_KEY, { templateId, customAccent, customBg }).catch(() => {})
  }

  return {
    templateId: DEFAULT_TEMPLATE_ID,
    customAccent: '#4ade80',
    customBg: '#0a0a0a',
    palette: defaultPalette,

    applyTemplate: (id) => {
      const t = getTemplate(id)
      if (!t) return
      commit({ templateId: id, palette: t.palette })
    },

    setCustomAccent: (hex) => {
      const { customBg } = get()
      commit({ templateId: 'custom', customAccent: hex, palette: deriveFromBg(customBg, hex) })
    },

    setCustomBg: (hex) => {
      const { customAccent } = get()
      commit({ templateId: 'custom', customBg: hex, palette: deriveFromBg(hex, customAccent) })
    },

    reset: () => {
      commit({
        templateId: DEFAULT_TEMPLATE_ID,
        customAccent: '#4ade80',
        customBg: '#0a0a0a',
        palette: defaultPalette,
      })
    },

    load: async () => {
      try {
        const saved = await loadProgress<{ templateId?: string; customAccent?: string; customBg?: string }>(STORAGE_KEY)
        if (!saved) { applyPalette(get().palette); return }
        const customAccent = saved.customAccent || '#4ade80'
        const customBg = saved.customBg || '#0a0a0a'
        let palette = defaultPalette
        if (saved.templateId === 'custom') {
          palette = deriveFromBg(customBg, customAccent)
        } else {
          palette = getTemplate(saved.templateId || '')?.palette || defaultPalette
        }
        set({ templateId: saved.templateId || DEFAULT_TEMPLATE_ID, customAccent, customBg, palette })
        applyPalette(palette)
      } catch {
        applyPalette(get().palette)
      }
    },
  }
})
