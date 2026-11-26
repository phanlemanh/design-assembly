// The four kinds of repository spec 0017 names for its first criterion, none with a row of the
// kinds that slice adds, and what the commands print on each: one with no ledger, one kept by
// adopting, one the guide built, and one with no Makefile, adopted. The record of what plugin
// 0.69.0 printed (`no-mark-on-0.69.0.json`) was made with this module before item 12.2 was built,
// so a test can show that a repository with no mark of its own reads, asks and ends the same after
// it: status, audit, the preview of adopt as text and as data, the preview of the guide, and the
// gate where the repository has one.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { fileURLToPath } from "node:url";

import { adopted, floor, guided, listIn, noMakefile, run, SCRIPTS } from "./core-family.mjs";
import { plain } from "./four-kinds.mjs";

const NO_NETWORK = path.join(SCRIPTS, "../tests/helpers/no-network.mjs");

// Adopted with no Makefile: only a stylesheet, then adopt.
function adoptedWithoutMakefile() {
  const dir = noMakefile();
  const done = run(
    "adopt.mjs",
    ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
    listIn(),
  );
  assert.ok([0, 1].includes(done.status), done.stderr);
  return dir;
}

export const KINDS = {
  "no ledger": () => floor(),
  adopted: () => adopted(),
  guided: () => guided(),
  "no Makefile": () => adoptedWithoutMakefile(),
};

// The commands, each with its arguments; none writes.
export const READS = {
  status: ["status.mjs"],
  audit: ["audit.mjs"],
  "adopt --dry-run": ["adopt.mjs", "--dry-run"],
  "adopt --dry-run --json": ["adopt.mjs", "--dry-run", "--json"],
  "new: apply --dry-run": ["apply.mjs", "--dry-run"],
};

const spawn = (file, args, list) =>
  spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_CORES: list },
  });

// What each command prints on a repository, and how it ends, with the changing words put back.
export function observe(dir, version) {
  const seen = {};
  const said = (name, done) => {
    seen[name] = {
      exit: done.status,
      out: plain(done.stdout, dir, version),
      err: plain(done.stderr, dir, version),
    };
  };
  for (const [name, [script, ...args]] of Object.entries(READS)) {
    said(name, spawn(path.join(SCRIPTS, script), ["--target", dir, ...args], listIn()));
  }
  const tool = path.join(dir, "tools/design-assembly/check.mjs");
  if (existsSync(tool)) said("gate", spawn(tool, ["--target", dir], listIn()));
  return seen;
}

export const RECORD = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "no-mark-on-0.69.0.json",
);

export const readRecord = () => JSON.parse(readFileSync(RECORD, "utf8"));
export const writeRecord = (data) => writeFileSync(RECORD, `${JSON.stringify(data, null, 2)}\n`);
