// What the tests of slice 3 of item 7.1 share: throwaway repositories, a core folder beside them,
// a list of cores of the test's own, and the calls of the commands. Every repository and core is a
// fixture in a temporary folder; nothing here calls a model or the network, and no call reads or
// writes the list of cores of the person running the tests.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
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

import { withoutBlock } from "../../templates/tools/design-assembly/theme.mjs";
import { passingFloor } from "./answered-roles.mjs";

export const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ROOT = path.resolve(PLUGIN, "../..");
export const SCRIPTS = path.join(PLUGIN, "scripts");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
export const LEDGER = "design/decisions.yaml";
export const DECLARATION = "design/sources/core.json";
export const COPY = "design/core";
export const BUILT_ON = "2026-11-25";
export const JOINED_ON = "2026-11-26";
export const CHANGED_ON = "2026-11-27";
export const ACCEPTED_ON = "2026-11-28";
// A family's name as a person gives it: the user's data, which only the core, the member's
// declaration and the machine's list may hold.
export const FAMILY = "Tidewater Lantern Suite";
export const OWNER = "Mai Okafor";
export const MEMBER = "Dan Ruiz";
export const BRAND = "#0246ff";
export const OTHER = "#b3261e";

const made = [];
export const cleanup = () => made.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
export const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-moved-")));
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
// Runs a script of the plugin against a list of cores. `guard` makes the network unreachable.
export const run = (script, args, list, extra = {}) =>
  spawnSync(
    execPath,
    [...(extra.guard ? ["--import", NO_NETWORK] : []), path.join(SCRIPTS, script), ...args],
    {
      encoding: "utf8",
      cwd: extra.cwd,
      env: { ...env, ...extra.env, DESIGN_ASSEMBLY_CORES: list },
    },
  );
export const core = (args, list, extra) => run("core.mjs", args, list, extra);
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
// The files of a folder that hold a word.
export const holding = (dir, word) =>
  snapshot(dir)
    .filter((line) => !line.endsWith("/"))
    .map((line) => line.split(" ")[0])
    .filter((file) => readFileSync(path.join(dir, file), "utf8").includes(word))
    .sort();

// ---- repositories ------------------------------------------------------------------------------

// A repository with its design floor, the folder named so its name says what it is.
export function floor(name = "member-app") {
  const dir = path.join(empty(), name);
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  return dir;
}
const cache = {};
const copyOf = (kind, make) => {
  cache[kind] ??= make();
  const dir = path.join(empty(), path.basename(cache[kind]));
  cpSync(cache[kind], dir, { recursive: true });
  return dir;
};
// Adopted: the ledgers adopt writes from the floor, its gate and its tool.
export const adopted = () =>
  copyOf("adopted", () => {
    const dir = floor();
    const done = run(
      "adopt.mjs",
      ["--target", dir, "--conformance-level", "AA", "--product-type", "application"],
      listIn(),
    );
    assert.ok([0, 1].includes(done.status), done.stderr);
    return dir;
  });
// The blueprint of the guide: every built layer decided, the guide's proposals.
export function blueprint({ foundations = {}, patterns = { record_panel: "beside" } } = {}) {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns,
    foundations: {
      source_color: BRAND,
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
      text_font: "floor",
      heading_font: "text",
      ...foundations,
    },
  };
  const layers = Object.fromEntries(
    LAYERS.map((layer) => [
      layer.id,
      layer.built
        ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  layers.foundations.confirmed = ["text_font", "heading_font"];
  layers.foundations.answered = {
    text_font: { by: OWNER, on: BUILT_ON },
    heading_font: { by: OWNER, on: BUILT_ON },
  };
  return { version: 1, status: "approved", layers };
}
// Built by the guide from a blueprint of its proposals.
export const guided = () =>
  copyOf("guided", () => {
    const dir = floor();
    put(dir, "design/blueprint.json", json(blueprint()));
    const done = run("apply.mjs", ["--target", dir], listIn());
    assert.equal(done.status, 0, done.stderr);
    return dir;
  });
// No Makefile: only a stylesheet.
export function noMakefile() {
  const dir = path.join(empty(), "member-app");
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  return dir;
}

// ---- a core ------------------------------------------------------------------------------------

export const answer = (id, kind, value, hold, check) => ({
  id,
  question: `Which ${id} does the family keep?`,
  kind,
  value,
  hold,
  check,
  why: `Settled in first-app; made ${hold} on the lock-or-default sheet.`,
  by: OWNER,
  on: BUILT_ON,
  origin: { repository: "first-app", ledger: LEDGER, by: OWNER, on: "2026-11-20" },
});
// A core folder as `core --build` writes it, beside the repositories of the test.
export function coreFolder({ colour = BRAND, extra = [], name = "tidewater-core" } = {}) {
  const dir = path.join(empty(), name);
  put(
    dir,
    "core.json",
    json({
      version: 1,
      family: FAMILY,
      first: { repository: "first-app", read_on: BUILT_ON, commit: null },
      members: [],
      owner: { by: OWNER, on: BUILT_ON },
    }),
  );
  put(
    dir,
    "answers.json",
    json({
      version: 1,
      answers: [
        answer("source-color", "value", colour, "locked", null),
        answer("record-panel", "value", "beside", "locked", "tool:tools/design-assembly/check.mjs"),
        answer(
          "failed-action",
          "rule",
          "a failed action says what failed",
          "locked",
          "test:tests/failed-action.test.tsx",
        ),
        answer(
          "type-scale-values",
          "value",
          "standard",
          "default",
          "tool:tools/design-assembly/check.mjs",
        ),
        answer(
          "table-density",
          "rule",
          "whether the columns fit at their least width",
          "default",
          "tool:tools/design-assembly/check.mjs",
        ),
        ...extra,
      ],
    }),
  );
  put(dir, "blocks/index.json", json({ version: 1, blocks: [] }));
  return dir;
}
export const primaryOf = (dir) => read(dir, "design/tokens.json").color.primary.$value;
export const join = (dir, place, list, more = []) =>
  core(
    ["--target", dir, "--join", "--core", place, "--by", MEMBER, "--on", JOINED_ON, ...more],
    list,
  );
// The family's owner changes one answer of the core, by the command.
export const change = (place, list, id, more) => {
  const done = core(
    ["--change", id, "--core", place, "--by", OWNER, "--on", CHANGED_ON, ...more],
    list,
  );
  assert.equal(done.status, 0, done.stderr);
  return done;
};
export const pinOf = (place) => sha(readFileSync(path.join(place, "answers.json"))).slice(0, 12);
export const copyPin = (dir) =>
  sha(readFileSync(path.join(dir, COPY, "answers.json"))).slice(0, 12);
const rowOf = (dir, id) => {
  const block = new RegExp(`  - id: ${id}\\n((?:    .*\\n?)*)`).exec(text(dir, LEDGER));
  return block ? block[1] : null;
};
export const noteOf = (dir, id) => /note: "(.*)"/.exec(rowOf(dir, id) ?? "")?.[1] ?? null;

// A member of the family: an adopted repository that joined a core holding its own colour, so
// every answer is inherited and nothing waits. Gives the repository, the core and the list.
export function member({ make = adopted, colour = null } = {}) {
  const dir = make();
  const held = existsSync(path.join(dir, "design/tokens.json")) ? primaryOf(dir) : BRAND;
  const place = coreFolder({ colour: colour ?? held });
  const list = listIn();
  const done = join(dir, place, list);
  assert.ok([0, 1].includes(done.status), done.stderr);
  return { dir, place, list };
}
