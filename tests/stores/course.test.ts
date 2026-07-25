import { describe, it, expect, beforeEach } from 'vitest'
import { useCourseStore } from '../../src/stores/course'

// 模拟 window.api
beforeEach(() => {
  (globalThis as any).window = {
    api: {
      storage: {
        get: async () => null,
        set: async () => true,
        delete: async () => true,
      },
    },
  }
  useCourseStore.setState({ courses: [], currentCourseId: null, languages: [] })
})

const makeCourse = (id = 'test1', lang = 'python') => ({
  id,
  language: lang,
  title: '测试课程',
  difficulty: 'beginner' as const,
  chapters: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

describe('useCourseStore', () => {
  it('starts with empty courses', () => {
    const { courses } = useCourseStore.getState()
    expect(courses).toEqual([])
  })

  it('addCourse adds course and sets current id', () => {
    const { addCourse } = useCourseStore.getState()
    addCourse(makeCourse())
    const state = useCourseStore.getState()
    expect(state.courses).toHaveLength(1)
    expect(state.currentCourseId).toBe('test1')
  })

  it('deleteCourse removes course and updates current id', () => {
    const { addCourse, deleteCourse } = useCourseStore.getState()
    addCourse(makeCourse('c1'))
    addCourse(makeCourse('c2', 'rust'))
    expect(useCourseStore.getState().courses).toHaveLength(2)

    deleteCourse('c1')
    const state = useCourseStore.getState()
    expect(state.courses).toHaveLength(1)
    expect(state.currentCourseId).toBe('c2')
  })

  it('setChapters replaces chapters', () => {
    const { addCourse, setChapters } = useCourseStore.getState()
    addCourse(makeCourse())
    setChapters('test1', [
      { id: '1', title: '第一章', content: '', exercises: [], quiz: [], status: 'done' },
      { id: '2', title: '第二章', content: '', exercises: [], quiz: [], status: 'pending' },
    ])
    const course = useCourseStore.getState().courses.find(c => c.id === 'test1')!
    expect(course.chapters).toHaveLength(2)
  })

  it('addChapters enforces 500 chapter limit', () => {
    const { addCourse, addChapters } = useCourseStore.getState()
    addCourse(makeCourse())
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: String(i), title: `第${i}章`, content: '', exercises: [], quiz: [], status: 'pending' as const,
    }))
    addChapters('test1', many)
    const course = useCourseStore.getState().courses.find(c => c.id === 'test1')!
    expect(course.chapters).toHaveLength(500)

    // try adding more — should be rejected
    addChapters('test1', [{ id: '501', title: '超限', content: '', exercises: [], quiz: [], status: 'pending' }])
    expect(useCourseStore.getState().courses.find(c => c.id === 'test1')!.chapters).toHaveLength(500)
  })

  it('languages are extracted from courses', () => {
    const { addCourse } = useCourseStore.getState()
    addCourse(makeCourse('c1', 'python'))
    addCourse(makeCourse('c2', 'rust'))
    const { languages } = useCourseStore.getState()
    expect(languages).toContain('python')
    expect(languages).toContain('rust')
  })

  it('updateChapter modifies chapter properties', () => {
    const { addCourse, setChapters, updateChapter } = useCourseStore.getState()
    addCourse(makeCourse())
    setChapters('test1', [
      { id: '1', title: 'Old', content: '', exercises: [], quiz: [], status: 'pending' },
    ])
    updateChapter('test1', '1', { title: 'New', status: 'done' })
    const ch = useCourseStore.getState().courses.find(c => c.id === 'test1')!.chapters[0]
    expect(ch.title).toBe('New')
    expect(ch.status).toBe('done')
  })
})
