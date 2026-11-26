// The frame every document of the plugin shares (specification 0004), and the two commands that
// hand a document over today: status and audit. The frame is held on a small fixture; the commands
// on throwaway repositories, where the document is the only thing a call writes.
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
import { env as processEnv, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BASES,
  PARTS,
  partsOf,
  renderDocument,
  SEVERITIES,
  spelled,
} from "../scripts/document.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import { passingFloor, roleWords } from "./helpers/answered-roles.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));
const LAYERS = reference("layers.json").layers;
const LIMITS = reference("limits.json").limits;
const VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN, ".claude-plugin/plugin.json"), "utf8"),
).version;

// The two commands that hand a document over, with the name the specification gives each one and
// the areas of the limits ledger its last part has to list.
const COMMANDS = [
  {
    name: "status",
    script: "status.mjs",
    file: "status-report",
    title: "Status report",
    areas: ["status", "document"],
    broken: ["High", "type-scale"],
  },
  {
    name: "audit",
    script: "audit.mjs",
    file: "design-audit-report",
    title: "Design audit report",
    areas: ["audit", "document"],
    broken: ["High", "type-scale"],
  },
  {
    name: "find",
    script: "find.mjs",
    // What the call searches the store for: no throwaway repository answers it.
    args: ["many", "rows"],
    file: "find-report",
    title: "Find report",
    areas: ["find", "document"],
    // A block the intake ledger keeps for that need, where a test needs the call to end with 0.
    stock: (dir) =>
      put(
        dir,
        "design/intake.yaml",
        "version: 1\nblocks:\n  - name: DataRegion\n    file: src/components/data-region.tsx\n    source: by-hand\n    need: many-rows\n    approved: 2026-11-12\n",
      ),
  },
  {
    name: "inventory",
    script: "inventory.mjs",
    file: "inventory-report",
    title: "Inventory report",
    areas: ["inventory", "document"],
  },
  {
    name: "change",
    script: "change.mjs",
    // What the call asks to retire: as a preview, it writes no question beside the page.
    args: ["list-load-retry-filter", "--retire", "--why", "Not needed", "--dry-run"],
    writes: true,
    file: "change-report",
    title: "Change report",
    areas: ["change", "document"],
    // The block it asks about, in every repository the test makes for it, as this repository keeps it.
    keeps: (dir) =>
      put(
        dir,
        "design/intake.yaml",
        "version: 1\nblocks:\n  - name: useList\n    file: src/lib/list.ts\n    source: useList\n    from: starter\n    need: list-load-retry-filter\n    approved: 2026-11-19\n",
      ),
    // The same block retired already, where a test needs the call to end with 0: nothing is left.
    stock: (dir) =>
      put(
        dir,
        "design/intake.yaml",
        "version: 1\nblocks:\n  - name: useList\n    file: src/lib/list.ts\n    source: useList\n    from: starter\n    need: list-load-retry-filter\n    approved: 2026-11-19\n    retired: { on: 2026-11-19, by: the owner, why: Not needed }\n",
      ),
  },
  {
    name: "intake",
    script: "intake.mjs",
    // What the call takes a block in for. A throwaway repository has no block for it, and the
    // first call asks the owner: as a preview, it writes no question beside the page.
    args: ["--need", "many-rows", "--dry-run"],
    writes: true,
    file: "intake-report",
    title: "Intake report",
    areas: ["intake", "document"],
    // A block the intake ledger keeps for that need, where a test needs the call to end with 0.
    stock: (dir) =>
      put(
        dir,
        "design/intake.yaml",
        "version: 1\nblocks:\n  - name: DataRegion\n    file: src/components/data-region.tsx\n    source: by-hand\n    need: many-rows\n    approved: 2026-11-12\n",
      ),
  },
];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const empty = () => {
  // The real path: a command run from inside the folder sees it under that name.
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-document-")));
  made.push(dir);
  return dir;
};
// A repository the guide has been through. `source` says who gave the answers: "proposed" leaves
// every person's call as a proposal nobody confirmed, "user" records them as a person's.
function build(source) {
  const dir = empty();
  put(dir, "src/index.css", passingFloor(withoutBlock(text(ROOT, "src/index.css"))));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "package.json", `${JSON.stringify({ name: "throwaway-shop", private: true })}\n`);
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: {
      source_color: "#0246ff",
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
        ? { status: "decided", source, choice: choices[layer.id], why: "For the test." }
        : { status: "planned" },
    ]),
  );
  // The typeface came later: the owner answered it, with their name and the day, so it waits on
  // nobody, as a repository of this version has it.
  layers.foundations.confirmed = ["text_font", "heading_font"];
  layers.foundations.answered = {
    text_font: { by: "Owner Name", on: "2026-11-21" },
    heading_font: { by: "Owner Name", on: "2026-11-21" },
  };
  // The colour roles came later too: where a person gave the answers, the owner spoke to each
  // question of the table of colour roles.
  if (source === "user") layers.foundations.roles = roleWords();
  put(dir, "design/blueprint.json", JSON.stringify({ version: 1, status: "approved", layers }));
  const run = spawnSync(execPath, [path.join(PLUGIN, "scripts/apply.mjs"), "--target", dir]);
  assert.equal(run.status, 0, String(run.stderr));
  return dir;
}
// Applying is slow, so each kind is built once and copied for a test that changes it.
const built = {};
function applied(source) {
  built[source] ??= build(source);
  const dir = empty();
  cpSync(built[source], dir, { recursive: true });
  return dir;
}
// The same, with source that writes a size around the type scale: a decision is gone around.
function bypassed() {
  const dir = applied("user");
  put(dir, "src/Rogue.tsx", 'export const Rogue = () => <p className="text-[13px]">x</p>;\n');
  return dir;
}
// One commit, dated by hand: the date a cover carries is read from it.
const COMMITTED = "2001-02-03";
function commit(dir) {
  const env = {
    ...processEnv,
    GIT_AUTHOR_DATE: `${COMMITTED}T12:00:00+0000`,
    GIT_COMMITTER_DATE: `${COMMITTED}T12:00:00+0000`,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
  };
  const git = (...args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8", env });
  if (git("init", "-q").status !== 0) return false;
  git("add", "-A");
  const done = git(
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.com",
    "commit",
    "-qm",
    "x",
  );
  return done.status === 0;
}

// Every file of a folder with the hash of its bytes: two equal snapshots are one tree, byte for byte.
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
const run = (command, args, options = {}) =>
  spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts", command.script), ...(command.args ?? []), ...args],
    {
      encoding: "utf8",
      ...options,
    },
  );
