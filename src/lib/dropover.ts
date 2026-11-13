import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Dropover 5 ignores files opened with it (`open -b me.damir.dropover-mac`), but its "Add to Dropover" service
// (the one in the Services menu) puts them on a new shelf. A private pasteboard keeps the user's clipboard intact.
const ADD_TO_DROPOVER = `
ObjC.import("AppKit");
function run(argv) {
  const pasteboard = $.NSPasteboard.pasteboardWithUniqueName;
  pasteboard.clearContents;
  pasteboard.writeObjects($([$.NSURL.fileURLWithPath(argv[0])]));
  const performed = $.NSPerformService($("Add to Dropover"), pasteboard);
  pasteboard.releaseGlobally;
  return performed;
}`;

/** Puts `file` on a new Dropover shelf. Resolves to false when Dropover (or its service) is not available. */
export async function addToDropover(file: string): Promise<boolean> {
  try {
    const { stdout } = await run("/usr/bin/osascript", ["-l", "JavaScript", "-e", ADD_TO_DROPOVER, file], {
      timeout: 15_000,
    });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}
