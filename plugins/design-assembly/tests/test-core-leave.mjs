// A repository leaves its family (spec 0016, criterion 25, the second half of slice 4 of item 7.1):
// the declaration and the copy of the core are removed; each answer it inherited becomes its own,
// its value as it was, and its row says since when and where it once came from; the blueprint's
// marks are turned the same way; the gate's check and the questions about the core are taken off;
// the core's list of members loses the repository only where the core folder can be reached; the
// machine's list records that it left. After it the repository behaves as one that stands alone.
// Every repository and core is a fixture in a throwaway folder; nothing calls a model or the
// network, and each test keeps its own list of cores, never the list of the person running them.
import "./helpers/own-cores.mjs";
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
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  coreMarkOf,
  leftMarkOf,
  leftMarkText,
  PINNED_CORE,
  withCoreMark,
} from "../templates/tools/design-assembly/contract.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

import { passingFloor } from "./helpers/answered-roles.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const SCRIPTS = path.join(PLUGIN, "scripts");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const LEDGER = "design/decisions.yaml";
const THEME = "design/theme.json";
const BLUEPRINT = "design/blueprint.json";
const BUILT_ON = "2026-11-25";
const JOINED_ON = "2026-11-26";
const LEFT_ON = "2026-11-27";
// A family's name as a person gives it: the user's data, which no file of the plugin may hold.
const FAMILY = "Quillon Harbour Suite";
const OWNER = "Ana Reyes";
const MEMBER = "Bo Tran";
const WHY = "the product was sold and keeps its own design from now on";
const BRAND = "#0246ff";
// What a command says of a family a repository is of; the ladder's own line for the family's store,
// which every repository that stands alone prints, is not it.
const FAMILY_WORDS = /family core|same family|of no family|left its family/i;
// What tier 3 of the ladder says on a repository of no family (slice 1 of item 7.2).
const NO_FAMILY_TIER = "  3 family: this repository is of no family (core --join declares one)\n";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-leave-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const read = (dir, file) => JSON.parse(text(dir, file));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args],
    { encoding: "utf8" },
  );

// A list of cores of a test's own: the file the commands are pointed at, which may not exist yet.
const listIn = () => path.join(empty(), "cores.json");
const run = (script, args, list, extra = {}) =>
  spawnSync(
    execPath,
    [...(extra.guard ? ["--import", NO_NETWORK] : []), path.join(SCRIPTS, script), ...args],
    {
      encoding: "utf8",
      env: { ...env, ...extra.env, DESIGN_ASSEMBLY_CORES: list },
    },
  );
const core = (args, list, extra) => run("core.mjs", args, list, extra);
const gate = (dir) =>
  spawnSync(execPath, [path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir], {
    encoding: "utf8",
  });

