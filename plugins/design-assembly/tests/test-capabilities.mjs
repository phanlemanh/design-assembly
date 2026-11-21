// The capability table: twenty sockets, the plugs that fill them, and the checks that hold it. Each
// check is seen green on the real table and red on a copy broken in one place, with a message that
// names what is wrong.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  contextOf,
  coreFiles,
  coreProblems,
  faceProblems,
  gapProblems,
  outsideNamesIn,
  overlapProblems,
  plugProblems,
  reachProblems,
  readCapabilities,
  scriptFiles,
  scriptProblems,
  shapeProblems,
  unwrittenProblems,
  writesOf,
} from "../scripts/capabilities.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const LIMITS = json("references/limits.json").limits;
const LAYERS = json("references/layers.json").layers;
const TIERS = json("references/tiers.json").tiers;

const real = readCapabilities();
const table = real.table;
const context = contextOf();
const scripts = scriptFiles();
// A copy of the table with one capability changed; the real table is never touched.
const copy = () => JSON.parse(JSON.stringify(table));
const capability = (t, id) => t.capabilities.find((item) => item.id === id);

test("the table has twenty capabilities, each socket with its four fields and plugs that point to scripts", () => {
  assert.deepEqual(real.problems, []);
  assert.equal(table.capabilities.length, 20);
  assert.deepEqual(shapeProblems(table, context), []);

  const noChecks = copy();
  capability(noChecks, "audit").socket.checks = [];
  assert.deepEqual(shapeProblems(noChecks, context), ["audit: the socket names no check"]);

  const lostScript = copy();
  capability(lostScript, "audit").plugs[0].scripts = ["scripts/no-such.mjs"];
  assert.deepEqual(shapeProblems(lostScript, context), [
    "audit: plug audit points to scripts/no-such.mjs, which is not a file of the plugin",
  ]);

  const strangeLedger = copy();
  capability(strangeLedger, "decision").socket.writes = ["decisions", "decision"];
  assert.deepEqual(shapeProblems(strangeLedger, context), [
    "decision: writes decision, which is not a ledger of the contract",
  ]);

  const strangeTarget = copy();
  capability(strangeTarget, "foundations").socket.checks = ["make design-nothing"];
  assert.deepEqual(shapeProblems(strangeTarget, context), [
    "foundations: checks make design-nothing, which is neither a target the tool installs nor a command of the plugin",
  ]);
});

test("no gap: every capability has a default plug or an open row of the limits ledger", () => {
  assert.deepEqual(gapProblems(table, LIMITS), []);

  const bare = copy();
  capability(bare, "audit").plugs = capability(bare, "audit").plugs.map((plug) => ({
    ...plug,
    default: false,
  }));
  assert.deepEqual(gapProblems(bare, LIMITS), [
    "audit: no default plug, and no open row of the limits ledger says so",
  ]);

  const closedRow = LIMITS.find((limit) => limit.status === "closed");
  const pointsAtClosed = copy();
  capability(pointsAtClosed, "reference").limit = closedRow.id;
  assert.deepEqual(gapProblems(pointsAtClosed, LIMITS), [
    `reference: no default plug, and its limit ${closedRow.id} is not an open row of the limits ledger`,
  ]);
});

test("every layer and tier is reached by at least one capability", () => {
  assert.deepEqual(reachProblems(table, LAYERS, TIERS), []);

  const noContent = copy();
  for (const item of noContent.capabilities) {
    item.layers = item.layers.filter((layer) => layer !== "content");
  }
  assert.deepEqual(reachProblems(noContent, LAYERS, TIERS), [
    "layer content: no capability reaches it",
  ]);

  const noTemplates = copy();
  for (const item of noTemplates.capabilities) {
    item.tiers = item.tiers.filter((tier) => tier !== "templates");
  }
  assert.deepEqual(reachProblems(noTemplates, LAYERS, TIERS), [
    "tier templates: no capability reaches it",
  ]);
});

