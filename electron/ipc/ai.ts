import { ipcMain, BrowserWindow } from 'electron'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { buildClient, PRESETS, ProviderConfig } from '../providers'
import { getAISettings, saveAISettings, AISettings } from '../settings-store'

function getActiveConfig(functionType?: string): ProviderConfig {
  const s = getAISettings()
  const overrides = s.functionOverrides as Record<string, string | undefined>
  const providerId = (functionType && overrides[functionType]) || s.globalProvider
  const p = s.providers[providerId] || {}
  const preset = PRESETS[providerId] || PRESETS.custom
  return {
    type: preset.type,
    apiKey: p.apiKey || '',
    baseURL: p.baseURL || preset.baseURL,
    model: p.model || preset.model
  }
}

export function registerAiHandlers() {
  ipcMain.handle('settings:get-ai', () => getAISettings())
  ipcMain.handle('settings:save-ai', (_e, ai: AISettings) => {
    saveAISettings(ai)
    return true
  })

  // ai:chat-stream
  ipcMain.handle('ai:chat-stream', async (event, messages: { role: string; content: string }[], systemPrompt: string) => {
    const config = getActiveConfig('chat')
    const { client, model, type } = buildClient(config)
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window')

    try {
      if (type === 'openai-compat') {
        const oaiClient = client as OpenAI
        const stream = await oaiClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
          ],
          stream: true
        })
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content
          if (text) win.webContents.send('ai:stream-chunk', text)
        }
      } else {
        const anthClient = client as Anthropic
        const stream = anthClient.messages.stream({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        })
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            win.webContents.send('ai:stream-chunk', chunk.delta.text)
          }
        }
      }
      win.webContents.send('ai:stream-done')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      win.webContents.send('ai:stream-error', message)
    }
  })

  // ai:chat — 非流式
  ipcMain.handle('ai:chat', async (_e, messages: { role: string; content: string }[], systemPrompt: string) => {
    const config = getActiveConfig('chat')
    const { client, model, type } = buildClient(config)

    if (type === 'openai-compat') {
      const oaiClient = client as OpenAI
      const resp = await oaiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        ]
      })
      return resp.choices?.[0]?.message?.content || ''
    } else {
      const anthClient = client as Anthropic
      const resp = await anthClient.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      })
      const block = resp.content[0]
      if (!block || block.type !== 'text') return ''
      return block.text
    }
  })

  // ai:generate-course — 流式课程生成（大纲 → 逐章生成）
  ipcMain.handle('ai:generate-course', async (event, params: {
    language: string; direction: string; difficulty: string
    chapterCount: number; questionsPerChapter: number; extra: string
  }) => {
    const config = getActiveConfig('courseGen')
    const { client, model, type } = buildClient(config)
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window')

    const chCount = Math.min(Math.max(params.chapterCount || 5, 1), 50)
    const qCount = Math.min(Math.max(params.questionsPerChapter || 3, 1), 10)

    try {
      // Step 1: 生成大纲
      const outlinePrompt = buildOutlinePrompt(params.language, params.direction, params.difficulty, chCount, qCount, params.extra)
      const outlineText = await doChat(client, model, type,
        '你是编程教育专家，擅长设计系统化的编程课程大纲。用中文回复。',
        outlinePrompt
      )
      win.webContents.send('ai:course-outline', outlineText)

      // Step 2: 逐章生成
      for (let i = 0; i < chCount; i++) {
        const chPrompt = buildChapterPrompt(params.language, params.direction, params.difficulty, i + 1, chCount, qCount, outlineText, params.extra)
        const chText = await doChat(client, model, type,
          '你是编程教育专家。只返回 JSON，不要额外文本。用中文撰写教学内容。',
          chPrompt
        )
        const parsed = parseJsonResponse(chText)
        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
          win.webContents.send('ai:stream-error', `第 ${i + 1} 章 JSON 解析失败: ${(parsed as any).raw || 'unknown'}`)
          return
        }
        const normalized = normalizeChapter(parsed, i + 1)
        win.webContents.send('ai:course-chapter', {
          index: i,
          total: chCount,
          chapterJson: JSON.stringify(normalized)
        })
      }

      // Step 3: 组装最终课程 JSON
      const courseJson = buildFinalCourseJson(params)
      win.webContents.send('ai:course-done', courseJson)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      win.webContents.send('ai:stream-error', message)
    }
  })

  // ai:generate-playground-exercise — 课程感知的练习场题目生成
  ipcMain.handle('ai:generate-playground-exercise', async (_e, params: {
    language: string; direction: string; type: string; courseContext: string
  }) => {
    const config = getActiveConfig()
    const { client, model, type } = buildClient(config)
    const prompt = buildPlaygroundPrompt(params.language, params.direction, params.type, params.courseContext)

    const text = await doChat(client, model, type,
      '你是编程教学专家，擅长设计高质量的编程练习题和项目题目。只返回 JSON，不要额外文本。用中文。',
      prompt
    )
    return parseJsonResponse(text)
  })

  // ai:generate-exercise
  ipcMain.handle('ai:generate-exercise', async (_e, lang: string, topic: string) => {
    const config = getActiveConfig()
    const { client, model, type } = buildClient(config)
    const prompt = buildExercisePrompt(lang, topic)
    const text = await doChat(client, model, type,
      '你是编程教学专家。只返回 JSON，不要额外文本。',
      prompt
    )
    return parseJsonResponse(text)
  })

  // ai:review-code
  ipcMain.handle('ai:review-code', async (_e, code: string, task: string, lang: string) => {
    const config = getActiveConfig('review')
    const { client, model, type } = buildClient(config)
    const prompt = buildReviewPrompt(code, task, lang)
    const text = await doChat(client, model, type,
      '你是资深代码审查专家。只返回 JSON，不要额外文本。用中文回复。',
      prompt
    )
    return parseJsonResponse(text)
  })
}

