import { Clipboard, environment, getPreferenceValues, open, showHUD, showInFinder } from "@raycast/api";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { extractTitle, fileNameFromTitle, markdownToHtmlDocument } from "./lib/markdown";
import { addToDropover } from "./lib/dropover";
import { ensureRenderer, htmlToPdf, uniquePath } from "./lib/pdf";

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();

  const source = (await Clipboard.readText())?.trim();
  if (!source) {
    await showHUD("The clipboard has no text. Copy some Markdown first.");
    return;
  }

  try {
    const title = extractTitle(source);
    const folder = preferences.outputFolder || join(homedir(), "Downloads");
    await mkdir(folder, { recursive: true });
    const pdfPath = await uniquePath(folder, fileNameFromTitle(title), ".pdf");

    const renderer = await ensureRenderer(
      join(environment.assetsPath, "html2pdf.swift"),
      environment.supportPath,
      () => void showHUD("Preparing the PDF renderer (first run only)…"),
    );
    await htmlToPdf(markdownToHtmlDocument(source, title), pdfPath, {
      renderer,
      paper: preferences.paperSize === "letter" ? "letter" : "a4",
    });

    await Clipboard.copy({ file: pdfPath });
    const name = basename(pdfPath);

    if (preferences.afterGenerating === "dropover") {
      const added = await addToDropover(pdfPath);
      await showHUD(added ? `PDF copied and added to Dropover: ${name}` : `PDF copied (Dropover not found): ${name}`);
      return;
    }

    await showHUD(`PDF copied to the clipboard: ${name}`);
    if (preferences.afterGenerating === "open") await open(pdfPath);
    if (preferences.afterGenerating === "reveal") await showInFinder(pdfPath);
  } catch (error) {
    console.error(error);
    await showHUD(`Could not generate the PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
