const endpoint = "https://api.openai.com/v1/responses";

export async function runModelStage({ stage, rule, prompt, previous }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) throw new Error("model 模式需要 OPENAI_API_KEY 和 OPENAI_MODEL；未调用模型，也不会回退为 fixture。 ");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: `你正在执行内容流水线第 ${stage} 阶段。只输出 JSON。\n\n规则：\n${rule}\n\n任务：\n${prompt}` },
        { role: "user", content: JSON.stringify(previous) }
      ],
      text: { format: { type: "json_object" } }
    })
  });
  if (!response.ok) throw new Error(`模型调用失败 (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const output = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!output) throw new Error("模型没有返回 JSON 文本");
  return JSON.parse(output);
}
