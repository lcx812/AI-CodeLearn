import { describe, it, expect } from 'vitest'
import {
  CHAPTER_LIMIT,
  CHAPTER_COUNT_MAX,
  QUESTIONS_PER_CHAPTER_MAX,
  CHAT_HISTORY_LIMIT,
  DIFFICULTY_LABEL,
  DIFFICULTY_CLASS,
  CHAPTER_STATUS_ICON,
  LANGUAGE_ICON,
} from '../../src/lib/constants'

describe('constants', () => {
  it('CHAPTER_LIMIT is positive', () => {
    expect(CHAPTER_LIMIT).toBeGreaterThan(0)
  })

  it('DIFFICULTY_LABEL has all 3 levels', () => {
    expect(Object.keys(DIFFICULTY_LABEL)).toEqual(['beginner', 'intermediate', 'advanced'])
  })

  it('DIFFICULTY_CLASS has matching keys with DIFFICULTY_LABEL', () => {
    expect(Object.keys(DIFFICULTY_CLASS).sort()).toEqual(Object.keys(DIFFICULTY_LABEL).sort())
  })

  it('CHAPTER_STATUS_ICON has expected keys', () => {
    expect(Object.keys(CHAPTER_STATUS_ICON).sort()).toEqual(['done', 'generating', 'pending'])
  })

  it('LANGUAGE_ICON has entries', () => {
    expect(Object.keys(LANGUAGE_ICON).length).toBeGreaterThan(0)
  })

  it('CHAT_HISTORY_LIMIT is positive', () => {
    expect(CHAT_HISTORY_LIMIT).toBeGreaterThan(0)
  })

  it('CHAPTER_COUNT_MAX and QUESTIONS_PER_CHAPTER_MAX are positive', () => {
    expect(CHAPTER_COUNT_MAX).toBeGreaterThan(0)
    expect(QUESTIONS_PER_CHAPTER_MAX).toBeGreaterThan(0)
  })
})
