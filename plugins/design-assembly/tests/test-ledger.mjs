// The ledger format: what counts as a well-formed row, how a pointer is resolved, and how rows are
// merged into a file a person also edits.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  LAYERS,
  ledgerProblems,
  ledgerRate,
  literally,
  mergeLedger,
  parseLedger,
  pointerProblem,
  readLedger,
} from "../templates/tools/design-assembly/ledger.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};

// A repository where each kind of pointer has something real to point at.
function repository() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ledger-"));
  made.push(dir);
  put(dir, "Makefile", "check:\n\tnode tools/held.mjs\n");
  put(dir, "tools/held.mjs", "// a tool the gate runs\n");
  put(dir, "tools/idle.mjs", "// a tool nothing runs\n");
  put(dir, "tools/rules/no-hardcoded-color.mjs", "export default {};\n");
  put(
    dir,
    "eslint.config.js",
    'export default [{ rules: { "shadcn/no-arbitrary-values": "error" } }];\n',
  );
  put(dir, "tests/labels.test.ts", "// decision:labels\n");
  put(dir, "tests/e2e/shell.spec.ts", "// decision:one-main-one-h1 decision:wcag-aa\n");
  return dir;
}
const row = (id, change = {}) => ({
  id,
  layer: "foundations",
  kind: "standard",
  source: "somewhere",
  ...change,
});

test("one list of layers: the ledger, the guide and the standard decisions agree", () => {
  assert.deepEqual(
    reference("layers.json").layers.map((layer) => layer.id),
    LAYERS,
  );
  assert.deepEqual(Object.keys(reference("standard-decisions.json").layers), LAYERS);
  for (const layer of reference("layers.json").layers) {
    assert.equal(reference("standard-decisions.json").layers[layer.id].title, layer.title);
  }
});

test("each kind of pointer resolves when its proof is real, and says why when it is not", () => {
  const dir = repository();
  const good = [
    ["radius", "eslint:shadcn/no-arbitrary-values"],
    ["color-role", "eslint:team-ui/no-hardcoded-color"],
    ["labels", "test:tests/labels.test.ts"],
    ["wcag-aa", "e2e:tests/e2e/shell.spec.ts"],
    ["gate", "tool:tools/held.mjs"],
  ];
  for (const [id, check] of good) assert.equal(pointerProblem(dir, id, check), null, check);

  const bad = [
    ["radius", "eslint:team-ui/no-such-rule", /no such rule/],
    ["labels", "test:tests/absent.test.ts", /no such file/],
    ["terms", "test:tests/labels.test.ts", /does not name decision:terms/],
    ["wcag", "e2e:tests/e2e/shell.spec.ts", /does not name decision:wcag/],
    ["gate", "tool:tools/idle.mjs", /not run by the gate/],
    ["gate", "prayer:daily", /unknown check type/],
  ];
  for (const [id, check, message] of bad)
    assert.match(pointerProblem(dir, id, check), message, check);
});

test("a well-formed ledger has no problem; each rule is seen failing on a changed row", () => {
  const dir = repository();
  const rows = [
    row("radius", { check: "eslint:shadcn/no-arbitrary-values" }),
    row("labels", { layer: "content", kind: "closed", check: "test:tests/labels.test.ts" }),
    row("primary-task", { layer: "context", kind: "judgment" }),
    row("motion"),
  ];
  assert.deepEqual(ledgerProblems(dir, rows, LAYERS), []);
  assert.deepEqual(ledgerRate(dir, rows), { automatic: 2, total: 4 });

  const cases = [
    [[...rows, row("radius")], /radius: duplicate id/],
    [[row("x", { value: "1px" })], /x: unknown key 'value'/],
    [[{ id: "x", kind: "standard", source: "s" }], /x: missing layer/],
    [[row("x", { kind: "guess" })], /x: unknown kind 'guess'/],
    [[row("x", { layer: "paint" })], /x: unknown layer 'paint'/],
    [
      [row("x", { kind: "judgment", check: "tool:tools/held.mjs" })],
      /x: a judgment cannot have an automatic check/,
    ],
    [[row("x", { check: "tool:tools/idle.mjs" })], /x: tool:tools\/idle\.mjs: not run by the gate/],
  ];
  for (const [changed, message] of cases) {
    assert.match(ledgerProblems(dir, changed, LAYERS).join("\n"), message);
  }
  // A broken pointer does not count toward the rate.
  assert.deepEqual(ledgerRate(dir, [row("x", { check: "tool:tools/idle.mjs" })]), {
    automatic: 0,
    total: 1,
  });
});

