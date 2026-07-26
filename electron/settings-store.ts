import Store from 'electron-store'

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

let store: Store<AppSettings> | null = null

export function getSettingsStore(): Store<AppSettings> {
  if (!store) store = new Store<AppSettings>({ name: 'settings', defaults })
  return store
}

export function getSettings(): AppSettings {
  return getSettingsStore().store
}

export function getAISettings(): AISettings {
  return getSettingsStore().get('ai') || defaults.ai
}

export function saveAISettings(ai: AISettings) {
  getSettingsStore().set('ai', ai)
}
