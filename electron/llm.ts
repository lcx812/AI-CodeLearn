import { BuiltClient, buildConfig, buildClient } from './providers'

// getSettings 占位 — 等 Task A2 接入 settings-store 时替换
function getSettings(): any {
  try {
    return require('./settings-store').getSettings()
  } catch {
    return { ai: { globalProvider: 'deepseek', providers: {}, functionOverrides: {} } }
  }
}

// 获取当前生效的 provider（考虑 function overrides）
function getActiveClient(functionType?: 'chat' | 'review' | 'courseGen'): BuiltClient {
  const s = getSettings()
  const providerId = (functionType && s.ai.functionOverrides?.[functionType])
    || s.ai.globalProvider || 'deepseek'
  const providerSettings = s.ai.providers?.[providerId] || {}
  return buildClient(buildConfig(providerId, {
    apiKey: providerSettings.apiKey,
    baseURL: providerSettings.baseURL,
    model: providerSettings.model
  }))
}

export { getActiveClient }
export { buildClient as createClient, buildConfig, PRESETS } from './providers'

// 向后兼容 — ipc/ai.ts 在 A2 重写前仍需这些导出
export function buildReviewPrompt(code: string, task: string, lang: string): string {
  return `请审查以下 ${lang} 代码。任务要求：${task}

代码：
\`\`\`${lang}
${code}
\`\`\`

请从以下方面评价并以 JSON 格式返回：
{
  "correctness": "正确性评价（一句话）",
  "style": "代码风格评价（一句话）",
  "suggestions": ["改进建议1", "改进建议2"],
  "score": 0-100
}
只返回 JSON，不要额外文本。`
}

export function buildExercisePrompt(lang: string, topic: string): string {
  return `请生成一道 ${lang} 编程练习题，主题是 ${topic}，难度为初级。

以 JSON 格式返回：
{
  "title": "题目标题",
  "description": "题目描述（含具体要求）",
  "starterCode": "初始代码模板",
  "testCases": [{"input": "...", "expected": "..."}],
  "language": "${lang}",
  "difficulty": "beginner"
}
只返回 JSON，不要额外文本。`
}
