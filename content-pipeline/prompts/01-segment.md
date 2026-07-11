# Step 1 · HTML 清理与语义分段

读取 `rules/01-segmentation.md`。输入是一章 HTML。

任务：删除非正文节点，按 DOM 语义边界输出有序 blocks。保留每段原文和 `sourceHtml`，生成稳定 block id。不要总结、分类、识别知识点或生成组件。

输出：`{ chapterMeta, blocks: [{ id, order, text, sourceHtml }] }`。

