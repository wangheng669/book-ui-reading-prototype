import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const idsFrom = (value) => new Set(value.chapter.blocks.map((block) => block.id));
export function validateChapter(value, schemaPath) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  if (!validate(value)) throw new Error(`Schema 校验失败:\n${JSON.stringify(validate.errors, null, 2)}`);
  const chapter = value.chapter;
  const blockIds = idsFrom(value);
  const pointIds = new Set(chapter.knowledgePoints.map((point) => point.id));
  chapter.blocks.forEach((block, index) => {
    if (block.order !== index + 1) throw new Error(`block 顺序错误: ${block.id}`);
    if (block.knowledgePointId && !pointIds.has(block.knowledgePointId)) throw new Error(`knowledgePointId 不存在: ${block.knowledgePointId}`);
    if (!block.assistance.needed && (block.assistance.componentType !== "none" || block.assistance.componentData !== null)) throw new Error(`留白约束失败: ${block.id}`);
    block.companion?.blockIds.forEach((id) => { if (!blockIds.has(id)) throw new Error(`段落 companion 引用不存在: ${id}`); });
  });
  chapter.knowledgePoints.forEach((point) => {
    point.blockIds.forEach((id) => { if (!blockIds.has(id)) throw new Error(`组件/知识点引用不存在: ${id}`); });
    if (point.requiredDimensions.some((d) => d.minimumSignals < 2)) throw new Error(`minimumSignals 低于 2: ${point.id}`);
    if (chapter.blocks.filter((b) => b.knowledgePointId === point.id && b.assistance.needed).length > 1) throw new Error(`知识点有多个主要组件: ${point.id}`);
  });
  chapter.recallQuestions.forEach((q) => { if (!pointIds.has(q.knowledgePointId)) throw new Error(`回忆题知识点不存在: ${q.id}`); });
  return true;
}
