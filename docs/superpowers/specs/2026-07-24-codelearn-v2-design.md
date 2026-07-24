# CodeLearn V2 设计文档

**日期**: 2026-07-24
**状态**: 已确认
**基于**: 2026-07-24-codelearn-design.md（V1 框架） + 2026-07-24-codelearn-enhancement-design.md（多平台 AI）

---

## 核心变更

### 1. 多课程管理
- courseStore 从单课程改为多课程数组 `courses: Course[]` + `currentCourseId: string | null`
- 课程列表页展示所有已保存课程，按语言筛选
- 每个课程有唯一 ID（已有）、支持删除、支持扩写

### 2. 课程页重构
- 初始空列表，只有"AI 生成课程"按钮
- 点击后显示生成面板（内联，不跳转）：
  - 输入：语言（支持新语言输入）、学习方向、难度、章节数、题目数、额外要求
  - 流式生成：大纲 → 每章逐章生成（含选择题 + 至少1道编程题）
- 生成完成后自动加入课程列表

### 3. AI 导师合并进课程详情
- 新增 `/courses/:id` 课程详情页
- 左侧：课程大纲（章节列表 + 状态）
- 右侧：可切换"章节内容/聊天面板"两个 Tab
- 聊天面板：课程上下文感知，可问知识点和题目
- 独立 AI 导师页保留：限定 prompt 为语言探索（用途、历史、环境等简短回答）

### 4. 练习场课程感知
- 新增课程选择器 + 章节选择器（或"整个课程"）
- 题目类型切换：综合项目 / 章节练习
- 用户输入方向，AI 基于课程上下文生成题目

### 5. 数据结构扩展
- Exercise 新增 `type: 'mc' | 'coding'` 字段
- Chapter 新增 `quiz: ChoiceQuestion[]`（章末选择题）
- ChoiceQuestion: { question, options[4], correctIndex, explanation }

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 重写 | `src/stores/course.ts` | 多课程数组管理 |
| 重写 | `src/pages/Courses.tsx` | 课程列表 + 生成面板 |
| 新建 | `src/pages/CourseDetail.tsx` | 课程详情 + 内嵌聊天 |
| 新建 | `src/components/CourseGenerator.tsx` | AI 课程生成面板（流式） |
| 新建 | `src/components/MCQPanel.tsx` | 选择题展示组件 |
| 修改 | `src/pages/Playground.tsx` | 课程选择器 + 类型切换 |
| 修改 | `src/pages/AITutor.tsx` | 限定 prompt |
| 修改 | `src/components/chat/ChatPanel.tsx` | 支持外部传入课程上下文 |
| 修改 | `src/types.ts` | 新增 ChoiceQuestion, 扩展 Exercise |
| 修改 | `electron/ipc/ai.ts` | 新增 generateCourse handler |
| 修改 | `electron/preload.ts` | 暴露新 IPC |
| 修改 | `src/lib/ipc.ts` | 新 IPC 封装 |
| 修改 | `src/App.tsx` | 新增课程详情路由 |
| 修改 | `src/components/Sidebar.tsx` | 保留 AI 导师入口 |
