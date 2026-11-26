// Whether the copy of the tool a repository has installed knows what a newer plugin would write
// for it to read: a kind of source, a check. It asks the copy itself, by the words its files hold,
// as `core --join` asks it for the check of locked answers: the copy is what the gate runs, so a
// stamp that says a version is not enough (a copy may be changed after it was stamped, and an old
// one may have no stamp). A repository with no copy has no gate to turn red: the run that lays the
// tool lays this plugin's own.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { TOOL_COPY } from "./stamp.mjs";

// True when the repository has no copy of the tool, or when each file of its copy named holds the
// word given for it.
export function installedToolKnows(root, words) {
  const folder = path.join(root, TOOL_COPY);
  if (!existsSync(path.join(folder, "check.mjs"))) return true;
  return Object.entries(words).every(([file, word]) => {
    try {
      return readFileSync(path.join(folder, file), "utf8").includes(word);
    } catch {
      return false;
    }
  });
}
