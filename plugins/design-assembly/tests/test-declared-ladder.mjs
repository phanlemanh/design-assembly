// The ladder the repository declares (specification 0015, slice 4, criteria 9 and 10): a pinned
// source says whether it stands before the starter kit and the family's store or after them, and
// find and intake walk the stores in that order; with nothing declared they walk as before. A pin
// kept inside the catalog the repository already has is read, so a catalog pinned in that shape
// answers. A source says which plug it is, so it need not share the plug's id; and an earlier
// choice of that plug at a ladder socket is applied once the plug is pinned as a source.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { find } from "../scripts/find.mjs";
import { boardOf, plan, report } from "../scripts/plugs.mjs";
import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import { readPinnedSources } from "../templates/tools/design-assembly/sources-ledger.mjs";
import { cleanUp, empty, healthyFiles, json, put, repo, source } from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE = path.join(PLUGIN, "scripts/intake.mjs");
const STATUS = path.join(PLUGIN, "scripts/status.mjs");

after(cleanUp);

const SOURCE_FILE = "design/sources/kit.json";
// A catalog of the source with a piece that answers the same words as a piece of the starter kit.
const CATALOG = {
  items: [
    {
      name: "held-label-pro",
      kind: "component",
      title: "Held label",
      description: "A label while an action waits",
    },
    { name: "filter-bar", kind: "block", title: "Filter bar", description: "Narrow a list" },
  ],
};
const store = (place) =>
  repo({
    ...healthyFiles(),
    "design/theme.json": json({ version: 1, checks: {} }),
    "design/kit-catalog.json": json(CATALOG),
    [SOURCE_FILE]: json({ ...source(), ...(place ? { ladder_place: place } : {}) }),
  });
const stores = (result) => result.searched.map((entry) => entry.store);
const intakeJson = (dir, ...args) => {
  const run = spawnSync(execPath, [INTAKE, "--target", dir, ...args, "--json"], {
    encoding: "utf8",
  });
  return { status: run.status, stderr: run.stderr, result: JSON.parse(run.stdout || "null") };
};

test("criterion 9: with nothing declared, the starter kit answers before an outside source, as before", () => {
  const dir = store(null);
  const found = find(dir, { words: "held label" });
  assert.deepEqual(
    found.matches.map((match) => [match.name, match.store]),
    [["HeldLabel", "starter"]],
  );
  assert.deepEqual(stores(found).slice(-3), ["starter", "family", "sources"]);
  assert.match(found.searched.at(-1).why, /a nearer store answers/);
  const { result } = intakeJson(dir, "--need", "label-while-action-waits");
  assert.equal(result.candidates[0].name, "HeldLabel");
  assert.equal(result.rung, "starter");
});

test("criterion 9: a source declared before the starter kit answers first, in find and in intake", () => {
  const dir = store("before-starter");
  assert.deepEqual(
    shapeProblems(
      "sources",
      `${json({ ...source(), ladder_place: "before-starter" })}`,
      SOURCE_FILE,
    ),
    [],
  );
  const found = find(dir, { words: "held label" });
  assert.deepEqual(
    found.matches.map((match) => [match.name, match.store]),
    [["held-label-pro", "sources/kit"]],
  );
  // The source is read right after the repository's own store; the starter kit and the family's
  // store are not read, since a nearer store answers.
  const order = stores(found);
  assert.ok(order.indexOf("sources/kit") < order.indexOf("starter"));
  for (const farther of ["starter", "family"]) {
    assert.match(
      found.searched.find((entry) => entry.store === farther).why,
      /a nearer store answers/,
    );
  }
  const { result } = intakeJson(dir, "--need", "label-while-action-waits");
  assert.equal(result.candidates[0].name, "held-label-pro");
  assert.equal(result.rung, "external");
  // Declared after, it walks as with nothing declared.
  const later = store("after-family");
  assert.deepEqual(
    find(later, { words: "held label" }).matches.map((match) => match.name),
    ["HeldLabel"],
  );
});

test("a place on the ladder that is none of the two is refused by the shape of the sources ledger", () => {
  const problems = shapeProblems(
    "sources",
    json({ ...source(), ladder_place: "first" }),
    SOURCE_FILE,
  );
  assert.ok(
    problems.some((line) => /ladder_place/.test(line)),
    problems.join("\n"),
  );
});

