import { useEffect } from 'react'
import { useSettingsStore } from '../stores/settings'
import { useCourseStore } from '../stores/course'

export function useInit() {
  const loadSettings = useSettingsStore(s => s.loadSettings)
  const loadState = useCourseStore(s => s.loadState)

  useEffect(() => {
    loadSettings()
    loadState()
  }, [loadSettings, loadState])
}
