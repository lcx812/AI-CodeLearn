# CodeLearn 设计文档

**日期**: 2026-07-24
**状态**: 已确认

---

## 项目概述

CodeLearn 是一个本地运行的 AI 驱动编程语言学习桌面应用。AI 动态生成学习内容（课程、练习、代码审查），用户从零基础到进阶逐级学习。

## 目标用户

覆盖零基础编程新手到有经验开发者学新语言。架构上支持多语言，内容由 AI 动态生成而非硬编码课程。

## 技术栈

| 层 | 选型 | 原因 |
|----|------|------|
| 桌面框架 | Electron 28+ | 跨平台桌面应用，Node.js 生态完整 |
| 前端框架 | React 18 + TypeScript 5 | 生态成熟，组件丰富 |
| 构建工具 | Vite 5 (electron-vite) | 快，Electron 支持好 |
| 状态管理 | Zustand | 轻量，无模板代码 |
| 样式 | Tailwind CSS 3 | 快速开发，暗色主题方便 |
| 代码编辑器 | Monaco Editor | VS Code 内核，体验最佳 |
| AI API | Claude API (Anthropic SDK) | 主 provider，通过主进程代理调用 |
| 本地存储 | better-sqlite3 | 单文件数据库，存进度/对话/课程 |
| 加密存储 | electron-store + safeStorage | API Key 安全存储 |

## 应用架构

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
│  ┌──────────────┐     ┌──────────────────────┐  │
│  │  Main Process │◄──►│  Renderer Process    │  │
│  │  (Node.js)    │IPC  │  (React + TS)        │  │
│  │              │     │                      │  │
│  │  • 窗口管理   │     │  • UI 层（组件树）    │  │
│  │  • 文件读写   │     │  • 状态管理（Zustand）│  │
│  │  • AI API 代理│     │  • Monaco Editor     │  │
│  │  • 本地存储   │     │  • 路由（侧边栏导航） │  │
│  └──────┬───────┘     └──────────┬───────────┘  │
│         │                        │               │
│         ▼                        ▼               │
│  ┌──────────────┐     ┌──────────────────────┐  │
│  │  AI Provider  │     │  Local SQLite        │  │
│  │  (Claude API) │     │  (进度/课程/配置)     │  │
│  └──────────────┘     └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 分层职责

- **Electron Main**: 窗口生命周期、IPC 桥接、AI API 代理（避免前端暴露 Key）、本地数据库操作
- **Electron Renderer**: 全部 UI、Zustand 状态、Monaco 编辑器、路由导航
- **AI Provider**: 统一 LLMProvider 接口，本期实现 Claude，预留 OpenAI 扩展
- **Storage**: better-sqlite3 单文件，存用户进度、对话历史、课程缓存

## 目录结构

```
codelearn/
├── electron/           # Electron 主进程
│   ├── main.ts
│   ├── preload.ts
│   └── ipc/
│       ├── ai.ts       # AI API 代理
│       └── storage.ts  # 本地存储
├── src/                # React 渲染进程
│   ├── App.tsx
│   ├── main.tsx
│   ├── router.tsx
│   ├── stores/         # Zustand stores
│   │   ├── chat.ts
│   │   ├── course.ts
│   │   └── settings.ts
│   ├── components/     # 通用组件
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── StatusBar.tsx
│   │   └── chat/
│   │       ├── ChatPanel.tsx
│   │       ├── MessageList.tsx
│   │       └── ChatInput.tsx
│   ├── pages/          # 页面
│   │   ├── Dashboard.tsx
│   │   ├── Courses.tsx
│   │   ├── Playground.tsx
│   │   ├── AITutor.tsx
│   │   └── Progress.tsx
│   ├── lib/            # 工具/API 封装
│   │   ├── ipc.ts      # IPC 调用封装
│   │   └── ai.ts       # AI 接口（渲染进程侧）
│   └── styles/
│       └── index.css
├── resources/          # 图标等静态资源
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── electron-builder.yml
├── tailwind.config.ts
└── postcss.config.js
```

