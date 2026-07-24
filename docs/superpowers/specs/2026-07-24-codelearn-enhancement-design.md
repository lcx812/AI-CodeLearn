# CodeLearn 功能增强设计文档

**日期**: 2026-07-24
**状态**: 已确认
**基于**: 2026-07-24-codelearn-design.md（框架已建成）

---

## 概述

在现有 CodeLearn 框架基础上做三个方向增强：多平台 AI API、代码答疑优化、对话式课程生成。

## 模块 A: 多平台 AI API

### 架构变更

```
electron/llm.ts → 废弃 Anthropic 硬编码
electron/llm.ts → 改为多 provider 工厂 + 预设模板
electron/ipc/ai.ts → 根据用户配置动态选择 provider
```

### Provider 预设模板（已核实）

| ID | 名称 | 类型 | Base URL | 默认 Model |
|----|------|------|----------|------------|
| deepseek | DeepSeek | openai-compat | https://api.deepseek.com | deepseek-v4-pro |
| claude | Claude | anthropic | https://api.anthropic.com | claude-sonnet-4-20250514 |
| openai | OpenAI | openai-compat | https://api.openai.com/v1 | gpt-4o |
| qwen | 通义千问 | openai-compat | https://dashscope.aliyuncs.com/compatible-mode/v1 | qwen-plus |
| glm | 智谱GLM | openai-compat | https://api.z.ai/api/paas/v4 | glm-4-flash |
| custom | 自定义 | openai-compat | （用户填写） | （用户填写） |

- 所有 openai-compat 类型统一使用 openai npm 包调用
- Claude 保留 Anthropic SDK 调用
- 用户可修改任意预设的 URL 和 model name

### 设置结构

```typescript
interface AISettings {
  globalProvider: string
  providers: Record<string, {
    apiKey: string
    baseURL: string
    model: string
  }>
  functionOverrides: {
    chat?: string
    review?: string
    courseGen?: string
  }
}
```

### 调用流程

```
渲染进程 IPC 请求 → 主进程 ai handler
  → 读取 AISettings
  → 根据 globalProvider / functionOverrides 选择 provider
  → 获取 apiKey + baseURL + model
  → openai-compat: new OpenAI({ apiKey, baseURL })
  → anthropic: new Anthropic({ apiKey })
  → 执行调用，返回结果
```

### 关键文件

- electron/llm.ts — 重写为 provider 工厂 + 预设定义
- electron/ipc/ai.ts — 动态选择 provider 调用
- src/stores/settings.ts — 新增 aiSettings 状态
- src/pages/Settings.tsx — 新增多平台配置 UI

---

## 模块 B: 代码答疑优化

### UI 重构

练习场布局从三栏改为上下结构：

```
┌──────────────────────────────────────────────────────┐
│  💻 练习场                     [上传文件] [提交审查] │
├─────────────────────┬────────────────────────────────┤
│  题目描述 + 要求     │                               │
│  （可折叠）          │    Monaco 编辑器               │
│  📋 输入输出示例     │                               │
├─────────────────────┴────────────────────────────────┤
│  🤖 AI 反馈 / 答疑（可折叠面板）                      │
│  支持追问对话                                      │
└──────────────────────────────────────────────────────┘
```

### 文件上传

- 按钮触发系统文件对话框
- 支持格式: .py .js .ts .go .rs .java .c .cpp .rb .swift .kt
- 文件内容读入 Monaco 编辑器
- 通过 Electron dialog.showOpenDialog + fs.readFile

### 审查 Prompt 重构

```
你是 {语言} 专家。请审查以下代码：

【题目要求】{description}
【输入输出示例】{testCases}
【学生代码】{code}

请从以下方面评价：
1. 正确性：是否满足题目要求，有无逻辑错误
2. 代码风格：命名、结构、可读性
3. 边界处理：空输入、异常路径、极端值
4. 改进建议：具体优化方向（如有时）

语言风格：平实易懂，专业不生僻。用中文回复。
评分：0-100 分
```

### 提交 vs 答疑分离

- **提交审查**: 一次性的结构化反馈（正确性/风格/边界/建议 + 分数）
- **追问答疑**: 在反馈区继续对话，针对具体问题深入讨论

### 关键文件

- src/pages/Playground.tsx — 重写布局，加入文件上传、追问
- electron/ipc/ai.ts — review-code handler 使用新 prompt
- electron/ipc/fs.ts — 新增文件读取 IPC handler

---

## 模块 C: 对话式课程生成

### 设计理念

课程不由预设模板生成。用户在 AI 导师页通过对话让 AI 动态设计：

```
用户: "我想学 Rust，零基础"
AI:   设计大纲 → 用户确认/调整 → 逐章生成内容
```

### 数据结构

```typescript
interface Course {
  id: string
  language: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chapters: Chapter[]
  createdAt: number
}

interface Chapter {
  id: string
  title: string
  content: string           // AI 生成的教学内容 (Markdown)
  exercises: Exercise[]     // 配套练习题
  status: 'pending' | 'generating' | 'done'
}
```

### AI 导师页增强

聊天面板左侧新增**课程大纲抽屉**：

```
┌──────┬──────────────────────────────────┐
│ 课程  │                                  │
│ 大纲  │     AI 导师对话区                │
│      │                                  │
│ 📚 Ch1│  用户: 我想学 Python             │
│ 📚 Ch2│  AI: 好的！为你设计了入门课程...  │
│ 📝 Ch3│                                  │
│ ⬜ Ch4│                                  │
│      │                                  │
│[+扩写]│                                  │
└──────┴──────────────────────────────────┘
```

- 章节状态图标：📚 已生成 | 📝 生成中 | ⬜ 待生成
- 点击已生成章节 → 对话中显示该章内容
- "扩写"按钮 → AI 追问追加方向 → 生成新章节

### 对话上下文

AI 导师 system prompt 增强，携带：
- 当前课程信息（语言、标题、难度、已有章节列表）
- 当前章节（如正在学习某章）
- 最近 10 轮对话摘要

### 生成约束

- 单次生成（初始大纲）≤ 50 章
- 课程累计 ≤ 500 章
- 每章包含：概念讲解 + 代码示例 + ≥1 道练习题
- 练习题包含输入输出示例
- 语言风格（system prompt 强调）：平实易懂，专业不生僻

### 课程存储

- 课程数据存 SQLite courses 表（已有）
- 章节内容存 chapters 表（新增）（或 JSON 字段）
- 对话历史存 chat_history 表

### 关键文件

- src/components/chat/CourseDrawer.tsx — 新增课程大纲抽屉
- src/components/chat/ChatPanel.tsx — 集成 CourseDrawer + 增强 system prompt
- src/stores/chat.ts — 新增 course state
- src/stores/course.ts — 增强课程/章节管理
- electron/ipc/ai.ts — chat/courseGen handler 使用增强 prompt
- electron/db.ts — 如需要，新增 chapters 表

---

## 设计原则

- 所有 AI 调用都走用户选择的 provider
- UI 文本中文，AI 语言平实易懂专业不生僻
- 用户始终可以自定义 provider URL 和 model
- 课程完全由 AI 在对话中生成，无硬编码内容
