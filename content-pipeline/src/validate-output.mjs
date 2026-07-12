import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { validateChapter } from "./validate.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.resolve(root, process.argv[2] ?? "output/chapter-02/chapter-02.reviewed.json");
validateChapter(JSON.parse(fs.readFileSync(target, "utf8")), path.join(root, "schemas/chapter.schema.json"));
console.log(`valid: ${target}`);
