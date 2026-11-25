// The core of a family of products, slice 1 (spec 0016, criteria 2, 3, 4, 14, 15 and the shape of
// 26): the shape of a core folder in the contract, with its version; the command that reads the
// first repository of a family, lays out the lock-or-default sheet and builds the core folder from
// the answers; and the check of a core's shape. Every repository is a fixture: nothing calls a
// model or the network, and no test reads or writes anything outside its own throwaway folders.
import assert from "node:assert/strict";
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
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { CORE, LEDGERS } from "../templates/tools/design-assembly/contract.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORE_COMMAND = path.join(PLUGIN, "scripts/core.mjs");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const ON = "2026-11-25";
// A family's name as a person gives it: the user's data, which only the core folder may hold.
const FAMILY = "Quillon Harbour Suite";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-core-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const read = (dir, file) => JSON.parse(readFileSync(path.join(dir, file), "utf8"));
const core = (args, options = {}) =>
  spawnSync(execPath, [CORE_COMMAND, ...args], { encoding: "utf8", ...options });
const git = (dir, ...args) =>
  spawnSync(
    "git",
    ["-C", dir, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args],
    {
      encoding: "utf8",
    },
  );

// The decision ledger, one block per row, as the ledger is written.
function ledger(rows) {
  const lines = ["version: 1", "decisions:"];
  for (const row of rows) {
    lines.push(`  - id: ${row.id}`, `    layer: ${row.layer}`, `    kind: ${row.kind}`);
    lines.push(`    source: ${JSON.stringify(row.source)}`);
    if (row.check) lines.push(`    check: ${JSON.stringify(row.check)}`);
    if (row.note) lines.push(`    note: ${JSON.stringify(row.note)}`);
  }
  return `${lines.join("\n")}\n`;
}

// The rows a repository that kept its ledger keeps, the behaviour rules among them.
const ROWS = [
  {
    id: "source-color",
    layer: "foundations",
    kind: "judgment",
    source: "design/blueprint.json",
    note: "answered by Ana Reyes on 2026-11-20",
  },
  {
    id: "record-panel",
    layer: "patterns",
    kind: "closed",
    source: "design/blueprint.json, list-detail layout: over",
    check: "tool:tools/design-assembly/check.mjs",
  },
  {
    id: "table-density",
    layer: "components",
    kind: "formula",
    source: "whether the columns fit at their least width",
    check: "tool:tools/design-assembly/check.mjs",
  },
  {
    id: "type-scale-values",
    layer: "foundations",
    kind: "standard",
    source: "the framework's type scale",
    check: "tool:tools/design-assembly/check.mjs",
  },
  {
    id: "test-screen-sizes",
    layer: "templates",
    kind: "formula",
    source: "the widths every page is checked at",
    check: "tool:tools/design-assembly/check.mjs",
  },
  {
    id: "failed-action",
    layer: "patterns",
    kind: "closed",
    source: "the repository's own test of it",
    check: "test:tests/failed-action.test.tsx",
  },
  {
    id: "focus-after-action",
    layer: "patterns",
    kind: "standard",
    source: "the repository's own browser test of it",
    check: "e2e:tests/e2e/templates.spec.ts",
  },
  {
    id: "labels",
    layer: "content",
    kind: "closed",
    source: "one place for every word a screen shows",
    check: "tool:tools/design-assembly/check.mjs",
  },
];

// A blueprint the guide wrote, every layer the person's or the guide's proposal.
function blueprint(source) {
  return {
    version: 1,
    status: "approved",
    layers: {
      context: {
        status: "decided",
        source,
        choice: { product_type: "application", conformance_level: "AA" },
      },
      foundations: {
        status: "decided",
        source,
        choice: {
          source_color: "#0246ff",
          type_scale: "modular",
          type_ratio: "1.25",
          corner_radius: "floor",
        },
        ...(source === "user"
          ? { answered: { source_color: { by: "Ana Reyes", on: "2026-11-20" } } }
          : {}),
      },
      patterns: { status: "decided", source, choice: { record_panel: "over" } },
    },
  };
}