test("two faces: each socket has a human face and a machine face, or says why one is missing", () => {
  assert.deepEqual(faceProblems(table), []);

  const faceless = copy();
  delete capability(faceless, "handoff").socket.machine;
  assert.deepEqual(faceProblems(faceless), [
    "handoff: the socket has no machine face and gives no reason",
  ]);

  const emptyReason = copy();
  capability(emptyReason, "foundations").socket.human = { reason: " " };
  assert.deepEqual(faceProblems(emptyReason), [
    "foundations: the socket has no human face and gives no reason",
  ]);
});

test("the plugs from outside can be read: each fills a socket that takes plugs and declares its names", () => {
  assert.ok(real.plugs.length >= 5);
  assert.deepEqual(plugProblems(real.plugs, table), []);
  const [first] = real.plugs;
  assert.deepEqual(
    plugProblems(
      [
        { ...first, sockets: ["decision"] },
        { ...first, names: [] },
      ],
      table,
    ),
    [`${first.file}: fills decision, a closed socket`, `${first.file}: declares no name`],
  );
});

test("no overlap: one socket writes a ledger, and a script reaches only the ledgers of its sockets", () => {
  assert.deepEqual(overlapProblems(table), []);
  assert.deepEqual(scriptProblems(table, scripts), []);
  assert.deepEqual(unwrittenProblems(table, scripts, LIMITS), []);

  // The detector sees the real scripts write: it is not green because it sees nothing.
  const seen = scripts.filter((script) => writesOf(script.text).length > 0);
  assert.ok(seen.length >= 5, String(seen.length));
  const adopt = scripts.find((script) => script.path === "scripts/adopt.mjs");
  assert.ok(writesOf(adopt.text).includes("decisions"));

  const twice = copy();
  capability(twice, "foundations").socket.writes = ["tokens", "decisions"];
  assert.deepEqual(overlapProblems(twice), [
    "ledger decisions: written by two sockets, decision and foundations",
  ]);

  // A real script, read from disk and changed to reach a ledger none of its sockets holds.
  const tokens = scripts.find(
    (script) => script.path === "templates/tools/design-assembly/tokens.mjs",
  );
  const strayed = { ...tokens, text: `${tokens.text}\nconst stray = "design/intake.yaml";\n` };
  assert.deepEqual(scriptProblems(table, [strayed]), [
    "templates/tools/design-assembly/tokens.mjs: can write and reaches ledger intake, which no socket of this script holds",
  ]);

  // A socket that says it writes a ledger no script of it is seen writing is red too.
  const claims = copy();
  capability(claims, "foundations").socket.writes = ["tokens", "screens"];
  capability(claims, "screen-build").socket.writes = ["columns", "column-types"];
  assert.deepEqual(unwrittenProblems(claims, scripts, LIMITS), [
    "foundations: says it writes screens, and no script of the socket is seen writing it",
  ]);
});

test("clean core: no outside plug is named in the core, only in a plug's folder", () => {
  const files = coreFiles().map((file) => ({
    path: file,
    text: readFileSync(path.join(PLUGIN, file), "utf8"),
  }));
  assert.ok(files.some((file) => file.path === "references/capabilities.json"));
  assert.ok(files.some((file) => file.path.startsWith("skills/")));
  assert.deepEqual(coreProblems(real.plugs, files), []);

  const [plug] = real.plugs;
  const [name] = plug.names;
  // One copy of a file of each part of the core, with a plug's name put in.
  const parts = [
    "references/capabilities.json",
    files.find((file) => file.path.startsWith("skills/")).path,
    files.find((file) => file.path.startsWith("scripts/")).path,
    files.find((file) => file.path.startsWith("templates/tools/design-assembly/")).path,
    files.find((file) => file.path.startsWith("templates/mk/")).path,
  ];
  for (const part of parts) {
    const changed = files.map((file) =>
      file.path === part ? { ...file, text: `${file.text}\nuse ${name} here\n` } : file,
    );
    assert.deepEqual(
      coreProblems(real.plugs, changed),
      [`${part}: names ${name}, which only a plug's folder may name`],
      part,
    );
  }
  // A word that holds a name is not the name.
  assert.deepEqual(outsideNamesIn("an axe-cores list, a premobbin step", real.plugs), []);
  assert.deepEqual(outsideNamesIn("checked with axe-core", real.plugs), ["axe-core"]);
});

