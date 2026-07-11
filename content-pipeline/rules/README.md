# 规则来源与拆分

以下项目文件作为只读设计输入，本目录不修改或复制其全文：

- `outputs/Book UI Design V0.1.docx`
- `outputs/Book Content Component Rules V0.1.md`
- `outputs/Reading Interaction States V0.1.md`
- `outputs/Memory Interaction Rules V0.1.md`

为避免单一超长 Prompt，规则按任务边界拆分：

| 文件 | 负责内容 |
|---|---|
| `01-segmentation.md` | HTML 清理、原文保留、稳定 block id |
| `02-content-types.md` | 单 block 内容类型 |
| `03-knowledge-points.md` | 跨 block 聚合与最低必要维度 |
| `04-assistance.md` | 是否介入、留白与主要组件选择 |
| `05-recall.md` | 知识点轻量主动回忆 |
| `06-review.md` | 章节闭卷、结构复盘和迁移题 |

每个阶段 Prompt 只读取对应规则和前一步产物；最终输出仍须通过 Schema 与人工审核。

