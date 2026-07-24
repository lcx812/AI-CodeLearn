# CodeLearn 框架实现计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 来按任务实现。步骤使用 checkbox (- [ ]) 语法追踪。

**目标:** 搭建 CodeLearn Electron 桌面应用框架——含完整 UI 骨架、Monaco 编辑器、Claude AI 对话与代码审查打通、本地 SQLite 存储。

**架构:** Electron 主进程代理 AI API + 管理本地存储；React 渲染进程负责 UI；Zustand 管理状态；IPC 桥接前后端。

**技术栈:** Electron 28+, React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Monaco Editor, Zustand, better-sqlite3, Anthropic SDK

## 全局约束

- 所有命令使用 Git Bash（bash 语法，正斜杠路径）
- Python 3.12+，pip 管理依赖（如需要 Python 工具）
- 每个项目创建 .venv 虚拟环境，依赖写入 requirements.txt（如适用）
- 严格 TDD：先写测试 → 确认测试失败 → 写实现 → 确认测试通过 → 重构
- 防御式编码：检查边界条件、空值、异常路径
- 简洁优先：代码短，变量名短，函数名短
- 省略类型注解（TypeScript 中避免过度注解，让推断工作）
- 中文回复
- UI 文本默认中文
- Git 提交前确认

---

### Task 1: 项目脚手架初始化

**文件:**
- Create: codelearn/package.json
- Create: codelearn/tsconfig.json
- Create: codelearn/tsconfig.node.json
- Create: codelearn/vite.config.ts
- Create: codelearn/electron-builder.yml
- Create: codelearn/tailwind.config.ts
- Create: codelearn/postcss.config.js
- Create: codelearn/.gitignore
- Create: codelearn/resources/icon.png (占位)

**产出:** 可 npm install 的项目骨架

---

### Task 2: Electron 主进程 + 预加载脚本

**文件:**
- Create: codelearn/electron/main.ts
- Create: codelearn/electron/preload.ts
- Create: codelearn/index.html

**接口:**
- 产出: electron/main.ts 创建 BrowserWindow，加载 Vite dev server 或 dist
- 产出: electron/preload.ts 暴露 contextBridge API 给渲染进程

---

### Task 3: IPC 处理器 + Storage 层

**文件:**
- Create: codelearn/electron/ipc/storage.ts
- Create: codelearn/electron/ipc/ai.ts
- Modify: codelearn/electron/main.ts (注册 IPC handlers)
- Create: codelearn/electron/db.ts

**接口:**
- 消费: preload.ts 中定义的 IPC channel 名称
- 产出: electron/db.ts 导出 getDb() 返回 better-sqlite3 实例
- 产出: electron/ipc/storage.ts 注册 storage:* handlers
- 产出: electron/ipc/ai.ts 注册 ai:* 和 settings:* handlers（AI 部分先占位）

---

### Task 4: TypeScript 类型 + IPC 客户端封装

**文件:**
- Create: codelearn/src/lib/ipc.ts
- Create: codelearn/src/types.ts
- Create: codelearn/src/global.d.ts

**接口:**
- 消费: preload.ts 中 window.api 的类型
- 产出: src/lib/ipc.ts 导出类型安全的 IPC 调用函数
- 产出: src/types.ts 导出 Message, Lesson, Exercise, Review 等类型

---

### Task 5: Zustand Stores

**文件:**
- Create: codelearn/src/stores/settings.ts
- Create: codelearn/src/stores/chat.ts
- Create: codelearn/src/stores/course.ts

**接口:**
- 消费: src/lib/ipc.ts, src/types.ts
- 产出: useSettingsStore — apiKey, isApiReady, setApiKey, checkApiKey
- 产出: useChatStore — messages, isStreaming, sendMessage, clearMessages
- 产出: useCourseStore — currentLang, exercises, setLanguage, loadCourse

---

### Task 6: UI 框架 — 布局壳（Sidebar + TopBar + StatusBar）

**文件:**
- Create: codelearn/src/components/Sidebar.tsx
- Create: codelearn/src/components/TopBar.tsx
- Create: codelearn/src/components/StatusBar.tsx
- Create: codelearn/src/components/Layout.tsx
- Modify: codelearn/src/App.tsx
- Modify: codelearn/src/styles/index.css (追加布局样式)

**接口:**
- 消费: Zustand stores (settings.isApiReady, course.currentLang)
- 产出: Layout 组件包裹所有页面

---

### Task 7: 骨架页面（仪表盘 + 课程 + 进度 + 设置）

**文件:**
- Modify: codelearn/src/pages/Dashboard.tsx
- Modify: codelearn/src/pages/Courses.tsx
- Modify: codelearn/src/pages/Progress.tsx
- Modify: codelearn/src/pages/Settings.tsx
- Create: codelearn/src/components/CourseCard.tsx

**接口:**
- 消费: useCourseStore, useSettingsStore
- 产出: 四个有内容的骨架页面

---

### Task 8: Monaco Editor 集成 + 练习场页面

**文件:**
- Modify: codelearn/src/pages/Playground.tsx
- Create: codelearn/src/components/Editor.tsx
- Create: codelearn/src/components/ExercisePanel.tsx

---

### Task 9: AI 导师聊天页面

**文件:**
- Modify: codelearn/src/pages/AITutor.tsx
- Create: codelearn/src/components/chat/ChatPanel.tsx
- Create: codelearn/src/components/chat/MessageList.tsx
- Create: codelearn/src/components/chat/ChatInput.tsx

---

### Task 10: Claude API 对接（主进程）

**文件:**
- Modify: codelearn/electron/ipc/ai.ts
- Create: codelearn/electron/llm.ts

---

### Task 11: 最终集成 + 启动初始化

**文件:**
- Modify: codelearn/src/App.tsx (添加初始化逻辑)
- Create: codelearn/src/hooks/useInit.ts

---

## 实现顺序

Task 1 (脚手架) → Task 2 (Electron 主进程) → Task 3 (IPC + Storage)
       → Task 4 (类型 + IPC 封装) → Task 5 (Zustand Stores)
       → Task 6 (布局壳) → Task 7 (骨架页面)
       → Task 8 (Monaco + 练习场) → Task 9 (AI 聊天页)
       → Task 10 (Claude API) → Task 11 (最终集成)

## 验证清单

- npm install 无错误
- npx tsc --noEmit 无类型错误
- npx electron-vite dev 窗口正常打开
- 五大页面可导航切换
- 暗色主题一致
- Monaco Editor 正常加载和编辑
- 设置页面可保存 API Key
- AI 导师对话流式输出（配置 Key 后）
- 练习场可 AI 生成题目和代码审查（配置 Key 后）
- 状态栏反映 AI 连接状态和当前语言
