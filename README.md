# CodeLearn

[English](#english) | 中文（默认）

> 本人是准大学生，这是我第一次尝试做一个可能算得上有用的项目。全部内容皆为 AI 生成，采用 Claude Code，主要使用 DeepSeekV4Pro 模型。这个项目仅供娱乐，如果有人愿意提点建议，我会非常感激。

AI 驱动的编程语言学习桌面应用。本地运行，AI 动态生成课程内容（大纲、章节、选择题、编程题），支持从零基础到进阶逐级学习。

**当前版本：v0.3.0**

## 更新日志

### v0.3.0（2026-07-26）
- **UI 全面重设计为「极简极客风」**：纯黑底 + 终端绿单色强调、全局等宽字体、lucide 线性图标替换全部 emoji、Monaco 自定义编辑器主题
- **新增主题系统**：8 套预设模板（终端绿/琥珀/赛博青/紫罗兰/冰蓝/桔红/亮色纸面/暖黑）+ 自定义强调色/背景色，设置页「外观」卡片实时预览，重启后保留
- 聊天流式协议升级：streamId 多流隔离、后端流可中断、错误路径与监听器泄漏修复
- 测试扩充至 69 个（lib/stores/electron/hooks 四个域）

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面框架 | Electron + electron-vite |
| 前端 | React 18 + TypeScript 6.0 |
| 样式 | Tailwind CSS 3（CSS 变量主题系统：8 套模板 + 自定义颜色） |
| 图标 | lucide-react 线性图标 |
| 状态管理 | Zustand |
| 代码编辑器 | Monaco Editor（本地加载，自定义主题） |
| AI API | 多平台支持（DeepSeek / Claude / OpenAI / 通义千问 / 智谱GLM / 自定义） |
| 本地存储 | better-sqlite3（key-value 持久化） |
| 测试 | Vitest 2.0（69 tests） |

## 使用教程（从零开始）

### 1. 环境准备

- 安装 [Node.js](https://nodejs.org/)（建议 20 LTS 或更高版本，安装后自带 npm）
- 安装 [Git](https://git-scm.com/)
- 验证安装：打开终端（Windows 用 PowerShell 或 Git Bash），执行 `node -v` 和 `git --version`，能显示版本号即可

### 2. 克隆仓库并安装依赖

```bash
git clone https://github.com/lcx812/AI-CodeLearn.git
cd AI-CodeLearn
npm install
```

> `npm install` 需要几分钟。better-sqlite3 是原生模块，通常会自动下载预编译二进制；极少数情况下需要 C++ 构建工具（Windows 为 Visual Studio Build Tools），报错时按提示安装即可。

### 3. 启动应用（开发模式）

```bash
npm run dev:electron
```

首次启动会弹出桌面窗口。之后修改代码会自动热更新。

### 4. 配置 AI API Key（必做）

应用的所有 AI 功能都依赖你自己的 API Key：

1. 点击左侧导航「设置」
2. 选择一个 Provider（推荐 DeepSeek，国内可直接访问、价格低）
3. 到对应平台官网注册并创建 API Key（如 platform.deepseek.com）
4. 粘贴到 API Key 输入框，点击「保存」
5. 底部状态栏显示「AI: 就绪」即配置成功

### 5. 开始使用

1. 「课程」页 →「+ AI 生成课程」→ 填写语言（如 Python）、方向（如 零基础入门）、难度、章节数 → 开始生成（流式逐章生成，可随时取消）
2. 进入课程 → 左侧选章节学习，右侧可切换「AI 提问」
3. 「练习场」页 → 生成题目 → 写代码 →「提交审查」获得 AI 评分与改进建议
4. 「设置」页 →「外观」卡片 → 换主题模板或自定义颜色

### 6. 打包成安装包（可选）

```bash
npm run build          # 类型检查 + 构建产物
npx electron-builder   # 打包当前平台的安装包（Windows/macOS/Linux）
```

### 常用命令

| 命令 | 作用 |
|------|------|
| `npm run dev:electron` | Electron 开发模式（日常开发） |
| `npm run typecheck` | TypeScript 类型检查（前端 + 主进程） |
| `npm run test` | 运行 69 个单元测试 |
| `npm run build` | 类型检查 + 生产构建 |

## 目录结构

```
codelearn/
├── electron/              # Electron 主进程
│   ├── main.ts            # 窗口创建
│   ├── preload.ts         # contextBridge API
│   ├── db.ts              # SQLite 数据库
│   ├── providers.ts       # AI Provider 预设
│   ├── settings-store.ts  # 设置持久化
│   └── ipc/
│       ├── ai.ts           # AI API 代理（流式对话、课程生成、练习生成、代码审查）
│       ├── storage.ts      # 本地存储 IPC
│       └── fs.ts           # 文件读取 IPC
├── src/                   # React 渲染进程
│   ├── App.tsx            # 路由（React.lazy 懒加载）
│   ├── types.ts           # 全局类型定义
│   ├── global.d.ts        # window.api 类型声明
│   ├── stores/            # Zustand 状态
│   │   ├── course.ts      # 多课程管理（courses[] + currentCourseId）
│   │   ├── chat.ts        # 聊天记录
│   │   ├── settings.ts    # AI 设置
│   │   └── theme.ts       # 主题（模板 + 自定义颜色，CSS 变量换肤）
│   ├── pages/             # 7 个页面
│   │   ├── Dashboard.tsx   # 仪表盘
│   │   ├── Courses.tsx     # 课程列表 + AI 课程生成
│   │   ├── CourseDetail.tsx# 课程详情（大纲 + 章节 + 题目 + AI 提问）
│   │   ├── Playground.tsx  # 练习场（课程感知 + 综合项目/章节练习）
│   │   ├── AITutor.tsx     # AI 导师（语言探索）
│   │   ├── Progress.tsx    # 学习进度
│   │   └── Settings.tsx    # API 配置 + 外观主题
│   ├── components/        # 通用组件
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx / TopBar.tsx / StatusBar.tsx
│   │   ├── Editor.tsx      # Monaco 编辑器
│   │   ├── CourseGenerator.tsx  # AI 课程生成面板（流式）
│   │   ├── ChapterExpander.tsx  # 章节扩写面板（流式）
│   │   ├── ExercisePanel.tsx    # 题目面板
│   │   ├── ErrorBoundary.tsx    # React 错误边界
│   │   ├── SuspenseLoader.tsx   # 懒加载 fallback
│   │   ├── ui/                  # 共享 UI 组件（Spinner, ProgressBar, ErrorDisplay, MarkdownRenderer 等 7 个）
│   │   └── chat/           # 聊天组件
│   │       ├── ChatPanel.tsx
│   │       ├── ChatInput.tsx
│   │       ├── MessageList.tsx
│   │       └── CourseDrawer.tsx
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useInit.ts      # 应用初始化（加载设置/课程/主题）
│   │   ├── useStream.ts    # AI 流式响应（useChat 的底层）
│   │   └── useChat.ts      # 聊天逻辑（global/local 双 scope）
│   └── lib/
│       ├── ipc.ts          # IPC 封装
│       ├── constants.ts    # 全局常量
│       ├── themes.ts       # 主题模板 + 色板派生
│       ├── utils.ts        # 纯工具函数
│       └── prompts.ts      # 前端 AI Prompt（4 个函数）
├── tests/                  # 69 tests（lib/stores/electron/hooks）
└── docs/superpowers/       # 设计文档 + 实现计划
    ├── specs/
    └── plans/
```

## 页面结构

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/` | 学习概览、课程列表、快速入口 |
| 课程 | `/courses` | 多课程列表 + AI 生成课程（填写语言/方向/难度/章节数/题目数，流式生成大纲→逐章） |
| 课程详情 | `/courses/:id` | 左栏大纲 + 右栏内容（章节 Markdown + 章末选择题/编程题）+ AI 提问 Tab + 扩写面板 |
| 练习场 | `/playground` | 课程/章节选择器 + 综合项目/章节练习切换 + Monaco 编辑器 + 代码审查 + 追问 |
| AI 导师 | `/ai-tutor` | 语言探索模式（用途、历史、开发环境简短回答） |
| 进度 | `/progress` | 课程统计、章节完成度 |
| 设置 | `/settings` | 多平台 API Key 配置 + 外观主题（模板/自定义颜色） |

## 数据模型

```typescript
Course {
  id: string; language: string; title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chapters: Chapter[]; createdAt: number; updatedAt: number
}

Chapter {
  id: string; title: string; content: string  // Markdown
  exercises: Exercise[]   // 章末编程题
  quiz: ChoiceQuestion[]  // 章末选择题
  status: 'pending' | 'generating' | 'done'
}

ChoiceQuestion {
  question: string; options: string[4]
  correctIndex: number; explanation: string
}

Exercise {
  type: 'mc' | 'coding'
  title: string; description: string; starterCode: string
  testCases: { input: string; expected: string }[]
  language: string; difficulty: string
}
```

## 约束规则

### 课程生成
- 单次课程生成 ≤ 20 章，单次扩写 ≤ 20 章
- 单个课程累计 ≤ 500 章
- 大纲只输出章节标题列表（`第x章：标题 —— 说明`），禁止课程概述/学习路径建议
- 章节标题格式：`第x章：标题`（中文全角冒号），禁止 `——` 破折号连接
- JSON 顶层字段白名单：title / content / exercises / quiz，禁止 description 等额外字段
- exercise 字段白名单（7 个）：type / title / description / starterCode / testCases / language / difficulty
- quiz 字段白名单（4 个）：question / options / correctIndex / explanation
- options 必须恰好 4 项，correctIndex 为 0-3 整数
- prompt 含格式铁律 + 输出前自检清单，提高 LLM 遵守率

### 校验层（`normalizeChapter`）
- 空值守卫 → 白名单过滤 → 破折号清洗 → 字段规范化
- JSON 解析失败时发送错误事件，不静默变空章节
- AI 调用通过主进程代理，API Key 存储于本机用户目录（electron-store，明文 JSON，不会上传到任何服务器）
- JSON 解析三级兜底：直接解析 → { } 截取 → 代码块提取

## 设计原则

- 简洁优先：代码短、变量短、函数短
- 防御式编码：检查边界条件、空值、异常路径
- UI 文本中文，极简极客风主题系统（默认深色）

---

<h2 id="english">English</h2>

> I'm a soon-to-be college freshman, and this is my first attempt at building something that might be considered useful. Everything is AI-generated using Claude Code, primarily powered by the DeepSeek V4 Pro model. This project is just for fun — if anyone has suggestions, I'd be very grateful.

An AI-powered desktop app for learning programming languages. Runs locally, with AI dynamically generating course content (outlines, chapters, quizzes, coding exercises), supporting progressive learning from beginner to advanced.

**Current version: v0.3.0** — 2026-07-26: full UI redesign (minimalist terminal aesthetic, lucide icons, monospace UI font, custom Monaco theme) + theme system (8 presets incl. light/warm, custom accent/background colors, live preview in Settings). See the Chinese changelog above for details.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop Framework | Electron + electron-vite |
| Frontend | React 18 + TypeScript 6.0 |
| Styling | Tailwind CSS 3 (CSS-variable theme system: 8 presets + custom colors) |
| Icons | lucide-react |
| State Management | Zustand |
| Code Editor | Monaco Editor (local, custom theme) |
| AI API | Multi-platform (DeepSeek / Claude / OpenAI / Qwen / GLM / Custom) |
| Local Storage | better-sqlite3 (key-value persistence) |
| Testing | Vitest 2.0 (69 tests) |

## Getting Started (from scratch)

1. Install [Node.js](https://nodejs.org/) (20 LTS+) and [Git](https://git-scm.com/)
2. Clone and install:
   ```bash
   git clone https://github.com/lcx812/AI-CodeLearn.git
   cd AI-CodeLearn
   npm install
   ```
3. Run in dev mode:
   ```bash
   npm run dev:electron
   ```
4. Configure an API key: open Settings → pick a provider (e.g. DeepSeek) → paste your key → Save
5. Optional — build an installer: `npm run build && npx electron-builder`

## Directory Structure

```
codelearn/
├── electron/              # Electron main process
│   ├── main.ts            # Window creation
│   ├── preload.ts         # contextBridge API
│   ├── db.ts              # SQLite database
│   ├── providers.ts       # AI provider presets
│   ├── settings-store.ts  # Settings persistence
│   └── ipc/
│       ├── ai.ts           # AI API proxy (streaming chat, course gen, exercise gen, code review)
│       ├── storage.ts      # Local storage IPC
│       └── fs.ts           # File read IPC
├── src/                   # React renderer
│   ├── App.tsx            # Routing (React.lazy code-splitting)
│   ├── types.ts           # Global type definitions
│   ├── global.d.ts        # window.api type declarations
│   ├── stores/            # Zustand stores
│   │   ├── course.ts      # Multi-course management (courses[] + currentCourseId)
│   │   ├── chat.ts        # Chat history
│   │   ├── settings.ts    # AI settings
│   │   └── theme.ts       # Theme (presets + custom colors, CSS-variable skinning)
│   ├── pages/             # 7 pages
│   │   ├── Dashboard.tsx   # Dashboard
│   │   ├── Courses.tsx     # Course list + AI course generation
│   │   ├── CourseDetail.tsx# Course detail (outline + chapters + exercises + AI chat)
│   │   ├── Playground.tsx  # Playground (course-aware + integrated project/chapter exercises)
│   │   ├── AITutor.tsx     # AI Tutor (language exploration)
│   │   ├── Progress.tsx    # Learning progress
│   │   └── Settings.tsx    # API configuration + appearance theme
│   ├── components/        # Shared components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx / TopBar.tsx / StatusBar.tsx
│   │   ├── Editor.tsx      # Monaco editor
│   │   ├── CourseGenerator.tsx  # AI course generator (streaming)
│   │   ├── ChapterExpander.tsx  # Chapter expander (streaming)
│   │   ├── ExercisePanel.tsx    # Exercise panel
│   │   ├── ErrorBoundary.tsx    # React error boundary
│   │   ├── SuspenseLoader.tsx   # Lazy-load fallback
│   │   ├── ui/                  # Shared UI (Spinner, ProgressBar, ErrorDisplay, MarkdownRenderer, etc. — 7 components)
│   │   └── chat/           # Chat components
│   │       ├── ChatPanel.tsx
│   │       ├── ChatInput.tsx
│   │       ├── MessageList.tsx
│   │       └── CourseDrawer.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useInit.ts      # App initialization (load settings/courses/theme)
│   │   ├── useStream.ts    # AI streaming response (used by useChat)
│   │   └── useChat.ts      # Chat logic (global/local scopes)
│   └── lib/
│       ├── ipc.ts          # IPC wrapper
│       ├── constants.ts    # Global constants
│       ├── themes.ts       # Theme presets + palette derivation
│       ├── utils.ts        # Pure utility functions
│       └── prompts.ts      # Frontend AI prompts (4 functions)
├── tests/                  # 69 tests (lib/stores/electron/hooks)
└── docs/superpowers/       # Design docs + implementation plans
    ├── specs/
    └── plans/
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Learning overview, course list, quick actions |
| Courses | `/courses` | Multi-course list + AI course generation (language/direction/difficulty/chapters/exercises, streaming outline→per chapter) |
| Course Detail | `/courses/:id` | Left outline + right content (chapter markdown + quizzes/exercises) + AI chat tab + expand panel |
| Playground | `/playground` | Course/chapter selector + integrated project/chapter exercise toggle + Monaco editor + code review + follow-up |
| AI Tutor | `/ai-tutor` | Language exploration (usage, history, dev environment quick answers) |
| Progress | `/progress` | Course stats, chapter completion |
| Settings | `/settings` | Multi-platform API key configuration + appearance theme |

## Data Model

```typescript
Course {
  id: string; language: string; title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  chapters: Chapter[]; createdAt: number; updatedAt: number
}

Chapter {
  id: string; title: string; content: string  // Markdown
  exercises: Exercise[]   // End-of-chapter coding exercises
  quiz: ChoiceQuestion[]  // End-of-chapter quizzes
  status: 'pending' | 'generating' | 'done'
}

ChoiceQuestion {
  question: string; options: string[4]
  correctIndex: number; explanation: string
}

Exercise {
  type: 'mc' | 'coding'
  title: string; description: string; starterCode: string
  testCases: { input: string; expected: string }[]
  language: string; difficulty: string
}
```

## Constraints

### Course Generation
- Max 20 chapters per generation, max 20 per expansion
- Max 500 chapters per course
- Outline only outputs chapter title list (`第x章：标题 —— 说明`), no course overview/learning path text
- Chapter title format: `第x章：标题` (full-width colon), no `——` dash separator
- JSON top-level field whitelist: title / content / exercises / quiz — no extra fields like description
- Exercise field whitelist (7): type / title / description / starterCode / testCases / language / difficulty
- Quiz field whitelist (4): question / options / correctIndex / explanation
- options must be exactly 4 items, correctIndex 0-3 integer
- Prompt includes format iron rules + pre-output self-check checklist

### Validation Layer (`normalizeChapter`)
- Null guard → whitelist filter → dash cleanup → field normalization
- JSON parse failure sends error event, no silent empty chapter
- All AI calls proxied through main process, API keys stored locally in the user directory (electron-store, plain JSON — never uploaded anywhere)
- JSON parsing with 3-tier fallback: direct parse → `{ }` extraction → code block extraction

## Design Principles

- Simplicity first: short code, short names, short functions
- Defensive coding: check edge cases, nulls, error paths
- UI text in Chinese, minimalist theme system (dark by default)
