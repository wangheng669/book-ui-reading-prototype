import * as fallback from "./content.js";
import { adaptPipelineDocument } from "./contentAdapter.js";

const fallbackContent = {
  chapter: fallback.chapter,
  knowledgeDimensions: fallback.knowledgeDimensions,
  reviewQuestions: fallback.reviewQuestions,
  transferQuestion: fallback.transferQuestion,
  transferPrinciples: fallback.transferPrinciples,
  reviewStructureSummary: [
    { text: "投资：分析依据 → 安全边际 → 本金安全与合理回报" },
    { text: "投机：价格预期 → 短期波动收益 → 更高不确定性" },
    { text: "共同条件：判断永远可能出错，因此需要为错误保留缓冲。" },
  ],
  sourceMode: "static-fallback",
};

export let { chapter, knowledgeDimensions, reviewQuestions, transferQuestion, transferPrinciples, reviewStructureSummary, sourceMode } = fallbackContent;

function applyContent(content) {
  ({ chapter, knowledgeDimensions, reviewQuestions, transferQuestion, transferPrinciples, reviewStructureSummary, sourceMode } = content);
}

export async function loadContent() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}chapter-01.json`);
    if (!response.ok) throw new Error(`chapter JSON request failed: ${response.status}`);
    applyContent(adaptPipelineDocument(await response.json()));
  } catch (error) {
    if (import.meta.env.DEV) console.warn("使用静态 fallback 内容", error);
  }
}
