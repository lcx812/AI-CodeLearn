import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export interface ProviderPreset {
  id: string
  name: string
  type: 'openai-compat' | 'anthropic'
  baseURL: string
  model: string
}

export interface ProviderConfig {
  type: 'openai-compat' | 'anthropic'
  apiKey: string
  baseURL: string
  model: string
}

export interface BuiltClient {
  type: 'openai-compat' | 'anthropic'
  client: OpenAI | Anthropic
  model: string
}

export const PRESETS: Record<string, ProviderPreset> = {
  deepseek: {
    id: 'deepseek', name: 'DeepSeek', type: 'openai-compat',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-v4-pro'
  },
  claude: {
    id: 'claude', name: 'Claude', type: 'anthropic',
    baseURL: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514'
  },
  openai: {
    id: 'openai', name: 'OpenAI', type: 'openai-compat',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o'
  },
  qwen: {
    id: 'qwen', name: '通义千问', type: 'openai-compat',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus'
  },
  glm: {
    id: 'glm', name: '智谱GLM', type: 'openai-compat',
    baseURL: 'https://api.z.ai/api/paas/v4',
    model: 'glm-4-flash'
  },
  custom: {
    id: 'custom', name: '自定义', type: 'openai-compat',
    baseURL: '',
    model: ''
  }
}

export function buildClient(config: ProviderConfig): BuiltClient {
  if (!config.apiKey) throw new Error('API Key 未配置')
  if (config.type === 'anthropic') {
    return { type: 'anthropic', client: new Anthropic({ apiKey: config.apiKey }), model: config.model }
  }
  return {
    type: 'openai-compat',
    client: new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL }),
    model: config.model
  }
}

export function buildConfig(
  presetId: string,
  overrides: { apiKey?: string; baseURL?: string; model?: string }
): ProviderConfig {
  const preset = PRESETS[presetId] || PRESETS.custom
  return {
    type: preset.type,
    apiKey: overrides.apiKey || '',
    baseURL: overrides.baseURL || preset.baseURL,
    model: overrides.model || preset.model
  }
}
