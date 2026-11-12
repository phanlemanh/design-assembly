// Finds the proofs a repository already runs for standard decisions: a lint rule, a guard tool, a
// tagged test. One detector, used by the audit (to say what it sees) and by adopting (to add the
// row), so the two never give different answers about the same repository.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pointerProblem } from "../templates/tools/design-assembly/ledger.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROOFS = JSON.parse(
  readFileSync(path.join(HERE, "../references/known-proofs.json"), "utf8"),
).proofs;

const read = (root, file) =>
  existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;

// Every known proof whose marks are in the repository. `problem` is null when a ledger row can
// point at it, else why it cannot yet.
export function findProofs(root) {
  const lintConfig = ["eslint.config.js", "eslint.config.mjs", "eslint.config.ts"]
    .map((file) => read(root, file) ?? "")
    .join("\n");
  return PROOFS.filter((proof) => {
    const [prefix, ...rest] = proof.check.split(":");
    const text = prefix === "eslint" ? lintConfig : (read(root, rest.join(":")) ?? "");
    return (
      proof.needs.every((part) => text.includes(part)) &&
      (proof.files ?? []).every((file) => read(root, file) !== null)
    );
  }).map((proof) => ({ ...proof, problem: pointerProblem(root, proof.id, proof.check) }));
}
