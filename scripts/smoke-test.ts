import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { extractTitle, fileNameFromTitle, markdownToHtmlDocument } from "../src/lib/markdown";
import { ensureRenderer, htmlToPdf } from "../src/lib/pdf";

// Runs the same pipeline as the Raycast command, minus the clipboard, so it can be tried from a terminal:
//   npm run smoke [file.md] [a4|letter]
// Output goes to ./build (the PDF plus last.html, the HTML that was printed).
async function main() {
  const root = resolve(__dirname, "..");
  const input = process.argv[2] ?? join(root, "scripts", "sample.md");
  const paper = process.argv[3] === "letter" ? "letter" : "a4";

  const source = await readFile(input, "utf8");
  const buildDir = join(root, "build");
  await mkdir(buildDir, { recursive: true });

  const title = extractTitle(source);
  const html = markdownToHtmlDocument(source, title);
  const outputPath = join(buildDir, `${fileNameFromTitle(title)}.pdf`);
  await writeFile(join(buildDir, "last.html"), html, "utf8");

  console.time("renderer ready");
  const renderer = await ensureRenderer(join(root, "assets", "html2pdf.swift"), buildDir, () =>
    console.log("compiling the Swift renderer (first run only)…"),
  );
  console.timeEnd("renderer ready");

  console.time("pdf");
  await htmlToPdf(html, outputPath, { renderer, paper });
  console.timeEnd("pdf");

  const { size } = await stat(outputPath);
  console.log(`title: ${title}\nfile:  ${outputPath} (${size} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
