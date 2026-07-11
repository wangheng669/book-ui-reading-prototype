import { useEffect, useMemo, useRef, useState } from "react";
import { chapter, chapterNumber, knowledgeDimensions, reviewQuestions, reviewStructureSummary, sourceMode, transferPrinciples, transferQuestion } from "./contentSource.js";

const createInitialProgress = () => Object.fromEntries(chapter.knowledgePoints.map((p) => [p.id, {
  exposure: false,
  explained: false,
  recalled: false,
  review: false,
  dimensions: Object.fromEntries(p.requiredDimensions.map((id) => [id, "missing"])),
}]));

function evaluate(text, anchors) {
  const source = text.trim();
  return anchors.map((item) => item.signals ? ({ ...item, ...evaluateSignals(source, item) }) : ({ ...item, covered: item.keywords.some((word) => source.includes(word)) }));
}

function evaluateSignals(text, item) {
  const normalized = text.trim();
  const matchedSignals = item.signals.filter((alternatives) => alternatives.some((term) => normalized.includes(term))).length;
  return { covered: matchedSignals >= item.requiredSignals, matchedSignals, requiredSignals: item.requiredSignals };
}

function evaluateDimensions(answers, pointId) {
  return Object.fromEntries(Object.entries(knowledgeDimensions).filter(([, dimension]) => dimension.pointId === pointId).map(([id, dimension]) => {
    const relevantAnswers = reviewQuestions.filter((question) => question.pointId === pointId && question.dimensions.includes(id)).map((question) => answers[question.id] || "").join(" ");
    return [id, evaluateSignals(relevantAnswers, dimension).covered ? "covered" : "missing"];
  }));
}

function pointAbility(point, dimensions) {
  return point.requiredDimensions.every((id) => dimensions[id] === "covered");
}

function ReadingBlock({ block }) {
  if (block.role === "heading") return <h2 className="source-heading">{block.text}</h2>;
  if (block.role === "figure") return <figure className="source-figure"><div className="figure-placeholder" aria-hidden="true"><span>原书图示</span></div><figcaption>{block.text}<small>当前 HTML 仅包含图片引用，图像文件未随章节提供。</small></figcaption></figure>;
  const isCaption = block.contentType === "data" && /^表\s*\d/i.test(block.text);
  const isNote = block.contentType === "data" && block.text.length < 110 && !isCaption;
  const className = ["source-block", `source-block--${block.contentType || "narrative"}`, isCaption ? "data-caption" : "", isNote ? "data-note" : ""].filter(Boolean).join(" ");
  return <p className={className}>{block.text}</p>;
}

function KnowledgeAid({ point, open, onOpen, onClose, onAnchor }) {
  if (!point || point.primaryComponent === "none") return <aside className="knowledge-aid knowledge-aid--empty" aria-hidden="true" />;
  return (
    <aside className={`knowledge-aid ${open ? "knowledge-aid--open" : ""}`} aria-label={`${point.title}辅助内容`}>
      {!open ? (
        <button className="aid-peek" onClick={onOpen}>
          <span><small>右侧互动</small>{point.interaction?.cta || point.title}</span>
          <b>开始</b>
        </button>
      ) : (
        <AidWorkspace key={point.id} point={point} onClose={onClose} onAnchor={onAnchor} />
      )}
    </aside>
  );
}

