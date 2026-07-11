# Content Pipeline V0.1

离线、单章内容生产原型。输入真实 HTML，输出符合 `schemas/chapter.schema.json` 的结构化 JSON；不连接模型、数据库、账号或在线服务。

## 目录

```text
input/chapter-01.html       第一章示例输入
output/chapter-01.json      现有阅读原型消费的数据
rules/                      六类独立规则
prompts/                    六个分阶段 Prompt
schemas/chapter.schema.json JSON Schema
review/chapter-01-review.md 人工审核记录
run-pipeline.mjs            离线生成与校验入口
```

## 运行

```bash
cd content-pipeline
pnpm install
pnpm generate
```

默认优先从本地 `input/source-page.html` 提取 `section#chapter-9`；该文件不存在时使用已提交的 `input/chapter-01.html`，保证 CI 可复现。也可传入相同页面结构的源文件与输出路径：

```bash
node run-pipeline.mjs input/source-page.html output/chapter-01.json
```

当前示例的分类、知识点和组件选择由这次人工/AI 审核后固化在离线脚本中。未来接入模型时，应逐阶段执行 `prompts/`，每一步只产出对应中间结果，并在最终写入前通过 Schema 与人工审核。

## 约束

- Step 1 验证 `decode(sourceHtml) === text`，防止原文被改写。
- 稳定 block id 与 DOM 顺序绑定。
- `needed = false` 强制搭配 `componentType = none` 和 `componentData = null`。
- 每个知识点最多一个轻量回忆题、一个主要组件。
- 章节闭卷题限制为 2～3 个；所有回答维度的 `minimumSignals >= 2`。
- Ajv 2020 在每次生成时校验完整输出。