test("merging: an existing row is replaced in place, a new one is added, the rest is untouched", () => {
  const before = [
    "# A header a person wrote.",
    "version: 1",
    "decisions:",
    "  - id: first",
    "    layer: foundations",
    "    kind: standard",
    "    source: 'single quotes, kept'",
    "  - id: second",
    "    layer: content",
    "    kind: closed",
    '    source: "old"',
    '    note: "a note"',
    "",
  ].join("\n");
  assert.equal(mergeLedger(before, []), before);
  const merged = mergeLedger(before, [
    row("second", { layer: "content", kind: "closed", source: "new", check: "tool:t.mjs" }),
    row("third", { source: 'has "quotes" and: colons' }),
  ]);
  assert.ok(
    merged.startsWith("# A header a person wrote.\nversion: 1\ndecisions:\n  - id: first\n"),
  );
  assert.match(merged, /source: 'single quotes, kept'\n/);
  const rows = parseLedger(merged);
  assert.deepEqual(
    rows.map((r) => r.id),
    ["first", "second", "third"],
  );
  assert.deepEqual(rows[1], {
    id: "second",
    layer: "content",
    kind: "closed",
    source: "new",
    check: "tool:t.mjs",
  });
  assert.equal(rows[2].source, 'has \\"quotes\\" and: colons');
  assert.equal(mergeLedger(merged, []), merged);
  assert.deepEqual(
    parseLedger(mergeLedger(merged, [], ["first"])).map((r) => r.id),
    ["second", "third"],
  );

  // With no file yet, the plugin writes the header and the rows.
  const fresh = mergeLedger(null, [row("only")]);
  assert.match(fresh, /^# Determinism ledger/);
  assert.deepEqual(parseLedger(fresh), [row("only")]);
});

// The format was not invented here. Point DESIGN_ASSEMBLY_REFERENCE_LEDGER at a repository that
// already keeps such a ledger and has its own checker (tools/design_check.py): the reader then has
// to agree with that checker on the real file. Without it the test is skipped, and says so.
const REAL = env.DESIGN_ASSEMBLY_REFERENCE_LEDGER
  ? path.resolve(env.DESIGN_ASSEMBLY_REFERENCE_LEDGER)
  : null;
const absent = !REAL || !existsSync(path.join(REAL, "design/decisions.yaml"));
test(
  "a real ledger from another repository reads with no problem and the same rate as its own checker",
  {
    skip: absent && "DESIGN_ASSEMBLY_REFERENCE_LEDGER does not point at a repository with a ledger",
  },
  () => {
    const rows = readLedger(REAL);
    assert.ok(rows.length > 0);
    assert.deepEqual(ledgerProblems(REAL, rows, null), []);
    const { automatic, total } = ledgerRate(REAL, rows);
    const own = spawnSync("python3", ["tools/design_check.py"], { cwd: REAL, encoding: "utf8" });
    const said = /determinism: (\d+)\/(\d+)/.exec(own.stdout);
    assert.ok(said, `its own checker printed no rate: ${own.stdout}${own.stderr}`);
    assert.deepEqual([automatic, total], [Number(said[1]), Number(said[2])]);
    const text = readFileSync(path.join(REAL, "design/decisions.yaml"), "utf8");
    assert.equal(mergeLedger(text, []), text);
  },
);

test("a name is matched as itself, whatever characters it holds, the backslash included", () => {
  for (const name of ["--radius", "@scope/toast", "a.b", "x\\y", "(a|b)", "c[0]", "n+1"]) {
    const pattern = new RegExp(`^${literally(name)}$`);
    assert.ok(pattern.test(name), name);
    assert.ok(!pattern.test(`${name}z`), name);
  }
  assert.ok(!new RegExp(`^${literally("x\\y")}$`).test("xy"));
  assert.ok(!new RegExp(`^${literally("a.b")}$`).test("acb"));
});