function AidWorkspace({ point, onClose, onAnchor }) {
  const [selected, setSelected] = useState(null);
  const [perspective, setPerspective] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const interaction = point.interaction;
  const selectedOption = interaction?.options.find((option) => option.id === selected);
  const activePerspective = point.aidItems[perspective];
  return <div className="aid-panel">
    <div className="aid-heading"><div><small>当前知识点 · 互动</small><h3>{point.aidTitle || point.title}</h3></div><button className="text-button" onClick={onClose}>收起</button></div>
    {!point.aidSupported && <p className="aid-degraded">此组件类型暂未支持交互展示。原文与锚点仍完整保留。</p>}
    {interaction?.mode === "perspective" ? <div className="perspective-workspace">
      <p className="aid-question">{interaction.prompt}</p>
      <div className="perspective-tabs">{point.aidItems.map((item, index) => <button key={item.id} className={perspective === index ? "active" : ""} onClick={() => setPerspective(index)}>{item.label}</button>)}</div>
      <div className="perspective-content"><small>当前观察</small><p>{activePerspective?.detail}</p><button className="anchor-button" onClick={() => onAnchor(point.id, activePerspective?.targetBlockId)}>查看对应原文</button></div>
      <p className="aid-takeaway">切换时间尺度，不是为了选一个正确答案，而是避免用长期平均掩盖近期风险，或用近期波动否定长期证据。</p>
    </div> : <div className="judgment-workspace">
      <small>先判断，再展开结构</small><p className="aid-question">{interaction?.prompt}</p>
      <div className="aid-options">{interaction?.options.map((option) => <button key={option.id} className={selected === option.id ? "selected" : ""} onClick={() => { setSelected(option.id); setVisibleSteps(interaction.mode === "causal" ? 1 : point.aidItems.length); }}>{option.text}</button>)}</div>
      {selectedOption && <div className="aid-feedback"><p><span>这条思考路径</span>{selectedOption.perspective}</p><p>{interaction.analysis}</p></div>}
      {selectedOption && <div className={`aid-structure aid-structure--${interaction.mode}`}>{point.aidItems.slice(0, visibleSteps).map((item, index) => <section key={item.id}><span>{index + 1}</span><div><strong>{item.label}</strong><p>{item.detail}</p><button className="anchor-button" onClick={() => onAnchor(point.id, item.targetBlockId)}>原文 {item.id}</button></div></section>)}</div>}
      {selectedOption && interaction.mode === "causal" && visibleSteps < point.aidItems.length && <button className="reveal-step" onClick={() => setVisibleSteps((count) => count + 1)}>展开下一环</button>}
    </div>}
    {interaction && <div className="aid-source-range"><span>依据范围</span>{interaction.anchors.map((anchor) => <button className="anchor-button" key={anchor.blockId} onClick={() => onAnchor(point.id, anchor.blockId)}>原文 {anchor.anchor}</button>)}</div>}
  </div>;
}

function AidPrompt({ point, onOpen }) {
  if (!point.interaction || point.primaryComponent === "none") return null;
  return <button className="aid-inline-prompt" onClick={onOpen}><span>本段有理解互动</span><strong>{point.interaction.cta}</strong><b>在右侧开始 →</b></button>;
}

function Recall({ point, onResult, onAnchor }) {
  const [mode, setMode] = useState("prompt");
  const [answer, setAnswer] = useState("");
  const dimensions = point.recallDimensions || point.anchors;
  const result = useMemo(() => evaluate(answer, dimensions), [answer, dimensions]);
  const submit = () => {
    if (!answer.trim()) return;
    setMode("feedback");
    onResult(result.length > 0 && result.every((item) => item.covered));
  };
  return (
    <section className="recall" aria-label={`${point.title}主动回忆`}>
      <div className="recall-kicker">停一下，试着回忆</div>
      <h3>{point.shortPrompt}</h3>
      {mode === "prompt" && <div className="recall-actions"><button className="primary-link" onClick={() => setMode("answer")}>用自己的话回答</button><button className="text-button" onClick={() => setMode("later")}>稍后再说</button></div>}
      {mode === "later" && <p className="muted">已略过。你可以继续阅读，章节末仍可复盘。</p>}
      {mode === "answer" && <div className="answer-area"><textarea autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="不必使用书中的原句……" /><div><button className="solid-button" onClick={submit}>提交回答</button><button className="text-button" onClick={() => setMode("prompt")}>取消</button></div></div>}
      {mode === "feedback" && <div className="feedback"><p>与你刚读过的内容相比：</p>{result.map((item) => <div className="feedback-row" key={item.id}><span className="feedback-state">{item.covered ? "已提及" : "可补充"}</span><strong>{item.label}</strong><button className="anchor-button" onClick={() => onAnchor(point.id, item.targetBlockId || item.id)}>原文 {item.id}</button></div>)}<details><summary>主动展开原文完整对照</summary><div className="source-compare">{result.map((item) => <p key={item.id}><b>{item.label}：</b>{item.detail || (item.investment ? `${item.investment}；${item.speculation}` : "见对应原文")}</p>)}</div></details></div>}
    </section>
  );
}