// ─── helpers ───

async function doChat(
  client: OpenAI | Anthropic,
  model: string,
  type: 'openai-compat' | 'anthropic',
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (type === 'openai-compat') {
    const oaiClient = client as OpenAI
    const resp = await oaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
    return resp.choices?.[0]?.message?.content || ''
  } else {
    const anthClient = client as Anthropic
    const resp = await anthClient.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
    const block = resp.content[0]
    if (!block || block.type !== 'text') return ''
    return block.text
  }
}

function parseJsonResponse(text: string): unknown {
  try { return JSON.parse(text) } catch { /* fallthrough */ }
  const cleaned = text.replace(/```json\n?|```/g, '').trim()
  try { return JSON.parse(cleaned) } catch { /* fallthrough */ }
  // try to extract first {...} block
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* fallthrough */ }
  }
  return { error: 'JSON parse failed', raw: text.slice(0, 200) }
}

function normalizeChapter(raw: any, chIndex: number): object {
  // 0. 空值守卫
  if (raw == null || typeof raw !== 'object') {
    return { title: `第${chIndex}章：`, content: '', exercises: [], quiz: [] }
  }

  // 1. 白名单过滤顶层字段
  const title = typeof raw.title === 'string' ? raw.title : ''
  const content = typeof raw.content === 'string' ? raw.content : ''
  const exercises = Array.isArray(raw.exercises) ? raw.exercises : []
  const quiz = Array.isArray(raw.quiz) ? raw.quiz : []

  // 2. 标题修正：去除各种破折号变体
  let cleanTitle = title
    .replace(/[—─]{1,}/g, '')
    .replace(/-{2,}/g, '')
    .trim()

  // 3. 标题格式修正：确保以"第x章："开头
  const chapterPrefix = /^第\d+章[:：]\s*/
  if (!chapterPrefix.test(cleanTitle)) {
    cleanTitle = `第${chIndex}章：${cleanTitle}`
  } else {
    cleanTitle = cleanTitle.replace(chapterPrefix, `第${chIndex}章：`)
  }

  // 4. exercise 规范化
  const EX_FIELDS = ['type', 'title', 'description', 'starterCode', 'testCases', 'language', 'difficulty']
  const cleanExercises = exercises.map((ex: any) => {
    const clean: Record<string, unknown> = {}
    for (const key of EX_FIELDS) {
      if (key === 'type') clean.type = ex.type || 'coding'
      else if (key === 'testCases') clean.testCases = Array.isArray(ex.testCases) ? ex.testCases : []
      else clean[key] = ex[key] ?? ''
    }
    return clean
  })

  // 5. quiz 规范化
  const QZ_FIELDS = ['question', 'options', 'correctIndex', 'explanation']
  const cleanQuiz = quiz.map((q: any) => {
    const clean: Record<string, unknown> = {}
    for (const key of QZ_FIELDS) {
      if (key === 'options') {
        const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : []
        while (opts.length < 4) opts.push(`选项${String.fromCharCode(65 + opts.length)}`)
        clean.options = opts
      } else if (key === 'correctIndex') {
        const n = Number(q.correctIndex)
        clean.correctIndex = Number.isFinite(n) ? Math.max(0, Math.min(3, Math.round(n))) : 0
      } else {
        clean[key] = q[key] ?? ''
      }
    }
    return clean
  })

  return { title: cleanTitle, content, exercises: cleanExercises, quiz: cleanQuiz }
}

