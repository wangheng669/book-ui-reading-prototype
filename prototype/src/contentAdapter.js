function firstComponent(chapter, point) {
  return chapter.blocks.find((block) => point.blockIds.includes(block.id) && block.assistance.needed)?.assistance || null;
}

export function adaptPipelineDocument(document) {
  const source = document.chapter;
  const blockById = Object.fromEntries(source.blocks.map((block) => [block.id, block]));
  const dimensionList = source.knowledgePoints.flatMap((point) => point.requiredDimensions.map((dimension) => ({ ...dimension, pointId: point.id })));
  const knowledgeDimensions = Object.fromEntries(dimensionList.map((dimension) => {
    const point = source.knowledgePoints.find((item) => item.id === dimension.pointId);
    const blockId = dimension.blockIds.find((id) => point.blockIds.includes(id)) || point.blockIds[0];
    return [dimension.id, {
      label: dimension.label,
      pointId: dimension.pointId,
      anchor: Math.max(1, point.blockIds.indexOf(blockId) + 1),
      signals: dimension.signals,
      requiredSignals: dimension.minimumSignals,
    }];
  }));

  const recallByPoint = Object.fromEntries(source.recallQuestions.map((question) => [question.knowledgePointId, question]));
  const knowledgePoints = source.knowledgePoints.map((point) => {
    const assistance = firstComponent(source, point);
    const componentItems = assistance?.componentData?.items || [];
    const componentSteps = assistance?.componentData?.steps || [];
    const isStocksBonds = componentItems.some((item) => item.stocks || item.bonds);
    const sourceItems = componentItems.length ? componentItems : componentSteps;
    const sourceInteraction = assistance?.componentData?.interaction || null;
    const aidItems = sourceItems.map((item, index) => ({
      id: index + 1,
      label: item.label || `检查 ${index + 1}`,
      left: item.investment || item.stocks || null,
      right: item.speculation || item.bonds || null,
      detail: item.text || null,
      targetBlockId: item.blockIds?.[0] || point.blockIds[0],
    }));
    const recallDimensions = point.requiredDimensions.map((dimension, index) => ({
      id: index + 1,
      label: dimension.label,
      detail: dimension.description,
      signals: dimension.signals,
      requiredSignals: dimension.minimumSignals,
      targetBlockId: dimension.blockIds[0],
    }));
    return {
      id: point.id,
      title: point.title,
      summary: point.summary,
      shortPrompt: recallByPoint[point.id]?.question || `请用自己的话解释“${point.title}”。`,
      requiredDimensions: point.requiredDimensions.map((dimension) => dimension.id),
      primaryComponent: point.primaryComponent,
      aidSupported: ["none", "comparison", "causal-chain", "concept", "checklist"].includes(point.primaryComponent),
      aidTitle: assistance?.componentData?.title || point.title,
      comparisonLabels: isStocksBonds ? ["股票", "债券"] : ["投资", "投机"],
      aidItems,
      interaction: sourceInteraction ? {
        ...sourceInteraction,
        anchors: sourceInteraction.blockIds.map((blockId) => ({
          blockId,
          anchor: Math.max(1, point.blockIds.indexOf(blockId) + 1),
        })).filter((item) => item.anchor > 0),
      } : null,
      recallDimensions,
      paragraphs: point.blockIds.map((blockId, index) => ({
        id: blockId,
        anchor: index + 1,
        text: blockById[blockId].text,
        contentType: blockById[blockId].contentType,
      })),
    };
  });

  const titleBlock = source.blocks.find((block) => block.role === "heading" && block.text === source.title);
  const introBlock = source.blocks.find((block) => block.text === source.intro);
  const bodyBlocks = source.blocks.filter((block) => block.id !== titleBlock?.id && block.id !== introBlock?.id);
  const readingSegments = [];
  bodyBlocks.forEach((block) => {
    const pointId = block.knowledgePointId || null;
    const last = readingSegments.at(-1);
    if (!last || last.pointId !== pointId) readingSegments.push({ id: `segment-${block.id}`, pointId, blocks: [] });
    readingSegments.at(-1).blocks.push(block);
  });

  const reviewQuestions = source.review.closedBookQuestions.map((question) => ({
    id: question.id,
    pointId: question.knowledgePointId,
    question: question.question,
    dimensions: question.requiredDimensionIds,
  }));
  const transferPrinciples = source.review.transferQuestion.principles.map((dimension) => {
    const point = source.knowledgePoints.find((item) => item.id === source.blocks.find((block) => dimension.blockIds.includes(block.id))?.knowledgePointId) || source.knowledgePoints[0];
    const blockId = dimension.blockIds.find((id) => point.blockIds.includes(id)) || point.blockIds[0];
    return {
      id: dimension.id,
      label: dimension.label,
      pointId: point.id,
      anchor: Math.max(1, point.blockIds.indexOf(blockId) + 1),
      signals: dimension.signals,
      requiredSignals: dimension.minimumSignals,
    };
  });

  return {
    chapter: {
      id: source.id,
      book: "聪明的投资者",
      title: source.title,
      intro: source.intro,
      knowledgePoints,
      readingSegments,
      stats: {
        blocks: source.blocks.length,
        knowledgePoints: knowledgePoints.length,
        assistedPoints: knowledgePoints.filter((point) => point.primaryComponent !== "none").length,
      },
    },
    knowledgeDimensions,
    reviewQuestions,
    transferQuestion: source.review.transferQuestion.question,
    transferPrinciples,
    reviewStructureSummary: source.review.structureSummary,
    sourceMode: "pipeline-json",
  };
}
