# Book UI Reading Prototype

把真实书籍章节转换为“正文阅读 + 段落级理解画布 + 主动回忆”的桌面端原型。

- [公开原型](https://wangheng669.github.io/book-ui-reading-prototype/)
- [第 2 章完整样本](https://wangheng669.github.io/book-ui-reading-prototype/?chapter=2)

## 当前范围

- 第 1 章：保留原有静态原型作为兼容样本。
- 第 2 章：完整原文、31个段落 companion、4个知识点、3个深度互动、轻量回忆与两阶段章节复盘。
- 全部内容使用本地 JSON；不接模型、数据库、账号或后台。

## 目录

```text
docs/product/       产品与交互规则
content-pipeline/   单章 HTML、Schema、fixture、审核与最终 JSON
prototype/          React + Vite 阅读原型
```

## 本地运行

```bash
pnpm --dir prototype install
pnpm --dir prototype dev
```

内容流水线说明见 [`content-pipeline/README.md`](content-pipeline/README.md)，原型说明见 [`prototype/README.md`](prototype/README.md)。
