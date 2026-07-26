// ── 主题系统：色板全部以 "r g b" 三元组存储（配合 tailwind <alpha-value>）──

export interface ThemePalette {
  accent: string
  accentGreen: string
  accentRed: string
  accentYellow: string
  surface: string
  surfaceLight: string
  surfaceDark: string
  surfaceHover: string
  line: string
  lineSubtle: string
  ink: string
  inkMuted: string
  monacoBase: 'vs' | 'vs-dark'
}

export interface ThemeTemplate {
  id: string
  name: string
  palette: ThemePalette
}

/** '#4ade80' → '74 222 128' */
export function hexToRgbTriplet(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** '74 222 128' → '#4ade80' */
export function rgbTripletToHex(t: string): string {
  const [r, g, b] = t.split(' ').map(Number)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

/** 相对亮度 0-1（W3C 近似公式） */
export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** hex → HSL 明度偏移后回 hex（delta 范围 -1~1） */
function shiftLightness(hex: string, delta: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  // 简单线性偏移：暗色提亮、亮色压暗都能用
  const f = (v: number) => delta >= 0 ? v + (255 - v) * delta : v * (1 + delta)
  return '#' + [f(r), f(g), f(b)].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
}

// ── 基础板 ──

/** 深色基础板（现状纯黑极客风） */
const DARK_BASE: ThemePalette = {
  accent: '74 222 128',
  accentGreen: '74 222 128',
  accentRed: '248 113 113',
  accentYellow: '250 204 21',
  surface: '10 10 10',
  surfaceLight: '17 17 17',
  surfaceDark: '0 0 0',
  surfaceHover: '22 22 22',
  line: '38 38 38',
  lineSubtle: '26 26 26',
  ink: '229 229 229',
  inkMuted: '115 115 115',
  monacoBase: 'vs-dark',
}

/** 亮色纸面基础板（语义色加深保证对比度） */
const LIGHT_BASE: ThemePalette = {
  accent: '22 163 74',
  accentGreen: '22 163 74',
  accentRed: '220 38 38',
  accentYellow: '161 98 7',
  surface: '250 250 250',
  surfaceLight: '255 255 255',
  surfaceDark: '229 229 229',
  surfaceHover: '245 245 245',
  line: '212 212 212',
  lineSubtle: '229 229 229',
  ink: '23 23 23',
  inkMuted: '115 115 115',
  monacoBase: 'vs',
}

/** 暖黑基础板 */
const WARM_BASE: ThemePalette = {
  ...DARK_BASE,
  accent: '251 191 36',
  surface: '18 16 14',
  surfaceLight: '26 23 20',
  surfaceDark: '10 9 8',
  surfaceHover: '32 29 25',
  line: '48 43 37',
  lineSubtle: '32 29 25',
  ink: '231 224 213',
  inkMuted: '140 130 116',
}

function darkAccent(accentHex: string): ThemePalette {
  return { ...DARK_BASE, accent: hexToRgbTriplet(accentHex) }
}

// ── 模板 ──

export const DEFAULT_TEMPLATE_ID = 'terminal-green'

export const TEMPLATES: ThemeTemplate[] = [
  { id: 'terminal-green', name: '终端绿', palette: DARK_BASE },
  { id: 'amber', name: '琥珀', palette: darkAccent('#fbbf24') },
  { id: 'cyber-cyan', name: '赛博青', palette: darkAccent('#22d3ee') },
  { id: 'violet', name: '紫罗兰', palette: darkAccent('#a78bfa') },
  { id: 'ice-blue', name: '冰蓝', palette: darkAccent('#60a5fa') },
  { id: 'coral-red', name: '桔红', palette: darkAccent('#fb7185') },
  { id: 'paper-light', name: '亮色纸面', palette: LIGHT_BASE },
  { id: 'warm-dark', name: '暖黑', palette: WARM_BASE },
]

// ── 自定义派生 ──

const SEMANTIC_DARK = { green: '74 222 128', red: '248 113 113', yellow: '250 204 21' }
const SEMANTIC_LIGHT = { green: '22 163 74', red: '220 38 38', yellow: '161 98 7' }

/** 由背景基色派生整套色板：明度偏移出表面层级，亮度翻转文字/语义色 */
export function deriveFromBg(bgHex: string, accentHex: string): ThemePalette {
  const dark = luminance(bgHex) <= 0.45
  const sem = dark ? SEMANTIC_DARK : SEMANTIC_LIGHT
  return {
    accent: hexToRgbTriplet(accentHex),
    accentGreen: sem.green,
    accentRed: sem.red,
    accentYellow: sem.yellow,
    surface: hexToRgbTriplet(bgHex),
    surfaceLight: hexToRgbTriplet(shiftLightness(bgHex, dark ? 0.06 : -0.04)),
    surfaceDark: hexToRgbTriplet(shiftLightness(bgHex, dark ? -0.9 : 0.04)),
    surfaceHover: hexToRgbTriplet(shiftLightness(bgHex, dark ? 0.1 : -0.07)),
    line: hexToRgbTriplet(shiftLightness(bgHex, dark ? 0.18 : -0.14)),
    lineSubtle: hexToRgbTriplet(shiftLightness(bgHex, dark ? 0.1 : -0.08)),
    ink: dark ? '229 229 229' : '23 23 23',
    inkMuted: '115 115 115',
    monacoBase: dark ? 'vs-dark' : 'vs',
  }
}

export function getTemplate(id: string): ThemeTemplate | undefined {
  return TEMPLATES.find(t => t.id === id)
}
