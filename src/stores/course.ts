import { create } from 'zustand'
import { Course, Chapter } from '../types'
import { loadProgress, saveProgress } from '../lib/ipc'

interface CourseState {
  courses: Course[]
  currentCourseId: string | null
  languages: string[]

  setCurrentCourse: (id: string | null) => void
  addCourse: (course: Course) => void
  deleteCourse: (id: string) => void
  updateCourse: (id: string, updates: Partial<Course>) => void
  setChapters: (courseId: string, chapters: Chapter[]) => void
  addChapters: (courseId: string, chapters: Chapter[]) => void
  updateChapter: (courseId: string, chapterId: string, updates: Partial<Chapter>) => void
  loadState: () => Promise<void>
  saveState: () => Promise<void>
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function genChapterId(): string {
  return 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const defaultLanguages = ['python', 'javascript', 'typescript', 'rust', 'go', 'java', 'c', 'cpp']

function extractLanguages(courses: Course[]): string[] {
  const set = new Set(defaultLanguages)
  courses.forEach(c => { if (c.language) set.add(c.language.toLowerCase()) })
  return Array.from(set)
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourseId: null,
  languages: defaultLanguages,

  setCurrentCourse: (id) => set({ currentCourseId: id }),

  addCourse: (course) => {
    const courses = [...get().courses, course]
    const languages = extractLanguages(courses)
    set({ courses, languages, currentCourseId: course.id })
    get().saveState()
  },

  deleteCourse: (id) => {
    const courses = get().courses.filter(c => c.id !== id)
    const languages = extractLanguages(courses)
    const currentCourseId = get().currentCourseId === id
      ? (courses.length > 0 ? courses[0].id : null)
      : get().currentCourseId
    set({ courses, languages, currentCourseId })
    get().saveState()
  },

  updateCourse: (id, updates) => {
    const courses = get().courses.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    )
    const languages = extractLanguages(courses)
    set({ courses, languages })
    get().saveState()
  },

  setChapters: (courseId, chapters) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, chapters, updatedAt: Date.now() } : c
    )
    set({ courses })
    get().saveState()
  },

  addChapters: (courseId, chapters) => {
    const courses = get().courses.map(c => {
      if (c.id !== courseId) return c
      if (c.chapters.length + chapters.length > 500) return c
      return { ...c, chapters: [...c.chapters, ...chapters], updatedAt: Date.now() }
    })
    set({ courses })
    get().saveState()
  },

  updateChapter: (courseId, chapterId, updates) => {
    const courses = get().courses.map(c => {
      if (c.id !== courseId) return c
      const chapters = c.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, ...updates } : ch
      )
      return { ...c, chapters, updatedAt: Date.now() }
    })
    set({ courses })
    get().saveState()
  },

  loadState: async () => {
    const [courses] = await Promise.all([
      loadProgress<Course[]>('courses'),
    ])
    if (courses && Array.isArray(courses)) {
      const languages = extractLanguages(courses)
      const currentCourseId = get().currentCourseId
        || (courses.length > 0 ? courses[0].id : null)
      set({ courses, languages, currentCourseId })
    }
  },

  saveState: async () => {
    const { courses } = get()
    await saveProgress('courses', courses)
  },
}))
