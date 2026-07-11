# Chapter 02 质量报告

## 统计

- 原文 blocks：31（2 个标题、28 个段落、1 个 figure）。
- 归入知识点的 blocks：28 / 31（90.3%）。这个比例偏高，是本轮最值得警惕的指标。
- `assistance.needed=true`：raw 3 / 31（9.7%）；reviewed 2 / 31（6.5%）。
- contentType：data 10、causality 5、argument 4、transition 4、misconception 2、example 2、narrative 1、claim 1、comparison 1、summary 1。
- componentType（raw）：comparison 1、causal-chain 1、concept 1、none 28；reviewed 删除 concept。
- 没有原文引用的组件：0。
- 知识点覆盖：资产选择 002–015；利润关系 016–027；收益预期 028–029。
- 轻量回忆题：3；章节闭卷题：3；迁移题：1。
- 人工修改：1 项（删除复述型 concept 组件）。

## 人工评价

- 知识点边界总体可读，但第一个知识点覆盖 14 个 block，内部仍可能需要在模型阶段识别“历史证据”与“判断原则”的层级，而不是继续拆成更多知识点。
- raw 存在一次强行可视化：收益预期概念卡仅重复正文，已删除。
- 未发现组件加入原文没有的观点；“不存在稳定直线关系”必须避免被读成“完全无影响”。
- 重要概念基本覆盖，但表格与插图缺少可解析数据，figure 目前只能保留，不能生成数据图。
- 回忆题要求多个维度，优于单关键词判定；“利润关系”题仍可能过宽。
- 最不稳定阶段预计为 Step 3 知识点识别，其次是 Step 4 辅助介入：前者容易吞并过多原文，后者容易把总结重复做成卡片。

## 独立运行差异

fixture 连续运行两次，`chapter.json` SHA-256 一致，文本与结构差异为 0。由于当前环境缺少 `OPENAI_API_KEY` 与 `OPENAI_MODEL`，本轮没有两次真实模型运行，不能声称模型输出稳定。
