import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export type Paper = "a4" | "letter";

function errorDetail(error: unknown): string {
  const { stderr, message } = error as { stderr?: string; message?: string };
  return (stderr || message || String(error)).trim();
}

/**
 * Returns the path of the compiled renderer, compiling the Swift source first when the binary is
 * missing or older than the source. `onCompile` fires only when a compile is actually needed.
 */
export async function ensureRenderer(sourcePath: string, binDir: string, onCompile?: () => void): Promise<string> {
  const binPath = join(binDir, "html2pdf");
  const [source, binary] = await Promise.all([stat(sourcePath), stat(binPath).catch(() => undefined)]);
  if (binary && binary.mtimeMs >= source.mtimeMs) return binPath;

  onCompile?.();
  await mkdir(binDir, { recursive: true });
  try {
    await run("/usr/bin/swiftc", ["-O", "-swift-version", "5", "-parse-as-library", "-o", binPath, sourcePath], {
      timeout: 180_000,
    });
  } catch (error) {
    throw new Error(
      `Could not compile the PDF renderer (needs the Xcode Command Line Tools: xcode-select --install). ${errorDetail(error)}`,
    );
  }
  return binPath;
}

/** Prints `html` to a paginated PDF at `outputPath` using the WebKit-based renderer. */
export async function htmlToPdf(html: string, outputPath: string, options: { renderer: string; paper: Paper }) {
  const workDir = await mkdtemp(join(tmpdir(), "markdown-to-pdf-"));
  try {
    const htmlPath = join(workDir, "document.html");
    await writeFile(htmlPath, html, "utf8");
    await run(options.renderer, [htmlPath, outputPath, options.paper], { timeout: 120_000 });
  } catch (error) {
    throw new Error(`The PDF renderer failed. ${errorDetail(error)}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

/** `dir/Name.pdf`, or `dir/Name (2).pdf`, `dir/Name (3).pdf`… when that name is already taken. */
export async function uniquePath(dir: string, baseName: string, extension: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const candidate = join(dir, attempt === 1 ? `${baseName}${extension}` : `${baseName} (${attempt})${extension}`);
    try {
      await access(candidate);
    } catch {
      return candidate;
    }
  }
}
