export function assemble(stages) {
  const [segments, classified, identified, decisions, componentStage, memory] = stages;
  const types = new Map(classified.blocks.map((b) => [b.id, b.contentType]));
  const assignments = new Map(identified.blockAssignments.map((b) => [b.blockId, b.knowledgePointId]));
  const aids = new Map(decisions.decisions.map((d) => [d.blockId, d]));
  const components = new Map(componentStage.components.map((c) => [c.blockId, c]));
  const blocks = segments.blocks.map(({ fingerprint, ...block }) => {
    const aid = aids.get(block.id) ?? { needed: false, reason: "原文排版本身足够，应保持留白。", componentType: "none" };
    const component = components.get(block.id);
    return {
      ...block,
      contentType: types.get(block.id),
      knowledgePointId: assignments.get(block.id) ?? null,
      assistance: aid.needed ? { needed: true, reason: aid.reason, componentType: aid.componentType, componentData: component?.componentData ?? {} } : { needed: false, reason: aid.reason, componentType: "none", componentData: null }
    };
  });
  return { chapter: { id: segments.chapter.id, title: segments.chapter.title, intro: segments.chapter.intro, blocks, knowledgePoints: identified.knowledgePoints, recallQuestions: memory.recallQuestions, review: memory.review } };
}
