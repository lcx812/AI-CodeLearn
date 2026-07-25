# 课程生成 LLM 格式严格化 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `electron/ipc/ai.ts` 中的课程生成 prompt 和校验层，确保大纲只输出章节标题、章标题格式为 `第x章：标题`（无 `——`）、JSON 不含多余字段。

**Architecture:** 纯 prompt 优化 + `normalizeChapter` 代码校验层。只改一个文件 `electron/ipc/ai.ts`，三个改动点：重写两个 prompt builder、新增 normalizeChapter 函数、handler 中接入调用。

**Tech Stack:** TypeScript (Electron 主进程), OpenAI SDK, Anthropic SDK

## Global Constraints

- 只修改 `electron/ipc/ai.ts`，其他文件不动
- `npx tsc --noEmit` 零错误
- `npm run test` 45 tests 通过
- 大纲格式：`第x章：标题 —— 一句话说明`，N 行
- 章标题格式：`第x章：标题`，冒号为中文全角（：），禁止 `——`

---

### Task 1: 重写 buildOutlinePrompt

**Files:**
- Modify: `electron/ipc/ai.ts:239-261`

**Interfaces:**
- Consumes: `lang`, `direction`, `difficulty`, `chCount`, `qCount`, `extra` (existing params)
- Produces: prompt string — 让 LLM 输出 N 行 `第x章：标题 —— 说明` 格式

- [ ] **Step 1: 替换 buildOutlinePrompt 函数体**

将第 239-261 行替换为：

```typescript
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
```

- [ ] **Step 2: 类型检查**

```bash
cd codelearn && npx tsc --noEmit
```

预期：零错误。

---

### Task 2: 重写 buildChapterPrompt

**Files:**
- Modify: `electron/ipc/ai.ts:263-313`

**Interfaces:**
- Consumes: `lang`, `direction`, `difficulty`, `chIndex`, `chTotal`, `qCount`, `outline`, `extra`
- Produces: prompt string — 包含 JSON 模板、字段约束、自检清单

- [ ] **Step 1: 替换 buildChapterPrompt 函数体**

将第 263-313 行替换为：

```typescript
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
```

- [ ] **Step 2: 类型检查**

```bash
cd codelearn && npx tsc --noEmit
```

---

### Task 3: 新增 normalizeChapter 函数

**Files:**
- Modify: `electron/ipc/ai.ts` — 在 `parseJsonResponse` 之后、`buildOutlinePrompt` 之前插入新函数

**Interfaces:**
- Consumes: `raw: any`, `chIndex: number`
- Produces: `{ title: string, content: string, exercises: object[], quiz: object[] }` — 干净、符合 schema 的对象

- [ ] **Step 1: 在第 235 行后插入 normalizeChapter 函数**

```typescript
function normalizeChapter(raw: any, chIndex: number): object {
  // 1. 白名单过滤顶层字段
  const title = typeof raw.title === 'string' ? raw.title : ''
  const content = typeof raw.content === 'string' ? raw.content : ''
  const exercises = Array.isArray(raw.exercises) ? raw.exercises : []
  const quiz = Array.isArray(raw.quiz) ? raw.quiz : []

  // 2. 标题修正：去除各种破折号变体
  let cleanTitle = title
    .replace(/——{1,}/g, '')
    .replace(/──{1,}/g, '')
    .replace(/—{1,}/g, '')
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
```

- [ ] **Step 2: 类型检查**

```bash
cd codelearn && npx tsc --noEmit
```

---

### Task 4: handler 中接入 normalizeChapter

**Files:**
- Modify: `electron/ipc/ai.ts:135-140`

**Interfaces:**
- Consumes: `normalizeChapter(parsed, i+1)` — 刚定义的函数
- Produces: 规范化后的 chapter JSON 通过 IPC 发送前端

- [ ] **Step 1: 替换 handler 中的第 135-140 行**

将：
```typescript
        const parsed = parseJsonResponse(chText)
        win.webContents.send('ai:course-chapter', {
          index: i,
          total: chCount,
          chapterJson: JSON.stringify(parsed)
        })
```

改为：
```typescript
        const parsed = parseJsonResponse(chText)
        const normalized = normalizeChapter(parsed, i + 1)
        win.webContents.send('ai:course-chapter', {
          index: i,
          total: chCount,
          chapterJson: JSON.stringify(normalized)
        })
```

- [ ] **Step 2: 类型检查**

```bash
cd codelearn && npx tsc --noEmit
```

- [ ] **Step 3: 运行全部测试**

```bash
cd codelearn && npm run test
```

预期：45 tests 通过。

---

### Verification

- [ ] `cd codelearn && npx tsc --noEmit` — 零类型错误
- [ ] `cd codelearn && npm run test` — 45 tests 通过
- [ ] 手工：生成课程，验证大纲只输出 `第x章：标题 —— 说明` 格式
- [ ] 手工：检查 chapter JSON 不含 `description` 等多余字段
- [ ] 手工：检查 title 格式为 `第x章：标题`，无 `——`
