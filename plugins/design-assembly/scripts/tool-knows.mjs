// Whether the repository's own copy of the tool, the one its gate runs, reads a part of the contract
// a newer plugin added. A command that writes such a part on a repository whose copy predates it
// would turn that gate red with a sentence about a shape it never knew; it says instead that the
// tool is brought up with upgrade first.
//
// The copy is read as text and never run: it knows the part when the file of the copy that would
// read it names the word that part is read by. The copy decides, not the stamp: the stamp says which
// version the copy came from, not what a copy changed since, or one with no stamp, reads; and the
// version that brings a part is not fixed until the pull request that carries it is merged.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { TOOL_COPY } from "./stamp.mjs";

// Null when the repository has no copy of the tool (a command that lays the tool lays the newer
// one), or when its copy knows the part; else the sentence that says why nothing is written.
// `file` is the file of the copy, `word` the name it reads the part by, `part` the part as a person
// reads it, `what` what would be written: a row, or a question.
export function toolPredates(root, { file, word, part, what = "row" }) {
  const copy = path.join(root, TOOL_COPY);
  if (!existsSync(copy)) return null;
  let text;
  try {
    text = readFileSync(path.join(copy, file), "utf8");
  } catch {
    text = "";
  }
  if (text.includes(word)) return null;
  return `the repository's copy of the tool, ${TOOL_COPY}, predates ${part}, so its gate would read the ${what} as broken: bring the tool up with upgrade first`;
}
