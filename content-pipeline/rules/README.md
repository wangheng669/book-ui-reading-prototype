# 分阶段规则

只读产品规则位于 `docs/product/`。流水线按六个阶段加载对应文件：

| 文件 | 职责 |
|---|---|
| `01-segmentation.md` | HTML 清理、原文保留、稳定 block id |
| `02-content-types.md` | 内容类型判断 |
| `03-knowledge-points.md` | 高价值知识点与必要维度 |
| `04-assistance.md` | 介入、留白与组件选择 |
| `05-components.md` | 组件数据与原文引用 |
| `06-memory.md` | 主动回忆、闭卷复盘与迁移题 |

每个阶段只读取对应规则、Prompt和前序结果；最终章节必须通过 Schema 与人工审核。