// Every file of a folder with the hash of its bytes, the git folder left out.
function snapshot(dir, at = "") {
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
// The files of a folder that differ from an earlier snapshot of it, by name.
const changedSince = (dir, before) => {
  const now = snapshot(dir);
  const names = (lines) => new Map(lines.map((line) => line.split(" ")));
  const [was, is] = [names(before), names(now)];
  return [...new Set([...was.keys(), ...is.keys()])]
    .filter((name) => was.get(name) !== is.get(name))
    .sort();
};

// ---- repositories ------------------------------------------------------------------------------

function floor(name = "member-app") {
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
const adopted = () =>
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
function blueprint() {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: {
      source_color: BRAND,
      type_scale: "standard",
      spacing_unit: "4px",
      corner_radius: "small",
      text_font: "floor",
      heading_font: "text",
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
const guided = () =>
  copyOf("guided", () => {
    const dir = floor();
    put(dir, BLUEPRINT, json(blueprint()));
    const done = run("apply.mjs", ["--target", dir], listIn());
    assert.equal(done.status, 0, done.stderr);
    return dir;
  });

// ---- a core ------------------------------------------------------------------------------------

const answer = (id, kind, value, hold, check) => ({
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
function coreFolder({
  colour = BRAND,
  extra = [],
  family = FAMILY,
  name = "quillon-core",
  only = null,
} = {}) {
  const dir = path.join(empty(), name);
  put(
    dir,
    "core.json",
    json({
      version: 1,
      family,
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
      answers: only ?? [
        answer("source-color", "value", colour, "locked", null),
        answer(
          "failed-action",
          "rule",
          "a failed action says what failed",
          "locked",
          "test:tests/failed-action.test.tsx",
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
const primaryOf = (dir) => read(dir, "design/tokens.json").color.primary.$value;
const join = (dir, place, list, more = []) =>
  core(
    ["--target", dir, "--join", "--core", place, "--by", MEMBER, "--on", JOINED_ON, ...more],
    list,
  );
const leave = (dir, list, more = []) =>
  core(["--target", dir, "--leave", "--by", MEMBER, "--why", WHY, "--on", LEFT_ON, ...more], list);
const pinOf = (place) => sha(readFileSync(path.join(place, "answers.json"))).slice(0, 12);
const rowOf = (dir, id) => {
  const block = new RegExp(`  - id: ${id}\\n((?:    .*\\n?)*)`).exec(text(dir, LEDGER));
  return block ? block[1] : null;
};
const noteOf = (dir, id) => /note: "(.*)"/.exec(rowOf(dir, id) ?? "")?.[1] ?? null;
const sourceOf = (dir, id) => /source: "?(.*?)"?\n/.exec(rowOf(dir, id) ?? "")?.[1] ?? null;
const leftHead = `own since ${LEFT_ON}, when the repository left its family: ${WHY} (by ${MEMBER})`;

// ---- the move ------------------------------------------------------------------------------------

test("a member leaves: the declaration and the copy are removed, each inherited answer is its own, the gate stays green", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  const alone = snapshot(dir);
  assert.equal(join(dir, place, list).status, 0);
  const pin = pinOf(place);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  const joined = snapshot(dir);
  const coreJoined = snapshot(place);
  const listJoined = text(path.dirname(list), "cores.json");

  // Said first, written nothing: every file it would change or remove, and the line of the core.
  const dry = leave(dir, list, ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  for (const line of [
    /member-app would leave the family Quillon Harbour Suite, pinned at [0-9a-f]{12}: said by Bo Tran on 2026-11-27: the product was sold/,
    /update {4}design\/decisions\.yaml/,
    /update {4}design\/theme\.json/,
    /delete {4}design\/sources\/core\.json/,
    /delete {4}design\/core\/core\.json/,
    /delete {4}design\/core\/answers\.json/,
    /delete {4}design\/core\/blocks\/index\.json/,
    /in the core folder: .*core\.json: takes the line \{"repository":"member-app","joined":"2026-11-26","pin":"[0-9a-f]{12}"\} out of members \(not written: --dry-run\)/,
    /nothing was written: --dry-run/,
  ]) {
    assert.match(dry.stdout, line);
  }
  assert.deepEqual(snapshot(dir), joined);
  assert.deepEqual(snapshot(place), coreJoined);
  assert.equal(text(path.dirname(list), "cores.json"), listJoined);

  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  // The declaration and the copy are gone, with the folders they leave empty.
  for (const gone of [PINNED_CORE.file, "design/core", "design/sources"]) {
    assert.ok(!existsSync(path.join(dir, gone)), gone);
  }
  // Each inherited answer is the repository's own: the mark says since when, who said so and why,
  // and where it once came from, by the pin; the rest of the note stays, the stamp included.
  assert.equal(
    noteOf(dir, "source-color"),
    `${leftHead}, once inherited from the family core at ${pin}; answered by ${OWNER} on ${BUILT_ON}`,
  );
  assert.match(
    noteOf(dir, "failed-action"),
    new RegExp(`^own since ${LEFT_ON}, .*, once inherited from the family core at ${pin}`),
  );
  assert.doesNotMatch(text(dir, LEDGER), new RegExp(FAMILY));
  // No value changed: but for the ledger, the repository is as it was before it joined.
  assert.deepEqual(changedSince(dir, alone), [LEDGER]);
  // The gate's check is off, and the gate is green.
  assert.ok(!text(dir, THEME).includes("family-core"));
  assert.match(done.stdout, /the gate's check family-core is taken off ledger-shapes/);
  const green = gate(dir);
  assert.equal(green.status, 0, green.stderr);
  // The core's list of members lost the repository, and nothing else of the core moved.
  assert.deepEqual(read(place, "core.json").members, []);
  assert.match(done.stdout, /out of members \(written\)/);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  // The machine's list records that it left, so the repository is not asked at once.
  const kept = read(path.dirname(list), "cores.json");
  assert.deepEqual(kept.declined, [{ repository: dir, on: LEFT_ON, how: "left" }]);
  assert.equal(kept.cores.length, 1, "the core stays on the list");
  const asked = core(["--target", dir, "--ask"], list);
  assert.equal(asked.status, 0);
  assert.match(asked.stdout, /this repository left its family on 2026-11-27/);
  // A machine reads the same: the rows turned, the files, the line of the core.
  const twin = adopted();
  assert.equal(join(twin, place, list).status, 0);
  const data = JSON.parse(leave(twin, list, ["--json"]).stdout);
  assert.equal(data.left, true);
  assert.equal(data.pin, pin);
  assert.deepEqual(
    data.rows.map((row) => [row.id, row.once]).sort(),
    [
      ["failed-action", "inherited"],
      ["source-color", "inherited"],
      ["table-density", "inherited"],
    ].sort(),
  );
  assert.ok(data.files.some((file) => file.path === PINNED_CORE.file && file.change === "delete"));
  assert.equal(data.check, "now");
  assert.equal(data.core_file.written, true);
});

test("the marks: a note keeps what it carried, and a repository that joins again writes its new mark in the old one's place", () => {
  const once = { mark: "kept", pin: "0123456789ab", why: "a reason", by: "Ana", on: BUILT_ON };
  const head = leftMarkText({ since: LEFT_ON, why: WHY, by: MEMBER, once });
  assert.equal(
    head,
    `own since ${LEFT_ON}, when the repository left its family: ${WHY} (by ${MEMBER}), once kept against the family core at 0123456789ab: a reason (by Ana on ${BUILT_ON})`,
  );
  const found = leftMarkOf(`${head}; answered by Ana on ${BUILT_ON}`);
  assert.deepEqual(found.left, { since: LEFT_ON, why: WHY, by: MEMBER, once });
  assert.equal(found.rest, `answered by Ana on ${BUILT_ON}`);
  // To a reader of the core's marks it is no mark of a core, and the rest is what follows it.
  const read0 = coreMarkOf(`${head}; a word of the row's own`);
  assert.equal(read0.mark, null);
  assert.equal(read0.rest, "a word of the row's own");
  assert.equal(
    withCoreMark(`${head}; a word of the row's own`, { mark: "inherited", pin: "ba9876543210" }),
    "inherited from the family core at ba9876543210; a word of the row's own",
  );
  // With no mark to write, as for an answer the new family holds otherwise, the note stays.
  assert.equal(withCoreMark(`${head}; a word`, null), `${head}; a word`);
  assert.equal(
    withCoreMark("inherited from the family core at ba9876543210; a word", null),
    "a word",
  );
  // A note with no such mark reads as before.
  assert.deepEqual(leftMarkOf("a word"), { left: null, rest: "a word" });
});

// ---- as one that stands alone ---------------------------------------------------------------------

// What each command prints on a repository, the folder's own path taken out.
function printed(dir, list) {
  const calls = [
    ["status.mjs", ["--target", dir]],
    ["audit.mjs", ["--target", dir]],
    ["find.mjs", ["--target", dir, "a table of many rows"]],
    ["inventory.mjs", ["--target", dir]],
    ["adopt.mjs", ["--target", dir, "--dry-run"]],
    ["apply.mjs", ["--target", dir, "--dry-run"]],
  ];
  const seen = calls.map(([script, args]) => {
    const done = run(script, args, list);
    return [script, done.status, done.stdout.replaceAll(dir, "<dir>")];
  });
  const checked = gate(dir);
  seen.push(["gate", checked.status, checked.stdout.replaceAll(dir, "<dir>")]);
  return seen;
}

// A rule the ledger of every fixture already has a row for, so joining adds no row of its own.
const HELD_RULES = [
  answer(
    "spacing-values",
    "rule",
    "the framework's 4px unit",
    "locked",
    "tool:tools/design-assembly/check.mjs",
  ),
  answer(
    "radius-value",
    "rule",
    "the stylesheet's corner radius",
    "default",
    "tool:tools/design-assembly/check.mjs",
  ),
];
const coreOfHeldRules = (extra = []) => coreFolder({ only: [...HELD_RULES, ...extra] });
const writeExports = (dir) =>
  spawnSync(execPath, [path.join(dir, "tools/design-assembly/exports.mjs"), "--write"], {
    cwd: dir,
    encoding: "utf8",
  });

test("joined, then left: status, audit, find, inventory, adopt, the guide and the gate print what a twin that never joined prints", () => {
  // The twin never joined and holds the same answers as its own: a repository that left keeps
  // every answer it inherited, so only the marks that say where each once came from tell them apart.
  const same = (kind, dir, twin, list) => {
    const [left, never] = [printed(dir, list), printed(twin, listIn())];
    for (const [index, [script, status, out]] of left.entries()) {
      assert.equal(status, never[index][1], `${kind}: ${script} ends the same`);
      assert.equal(out, never[index][2], `${kind}: ${script} prints the same`);
      // Since tier 3 of the ladder reads a family's store, its line says the repository is of no
      // family, here as on the twin: the one line of these commands that speaks of a family.
      assert.doesNotMatch(out.replace(NO_FAMILY_TIER, ""), FAMILY_WORDS, `${kind}: ${script}`);
    }
    assert.equal(left.at(-1)[1], 0, `${kind}: the gate is green`);
    // But for the marks, the ledger is the twin's, row for row.
    const unmarked = text(dir, LEDGER)
      .split("\n")
      .map((line) => {
        const note = /^(\s*note: )"(.*)"$/.exec(line);
        if (!note) return line;
        const { left: mark, rest } = leftMarkOf(note[2]);
        return mark ? (rest === "" ? null : `${note[1]}${JSON.stringify(rest)}`) : line;
      })
      .filter((line) => line !== null)
      .join("\n");
    assert.equal(unmarked, text(twin, LEDGER), `${kind}: the ledger, but for the marks`);
  };

  // Adopted: the core answers what the ledger already has rows for.
  {
    const [dir, twin, list] = [adopted(), adopted(), listIn()];
    const place = coreOfHeldRules([
      answer(
        "type-scale-values",
        "value",
        "standard",
        "default",
        "tool:tools/design-assembly/check.mjs",
      ),
    ]);
    assert.equal(join(dir, place, list).status, 0);
    assert.match(noteOf(dir, "spacing-values"), /^inherited from the family core at /);
    assert.equal(leave(dir, list).status, 0);
    assert.match(noteOf(dir, "spacing-values"), /^own since /);
    same("adopted", dir, twin, list);
  }
  // Built by the guide: the core answers the colour and the type scale, which its ledger has rows
  // for; the twin's owner gave the same two answers.
  {
    const [dir, list] = [guided(), listIn()];
    const place = coreOfHeldRules([
      answer("source-color", "value", BRAND, "locked", null),
      answer(
        "type-scale-values",
        "value",
        "standard",
        "default",
        "tool:tools/design-assembly/check.mjs",
      ),
    ]);
    assert.equal(join(dir, place, list).status, 0);
    assert.equal(core(["--target", dir, "--inherit"], list).status, 0);
    assert.equal(run("apply.mjs", ["--target", dir], list).status, 0);
    assert.equal(leave(dir, list).status, 0);
    assert.equal(run("apply.mjs", ["--target", dir], list).status, 0);

    const twin = guided();
    const mine = read(twin, BLUEPRINT);
    const said = { by: OWNER, on: BUILT_ON };
    mine.layers.foundations.confirmed.push("source_color", "type_scale");
    Object.assign(mine.layers.foundations.answered, { source_color: said, type_scale: said });
    put(twin, BLUEPRINT, json(mine));
    assert.equal(run("apply.mjs", ["--target", twin], listIn()).status, 0);
    for (const one of [dir, twin]) {
      if (existsSync(path.join(one, "DESIGN.md"))) assert.equal(writeExports(one).status, 0);
    }
    // The blueprints differ by the marks alone.
    const bare = (data) => ({
      ...data,
      layers: Object.fromEntries(
        Object.entries(data.layers).map(([id, layer]) => [
          id,
          Object.fromEntries(Object.entries(layer).filter(([key]) => key !== "own")),
        ]),
      ),
    });
    assert.deepEqual(bare(read(dir, BLUEPRINT)), read(twin, BLUEPRINT));
    same("guided", dir, twin, list);
  }
});

test("the guide on a repository that left: the choices it inherited stay a person's, and building again keeps each mark", () => {
  const dir = floor();
  const place = coreFolder({
    extra: [
      answer("record-panel", "value", "beside", "locked", "tool:tools/design-assembly/check.mjs"),
      answer(
        "type-scale-values",
        "value",
        "modular 1.25",
        "default",
        "tool:tools/design-assembly/check.mjs",
      ),
    ],
  });
  const list = listIn();
  // The person starts the blueprint; the core answers what it holds; the scale is changed here.
  const start = blueprint();
  delete start.layers.foundations.choice.source_color;
  start.layers.patterns = { status: "pending" };
  start.layers.foundations.changed = {
    type_scale: { why: "the product reads dense tables", by: MEMBER, on: JOINED_ON },
  };
  put(dir, BLUEPRINT, json(start));
  assert.equal(join(dir, place, list).status, 0);
  const pin = pinOf(place);
  assert.notEqual(core(["--target", dir, "--inherit"], list).status, 2);
  const built = run("apply.mjs", ["--target", dir], list);
  assert.equal(built.status, 0, built.stderr);
  assert.match(noteOf(dir, "source-color"), /^inherited from the family core at /);
  const choices = JSON.stringify(
    Object.values(read(dir, BLUEPRINT).layers).map((layer) => layer.choice),
  );

  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  assert.match(
    done.stdout,
    /choices of the blueprint marked as the repository's own: .*foundations\.source_color \(once inherited\)/,
  );
  const after0 = read(dir, BLUEPRINT);
  // No choice changed; the marks of the core are turned, by choice key.
  assert.equal(JSON.stringify(Object.values(after0.layers).map((layer) => layer.choice)), choices);
  const { foundations, patterns } = after0.layers;
  assert.equal(foundations.inherited, undefined);
  assert.equal(foundations.changed, undefined);
  assert.deepEqual(foundations.own.source_color, {
    since: LEFT_ON,
    by: MEMBER,
    why: WHY,
    once: "inherited",
    pin,
    hold: "locked",
  });
  assert.deepEqual(foundations.own.type_scale, {
    since: LEFT_ON,
    by: MEMBER,
    why: WHY,
    once: "changed",
    pin,
    changed: { why: "the product reads dense tables", by: MEMBER, on: JOINED_ON },
  });
  assert.deepEqual(patterns.own.record_panel, {
    since: LEFT_ON,
    by: MEMBER,
    why: WHY,
    once: "inherited",
    pin,
    hold: "locked",
  });
  // An inherited choice stays a person's answer: the family's owner settled it.
  assert.ok(foundations.confirmed.includes("source_color"));
  assert.deepEqual(foundations.answered.source_color, { by: OWNER, on: BUILT_ON });
  assert.doesNotMatch(text(dir, BLUEPRINT), new RegExp(FAMILY));
  const marked = noteOf(dir, "source-color");
  assert.match(
    marked,
    new RegExp(`^own since ${LEFT_ON}, .* once inherited from the family core at ${pin}`),
  );
  assert.match(
    noteOf(dir, "type-scale-values"),
    new RegExp(
      `^own since ${LEFT_ON}, .*, once changed from the family core at ${pin}: the product reads dense tables \\(by ${MEMBER} on ${JOINED_ON}\\)`,
    ),
  );
  // The guide builds again from the blueprint: it asks nothing more, the rows keep their marks and
  // none turns into a proposal nobody confirmed.
  const again = run("apply.mjs", ["--target", dir], list);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(noteOf(dir, "source-color"), marked);
  assert.match(
    noteOf(dir, "record-panel"),
    /^own since .* once inherited from the family core at /,
  );
  assert.doesNotMatch(noteOf(dir, "source-color"), /has not confirmed/);
  spawnSync(execPath, [path.join(dir, "tools/design-assembly/exports.mjs"), "--write"], {
    cwd: dir,
  });
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // Joined again, a choice inherited once more is no longer marked as the repository's own; one
  // the core does not give again keeps its entry.
  assert.equal(join(dir, place, list).status, 0);
  assert.notEqual(core(["--target", dir, "--inherit"], list).status, 2);
  const back = read(dir, BLUEPRINT).layers.foundations;
  assert.deepEqual(back.inherited.source_color, { pin, hold: "locked" });
  assert.equal(back.own.source_color, undefined);
  assert.equal(back.own.type_scale.once, "changed");
});

// ---- exceptions, changed defaults, rows the join added, questions ---------------------------------

test("an exception and a changed default keep their reason; a waiting question is taken off and named; a row the join added stays", () => {
  const dir = adopted();
  // The widths this repository checks its screens at, which the core holds otherwise as a default.
  const widths = [390, 1280];
  put(dir, "design/screen-sizes.json", json({ version: 1, widths }));
  const place = coreFolder({
    extra: [
      answer("record-panel", "value", "beside", "locked", null),
      answer(
        "test-screen-sizes",
        "value",
        [...widths, 1920],
        "default",
        "tool:tools/design-assembly/check.mjs",
      ),
      answer("family-own-rule", "rule", "a list never scrolls sideways", "locked", null),
    ],
  });
  const list = listIn();
  const pin = pinOf(place);
  // The colour differs from the locked one: a question waits. The widths differ from the default.
  assert.equal(join(dir, place, list).status, 1);
  assert.ok(existsSync(path.join(dir, `design/waiting/core-source-color-${pin}.json`)));
  assert.equal(sourceOf(dir, "record-panel"), PINNED_CORE.file);
  const tokens = sha(readFileSync(path.join(dir, "design/tokens.json")));

  // Left while the question waits: it is taken off, by name, and the row was never marked.
  const first = adopted();
  cpSync(dir, first, { recursive: true });
  const early = leave(first, list, ["--core", place]);
  assert.equal(early.status, 0, early.stderr);
  assert.match(
    early.stdout,
    new RegExp(`questions about the core taken off the waiting list: core-source-color-${pin}`),
  );
  assert.ok(!existsSync(path.join(first, "design/waiting")), "the folder it emptied is gone");
  assert.equal(noteOf(first, "source-color"), null);
  assert.equal(gate(first).status, 0, gate(first).stderr);

  // Here the owner keeps the repository's colour as an exception first.
  const answers = path.join(empty(), "answers.txt");
  writeFileSync(answers, `core-source-color-${pin} refuse the regulator asks for this grey\n`);
  const decided = run(
    "decide.mjs",
    ["--target", dir, "--answers", answers, "--by", OWNER, "--on", JOINED_ON],
    list,
  );
  assert.notEqual(decided.status, 2, decided.stderr);
  assert.equal(
    core(["--target", dir, "--settle", "--by", MEMBER, "--on", JOINED_ON], list).status,
    0,
  );
  assert.match(noteOf(dir, "source-color"), /^kept against the family core at /);
  assert.match(noteOf(dir, "test-screen-sizes"), /^changed from the family core at /);

  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  // The exception and the changed default lose their meaning: the answer is simply the
  // repository's own, and the reason a person gave for it stays, word for word.
  assert.equal(
    noteOf(dir, "source-color"),
    `${leftHead}, once kept against the family core at ${pin}: the regulator asks for this grey (by ${OWNER} on ${JOINED_ON}); answered by ${OWNER} on ${JOINED_ON}`,
  );
  assert.equal(
    noteOf(dir, "test-screen-sizes").split("; ")[0],
    `${leftHead}, once changed from the family core at ${pin}: the repository's own answer from before it joined the family (by ${MEMBER} on ${JOINED_ON})`,
  );
  assert.match(done.stdout, /source-color: once kept against the core as an exception/);
  assert.match(
    done.stdout,
    /test-screen-sizes: once a default of the core this repository changed/,
  );
  // The answered question stays, as the record of what the owner said; none waits.
  assert.match(done.stdout, /no question about the core waits on the owner/);
  assert.match(
    done.stdout,
    new RegExp(`answered already, kept as the record of what was said: core-source-color-${pin}`),
  );
  assert.ok(existsSync(path.join(dir, `design/waiting/core-source-color-${pin}.json`)));
  // A row the join added because the ledger lacked it stays, as the repository's own; one whose
  // value only the copy held keeps the value as its source.
  assert.match(
    noteOf(dir, "family-own-rule"),
    /^own since .* once inherited from the family core at /,
  );
  assert.equal(sourceOf(dir, "family-own-rule"), "a list never scrolls sideways");
  assert.equal(sourceOf(dir, "record-panel"), "beside");
  assert.match(
    done.stdout,
    /record-panel: once inherited, at [0-9a-f]{12}; its value, beside, was held by the copy alone and is kept as the row's source/,
  );
  // No value of the repository moved, and the gate is green.
  assert.equal(sha(readFileSync(path.join(dir, "design/tokens.json"))), tokens);
  assert.deepEqual(read(dir, "design/screen-sizes.json").widths, widths);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("a question of the shared waiting file is taken off as a row, and the file stays", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const pin = pinOf(place);
  put(
    dir,
    "design/waiting-list.json",
    json({
      version: 1,
      rows: [
        { id: `core-source-color-${pin}`, question: "Follow the core, or keep this colour?" },
        { id: "another-question", question: "Which empty state does the list show?" },
      ],
    }),
  );
  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(
    read(dir, "design/waiting-list.json").rows.map((row) => row.id),
    ["another-question"],
  );
  assert.match(done.stdout, new RegExp(`taken off the waiting list: core-source-color-${pin}`));
});

// ---- the breaking ones ----------------------------------------------------------------------------

test("a wrong call ends with 2 and writes nothing: no person, no reason, an address, a second move, a core of another family", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const other = coreFolder({ family: "Another Line", name: "another-core" });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const before = snapshot(dir);
  const coreBefore = snapshot(place);
  const listBefore = text(path.dirname(list), "cores.json");
  const target = ["--target", dir, "--leave"];
  const calls = [
    [[...target, "--why", WHY], /say who said the repository leaves, with --by NAME/],
    [[...target, "--by", MEMBER], /say why the repository leaves, with --why REASON/],
    [[...target, "--by", MEMBER, "--why", "  "], /say why the repository leaves/],
    [[...target, "--by", MEMBER, "--why", WHY, "--why", "again"], /--why is given once to --leave/],
    [
      [...target, "--by", "bo.tran@example.invalid", "--why", WHY],
      /--by holds an e-mail address; a name and a reason, never an address/,
    ],
    [
      [...target, "--by", MEMBER, "--why", "ask ana@example.invalid about it"],
      /--why holds an e-mail address/,
    ],
    [[...target, "--by", MEMBER, "--why", WHY, "--on", "2026-13-01"], /is not a day written/],
    [[...target, "--join", "--by", MEMBER, "--why", WHY], /are two calls; give one/],
    [
      [...target, "--by", MEMBER, "--why", WHY, "--family", "x"],
      /--family is not taken by --leave/,
    ],
    [
      [...target, "--by", MEMBER, "--why", WHY, "--core", other],
      /is the core of Another Line, and this repository declares the family Quillon Harbour Suite/,
    ],
  ];
  for (const [args, message] of calls) {
    const done = core(args, list);
    assert.equal(done.status, 2, args.join(" "));
    assert.match(done.stderr, message);
    assert.equal(done.stdout, "");
  }
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(place), coreBefore);
  assert.deepEqual(snapshot(other).length > 0, true);
  assert.equal(text(path.dirname(list), "cores.json"), listBefore);
  // Two cores of the family on the machine's list that both name the repository: never a guess.
  const copy = path.join(empty(), "quillon-core-copy");
  cpSync(place, copy, { recursive: true });
  const listed = read(path.dirname(list), "cores.json");
  listed.cores.push({ ...listed.cores[0], path: copy });
  writeFileSync(list, json(listed));
  const two = leave(dir, list);
  assert.equal(two.status, 2);
  assert.match(
    two.stderr,
    /say which core to leave, with --core DIR: the machine's list holds 2 cores of this family that name member-app/,
  );
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(snapshot(copy), coreBefore);
  // A waiting list nobody can read stops the move too: nothing is half taken off.
  put(dir, "design/waiting-list.json", "{ not json");
  const broken = leave(dir, list, ["--core", place]);
  assert.equal(broken.status, 2);
  assert.match(broken.stderr, /the waiting list cannot be read .*Nothing was written/);
  assert.ok(existsSync(path.join(dir, PINNED_CORE.file)));
});

test("a repository of no family is told so, and leaving twice writes nothing the second time", () => {
  const list = listIn();
  for (const dir of [floor("lone-app"), adopted()]) {
    const before = snapshot(dir);
    const done = leave(dir, list);
    assert.equal(done.status, 0, done.stderr);
    assert.match(
      done.stdout,
      /is of no family: this repository declares no family\. Nothing was written/,
    );
    assert.deepEqual(snapshot(dir), before);
    assert.ok(!existsSync(list), "no list is made for it");
    assert.equal(JSON.parse(leave(dir, list, ["--json"]).stdout).left, false);
  }
  // A library someone named core is a library, not a family.
  const library = adopted();
  put(library, PINNED_CORE.file, json({ version: 1, id: "core", title: "A library" }));
  assert.match(leave(library, list).stdout, /is of no family/);
  assert.ok(existsSync(path.join(library, PINNED_CORE.file)));

  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(leave(dir, list).status, 0);
  const left = snapshot(dir);
  const coreLeft = snapshot(place);
  const listLeft = text(path.dirname(list), "cores.json");
  const twice = leave(dir, list, ["--on", "2026-12-01"]);
  assert.equal(twice.status, 0, twice.stderr);
  assert.match(twice.stdout, /is of no family/);
  assert.deepEqual(snapshot(dir), left);
  assert.deepEqual(snapshot(place), coreLeft);
  assert.equal(text(path.dirname(list), "cores.json"), listLeft);
});

test("a copy that cannot be read does not stop a repository from leaving: the move works from the declaration and the marks", () => {
  const dir = adopted();
  const place = coreFolder({
    colour: primaryOf(dir),
    extra: [answer("record-panel", "value", "beside", "locked", null)],
  });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  const pin = pinOf(place);
  // The copy no longer is the file the core was pinned with.
  put(dir, "design/core/answers.json", json({ version: 1, answers: [] }));
  put(dir, "design/core/notes.txt", "a file somebody put beside the copy\n");
  assert.equal(gate(dir).status, 1, "the gate is red while the copy is broken");
  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  assert.match(
    done.stdout,
    /the copy of the core here cannot be read \(design\/core\/answers\.json is not the file the core was pinned with: its sha256 differs\): the move works from the declaration and the marks alone/,
  );
  assert.match(
    noteOf(dir, "source-color"),
    new RegExp(`^own since ${LEFT_ON}, .* once inherited from the family core at ${pin}`),
  );
  // A value only the broken copy held is not taken from it: the row says so, and so does the move.
  assert.match(sourceOf(dir, "record-panel"), /^not kept: the copy of the family core/);
  assert.match(done.stdout, /record-panel: .* which could not be read: settle it again/);
  // The files of the copy are gone; a file anybody else put there stays, and is said.
  assert.ok(!existsSync(path.join(dir, PINNED_CORE.file)));
  assert.ok(!existsSync(path.join(dir, "design/core/answers.json")));
  assert.ok(existsSync(path.join(dir, "design/core/notes.txt")));
  assert.match(done.stdout, /left in place: design\/core\/notes\.txt is no file of the copy/);
  assert.deepEqual(read(place, "core.json").members, []);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);

  // A declaration nobody can read: the family is not known, so the core is named, or left to do.
  const blind = adopted();
  const second = coreFolder({ colour: primaryOf(blind), name: "second-core" });
  const blindList = listIn();
  assert.equal(join(blind, second, blindList).status, 0);
  put(blind, PINNED_CORE.file, "{ not json");
  const unknown = leave(blind, blindList, ["--dry-run"]);
  assert.equal(unknown.status, 1, unknown.stderr);
  assert.match(unknown.stdout, /member-app would leave its family: said by/);
  assert.match(
    unknown.stdout,
    /the core folder was not reached \(the declaration could not be read, so the family is not known: name the core with --core DIR\)/,
  );
  const named = leave(blind, blindList, ["--core", second]);
  assert.equal(named.status, 0, named.stderr);
  assert.deepEqual(read(second, "core.json").members, []);
  assert.ok(!existsSync(path.join(blind, "design/core")));
  assert.match(
    noteOf(blind, "source-color"),
    /^own since .* once inherited from the family core at /,
  );
  assert.equal(gate(blind).status, 0, gate(blind).stderr);
});

test("a core that cannot be reached: the repository leaves all the same, and the move says what is left to do there", () => {
  const cases = {
    "the folder is gone": (place) => rmSync(place, { recursive: true }),
    "no list on this machine": (place, list) => rmSync(list),
    "a core of a newer shape": (place) => {
      const data = read(place, "core.json");
      put(place, "core.json", json({ ...data, version: 99 }));
    },
    "a core whose shape does not hold": (place) => {
      const data = read(place, "core.json");
      delete data.owner;
      put(place, "core.json", json(data));
    },
  };
  for (const [name, breakIt] of Object.entries(cases)) {
    const dir = adopted();
    const place = coreFolder({ colour: primaryOf(dir) });
    const list = listIn();
    assert.equal(join(dir, place, list).status, 0, name);
    breakIt(place, list);
    const coreBroken = snapshot(place);
    const done = leave(dir, list);
    assert.equal(done.status, 1, `${name}: ${done.stderr}`);
    assert.match(done.stdout, /member-app left the family/, name);
    assert.match(done.stdout, /left to do in the core: .*take that line out there by hand/, name);
    assert.ok(!existsSync(path.join(dir, PINNED_CORE.file)), name);
    assert.equal(gate(dir).status, 0, name);
    assert.deepEqual(snapshot(place), coreBroken, `${name}: the core is left as it was`);
  }
  // Two cores of the family on the list, the one that names the repository broken: the other,
  // which does not name it, is not taken for the whole answer.
  {
    const dir = adopted();
    const place = coreFolder({ colour: primaryOf(dir) });
    const list = listIn();
    assert.equal(join(dir, place, list).status, 0);
    const spare = coreFolder({ colour: primaryOf(dir), name: "spare-core" });
    const listed = read(path.dirname(list), "cores.json");
    listed.cores.push({ ...listed.cores[0], path: spare });
    writeFileSync(list, json(listed));
    put(place, "core.json", json({ ...read(place, "core.json"), version: 99 }));
    const done = leave(dir, list);
    assert.equal(done.status, 1, done.stderr);
    assert.match(
      done.stdout,
      /the core folder was not reached \(.*update the design-assembly plugin/,
    );
    assert.doesNotMatch(done.stdout, /nothing to take out/);
  }
  // Named with --core, a core the list does not hold is reached; one that lists no such member
  // has nothing to take out.
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  rmSync(list);
  const named = leave(dir, list, ["--core", place]);
  assert.equal(named.status, 0, named.stderr);
  assert.deepEqual(read(place, "core.json").members, []);
  const again = adopted();
  assert.equal(join(again, place, list).status, 0);
  const emptied = read(place, "core.json");
  put(place, "core.json", json({ ...emptied, members: [] }));
  const nothing = leave(again, list);
  assert.equal(nothing.status, 0, nothing.stderr);
  assert.match(nothing.stdout, /names no line for member-app under members: nothing to take out/);
  // A folder named with --core that is not there: the same, and the move says so.
  const far = adopted();
  assert.equal(join(far, place, list).status, 0);
  const missing = leave(far, list, ["--core", path.join(empty(), "nowhere")]);
  assert.equal(missing.status, 1);
  assert.match(
    missing.stdout,
    /the core folder was not reached \(.*nowhere is not a folder that can be reached now\)/,
  );
  assert.equal(read(place, "core.json").members.length, 1);
});

test("a list of cores nobody can read is never written: the repository leaves, and the move says the list was left", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  writeFileSync(list, "{ not json");
  const done = leave(dir, list, ["--core", place]);
  assert.equal(done.status, 0, done.stderr);
  assert.match(
    done.stdout,
    /the machine's list of cores \(.*\) was not written: .* is not valid JSON: the list was left as it is/,
  );
  assert.equal(readFileSync(list, "utf8"), "{ not json");
  assert.deepEqual(read(place, "core.json").members, []);
  // Without the core named, the broken list also means the core is not reached.
  const second = adopted();
  const fine = listIn();
  assert.equal(join(second, place, fine).status, 0);
  writeFileSync(fine, "{ not json");
  const blind = leave(second, fine);
  assert.equal(blind.status, 1);
  assert.match(
    blind.stdout,
    /the core folder was not reached \(the machine's list of cores cannot be read/,
  );
  assert.ok(!existsSync(path.join(second, PINNED_CORE.file)));
});

// ---- joining again ----------------------------------------------------------------------------------

test("a repository that left joins again, the same family or another; one that is a member is told to leave first", () => {
  const dir = adopted();
  const place = coreFolder({
    colour: primaryOf(dir),
    extra: [answer("only-here-rule", "rule", "a list keeps its place", "default", null)],
  });
  const other = coreFolder({
    colour: primaryOf(dir),
    family: "Another Line",
    name: "another-core",
    extra: [answer("another-rule", "rule", "a form keeps what was typed", "default", null)],
  });
  const list = listIn();
  assert.equal(join(dir, place, list).status, 0);
  // A member of one family is refused a second, and the refusal names the move.
  const refused = join(dir, other, list);
  assert.equal(refused.status, 2);
  assert.match(
    refused.stderr,
    /a repository is of one family: leave the one it is of first, with core --leave/,
  );
  assert.doesNotMatch(refused.stderr, /not built yet/);

  assert.equal(leave(dir, list).status, 0);
  // The same family again: the row is inherited once more, and its mark stands in the old one's place.
  assert.equal(join(dir, place, list).status, 0);
  const pin = pinOf(place);
  assert.equal(
    noteOf(dir, "source-color"),
    `inherited from the family core at ${pin}; answered by ${OWNER} on ${BUILT_ON}`,
  );
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  assert.deepEqual(
    read(place, "core.json").members.map((member) => member.repository),
    ["member-app"],
  );
  // Left again, then another family.
  assert.equal(leave(dir, list, ["--on", "2026-11-28"]).status, 0);
  assert.match(noteOf(dir, "source-color"), /^own since 2026-11-28, /);
  assert.equal((noteOf(dir, "source-color").match(/own since/g) ?? []).length, 1);
  const moved = join(dir, other, list);
  assert.equal(moved.status, 0, moved.stderr);
  assert.equal(read(dir, PINNED_CORE.file).family, "Another Line");
  assert.match(
    noteOf(dir, "source-color"),
    new RegExp(`^inherited from the family core at ${pinOf(other)}`),
  );
  // A row of the first family the second does not answer keeps saying it is the repository's own.
  assert.match(noteOf(dir, "only-here-rule"), /^own since 2026-11-28, /);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

// ---- every kind of repository -----------------------------------------------------------------------

test("a repository with no ledgers that had joined: only the declaration, the copy and its question are removed", () => {
  for (const withMakefile of [true, false]) {
    const dir = floor();
    if (!withMakefile) rmSync(path.join(dir, "Makefile"));
    const place = coreFolder();
    const list = listIn();
    const before = snapshot(dir);
    assert.ok([0, 1].includes(join(dir, place, list).status));
    assert.ok(existsSync(path.join(dir, PINNED_CORE.file)));
    const done = leave(dir, list);
    assert.equal(done.status, 0, done.stderr);
    assert.match(
      done.stdout,
      /answers that are the repository's own from 2026-11-27, each value as it was: 0/,
    );
    assert.match(done.stdout, /the gate held no check of the core here/);
    assert.deepEqual(snapshot(dir), before, "as before it joined");
    assert.deepEqual(read(place, "core.json").members, []);
  }
});

test("a repository whose tool is older than the check family-core: nothing to take off, and its gate ends as before", () => {
  const dir = adopted();
  // The tool as it was before the check had a name.
  for (const file of readdirSync(path.join(dir, "tools/design-assembly"))) {
    if (!file.endsWith(".mjs")) continue;
    const at = `tools/design-assembly/${file}`;
    put(dir, at, text(dir, at).replaceAll("FAMILY_CORE_CHECK", "LOCKED_ANSWERS_CHECK"));
  }
  const before = gate(dir);
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  const joined = join(dir, place, list);
  assert.equal(joined.status, 0, joined.stderr);
  assert.match(
    joined.stdout,
    /the tool of this repository is older than the check of locked answers/,
  );
  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  assert.match(done.stdout, /the gate held no check of the core here/);
  assert.match(noteOf(dir, "source-color"), /^own since /);
  const after0 = gate(dir);
  assert.equal(after0.status, before.status);
  assert.equal(after0.stderr, before.stderr);
});

test("the move says when the repository's exports fall behind, and writes none", () => {
  const dir = guided();
  assert.equal(run("bring-out.mjs", ["--target", dir], listIn()).status, 0);
  const place = coreFolder();
  const list = listIn();
  const writeExports = () =>
    spawnSync(execPath, [path.join(dir, "tools/design-assembly/exports.mjs"), "--write"], {
      cwd: dir,
      encoding: "utf8",
    });
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(writeExports().status, 0);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  const exported = sha(readFileSync(path.join(dir, "DESIGN.md")));
  const dry = leave(dir, list, ["--dry-run", "--json"]);
  assert.ok(JSON.parse(dry.stdout).exports.behind.includes("DESIGN.md"));
  const done = leave(dir, list);
  assert.equal(done.status, 0, done.stderr);
  assert.match(
    done.stdout,
    /the exports are behind the design ledgers \(DESIGN\.md, .*\), so the gate's row design-exports is red until they are written again: make design-exports/,
  );
  assert.equal(sha(readFileSync(path.join(dir, "DESIGN.md"))), exported, "no export is written");
  const red = gate(dir);
  assert.equal(red.status, 1);
  assert.match(red.stderr, /design-exports/);
  assert.equal(writeExports().status, 0);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

// ---- a separate working folder ------------------------------------------------------------------------

test("from a separate working folder of git, the move prints the same and leaves the same repository", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "adopted");
  assert.equal(join(dir, place, list).status, 0);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "joined");
  const work = path.join(path.dirname(dir), "member-work");
  assert.equal(git(dir, "worktree", "add", "-q", work).status, 0);
  const preview = (target) => leave(target, list, ["--dry-run"]);
  const [main, other] = [preview(dir), preview(work)];
  assert.equal(other.status, main.status);
  assert.equal(other.stdout, main.stdout);
  assert.match(other.stdout, /member-app would leave the family/);
  // Left from the working folder: the core loses the repository by its own name, and the no on
  // this machine is kept by its main folder.
  const done = leave(work, list);
  assert.equal(done.status, 0, done.stderr);
  assert.deepEqual(read(place, "core.json").members, []);
  assert.deepEqual(read(path.dirname(list), "cores.json").declined, [
    { repository: dir, on: LEFT_ON, how: "left" },
  ]);
  assert.ok(!existsSync(path.join(work, PINNED_CORE.file)));
  assert.ok(existsSync(path.join(dir, PINNED_CORE.file)), "the other folder's files are its own");
  assert.equal(core(["--target", dir, "--ask"], list).status, 0);
});

// ---- no network, no name of a family -------------------------------------------------------------------

// The files this slice adds under the plugin.
const SLICE_FILES = [
  "scripts/core-leave.mjs",
  "scripts/core-leave-call.mjs",
  "tests/test-core-leave.mjs",
];

test("the move reaches no network, and the family's name is the user's data: it is in no file once the repository left", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  const log = path.join(empty(), "network.log");
  const guarded = (args) =>
    core(args, list, { guard: true, env: { DESIGN_ASSEMBLY_NETWORK_LOG: log } });
  // Every file of a folder that holds the family's name.
  const holding = (folder) =>
    snapshot(folder)
      .filter((line) => !line.endsWith("/"))
      .map((line) => line.split(" ")[0])
      .filter((file) => readFileSync(path.join(folder, file), "utf8").includes(FAMILY));
  assert.equal(guarded(["--target", dir, "--join", "--core", place, "--by", MEMBER]).status, 0);
  // While a member, the name is in the declaration and the copy of the core, and nowhere else.
  assert.deepEqual(holding(dir).sort(), ["design/core/core.json", PINNED_CORE.file]);
  assert.equal(
    guarded(["--target", dir, "--leave", "--by", MEMBER, "--why", WHY, "--dry-run"]).status,
    0,
  );
  const said = guarded(["--target", dir, "--leave", "--by", MEMBER, "--why", WHY]);
  assert.equal(said.status, 0, said.stderr);
  assert.ok(!existsSync(log) || readFileSync(log, "utf8") === "", "the network was reached");
  // Once it left, no file of the repository holds the name: not a mark, not the blueprint; the
  // core keeps it in its declaration alone.
  assert.deepEqual(holding(dir), []);
  assert.deepEqual(holding(place), ["core.json"]);
  // Nor does a file this slice adds to the plugin, but for this test, which is where the sample is.
  for (const file of SLICE_FILES.filter((one) => one !== "tests/test-core-leave.mjs")) {
    const words = readFileSync(path.join(PLUGIN, file), "utf8");
    assert.ok(!words.includes(FAMILY), file);
    assert.ok(!words.toLowerCase().includes(FAMILY.split(" ")[0].toLowerCase()), file);
  }
});

test("the files of the move name no repository the tests are run beside", () => {
  // The repositories this machine checks the plugin against, when they are named: none of their
  // names is in a file this slice adds, this test included.
  const beside = [env.DESIGN_ASSEMBLY_REFERENCE_LEDGER, env.DESIGN_ASSEMBLY_KIT]
    .filter(Boolean)
    .map((value) => path.basename(path.resolve(value)).toLowerCase())
    .filter((name) => name.length > 3);
  for (const file of SLICE_FILES) {
    const words = readFileSync(path.join(PLUGIN, file), "utf8").toLowerCase();
    for (const name of beside) assert.ok(!words.includes(name), `${file} names ${name}`);
  }
});

test("the page of the contract says the marks of a family left, what the machine's list records, and the line taken out of a core", () => {
  const page = readFileSync(path.join(PLUGIN, "references/contract.md"), "utf8").replace(
    /\s+/g,
    " ",
  );
  for (const words of [
    "own since <day>, when the repository left its family: <why> (by <name>), once",
    "`own`, by choice key",
    '`how: "left"`',
    "takes the repository's line out of `members`",
  ]) {
    assert.ok(page.includes(words), words);
  }
  const skill = readFileSync(path.join(PLUGIN, "skills/core/SKILL.md"), "utf8");
  assert.match(skill, /--leave --by <name> --why/);
  assert.doesNotMatch(skill, /Not built yet:.*leaving a family/s);
});
