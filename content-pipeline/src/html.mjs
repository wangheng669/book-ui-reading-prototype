import fs from "node:fs";
import crypto from "node:crypto";
import { load } from "cheerio";

const tags = "h1,h2,h3,h4,h5,h6,p,blockquote,ul,ol,li,table,figure,figcaption";
const roles = { p: "paragraph", blockquote: "quote", ul: "list", ol: "list", li: "list-item", table: "table", figure: "figure", figcaption: "caption" };

function selectorFor($, element) {
  const parts = [];
  let node = element;
  while (node?.type === "tag" && node.tagName !== "html") {
    const tag = node.tagName.toLowerCase();
    const id = $(node).attr("id");
    if (id) { parts.unshift(`${tag}#${id.replace(/[^a-zA-Z0-9_-]/g, "\\$&")}`); break; }
    const siblings = $(node).parent().children(tag).toArray();
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag);
    node = node.parent;
  }
  return parts.join(" > ");
}

function normalizedText($element) {
  const clone = $element.clone();
  clone.find("script,style,noscript").remove();
  return clone.text().replace(/\s+/g, " ").trim();
}

export function extractSemanticBlocks({ inputPath, selector, chapterId }) {
  const html = fs.readFileSync(inputPath, "utf8");
  const $ = load(html, { decodeEntities: false });
  $("script,style,noscript,nav,form").remove();
  const root = selector ? $(selector) : $("main").length ? $("main").first() : $("body").first();
  if (!root.length) throw new Error(`CSS selector 不存在: ${selector}`);
  const headings = [];
  const candidates = root.find(tags).addBack(tags).toArray().filter((element) => {
    const tag = element.tagName.toLowerCase();
    if ((tag === "ul" || tag === "ol") && $(element).children("li").length) return false;
    if (tag === "figcaption" && $(element).parents("figure").length) return false;
    return normalizedText($(element)).length > 0 || tag === "figure";
  });
  return candidates.map((element, index) => {
    const tagName = element.tagName.toLowerCase();
    const level = /^h[1-6]$/.test(tagName) ? Number(tagName[1]) : null;
    const text = normalizedText($(element)) || $(element).find("img").attr("alt") || "图示";
    const parentHeading = level ? headings.filter((h) => h.level < level).at(-1)?.text ?? null : headings.at(-1)?.text ?? null;
    if (level) {
      while (headings.at(-1)?.level >= level) headings.pop();
      headings.push({ level, text });
    }
    const sourceHtml = $.html(element).trim();
    const fingerprint = crypto.createHash("sha1").update(`${tagName}\0${text}`).digest("hex").slice(0, 8);
    return {
      id: `${chapterId}-block-${String(index + 1).padStart(3, "0")}`,
      order: index + 1,
      tagName,
      role: level ? "heading" : roles[tagName],
      headingLevel: level,
      parentHeading,
      sourceSelector: selectorFor($, element),
      sourceHtml,
      text,
      fingerprint
    };
  });
}
