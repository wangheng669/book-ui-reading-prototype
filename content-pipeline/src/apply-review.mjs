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
const interaction = (mode, cta, prompt, options, analysis, blockIds, extra = {}) => ({ mode, cta, prompt, options, analysis, blockIds, ...extra });

chapter.knowledgePoints = [
  { id: "kp-asset-choice-boundary", title: "通胀不能直接决定股票与债券的优劣", summary: choice.description, blockIds: range(3, 4), primaryComponent: "comparison", requiredDimensions: [choice] },
  { id: "kp-real-return-and-horizon", title: "用实际收益与时间尺度比较资产", summary: "评价通胀下的资产选择，需要把购买力损失、资本价值、长期结果和近期价格放在一起。", blockIds: range(11, 15), primaryComponent: "comparison", requiredDimensions: [realReturn, horizon] },
  { id: "kp-inflation-profit-transmission", title: "通胀不会自动转化为更高的每股收益", summary: profits.description, blockIds: range(22, 26), primaryComponent: "causal-chain", requiredDimensions: [profits] },
  { id: "kp-return-expectation-discipline", title: "用证据约束收益预期", summary: expectations.description, blockIds: range(28, 29), primaryComponent: "none", requiredDimensions: [expectations] }
];

const owner = {
  [bid(4)]: { needed: true, reason: "原文先呈现常见推论再否定绝对结论，对照组件能保留推论边界。", componentType: "comparison", componentData: { title: "从通胀事实到资产选择", sourceBlockIds: range(3, 4), items: [{ label: "可以成立", text: "通胀会侵蚀固定收入的实际购买力。", blockIds: [bid(3)] }, { label: "不能直接推出", text: "股票在任何价格与条件下都优于债券。", blockIds: [bid(3), bid(4)] }], interaction: interaction("inference", "判断这两段能推出什么", "仅根据刚读过的两段，哪项判断可以直接成立？", [{ id: "purchasing-power", text: "通胀会侵蚀固定收益的购买力", perspective: "这是原文明确支持的事实。" }, { id: "stocks-always-win", text: "因此股票在任何价格下都优于债券", perspective: "这跨过了估值、收益率和具体条件，是原文明确反对的绝对化推论。" }], "关键不在于选出永远更好的资产，而在于区分事实和由事实延伸出的过度结论。", range(3, 4)) } },
  [bid(15)]: { needed: true, reason: "比较结论同时受实际收益、长期结果和近期价格影响，轻量对照能减少单一指标误判。", componentType: "comparison", componentData: { title: "资产比较的两个时间尺度", sourceBlockIds: range(11, 15), items: [{ label: "长期", text: "考察未来较长时期的实际回报与购买力。", blockIds: [bid(11), bid(12), bid(15)] }, { label: "近期", text: "考察当前价格、收益率以及随后几年可能发生的变化。", blockIds: [bid(13), bid(15)] }], interaction: interaction("perspective", "切换长期与近期视角", "同一项资产，在不同时间尺度下要观察什么？", [{ id: "future-guarantee", text: "未来股票仍会稳定取得同样收益", perspective: "历史结果不能自动成为未来保证，原文强调未来表现高度不确定。" }, { id: "comparison-input", text: "它是比较资产的证据之一，但还要结合当前收益率和时间尺度", perspective: "这保留了历史证据，同时没有忽略当前债券收益率、长期结果和近期体验。" }], "同一个历史数字，在‘描述过去’和‘保证未来’之间存在重要边界。", range(13, 15), { horizon: { min: 1, max: 25, default: 5, breakpoint: 5 }, calculator: { nominalMin: 3, nominalMax: 10, nominalDefault: 6, inflationMin: 0, inflationMax: 8, inflationDefault: 3, note: "简化示意：用名义收益减去通胀率观察购买力变化，不代表完整投资回报计算。" } }) } },
  [bid(23)]: { needed: true, reason: "利润传导跨越多个中间变量；因果链比重复摘要更能显示原文论证结构。", componentType: "causal-chain", componentData: { title: "通胀到每股收益之间的约束", sourceBlockIds: range(22, 26), steps: [{ text: "价格与工资、经营成本同时变化", blockIds: [bid(22), bid(24)] }, { text: "维持业务需要更多新增资本", blockIds: [bid(23), bid(25)] }, { text: "债务及融资负担上升", blockIds: [bid(26)] }, { text: "因此不能假定每股收益自动提高", blockIds: [bid(22), bid(23), bid(26)] }], interaction: interaction("causal", "预测利润传导的下一步", "如果总体物价上涨3%，公司每股收益是否也会自动上涨约3%？", [{ id: "automatic", text: "会，产品售价上涨会直接进入每股收益", perspective: "这忽略了工资、经营成本、新增资本和债务等中间约束。" }, { id: "transmission", text: "不一定，需要检查利润传导中的成本、资本和债务", perspective: "这与原文的历史观察一致：价格上涨没有自动维持原有资本利润率。" }], "理解这一段的重点不是记住一个结论，而是看到通胀影响利润之前必须经过一条不稳定的传导链。", range(22, 26)) } }
};
const pointByBlock = new Map(chapter.knowledgePoints.flatMap((point) => point.blockIds.map((id) => [id, point.id])));
const companion = (visualType, eyebrow, title, nodes, takeaway, orders) => ({ visualType, eyebrow, title, nodes: nodes.map(([label, value]) => ({ label, value })), takeaway, blockIds: orders.map(bid) });
const companions = {
  1: companion("context", "章节位置", "投资者与通货膨胀", [["起点", "购买力焦虑"], ["问题", "股票是否天然防通胀"]], "本章不是寻找永远占优的资产，而是检查通胀叙事能支持多强的结论。", [1]),
  2: companion("comparison", "问题背景", "通胀对两类持有者的初步影响", [["固定收益", "利息与本金购买力承压"], ["股票", "红利和股价可能抵消损失"]], "“可能抵消”还不是“必然更优”。", [2]),
  3: companion("inference", "常见推论", "从事实跳到资产结论", [["事实", "通胀损害固定美元收入"], ["推论", "债券不可取"], ["跳跃", "组合应全部持有股票"]], "这段呈现的是待检验的推论，不是作者最终结论。", [3]),
  4: companion("comparison", "推论边界", "两个绝对判断都不成立", [["股票永远优于债券", "错误"], ["债券永远比股票安全", "同样错误"]], "资产质量不能脱离价格、收益率和具体条件。", [4]),
  5: companion("context", "论证方法", "先回到历史经验", [["输入", "55年价格、利润与市场数据"], ["目的", "约束对未来的判断"]], "作者选择用历史区间检验直觉，而不是直接预测未来。", [5]),
  6: companion("evidence", "证据入口", "表2-1观察什么", [["价格", "总体物价水平"], ["企业", "股票利润"], ["市场", "股票价格"]], "真正的问题是三组数据是否稳定同步。", [6]),
  7: companion("metric", "数据口径", "指数基期会改变数字外观", [["1957", "原表基期=100"], ["1967", "换基期=100"]], "比较趋势前要先理解统计口径。", [7]),
  8: companion("evidence", "表格注释", "特殊年份的平均口径", [["1941–1943", "平均数=10"]], "这是数据解释条件，不承担新的投资结论。", [8]),
  9: companion("evidence", "表格注释", "为什么使用1946年", [["目的", "剔除战时价格管制影响"]], "异常制度环境会扭曲历史比较。", [9]),
  10: companion("timeline", "历史波动", "通胀并不是单向直线", [["1915–1920", "生活费用近乎翻倍"], ["中间时期", "3次下降、6次上涨"], ["1965–1970", "上涨约15%"]], "历史支持“通胀会反复出现”，不支持固定速度预测。", [10]),
  11: companion("metric", "未来假设", "从已知数据到不确定预期", [["过去20年", "年均约2.5%"], ["1965–1970", "约4.5%"], ["思考假设", "未来约3%"]], "3%是用于决策思考的假设，不是确定预测。", [11]),
  12: companion("comparison", "实际购买力", "通胀损失不等于财富归零", [["损失", "约一半税后利息被侵蚀"], ["保留", "本金真实价值未必下降"]], "必须区分收入的购买力损失与资本本身的真实价值。", [12]),
  13: companion("inference", "资产追问", "股票防通胀命题需要拆开", [["疑问1", "股票是否肯定收益更好"], ["疑问2", "是否有内在防护"], ["疑问3", "长期是否几乎必胜"]], "三个问法都把历史优势推向了未来保证。", [13]),
  14: companion("metric", "历史收益", "55年股票回报的组成", [["价格复合增长", "约4%"], ["股息收益", "约4%"], ["合计", "约8%"]], "历史8%是证据，但没有超过当时高等级债券提供的收益。", [14]),
  15: companion("comparison", "时间尺度", "同一资产需要两套观察", [["长期约25年", "实际回报与企业结果"], ["近期约5年", "价格、财务和心理变化"]], "长期平均无法替代投资者逐年的真实经历。", [15]),
  16: companion("evidence", "反例", "通胀、利润与股价并不同步", [["1966–1970", "生活费用上涨22%"], ["同期", "股票利润和价格下降"]], "一个反向变化区间足以否定“必然同步”。", [16]),
  17: companion("metric", "盈利能力", "价格上涨没有抬高资本利润率", [["过去20年", "公司利润率下降"], ["账面收益", "约10%"], ["按市价收益", "约6.25%"]], "估值越高，同样利润对应的投资收益率越低。", [17]),
  18: companion("evidence", "证据入口", "表2-2观察什么", [["公司债务", "资本结构变化"], ["利润", "增长幅度"], ["资本利润率", "盈利效率"]], "这张表检验通胀是否真正改善股东经济结果。", [18]),
  19: companion("evidence", "计算口径", "利润率的分母", [["利润", "标准普尔工业指数利润"], ["资本", "同年平均账面值"]], "口径决定利润率表达的含义。", [19]),
  20: companion("evidence", "数据来源", "跨时期数据来自不同资料", [["1950、1955", "Coe and Whman"], ["1960–1969", "《财富》杂志"]], "跨来源比较需要保留数据来源意识。", [20]),
  21: companion("metric", "收益预期", "股票总体回报的简化组成", [["股息", "约3.5%"], ["利润再投资增值", "约4%"], ["合计", "约7.5%"]], "预期回报来自可解释的组成，而不是额外加入通胀红利。", [21]),
  22: companion("causal", "利润来源", "利润增长来自哪里", [["通胀率", "没有直接影响每股收益"], ["利润再投资", "形成新增投资资本"], ["利润增长", "来自资本增长"]], "作者把利润增长归因于再投资资本，而不是物价本身。", [22]),
  23: companion("inference", "反事实检验", "如果通胀真是独立利好", [["假设", "旧资本价值上升"], ["应观察到", "资本利润率提高"], ["历史结果", "并未出现"]], "反事实预测没有被历史数据支持。", [23]),
  24: companion("causal", "传导阻力", "价格上涨之外还有成本", [["繁荣与通胀", "可能同时出现"], ["工资增长", "超过生产率"], ["结果", "股本盈利能力未改善"]], "相关出现不能证明通胀提升了真实盈利能力。", [24]),
  25: companion("causal", "资本效率", "新增资本为何压低回报", [["新增资本需求", "上升"], ["销售/投入资本", "比例下降"], ["资本利润率", "承压"]], "更多资本不自动带来同比例的销售与利润。", [25]),
  26: companion("metric", "债务约束", "债务增长快于利润", [["公司债务", "近4倍"], ["税前利润", "仅一倍多"], ["息后税前利润/债务", "30% → 13.2%"]], "通胀期间扩张的债务可能放大股权利润，也提高脆弱性。", [26]),
  27: companion("comparison", "行业案例", "公用事业为何特殊", [["不利", "债务成本上升、价格受管制"], ["有利", "单位成本增长较慢、依法可获适当回报"]], "具体行业的制度与成本结构会改变通胀影响。", [27]),
  28: companion("conclusion", "章节结论", "合理预期不是收益保证", [["总体平均回报", "没有理由期待高于约8%"], ["市场路径", "会起伏不定"], ["行为风险", "满仓股票更易被波动误导"]], "收益预期必须同时容纳估值、时间和行为风险。", [28]),
  29: companion("causal", "行为机制", "通胀叙事如何放大追涨", [["预期", "通胀会深化"], ["牛市上涨", "被理解为验证"], ["结果", "忽视上涨后的风险信号"]], "叙事会改变投资者对同一价格变化的解释。", [29]),
  30: companion("context", "章节位置", "转入公司利润专题", [["上一部分", "资产选择与实际收益"], ["下一部分", "通胀如何影响公司利润"]], "论证从资产回报转向企业内部盈利机制。", [30]),
  31: companion("evidence", "原书图示", "图像引用尚未随HTML提供", [["当前状态", "保留图示位置与来源提示"]], "缺少原始图像时不推测其内容。", [31])
};
chapter.blocks = chapter.blocks.map((block) => ({ ...block, companion: companions[block.order], knowledgePointId: pointByBlock.get(block.id) || null, assistance: owner[block.id] || { needed: false, reason: pointByBlock.has(block.id) ? "该段由所属知识点的单一主要组件覆盖，正文保持连续。" : "原文排版和上下文本身足够，应保持安静阅读。", componentType: "none", componentData: null } }));

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