## UI 布局 & 页面

```
┌──────────────────────────────────────────────────────┐
│  [≡]  CodeLearn              [设定⚙️] [用户👤]      │  ← 顶栏
├────────────┬─────────────────────────────────────────┤
│  仪表盘 🏠  │        主内容区                          │
│  课程 📚   │                                         │
│  练习场 💻  │    （根据左侧导航切换）                    │
│  AI导师 🤖  │                                         │
│  进度 📊   │                                         │
│  ────────   │                                         │
│  设置 ⚙️    │                                         │
├────────────┴─────────────────────────────────────────┤
│  🟢 AI 就绪  |  Python 学习中  |  今日完成 3/5 题      │  ← 状态栏
└──────────────────────────────────────────────────────┘
```

### 五大页面

| 页面 | 功能 | 本期实现 |
|------|------|----------|
| 仪表盘 | 学习概览、今日推荐、连续打卡、快捷入口 | 骨架 UI + 假数据 |
| 课程 | 语言选择 → 课程卡片列表 | 骨架 + AI 生成一个示例课程 |
| 练习场 | Monaco 编辑器 + 题目 + AI 反馈 | **核心：AI 完整打通** |
| AI 导师 | 聊天面板，上下文感知 | **核心：AI 完整打通** |
| 进度 | 学习统计、已完成课程 | 骨架 UI + 假数据 |

### 练习场（三栏布局）
- **左栏** (~25%): 题目描述、要求（AI 生成）
- **中栏** (~50%): Monaco 编辑器（代码编写）
- **右栏** (~25%): AI 反馈面板（审查结果、建议）

### AI 导师（聊天布局）
- 消息列表（Markdown + 代码高亮渲染）
- 底部输入框，支持 Shift+Enter 换行
- 预设快捷问题按钮（"解释这个概念"、"帮我调试这段代码"）

## AI 集成设计

### 统一接口

```typescript
interface LLMProvider {
  chat(messages: Message[], systemPrompt: string): AsyncIterable<string>;
  generateLesson(lang: string, topic: string, level: string): Promise<Lesson>;
  reviewCode(code: string, task: string, lang: string): Promise<Review>;
  generateExercise(lang: string, topic: string): Promise<Exercise>;
}
```

### 三个核心场景

| 场景 | 输入 | 输出 | 流式 |
|------|------|------|------|
| AI 导师对话 | 用户消息 + 学习上下文 + 历史 | Markdown 流 | ✅ |
| 练习生成 | 语言、主题、难度 | JSON（标题、描述、测试用例） | ❌ |
| 代码审查 | 学生代码、题目要求、语言 | JSON（正确性、风格、建议） | ❌ |

### System Prompt 策略

- 每种语言一个基础 system prompt（语言特性、教学风格）
- 根据用户等级（初级/中级/高级）追加难度指令
- 对话附加上下文：[正在学的语言] [当前课程主题] [最近 5 轮摘要]

### API Key 管理

- 用户在设置页输入 API Key
- 主进程 safeStorage 加密存储
- 渲染进程通过 IPC 调用主进程代理，不直接接触 Key

## 本期范围

### 包含
1. Electron + React + TypeScript 项目脚手架
2. 侧边栏 + 顶栏 + 状态栏 UI 框架
3. 五个页面路由和骨架 UI
4. Monaco Editor 嵌入（练习场页面）
5. Claude API 对接 —— AI 导师对话（流式输出）
6. Claude API 对接 —— 练习生成 + 代码审查
7. 设置页面（API Key 配置）
8. better-sqlite3 本地存储（对话历史 + 进度）
9. 暗色主题（默认代码编辑器风格）

### 不包含
- 用户认证系统
- 多语言学习路径自动规划
- 本地向量检索 / RAG
- 离线模式
- 自动更新

## 设计原则

- **简洁优先**: 代码短，变量短，函数短
- **防御式编码**: 检查边界、空值、异常路径
- **TDD**: 先测试 → 实现 → 重构
- **中文优先**: UI 文本默认中文，后续可 i18n
