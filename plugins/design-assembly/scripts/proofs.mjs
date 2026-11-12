// Finds the proofs a repository already runs for standard decisions: a lint rule, a guard tool, a
// tagged test. One detector, used by the audit (to say what it sees) and by adopting (to add the
// row), so the two never give different answers about the same repository.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pointerProblem } from "../templates/tools/design-assembly/ledger.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROOFS = JSON.parse(
  readFileSync(path.join(HERE, "../references/known-proofs.json"), "utf8"),
).proofs;

const STANDARD = JSON.parse(
  readFileSync(path.join(HERE, "../references/standard-decisions.json"), "utf8"),
).decisions;

// A repository's own test that names a standard decision with `decision:<id>` is a proof of it:
// the tag is how a ledger row points at a test. Read from the usual test folders.
function taggedTests(root) {
  const found = [];
  const walk = (dir) => {
    const full = path.join(root, dir);
    if (!existsSync(full)) return;
    for (const name of readdirSync(full).sort()) {
      const file = path.posix.join(dir, name);
      if (statSync(path.join(root, file)).isDirectory()) walk(file);
      else if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(name)) {
        const text = readFileSync(path.join(root, file), "utf8");
        const kind = /(^|\/)e2e\/|\.spec\./.test(file) ? "e2e" : "test";
        for (const tag of text.matchAll(/decision:([a-z][a-z0-9-]*)/g)) {
          found.push({ id: tag[1], check: `${kind}:${file}` });
        }
      }
    }
  };
  walk("tests");
  return found;
}

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// Every known proof whose marks are in the repository. `problem` is null when a ledger row can
// point at it, else why it cannot yet.
export function findProofs(root) {
  const lintConfig = ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts"]
    .map((file) => read(root, file) ?? "")
    .join("\n");
  const known = PROOFS.filter((proof) => {
    const [prefix, ...rest] = proof.check.split(":");
    const text = prefix === "eslint" ? lintConfig : (read(root, rest.join(":")) ?? "");
    return (
      proof.needs.every((part) => text.includes(part)) &&
      (proof.files ?? []).every((file) => read(root, file) !== null)
    );
  }).map((proof) => ({ ...proof, problem: pointerProblem(root, proof.id, proof.check) }));
  // A tagged test proves a decision that no known proof already answers here.
  const answered = new Set(known.filter((proof) => !proof.problem).map((proof) => proof.id));
  const tagged = [];
  for (const { id, check } of taggedTests(root)) {
    const decision = STANDARD.find((item) => item.id === id);
    if (!decision || decision.kind === "judgment" || answered.has(id)) continue;
    answered.add(id);
    tagged.push({
      id,
      kind: decision.kind,
      source: "the repository's own test of it",
      check,
      problem: pointerProblem(root, id, check),
    });
  }
  return [...known.filter((proof) => !tagged.some((item) => item.id === proof.id)), ...tagged];
}
