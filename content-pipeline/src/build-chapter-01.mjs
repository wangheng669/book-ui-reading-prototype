import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { extractSemanticBlocks } from "./html.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("用法: node src/build-chapter-01.mjs <完整书籍 HTML>");

const html = fs.readFileSync(sourcePath, "utf8");
const $ = load(html, { decodeEntities: false });
const section = $("section#chapter-10").first();
if (!section.length) throw new Error("源页面中不存在 section#chapter-10");
const inputPath = path.join(root, "input/chapter-01.html");
fs.writeFileSync(inputPath, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>第1章</title></head><body><main>${$.html(section)}</main></body></html>\n`);

const rawBlocks = extractSemanticBlocks({ inputPath, selector: "section#chapter-10", chapterId: "chapter-01" });
const pointRanges = [
  ["kp-investment-boundary", 4, 13],
  ["kp-speculation-discipline", 14, 15],
  ["kp-defensive-allocation", 16, 22],
  ["kp-forecast-limits", 23, 26],
  ["kp-current-allocation", 27, 31],
];
const pointFor = (order) => pointRanges.find(([, start, end]) => order >= start && order <= end)?.[0] || null;
const ids = (...orders) => orders.map((order) => `chapter-01-block-${String(order).padStart(3, "0")}`);
const companion = (visualType, eyebrow, title, nodes, takeaway, orders) => ({ visualType, eyebrow, title, nodes, takeaway, blockIds: ids(...orders) });

const companions = {
  3: companion("context", "本章任务", "先建立两条判断坐标", [{ label: "对象", value: "个人与非专业投资者" }, { label: "目标", value: "恰当的证券组合策略" }], "这一章先校准判断方式，再讨论收益。", [3]),
  4: companion("context", "进入知识点", "投资与投机", [{ label: "不要先看", value: "买的是股票还是债券" }, { label: "先看", value: "操作是否满足投资条件" }], "名称不是边界，操作方式才是。", [4, 5]),
  5: companion("comparison", "定义拆解", "一项操作何时称为投资", [{ label: "① 分析", value: "以深入分析为基础" }, { label: "② 安全", value: "确保本金安全" }, { label: "③ 回报", value: "获得适当回报" }], "三项不能同时满足，就落入投机范畴。", [5]),
  6: companion("timeline", "语义变化", "同一资产曾被贴上相反标签", [{ label: "1929—1932 后", value: "普通股普遍被视为投机" }, { label: "作者立场", value: "资产类别不能代替操作判断" }], "市场情绪会改变称呼，却不会改变定义。", [5, 6]),
  7: companion("inference", "常见误判", "“参与股市”不等于“投资”", [{ label: "流行叫法", value: "所有交易者都叫投资者" }, { label: "定义要求", value: "仍需检查分析、安全与回报" }], "身份标签不能证明行为性质。", [7]),
  8: companion("evidence", "媒体样本", "被称为投资者的卖空者", [{ label: "行为", value: "卖出并不拥有的股票" }, { label: "期待", value: "更低价格买回" }], "例子故意暴露“称呼”与“操作”的冲突。", [7, 8, 10]),
  9: companion("evidence", "第二个样本", "“鲁莽投资者”本身就是矛盾", [{ label: "行为", value: "竞相抢购股票" }, { label: "问题", value: "鲁莽与投资定义冲突" }], "热情参与市场，不会自动变成投资。", [9, 10]),
  10: companion("causal", "反例推理", "错误称呼如何遮蔽风险", [{ label: "先贴标签", value: "把交易者称为投资者" }, { label: "忽略条件", value: "不再检查分析与安全" }, { label: "结果", value: "在错误时点承担价格风险" }], "定义的价值，是迫使人重新看见风险来源。", [7, 8, 9, 10]),
  11: companion("comparison", "市场镜像", "公众态度与价格吸引力常常错位", [{ label: "1948 年", value: "多数人害怕股票，价格却有吸引力" }, { label: "价格高位", value: "大众买进，行为反被称为投资" }], "受欢迎程度不能作为投资属性的证据。", [11]),
  12: companion("causal", "为何必须区分", "边界消失会把损失归错因", [{ label: "不提示投机", value: "风险性质被掩盖" }, { label: "发生损失", value: "承担者缺少预警" }, { label: "错误归因", value: "把投机损失归咎于股票本身" }], "收益机会与风险必须同时进入核算。", [12]),
  13: companion("conclusion", "现实结论", "普通股中可能含有投机成分", [{ label: "不能假设", value: "买代表性股票就没有报价风险" }, { label: "投资者任务", value: "限制投机成分" }, { label: "提前准备", value: "财务与心理承受不利后果" }], "重点不是消灭波动，而是控制暴露。", [13]),
  14: companion("comparison", "关键区分", "投机存在，不等于投机无纪律", [{ label: "可理解之处", value: "有人必须承担不确定风险" }, { label: "危险情形", value: "误认、能力不足、投入过量" }], "真正危险的是不知道自己在投机。", [14]),
  15: companion("conclusion", "操作纪律", "把投机隔离在可承受范围", [{ label: "资金", value: "只用很少一部分" }, { label: "账户", value: "与投资账户分开" }, { label: "上涨时", value: "不追加，反而考虑撤出" }], "资金隔离，也要认知隔离。", [14, 15]),
  16: companion("context", "进入第二部分", "防御型投资者关心什么", [{ label: "优先", value: "资金安全" }, { label: "约束", value: "不愿投入很多时间精力" }], "预期收益必须与投资者类型相匹配。", [16, 17, 18]),
  17: companion("timeline", "分析路线", "作者如何建立收益预期", [{ label: "回看", value: "7 年前的讨论" }, { label: "比较", value: "基本因素发生的变化" }, { label: "落点", value: "1972 年初的策略" }], "不是给固定答案，而是展示答案如何随条件变化。", [17, 18]),
  18: companion("context", "承接断句", "问题落在当时条件", [{ label: "行动", value: "应当做些什么" }, { label: "预期", value: "可以期待什么" }], "本段是上一段在源页面中的续句。", [17, 18]),
  19: companion("timeline", "历史基准", "先回到 16 年前", [{ label: "用途", value: "建立旧的收益与配置基准" }, { label: "随后", value: "再与新利率环境比较" }], "历史数字是比较起点，不是永恒配方。", [19, 20, 21]),
  20: companion("metric", "配置区间", "债券与股票的防御型框架", [{ label: "债券", value: "25%—75%" }, { label: "股票", value: "与债券相应配置" }, { label: "最简方案", value: "各 50%，小幅调整" }], "区间保留弹性，也限制极端押注。", [20]),
  21: companion("metric", "1965 年估算", "6% 组合收益如何得出", [{ label: "股票预期", value: "股息 3.5%—4.5% + 价值增长" }, { label: "股票合计", value: "约 7.5%" }, { label: "股债各半", value: "税前约 6%" }], "收益估计来自组成部分，而不是沿用过去涨幅。", [21]),
  22: companion("inference", "逆向提醒", "过去回报越好，未来未必越好", [{ label: "观察", value: "1949—1964 年回报超过 10%" }, { label: "容易推断", value: "未来仍会保持高回报" }, { label: "作者提醒", value: "上涨可能已把价格推高" }], "历史高收益也可能意味着未来回报被提前透支。", [22]),
  23: companion("timeline", "切换时期", "观察 1964 年后的真实结果", [{ label: "目的", value: "检验旧判断" }, { label: "重点", value: "利率、债券价格与股票回报" }], "接下来用结果修正对风险的直觉。", [23, 24, 25, 26]),
  24: companion("comparison", "环境变化", "债券收益上升，价格风险也显现", [{ label: "优质公司债", value: "约 4.5% → 7.5%+" }, { label: "股票股息率", value: "约 3.2% → 不到 3.5%" }, { label: "中期债券价格", value: "最大跌幅接近 38%" }], "更高利息并不抹去持有期间的价格波动。", [24]),
  25: companion("comparison", "反直觉结果", "“安全资产”也取决于期限与形式", [{ label: "长期优质债", value: "利率变化造成显著价格下跌" }, { label: "现金等价物", value: "本金市场价值未受损" }, { label: "股票", value: "期间结果介于两者之间" }], "不能只用“债券/股票”标签判断实际风险。", [25]),
  26: companion("conclusion", "经验边界", "未来价格根本无法可靠预测", [{ label: "通常", value: "债券波动低于股票" }, { label: "例外", value: "1964 年后长期债券大跌" }, { label: "原则", value: "一般规律必须容纳例外" }], "预测失效时，配置纪律比押中方向更重要。", [26]),
  27: companion("context", "回到决策", "1971 年末该怎样配置", [{ label: "输入", value: "当期债券收益与股票股息" }, { label: "输出", value: "防御型投资者策略" }], "先比较可见收益，再处理不可预测因素。", [27, 28, 29, 30, 31]),
  28: companion("metric", "当期收益对照", "债券现金收益明显占优", [{ label: "中期公司债", value: "税前约 8%" }, { label: "市政债", value: "税后约 5.7%" }, { label: "道指股息率", value: "约 3.5%" }], "短债到期偿还还降低了市场价值缩水顾虑。", [28]),
  29: companion("comparison", "同口径估算", "股票预期与债券收益接近", [{ label: "股票税前", value: "3.5% 股息 + 4% 增值 ≈ 7.5%" }, { label: "股票税后", value: "约 5.3%" }, { label: "免税中期债", value: "约 5.7%" }], "必须把收益和支付可靠性放在一起比较。", [29, 30]),
  30: companion("inference", "初步结论", "当期数字偏向债券，但结论仍有条件", [{ label: "收益", value: "债券更高" }, { label: "可靠性", value: "利息与本金偿付更确定" }, { label: "若能确定未来", value: "可暂时全部持债" }], "关键转折在“如果可以确定”，而未来并不可确定。", [30, 31]),
  31: companion("comparison", "保留两种未来", "不能把当期优势外推成必然", [{ label: "通胀加速", value: "固定利率债券吸引力下降" }, { label: "企业利润大增", value: "普通股价值可能增长" }, { label: "因此", value: "不做单一路径押注" }], "原站正文在本段“最后，”处截断，页面忠实保留。", [31]),
};

const contentTypes = {
  1: "preface", 2: "preface", 3: "transition", 4: "transition", 5: "definition", 6: "example", 7: "misconception", 8: "example", 9: "example", 10: "argument", 11: "comparison", 12: "causality", 13: "claim", 14: "method", 15: "method", 16: "transition", 17: "transition", 18: "transition", 19: "transition", 20: "method", 21: "data", 22: "argument", 23: "transition", 24: "data", 25: "comparison", 26: "summary", 27: "transition", 28: "data", 29: "argument", 30: "claim", 31: "argument",
};

const primaryAt = {
  5: ["comparison", "投资与投机的判断边界", { title: "投资与投机的判断边界", sourceBlockIds: ids(5, 13), items: [{ label: "分析基础", investment: "以深入分析为基础", speculation: "不满足深入分析要求", blockIds: ids(5) }, { label: "本金与风险", investment: "要求本金安全并考虑风险", speculation: "可能依赖价格变化并放大风险", blockIds: ids(5, 12, 13) }, { label: "回报", investment: "追求适当回报", speculation: "赚钱和亏损机会并存", blockIds: ids(5, 14) }], interaction: { mode: "judgment", prompt: "只看‘买了股票’，能判断这是投资吗？", cta: "判断这项操作", options: [{ id: "yes", text: "可以", perspective: "资产名称不足以判断操作性质。" }, { id: "no", text: "不可以", perspective: "还要检查分析、本金安全和回报条件。" }], analysis: "作者把投资定义为一组操作条件，而不是一种资产标签。", blockIds: ids(5, 11, 12, 13) } }],
  14: ["checklist", "投机纪律检查", { title: "投机纪律检查", sourceBlockIds: ids(14, 15), items: [{ text: "是否把投机误认成投资？", blockIds: ids(14) }, { text: "是否缺乏足够知识与技能？", blockIds: ids(14) }, { text: "资金是否超过亏损承受能力？", blockIds: ids(14, 15) }, { text: "是否与投资账户分开？", blockIds: ids(15) }], interaction: { mode: "judgment", prompt: "热门股上涨时，最值得先检查什么？", cta: "检查投机纪律", options: [{ id: "price", text: "还能涨多少", perspective: "价格想象不能替代风险纪律。" }, { id: "boundary", text: "资金与账户边界", perspective: "先确认损失可承受，且与投资操作隔离。" }], analysis: "格雷厄姆没有否认投机存在，而是要求明确承认并限制它。", blockIds: ids(14, 15) } }],
  20: ["comparison", "防御型配置框架", { title: "防御型配置框架", sourceBlockIds: ids(20, 22), items: [{ label: "配置边界", stocks: "25%—75%", bonds: "25%—75%", blockIds: ids(20) }, { label: "最简基准", stocks: "50%", bonds: "50%", blockIds: ids(20) }, { label: "收益判断", stocks: "股息 + 内在价值增长", bonds: "利息收益", blockIds: ids(21) }], interaction: { mode: "judgment", prompt: "过去股票回报很高，是否应直接提高股票比例？", cta: "拆解收益预期", options: [{ id: "follow", text: "提高", perspective: "过去上涨可能已经推高当前价格。" }, { id: "rebuild", text: "重新估算", perspective: "从股息、价值增长与债券利息重新比较。" }], analysis: "配置不是追逐上一阶段赢家，而是在当前价格和收益条件下重建预期。", blockIds: ids(20, 21, 22) } }],
  26: ["causal-chain", "预测为何会失效", { title: "预测为何会失效", sourceBlockIds: ids(24, 26), steps: [{ label: "既有规律", text: "债券通常比股票波动小", blockIds: ids(26) }, { label: "环境变化", text: "利率大幅上升", blockIds: ids(24, 25) }, { label: "意外结果", text: "优质长期债券也出现大幅价格损失", blockIds: ids(24, 25) }, { label: "策略含义", text: "不能把一般规律当成确定预测", blockIds: ids(26) }], interaction: { mode: "causal", prompt: "为什么‘优质债券’仍可能出现显著亏损？", cta: "展开因果链", options: [{ id: "quality", text: "发行人质量下降", perspective: "原文强调的并非信用恶化。" }, { id: "rates", text: "利率和期限共同作用", perspective: "利率变化会使长期债券的市场价格大幅波动。" }], analysis: "信用安全与持有期间的价格安全不是同一件事。", blockIds: ids(24, 25, 26) } }],
  29: ["comparison", "当期股债选择", { title: "当期股债选择", sourceBlockIds: ids(28, 31), items: [{ label: "可见收益", stocks: "税前约 7.5%", bonds: "中期公司债约 8%", blockIds: ids(28, 29) }, { label: "支付可靠性", stocks: "股息与增值不确定", bonds: "利息和本金更可靠", blockIds: ids(30) }, { label: "未来风险", stocks: "企业利润可能增长", bonds: "通胀会削弱固定收益", blockIds: ids(31) }], interaction: { mode: "judgment", prompt: "债券当期收益更高，是否意味着应把资金全部转为债券？", cta: "比较决策条件", options: [{ id: "all", text: "全部转入", perspective: "这要求你能确定未来债券持续胜出。" }, { id: "uncertain", text: "仍保留配置", perspective: "通胀与企业利润变化都可能改变相对吸引力。" }], analysis: "当前收益比较提供倾向，但不提供对未来的确定性。", blockIds: ids(28, 29, 30, 31) } }],
};

const blocks = rawBlocks.map(({ fingerprint, ...block }) => {
  const pointId = pointFor(block.order);
  const primary = primaryAt[block.order];
  return { ...block, ...(companions[block.order] ? { companion: companions[block.order] } : {}), contentType: contentTypes[block.order] || "narrative", knowledgePointId: pointId, assistance: primary ? { needed: true, reason: "该处包含需要显化的核心结构，并可直接引用原文验证。", componentType: primary[0], componentData: primary[2] } : { needed: false, reason: "该段由逐段 companion 轻量辅助或正文自身已足够，不额外叠加主要组件。", componentType: "none", componentData: null } };
});

const dim = (id, label, description, orders, signals, minimumSignals = 2) => ({ id, label, description, blockIds: ids(...orders), signals, minimumSignals });
const knowledgePoints = [
  { id: "kp-investment-boundary", title: "投资与投机的定义边界", summary: "投资由深入分析、本金安全和适当回报共同定义，而不是由资产名称或市场身份定义。", blockIds: ids(...Array.from({ length: 10 }, (_, i) => i + 4)), primaryComponent: "comparison", requiredDimensions: [dim("definition-conditions", "定义条件", "能说明分析、本金安全与适当回报是共同条件。", [5], [["分析", "研究"], ["本金", "安全"], ["适当回报", "合理回报"]]), dim("label-vs-operation", "标签与操作", "能说明股票、债券或投资者称呼不能单独决定操作性质。", [6, 7, 10, 11], [["标签", "称呼", "资产"], ["操作", "行为", "目的"]]) ] },
  { id: "kp-speculation-discipline", title: "投机的边界与纪律", summary: "投机并非道德问题，但必须被承认、限制资金并与投资操作隔离。", blockIds: ids(14, 15), primaryComponent: "checklist", requiredDimensions: [dim("speculation-awareness", "承认投机", "能识别误把投机当投资的危险。", [14, 15], [["投机", "赌博"], ["误认", "混为一谈", "承认"]]), dim("loss-boundary", "亏损边界", "能说明资金规模与账户隔离规则。", [14, 15], [["承受", "亏损", "少量"], ["账户", "分开", "隔离"]]) ] },
  { id: "kp-defensive-allocation", title: "防御型投资者的配置与收益预期", summary: "防御型投资者以股债区间控制极端押注，并从收益组成而非过去涨幅建立预期。", blockIds: ids(...Array.from({ length: 7 }, (_, i) => i + 16)), primaryComponent: "comparison", requiredDimensions: [dim("allocation-range", "配置边界", "能说明股债比例区间和各半基准。", [20], [["25%", "75%", "区间"], ["各半", "50%", "一半"]]), dim("return-components", "收益来源", "能从股息、价值增长和债券利息解释预期收益。", [21, 22], [["股息", "利息"], ["价值", "增值", "内在价值"]]) ] },
  { id: "kp-forecast-limits", title: "历史经验与预测边界", summary: "资产的一般风险规律会在利率等环境变化下出现例外，未来证券价格无法可靠预测。", blockIds: ids(23, 24, 25, 26), primaryComponent: "causal-chain", requiredDimensions: [dim("rate-price-risk", "利率与价格", "能区分信用质量与利率造成的市场价格风险。", [24, 25], [["利率", "货币市场"], ["价格", "下跌", "市场价值"]]), dim("prediction-limit", "预测边界", "能说明一般规律存在例外，不能据此确定预测未来。", [26], [["无法预测", "不能预测", "不确定"], ["例外", "规律"]]) ] },
  { id: "kp-current-allocation", title: "当期收益与不确定未来之间的选择", summary: "债券当期收益与可靠性更优，但通胀和企业利润变化使全部押注债券仍缺乏确定依据。", blockIds: ids(27, 28, 29, 30, 31), primaryComponent: "comparison", requiredDimensions: [dim("current-yield", "当期收益比较", "能比较股票预期收益与债券收益及可靠性。", [28, 29, 30], [["7.5%", "8%", "收益"], ["可靠", "本金", "利息"]]), dim("future-scenarios", "未来情境", "能说明通胀和企业利润可能改变股债相对吸引力。", [31], [["通货膨胀", "通胀"], ["利润", "企业", "股票价值"]]) ] },
];

const recallQuestions = [
  { id: "recall-investment-boundary", knowledgePointId: "kp-investment-boundary", question: "为什么只知道某人买了股票，还不能判断他是在投资？", blockIds: ids(5, 11, 12), requiredDimensionIds: ["definition-conditions", "label-vs-operation"] },
  { id: "recall-speculation-discipline", knowledgePointId: "kp-speculation-discipline", question: "如果决定投机，格雷厄姆要求守住哪两类边界？", blockIds: ids(14, 15), requiredDimensionIds: ["speculation-awareness", "loss-boundary"] },
  { id: "recall-defensive-allocation", knowledgePointId: "kp-defensive-allocation", question: "防御型投资者如何配置股债，又如何估算股票收益？", blockIds: ids(20, 21, 22), requiredDimensionIds: ["allocation-range", "return-components"] },
  { id: "recall-forecast-limits", knowledgePointId: "kp-forecast-limits", question: "1964 年后的债券经历为什么削弱了对一般规律的确信？", blockIds: ids(24, 25, 26), requiredDimensionIds: ["rate-price-risk", "prediction-limit"] },
  { id: "recall-current-allocation", knowledgePointId: "kp-current-allocation", question: "债券当期看起来更优，为什么仍不能直接断定未来一定优于股票？", blockIds: ids(28, 29, 30, 31), requiredDimensionIds: ["current-yield", "future-scenarios"] },
];
const closedBookQuestions = [recallQuestions[0], recallQuestions[2], recallQuestions[4]];
const reviewed = { chapter: { id: "chapter-01", title: rawBlocks[0].text, intro: rawBlocks[2].text, blocks, knowledgePoints, recallQuestions, review: { closedBookQuestions, structureSummary: [{ text: "先用分析、本金安全和适当回报区分投资与投机，而不是相信市场标签。", blockIds: ids(5, 11, 12) }, { text: "承认投机成分，并用资金上限和账户隔离控制它。", blockIds: ids(13, 14, 15) }, { text: "防御型配置用股债区间避免极端押注，收益预期应从当期组成重新估算。", blockIds: ids(20, 21, 22) }, { text: "利率变化揭示债券也有价格风险；当期优势不能被外推为确定未来。", blockIds: ids(24, 25, 26, 28, 29, 30, 31) }], transferQuestion: { question: "一位朋友因为债券当前收益高于股票，准备把全部长期资金转入长期债券。你会用本章哪些原则帮助他检查这个决定？", principles: [dim("transfer-current-evidence", "比较当期证据", "比较收益组成与支付可靠性。", [28, 29, 30], [["收益", "利息", "股息"], ["可靠", "本金", "偿付"]]), dim("transfer-price-risk", "识别期限与价格风险", "长期债券仍会受利率变化影响。", [24, 25, 26], [["长期", "期限"], ["利率", "价格", "市场价值"]]), dim("transfer-uncertainty", "保留不确定性", "通胀与利润变化可能改写相对优势。", [31], [["通胀", "通货膨胀"], ["利润", "未来", "不确定"]])], blockIds: ids(24, 25, 26, 28, 29, 30, 31) } } } };

fs.mkdirSync(path.join(root, "output"), { recursive: true });
fs.writeFileSync(path.join(root, "output/chapter-01.raw.json"), `${JSON.stringify({ chapter: { ...reviewed.chapter, blocks: blocks.map((block) => ({ ...block, companion: undefined })) } }, null, 2)}\n`);
fs.writeFileSync(path.join(root, "output/chapter-01.json"), `${JSON.stringify(reviewed, null, 2)}\n`);
console.log(`chapter-01: ${blocks.length} blocks, ${knowledgePoints.length} knowledge points, ${Object.keys(companions).length} companions`);