// The repositories a first repository can be, each in git with one commit. `guided` the guide built,
// with a blueprint and widths; `proposed` the same, every answer still the guide's proposal;
// `adopted` kept by adopting, with only the decision ledger and the token file, no Makefile; `bare`
// no ledger at all; `other` another stack, adopted, with no token file and no Makefile.
const KINDS = {
  guided(dir) {
    put(dir, "Makefile", "check:\n\t@true\n");
    put(dir, "package.json", json({ name: "first-app", private: true }));
    put(dir, LEDGERS.blueprint.file, json(blueprint("user")));
    put(dir, LEDGERS.decisions.file, ledger(ROWS));
    put(dir, LEDGERS["screen-sizes"].file, json({ version: 1, widths: [320, 768, 1440] }));
  },
  proposed(dir) {
    KINDS.guided(dir);
    put(dir, LEDGERS.blueprint.file, json(blueprint("proposed")));
    put(
      dir,
      LEDGERS.decisions.file,
      ledger(
        ROWS.map((row) =>
          row.id === "source-color"
            ? { ...row, note: "proposed by the guide; a person has not confirmed it" }
            : row.id === "table-density"
              ? { ...row, note: "read from the repository; a person has not confirmed it" }
              : row,
        ),
      ),
    );
    // A behaviour rule a question still asks about on the decision sheet.
    put(
      dir,
      "design/waiting/Q1.json",
      json({
        id: "Q1",
        question: "Keep what a failed action shows?",
        recommendation: "Keep",
        basis: "The rule the guide wrote.",
        hard_to_undo: false,
        where: "design/decisions.yaml",
        if_refused: "Write another rule.",
        item: "decision:failed-action",
      }),
    );
  },
  adopted(dir) {
    put(dir, "package.json", json({ name: "adopted-app", private: true }));
    put(
      dir,
      LEDGERS.decisions.file,
      ledger([
        {
          id: "source-color",
          layer: "foundations",
          kind: "judgment",
          source: "src/app/globals.css",
        },
        {
          id: "record-panel",
          layer: "patterns",
          kind: "closed",
          source: "design/behaviors.md",
          check: "test:tests/behavior.test.tsx",
        },
        {
          id: "table-density",
          layer: "core",
          kind: "formula",
          source: "total minimum width",
          check: "e2e:tests/e2e/grid.spec.ts",
        },
        {
          id: "grid-continuous-run",
          layer: "patterns",
          kind: "closed",
          source: "design/behaviors.md",
        },
        { id: "copy-content", layer: "product", kind: "judgment", source: "reviewer" },
      ]),
    );
    put(
      dir,
      LEDGERS.tokens.file,
      json({ color: { primary: { $type: "color", $value: "#cc785c" } } }),
    );
  },
  bare(dir) {
    put(dir, "package.json", json({ name: "bare-app", private: true }));
    put(dir, "src/main.ts", "export {};\n");
  },
  other(dir) {
    put(dir, "pyproject.toml", '[project]\nname = "other-app"\n');
    put(
      dir,
      LEDGERS.decisions.file,
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
  },
};

// A first repository of a kind, in a folder of its own beside the throwaway folder's others.
function first(kind) {
  const parent = empty();
  const dir = path.join(parent, `${kind}-app`);
  mkdirSync(dir);
  KINDS[kind](dir);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "first");
  return dir;
}

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
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
const clean = (dir) => git(dir, "status", "--porcelain").stdout;
const ids = (items) => items.map((item) => item.id);
const built = (dir, place, extra = []) =>
  core([
    "--target",
    dir,
    "--build",
    "--family",
    FAMILY,
    "--core",
    place,
    "--by",
    "Ana Reyes",
    "--on",
    ON,
    "--lock",
    "source-color",
    "--lock",
    "record-panel",
    "--lock",
    "failed-action",
    "--default",
    "table-density",
    "--default",
    "type-scale-values",
    "--default",
    "test-screen-sizes",
    ...extra,
  ]);