// ─── prompt builders ───

function buildOutlinePrompt(lang: string, direction: string, difficulty: string, chCount: number, qCount: number, extra: string): string {
  const diffLabel = difficulty === 'beginner' ? '入门' : difficulty === 'intermediate' ? '中级' : '高级'
  return `请为以下课程设计章节安排：

【语言】${lang}
【方向】${direction}
【难度】${diffLabel}
【章节数】${chCount}
【每章题目数】${qCount}（选择题 + 编程题）
${extra ? `【额外要求】${extra}` : ''}

【输出格式】严格按以下格式输出 ${chCount} 行，每行一个章节：
第1章：章节标题 —— 一句话说明
第2章：章节标题 —— 一句话说明
...
第${chCount}章：章节标题 —— 一句话说明

【格式规则】
- 标题格式必须为"第x章：标题"，冒号为中文全角（：）
- 标题与说明之间用一个" —— "（空格+破折号+空格）分隔
- 禁止在标题本身中使用"——"、破折号、连字符或副标题
- 禁止输出课程概述、学习路径建议、问候语、确认语
- 直接输出第1章，不要任何前缀文字`
}

function buildChapterPrompt(lang: string, direction: string, difficulty: string, chIndex: number, chTotal: number, qCount: number, outline: string, extra: string): string {
  const diffLabel = difficulty === 'beginner' ? '入门' : difficulty === 'intermediate' ? '中级' : '高级'
  const quizCount = qCount > 1 ? qCount - 1 : 1
  return `请为以下课程生成第 ${chIndex}/${chTotal} 章的完整内容：

【语言】${lang}
【方向】${direction}
【难度】${diffLabel}
【章节安排】
${outline}

${extra ? `【额外要求】${extra}` : ''}

【格式铁律】违反以下任何一条即视为错误输出：
- 只返回一个 JSON 对象，整个回复以 { 开头、以 } 结尾
- JSON 顶层只能包含 4 个字段：title、content、exercises、quiz。禁止添加 description 等任何额外字段
- 禁止输出问候语、确认语、解释文字

严格按此 JSON 模板填充：
{
  "title": "第${chIndex}章：章节标题",
  "content": "Markdown 教学内容（含概念讲解 + 至少2个代码示例）",
  "exercises": [
    {
      "type": "coding",
      "title": "编程题标题",
      "description": "题目描述（含具体要求、输入输出示例）",
      "starterCode": "初始代码模板",
      "testCases": [{"input": "输入", "expected": "期望输出"}],
      "language": "${lang}",
      "difficulty": "${difficulty}"
    }
  ],
  "quiz": [
    {
      "question": "选择题题目",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctIndex": 0,
      "explanation": "解析"
    }
  ]
}

【title 规则】
- 格式必须为"第${chIndex}章：具体标题"，冒号为中文全角（：）
- 标题应与章节安排中第 ${chIndex} 章保持一致
- 禁止在标题中使用"——"、破折号、连字符

【exercises 规则】
- 每个 exercise 对象只能包含以上 7 个字段：type、title、description、starterCode、testCases、language、difficulty。禁止添加其他字段
- 共 ${qCount} 道编程题，至少 1 道

【quiz 规则】
- 每个 quiz 对象只能包含以上 4 个字段：question、options、correctIndex、explanation。禁止添加其他字段
- options 必须恰好 4 项（A/B/C/D 开头），correctIndex 为 0-3 的整数
- 共 ${quizCount} 道选择题

【输出前自检清单】逐项确认后输出 JSON：
□ 顶层只有 title、content、exercises、quiz 四个字段
□ title 格式为"第${chIndex}章：xxx"，无"——"
□ exercises 每个对象只有 7 个合法字段
□ quiz 每个对象只有 4 个合法字段，options 恰好 4 项
□ 首字符 {，末字符 }

用中文撰写教学内容（代码除外）。`
}

