# CodeLearn 框架实现计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 来按任务实现。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 搭建 CodeLearn Electron 桌面应用框架——含完整 UI 骨架、Monaco 编辑器、Claude AI 对话与代码审查打通、本地 SQLite 存储。

**架构:** Electron 主进程代理 AI API + 管理本地存储；React 渲染进程负责 UI；Zustand 管理状态；IPC 桥接前后端。

**技术栈:** Electron 28+, React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Monaco Editor, Zustand, better-sqlite3, Anthropic SDK

## 全局约束

- 所有命令使用 Git Bash（bash 语法，正斜杠路径）
- Python 3.12+，pip 管理依赖（如需要 Python 工具）
- 每个项目创建 `.venv` 虚拟环境，依赖写入 requirements.txt（如适用）
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
- Create: `codelearn/package.json`
- Create: `codelearn/tsconfig.json`
- Create: `codelearn/tsconfig.node.json`
- Create: `codelearn/vite.config.ts`
- Create: `codelearn/electron-builder.yml`
- Create: `codelearn/tailwind.config.ts`
- Create: `codelearn/postcss.config.js`
- Create: `codelearn/.gitignore`
- Create: `codelearn/resources/icon.png` (占位)

**产出:** 可 `npm install` 的项目骨架

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "codelearn",
  "version": "0.1.0",
  "description": "AI-powered programming language learning app",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4",
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.50.0",
    "better-sqlite3": "^11.1.2",
    "electron-store": "^8.2.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.11",
    "@vitejs/plugin-react": "^4.3.1",
    "electron": "^31.3.0",
    "electron-builder": "^24.13.3",
    "electron-vite": "^2.3.0",
    "typescript": "^5.5.4",
    "vite": "^5.3.5",
    "vitest": "^2.0.4",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.19",
    "@types/node": "^20.14.14"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "composite": true
  },
  "include": ["vite.config.ts", "electron/**/*.ts"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron',
      rollupOptions: {
        input: 'electron/main.ts'
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist-electron',
      rollupOptions: {
        input: 'electron/preload.ts'
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: 'index.html'
      }
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 5: 创建 tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#1e1e2e', light: '#2a2a3c', dark: '#181825' },
        accent: { DEFAULT: '#89b4fa', green: '#a6e3a1', red: '#f38ba8', yellow: '#f9e2af' }
      }
    }
  },
  plugins: []
} satisfies Config
```

- [ ] **Step 6: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 7: 创建 electron-builder.yml**

```yaml
appId: com.codelearn.app
productName: CodeLearn
directories:
  output: release
files:
  - dist
  - dist-electron
win:
  target: nsis
mac:
  target: dmg
linux:
  target: AppImage
```

- [ ] **Step 8: 创建 .gitignore**

```
node_modules/
dist/
dist-electron/
release/
.env
*.db
```

- [ ] **Step 9: 创建空白占位图标 resources/icon.png**

- [ ] **Step 10: 安装依赖并验证**

- [ ] **Step 11: 提交**

---

### Task 2: Electron 主进程 + 预加载脚本

**文件:**
- Create: `codelearn/electron/main.ts`
- Create: `codelearn/electron/preload.ts`
- Create: `codelearn/index.html`

---

### Task 3: IPC 处理器 + Storage 层

**文件:**
- Create: `codelearn/electron/ipc/storage.ts`
- Create: `codelearn/electron/ipc/ai.ts`
- Modify: `codelearn/electron/main.ts` (注册 IPC handlers)
- Create: `codelearn/electron/db.ts`

---

### Task 4: TypeScript 类型 + IPC 客户端封装

**文件:**
- Create: `codelearn/src/lib/ipc.ts`
- Create: `codelearn/src/types.ts`
- Create: `codelearn/src/global.d.ts`

---

### Task 5: Zustand Stores

**文件:**
- Create: `codelearn/src/stores/settings.ts`
- Create: `codelearn/src/stores/chat.ts`
- Create: `codelearn/src/stores/course.ts`

---

### Task 6: UI 框架 — 布局壳（Sidebar + TopBar + StatusBar）

**文件:**
- Create: `codelearn/src/components/Sidebar.tsx`
- Create: `codelearn/src/components/TopBar.tsx`
- Create: `codelearn/src/components/StatusBar.tsx`
- Create: `codelearn/src/components/Layout.tsx`
- Modify: `codelearn/src/App.tsx`
- Modify: `codelearn/src/styles/index.css` (追加布局样式)

---

### Task 7: 骨架页面（仪表盘 + 课程 + 进度 + 设置）

**文件:**
- Modify: `codelearn/src/pages/Dashboard.tsx`
- Modify: `codelearn/src/pages/Courses.tsx`
- Modify: `codelearn/src/pages/Progress.tsx`
- Modify: `codelearn/src/pages/Settings.tsx`
- Create: `codelearn/src/components/CourseCard.tsx`

---

### Task 8: Monaco Editor 集成 + 练习场页面

**文件:**
- Modify: `codelearn/src/pages/Playground.tsx`
- Create: `codelearn/src/components/Editor.tsx`
- Create: `codelearn/src/components/ExercisePanel.tsx`

---

### Task 9: AI 导师聊天页面

**文件:**
- Modify: `codelearn/src/pages/AITutor.tsx`
- Create: `codelearn/src/components/chat/ChatPanel.tsx`
- Create: `codelearn/src/components/chat/MessageList.tsx`
- Create: `codelearn/src/components/chat/ChatInput.tsx`

---

### Task 10: Claude API 对接（主进程）

**文件:**
- Modify: `codelearn/electron/ipc/ai.ts`
- Create: `codelearn/electron/llm.ts`

---

### Task 11: 最终集成 + 启动初始化

**文件:**
- Modify: `codelearn/src/App.tsx` (添加初始化逻辑)
- Create: `codelearn/src/hooks/useInit.ts`

---

## 实现顺序

```
Task 1 (脚手架) → Task 2 (Electron 主进程) → Task 3 (IPC + Storage)
       → Task 4 (类型 + IPC 封装) → Task 5 (Zustand Stores)
       → Task 6 (布局壳) → Task 7 (骨架页面)
       → Task 8 (Monaco + 练习场) → Task 9 (AI 聊天页)
       → Task 10 (Claude API) → Task 11 (最终集成)
```

## 验证清单

- [ ] `npm install` 无错误
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npx electron-vite dev` 窗口正常打开
- [ ] 五大页面可导航切换
- [ ] 暗色主题一致
- [ ] Monaco Editor 正常加载和编辑
- [ ] 设置页面可保存 API Key
- [ ] AI 导师对话流式输出（配置 Key 后）
- [ ] 练习场可 AI 生成题目和代码审查（配置 Key 后）
- [ ] 状态栏反映 AI 连接状态和当前语言