test("the first repository the guide built: the answers a person settled, and a sheet of four questions", () => {
  const dir = first("guided");
  const before = snapshot(dir);
  const call = core(["--target", dir, "--json"]);
  assert.equal(call.status, 1, call.stderr);
  const result = JSON.parse(call.stdout);
  assert.equal(result.first.kind, "blueprint");
  assert.equal(result.first.repository, "guided-app");
  assert.deepEqual(ids(result.candidates), [
    "source-color",
    "record-panel",
    "table-density",
    "type-scale-values",
    "test-screen-sizes",
    "failed-action",
    "focus-after-action",
  ]);
  const by = Object.fromEntries(result.candidates.map((item) => [item.id, item]));
  // The value is the blueprint's where the guide asked it, the widths of the ledger of widths.
  assert.equal(by["source-color"].value, "#0246ff");
  assert.equal(by["record-panel"].value, "over");
  assert.equal(by["type-scale-values"].value, "modular 1.25");
  assert.deepEqual(by["test-screen-sizes"].value, [320, 768, 1440]);
  assert.equal(by["failed-action"].value, "the repository's own test of it");
  // Who settled it and when, where the ledgers say so; the check that holds it, or none.
  assert.deepEqual(by["source-color"].origin, {
    repository: "guided-app",
    ledger: "design/blueprint.json",
    by: "Ana Reyes",
    on: "2026-11-20",
  });
  assert.equal(by["source-color"].check, null);
  assert.equal(by["failed-action"].check, "test:tests/failed-action.test.tsx");
  // The starting sets: the source colour, how a record opens and the behaviour rules locked; the
  // table's density, the type scale and the widths defaults; copy stays out.
  assert.deepEqual(
    result.candidates.filter((item) => item.start === "locked").map((item) => item.id),
    ["source-color", "record-panel", "failed-action", "focus-after-action"],
  );
  assert.ok(!ids(result.candidates).includes("labels"));

  // Four questions in one sitting, each with what the decision sheet asks of a question.
  assert.deepEqual(ids(result.sheet), ["family", "locked", "default", "place"]);
  assert.ok(result.sheet.length <= 4);
  for (const question of result.sheet) {
    for (const key of ["question", "recommendation", "basis", "where", "if_refused"]) {
      assert.equal(typeof question[key], "string", `${question.id}.${key}`);
      assert.notEqual(question[key].trim(), "", `${question.id}.${key}`);
    }
  }
  assert.equal(
    result.sheet[1].recommendation,
    "source-color, record-panel, failed-action, focus-after-action",
  );
  assert.match(result.sheet[1].basis, /No check holds source-color/);
  assert.equal(
    result.sheet[2].recommendation,
    "table-density, type-scale-values, test-screen-sizes",
  );
  // The core lives beside the first repository, outside it, named after the family when it has one.
  assert.equal(result.core, path.join(path.dirname(dir), "family-core"));
  const named = JSON.parse(core(["--target", dir, "--family", FAMILY, "--json"]).stdout);
  assert.equal(named.core, path.join(path.dirname(dir), "quillon-harbour-suite-core"));
  assert.equal(named.sheet[0].recommendation, FAMILY);

  // For a person, the same answer and the same end; nothing written, here or beside it.
  const shown = core(["--target", dir]);
  assert.equal(shown.status, 1);
  assert.match(shown.stdout, /the lock-or-default sheet, 4 questions in one sitting/);
  assert.match(
    shown.stdout,
    /locked {3}source-color: #0246ff; no check holds it; settled by Ana Reyes on 2026-11-20/,
  );
  assert.deepEqual(snapshot(dir), before);
  assert.deepEqual(readdirSync(path.dirname(dir)), ["guided-app"]);
  assert.equal(clean(dir), "");
});

