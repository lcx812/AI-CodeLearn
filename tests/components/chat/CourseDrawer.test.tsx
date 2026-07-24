import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCourseStore } from '../../../src/stores/course'
import CourseDrawer from '../../../src/components/chat/CourseDrawer'

beforeEach(() => {
  vi.stubGlobal('window', {
    api: {
      storage: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
      },
    },
  } as any)
})

describe('CourseDrawer', () => {
  beforeEach(() => {
    useCourseStore.setState({ courses: [], currentCourseId: null })
  })

  it('默认导出是一个函数', () => {
    expect(typeof CourseDrawer).toBe('function')
  })

  it('无课程时 courses 为空', () => {
    const state = useCourseStore.getState()
    expect(state.courses).toEqual([])
    expect(state.currentCourseId).toBeNull()
  })

  it('添加课程后 courses 不为空', async () => {
    const { addCourse } = useCourseStore.getState()
    const course = {
      id: 'test1',
      language: 'python',
      title: '测试课程',
      description: '描述',
      difficulty: 'beginner' as const,
      chapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addCourse(course)
    const state = useCourseStore.getState()
    expect(state.courses).toHaveLength(1)
    expect(state.courses[0].title).toBe('测试课程')
    expect(state.currentCourseId).toBe('test1')
  })

  it('章节操作正确', () => {
    const { addCourse, setChapters } = useCourseStore.getState()
    addCourse({
      id: 'test1', language: 'python', title: '课程', description: '描述',
      difficulty: 'beginner', chapters: [], createdAt: Date.now(), updatedAt: Date.now(),
    })

    setChapters('test1', [
      { id: '1', title: '第一章', content: '', exercises: [], quiz: [], status: 'done' },
      { id: '2', title: '第二章', content: '', exercises: [], quiz: [], status: 'pending' },
    ])

    const course = useCourseStore.getState().courses.find(c => c.id === 'test1')!
    expect(course.chapters).toHaveLength(2)
    expect(course.chapters[0].status).toBe('done')
  })

  it('章节超过 500 限制', () => {
    const { addCourse, addChapters } = useCourseStore.getState()
    addCourse({
      id: 'test1', language: 'python', title: '课程', description: '描述',
      difficulty: 'beginner', chapters: [], createdAt: Date.now(), updatedAt: Date.now(),
    })

    const manyChaps = Array.from({ length: 500 }, (_, i) => ({
      id: String(i), title: `第${i}章`, content: '', exercises: [], quiz: [],
      status: 'pending' as const,
    }))
    addChapters('test1', manyChaps)

    const course = useCourseStore.getState().courses.find(c => c.id === 'test1')!
    expect(course.chapters).toHaveLength(500)

    addChapters('test1', [{ id: '501', title: '超限章', content: '', exercises: [], quiz: [], status: 'pending' }])
    expect(useCourseStore.getState().courses.find(c => c.id === 'test1')!.chapters).toHaveLength(500)
  })

  it('删除课程正确', () => {
    const { addCourse, deleteCourse } = useCourseStore.getState()
    addCourse({ id: 'c1', language: 'python', title: 'A', description: '', difficulty: 'beginner', chapters: [], createdAt: 1, updatedAt: 1 })
    addCourse({ id: 'c2', language: 'rust', title: 'B', description: '', difficulty: 'advanced', chapters: [], createdAt: 2, updatedAt: 2 })
    expect(useCourseStore.getState().courses).toHaveLength(2)

    deleteCourse('c1')
    const state = useCourseStore.getState()
    expect(state.courses).toHaveLength(1)
    expect(state.currentCourseId).toBe('c2')
  })
})