function Review({ progress, setProgress, onAnchor }) {
  const [stage, setStage] = useState(1);
  const [answers, setAnswers] = useState(Object.fromEntries(reviewQuestions.map((q) => [q.id, ""])));
  const [transfer, setTransfer] = useState("");
  const finishRecall = () => {
    setProgress((current) => {
      const next = structuredClone(current);
      chapter.knowledgePoints.forEach((point) => {
        const dimensions = evaluateDimensions(answers, point.id);
        const recalled = pointAbility(point, dimensions);
        next[point.id].dimensions = dimensions;
        next[point.id].recalled ||= recalled;
        next[point.id].review = !recalled;
      });
      return next;
    });
    setStage(2);
    requestAnimationFrame(() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <section className="review" id="review">
      <div className="review-header"><div><small>章节结束</small><h2>回想这一章的结构</h2></div><button className="text-button" onClick={() => document.getElementById("chapter-start")?.scrollIntoView({ behavior: "smooth" })}>返回本章原文</button></div>
      <div className="review-stages"><span className={stage === 1 ? "active" : "done"}>1 闭卷回忆</span><span className={stage === 2 ? "active" : ""}>2 对照与复盘</span></div>
      {stage === 1 ? <div className="closed-book"><p className="muted">先不看结构摘要。写下你现在还能想起的内容，也可以跳过。</p>{reviewQuestions.map((q, index) => <label key={q.id}><span>{index + 1}. {q.question}</span><textarea value={answers[q.id]} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="用自己的话回答" /></label>)}<div className="stage-actions"><button className="solid-button" onClick={finishRecall}>完成闭卷回忆</button><button className="text-button" onClick={finishRecall}>跳过，查看结构</button></div></div> : <ReviewStageTwo progress={progress} answers={answers} transfer={transfer} setTransfer={setTransfer} onAnchor={onAnchor} />}
    </section>
  );
}

function ReviewStageTwo({ progress, answers, transfer, setTransfer, onAnchor }) {
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const transferResult = useMemo(() => transferPrinciples.map((principle) => ({ ...principle, ...evaluateSignals(transfer, principle) })), [transfer]);
  return <div className="review-two">
    <div className="node-statuses">{chapter.knowledgePoints.map((point) => { const state = progress[point.id]; const ability = state.recalled ? "能够回忆" : state.explained ? "能够解释" : "仅接触"; return <div className="node-row" key={point.id}><span className="node-dot" /><strong>{point.title}</strong><span>{ability}</span>{state.review && <em>建议复习</em>}</div>; })}</div>
    <section className="structure"><h3>结构梳理</h3>{reviewStructureSummary.map((item, index) => <p key={index}>{item.text}</p>)}</section>
    <section className="review-feedback"><h3>知识维度对照</h3>{Object.entries(knowledgeDimensions).map(([id, dimension]) => { const state = progress[dimension.pointId].dimensions[id]; return <div key={id}><span>{state === "covered" ? "已提及" : "可补充"}</span><p>{dimension.label}</p><button className="anchor-button" onClick={() => onAnchor(dimension.pointId, dimension.anchor)}>原文 {dimension.anchor}</button></div>; })}</section>
    <section className="transfer"><h3>迁移思考</h3><p>{transferQuestion}</p><textarea value={transfer} onChange={(e) => { setTransfer(e.target.value); setTransferSubmitted(false); }} placeholder="说明你的判断依据……" />{!transferSubmitted && <button className="solid-button transfer-submit" disabled={!transfer.trim()} onClick={() => setTransferSubmitted(true)}>提交判断</button>}{transferSubmitted && <div className="transfer-feedback"><p>你的判断使用了这些原则：</p>{transferResult.map((principle) => <div key={principle.id}><span>{principle.covered ? "已使用" : "可补充"}</span><strong>{principle.label}</strong><button className="anchor-button" onClick={() => onAnchor(principle.pointId, principle.anchor)}>原文 {principle.anchor}</button></div>)}</div>}</section>
  </div>;
}

function DebugPanel({ activePoint, openAid, readingState, progress, ratios }) {
  const debugEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get("debug") === "1";
  if (!debugEnabled) return null;
  return <aside className="debug-panel" aria-label="开发状态调试">
    <strong>DEV STATE</strong>
    <dl><dt>contentSource</dt><dd>{sourceMode}</dd><dt>activePoint</dt><dd>{activePoint || "null"}</dd><dt>openAid</dt><dd>{openAid || "null"}</dd><dt>readingState</dt><dd>{readingState}</dd></dl>
    {chapter.knowledgePoints.map((point) => <section key={point.id}><b>{point.id}</b><code>ratio {Number(ratios[point.id] || 0).toFixed(3)}</code><code>{JSON.stringify(progress[point.id])}</code></section>)}
  </aside>;
}

export function App() {
  const [activePoint, setActivePoint] = useState(null);
  const [openAid, setOpenAid] = useState(null);
  const [progress, setProgress] = useState(createInitialProgress);
  const [ratios, setRatios] = useState(Object.fromEntries(chapter.knowledgePoints.map((point) => [point.id, 0])));
  const pointRefs = useRef({});
  const ratiosRef = useRef(Object.fromEntries(chapter.knowledgePoints.map((point) => [point.id, 0])));
  const activePointRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { ratiosRef.current[entry.target.dataset.point] = entry.isIntersecting ? entry.intersectionRatio : 0; });
      setRatios({ ...ratiosRef.current });
      const ranked = Object.entries(ratiosRef.current).sort((a, b) => b[1] - a[1]);
      const [bestId, bestRatio] = ranked[0] || [null, 0];
      const currentId = activePointRef.current;
      const currentRatio = currentId ? ratiosRef.current[currentId] || 0 : 0;
      let nextId = currentId;
      if (bestRatio >= 0.08) {
        if (!currentId || currentRatio < 0.04 || bestId !== currentId && bestRatio - currentRatio >= 0.12) nextId = bestId;
        if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      } else if (!currentId || currentRatio === 0) {
        if (!clearTimerRef.current) clearTimerRef.current = window.setTimeout(() => {
          const latestBest = Math.max(...Object.values(ratiosRef.current));
          if (latestBest < 0.04) {
            activePointRef.current = null;
            setActivePoint(null);
            setOpenAid(null);
          }
          clearTimerRef.current = null;
        }, 220);
      }
      if (nextId !== currentId) {
        activePointRef.current = nextId;
        setActivePoint(nextId);
        setProgress((current) => ({ ...current, [nextId]: { ...current[nextId], exposure: true } }));
        setOpenAid((current) => current === nextId ? current : null);
      }
    }, { rootMargin: "-28% 0px -42% 0px", threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1] });
    Object.values(pointRefs.current).forEach((node) => node && observer.observe(node));
    return () => { observer.disconnect(); if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current); };
  }, []);

  const jumpToAnchor = (pointId, anchor) => {
    const point = chapter.knowledgePoints.find((item) => item.id === pointId);
    const paragraph = typeof anchor === "string" ? point?.paragraphs.find((item) => item.id === anchor) : point?.paragraphs.find((item) => item.anchor === anchor);
    document.getElementById(`${pointId}-anchor-${paragraph?.anchor || anchor}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const point = chapter.knowledgePoints.find((item) => item.id === activePoint);
  const readingState = openAid ? "用户主动深入查看" : activePoint ? "当前关键知识点激活" : "安静阅读";
  const switchChapter = (number) => {
    const url = new URL(window.location.href);
    if (number === "01") url.searchParams.delete("chapter"); else url.searchParams.set("chapter", "2");
    window.location.assign(url);
  };
  return <div className="app-shell">
    <header className="topbar"><span>{chapter.book}</span><div className="chapter-switch" aria-label="章节切换"><button className={chapterNumber === "01" ? "active" : ""} onClick={() => switchChapter("01")}>第 1 章</button><button className={chapterNumber === "02" ? "active" : ""} onClick={() => switchChapter("02")}>第 2 章</button></div><span>{chapter.title}</span><nav><button onClick={() => document.getElementById("chapter-start")?.scrollIntoView({ behavior: "smooth" })}>本章开头</button><button onClick={() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth" })}>章节复盘</button></nav></header>
    <div className="knowledge-nav" aria-label="知识节点">{chapter.knowledgePoints.map((item) => <button key={item.id} className={activePoint === item.id ? "active" : ""} onClick={() => pointRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}><span className={`node-mark ${progress[item.id].recalled ? "recalled" : ""}`} />{item.title}<small>{progress[item.id].recalled ? "能够回忆" : progress[item.id].explained ? "能够解释" : progress[item.id].exposure ? "仅接触" : ""}</small></button>)}</div>
    <main className="reading-layout">
      <article className="article" id="chapter-start"><p className="eyebrow">{chapter.book}</p><h1>{chapter.title}</h1><div className="chapter-meta"><span>完整章节</span><span>{chapter.stats?.blocks || "—"} 个原文块</span><span>{chapter.stats?.knowledgePoints || chapter.knowledgePoints.length} 个知识节点</span><span>{chapter.stats?.assistedPoints || "—"} 个辅助结构</span></div><p className="lead">{chapter.intro}</p>
        {(chapter.readingSegments || chapter.knowledgePoints.map((kp) => ({ id: kp.id, pointId: kp.id, blocks: kp.paragraphs }))).map((segment) => {
          if (!segment.pointId) return <section className="quiet-prose" key={segment.id}>{segment.blocks.map((block) => <ReadingBlock key={block.id} block={block} />)}</section>;
          const kp = chapter.knowledgePoints.find((item) => item.id === segment.pointId);
          return <div key={segment.id}>
            <div className="knowledge-unit" data-point={kp.id} ref={(node) => { pointRefs.current[kp.id] = node; }}>
              <section className={`knowledge-section ${activePoint === kp.id ? "is-active" : ""}`}><div className="section-heading"><div><small>知识点</small><h2>{kp.title}</h2></div></div>{segment.blocks.map((block) => { const paragraph = kp.paragraphs.find((item) => item.id === block.id); return <p id={`${kp.id}-anchor-${paragraph.anchor}`} key={block.id} className="anchored-paragraph"><button className="inline-anchor" onClick={() => setOpenAid(kp.id)}>{paragraph.anchor}</button>{block.text}</p>; })}</section>
              <AidPrompt point={kp} onOpen={() => { pointRefs.current[kp.id]?.scrollIntoView({ behavior: "auto", block: "center" }); setActivePoint(kp.id); activePointRef.current = kp.id; setOpenAid(kp.id); }} />
            </div>
            <Recall point={kp} onAnchor={jumpToAnchor} onResult={(success) => setProgress((current) => ({ ...current, [kp.id]: { ...current[kp.id], explained: success || current[kp.id].explained } }))} />
          </div>;
        })}
      </article>
      <KnowledgeAid point={point} open={openAid === activePoint} onOpen={() => setOpenAid(activePoint)} onClose={() => setOpenAid(null)} onAnchor={jumpToAnchor} />
    </main>
    <Review progress={progress} setProgress={setProgress} onAnchor={jumpToAnchor} />
    <DebugPanel activePoint={activePoint} openAid={openAid} readingState={readingState} progress={progress} ratios={ratios} />
  </div>;
}