test("an answer the machine proposed and nobody confirmed is not a candidate, and the core refuses it", () => {
  const dir = first("proposed");
  const result = JSON.parse(core(["--target", dir, "--json"]).stdout);
  const left = Object.fromEntries(result.left_out.map((item) => [item.id, item.why]));
  assert.match(left["source-color"], /has not confirmed it/);
  assert.match(left["record-panel"], /proposed by the guide, and a person has not confirmed it/);
  assert.match(left["type-scale-values"], /proposed by the guide/);
  assert.match(left["table-density"], /a person has not confirmed it/);
  assert.match(left["failed-action"], /waits on the decision sheet as Q1/);
  assert.deepEqual(ids(result.candidates), ["test-screen-sizes", "focus-after-action"]);

  const place = path.join(path.dirname(dir), "family-core");
  for (const id of ["source-color", "failed-action"]) {
    const refused = core([
      "--target",
      dir,
      "--build",
      "--family",
      FAMILY,
      "--core",
      place,
      "--by",
      "Ana Reyes",
      "--lock",
      id,
    ]);
    assert.equal(refused.status, 2, refused.stdout);
    assert.equal(refused.stdout, "");
    assert.match(
      refused.stderr,
      new RegExp(`${id} is not an answer a person settled in proposed-app`),
    );
    assert.ok(!existsSync(place), "nothing was written");
  }
  assert.equal(clean(dir), "");
});

test("an adopted first repository with only its decision ledger and token file, and no Makefile", () => {
  const dir = first("adopted");
  const result = JSON.parse(core(["--target", dir, "--json"]).stdout);
  assert.equal(result.first.kind, "ledgers");
  const by = Object.fromEntries(result.candidates.map((item) => [item.id, item]));
  assert.deepEqual(Object.keys(by), [
    "source-color",
    "record-panel",
    "table-density",
    "grid-continuous-run",
  ]);
  // The source colour is read from the token file; a rule's value is what its row says.
  assert.equal(by["source-color"].value, "#cc785c");
  assert.equal(by["source-color"].origin.ledger, "design/tokens.json");
  assert.equal(by["record-panel"].value, "design/behaviors.md");
  assert.equal(by["record-panel"].check, "test:tests/behavior.test.tsx");
  // A layer named the older way is read as the layer it stands for; a rule of its own is a
  // behaviour rule when it is one of the behaviour layer.
  assert.equal(by["table-density"].start, "default");
  assert.equal(by["grid-continuous-run"].start, "locked");
  assert.equal(by["grid-continuous-run"].check, null);
  // The ledger names no one: settled, with no name.
  assert.equal(by["source-color"].origin.by, null);
  const left = Object.fromEntries(result.left_out.map((item) => [item.id, item.why]));
  assert.equal(left["type-scale-values"], "the repository has not answered it");

  const place = path.join(path.dirname(dir), "family-core");
  const done = built(dir, place, []).status;
  // type-scale-values and test-screen-sizes are not answered here: the call is refused whole.
  assert.equal(done, 2);
  const build = core([
    "--target",
    dir,
    "--build",
    "--family",
    FAMILY,
    "--core",
    place,
    "--by",
    "Ana Reyes",
    "--on",
    ON,
    "--lock",
    "source-color",
    "--lock",
    "record-panel",
    "--lock",
    "grid-continuous-run",
    "--default",
    "table-density",
    "--json",
  ]);
  assert.equal(build.status, 0, build.stderr);
  assert.equal(clean(dir), "");
  assert.equal(core(["--check", "--core", place]).status, 0);
  const answers = read(place, "answers.json").answers;
  assert.deepEqual(
    answers.map((item) => [item.id, item.hold]),
    [
      ["source-color", "locked"],
      ["record-panel", "locked"],
      ["table-density", "default"],
      ["grid-continuous-run", "locked"],
    ],
  );
  assert.match(answers[0].why, /names no one/);
});

