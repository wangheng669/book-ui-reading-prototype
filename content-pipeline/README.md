# Content Pipeline V0.2

单章、六阶段内容生产原型。通用执行器不包含章节标题、selector、分类、知识点、组件或题目。

## 两种运行模式

```bash
pnpm generate:fixture -- --fixture chapter-02
OPENAI_API_KEY=... OPENAI_MODEL=... pnpm generate:model -- --input input/chapter-02.html --chapter-id chapter-02
```

- `fixture` 读取 `fixtures/<chapter>/` 已提交的六阶段结果，供 CI、测试和前端演示使用，不访问模型。
- `model` 依次调用六个阶段；每阶段只加载同编号规则和 Prompt，并保存独立结果。没有 API key 或 model 时明确失败，绝不静默回退。
- 可用 `--selector "main article"` 限定正文；selector 不存在会明确报错。未指定时优先 `main`，否则使用 `body`。

输出位于 `output/<chapter>/`，包含 `01-segments.json` 至 `06-memory.json`、`chapter.json`、raw 结果和运行元数据。第二章人工修订通过 `src/apply-review.mjs` 从 raw 生成 reviewed，变更记录在 `review/chapter-02-revisions.json`。

## 测试

```bash
pnpm generate:fixture
pnpm test
```

测试覆盖原文不改写、DOM 顺序、稳定 ID、引用存在性、知识点引用、留白约束、单一主要组件、回忆题归属、`minimumSignals >= 2` 与最终 Schema。