function buildFinalCourseJson(params: { language: string; direction: string; difficulty: string; chapterCount: number; questionsPerChapter: number; extra: string }): string {
  return JSON.stringify({
    language: params.language,
    title: `${params.language} ${params.direction}`,
    difficulty: params.difficulty,
    chapterCount: params.chapterCount,
    generatedAt: new Date().toISOString()
  })
}

function buildPlaygroundPrompt(lang: string, direction: string, exType: string, courseContext: string): string {
  const typeLabel = exType === 'project' ? '综合项目' : '章节练习'
  return `请生成一道 ${lang} 编程${typeLabel === '综合项目' ? '项目' : '练习题'}。

【类型】${typeLabel}
【方向】${direction}
【课程上下文】
${courseContext || '无特定课程上下文'}

${exType === 'project' ? `
【综合项目要求】
- 设计一个完整的、可运行的程序
- 包含多个模块/函数/类
- 有清晰的输入输出规范
- 适合作为阶段考核
- 提供完整的 starterCode 框架
` : `
【章节练习要求】
- 聚焦单一知识点或技能
- 题目描述清晰，含输入输出示例
- 提供初始代码模板
- 至少 2 组测试用例
`}

严格按此 JSON 格式返回（不要额外文本）：
{
  "title": "题目标题",
  "description": "题目描述（含具体要求、输入输出示例）",
  "starterCode": "初始代码模板（用 ${lang}）",
  "testCases": [{"input": "示例输入", "expected": "期望输出"}],
  "language": "${lang}",
  "difficulty": "intermediate"
}

语言平实易懂，专业不生僻。用中文回复（代码除外）。`
}

function buildExercisePrompt(lang: string, topic: string, difficulty = 'beginner'): string {
  const diffLabel = difficulty === 'beginner' ? '入门' : difficulty === 'intermediate' ? '中级' : '高级'
  return `你是编程教学专家。请生成一道 ${lang} 编程练习题。
【主题】${topic}
【难度】${diffLabel}
【语言】${lang}

【要求】
- 题目描述清晰，含具体输入输出示例
- 提供初始代码模板
- 至少 2 组测试用例，覆盖边界情况
- 语言平实易懂，专业不生僻

严格按此 JSON 格式返回（不要额外文本）：
{
  "title": "题目标题",
  "description": "题目描述（含具体要求、示例输入输出）",
  "starterCode": "初始代码模板",
  "testCases": [{"input": "正常输入", "expected": "期望输出"}, {"input": "边界输入", "expected": "期望输出"}],
  "language": "${lang}",
  "difficulty": "${difficulty}"
}`
}

function buildReviewPrompt(code: string, task: string, lang: string): string {
  return `你是资深 ${lang} 代码审查专家。请审查学生提交的代码。

【题目要求】
${task}

【学生代码】
\`\`\`${lang}
${code}
\`\`\`

【审查维度】
1. 正确性 — 是否满足题目要求？有无逻辑错误或边界遗漏？
2. 代码风格 — 命名是否清晰？结构是否合理？可读性如何？
3. 边界处理 — 是否处理了空输入、异常路径、极端值？
4. 改进建议 — 具体优化方向

【输出要求】
- 语言平实易懂，专业不生僻
- 用中文回复，代码示例除外
- 指出问题时给出正确做法
- 评分标准：90+ 优秀 / 70-89 良好 / 50-69 需改进 / <50 有严重问题

严格按此 JSON 格式返回（不要额外文本）：
{
  "correctness": "正确性评价",
  "style": "代码风格评价",
  "edgeCases": "边界与错误处理评价",
  "suggestions": ["改进建议1", "改进建议2"],
  "score": 0-100
}`
}