test("a repository with no ledger, and one of another stack: the safe answer, said", () => {
  const bare = first("bare");
  const none = core(["--target", bare, "--json"]);
  assert.equal(none.status, 0, none.stderr);
  const result = JSON.parse(none.stdout);
  assert.equal(result.first.kind, "none");
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.sheet, []);
  assert.match(core(["--target", bare]).stdout, /no core can be built from it yet/);
  assert.equal(clean(bare), "");

  const other = first("other");
  const read = JSON.parse(core(["--target", other, "--json"]).stdout);
  const left = Object.fromEntries(read.left_out.map((item) => [item.id, item.why]));
  assert.match(
    left["source-color"],
    /design\/tokens\.json is not there, so the colour cannot be read/,
  );
  assert.deepEqual(ids(read.candidates), ["undo-or-confirm"]);
  assert.equal(read.candidates[0].check, "test:tests/test_undo.py");
  assert.equal(clean(other), "");
});

test("the core is built from the sheet's answers, its shape holds, and the first repository is left as it was", () => {
  const dir = first("guided");
  const before = snapshot(dir);
  const place = path.join(path.dirname(dir), "family-core");
  const preview = core([
    "--target",
    dir,
    "--build",
    "--family",
    FAMILY,
    "--core",
    place,
    "--by",
    "Ana Reyes",
    "--on",
    ON,
    "--lock",
    "source-color",
    "--default",
    "table-density",
    "--dry-run",
    "--json",
  ]);
  assert.equal(preview.status, 0, preview.stderr);
  const planned = JSON.parse(preview.stdout);
  assert.equal(planned.dry_run, true);
  assert.deepEqual(planned.files, [
    { path: path.join(place, "core.json"), change: "create" },
    { path: path.join(place, "answers.json"), change: "create" },
    { path: path.join(place, "blocks/index.json"), change: "create" },
  ]);
  assert.ok(!existsSync(place), "a preview writes nothing");

  const call = built(dir, place, ["--json"]);
  assert.equal(call.status, 0, call.stderr);
  const result = JSON.parse(call.stdout);
  assert.equal(result.dry_run, false);
  assert.deepEqual(snapshot(dir), before);
  assert.equal(clean(dir), "");
  assert.deepEqual(
    snapshot(place)
      .filter((line) => !line.endsWith("/"))
      .map((line) => line.split(" ")[0]),
    ["answers.json", "blocks/index.json", "core.json"],
  );

  const declaration = read(place, "core.json");
  assert.equal(declaration.version, CORE.version);
  assert.equal(declaration.family, FAMILY);
  assert.deepEqual(declaration.first, {
    repository: "guided-app",
    read_on: ON,
    commit: git(dir, "rev-parse", "HEAD").stdout.trim(),
  });
  // The first repository is where the answers came from, not a member until it says so.
  assert.deepEqual(declaration.members, []);
  assert.deepEqual(declaration.owner, { by: "Ana Reyes", on: ON });
  assert.deepEqual(read(place, "blocks/index.json"), { version: CORE.version, blocks: [] });

  const answers = read(place, "answers.json").answers;
  assert.deepEqual(
    answers.map((item) => [item.id, item.hold]),
    [
      ["source-color", "locked"],
      ["record-panel", "locked"],
      ["table-density", "default"],
      ["type-scale-values", "default"],
      ["test-screen-sizes", "default"],
      ["failed-action", "locked"],
    ],
  );
  // A locked answer carries the check of its row, or says none holds it; each is the person's word.
  for (const item of answers) {
    assert.ok("check" in item, item.id);
    assert.equal(item.by, "Ana Reyes");
    assert.equal(item.on, ON);
  }
  assert.equal(answers[0].check, null);
  assert.equal(answers[5].check, "test:tests/failed-action.test.tsx");
  // focus-after-action was settled and left out of both sets: it stays out of the core.
  assert.ok(!ids(answers).includes("focus-after-action"));

  const check = core(["--check", "--core", place, "--json"]);
  assert.equal(check.status, 0, check.stdout);
  assert.deepEqual(JSON.parse(check.stdout).problems, []);
  assert.match(core(["--check", "--core", place]).stdout, /its shape holds \(shape 1\)/);

  // A second build into the same folder writes nothing: changing a core is a later slice.
  const again = built(dir, place);
  assert.equal(again.status, 2);
  assert.match(again.stderr, /holds a family core already/);
});

