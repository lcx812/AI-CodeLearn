import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../stores/settings'

const PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'claude', name: 'Claude' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'qwen', name: '通义千问' },
  { id: 'glm', name: '智谱GLM' },
  { id: 'custom', name: '自定义' }
]

const PRESET_URLS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com',
  claude: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  glm: 'https://api.z.ai/api/paas/v4',
  custom: ''
}

const PRESET_MODELS: Record<string, string> = {
  deepseek: 'deepseek-v4-pro',
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  qwen: 'qwen-plus',
  glm: 'glm-4-flash',
  custom: ''
}

export default function Settings() {
  const { isApiReady, ai, setProviderConfig, setGlobalProvider, setFunctionOverride, loadSettings, saveSettings } = useSettingsStore()
  const [tab, setTab] = useState('deepseek')
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadSettings() }, [loadSettings])

  const cfg = ai.providers[tab] || { apiKey: '' }

  const handleSave = useCallback(async () => {
    try {
      await saveSettings()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('保存设置失败:', err)
      alert('保存失败，请查看控制台错误信息')
    }
  }, [saveSettings])

  const handleConfigChange = useCallback((field: string, value: string) => {
    setProviderConfig(tab, { [field]: value })
  }, [tab, setProviderConfig])

  const funcLabel: Record<string, string> = {
    chat: 'AI 对话',
    review: '代码审查',
    courseGen: '课程生成'
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">⚙️ 设置</h2>

      <div className="bg-surface-light rounded-xl p-6 mb-4">
        <h3 className="font-semibold mb-4">AI API 配置</h3>

        <div className="mb-5">
          <label className="block text-sm text-gray-400 mb-1">全局默认 Provider</label>
          <select
            value={ai.globalProvider}
            onChange={e => setGlobalProvider(e.target.value)}
            className="w-full bg-surface-dark border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setTab(p.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                tab === p.id
                  ? 'bg-accent text-surface-dark font-medium'
                  : 'bg-surface-dark text-gray-300 hover:bg-surface-dark/80'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="password"
              value={cfg.apiKey || ''}
              onChange={e => handleConfigChange('apiKey', e.target.value)}
              placeholder={cfg.apiKey ? '••••••••（已填写）' : '输入 API Key'}
              className="w-full bg-surface-dark border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base URL</label>
            <input
              type="text"
              value={cfg.baseURL ?? PRESET_URLS[tab]}
              onChange={e => handleConfigChange('baseURL', e.target.value)}
              placeholder={PRESET_URLS[tab] || 'https://'}
              className="w-full bg-surface-dark border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Model</label>
            <input
              type="text"
              value={cfg.model ?? PRESET_MODELS[tab]}
              onChange={e => handleConfigChange('model', e.target.value)}
              placeholder={PRESET_MODELS[tab] || '输入模型名称'}
              className="w-full bg-surface-dark border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 mb-5">
          <h4 className="text-sm font-medium text-gray-300 mb-3">功能覆盖（可选）</h4>
          <div className="space-y-3">
            {(['chat', 'review', 'courseGen'] as const).map(func => (
              <div key={func}>
                <label className="block text-sm text-gray-400 mb-1">{funcLabel[func]}</label>
                <select
                  value={ai.functionOverrides[func] || ''}
                  onChange={e => setFunctionOverride(func, e.target.value || undefined)}
                  className="w-full bg-surface-dark border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">使用全局</option>
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent text-surface-dark rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            保存
          </button>
          {saved && <span className="text-accent-green text-sm">✅ 已保存</span>}
        </div>
        <div className="flex items-center gap-2 text-sm mt-3">
          <span className={`w-2 h-2 rounded-full ${isApiReady ? 'bg-accent-green' : 'bg-gray-600'}`} />
          <span className="text-gray-400">{isApiReady ? 'API 已连接' : 'API 未配置（至少一个 Provider 填写 API Key）'}</span>
        </div>
      </div>

      <div className="bg-surface-light rounded-xl p-6">
        <h3 className="font-semibold mb-4">关于</h3>
        <p className="text-sm text-gray-400">CodeLearn v0.1.0</p>
        <p className="text-sm text-gray-400">AI 驱动的编程语言学习应用</p>
      </div>
    </div>
  )
}
