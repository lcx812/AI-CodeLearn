import { create } from 'zustand'
import { getAISettings, saveAISettings as saveAI } from '../lib/ipc'

export interface ProviderSettings {
  apiKey: string
  baseURL?: string
  model?: string
}

export interface AISettings {
  globalProvider: string
  providers: Record<string, ProviderSettings>
  functionOverrides: { chat?: string; review?: string; courseGen?: string }
}

interface SettingsState {
  isApiReady: boolean
  ai: AISettings
  setApiKey: (providerId: string, key: string) => Promise<void>
  setGlobalProvider: (id: string) => void
  setProviderConfig: (id: string, config: Partial<ProviderSettings>) => void
  setFunctionOverride: (func: 'chat' | 'review' | 'courseGen', providerId: string | undefined) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  checkApiKey: () => Promise<void>
}

const defaultAI: AISettings = {
  globalProvider: 'deepseek',
  providers: {},
  functionOverrides: {}
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isApiReady: false,
  ai: { ...defaultAI },

  setApiKey: async (providerId, key) => {
    const ai = { ...get().ai }
    if (!ai.providers[providerId]) ai.providers[providerId] = { apiKey: '' }
    ai.providers[providerId].apiKey = key
    set({ ai, isApiReady: Object.values(ai.providers).some(p => p.apiKey) })
    await saveAI(ai)
  },

  setGlobalProvider: (id) => {
    set(s => ({ ai: { ...s.ai, globalProvider: id } }))
  },

  setProviderConfig: (id, config) => {
    set(s => {
      const providers = { ...s.ai.providers }
      providers[id] = { ...(providers[id] || { apiKey: '' }), ...config }
      const ai = { ...s.ai, providers }
      const isApiReady = Object.values(providers).some(p => p.apiKey)
      return { ai, isApiReady }
    })
  },

  setFunctionOverride: (func, providerId) => {
    set(s => ({
      ai: { ...s.ai, functionOverrides: { ...s.ai.functionOverrides, [func]: providerId } }
    }))
  },

  loadSettings: async () => {
    const ai = await getAISettings()
    if (ai) {
      set({
        ai,
        isApiReady: Object.values(ai.providers || {}).some((p: ProviderSettings) => p.apiKey)
      })
    }
  },

  saveSettings: async () => {
    const ai = get().ai
    await saveAI(ai)
    set({ isApiReady: Object.values(ai.providers).some(p => p.apiKey) })
  },

  checkApiKey: async () => {
    const ai = await getAISettings()
    if (ai) {
      set({
        ai,
        isApiReady: Object.values(ai.providers || {}).some((p: ProviderSettings) => p.apiKey)
      })
    }
  }
}))
