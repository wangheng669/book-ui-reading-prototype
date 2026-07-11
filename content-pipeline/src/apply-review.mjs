import fs from "node:fs";
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("用法: node src/apply-review.mjs <raw.json> <reviewed.json>");
const value = JSON.parse(fs.readFileSync(input, "utf8"));
const chapter = value.chapter;
const bid = (n) => `chapter-02-block-${String(n).padStart(3, "0")}`;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => bid(a + i));
const dimension = (id, label, description, blockIds, signals, minimumSignals = 2) => ({ id, label, description, blockIds, signals, minimumSignals });

const choice = dimension("asset-choice", "推论边界", "通胀侵蚀债券购买力，并不能推出股票在任何价格和条件下都更优。", range(3, 4), [["通胀", "购买力"], ["股票", "债券"], ["价格", "条件", "绝对"]]);
const realReturn = dimension("real-return", "实际收益", "区分名义利息、购买力损失和资本价值，而不是只看票面收入。", range(11, 12), [["名义", "利息"], ["购买力", "生活费用"], ["本金", "资本价值"]]);
const horizon = dimension("time-horizon", "时间尺度", "股票与债券的比较必须同时考虑长期结果、近期价格与不确定性。", range(13, 15), [["长期", "25年"], ["短期", "近期"], ["不确定", "不能保证"]]);
const profits = dimension("profit-link", "利润传导", "通胀影响企业时还要经过成本、资本需求和债务，不能直接等同于每股收益增长。", range(22, 26), [["成本", "工资"], ["资本", "新增资本"], ["债务", "融资"], ["每股收益", "利润率"]], 3);
const expectations = dimension("return-expectation", "收益预期", "用估值与可支持的长期回报约束预期，避免把通胀叙事变成追涨理由。", range(28, 29), [["8%", "总体回报"], ["股价", "估值"], ["牛市", "上涨"], ["风险", "下跌"]], 3);

chapter.knowledgePoints = [
  { id: "kp-asset-choice-boundary", title: "通胀不能直接决定股票与债券的优劣", summary: choice.description, blockIds: range(3, 4), primaryComponent: "comparison", requiredDimensions: [choice] },
  { id: "kp-real-return-and-horizon", title: "用实际收益与时间尺度比较资产", summary: "评价通胀下的资产选择，需要把购买力损失、资本价值、长期结果和近期价格放在一起。", blockIds: range(11, 15), primaryComponent: "comparison", requiredDimensions: [realReturn, horizon] },
  { id: "kp-inflation-profit-transmission", title: "通胀不会自动转化为更高的每股收益", summary: profits.description, blockIds: range(22, 26), primaryComponent: "causal-chain", requiredDimensions: [profits] },
  { id: "kp-return-expectation-discipline", title: "用证据约束收益预期", summary: expectations.description, blockIds: range(28, 29), primaryComponent: "none", requiredDimensions: [expectations] }
];

const owner = {
  [bid(4)]: { needed: true, reason: "原文先呈现常见推论再否定绝对结论，对照组件能保留推论边界。", componentType: "comparison", componentData: { title: "从通胀事实到资产选择", sourceBlockIds: range(3, 4), items: [{ label: "可以成立", text: "通胀会侵蚀固定收入的实际购买力。", blockIds: [bid(3)] }, { label: "不能直接推出", text: "股票在任何价格与条件下都优于债券。", blockIds: [bid(3), bid(4)] }] } },
  [bid(15)]: { needed: true, reason: "比较结论同时受实际收益、长期结果和近期价格影响，轻量对照能减少单一指标误判。", componentType: "comparison", componentData: { title: "资产比较的两个时间尺度", sourceBlockIds: range(11, 15), items: [{ label: "长期", text: "考察未来较长时期的实际回报与购买力。", blockIds: [bid(11), bid(12), bid(15)] }, { label: "近期", text: "考察当前价格、收益率以及随后几年可能发生的变化。", blockIds: [bid(13), bid(15)] }] } },
  [bid(23)]: { needed: true, reason: "利润传导跨越多个中间变量；因果链比重复摘要更能显示原文论证结构。", componentType: "causal-chain", componentData: { title: "通胀到每股收益之间的约束", sourceBlockIds: range(22, 26), steps: [{ text: "价格与工资、经营成本同时变化", blockIds: [bid(22), bid(24)] }, { text: "维持业务需要更多新增资本", blockIds: [bid(23), bid(25)] }, { text: "债务及融资负担上升", blockIds: [bid(26)] }, { text: "因此不能假定每股收益自动提高", blockIds: [bid(22), bid(23), bid(26)] }] } }
};
const pointByBlock = new Map(chapter.knowledgePoints.flatMap((point) => point.blockIds.map((id) => [id, point.id])));
chapter.blocks = chapter.blocks.map((block) => ({ ...block, knowledgePointId: pointByBlock.get(block.id) || null, assistance: owner[block.id] || { needed: false, reason: pointByBlock.has(block.id) ? "该段由所属知识点的单一主要组件覆盖，正文保持连续。" : "原文排版和上下文本身足够，应保持安静阅读。", componentType: "none", componentData: null } }));

chapter.recallQuestions = [
  { id: "recall-asset-choice", knowledgePointId: chapter.knowledgePoints[0].id, question: "为什么通胀会削弱债券吸引力，却仍不足以证明股票始终更好？", blockIds: range(3, 4), requiredDimensionIds: [choice.id] },
  { id: "recall-real-return", knowledgePointId: chapter.knowledgePoints[1].id, question: "比较通胀环境下的股票和债券时，为什么要同时看实际收益与时间尺度？", blockIds: range(11, 15), requiredDimensionIds: [realReturn.id, horizon.id] },
  { id: "recall-profit-transmission", knowledgePointId: chapter.knowledgePoints[2].id, question: "通胀为什么不会自动变成更高的每股收益？请说出中间约束。", blockIds: range(22, 26), requiredDimensionIds: [profits.id] },
  { id: "recall-expectation", knowledgePointId: chapter.knowledgePoints[3].id, question: "通胀叙事和上涨行情为什么可能让投资者高估未来回报？", blockIds: range(28, 29), requiredDimensionIds: [expectations.id] }
];
chapter.review = {
  closedBookQuestions: [chapter.recallQuestions[0], chapter.recallQuestions[1], chapter.recallQuestions[2]],
  structureSummary: [
    { text: "先把‘通胀侵蚀购买力’与‘股票必然更优’分开。", blockIds: range(3, 4) },
    { text: "再以实际收益和长短期尺度比较资产，而不是只看名义数字。", blockIds: range(11, 15) },
    { text: "最后检查通胀经由成本、资本和债务影响每股收益的传导链，并约束回报预期。", blockIds: [...range(22, 26), ...range(28, 29)] }
  ],
  transferQuestion: { question: "一位投资者因为预期通胀升高，准备在股票估值已经很高时卖掉全部债券并满仓股票。你会要求他补充检查哪些条件？", principles: [choice, realReturn, horizon, profits, expectations], blockIds: [...range(3, 4), ...range(11, 15), ...range(22, 26), ...range(28, 29)] }
};
fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
