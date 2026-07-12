# Content Pipeline

单章内容生产与审核目录。通用执行器不包含章节标题、知识点、组件或题目的章节专属逻辑。

## 目录职责

```text
input/       章节 HTML
fixtures/    CI 使用的六阶段固定结果
rules/       六阶段规则
prompts/     六阶段任务 Prompt
schemas/     最终章节 JSON Schema
review/      人工审核、质量与修订记录
output/      前端真正消费的 raw / reviewed JSON
src/         分段、组装、校验和审核脚本
tests/       回归测试
generated/   临时阶段输出（忽略，不提交）
```

## 常用命令

```bash
pnpm install
pnpm generate:fixture -- --fixture chapter-02
pnpm validate
pnpm test
```

`fixture` 模式把六阶段结果写入 `generated/<chapter>/`，用于CI和调试；正式前端只读取 `output/chapter-01.json` 与 `output/chapter-02/chapter-02.reviewed.json`。

`model` 模式仍保留接口，但当前产品阶段不使用；缺少配置时会明确失败，不会回退为fixture。

## 核心约束

- 原文文本、DOM顺序和block id保持稳定。
- 所有知识点、组件、companion和回忆题引用必须存在。
- `needed=false` 时必须为 `componentType=none`。
- 每个知识点最多一个主要组件，回答维度 `minimumSignals >= 2`。
- 第二章人工定稿由 `src/apply-review.mjs` 从raw生成，修改记录位于 `review/chapter-02-revisions.json`。
