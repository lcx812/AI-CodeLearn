# CodeLearn

[English](#english) | 中文（默认）

> 本人是准大学生，这是我第一次尝试做一个可能算得上有用的项目。全部内容皆为 AI 生成，采用 Claude Code，主要使用 DeepSeekV4Pro 模型。这个项目仅供娱乐，如果有人愿意提点建议，我会非常感激。

AI 驱动的编程语言学习桌面应用。本地运行，AI 动态生成课程内容（大纲、章节、选择题、编程题），支持从零基础到进阶逐级学习。

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面框架 | Electron + electron-vite |
| 前端 | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS 3（暗色主题） |
| 状态管理 | Zustand |
| 代码编辑器 | Monaco Editor（本地加载） |
| AI API | 多平台支持（DeepSeek / Claude / OpenAI / 通义千问 / 智谱GLM / 自定义） |
| 本地存储 | better-sqlite3（key-value 持久化） |

## 快速启动

```bash
cd codelearn
npm install
npx electron-vite dev
```

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
│   ├── App.tsx            # 路由
│   ├── types.ts           # 全局类型定义
│   ├── global.d.ts        # window.api 类型声明
│   ├── stores/            # Zustand 状态
│   │   ├── course.ts      # 多课程管理（courses[] + currentCourseId）
│   │   ├── chat.ts        # 聊天记录
│   │   └── settings.ts    # AI 设置
│   ├── pages/             # 页面
│   │   ├── Dashboard.tsx   # 仪表盘
│   │   ├── Courses.tsx     # 课程列表 + AI 课程生成
│   │   ├── CourseDetail.tsx# 课程详情（大纲 + 章节 + 题目 + AI 提问）
│   │   ├── Playground.tsx  # 练习场（课程感知 + 综合项目/章节练习）
│   │   ├── AITutor.tsx     # AI 导师（语言探索）
│   │   ├── Progress.tsx    # 学习进度
│   │   └── Settings.tsx    # API 配置
│   ├── components/        # 通用组件
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Editor.tsx      # Monaco 编辑器
│   │   ├── CourseGenerator.tsx  # AI 课程生成面板（流式）
│   │   ├── ChapterExpander.tsx  # 章节扩写面板（流式）
│   │   └── chat/           # 聊天组件
│   │       ├── ChatPanel.tsx
│   │       ├── ChatInput.tsx
│   │       ├── MessageList.tsx
│   │       └── CourseDrawer.tsx
│   └── lib/
│       └── ipc.ts         # IPC 封装
├── tests/                 # 测试
└── docs/superpowers/      # 设计文档 + 实现计划
    ├── specs/
    └── plans/
```

## 页面结构

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/` | 学习概览、课程列表、快速入口 |
| 课程 | `/courses` | 多课程列表 + AI 生成课程（填写语言/方向/难度/章节数/题目数，流式生成大纲到逐章） |
| 课程详情 | `/courses/:id` | 左栏大纲 + 右栏内容（章节 Markdown + 章末选择题/编程题）+ AI 提问 Tab + 扩写面板 |
| 练习场 | `/playground` | 课程/章节选择器 + 综合项目/章节练习切换 + Monaco 编辑器 + 代码审查 + 追问 |
| AI 导师 | `/ai-tutor` | 语言探索模式（用途、历史、开发环境简短回答） |
| 进度 | `/progress` | 课程统计、章节完成度 |
| 设置 | `/settings` | 多平台 API Key 配置 |

## 数据模型

```typescript
Course {
  id: string; language: string; title: string; description: string
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

- 单次课程生成 <= 20 章，单次扩写 <= 20 章
- 单个课程累计 <= 500 章
- AI 输出严格 JSON-only，禁止问候语和确认语
- 所有 AI 调用通过主进程代理，API Key 加密存储
- 扩写 JSON 解析三级兜底：直接解析 -> { } 截取 -> 代码块提取

## 设计原则

- 简洁优先：代码短、变量短、函数短
- 防御式编码：检查边界条件、空值、异常路径
- UI 文本中文，暗色主题

---

<h2 id="english">English</h2>

> I'm a soon-to-be college freshman, and this is my first attempt at building something that might be considered useful. Everything is AI-generated using Claude Code, primarily powered by the DeepSeek V4 Pro model. This project is just for fun -- if anyone has suggestions, I'd be very grateful.

An AI-powered desktop app for learning programming languages. Runs locally, with AI dynamically generating course content (outlines, chapters, quizzes, coding exercises), supporting progressive learning from beginner to advanced.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop Framework | Electron + electron-vite |
| Frontend | React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3 (dark theme) |
| State Management | Zustand |
| Code Editor | Monaco Editor (local) |
| AI API | Multi-platform (DeepSeek / Claude / OpenAI / Qwen / GLM / Custom) |
| Local Storage | better-sqlite3 (key-value persistence) |

## Quick Start

```bash
cd codelearn
npm install
npx electron-vite dev
```

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
│   ├── App.tsx            # Routing
│   ├── types.ts           # Global type definitions
│   ├── global.d.ts        # window.api type declarations
│   ├── stores/            # Zustand stores
│   │   ├── course.ts      # Multi-course management (courses[] + currentCourseId)
│   │   ├── chat.ts        # Chat history
│   │   └── settings.ts    # AI settings
│   ├── pages/             # Pages
│   │   ├── Dashboard.tsx   # Dashboard
│   │   ├── Courses.tsx     # Course list + AI course generation
│   │   ├── CourseDetail.tsx# Course detail (outline + chapters + exercises + AI chat)
│   │   ├── Playground.tsx  # Playground (course-aware + integrated project/chapter exercises)
│   │   ├── AITutor.tsx     # AI Tutor (language exploration)
│   │   ├── Progress.tsx    # Learning progress
│   │   └── Settings.tsx    # API configuration
│   ├── components/        # Shared components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Editor.tsx      # Monaco editor
│   │   ├── CourseGenerator.tsx  # AI course generator (streaming)
│   │   ├── ChapterExpander.tsx  # Chapter expander (streaming)
│   │   └── chat/           # Chat components
│   │       ├── ChatPanel.tsx
│   │       ├── ChatInput.tsx
│   │       ├── MessageList.tsx
│   │       └── CourseDrawer.tsx
│   └── lib/
│       └── ipc.ts         # IPC wrapper
├── tests/                 # Tests
└── docs/superpowers/      # Design docs + implementation plans
    ├── specs/
    └── plans/
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Learning overview, course list, quick actions |
| Courses | `/courses` | Multi-course list + AI course generation (language/direction/difficulty/chapters/exercises, streaming outline->per chapter) |
| Course Detail | `/courses/:id` | Left outline + right content (chapter markdown + quizzes/exercises) + AI chat tab + expand panel |
| Playground | `/playground` | Course/chapter selector + integrated project/chapter exercise toggle + Monaco editor + code review + follow-up |
| AI Tutor | `/ai-tutor` | Language exploration (usage, history, dev environment quick answers) |
| Progress | `/progress` | Course stats, chapter completion |
| Settings | `/settings` | Multi-platform API key configuration |

## Data Model

```typescript
Course {
  id: string; language: string; title: string; description: string
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

- Max 20 chapters per generation, max 20 per expansion
- Max 500 chapters per course
- AI output strictly JSON-only -- no greetings or confirmations
- All AI calls proxied through main process, API keys encrypted at rest
- Expansion JSON parsing with 3-tier fallback: direct parse -> { } extraction -> code block extraction

## Design Principles

- Simplicity first: short code, short names, short functions
- Defensive coding: check edge cases, nulls, error paths
- UI text in Chinese, dark theme
