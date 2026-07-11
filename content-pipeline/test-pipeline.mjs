import assert from "node:assert/strict";
import fs from "node:fs";
import { adaptPipelineDocument } from "../prototype/src/contentAdapter.js";

const document = JSON.parse(fs.readFileSync(new URL("./output/chapter-01.json", import.meta.url), "utf8"));
const adapted = adaptPipelineDocument(document);

assert.equal(document.chapter.blocks.length, 24);
assert.equal(document.chapter.knowledgePoints.length, 3);
assert.equal(adapted.chapter.knowledgePoints.length, 3);
assert.equal(adapted.chapter.knowledgePoints.flatMap((point) => point.paragraphs).length, 23);
assert.equal(adapted.reviewQuestions.length, 3);
assert.ok(adapted.chapter.knowledgePoints.every((point) => point.shortPrompt));
assert.ok(adapted.chapter.knowledgePoints.every((point) => point.aidItems.length > 0));
assert.ok(Object.values(adapted.knowledgeDimensions).every((dimension) => dimension.requiredSignals >= 2));
assert.ok(adapted.transferPrinciples.length >= 2);
assert.equal(adapted.sourceMode, "pipeline-json");

console.log("pipeline adapter tests passed");

