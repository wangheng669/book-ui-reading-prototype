import { useEffect, useMemo, useRef, useState } from "react";
import { chapter, reviewQuestions, transferQuestion } from "./content.js";

const initialProgress = Object.fromEntries(chapter.knowledgePoints.map((p) => [p.id, { exposure: false, explained: false, recalled: false, review: false }]));

function evaluate(text, anchors) {
  const source = text.trim();
  return anchors.map((item) => ({ ...item, covered: item.keywords.some((word) => source.includes(word)) }));
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
            <div><small>当前知识点</small><h3>{point.title}</h3></div>
            <button className="text-button" onClick={onClose}>收起</button>
          </div>
          <div className="vertical-compare">
            {point.anchors.map((item) => (
              <section key={item.id} className="compare-item">
                <button className="anchor-button" onClick={() => onAnchor(point.id, item.id)}>原文 {item.id}</button>
                <h4>{item.label}</h4>
                {item.investment ? (
                  <div className="compare-pair">
                    <div><small>投资</small><p>{item.investment}</p></div>
                    <div><small>投机</small><p>{item.speculation}</p></div>
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
  const result = useMemo(() => evaluate(answer, point.anchors), [answer, point.anchors]);
  const submit = () => {
    if (!answer.trim()) return;
    setMode("feedback");
    onResult(result.filter((r) => r.covered).length >= 2);
  };
  return (
    <section className="recall" aria-label={`${point.title}主动回忆`}>
      <div className="recall-kicker">停一下，试着回忆</div>
      <h3>{point.shortPrompt}</h3>
      {mode === "prompt" && <div className="recall-actions"><button className="primary-link" onClick={() => setMode("answer")}>用自己的话回答</button><button className="text-button" onClick={() => setMode("later")}>稍后再说</button></div>}
      {mode === "later" && <p className="muted">已略过。你可以继续阅读，章节末仍可复盘。</p>}
      {mode === "answer" && <div className="answer-area"><textarea autoFocus value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="不必使用书中的原句……" /><div><button className="solid-button" onClick={submit}>提交回答</button><button className="text-button" onClick={() => setMode("prompt")}>取消</button></div></div>}
      {mode === "feedback" && <div className="feedback"><p>与你刚读过的内容相比：</p>{result.map((item) => <div className="feedback-row" key={item.id}><span className="feedback-state">{item.covered ? "已提及" : "可补充"}</span><strong>{item.label}</strong><button className="anchor-button" onClick={() => onAnchor(point.id, item.id)}>原文 {item.id}</button></div>)}<details><summary>主动展开原文完整对照</summary><div className="source-compare">{result.map((item) => <p key={item.id}><b>{item.label}：</b>{item.investment ? `${item.investment}；${item.speculation}` : item.detail}</p>)}</div></details></div>}
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
      reviewQuestions.forEach((question) => {
        const recalled = question.keywords.some((key) => answers[question.id].includes(key));
        next[question.pointId].recalled ||= recalled;
        next[question.pointId].review ||= !recalled;
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
  return <div className="review-two">
    <div className="node-statuses">{chapter.knowledgePoints.map((point) => { const state = progress[point.id]; const ability = state.recalled ? "能够回忆" : state.explained ? "能够解释" : "仅接触"; return <div className="node-row" key={point.id}><span className="node-dot" /><strong>{point.title}</strong><span>{ability}</span>{state.review && <em>建议复习</em>}</div>; })}</div>
    <section className="structure"><h3>结构梳理</h3><p><b>投资：</b>分析依据 → 安全边际 → 本金安全与合理回报</p><p><b>投机：</b>价格预期 → 短期波动收益 → 更高不确定性</p><p><b>共同条件：</b>判断永远可能出错，因此需要为错误保留缓冲。</p></section>
    <section className="review-feedback"><h3>闭卷回答中的遗漏</h3>{reviewQuestions.map((q, index) => { const missing = !q.keywords.some((key) => answers[q.id].includes(key)); return <div key={q.id}><span>{missing ? "可补充" : "已提及"}</span><p>{q.question}</p><button className="anchor-button" onClick={() => onAnchor(q.pointId, index % 3 + 1)}>原文 {index + 1}</button></div>; })}</section>
    <section className="transfer"><h3>迁移思考</h3><p>{transferQuestion}</p><textarea value={transfer} onChange={(e) => setTransfer(e.target.value)} placeholder="说明你的判断依据……" /><p className="muted">反馈关注：是否使用了过程、证据与风险态度，而不是答案措辞。</p></section>
  </div>;
}

export function App() {
  const [activePoint, setActivePoint] = useState(null);
  const [openAid, setOpenAid] = useState(null);
  const [progress, setProgress] = useState(initialProgress);
  const pointRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const id = visible?.target.dataset.point || null;
      setActivePoint(id);
      if (id) setProgress((current) => ({ ...current, [id]: { ...current[id], exposure: true } }));
      setOpenAid((current) => current === id ? current : null);
    }, { rootMargin: "-28% 0px -42% 0px", threshold: [0.1, 0.35, 0.65] });
    Object.values(pointRefs.current).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const jumpToAnchor = (pointId, anchor) => {
    document.getElementById(`${pointId}-anchor-${anchor}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const point = chapter.knowledgePoints.find((item) => item.id === activePoint);
  return <div className="app-shell">
    <header className="topbar"><span>{chapter.book}</span><span>{chapter.title}</span><nav><button onClick={() => document.getElementById("chapter-start")?.scrollIntoView({ behavior: "smooth" })}>本章开头</button><button onClick={() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth" })}>章节复盘</button></nav></header>
    <div className="knowledge-nav" aria-label="知识节点">{chapter.knowledgePoints.map((item) => <button key={item.id} className={activePoint === item.id ? "active" : ""} onClick={() => pointRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}><span className={`node-mark ${progress[item.id].recalled ? "recalled" : ""}`} />{item.title}<small>{progress[item.id].recalled ? "能够回忆" : progress[item.id].explained ? "能够解释" : progress[item.id].exposure ? "仅接触" : ""}</small></button>)}</div>
    <main className="reading-layout">
      <article className="article" id="chapter-start"><p className="eyebrow">{chapter.title}</p><h1>投资、投机与安全边际</h1><p className="lead">{chapter.intro}</p><section className="quiet-prose"><h2>先区分行为，再讨论收益</h2><p>在金融市场中，许多讨论都直接落在“赚了还是亏了”。如果赚了，就被说成投资；如果亏了，就被视作投机。这种看法看似直观，却错把结果当成了标准。</p><p>更可靠的方式是先看行为本身，再看结果如何。市场的涨跌只是检验行为的外部环境，并不定义行为。</p></section>
        {chapter.knowledgePoints.map((kp, pointIndex) => <div key={kp.id}>
          <section className={`knowledge-section ${activePoint === kp.id ? "is-active" : ""}`} data-point={kp.id} ref={(node) => { pointRefs.current[kp.id] = node; }}><div className="section-heading"><span>{String(pointIndex + 1).padStart(2, "0")}</span><div><small>知识点</small><h2>{kp.title}</h2></div></div>{kp.paragraphs.map((paragraph) => <p id={`${kp.id}-anchor-${paragraph.anchor}`} key={paragraph.anchor} className="anchored-paragraph"><button className="inline-anchor" onClick={() => setOpenAid(kp.id)}>{paragraph.anchor}</button>{paragraph.text}</p>)}</section>
          <section className="quiet-prose"><p>{pointIndex === 0 ? "真正能让人走得更远的，是建立在独立思考、充分证据与理性自律之上的投资流程。先把行为分清楚，才能在面对诱惑与波动时守住应有的选择。" : "安全边际并不消除不确定性，它只是承认不确定性，并在决策中为判断失误留下余地。这也是稳健投资与自信预测之间最重要的差别。"}</p></section>
          <Recall point={kp} onAnchor={jumpToAnchor} onResult={(success) => setProgress((current) => ({ ...current, [kp.id]: { ...current[kp.id], explained: success || current[kp.id].explained } }))} />
          {pointIndex === 0 && <section className="quiet-prose bridge"><h2>从行为判断走向风险控制</h2><p>区分投资与投机之后，下一个问题是：即使分析过程合理，我们又该怎样面对不可避免的错误？这需要一种不依赖完美预测的保护机制。</p><p>投资者无法控制市场的短期方向，但可以控制自己愿意付出的价格、接受的假设，以及在不确定条件下保留多少余地。</p></section>}
        </div>)}
      </article>
      <KnowledgeAid point={point} open={openAid === activePoint} onOpen={() => setOpenAid(activePoint)} onClose={() => setOpenAid(null)} onAnchor={jumpToAnchor} />
    </main>
    <Review progress={progress} setProgress={setProgress} onAnchor={jumpToAnchor} />
  </div>;
}
