import { describe, it, expect } from 'vitest'
import { PRESETS, buildClient, buildConfig } from '../../electron/providers'

describe('PRESETS', () => {
  it('包含 6 个预设', () => {
    expect(Object.keys(PRESETS)).toHaveLength(6)
    expect(PRESETS.deepseek.model).toBe('deepseek-v4-pro')
    expect(PRESETS.deepseek.baseURL).toBe('https://api.deepseek.com')
  })

  it('所有 openai-compat 预设都有 baseURL 和 model（custom 除外）', () => {
    for (const [, p] of Object.entries(PRESETS)) {
      if (p.type === 'openai-compat' && p.id !== 'custom') {
        expect(p.baseURL).toBeTruthy()
        expect(p.model).toBeTruthy()
      }
    }
  })
})

describe('buildClient', () => {
  it('openai-compat 类型返回 OpenAI 实例', () => {
    const client = buildClient({
      type: 'openai-compat', apiKey: 'sk-test',
      baseURL: 'https://test.com', model: 'test'
    })
    expect(client.type).toBe('openai-compat')
    expect(client.client).toBeDefined()
  })

  it('anthropic 类型返回 Anthropic 实例', () => {
    const client = buildClient({
      type: 'anthropic', apiKey: 'sk-test',
      baseURL: 'https://api.anthropic.com', model: 'claude-test'
    })
    expect(client.type).toBe('anthropic')
  })

  it('空 apiKey 抛出错误', () => {
    expect(() => buildClient({
      type: 'openai-compat', apiKey: '', baseURL: '', model: ''
    })).toThrow('API Key 未配置')
  })
})
