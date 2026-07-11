# Chapter 02 人工审核记录

审核对象：`output/chapter-02/chapter-02.raw.json`。该 raw 是已提交 fixture 的初始输出，不是模型输出。

## 知识点审核

### 通胀不能直接决定股票与债券的优劣

- 原文：block 002–015；类型以 argument、data、comparison 为主。
- 辅助：需要；comparison；用于保留“债券受损”与“股票并非无条件更优”两层判断。
- 可能误读：把历史上股票长期回报较高改写成未来保证。
- 人工修改：否。

### 通胀与公司利润不存在稳定直线关系

- 原文：block 016–027；类型以 causality、data、argument 为主。
- 辅助：需要；causal-chain；用于呈现成本、资本需求、债务与每股收益之间的中间环节。
- 可能误读：把“没有直接关系”夸张为“通胀永远不会影响利润”。
- 人工修改：否。

### 在不确定性下约束收益预期

- 原文：block 028–029；类型为 summary、misconception。
- 初始辅助：concept。
- 人工修改：是（R-01）。原文已经直接，删除重复概念卡，改为留白；知识点与回忆题保留。

所有修改均由 `review/chapter-02-revisions.json` 记录，并由脚本从 raw 生成 reviewed；未直接编辑最终 JSON。
