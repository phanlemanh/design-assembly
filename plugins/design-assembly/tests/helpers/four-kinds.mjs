// The four kinds of repository the other tests use, and what the commands that read a repository
// print on each: a repository with no ledger, one kept by adopting (with a Makefile that includes
// mk/*.mk), one the guide built, and one of another stack. The record of what the plugin printed
// before item 7.4 (`four-kinds-on-0.65.0.json`) was made with this module, so a test can show that
// the commands print and end the same after it.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env, execPath } from "node:process";
import { fileURLToPath } from "node:url";

import { adopted, empty, git, guided, json, put, SCRIPTS } from "./core-family.mjs";

const NO_NETWORK = path.join(SCRIPTS, "../tests/helpers/no-network.mjs");

// A ledger of rows, in the block style every ledger is written in.
function ledger(rows) {
  const lines = ["version: 1", "decisions:"];
  for (const row of rows) {
    const [first, ...rest] = Object.entries(row);
    lines.push(`  - ${first[0]}: ${JSON.stringify(first[1])}`);
    for (const [key, value] of rest) lines.push(`    ${key}: ${JSON.stringify(value)}`);
  }
  return `${lines.join("\n")}\n`;
}

// A folder of its own for a kind, in git with one commit.
function committed(name, fill) {
  const dir = path.join(empty(), name);
  mkdirSync(dir, { recursive: true });
  fill(dir);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "first");
  return dir;
}

export const KINDS = {
  bare: () =>
    committed("bare-app", (dir) => {
      put(dir, "package.json", json({ name: "bare-app", private: true }));
      put(dir, "src/main.ts", "export {};\n");
    }),
  adopted: () => adopted(),
  guided: () => guided(),
  other: () =>
    committed("other-app", (dir) => {
      put(dir, "pyproject.toml", '[project]\nname = "other-app"\n');
      put(
        dir,
        "design/decisions.yaml",
        ledger([
          {
            id: "source-color",
            layer: "foundations",
            kind: "judgment",
            source: "styles/site.scss",
            note: "confirmed by Ana Reyes on 2026-11-19",
          },
          {
            id: "undo-or-confirm",
            layer: "patterns",
            kind: "formula",
            source: "the repository's own test of it",
            check: "test:tests/test_undo.py",
          },
        ]),
      );
    }),
};

// The commands that read a repository, each with the arguments it is given: none writes.
export const READS = {
  audit: ["audit.mjs"],
  status: ["status.mjs"],
  find: ["find.mjs", "button"],
  inventory: ["inventory.mjs"],
  "adopt --dry-run": ["adopt.mjs", "--dry-run"],
  "upgrade --dry-run": ["upgrade.mjs", "--dry-run"],
};

// What changes from one version of the plugin to the next without any reading having moved: the
// folder the repository sits in, the plugin's version, and the counts and lists of its known
// limits, which grow with every version. Each is put back to one word.
export function plain(text, dir, version) {
  return String(text)
    .split(dir)
    .join("<repository>")
    .split(version)
    .join("<version>")
    .replace(/\d+ open, \d+ closed/g, "<limits>")
    .replace(/(\d+ of the open ones can leave a check green[^:]*:).*/g, "$1 <list>")
    .replace(/^(status does not see|upgrade does not see|audit does not see): .*/gm, "$1: <list>")
    .replace(/\b20\d\d-\d\d-\d\d\b/g, "<day>");
}

// What each command prints on a repository, and how it ends, with the changing words put back.
export function observe(dir, version) {
  const seen = {};
  for (const [name, [script, ...args]] of Object.entries(READS)) {
    const run = spawnSync(
      execPath,
      ["--import", NO_NETWORK, path.join(SCRIPTS, script), "--target", dir, ...args],
      {
        encoding: "utf8",
        env: { ...env, DESIGN_ASSEMBLY_CORES: path.join(empty(), "cores.json") },
      },
    );
    seen[name] = {
      exit: run.status,
      out: plain(run.stdout, dir, version),
      err: plain(run.stderr, dir, version),
    };
  }
  return seen;
}

export const RECORD = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "four-kinds-on-0.65.0.json",
);

export const readRecord = () => JSON.parse(readFileSync(RECORD, "utf8"));
export const writeRecord = (data) => writeFileSync(RECORD, `${JSON.stringify(data, null, 2)}\n`);
