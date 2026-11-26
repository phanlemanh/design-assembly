// A repository that stands alone, and what `adopt` asks it: on a machine whose list knows no core,
// and on one whose list knows a core after the repository's person said it is of no family
// (`core --decline`). The record of what plugin 0.68.0 printed (`stand-alone-on-0.68.0.json`) was
// made with this module before item 7.5 was built, so a test can show that a repository of no
// family is asked the same after it, in text and as data.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adopted, core, coreFolder, floor, JOINED_ON, listIn, run } from "./core-family.mjs";
import { listOf } from "./known-core.mjs";
import { plain } from "./four-kinds.mjs";

// The repositories asked: one with no ledger yet, and one adopted whose colour nobody recorded.
export const KINDS = {
  "no ledgers": () => floor(),
  adopted: () => adopted(),
};

// The machines: the list of cores each repository is read against.
export const MACHINES = {
  // No list at all: the file is never made.
  "no list": () => listIn(),
  // A list that knows a core, and the person's no for this repository.
  "a person's no": (dir) => {
    const list = listOf(coreFolder());
    const declined = core(["--target", dir, "--decline", "--on", JOINED_ON], list);
    assert.equal(declined.status, 0, declined.stderr);
    return list;
  },
};

// What the preview of `adopt` prints on a repository, as text and as data, and how it ends.
export function observe(dir, list, version) {
  const seen = {};
  for (const [name, more] of Object.entries({ text: [], json: ["--json"] })) {
    const done = run("adopt.mjs", ["--target", dir, "--dry-run", ...more], list, { guard: true });
    seen[name] = {
      exit: done.status,
      out: plain(done.stdout, dir, version),
      err: plain(done.stderr, dir, version),
    };
  }
  return seen;
}

export const RECORD = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "stand-alone-on-0.68.0.json",
);

export const readRecord = () => JSON.parse(readFileSync(RECORD, "utf8"));
export const writeRecord = (data) => writeFileSync(RECORD, `${JSON.stringify(data, null, 2)}\n`);
