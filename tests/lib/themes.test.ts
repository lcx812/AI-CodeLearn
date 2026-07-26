import { describe, it, expect } from 'vitest'
import { hexToRgbTriplet, rgbTripletToHex, luminance, deriveFromBg, TEMPLATES, DEFAULT_TEMPLATE_ID } from '../../src/lib/themes'

describe('hexToRgbTriplet', () => {
  it('converts hex to space-separated triplet', () => {
    expect(hexToRgbTriplet('#4ade80')).toBe('74 222 128')
    expect(hexToRgbTriplet('#0a0a0a')).toBe('10 10 10')
    expect(hexToRgbTriplet('#ffffff')).toBe('255 255 255')
  })

  it('roundtrips with rgbTripletToHex', () => {
    expect(rgbTripletToHex(hexToRgbTriplet('#4ade80'))).toBe('#4ade80')
    expect(rgbTripletToHex(hexToRgbTriplet('#12100e'))).toBe('#12100e')
  })
})

describe('luminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(luminance('#000000')).toBe(0)
    expect(luminance('#ffffff')).toBe(1)
  })

  it('is low for dark surface and high for paper', () => {
    expect(luminance('#0a0a0a')).toBeLessThan(0.45)
    expect(luminance('#fafafa')).toBeGreaterThan(0.45)
  })
})

describe('deriveFromBg', () => {
  it('keeps light text on dark backgrounds', () => {
    const p = deriveFromBg('#0a0a0a', '#4ade80')
    expect(p.ink).toBe('229 229 229')
    expect(p.monacoBase).toBe('vs-dark')
  })

  it('flips to dark text on light backgrounds', () => {
    const p = deriveFromBg('#fafafa', '#4ade80')
    expect(p.ink).not.toBe('229 229 229')
    expect(luminance(rgbTripletToHex(p.ink))).toBeLessThan(0.45)
    expect(p.monacoBase).toBe('vs')
  })

  it('derives lighter surface-light for dark bg and darker for light bg', () => {
    const dark = deriveFromBg('#0a0a0a', '#4ade80')
    expect(luminance(rgbTripletToHex(dark.surfaceLight))).toBeGreaterThan(luminance('#0a0a0a'))
    const light = deriveFromBg('#fafafa', '#4ade80')
    expect(luminance(rgbTripletToHex(light.surfaceLight))).toBeLessThan(luminance('#fafafa'))
  })

  it('applies the custom accent', () => {
    const p = deriveFromBg('#0a0a0a', '#fbbf24')
    expect(p.accent).toBe('251 191 36')
  })
})

describe('TEMPLATES', () => {
  it('contains 8 templates including light and warm', () => {
    expect(TEMPLATES.length).toBe(8)
    expect(TEMPLATES.map(t => t.id)).toContain('paper-light')
    expect(TEMPLATES.map(t => t.id)).toContain('warm-dark')
  })

  it('default template is terminal-green and matches current palette', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('terminal-green')
    const def = TEMPLATES.find(t => t.id === DEFAULT_TEMPLATE_ID)!
    expect(def.palette.accent).toBe('74 222 128')
    expect(def.palette.surface).toBe('10 10 10')
    expect(def.palette.ink).toBe('229 229 229')
    expect(def.palette.monacoBase).toBe('vs-dark')
  })

  it('every template has a complete palette', () => {
    for (const t of TEMPLATES) {
      const keys = ['accent', 'accentGreen', 'accentRed', 'accentYellow',
        'surface', 'surfaceLight', 'surfaceDark', 'surfaceHover',
        'line', 'lineSubtle', 'ink', 'inkMuted'] as const
      for (const k of keys) {
        expect(t.palette[k], `${t.id}.${k}`).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/)
      }
    }
  })

  it('light template uses vs monaco base and dark ink', () => {
    const paper = TEMPLATES.find(t => t.id === 'paper-light')!
    expect(paper.palette.monacoBase).toBe('vs')
    expect(luminance(rgbTripletToHex(paper.palette.ink))).toBeLessThan(0.45)
  })
})
