import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

// 颜色全部走 CSS 变量（src/styles/index.css :root 默认值 + stores/theme.ts 运行时写入），
// <alpha-value> 让 bg-accent/10 等透明度修饰符继续生效
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: v('--c-surface'), light: v('--c-surface-light'), dark: v('--c-surface-dark'), hover: v('--c-surface-hover') },
        accent: { DEFAULT: v('--c-accent'), green: v('--c-accent-green'), red: v('--c-accent-red'), yellow: v('--c-accent-yellow') },
        line: { DEFAULT: v('--c-line'), subtle: v('--c-line-subtle') },
        ink: { DEFAULT: v('--c-ink'), muted: v('--c-ink-muted') }
      },
      fontFamily: {
        // UI 全局等宽：sans 即 mono
        sans: ['"JetBrains Mono"', '"Cascadia Code"', '"SF Mono"', 'Consolas', 'Menlo', 'monospace']
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }]
      },
      borderRadius: {
        lg: '4px',
        xl: '6px'
      },
      typography: () => ({
        invert: {
          css: {
            '--tw-prose-body': 'rgb(var(--c-ink))',
            '--tw-prose-headings': 'rgb(var(--c-ink))',
            '--tw-prose-links': 'rgb(var(--c-accent))',
            '--tw-prose-bold': 'rgb(var(--c-ink))',
            '--tw-prose-code': 'rgb(var(--c-accent))',
            '--tw-prose-muted': 'rgb(var(--c-ink-muted))',
            '--tw-prose-hr': 'rgb(var(--c-line))',
            '--tw-prose-borders': 'rgb(var(--c-line))',
            '--tw-prose-quotes': 'rgb(var(--c-ink-muted))'
          }
        }
      })
    }
  },
  plugins: [typography]
} satisfies Config
