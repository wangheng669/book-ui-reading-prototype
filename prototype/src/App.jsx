import { useEffect, useMemo, useRef, useState } from "react";
import { chapter, knowledgeDimensions, reviewQuestions, reviewStructureSummary, sourceMode, transferPrinciples, transferQuestion } from "./contentSource.js";

const initialProgress = Object.fromEntries(chapter.knowledgePoints.map((p) => [p.id, {
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

function KnowledgeAid({ point, open, onOpen, onClose, onAnchor }) {
  if (!point) return <aside className="knowledge-aid knowledge-aid--empty" aria-hidden="true" />;
  return (
    <aside className={`knowledge-aid ${open ? "knowledge-aid--open" : ""}`} aria-label={`${point.title}辅助内容`}>
      {!open ? (
        <button className="aid-peek" onClick={onOpen}>
          <span>{point.title}</span>
          <small>查看关系</small>
        </button>
      ) : (
        <div className="aid-panel">
          <div className="aid-heading">
            <div><small>当前知识点</small><h3>{point.aidTitle || point.title}</h3></div>
            <button className="text-button" onClick={onClose}>收起</button>
          </div>
          <div className="vertical-compare">
            {(point.aidItems || point.anchors).map((item) => (
              <section key={item.id} className="compare-item">
                <button className="anchor-button" onClick={() => onAnchor(point.id, item.targetBlockId || item.id)}>原文 {item.id}</button>
                <h4>{item.label}</h4>
                {(item.left || item.investment) ? (
                  <div className="compare-pair">
                    <div><small>{point.comparisonLabels?.[0] || "投资"}</small><p>{item.left || item.investment}</p></div>
                    <div><small>{point.comparisonLabels?.[1] || "投机"}</small><p>{item.right || item.speculation}</p></div>
                  </div>
                ) : <p className="detail-copy">{item.detail}</p>}
              </section>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
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
  if (!import.meta.env.DEV) return null;
  return <aside className="debug-panel" aria-label="开发状态调试">
    <strong>DEV STATE</strong>
    <dl><dt>contentSource</dt><dd>{sourceMode}</dd><dt>activePoint</dt><dd>{activePoint || "null"}</dd><dt>openAid</dt><dd>{openAid || "null"}</dd><dt>readingState</dt><dd>{readingState}</dd></dl>
    {chapter.knowledgePoints.map((point) => <section key={point.id}><b>{point.id}</b><code>ratio {Number(ratios[point.id] || 0).toFixed(3)}</code><code>{JSON.stringify(progress[point.id])}</code></section>)}
  </aside>;
}

export function App() {
  const [activePoint, setActivePoint] = useState(null);
  const [openAid, setOpenAid] = useState(null);
  const [progress, setProgress] = useState(initialProgress);
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
  return <div className="app-shell">
    <header className="topbar"><span>{chapter.book}</span><span>{chapter.title}</span><nav><button onClick={() => document.getElementById("chapter-start")?.scrollIntoView({ behavior: "smooth" })}>本章开头</button><button onClick={() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth" })}>章节复盘</button></nav></header>
    <div className="knowledge-nav" aria-label="知识节点">{chapter.knowledgePoints.map((item) => <button key={item.id} className={activePoint === item.id ? "active" : ""} onClick={() => pointRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}><span className={`node-mark ${progress[item.id].recalled ? "recalled" : ""}`} />{item.title}<small>{progress[item.id].recalled ? "能够回忆" : progress[item.id].explained ? "能够解释" : progress[item.id].exposure ? "仅接触" : ""}</small></button>)}</div>
    <main className="reading-layout">
      <article className="article" id="chapter-start"><p className="eyebrow">{chapter.book}</p><h1>{chapter.title}</h1><p className="lead">{chapter.intro}</p>
        {chapter.knowledgePoints.map((kp, pointIndex) => <div key={kp.id}>
          <section className={`knowledge-section ${activePoint === kp.id ? "is-active" : ""}`} data-point={kp.id} ref={(node) => { pointRefs.current[kp.id] = node; }}><div className="section-heading"><span>{String(pointIndex + 1).padStart(2, "0")}</span><div><small>知识点</small><h2>{kp.title}</h2></div></div>{kp.paragraphs.map((paragraph) => <p id={`${kp.id}-anchor-${paragraph.anchor}`} key={paragraph.id || paragraph.anchor} className="anchored-paragraph"><button className="inline-anchor" onClick={() => setOpenAid(kp.id)}>{paragraph.anchor}</button>{paragraph.text}</p>)}</section>
          <Recall point={kp} onAnchor={jumpToAnchor} onResult={(success) => setProgress((current) => ({ ...current, [kp.id]: { ...current[kp.id], explained: success || current[kp.id].explained } }))} />
        </div>)}
      </article>
      <KnowledgeAid point={point} open={openAid === activePoint} onOpen={() => setOpenAid(activePoint)} onClose={() => setOpenAid(null)} onAnchor={jumpToAnchor} />
    </main>
    <Review progress={progress} setProgress={setProgress} onAnchor={jumpToAnchor} />
    <DebugPanel activePoint={activePoint} openAid={openAid} readingState={readingState} progress={progress} ratios={ratios} />
  </div>;
}
