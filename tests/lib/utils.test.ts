import { describe, it, expect } from 'vitest'
import { CheckCircle2, Loader2, Circle, Terminal, Cog, FileCode } from 'lucide-react'
import { extractJson, formatDate, genId, genChapterId, clampNumber, getDifficultyLabel, getDifficultyClass, getStatusIcon, getLanguageIcon } from '../../src/lib/utils'

describe('extractJson', () => {
  it('extracts JSON from ```json block', () => {
    const text = '```json\n{"key": "value"}\n```'
    expect(extractJson(text)).toBe('{"key": "value"}')
  })

  it('extracts JSON from ``` block without language', () => {
    const text = '```\n{"key": "value"}\n```'
    expect(extractJson(text)).toBe('{"key": "value"}')
  })

  it('returns null for text without JSON block', () => {
    expect(extractJson('hello world')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractJson('')).toBeNull()
  })

  it('handles multiline JSON', () => {
    const text = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```'
    expect(extractJson(text)).toBe('{\n  "a": 1,\n  "b": 2\n}')
  })
})

describe('formatDate', () => {
  it('formats timestamp to YYYY-MM-DD', () => {
    // 2024-01-15
    const ts = new Date('2024-01-15T12:00:00Z').getTime()
    expect(formatDate(ts)).toBe('2024-01-15')
  })

  it('pads single digit month and day', () => {
    const ts = new Date('2024-03-05T00:00:00Z').getTime()
    expect(formatDate(ts)).toBe('2024-03-05')
  })
})

describe('genId', () => {
  it('returns non-empty string', () => {
    expect(genId().length).toBeGreaterThan(0)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => genId()))
    expect(ids.size).toBe(100)
  })
})

describe('genChapterId', () => {
  it('returns string starting with ch_', () => {
    expect(genChapterId().startsWith('ch_')).toBe(true)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => genChapterId()))
    expect(ids.size).toBe(100)
  })
})

describe('clampNumber', () => {
  it('clamps value below min', () => {
    expect(clampNumber(0, 1, 10)).toBe(1)
  })

  it('clamps value above max', () => {
    expect(clampNumber(20, 1, 10)).toBe(10)
  })

  it('returns value within range', () => {
    expect(clampNumber(5, 1, 10)).toBe(5)
  })

  it('handles NaN as min', () => {
    expect(clampNumber(NaN, 1, 10)).toBe(1)
  })

  it('handles boundary equal to min', () => {
    expect(clampNumber(1, 1, 10)).toBe(1)
  })

  it('handles boundary equal to max', () => {
    expect(clampNumber(10, 1, 10)).toBe(10)
  })
})

describe('getDifficultyLabel', () => {
  it('returns Chinese label for known difficulty', () => {
    expect(getDifficultyLabel('beginner')).toBe('入门')
    expect(getDifficultyLabel('intermediate')).toBe('中级')
    expect(getDifficultyLabel('advanced')).toBe('高级')
  })

  it('returns original string for unknown difficulty', () => {
    expect(getDifficultyLabel('expert')).toBe('expert')
  })
})

describe('getDifficultyClass', () => {
  it('returns color class for known difficulty', () => {
    expect(getDifficultyClass('beginner')).toContain('accent-green')
    expect(getDifficultyClass('intermediate')).toContain('accent-yellow')
    expect(getDifficultyClass('advanced')).toContain('accent-red')
  })

  it('returns fallback for unknown difficulty', () => {
    expect(getDifficultyClass('expert')).toContain('gray-500')
  })
})

describe('getStatusIcon', () => {
  it('returns icon for known status', () => {
    expect(getStatusIcon('done')).toBe(CheckCircle2)
    expect(getStatusIcon('generating')).toBe(Loader2)
    expect(getStatusIcon('pending')).toBe(Circle)
  })

  it('returns fallback for unknown status', () => {
    expect(getStatusIcon('unknown')).toBe(Circle)
  })
})

describe('getLanguageIcon', () => {
  it('returns icon for known language', () => {
    expect(getLanguageIcon('python')).toBe(Terminal)
    expect(getLanguageIcon('rust')).toBe(Cog)
  })

  it('is case insensitive', () => {
    expect(getLanguageIcon('Python')).toBe(Terminal)
  })

  it('returns fallback for unknown language', () => {
    expect(getLanguageIcon('haskell')).toBe(FileCode)
  })
})