test("a wrong shape is red and names the place", () => {
  const dir = first("guided");
  const place = path.join(path.dirname(dir), "family-core");
  assert.equal(built(dir, place).status, 0);
  const broken = (change, expected) => {
    const copy = path.join(empty(), "core");
    spawnSync("cp", ["-R", place, copy]);
    change(copy);
    const call = core(["--check", "--core", copy, "--json"]);
    assert.equal(call.status, 1, `${expected}: ${call.stderr}`);
    const { problems } = JSON.parse(call.stdout);
    assert.ok(
      problems.some((line) => expected.test(line)),
      `${expected} in ${problems.join(" | ")}`,
    );
  };
  const answers = (copy, edit) => {
    const data = read(copy, "answers.json");
    put(copy, "answers.json", json(edit(data)));
  };
  broken(
    (copy) =>
      answers(copy, (data) => {
        delete data.answers[0].check;
        return data;
      }),
    /^answers\.json\.answers\[0\]\.check is missing$/,
  );
  broken(
    (copy) =>
      answers(copy, (data) => ({ ...data, answers: [{ ...data.answers[0], hold: "fixed" }] })),
    /^answers\.json\.answers\[0\]\.hold is "fixed", not one of locked, default$/,
  );
  broken(
    (copy) => answers(copy, (data) => ({ ...data, answers: [data.answers[0], data.answers[0]] })),
    /^answers\.json answers source-color twice/,
  );
  broken((copy) => rmSync(path.join(copy, "core.json")), /^core\.json is missing/);
  broken((copy) => put(copy, "blocks/index.json", "{"), /^blocks\/index\.json is not valid JSON$/);
  broken(
    (copy) => put(copy, "core.json", json({ ...read(copy, "core.json"), family: " " })),
    /^core\.json\.family is " ", which is not written as the contract says$/,
  );
  // A member's report holds the key, name and description of a need, and never code.
  broken(
    (copy) =>
      put(
        copy,
        "members/second-app.json",
        json({
          version: 1,
          repository: "second-app",
          needs: [
            { need: "many-rows", name: "Table", description: "A long list.", code: "export {}" },
          ],
        }),
      ),
    /^members\/second-app\.json\.needs\[0\]\.code is not in the contract$/,
  );
  broken(
    (copy) =>
      put(copy, "members/other.json", json({ version: 1, repository: "second-app", needs: [] })),
    /^members\/other\.json is named other\.json and its repository is second-app/,
  );
});

test("a core of a newer shape is refused: the plugin writes nothing and says to update", () => {
  const dir = first("guided");
  const place = path.join(path.dirname(dir), "family-core");
  assert.equal(built(dir, place).status, 0);
  put(place, "core.json", json({ ...read(place, "core.json"), version: CORE.version + 1 }));
  const check = core(["--check", "--core", place]);
  assert.equal(check.status, 2);
  assert.equal(check.stdout, "");
  assert.match(
    check.stderr,
    /core\.json has shape 2 and this tool knows shape 1 of a family core: update the design-assembly plugin/,
  );

  // A newer part in a folder a build is pointed at: nothing is written there.
  const other = path.join(empty(), "newer-core");
  put(other, "answers.json", json({ version: CORE.version + 1, answers: [] }));
  const before = snapshot(other);
  const refused = built(dir, other);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /answers\.json has shape 2 .* update the design-assembly plugin/);
  assert.deepEqual(snapshot(other), before);
});

