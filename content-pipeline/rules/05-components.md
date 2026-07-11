# 组件数据规则

- 只为上一阶段 `needed=true` 的知识点生成数据。
- 每个知识点最多一个主要组件；所有陈述必须引用存在的 block id。
- 组件只表达原文已经支持的关系，不补写结论。
- 输出 `{ components: [{ blockId, knowledgePointId, componentType, componentData }] }`。
