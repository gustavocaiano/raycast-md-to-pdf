/** Print stylesheet for the generated PDF: GitHub-flavoured typography with a light highlight.js theme. */
export const stylesheet = `
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

body {
  margin: 0;
  /* WebKit clips the printed page about 1 pt short of the right margin; this keeps right-hand borders visible. */
  padding: 0 3px;
  font-family: -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1f2328;
  overflow-wrap: break-word;
}

h1, h2, h3, h4, h5, h6 { margin: 1.5em 0 0.6em; font-weight: 600; line-height: 1.25; }
h1 { margin-top: 0; padding-bottom: 0.3em; font-size: 1.9em; border-bottom: 1px solid #d1d9e0; }
h2 { padding-bottom: 0.25em; font-size: 1.45em; border-bottom: 1px solid #d1d9e0; }
h3 { font-size: 1.2em; }
h4 { font-size: 1.05em; }
h5, h6 { font-size: 1em; color: #59636e; }

p, ul, ol, blockquote, pre, table { margin: 0 0 0.9em; }
p { orphans: 3; widows: 3; }
/* WebKit's print pagination ignores break-after: avoid, so markdown.ts wraps a heading or an "Example:" line
   together with the short block it introduces in .keep instead. */
.keep { break-inside: avoid; page-break-inside: avoid; }
ul, ol { padding-left: 1.7em; }
li + li { margin-top: 0.25em; }
li > p { margin: 0.3em 0; }
li > ul, li > ol { margin: 0.25em 0 0; }
li:has(> input[type="checkbox"]) { list-style: none; }
input[type="checkbox"] { margin: 0 0.45em 0 -1.4em; vertical-align: -0.1em; }

a { color: #0969da; text-decoration: none; }
strong { font-weight: 600; }
hr { margin: 1.6em 0; border: 0; border-top: 1px solid #d1d9e0; }
img { max-width: 100%; height: auto; break-inside: avoid; }

blockquote { margin-left: 0; padding: 0 1em; color: #59636e; border-left: 0.25em solid #d1d9e0; break-inside: avoid; }
blockquote > :last-child { margin-bottom: 0; }

code {
  padding: 0.15em 0.35em;
  font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 0.88em;
  background: #eff1f3;
  border-radius: 4px;
}
pre {
  padding: 0.8em 1em;
  font-size: 0.85em;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f6f8fa;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
}
pre code { padding: 0; font-size: 1em; background: none; border-radius: 0; }

table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
tr { break-inside: avoid; }
th, td { padding: 0.4em 0.7em; text-align: left; vertical-align: top; border: 1px solid #d1d9e0; }
/* Column alignment from the Markdown (:---: and ---:), which marked emits as align attributes. */
th[align="center"], td[align="center"] { text-align: center; }
th[align="right"], td[align="right"] { text-align: right; }
th { font-weight: 600; background: #f6f8fa; }

.hljs { color: #24292e; }
.hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-doctag, .hljs-template-tag, .hljs-type { color: #d73a49; }
.hljs-title, .hljs-section { color: #6f42c1; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-number, .hljs-operator, .hljs-variable,
.hljs-selector-attr, .hljs-selector-class, .hljs-selector-id, .hljs-meta { color: #005cc5; }
.hljs-string, .hljs-regexp, .hljs-meta .hljs-string { color: #032f62; }
.hljs-built_in, .hljs-symbol, .hljs-bullet { color: #e36209; }
.hljs-name, .hljs-tag { color: #22863a; }
.hljs-addition { color: #22863a; background: #f0fff4; }
.hljs-deletion { color: #b31d28; background: #ffeef0; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: 700; }
`;