test("a wrong call, or a place that cannot take a core, ends with 2 and writes nothing", () => {
  const dir = first("guided");
  const beside = path.join(path.dirname(dir), "family-core");
  const cases = [
    [["--lock", "source-color"], /--lock is an answer of the sheet, given with --build/],
    [["--build", "--check", "--core", beside], /two calls/],
    [["--check"], /say which core to check/],
    [
      ["--build", "--core", beside, "--by", "Ana Reyes", "--lock", "source-color"],
      /the family's name/,
    ],
    [
      ["--build", "--family", FAMILY, "--by", "Ana Reyes", "--lock", "source-color"],
      /where the core lives/,
    ],
    [
      ["--build", "--family", FAMILY, "--core", beside, "--lock", "source-color"],
      /nothing is locked without a person/,
    ],
    [
      ["--build", "--family", FAMILY, "--core", beside, "--by", "Ana Reyes"],
      /name at least one answer/,
    ],
    [
      ["--build", "--family", FAMILY, "--core", beside, "--by", "Ana Reyes", "--lock", "labels"],
      /labels is no answer of guided-app that may go into a core/,
    ],
    [
      [
        "--build",
        "--family",
        FAMILY,
        "--core",
        beside,
        "--by",
        "Ana Reyes",
        "--lock",
        "source-color",
        "--default",
        "source-color",
      ],
      /named both locked and default/,
    ],
    [
      [
        "--build",
        "--family",
        FAMILY,
        "--core",
        beside,
        "--by",
        "Ana Reyes",
        "--on",
        "25/11/2026",
        "--lock",
        "source-color",
      ],
      /is not a day/,
    ],
    [
      [
        "--build",
        "--family",
        FAMILY,
        "--core",
        path.join(dir, "design/core"),
        "--by",
        "Ana Reyes",
        "--lock",
        "source-color",
      ],
      /is inside the first repository/,
    ],
    [
      [
        "--build",
        "--family",
        FAMILY,
        "--core",
        path.dirname(dir),
        "--by",
        "Ana Reyes",
        "--lock",
        "source-color",
      ],
      /lies inside/,
    ],
    [["--check", "--core", path.join(dir, "no-such-core")], /is not a folder/],
  ];
  const before = snapshot(path.dirname(dir));
  for (const [args, expected] of cases) {
    const call = core(["--target", dir, ...args]);
    assert.equal(call.status, 2, args.join(" "));
    assert.equal(call.stdout, "", args.join(" "));
    assert.match(call.stderr, expected, args.join(" "));
  }
  const full = path.join(empty(), "not-empty");
  put(full, "notes.txt", "mine\n");
  const refused = built(dir, full);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /is not empty/);
  assert.deepEqual(snapshot(path.dirname(dir)), before);
  assert.equal(clean(dir), "");
});

test("from a separate working folder of git, the repository is the same and the core lands beside its main folder", () => {
  const dir = first("guided");
  const work = path.join(dir, ".claude/worktrees/side");
  const added = git(dir, "worktree", "add", "-q", "-b", "side", work);
  assert.equal(added.status, 0, added.stderr);
  const fromWork = JSON.parse(core(["--target", work, "--json"]).stdout);
  const fromMain = JSON.parse(core(["--target", dir, "--json"]).stdout);
  assert.equal(fromWork.first.repository, "guided-app");
  assert.equal(fromWork.first.home, dir);
  assert.equal(fromWork.core, fromMain.core);
  assert.deepEqual(fromWork.candidates, fromMain.candidates);
  // A place inside the main folder is inside the repository, even from the separate folder.
  const inside = built(work, path.join(dir, "family-core"));
  assert.equal(inside.status, 2);
  assert.match(inside.stderr, /is inside the first repository/);
});

test("no command of the core reaches the network", () => {
  const dir = first("guided");
  const log = path.join(empty(), "network.log");
  const guarded = (args) =>
    spawnSync(execPath, ["--import", NO_NETWORK, CORE_COMMAND, ...args], {
      encoding: "utf8",
      env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log },
    });
  const place = path.join(path.dirname(dir), "family-core");
  assert.equal(guarded(["--target", dir, "--json"]).status, 1);
  const build = guarded([
    "--target",
    dir,
    "--build",
    "--family",
    FAMILY,
    "--core",
    place,
    "--by",
    "Ana Reyes",
    "--lock",
    "source-color",
  ]);
  assert.equal(build.status, 0, build.stderr);
  assert.equal(guarded(["--check", "--core", place]).status, 0);
  assert.ok(!existsSync(log) || readFileSync(log, "utf8") === "", "the network was reached");
});