// The words of a page as a person reads them: no markup, no style.
const wordsOf = (html) =>
  html
    .replace(/<style>[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

// ---- the frame ------------------------------------------------------------------------------------

const FIXTURE = {
  kind: "fixture-report",
  title: "Fixture report",
  lede: "What a small repository says about itself.",
  origin: { name: "sample-shop", revision: "abc1234", date: "2026-01-02" },
  version: "9.9.9",
  scope: ["One ledger of three rows", "Two stylesheets"],
  decision: {
    conclusion: "Two answers wait on the owner, and one check fails.",
    figures: [{ value: "2", label: "answers wait" }],
    attention: [
      { title: "One check fails", detail: "The radius is off its scale." },
      { title: "Two answers wait", detail: "Both are proposals." },
      { title: "The tool differs", detail: "The copy was changed here." },
    ],
    decide: [{ what: "Confirm the source color", command: "/design-assembly:decide" }],
  },
  findings: [
    { severity: "low", title: "A tier rests on a claim", evidence: ["2 claimed and not re-run"] },
    {
      severity: "high",
      title: "The radius goes around its scale",
      detail: "A screen writes its own corner.",
      evidence: ["src/Screen.tsx (1)"],
    },
    { severity: "medium", title: "Two answers wait", evidence: ["source-color", "product-type"] },
  ],
  register: {
    title: "Every row, as read",
    columns: ["Row", "Says"],
    rows: [
      ["radius", "FAILING"],
      ["spacing", "held"],
    ],
  },
  recommendations: [
    {
      what: "Bring the corner back onto the scale",
      basis: { kind: "measurement", text: "1 place in source goes around it" },
      action: "Change src/Screen.tsx, then run the audit again",
      command: "/design-assembly:audit",
    },
    {
      what: "Answer the conformance level",
      basis: { kind: "standard", text: "the list of standard decisions names it as core" },
      action: "Answer it on the decision sheet",
    },
    {
      what: "Keep the quiet surface",
      basis: { kind: "principle", text: "calm before loud, fixed by the owner" },
      action: "Nothing to change",
    },
  ],
  next: [
    { command: "/design-assembly:audit", why: "1 decision is failing" },
    { command: null, why: "then look at the screen yourself" },
  ],
  blind: [{ id: "some-open-limit", note: "This report cannot see a thing." }],
};

test("the frame renders its six parts in the order the specification gives", () => {
  assert.deepEqual(PARTS, ["cover", "decision", "findings", "recommendations", "next", "blind"]);
  const html = renderDocument(FIXTURE);
  assert.deepEqual(
    partsOf(html),
    PARTS.map((id) => ({ id, empty: false })),
  );
  const words = wordsOf(html);
  const at = (phrase) => {
    const index = words.indexOf(phrase);
    assert.ok(index >= 0, `the page does not say: ${phrase}`);
    return index;
  };
  // The cover: the document's name, the repository, the date, the plugin's version, the scope.
  const cover = [
    "Fixture report",
    "sample-shop",
    "2026-01-02",
    "abc1234",
    "9.9.9",
    "One ledger of three rows",
    "Two stylesheets",
  ].map(at);
  // One page for the person who decides: the conclusion, three things, what they must decide.
  const decision = [
    "Two answers wait on the owner, and one check fails.",
    "One check fails",
    "Two answers wait",
    "The tool differs",
    "Confirm the source color",
  ].map(at);
  // The findings, most severe first whatever order they were given in, each with its evidence.
  const findings = [
    "The radius goes around its scale",
    "src/Screen.tsx (1)",
    "A tier rests on a claim",
    "2 claimed and not re-run",
    "Every row, as read",
  ].map(at);
  assert.ok(
    at("The radius goes around its scale") < words.indexOf("Two answers wait", findings[0]),
  );
  assert.ok(words.indexOf("Two answers wait", findings[0]) < at("A tier rests on a claim"));
  // The recommendations, each with what it rests on and what to do.
  const recommendations = [
    "Bring the corner back onto the scale",
    "1 place in source goes around it",
    "Change src/Screen.tsx, then run the audit again",
    "the list of standard decisions names it as core",
    "calm before loud, fixed by the owner",
  ].map(at);
  // The next steps in order, with the command to run; then what the document does not see.
  const next = ["1 decision is failing", "then look at the screen yourself"].map(at);
  const blind = ["some-open-limit", "This report cannot see a thing."].map(at);
  const order = [cover, decision, findings, recommendations, next, blind].map((part) => part[0]);
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
  );
  assert.match(html, /<code>\/design-assembly:audit<\/code>/);
  assert.match(html, /^<!doctype html>\n<html lang="en">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1" \/>/);
  assert.match(html, /<title>Fixture report · sample-shop<\/title>/);
});

test("a part with nothing to show says so in one line, and is never dropped", () => {
  const bare = {
    ...FIXTURE,
    decision: {
      conclusion: "Nothing waits, and nothing is left to fix.",
      attention: [],
      decide: [],
    },
    findings: [],
    register: null,
    recommendations: [],
    next: [],
    blind: [],
  };
  const html = renderDocument(bare);
  assert.deepEqual(
    partsOf(html),
    PARTS.map((id) => ({
      id,
      empty: ["findings", "recommendations", "next", "blind"].includes(id),
    })),
  );
  // One line in each empty part, and one for each empty half of the decision page.
  assert.equal(html.match(/<p class="note empty">[^<]+<\/p>/g).length, 6);
  // A document may say an empty part in its own words.
  const own = renderDocument({ ...bare, empty: { findings: "No decision is failing here." } });
  assert.match(own, /<p class="note empty">No decision is failing here\.<\/p>/);
  // And the full fixture has no such line.
  assert.doesNotMatch(renderDocument(FIXTURE), /class="note empty"/);
});

test("a recommendation without what it rests on is refused, and so is a finding without evidence", () => {
  assert.deepEqual(Object.keys(BASES), ["principle", "standard", "measurement"]);
  assert.deepEqual(SEVERITIES, ["high", "medium", "low", "note"]);
  const withRecommendation = (recommendation) => ({
    ...FIXTURE,
    recommendations: [recommendation],
  });
  const good = FIXTURE.recommendations[0];
  for (const broken of [
    { ...good, basis: undefined },
    { ...good, basis: { kind: "measurement", text: " " } },
    { ...good, basis: { kind: "taste", text: "it looks better" } },
    { ...good, action: "" },
  ]) {
    assert.throws(() => renderDocument(withRecommendation(broken)), /recommendation/);
  }
  const withFinding = (finding) => ({ ...FIXTURE, findings: [finding] });
  assert.throws(
    () => renderDocument(withFinding({ severity: "high", title: "x", evidence: [] })),
    /evidence/,
  );
  assert.throws(
    () => renderDocument(withFinding({ severity: "urgent", title: "x", evidence: ["y"] })),
    /severity/,
  );
  // More than three things on the page of the person who decides is not "the three most".
  const four = [...FIXTURE.decision.attention, { title: "A fourth", detail: "One too many." }];
  assert.throws(
    () => renderDocument({ ...FIXTURE, decision: { ...FIXTURE.decision, attention: four } }),
    /three/,
  );
  assert.throws(() => renderDocument({ ...FIXTURE, origin: undefined }), /cover/);
});

test("nothing a document is given is taken as markup, and no value is left unprinted", () => {
  const hostile = '<script>alert("x")</script> & co';
  const html = renderDocument({
    ...FIXTURE,
    origin: { name: hostile, revision: null, date: null },
    findings: [{ severity: "high", title: hostile, evidence: [hostile] }],
    blind: [{ id: "a-limit", note: hostile }],
  });
  assert.doesNotMatch(html, /<script/);
  assert.ok(html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co"));
  // A repository with no commit has no date to give: the cover says so.
  assert.match(wordsOf(html), /no commit to take a date from/);
  for (const page of [html, renderDocument(FIXTURE)]) {
    assert.doesNotMatch(wordsOf(page), /undefined|\bnull\b|\[object Object\]|\bNaN\b/);
  }
  // The same data gives the same bytes.
  assert.equal(renderDocument(FIXTURE), renderDocument(FIXTURE));
});

// ---- the two commands -----------------------------------------------------------------------------

for (const command of COMMANDS) {
  // A repository as the command needs it to have something to say: the block a command that changes
  // the store is asked about, put there as the repository is made, before any snapshot is taken.
  const prepared = (dir) => {
    command.keeps?.(dir);
    return dir;
  };
  const page = `${command.file}.html`;

  test(`${command.name} --out writes one page inside the folder and nothing anywhere else`, () => {
    const dir = prepared(applied("proposed"));
    const out = path.join(empty(), "handed", "over");
    const before = snapshot(dir);
    const plain = run(command, ["--target", dir]);
    const first = run(command, ["--target", dir, "--out", out]);
    // The call ends as it does without a document, and says where the document is.
    assert.equal(first.status, plain.status, first.stderr);
    assert.ok(first.stdout.startsWith(plain.stdout), "the screen lost what it said before");
    assert.ok(first.stdout.includes(`document: ${path.join(out, page)}`));
    assert.deepEqual(readdirSync(out), [page]);
    assert.deepEqual(snapshot(dir), before, "the repository changed");
    // To a machine: the same keys as without, and the file that was written.
    const without = JSON.parse(run(command, ["--target", dir, "--json"]).stdout);
    const data = run(command, ["--target", dir, "--json", "--out", out]);
    assert.equal(data.status, plain.status, data.stderr);
    const result = JSON.parse(data.stdout);
    // A command that writes lists the files it would write; the page comes after them.
    const own = command.writes ? without.files : [];
    if (!command.writes) assert.ok(!("files" in without), "a call that writes nothing lists files");
    assert.deepEqual(result.files, [...own, { path: path.join(out, page), change: "update" }]);
    assert.deepEqual({ ...result, files: undefined }, { ...without, files: undefined });
    assert.deepEqual(readdirSync(out), [page]);
    assert.deepEqual(snapshot(dir), before, "the repository changed");
  });

  test(`${command.name}: the document has the six parts in order, a basis under every recommendation, and its own blind spots`, () => {
    for (const dir of [prepared(applied("proposed")), prepared(bypassed()), prepared(empty())]) {
      const out = empty();
      run(command, ["--target", dir, "--out", out]);
      const html = text(out, page);
      assert.deepEqual(
        partsOf(html).map((part) => part.id),
        PARTS,
      );
      const words = wordsOf(html);
      assert.ok(words.includes(command.title));
      assert.ok(words.includes(`design-assembly ${VERSION}`));
      // Every recommendation says what it rests on, and what to do.
      const count = (pattern) => (html.match(pattern) ?? []).length;
      assert.equal(count(/class="rests-on"/g), count(/<li class="recommendation">/g));
      assert.equal(count(/class="to-do"/g), count(/<li class="recommendation">/g));
      // The last part lists every open limit of its scope, by id and in the ledger's own words.
      const open = LIMITS.filter(
        (limit) => command.areas.includes(limit.area) && limit.status === "open",
      );
      assert.ok(
        open.some((limit) => limit.area === "document"),
        "no limit is written for documents",
      );
      for (const limit of open) {
        assert.ok(html.includes(`<code>${limit.id}</code>`), limit.id);
        assert.ok(words.includes(limit.note), limit.id);
      }
      // Nothing is left as a placeholder, and no data is printed raw.
      assert.doesNotMatch(words, /undefined|\bnull\b|\[object Object\]|\bNaN\b|\bTODO\b/);
      assert.doesNotMatch(words, /[{}]|":/);
    }
    // A repository with something broken has findings and recommendations; they are not empty.
    if (!command.broken) return;
    const out = empty();
    run(command, ["--target", prepared(bypassed()), "--out", out]);
    const parts = Object.fromEntries(partsOf(text(out, page)).map((part) => [part.id, part.empty]));
    assert.equal(parts.findings, false);
    assert.equal(parts.recommendations, false);
    assert.equal(parts.next, false);
    const broken = wordsOf(text(out, page));
    for (const word of command.broken) assert.ok(broken.includes(word), word);
  });

  test(`${command.name}: the same call twice gives the same page, byte for byte, dated by the last commit`, (t) => {
    const dir = prepared(applied("proposed"));
    const committed = commit(dir);
    const one = empty();
    const two = empty();
    run(command, ["--target", dir, "--out", one]);
    run(command, ["--target", dir, "--out", two]);
    assert.equal(text(one, page), text(two, page));
    run(command, ["--target", dir, "--out", one]);
    assert.equal(text(one, page), text(two, page));
    // The folder a document is written to is not the repository's state: written inside the
    // repository, the second page is still the first.
    const inside = path.join(dir, "handed-over");
    const before = snapshot(dir);
    run(command, ["--target", dir, "--out", inside]);
    const first = text(inside, page);
    run(command, ["--target", dir, "--out", inside]);
    assert.equal(text(inside, page), first);
    assert.equal(first, text(one, page));
    assert.deepEqual(
      snapshot(dir).filter((line) => !before.includes(line)),
      ["handed-over/", `handed-over/${page} ${createHash("sha256").update(first).digest("hex")}`],
    );
    const handed = JSON.parse(run(command, ["--target", dir, "--out", inside, "--json"]).stdout);
    assert.deepEqual(handed.files.at(-1), { path: `handed-over/${page}`, change: "update" });
    // Before the page, a command that writes lists what it would write, as it does without one.
    const own = command.writes
      ? JSON.parse(run(command, ["--target", dir, "--json"]).stdout).files
      : [];
    assert.deepEqual(handed.files.slice(0, -1), own);
    const words = wordsOf(first);
    assert.ok(words.includes("throwaway-shop"));
    if (!committed) return t.skip("git is not here, so no commit dates the cover");
    // The date is the last commit's, never the clock's.
    assert.ok(words.includes(COMMITTED));
    assert.ok(!words.includes(new Date().toISOString().slice(0, 10)));
  });

  test(`${command.name}: without --out no file is written, and a relative --out is read from where the command is run`, () => {
    const dir = prepared(applied("user"));
    const before = snapshot(dir);
    run(command, ["--target", dir]);
    run(command, ["--target", dir, "--json"]);
    assert.deepEqual(snapshot(dir), before);
    const here = empty();
    const made = run(command, ["--target", dir, "--out", "papers"], { cwd: here });
    assert.notEqual(made.status, 2, made.stderr);
    assert.deepEqual(readdirSync(path.join(here, "papers")), [page]);
    assert.deepEqual(snapshot(dir), before);
  });

  test(`${command.name}: a wrong call for a document ends with 2 and writes nothing`, () => {
    const dir = prepared(applied("user"));
    const before = snapshot(dir);
    const out = path.join(empty(), "none");
    const wrong = [
      ["--format", "pdf"],
      ["--out", out, "--format", "docx"],
      ["--out", out, "--format"],
      ["--out"],
    ];
    for (const args of wrong) {
      for (const mode of [[], ["--json"]]) {
        const called = run(command, ["--target", dir, ...args, ...mode]);
        const what = `${command.name} ${args.join(" ")}`;
        assert.equal(called.status, 2, what);
        assert.equal(called.stdout, "", what);
        assert.match(called.stderr, /^(usage|design-assembly): /, what);
      }
    }
    assert.ok(!existsSync(out));
    assert.deepEqual(snapshot(dir), before);
  });

  test(`${command.name} --format pdf, where the repository has no browser: the page is written, the pdf is not, and the call says so`, () => {
    const dir = prepared(applied("user"));
    command.stock?.(dir);
    const out = empty();
    const plain = run(command, ["--target", dir]);
    assert.equal(plain.status, 0, plain.stderr);
    const called = run(command, ["--target", dir, "--out", out, "--format", "pdf", "--json"]);
    // Fewer formats than asked is work left, as it is for the book.
    assert.equal(called.status, 1, called.stderr);
    const result = JSON.parse(called.stdout);
    assert.deepEqual(result.files, [{ path: path.join(out, page), change: "create" }]);
    assert.equal(result.not_written.length, 1);
    assert.equal(result.not_written[0].format, "pdf");
    assert.match(result.not_written[0].why, /no browser/);
    assert.deepEqual(readdirSync(out), [page]);
    const shown = run(command, ["--target", dir, "--out", out, "--format", "pdf"]);
    assert.equal(shown.status, 1);
    assert.match(shown.stdout, /note: the pdf was not written: .*no browser/);
  });

  test(`${command.name} --format pdf, where the repository has a browser: the page and a pdf printed from it`, (t) => {
    if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
      return t.skip("the reference implementation has no browser installed");
    }
    const out = empty();
    const plain = run(command, ["--target", ROOT]);
    const called = run(command, ["--target", ROOT, "--out", out, "--format", "pdf", "--json"]);
    const result = JSON.parse(called.stdout);
    if (/Executable doesn't exist|browserType\.launch/.test(result.not_written?.[0]?.why ?? "")) {
      return t.skip("the browser package is installed and its browser is not downloaded");
    }
    assert.equal(called.status, plain.status, called.stderr);
    // A command that writes lists what it would write first, as it does without a document.
    const own = command.writes
      ? JSON.parse(run(command, ["--target", ROOT, "--json"]).stdout).files
      : [];
    assert.deepEqual(result.files, [
      ...own,
      { path: path.join(out, page), change: "create" },
      { path: path.join(out, `${command.file}.pdf`), change: "create" },
    ]);
    assert.ok(!("not_written" in result));
    assert.deepEqual(readdirSync(out).sort(), [page, `${command.file}.pdf`].sort());
    const pdf = readFileSync(path.join(out, `${command.file}.pdf`));
    assert.equal(pdf.subarray(0, 5).toString("latin1"), "%PDF-");
    assert.ok(pdf.length > 10_000, "the pdf holds almost nothing");
  });

  test(`${command.name}: the skill names the document and how to ask for it`, () => {
    const skill = readFileSync(path.join(PLUGIN, "skills", command.name, "SKILL.md"), "utf8");
    assert.match(skill, /--out /);
    assert.match(skill, /--format pdf/);
    assert.ok(skill.includes(page), `the skill does not name ${page}`);
  });
}

test("the status report says what waits and with which command; the audit report says each decision's state", () => {
  const dir = applied("proposed");
  const out = empty();
  const [status, audit] = COMMANDS;
  run(status, ["--target", dir, "--out", out]);
  run(audit, ["--target", dir, "--out", out]);
  const report = wordsOf(text(out, "status-report.html"));
  const data = JSON.parse(run(status, ["--target", dir, "--json"]).stdout);
  assert.ok(data.waiting.length > 0);
  // The first five in full, as the screen gives them; the rest are named.
  for (const item of data.waiting.slice(0, 5)) {
    assert.ok(report.includes(item.question), item.id);
    assert.ok(report.includes(item.recommendation), item.id);
  }
  assert.ok(report.includes("/design-assembly:decide"));
  // A count the screen writes "3 row(s)" is written out on the page.
  for (const rhythm of data.rhythms) assert.ok(report.includes(spelled(rhythm.says)), rhythm.id);
  assert.equal(
    spelled("3 row(s) and 11 ledger file(s) of 1 kind(s)"),
    "3 rows and 11 ledger files of 1 kind(s)",
  );
  assert.doesNotMatch(report, /[02-9]\d* [a-z]+\(s\)/);
  assert.ok(report.includes(data.tool.says));

  const audited = wordsOf(text(out, "design-audit-report.html"));
  const facts = JSON.parse(run(audit, ["--target", dir, "--json"]).stdout);
  assert.ok(
    audited.includes(
      `${facts.coverage.answered} of ${facts.coverage.core} core decisions are answered`,
    ),
  );
  for (const tier of facts.tiers) assert.ok(audited.includes(tier.id), tier.id);
  // By default the register lists what is open; with --all, every core decision.
  const open = facts.decisions.filter(
    (d) => d.core && !["held", "claimed", "recorded"].includes(d.state),
  );
  assert.ok(open.length > 0);
  for (const decision of open) assert.ok(audited.includes(decision.question), decision.id);
  const all = empty();
  run(audit, ["--target", dir, "--out", all, "--all"]);
  const whole = wordsOf(text(all, "design-audit-report.html"));
  for (const decision of facts.decisions.filter((d) => d.core)) {
    assert.ok(whole.includes(decision.question), decision.id);
  }
});