test("a plug file that cannot be read is named, not thrown", (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "capabilities-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(path.join(dir, "references/plugs"), { recursive: true });
  writeFileSync(path.join(dir, "references/capabilities.json"), JSON.stringify(table));
  writeFileSync(path.join(dir, "references/plugs/broken.json"), "{ not json");
  writeFileSync(
    path.join(dir, "references/plugs/lost.json"),
    JSON.stringify({ id: "lost", names: ["Lost"] }),
  );
  assert.deepEqual(readCapabilities(dir).problems, [
    "references/plugs/broken.json: not a JSON file",
    "references/plugs/lost.json: names no socket",
  ]);
});

test("the brand assets socket has a plug for fonts, which writes its rows in the ledger of the reference socket; logo and icons stay open", () => {
  const brand = capability(table, "brand-assets");
  const plug = brand.plugs.find((item) => item.id === "font-source");
  assert.ok(plug, "no plug for fonts");
  assert.deepEqual(plug.scripts, ["scripts/font-source.mjs"]);
  // The sources ledger stays the reference socket's: the plug writes through it, and no second
  // socket claims the ledger.
  assert.equal(plug.writes_through, "reference");
  assert.deepEqual(brand.socket.writes, []);
  assert.deepEqual(capability(table, "reference").socket.writes, ["sources"]);
  // The limit is narrowed to the logo and the icon set, not closed.
  const limit = LIMITS.find((row) => row.id === brand.limit);
  assert.equal(limit.status, "open");
  assert.match(limit.note, /logo/);
  assert.match(limit.note, /icon/);
  assert.doesNotMatch(limit.note, /a logo, a font or an icon set/);
  // The writer is seen: the script reaches the sources ledger, and the routes that run it may.
  const script = scripts.find((item) => item.path === "scripts/font-source.mjs");
  assert.ok(writesOf(script.text).includes("sources"), "the font script is not seen writing");
  assert.deepEqual(scriptProblems(table, scripts), []);
  for (const route of ["new", "adopt"]) {
    assert.ok(table.routes.find((item) => item.id === route).through.includes("brand-assets"));
  }
  // A plug that writes through a socket that is not one is red.
  const lost = copy();
  capability(lost, "brand-assets").plugs[0].writes_through = "no-such";
  assert.deepEqual(shapeProblems(lost, context), [
    "brand-assets: plug font-source writes through no-such, which is not a capability",
  ]);
  // Without writing through the reference socket, the script reaches a ledger it does not hold.
  const alone = copy();
  delete capability(alone, "brand-assets").plugs[0].writes_through;
  assert.deepEqual(scriptProblems(alone, [script]), [
    "scripts/font-source.mjs: can write and reaches ledger sources, which no socket of this script holds",
  ]);
});

test("the foundations socket reads the table of colour roles, through a plug whose files are the plugin's; its three checks stay green", () => {
  const foundations = capability(table, "foundations");
  const plug = foundations.plugs.find((item) => item.id === "color-roles");
  assert.ok(plug, "no plug reads the table of colour roles");
  assert.deepEqual(plug.references, ["references/color-roles.json"]);
  assert.deepEqual(plug.scripts, ["scripts/color-roles.mjs"]);
  // The three checks of the table hold with it.
  assert.deepEqual(shapeProblems(table, context), []);
  assert.deepEqual(gapProblems(table, LIMITS), []);
  assert.deepEqual(reachProblems(table, LAYERS, TIERS), []);
  // A reference that is no file of the plugin is red.
  const lost = copy();
  capability(lost, "foundations").plugs.find((item) => item.id === "color-roles").references = [
    "references/no-such.json",
  ];
  assert.deepEqual(shapeProblems(lost, context), [
    "foundations: plug color-roles reads references/no-such.json, which is not a file of the plugin",
  ]);
});
