import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractSemanticBlocks } from "../src/html.mjs";
import { validateChapter } from "../src/validate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const segments = JSON.parse(fs.readFileSync(path.join(root, "fixtures/chapter-02/01-segments.json"), "utf8"));
const final = JSON.parse(fs.readFileSync(path.join(root, "output/chapter-02/chapter-02.reviewed.json"), "utf8"));
const chapterOne = JSON.parse(fs.readFileSync(path.join(root, "output/chapter-01.json"), "utf8"));

test("原文、顺序和 block id 保持稳定", () => {
  assert.deepEqual(final.chapter.blocks.map((b) => b.text), segments.blocks.map((b) => b.text));
  assert.deepEqual(final.chapter.blocks.map((b) => b.order), segments.blocks.map((b) => b.order));
  const rerun = extractSemanticBlocks({ inputPath: path.join(root, "input/chapter-02.html"), chapterId: "chapter-02" });
  assert.deepEqual(rerun.map((b) => [b.id, b.fingerprint]), segments.blocks.map((b) => [b.id, b.fingerprint]));
});

test("引用、组件和回忆约束成立", () => {
  assert.equal(validateChapter(final, path.join(root, "schemas/chapter.schema.json")), true);
  const blockIds = new Set(final.chapter.blocks.map((b) => b.id));
  const pointIds = new Set(final.chapter.knowledgePoints.map((p) => p.id));
  const collect = (value, key = "") => {
    if (Array.isArray(value)) return value.flatMap((v) => collect(v, key));
    if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => collect(v, k));
    return key === "blockIds" || key === "sourceBlockIds" ? [value] : [];
  };
  for (const block of final.chapter.blocks) {
    if (!block.assistance.needed) assert.equal(block.assistance.componentType, "none");
    collect(block.assistance.componentData).filter(Boolean).forEach((id) => assert.ok(blockIds.has(id), id));
    if (block.knowledgePointId) assert.ok(pointIds.has(block.knowledgePointId));
  }
  final.chapter.recallQuestions.forEach((q) => assert.ok(pointIds.has(q.knowledgePointId)));
  final.chapter.knowledgePoints.flatMap((p) => p.requiredDimensions).forEach((d) => assert.ok(d.minimumSignals >= 2));
});

test("不存在的 selector 明确报错", () => {
  assert.throws(() => extractSemanticBlocks({ inputPath: path.join(root, "input/chapter-02.html"), selector: "#not-found", chapterId: "chapter-02" }), /CSS selector 不存在/);
});

test("第一章使用完整源章节并通过所有引用约束", () => {
  assert.equal(validateChapter(chapterOne, path.join(root, "schemas/chapter.schema.json")), true);
  assert.equal(chapterOne.chapter.blocks.length, 31);
  assert.equal(chapterOne.chapter.blocks.at(-1).text.endsWith("最后，"), true);
  assert.equal(chapterOne.chapter.blocks.filter((block) => block.companion).length, 29);
  const extracted = extractSemanticBlocks({ inputPath: path.join(root, "input/chapter-01.html"), selector: "section#chapter-10", chapterId: "chapter-01" });
  assert.deepEqual(chapterOne.chapter.blocks.map((block) => block.text), extracted.map((block) => block.text));
  const blockIds = new Set(chapterOne.chapter.blocks.map((block) => block.id));
  chapterOne.chapter.blocks.flatMap((block) => block.companion?.blockIds || []).forEach((id) => assert.ok(blockIds.has(id), id));
});
