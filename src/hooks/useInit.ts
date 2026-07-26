import { useEffect } from 'react'
import { useSettingsStore } from '../stores/settings'
import { useCourseStore } from '../stores/course'
import { useThemeStore } from '../stores/theme'

export function useInit() {
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const loadState = useCourseStore(s => s.loadState)
  const loadTheme = useThemeStore(s => s.load)

  useEffect(() => {
    loadTheme()
    loadSettings()
    loadState()
  }, [loadSettings, loadState, loadTheme])
}
