import fs from "node:fs";
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("用法: node src/apply-review.mjs <raw.json> <reviewed.json>");
const value = JSON.parse(fs.readFileSync(input, "utf8"));
const block = value.chapter.blocks.find((item) => item.id === "chapter-02-block-028");
block.assistance = { needed: false, reason: "原文结论已经直接且紧凑，辅助组件不会增加结构信息。", componentType: "none", componentData: null };
value.chapter.knowledgePoints.find((point) => point.id === "kp-return-expectations").primaryComponent = "none";
fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
