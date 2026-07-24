const Store = require('electron-store')

export interface AISettings {
  globalProvider: string
  providers: Record<string, { apiKey: string; baseURL?: string; model?: string }>
  functionOverrides: { chat?: string; review?: string; courseGen?: string }
}

export interface AppSettings {
  ai: AISettings
}

const defaults: AppSettings = {
  ai: {
    globalProvider: 'deepseek',
    providers: {},
    functionOverrides: {}
  }
}

let store: typeof Store | null = null

export function getSettingsStore() {
  if (!store) store = new Store({ name: 'settings', defaults })
  return store
}

export function getSettings(): AppSettings {
  return getSettingsStore().store as unknown as AppSettings
}

export function getAISettings(): AISettings {
  return (getSettingsStore().get('ai') as AISettings) || defaults.ai
}

export function saveAISettings(ai: AISettings) {
  getSettingsStore().set('ai', ai)
}
