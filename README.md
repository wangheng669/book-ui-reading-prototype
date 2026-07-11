# Book UI Reading Prototype

一个用于验证“把书转换成适合理解与记忆的网站”的桌面端交互原型。

公开原型：<https://wangheng669.github.io/book-ui-reading-prototype/>

第 2 章完整样本：<https://wangheng669.github.io/book-ui-reading-prototype/?chapter=2>

当前范围覆盖《聪明的投资者》第一章原型，以及完整制作并人工审核的第 2 章样本。第 2 章读取 reviewed JSON，不在 React 组件中写死正文。

- 第 1 章：投资与投机、安全边际
- 第 2 章：通胀下的资产选择、实际收益与时间尺度、利润传导、收益预期纪律

## 已实现

- 连续滚动与安静阅读状态
- 知识点进入、离开与辅助内容显隐
- 纵向关系组件与数字原文锚点
- 知识点后的轻量主动回忆
- `已提及 / 可补充`差异反馈
- 用户主动展开完整原文对照
- 两阶段章节复盘：先闭卷回忆，后结构梳理与迁移题
- `仅接触 / 能够解释 / 能够回忆`能力状态

全部内容和判断规则均为本地静态数据，不接入模型、数据库或账号系统。

## 本地运行

```bash
cd prototype
pnpm install
pnpm dev
```

## 项目结构

```text
outputs/        产品规则文档与视觉稿
prototype/      React + Vite 交互原型
```

更详细的状态流、数据结构和未实现范围见 [`prototype/README.md`](prototype/README.md)。

内容生产原型见 [`content-pipeline/README.md`](content-pipeline/README.md)：真实单章 HTML → 分阶段规则/Prompt → Schema JSON → 人工审核 → 阅读原型。
