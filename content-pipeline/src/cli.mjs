import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractSemanticBlocks } from "./html.mjs";
import { runModelStage } from "./model.mjs";
import { assemble } from "./assemble.mjs";
import { validateChapter } from "./validate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const mode = args.shift() ?? "fixture";
const option = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const fixture = option("fixture", "chapter-02");
const chapterId = option("chapter-id", fixture);
const input = path.resolve(root, option("input", `input/${chapterId}.html`));
const selector = option("selector", undefined);
const outputDir = path.resolve(root, option("output", `generated/${chapterId}`));
const fixtureDir = path.join(root, "fixtures", fixture);
const names = ["01-segments", "02-classified", "03-knowledge-points", "04-assistance-decisions", "05-components", "06-memory"];
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); };

if (!['fixture', 'model'].includes(mode)) throw new Error(`未知模式: ${mode}`);
const stages = [];
if (mode === "fixture") {
  for (const name of names) stages.push(read(path.join(fixtureDir, `${name}.json`)));
} else {
  const extracted = extractSemanticBlocks({ inputPath: input, selector, chapterId });
  let previous = { chapter: { id: chapterId }, blocks: extracted };
  previous.chapter.title = previous.blocks.find((b) => b.role === "heading")?.text ?? chapterId;
  previous.chapter.intro = previous.blocks.find((b) => b.role === "paragraph")?.text ?? previous.chapter.title;
  for (let index = 0; index < names.length; index += 1) {
    const number = String(index + 1).padStart(2, "0");
    const rule = fs.readFileSync(path.join(root, "rules", `${number}-${["segmentation", "content-types", "knowledge-points", "assistance", "components", "memory"][index]}.md`), "utf8");
    const prompt = fs.readFileSync(path.join(root, "prompts", `${number}-${["segment", "classify", "knowledge-points", "assistance", "components", "recall-review"][index]}.md`), "utf8");
    const result = await runModelStage({ stage: index + 1, rule, prompt, previous: { previous, sourceBlocks: stages[0]?.blocks ?? extracted, priorStages: stages } });
    if (index === 0) {
      const before = extracted.map((b) => [b.id, b.order, b.text, b.sourceHtml]);
      const after = result.blocks?.map((b) => [b.id, b.order, b.text, b.sourceHtml]);
      if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Step 1 修改了原文、顺序或稳定 block id，已拒绝输出");
    }
    stages.push(result);
    previous = result;
  }
}
names.forEach((name, index) => write(path.join(outputDir, `${name}.json`), stages[index]));
const chapter = assemble(stages);
validateChapter(chapter, path.join(root, "schemas/chapter.schema.json"));
write(path.join(outputDir, `${chapterId}.raw.json`), chapter);
console.log(`${mode}: ${chapter.chapter.id}, ${chapter.chapter.blocks.length} blocks -> ${outputDir}`);
