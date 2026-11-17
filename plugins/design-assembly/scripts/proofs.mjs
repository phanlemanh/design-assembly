// Finds the proofs a repository already runs for standard decisions: a lint rule, a guard tool, a
// tagged test. One detector, used by the audit (to say what it sees) and by adopting (to add the
// row), so the two never give different answers about the same repository.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { pointerProblem } from "../templates/tools/design-assembly/ledger.mjs";
// A repository's own test that names a standard decision with `decision:<id>` is a proof of it.
// The gate reads the same tags, to find a test that proves a decision with no row.
import { taggedTests } from "../templates/tools/design-assembly/owner-calls.mjs";

const lint = adapterOf("lint");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROOFS = JSON.parse(
  readFileSync(path.join(HERE, "../references/known-proofs.json"), "utf8"),
).proofs;

const STANDARD = JSON.parse(
  readFileSync(path.join(HERE, "../references/standard-decisions.json"), "utf8"),
).decisions;

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// Every known proof whose marks are in the repository. `problem` is null when a ledger row can
// point at it, else why it cannot yet.
export function findProofs(root) {
  const lintConfig = lint.configFiles.map((file) => read(root, file) ?? "").join("\n");
  const known = PROOFS.filter((proof) => {
    const [prefix, ...rest] = proof.check.split(":");
    const text = prefix === lint.prefix ? lintConfig : (read(root, rest.join(":")) ?? "");
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
