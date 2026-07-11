export const chapter = {
  id: "chapter-1",
  book: "聪明的投资者",
  title: "第 1 章 · 投资与投机",
  intro: "关键不在于一次结果的好坏，而在于行为背后的过程、依据与风险态度。先学会分辨，才能在复杂的市场中保持清醒。",
  knowledgePoints: [
    {
      id: "investment-speculation",
      title: "投资与投机",
      requiredDimensions: ["definition", "basis", "income-source", "risk-attitude"],
      shortPrompt: "投资与投机最核心的区别是什么？",
      anchors: [
        { id: 1, label: "依据", investment: "独立研究与充分证据", speculation: "市场情绪与价格预期", keywords: ["依据", "分析", "证据"] },
        { id: 2, label: "收益来源", investment: "资产价值增长与合理回报", speculation: "短期价格波动", keywords: ["价值", "回报", "波动"] },
        { id: 3, label: "风险态度", investment: "重视本金安全并控制风险", speculation: "接受较高不确定性", keywords: ["安全", "风险", "不确定"] },
      ],
      paragraphs: [
        { anchor: 1, text: "两种行为的差别，核心在于依据、过程与态度。投资者在行动前会尽可能收集信息，评估价值，衡量风险，并只在具备安全边际时出手；投机者则更多依赖价格趋势、市场情绪或他人观点。" },
        { anchor: 2, text: "投资行为以充分分析为基础，寻求本金安全与合理回报；不满足这些条件的行为，更接近投机。收益来源的不同，也意味着两者面对价格波动时会采取不同的行动。" },
        { anchor: 3, text: "例如，两个人都在相同价格买入同一只股票。一个人研究企业的商业模式、财务状况与行业前景，并确认价格低于内在价值；另一个人因为热门消息而追入。即便之后两人都赚钱，也不能说明他们执行的是同一种行为。" },
      ],
    },
    {
      id: "margin-of-safety",
      title: "安全边际",
      requiredDimensions: ["safety-margin-role"],
      shortPrompt: "安全边际为什么能保护投资者？",
      anchors: [
        { id: 1, label: "不确定性", detail: "承认估值与未来判断可能出错", keywords: ["不确定", "错误", "估值"] },
        { id: 2, label: "缓冲", detail: "用价格与价值之间的差距吸收误差", keywords: ["价格", "价值", "缓冲"] },
        { id: 3, label: "纪律", detail: "没有足够余地时选择等待", keywords: ["等待", "纪律", "余地"] },
      ],
      paragraphs: [
        { anchor: 1, text: "任何分析都可能出错。企业会变化，行业会变化，投资者的判断也会受到信息不足和情绪影响。成熟的做法不是假设自己永远正确，而是把错误的可能性纳入决策。" },
        { anchor: 2, text: "安全边际来自价格与审慎估计价值之间的差距。这个差距不是额外收益的承诺，而是一层缓冲：当估计偏乐观、经营暂时恶化或市场继续下跌时，它帮助投资者降低永久损失的可能。" },
        { anchor: 3, text: "因此，安全边际也是一种行动纪律。如果价格没有留下足够余地，最合理的动作可能只是等待。等待并不等于无所作为，而是在不确定条件下保护选择权。" },
      ],
    },
  ],
};

export const reviewQuestions = [
  { id: "q1", pointId: "investment-speculation", question: "投资与投机的核心区别是什么？", dimensions: ["basis", "income-source", "risk-attitude"] },
  { id: "q2", pointId: "margin-of-safety", question: "安全边际解决的是什么问题？", dimensions: ["safety-margin-role"] },
  { id: "q3", pointId: "investment-speculation", question: "为什么盈利结果不能反推行为是投资？", dimensions: ["definition"] },
];

export const transferQuestion = "某只股票因热门消息连续上涨，一位买入者没有估值依据，只计划在更高价格卖出。你会如何判断这项行为？为什么？";

export const knowledgeDimensions = {
  definition: {
    label: "定义",
    pointId: "investment-speculation",
    anchor: 1,
    signals: [["过程", "行为", "方法"], ["结果", "盈利", "赚钱"]],
    requiredSignals: 2,
  },
  basis: {
    label: "依据",
    pointId: "investment-speculation",
    anchor: 1,
    signals: [["分析", "研究"], ["依据", "证据", "估值"]],
    requiredSignals: 2,
  },
  "income-source": {
    label: "收益来源",
    pointId: "investment-speculation",
    anchor: 2,
    signals: [["价值", "分红", "合理回报"], ["波动", "价差", "更高价格"]],
    requiredSignals: 2,
  },
  "risk-attitude": {
    label: "风险态度",
    pointId: "investment-speculation",
    anchor: 3,
    signals: [["风险", "不确定"], ["本金安全", "控制风险", "安全边际"]],
    requiredSignals: 2,
  },
  "safety-margin-role": {
    label: "安全边际作用",
    pointId: "margin-of-safety",
    anchor: 2,
    signals: [["错误", "估值偏差", "不确定"], ["缓冲", "余地", "差距"], ["损失", "本金", "保护"]],
    requiredSignals: 2,
  },
};

export const transferPrinciples = [
  { id: "process", label: "先判断过程，而非结果", pointId: "investment-speculation", anchor: 1, signals: [["过程", "行为"], ["结果", "上涨", "盈利"]], requiredSignals: 2 },
  { id: "evidence", label: "使用独立分析与估值依据", pointId: "investment-speculation", anchor: 1, signals: [["估值", "价值"], ["依据", "分析", "研究"]], requiredSignals: 2 },
  { id: "income", label: "识别收益来自价格波动", pointId: "investment-speculation", anchor: 2, signals: [["价格", "价差"], ["波动", "更高价格", "卖出"]], requiredSignals: 2 },
  { id: "risk", label: "说明风险与安全边际", pointId: "margin-of-safety", anchor: 2, signals: [["风险", "不确定"], ["安全边际", "缓冲", "本金"]], requiredSignals: 2 },
];
