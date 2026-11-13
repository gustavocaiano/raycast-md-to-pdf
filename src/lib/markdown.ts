import hljs from "highlight.js/lib/common";
import { Marked, type Token, type Tokens } from "marked";
import { stylesheet } from "./styles";

const MAX_TITLE_LENGTH = 60;
const MAX_KEPT_BLOCK_LINES = 14;

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Single newlines become line breaks, like chat UIs and GitHub comments render agent answers.
const marked = new Marked({ gfm: true, breaks: true });

marked.use({
  renderer: {
    code({ text, lang }: Tokens.Code): string {
      const language = (lang ?? "").trim().split(/\s+/)[0].toLowerCase();
      // No auto-detection: unlabelled blocks (logs, file trees) are better left uncoloured than guessed at.
      const body =
        language && hljs.getLanguage(language)
          ? hljs.highlight(text, { language, ignoreIllegals: true }).value
          : escapeHtml(text);
      return `<pre><code class="hljs">${body}</code></pre>\n`;
    },
  },
});

const lineCount = (text: string) => text.split("\n").length;

/** Whether a block is short enough to be kept on one page together with the line that introduces it. */
function isCompact(token: Token): boolean {
  switch (token.type) {
    case "paragraph":
      return true;
    case "code":
      return lineCount((token as Tokens.Code).text) <= MAX_KEPT_BLOCK_LINES;
    case "blockquote":
      return lineCount((token as Tokens.Blockquote).text) <= MAX_KEPT_BLOCK_LINES;
    case "list":
      return (token as Tokens.List).items.length <= 6;
    case "table":
      return (token as Tokens.Table).rows.length <= 8;
    default:
      return false;
  }
}

/** A heading, or a paragraph ending in a colon ("Example:"), introduces whatever block follows it. */
function isLead(token: Token): boolean {
  return token.type === "heading" || (token.type === "paragraph" && /:\s*$/.test((token as Tokens.Paragraph).text));
}

/** Index of the compact block that the lead at `start` (plus any headings right after it) introduces. */
function introducedBlock(tokens: Token[], start: number): number | undefined {
  let last = start;
  for (;;) {
    let next = last + 1;
    while (tokens[next]?.type === "space") next++;
    const token = tokens[next];
    if (!token) return undefined;
    if (token.type === "heading" && tokens[start].type === "heading") {
      last = next;
      continue;
    }
    return isCompact(token) ? next : undefined;
  }
}

/**
 * WebKit's print pagination ignores `break-after: avoid`, so a heading can end up alone at the bottom of a page.
 * Wrapping it with the compact block it introduces in a `break-inside: avoid` container keeps them together.
 */
function keepLeadsWithNext(tokens: Token[]): Token[] {
  const open: Tokens.HTML = {
    type: "html",
    raw: '<div class="keep">\n',
    text: '<div class="keep">\n',
    pre: false,
    block: true,
  };
  const close: Tokens.HTML = { type: "html", raw: "</div>\n", text: "</div>\n", pre: false, block: true };

  const result: Token[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const end = isLead(tokens[index]) ? introducedBlock(tokens, index) : undefined;
    if (end === undefined) {
      result.push(tokens[index]);
      continue;
    }
    result.push(open, ...tokens.slice(index, end + 1), close);
    index = end;
  }
  return result;
}

export function markdownToHtmlDocument(source: string, title: string): string {
  const body = marked.parser(keepLeadsWithNext(marked.lexer(source)));
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${stylesheet}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function stripMarkdown(line: string): string {
  return line
    .replace(/^(#{1,6}\s+|>\s*|[-*+]\s+(\[[ xX]\]\s+)?|\d+[.)]\s+)/, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+#+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first line of the document, without Markdown syntax, shortened to something usable as a file name. */
export function extractTitle(source: string): string {
  const firstLine = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== "" && !/^(```|~~~)/.test(line));
  const text = stripMarkdown(firstLine ?? "");
  if (text === "") return "Document";
  if (text.length <= MAX_TITLE_LENGTH) return text;
  return `${text.slice(0, MAX_TITLE_LENGTH).replace(/\s+\S*$/, "")}…`;
}

export function fileNameFromTitle(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\p{Cc}/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^[.\s-]+|[.\s-]+$/g, "");
  return cleaned.slice(0, 80) || "Document";
}