test("criterion 10: a catalog that keeps its own pin, as a repository pinned it in its own shape, is read through pin_file", () => {
  // The catalog in the shape a repository keeps it: its pin inside it, its items in groups.
  const pin = {
    fetched_at: "2026-11-11T01:42:13.053Z",
    files: [{ file: "r.json", url: "https://example.test/r.json", sha256: "a".repeat(64) }],
  };
  const catalog = {
    pin,
    counts: { block: 1 },
    groups: [
      {
        kind: "block",
        group: "Application",
        category: "Filters",
        base: "https://example.test/blocks/filters",
        items: [
          {
            name: "filters-1",
            title: "Filter by status",
            description: "Narrow a list by its status",
          },
        ],
      },
    ],
  };
  const dir = repo({
    "design/registry-catalog.json": json(catalog),
    "design/sources/registry.json": json({
      version: 1,
      id: "registry",
      order: 1,
      pin_file: "design/registry-catalog.json",
      catalog: "design/registry-catalog.json",
      ladder_place: "before-starter",
    }),
  });
  const [read] = readPinnedSources(dir);
  assert.equal(read.unreadable, null);
  assert.deepEqual(read.pin, pin);
  const found = find(dir, { words: "filter by status" });
  assert.deepEqual(
    found.matches.map((match) => [match.name, match.store, match.pin]),
    [["filters-1", "sources/registry", "2026-11-11T01:42:13.053Z"]],
  );
});

// A row of the decision ledger that chose a plug for the components socket.
const choiceRow = (dir, plug) =>
  put(
    dir,
    "design/decisions.yaml",
    `version: 1\ndecisions:\n  - id: plug-components\n    layer: governance\n    kind: judgment\n    source: "plug:${plug}"\n    note: "answered by Owner Name on 2026-11-23"\n`,
  );
const components = (dir) => boardOf(dir).find((socket) => socket.id === "components");

test("a source that names its plug stands for it on the ladder, under an id of its own", () => {
  const dir = empty();
  put(dir, "src/components/reui/filters.tsx", "export {};\n");
  put(dir, "design/registry-catalog.json", json({ items: [{ name: "filters-1", kind: "block" }] }));
  put(
    dir,
    "design/sources/registry.json",
    json({
      version: 1,
      id: "registry",
      plug: "reui",
      pin: { version: "1.0.0" },
      catalog: "design/registry-catalog.json",
    }),
  );
  const reui = components(dir).candidates.find((candidate) => candidate.id === "reui");
  assert.equal(reui.rung, 2);
  assert.match(report(plan(dir, { on: "2026-11-24" })), /rung 2 of intake as the source registry/);
});

test("an earlier choice of an outside plug at a ladder socket is applied once that plug is pinned as a source", () => {
  const dir = empty();
  choiceRow(dir, "reui");
  put(dir, "src/components/reui/filters.tsx", "export {};\n");
  assert.equal(components(dir).chosen.state, "kept-not-applied");
  put(dir, "design/registry-catalog.json", json({ items: [{ name: "filters-1", kind: "block" }] }));
  put(
    dir,
    "design/sources/registry.json",
    json({
      version: 1,
      id: "registry",
      plug: "reui",
      pin: { version: "1.0.0" },
      catalog: "design/registry-catalog.json",
    }),
  );
  const socket = components(dir);
  assert.equal(socket.chosen.state, "on-the-ladder");
  const status = spawnSync(execPath, [STATUS, "--target", dir], { encoding: "utf8" });
  assert.match(
    status.stdout,
    /^ {2}on the ladder: reui \(components\), rung 2 of intake as the source registry$/m,
  );
  assert.doesNotMatch(status.stdout, /kept, not applied/);
});

test("at a ladder socket a chosen plug that is not here is never said to be missing: the socket's own line says where the choice stands", () => {
  const dir = empty();
  choiceRow(dir, "reui");
  const socket = components(dir);
  assert.equal(socket.chosen.state, "kept-not-applied");
  assert.equal(socket.candidates.find((plug) => plug.id === "reui").state, "absent");
});
