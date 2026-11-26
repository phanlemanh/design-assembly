// The four kinds of repository spec 0017 names for its first criterion (no ledger, adopted, built
// by the guide, no Makefile), none with a row of a brand asset, and what the commands that read a
// repository, the guide's preview and the gate print on each. The record of what plugin 0.69.0
// printed (`brand-free-on-0.69.0.json`) was made with this module before item 12.1 was built, so a
// test can show that a repository with no row of the new kinds reads the same after it.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { fileURLToPath } from "node:url";

import { adopted, empty, floor, guided, noMakefile, SCRIPTS } from "./core-family.mjs";
import { plain } from "./four-kinds.mjs";

const NO_NETWORK = path.join(SCRIPTS, "../tests/helpers/no-network.mjs");

export const KINDS = {
  "no ledger": () => floor(),
  adopted: () => adopted(),
  guided: () => guided(),
  "no Makefile": () => noMakefile(),
};

// The commands asked, each with its arguments: none writes.
const READS = {
  status: ["status.mjs"],
  audit: ["audit.mjs"],
  "new --dry-run": ["apply.mjs", "--dry-run"],
  "adopt --dry-run": ["adopt.mjs", "--dry-run"],
};

const ran = (file, args) =>
  spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_CORES: path.join(empty(), "cores.json") },
  });

// What each command prints on a repository and how it ends, with the changing words put back; the
// gate where the repository has one.
export function observe(dir, version) {
  const seen = {};
  const keep = (name, run) => {
    seen[name] = {
      exit: run.status,
      out: plain(run.stdout, dir, version),
      err: plain(run.stderr, dir, version),
    };
  };
  for (const [name, [script, ...args]] of Object.entries(READS)) {
    keep(name, ran(path.join(SCRIPTS, script), ["--target", dir, ...args]));
  }
  const tool = path.join(dir, "tools/design-assembly/check.mjs");
  if (existsSync(tool)) keep("gate", ran(tool, ["--target", dir]));
  return seen;
}

export const RECORD = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "brand-free-on-0.69.0.json",
);

export const readRecord = () => JSON.parse(readFileSync(RECORD, "utf8"));
export const writeRecord = (data) => writeFileSync(RECORD, `${JSON.stringify(data, null, 2)}\n`);
