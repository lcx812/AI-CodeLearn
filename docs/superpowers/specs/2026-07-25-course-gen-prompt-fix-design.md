# 课程生成 LLM 格式严格化

**日期**: 2026-07-25
**状态**: approved

## 背景

课程生成调用链：`CourseGenerator.tsx` → `lib/ipc.ts` → `electron/preload.ts` → `electron/ipc/ai.ts`

当前有两个问题：

1. **大纲包含多余内容** — `buildOutlinePrompt` 要求输出课程概述、每章说明、学习路径建议。用户只需要章节标题列表。
2. **章节标题出现 "——"** — `buildChapterPrompt` 的 title 模板 `"第${chIndex}章标题（与大纲一致）"` 缺少冒号分隔符，LLM 按中文排版惯例自动补 "——"。

## 设计

### 文件范围

只修改 `electron/ipc/ai.ts`。其他文件不变。

### A. buildOutlinePrompt 重写

输出格式从 Markdown 大纲改为 N 行紧凑标题：

```
第1章：章节标题 —— 一句话说明
第2章：章节标题 —— 一句话说明
```

删除：课程概述、学习路径建议、每章 1-2 句说明段。
新增：显式格式规则，禁止 "——" 出现在标题中。

### B. buildChapterPrompt 重写

核心改动：

- title 模板：`"第${chIndex}章标题（与大纲一致）"` → `"第${chIndex}章：章节标题"`
- 新增"格式铁律"区块 — 开篇严厉定调
- 新增字段白名单：title/content/exercises/quiz 四个顶层字段，禁止 description 等额外字段
- 新增 exercise 字段约束：只允许 7 个字段
- 新增 quiz 字段约束：只允许 4 个字段，options 必须 4 项，correctIndex 为 0-3 整数
- 新增"输出前自检清单" — LLM 自检降低格式错误率

### C. normalizeChapter(raw, chIndex) 函数

纯函数，在 `parseJsonResponse` 之后、`JSON.stringify` 之前调用：

1. **白名单过滤** — 只保留 title/content/exercises/quiz 四个顶层字段
2. **标题修正** — 正则去除 `——`/`──`/`—`/`--` 等变体；不以"第"开头则自动补 `第N章：`
3. **exercise 规范化** — 每项只保留 type/title/description/starterCode/testCases/language/difficulty；type 默认 coding；testCases 默认 []
4. **quiz 规范化** — 每项只保留 question/options/correctIndex/explanation；options 补齐到 4 项；correctIndex 强制 number 并 clamp 0-3

### 调用点

`ai:generate-course` handler 内，原：
```typescript
const parsed = parseJsonResponse(chText)
```
改为：
```typescript
const parsed = parseJsonResponse(chText)
const normalized = normalizeChapter(parsed, i + 1)
```
后续 `JSON.stringify(normalized)` 通过 IPC 发送前端。

## 不变

- `parseJsonResponse` — 只从文本中提取 JSON，不做结构校验
- `CourseGenerator.tsx`、`src/lib/prompts.ts`、`src/types.ts` — 不动

## 验证

1. `npx tsc --noEmit` — 零错误
2. `npm run test` — 45 tests 通过
3. 手工验证：生成课程，确认：
   - 大纲只输出 `第x章：标题 —— 说明` 格式
   - JSON chapter 无 `description` 等额外字段
   - title 格式为 `第x章：标题`，无 "——"