// The files this slice adds under the plugin.
const SLICE_FILES = [
  "scripts/core.mjs",
  "scripts/core-read.mjs",
  "skills/core/SKILL.md",
  "references/core-questions.json",
  "tests/test-core.mjs",
];

test("the family's name is the user's data: it lands in the core folder alone", () => {
  const dir = first("guided");
  const place = path.join(path.dirname(dir), "quillon-core");
  assert.equal(built(dir, place).status, 0);
  const holding = (folder) =>
    snapshot(folder)
      .filter((line) => !line.endsWith("/"))
      .map((line) => line.split(" ")[0])
      .filter((file) => readFileSync(path.join(folder, file), "utf8").includes(FAMILY));
  // In the core, the declaration names it, and nothing else does.
  assert.deepEqual(holding(place), ["core.json"]);
  // Nowhere in the first repository, which is left as it was.
  assert.deepEqual(holding(dir), []);
  assert.equal(clean(dir), "");
  // Nor in a file this slice adds to the plugin, but for this test, which is where the sample is.
  for (const file of SLICE_FILES.filter((one) => one !== "tests/test-core.mjs")) {
    const text = readFileSync(path.join(PLUGIN, file), "utf8");
    assert.ok(!text.includes(FAMILY), file);
    assert.ok(!text.includes("quillon"), file);
  }
});

test("the plugin's files of the core name no repository the tests are run beside", () => {
  // The repositories this machine checks the plugin against, when they are named: none of their
  // names is in a file this slice adds.
  const beside = [env.DESIGN_ASSEMBLY_REFERENCE_LEDGER, env.DESIGN_ASSEMBLY_KIT]
    .filter(Boolean)
    .map((value) => path.basename(path.resolve(value)))
    .filter((name) => name.length > 3);
  for (const file of SLICE_FILES) {
    const text = readFileSync(path.join(PLUGIN, file), "utf8").toLowerCase();
    for (const name of beside)
      assert.ok(!text.includes(name.toLowerCase()), `${file} names ${name}`);
  }
});

test("a repository that stands alone is untouched: no other command reads or writes a core", () => {
  const scripts = readdirSync(path.join(PLUGIN, "scripts")).filter(
    (name) => name.endsWith(".mjs") && !["core.mjs", "core-read.mjs"].includes(name),
  );
  for (const name of scripts) {
    const text = readFileSync(path.join(PLUGIN, "scripts", name), "utf8");
    assert.doesNotMatch(text, /core-read\.mjs|\.\/core\.mjs|familyCoreProblems|CORE\.parts/, name);
  }
  // The core is not a ledger of a repository: the gate's list of ledgers does not hold it.
  assert.ok(
    !Object.values(LEDGERS).some((ledger) => (ledger.file ?? ledger.folder ?? "").includes("core")),
  );
});

test("the page of the contract names every part of a core, its file and its keys, and the shape's version", () => {
  const page = readFileSync(path.join(PLUGIN, "references/contract.md"), "utf8");
  const section = page.slice(page.indexOf("## Not a ledger: the core of a family"));
  assert.ok(section.length > 100, "the page has a section on the core");
  assert.match(section, new RegExp(`shape ${CORE.version}\\b`));
  for (const [part, spec] of Object.entries(CORE.parts)) {
    assert.ok(section.includes(`\`${part}\``), part);
    assert.ok(section.includes(spec.file ?? `${spec.folder}/`), spec.file ?? spec.folder);
    const keys = [
      ...Object.keys(spec.root),
      ...Object.values(spec.root).flatMap((field) =>
        Object.keys(field.items?.fields ?? field.fields ?? {}),
      ),
    ];
    for (const key of keys) assert.ok(section.includes(`\`${key}\``), `${part}.${key}`);
  }
});
