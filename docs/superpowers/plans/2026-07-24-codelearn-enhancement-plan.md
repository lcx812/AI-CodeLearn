# CodeLearn 功能增强实现计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 来按任务实现。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 在现有框架上增强三个模块：多平台 AI API 接入、代码答疑优化、对话式课程生成。

**架构:** 模块 A（API 多平台）是基础设施，模块 B/C 依赖它。A → B, A → C。

**技术栈:** 同现有项目 (Electron 28+, React 18, TypeScript 5, Zustand, Tailwind, Monaco, better-sqlite3)。新增：`openai` npm 包（OpenAI 兼容协议统一调用）

## 全局约束

- 所有命令使用 Git Bash（bash 语法，正斜杠路径）
- 严格 TDD：先写测试 → 确认测试失败 → 写实现 → 确认测试通过 → 重构
- 防御式编码：检查边界条件、空值、异常路径
- 简洁优先：代码短，变量名短，函数名短
- UI 文本默认中文
- AI 语言风格：平实易懂，专业不生僻
- Git 提交前确认

---

### Task A1: 多 Provider 工厂 + 预设模板

**文件:**
- Rewrite: `codelearn/electron/llm.ts`
- Create: `codelearn/electron/providers.ts`
- Create: `codelearn/tests/electron/providers.test.ts`

---

### Task A2: 重写 AI IPC Handler 支持多 Provider

**文件:**
- Rewrite: `codelearn/electron/ipc/ai.ts`
- Create: `codelearn/electron/settings-store.ts`
- Modify: `codelearn/electron/preload.ts` (新增 settings IPC)

---

### Task A3: 设置页面 — 多平台配置 UI

**文件:**
- Modify: `codelearn/src/stores/settings.ts`
- Rewrite: `codelearn/src/pages/Settings.tsx`
- Modify: `codelearn/src/lib/ipc.ts`
- Modify: `codelearn/src/global.d.ts`

---

### Task A4: 更新 useInit hook

**文件:**
- Modify: `codelearn/src/hooks/useInit.ts`
- Modify: `codelearn/src/components/StatusBar.tsx`

---

### Task B1: 文件读取 IPC + Playground 上传

**文件:**
- Create: `codelearn/electron/ipc/fs.ts`
- Modify: `codelearn/electron/main.ts`
- Modify: `codelearn/electron/preload.ts`
- Modify: `codelearn/src/pages/Playground.tsx`

---

### Task B2: Playground UI 重构（两行布局）

**文件:**
- Rewrite: `codelearn/src/pages/Playground.tsx`
- Modify: `codelearn/src/components/ExercisePanel.tsx`

---

### Task B3: 增强审查 Prompt

**文件:**
- Modify: `codelearn/electron/ipc/ai.ts` (review-code handler)

---

### Task C1: 课程/章节数据类型 + 数据库

**文件:**
- Modify: `codelearn/src/types.ts`
- Modify: `codelearn/electron/db.ts`

---

### Task C2: Course Store 增强

**文件:**
- Rewrite: `codelearn/src/stores/course.ts`

---

### Task C3: CourseDrawer 组件

**文件:**
- Create: `codelearn/src/components/chat/CourseDrawer.tsx`

---

### Task C4: ChatPanel 集成课程上下文

**文件:**
- Modify: `codelearn/src/components/chat/ChatPanel.tsx`
- Modify: `codelearn/src/components/chat/ChatInput.tsx`

---

### Task C5: 对话驱动课程生成流程

**文件:**
- Modify: `codelearn/src/stores/chat.ts`
- Modify: `codelearn/src/components/chat/ChatPanel.tsx`

---

### Task C6: 最终集成验证

**文件:**
- 无新建，全线验证

---

## 实现顺序

```
A1 (providers) → A2 (IPC rewrite) → A3 (settings UI) → A4 (init)
                                          ↓
B1 (file upload) → B2 (playground UI) → B3 (review prompt)
                                          ↓
C1 (types+db) → C2 (course store) → C3 (CourseDrawer) → C4 (ChatPanel) → C5 (course gen) → C6 (verification)
```

模块 A 是最优先的基础设施。A 完成后 B 和 C 可并行推进。
