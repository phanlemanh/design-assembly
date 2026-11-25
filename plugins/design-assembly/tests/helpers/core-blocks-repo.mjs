// The fixtures of the tests about the blocks of a family core (spec 0016, slice 1 of item 7.2): a
// core folder whose block store the test writes, in the shape the contract states, since no command
// fills a store yet; a small member repository with a store of its own; and the calls every such
// test makes. Each test keeps its own list of cores, never the list of the person running it.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { fileURLToPath } from "node:url";

import { COMPONENT, healthyFiles } from "./store-repo.mjs";

export const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ROOT = path.resolve(PLUGIN, "../..");
const SCRIPTS = path.join(PLUGIN, "scripts");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");

// A family's name as a person gives it: the user's data, which only the core and a member's
// declaration may hold.
export const FAMILY = "Marrow Lantern Works";
export const OWNER = "Ana Reyes";
export const MEMBER = "Bo Tran";
export const BUILT_ON = "2026-11-25";
export const JOINED_ON = "2026-11-26";

const made = [];
export const cleanUp = () => made.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
export const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-blocks-")));
  made.push(dir);
  return dir;
};
export const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
export const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
export const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
export const read = (dir, file) => JSON.parse(text(dir, file));
export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args],
    { encoding: "utf8" },
  );

// A list of cores of a test's own: the file the commands are pointed at, which may not exist yet.
export const listIn = () => path.join(empty(), "cores.json");
export const run = (script, args, list, extra = {}) =>
  spawnSync(
    execPath,
    [...(extra.guard ? ["--import", NO_NETWORK] : []), path.join(SCRIPTS, script), ...args],
    { encoding: "utf8", env: { ...env, ...extra.env, DESIGN_ASSEMBLY_CORES: list } },
  );
export const gate = (dir) =>
  spawnSync(execPath, [path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir], {
    encoding: "utf8",
  });

// Every file of a folder with the hash of its bytes, the git folder left out.
export function snapshot(dir, at = "") {
  if (!existsSync(dir)) return [];
  return readdirSync(path.join(dir, at))
    .filter((name) => name !== ".git")
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}

// ---- a core with a block store -----------------------------------------------------------------

export const ROWS_CODE = COMPONENT("OrderRows");
export const ROWS_TEST =
  'import { OrderRows } from "./order-rows";\nexport const made = OrderRows;\n';
// A block as the store's list holds it, with the text of each of its files.
export const rowsBlock = (said = {}) => ({
  need: "many-rows",
  name: "OrderRows",
  description: "A table for many rows of one kind, with its empty state.",
  adapters: ["components", "source"],
  used_by: ["first-app"],
  promoted: { by: OWNER, on: BUILT_ON },
  second_use: false,
  texts: { "order-rows.tsx": ROWS_CODE, "order-rows.test.tsx": ROWS_TEST },
  ...said,
});
// The entry of the list for a block: its files with the hash of each text.
export const entryOf = ({ texts, ...block }) => ({
  ...block,
  files: Object.entries(texts).map(([file, code]) => ({ file, sha256: sha(code) })),
});

const answer = (id, kind, value, hold) => ({
  id,
  question: `Which ${id} does the family keep?`,
  kind,
  value,
  hold,
  check: null,
  why: `Settled in first-app; made ${hold} on the lock-or-default sheet.`,
  by: OWNER,
  on: BUILT_ON,
  origin: { repository: "first-app", ledger: "design/decisions.yaml", by: OWNER, on: BUILT_ON },
});

// Writes the block store of a core folder: the list, and each block's files under its need.
export function putBlocks(dir, blocks) {
  put(dir, "blocks/index.json", json({ version: 2, blocks: blocks.map(entryOf) }));
  for (const block of blocks) {
    for (const [file, code] of Object.entries(block.texts)) {
      put(dir, path.posix.join("blocks", block.need, file), code);
    }
  }
}

// A core folder as `core --build` writes it, with the blocks the test gives its store.
export function coreFolder({
  blocks = [rowsBlock()],
  colour = "#0246ff",
  name = "lantern-core",
} = {}) {
  const dir = path.join(empty(), name);
  put(
    dir,
    "core.json",
    json({
      version: 2,
      family: FAMILY,
      first: { repository: "first-app", read_on: BUILT_ON, commit: null },
      members: [],
      owner: { by: OWNER, on: BUILT_ON },
    }),
  );
  put(
    dir,
    "answers.json",
    json({ version: 2, answers: [answer("source-color", "value", colour, "default")] }),
  );
  putBlocks(dir, blocks);
  return dir;
}

// ---- a member ----------------------------------------------------------------------------------

// A small repository with a store of its own, taken in by the plugin: it has tool data, the
// adapters a block of the fixture core needs, and an intake ledger. No gate.
export function storeRepo(files = {}, name = "member-app") {
  const dir = path.join(empty(), name);
  const all = {
    ...healthyFiles(),
    "design/theme.json": json({ version: 1, checks: {} }),
    ...files,
  };
  for (const [file, content] of Object.entries(all)) {
    if (content !== null) put(dir, file, content);
  }
  return dir;
}

export const join = (dir, place, list, more = []) =>
  run(
    "core.mjs",
    ["--target", dir, "--join", "--core", place, "--by", MEMBER, "--on", JOINED_ON, ...more],
    list,
  );

// The owner's answer, written the one way an answer is written: through the decision sheet.
export function answerSheet(dir, line, list) {
  const file = path.join(empty(), "answers.txt");
  writeFileSync(file, `${line}\n`);
  return run(
    "decide.mjs",
    ["--target", dir, "--answers", file, "--by", "The Owner", "--on", "2026-11-27"],
    list,
  );
}
