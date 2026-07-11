import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = process.argv[2] || path.join(root, "input/source-page.html");
const outputPath = process.argv[3] || path.join(root, "output/chapter-01.json");
const source = fs.readFileSync(sourcePath, "utf8");

const sectionMatch = source.match(/<section id="chapter-9">([\s\S]*?)<\/section>/i);
if (!sectionMatch) throw new Error("未找到第一章 section#chapter-9");
const sectionHtml = sectionMatch[0];
const title = sectionHtml.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
const paragraphHtml = [...sectionHtml.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((match) => `<p>${match[1].trim()}</p>`);

const decode = (value) => value
  .replace(/<br\s*\/?>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const types = [
  "transition", "definition", "definition", "example", "misconception", "example",
  "argument", "comparison", "claim", "claim", "method", "method", "transition",
  "method", "data", "argument", "argument", "claim", "data", "method", "data",
  "comparison", "claim", "causality",
];

const pointForOrder = (order) => {
  if (order >= 2 && order <= 9) return "kp-investment-vs-speculation";
  if (order >= 10 && order <= 12) return "kp-speculation-discipline";
  if (order >= 13 && order <= 24) return "kp-defensive-expected-return";
  return null;
};

const id = (order) => `chapter-01-block-${String(order).padStart(3, "0")}`;
const refs = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => id(start + index));

const componentByPoint = {
  "kp-investment-vs-speculation": {
    ownerOrder: 3,
    type: "comparison",
    reason: "定义分散在历史语境和反例中；对照结构能显化分析基础、本金安全和适当回报三项边界。",
    data: {
      title: "投资与投机的判断边界",
      sourceBlockIds: refs(2, 9),
      items: [
        { label: "分析基础", investment: "以深入分析为基础", speculation: "不满足深入分析要求", blockIds: [id(3)] },
        { label: "本金安全", investment: "要求确保本金安全", speculation: "风险可能超出承受范围", blockIds: [id(3), id(9)] },
        { label: "回报预期", investment: "获得适当回报", speculation: "可能依赖价格变化与高盈利机会", blockIds: [id(3), id(9)] }
      ]
    }
  },
  "kp-speculation-discipline": {
    ownerOrder: 11,
    type: "checklist",
    reason: "原文明确列出三种不明智投机，并给出账户与资金纪律，适合转为可回忆的检查清单。",
    data: {
      title: "投机前的纪律检查",
      sourceBlockIds: refs(10, 12),
      items: [
        { text: "是否把投机误认为投资？", blockIds: [id(11)] },
        { text: "是否缺乏足够知识和技能？", blockIds: [id(11)] },
        { text: "投入是否超过承担亏损的能力？", blockIds: [id(11), id(12)] },
        { text: "是否与投资账户分开？", blockIds: [id(12)] }
      ]
    }
  },
  "kp-defensive-expected-return": {
    ownerOrder: 22,
    type: "comparison",
    reason: "债券与股票的收益、可靠性及不确定因素跨多个数据段落，纵向比较能减少来回查找。",
    data: {
      title: "防御型投资者：债券与股票",
      sourceBlockIds: refs(13, 24),
      items: [
        { label: "历史配置", bonds: "25%～75%", stocks: "与债券比例相适应", blockIds: [id(14)] },
        { label: "1971年前后收益", bonds: "优质中期公司债券约8%", stocks: "股息与增值合计约7.5%", blockIds: [id(19), id(21)] },
        { label: "可靠性", bonds: "利息和本金偿付更可靠", stocks: "仍受利润、估值和投机浪潮影响", blockIds: [id(22), id(24)] }
      ]
    }
  }
};

const blocks = paragraphHtml.map((sourceHtml, index) => {
  const order = index + 1;
  const knowledgePointId = pointForOrder(order);
  const component = knowledgePointId ? componentByPoint[knowledgePointId] : null;
  const ownsComponent = component?.ownerOrder === order;
  return {
    id: id(order),
    order,
    text: decode(sourceHtml),
    sourceHtml,
    contentType: types[index],
    knowledgePointId,
    assistance: ownsComponent ? {
      needed: true,
      reason: component.reason,
      componentType: component.type,
      componentData: component.data,
    } : {
      needed: false,
      reason: knowledgePointId ? "该段由所属知识点的单一主要组件覆盖，正文保持连续阅读。" : "原文承担章节过渡，排版本身已经足够，应保持留白。",
      componentType: "none",
      componentData: null,
    }
  };
});

const dimensions = {
  definition: { id: "definition", label: "投资定义", description: "说明投资以深入分析、本金安全和适当回报为必要条件。", blockIds: [id(3)], signals: [["深入分析", "分析"], ["本金安全", "安全"], ["适当回报", "回报"]], minimumSignals: 2 },
  terminology: { id: "terminology", label: "术语边界", description: "说明交易者身份或盈利结果不能自动把行为变成投资。", blockIds: refs(5, 9), signals: [["称呼", "投资者", "交易者"], ["目的", "价格", "保证金"], ["结果", "盈利", "风险"]], minimumSignals: 2 },
  speculationRisk: { id: "speculation-risk", label: "投机风险", description: "识别不明智投机的三种情形与资金承受边界。", blockIds: refs(10, 12), signals: [["误以为投资", "实则投机"], ["知识", "技能"], ["亏损能力", "资金过多", "少量资金"], ["分开账户", "单开账户"]], minimumSignals: 2 },
  allocation: { id: "allocation", label: "资产配置", description: "解释防御型投资者在债券和股票之间配置的原则。", blockIds: refs(13, 14), signals: [["债券", "高等级债券"], ["股票", "蓝筹股"], ["25%", "75%", "一半"]], minimumSignals: 2 },
  expectedReturn: { id: "expected-return", label: "预期收益", description: "比较债券与股票预期收益及其可靠性，保留不确定性。", blockIds: refs(15, 24), signals: [["收益率", "股息", "利息"], ["可靠性", "本金偿付"], ["通货膨胀", "企业利润", "投机浪潮"], ["不能确定", "无法预测"]], minimumSignals: 3 }
};

const knowledgePoints = [
  { id: "kp-investment-vs-speculation", title: "投资与投机的定义边界", summary: "投资必须同时满足深入分析、本金安全和适当回报；市场称呼或结果不能替代这一判断。", blockIds: refs(2, 9), primaryComponent: "comparison", requiredDimensions: [dimensions.definition, dimensions.terminology] },
  { id: "kp-speculation-discipline", title: "投机的风险与纪律", summary: "投机并非天然违法，但必须被识别、限制资金并与投资操作分开。", blockIds: refs(10, 12), primaryComponent: "checklist", requiredDimensions: [dimensions.speculationRisk] },
  { id: "kp-defensive-expected-return", title: "防御型投资者的预期收益", summary: "配置决策要比较债券与股票的收益和可靠性，同时承认通胀、利润与市场投机带来的不确定性。", blockIds: refs(13, 24), primaryComponent: "comparison", requiredDimensions: [dimensions.allocation, dimensions.expectedReturn] }
];

const recallQuestions = [
  { id: "recall-kp-1", knowledgePointId: "kp-investment-vs-speculation", question: "一项操作要满足哪些条件才属于投资？为什么盈利结果本身不够？", blockIds: refs(2, 9), requiredDimensionIds: ["definition", "terminology"] },
  { id: "recall-kp-2", knowledgePointId: "kp-speculation-discipline", question: "怎样判断投机已经超出明智和可承受的范围？", blockIds: refs(10, 12), requiredDimensionIds: ["speculation-risk"] },
  { id: "recall-kp-3", knowledgePointId: "kp-defensive-expected-return", question: "防御型投资者比较债券与股票时，不能只看哪一个数字？还要考虑什么？", blockIds: refs(13, 24), requiredDimensionIds: ["allocation", "expected-return"] }
];

const chapter = {
  id: "chapter-01",
  title,
  intro: blocks[0].text,
  blocks,
  knowledgePoints,
  recallQuestions,
  review: {
    closedBookQuestions: [recallQuestions[0], recallQuestions[1], recallQuestions[2]],
    structureSummary: [
      { text: "先用分析、本金安全和适当回报区分投资与投机。", blockIds: refs(2, 9) },
      { text: "承认投机成分，但限制资金、能力错配和账户混同。", blockIds: refs(10, 12) },
      { text: "再根据收益、可靠性和不确定因素安排防御型资产配置。", blockIds: refs(13, 24) }
    ],
    transferQuestion: {
      question: "一位投资者因热门消息使用保证金买入股票，并认为只要最终盈利就属于投资。请用本章原则判断这项行为，并说明应如何限制风险。",
      principles: [dimensions.definition, dimensions.terminology, dimensions.speculationRisk],
      blockIds: refs(2, 12)
    }
  }
};

function validate(value) {
  const blockIds = new Set(value.blocks.map((block) => block.id));
  if (value.blocks.length !== paragraphHtml.length) throw new Error("block 数量与原文段落不一致");
  value.blocks.forEach((block, index) => {
    if (block.order !== index + 1 || block.id !== id(index + 1)) throw new Error(`block 顺序不稳定: ${block.id}`);
    if (decode(block.sourceHtml) !== block.text) throw new Error(`原文被修改: ${block.id}`);
    if (!block.assistance.needed && (block.assistance.componentType !== "none" || block.assistance.componentData !== null)) throw new Error(`留白约束失败: ${block.id}`);
  });
  value.knowledgePoints.forEach((point) => {
    point.blockIds.forEach((blockId) => { if (!blockIds.has(blockId)) throw new Error(`知识点引用不存在: ${blockId}`); });
    if (point.requiredDimensions.some((dimension) => dimension.minimumSignals < 2)) throw new Error(`维度判定过弱: ${point.id}`);
    if (value.recallQuestions.filter((question) => question.knowledgePointId === point.id).length > 1) throw new Error(`知识点回忆题超过 1 个: ${point.id}`);
  });
  if (value.review.closedBookQuestions.length < 2 || value.review.closedBookQuestions.length > 3) throw new Error("章节闭卷题必须为 2～3 个");
}

validate(chapter);
const schema = JSON.parse(fs.readFileSync(path.join(root, "schemas/chapter.schema.json"), "utf8"));
const schemaResult = { chapter };
const schemaValidator = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
if (!schemaValidator(schemaResult)) throw new Error(`Schema 校验失败:\n${JSON.stringify(schemaValidator.errors, null, 2)}`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(schemaResult, null, 2)}\n`);

const standaloneHtml = `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title></head><body><main>${sectionHtml}</main></body></html>\n`;
fs.writeFileSync(path.join(root, "input/chapter-01.html"), standaloneHtml);
console.log(`generated ${outputPath} (${blocks.length} blocks, ${knowledgePoints.length} knowledge points)`);
