// Re-running a repository's own lint: on a throwaway repository whose lint has one rule that
// rejects a raw table and one that rejects only part of what breaks a class name. The rule that
// rejects every probe gains the tool's check, and the gate fails once that rule is turned off; the
// other stays claimed, with what it lets through.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { clearTimeout, setTimeout } from "node:timers";
import { fileURLToPath } from "node:url";

import { audit } from "../scripts/audit.mjs";
import { heldHere } from "../templates/tools/design-assembly/check.mjs";
import { askLint } from "../templates/tools/design-assembly/lint.mjs";

import { lintPointer, PROBED, probesFor } from "../templates/tools/design-assembly/probes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LINT = path.join(PLUGIN, "templates/tools/design-assembly/lint.mjs");
const LINTED = existsSync(path.join(ROOT, "node_modules/eslint"));

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const TABLE = "JSXOpeningElement[name.name='table']";
const TEMPLATE = "JSXAttribute[name.name='className'] TemplateLiteral";

function config(selectors, extra = "") {
  const rules = selectors.map((selector) => `{ selector: "${selector}", message: "no" }`);
  return [
    'import tseslint from "typescript-eslint";',
    "",
    "export default [",
    "  {",
    '    files: ["src/**/*.tsx"],',
    "    languageOptions: { parser: tseslint.parser },",
    `    rules: { "no-restricted-syntax": ["error", ${rules.join(", ")}]${extra} },`,
    "  },",
    "];",
    "",
  ].join("\n");
}

const row = (id, layer, kind) =>
  `  - id: ${id}\n    layer: ${layer}\n    kind: ${kind}\n    source: "the team"\n    check: "eslint:no-restricted-syntax"\n`;
const LEDGER = [
  "version: 1",
  "decisions:",
  row("raw-table", "components", "standard"),
  row("whole-class-names", "foundations", "closed"),
].join("\n");

function repository() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-lint-"));
  made.push(dir);
  const files = {
    "package.json": '{ "name": "probe", "private": true, "type": "module" }\n',
    Makefile: "CHECK_TARGETS := lint\n-include mk/*.mk\ncheck: $(CHECK_TARGETS)\n",
    "eslint.config.js": config([TABLE, TEMPLATE]),
    "design/decisions.yaml": LEDGER,
    "src/app/page.tsx": "export function Page() {\n  return <main />;\n}\n",
  };
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  // The repository's lint is this repository's packages.
  symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"));
  return dir;
}

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });

test("every decision the tool probes has texts that break it, and a control", () => {
  const component = { name: "Button", from: "@/components/ui/button" };
  for (const id of PROBED) {
    const set = probesFor(id, { component, rules: ["team/a-rule"] });
    assert.ok(set, id);
    assert.ok(set.probes.length > 0, id);
    assert.ok(
      set.probes.every((probe) => probe.text !== set.control && probe.label),
      id,
    );
  }
  // What breaks the direction of imports depends on each repository's parts.
  assert.equal(probesFor("tier-direction"), null);
  // Without a component of the library, a restyled component cannot be probed.
  assert.equal(probesFor("no-restyled-component"), null);
});

test("a row is held here when it points at the tool, or at the rule the tool re-runs", () => {
  const lint = { "raw-table": [{ kind: "lint", rule: "no-restricted-syntax", at: "src/a.tsx" }] };
  assert.ok(heldHere({ id: "raw-table", check: lintPointer("no-restricted-syntax") }, lint));
  assert.ok(!heldHere({ id: "raw-table", check: lintPointer("other/rule") }, lint));
  assert.ok(!heldHere({ id: "raw-table", check: lintPointer("no-restricted-syntax") }, {}));
  assert.ok(heldHere({ id: "x", check: "tool:tools/design-assembly/check.mjs" }, {}));
});

test(
  "adopting re-runs the lint: a rule that rejects every probe is held, one that lets some through is not",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repository();
    const before = readFileSync(path.join(dir, "design/decisions.yaml"), "utf8");
    const adopted = run(ADOPT, "--target", dir);
    assert.equal(adopted.status, 1, adopted.stderr);
    assert.match(
      adopted.stdout,
      /now re-run by this tool[^\n]*\n {2}raw-table: every probe is rejected, by no-restricted-syntax/,
    );
    // A class name built with `+` is not rejected by a rule that reads template strings only.
    assert.match(
      adopted.stdout,
      /whole-class-names: the repository's lint lets through `<div className=\{"text-" \+ tone\} \/>`/,
    );

    // The rows are the repository's, and stay as they were.
    const after = readFileSync(path.join(dir, "design/decisions.yaml"), "utf8");
    assert.ok(after.includes(before.split("decisions:\n")[1].trim()));
    const theme = JSON.parse(readFileSync(path.join(dir, "design/theme.json"), "utf8"));
    assert.deepEqual(theme.checks["raw-table"], [
      { kind: "lint", rule: "no-restricted-syntax", at: "src/app/page.tsx" },
    ]);
    assert.equal(theme.checks["whole-class-names"], undefined);

    // The audit counts the row as held, and the other as claimed.
    const audited = audit(dir);
    const state = (id) => audited.decisions.find((decision) => decision.id === id);
    assert.equal(state("raw-table").state, "held");
    assert.match(state("raw-table").by, /re-run by this plugin's tool/);
    assert.equal(state("whole-class-names").state, "claimed");

    // The gate holds it from now on: it passes, and fails once the rule no longer rejects a table.
    const check = path.join(dir, "tools/design-assembly/check.mjs");
    const green = run(check, "--target", dir);
    assert.equal(green.status, 0, green.stderr);
    writeFileSync(path.join(dir, "eslint.config.js"), config([TEMPLATE]));
    const red = run(check, "--target", dir);
    assert.equal(red.status, 1);
    assert.match(red.stderr, /raw-table: the repository's lint lets through `<table \/>`/);
  },
);

test(
  "another rule that rejects every probe does not hold a row that names a different rule",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repository();
    // The row names a rule that is an error on screen files but rejects no table; the rule that
    // rejects a table is another one.
    const imports = ', "no-restricted-imports": ["error", "left-pad"]';
    writeFileSync(path.join(dir, "eslint.config.js"), config([TABLE, TEMPLATE], imports));
    writeFileSync(
      path.join(dir, "design/decisions.yaml"),
      LEDGER.replace(
        'id: raw-table\n    layer: components\n    kind: standard\n    source: "the team"\n    check: "eslint:no-restricted-syntax"',
        'id: raw-table\n    layer: components\n    kind: standard\n    source: "the team"\n    check: "eslint:no-restricted-imports"',
      ),
    );
    const adopted = run(ADOPT, "--target", dir, "--dry-run");
    assert.equal(adopted.status, 1, adopted.stderr);
    assert.match(
      adopted.stdout,
      /raw-table: the repository's lint lets through `<table \/>`: no-restricted-imports does not reject it/,
    );
    assert.doesNotMatch(adopted.stdout, /raw-table: every probe is rejected/);

    // A check written by hand for that rule fails, and names the rule.
    const check = { kind: "lint", rule: "no-restricted-imports", at: "src/app/page.tsx" };
    const theme = { version: 1, checks: { "raw-table": [check] } };
    writeFileSync(path.join(dir, "design/theme.json"), `${JSON.stringify(theme, null, 2)}\n`);
    const tool = path.join(PLUGIN, "templates/tools/design-assembly/check.mjs");
    const red = run(tool, "--target", dir);
    assert.notEqual(red.status, 0);
    assert.match(
      red.stderr,
      /raw-table: the repository's lint lets through `<table \/>`: no-restricted-imports does not reject it/,
    );
  },
);

test(
  "a repository without a lint to run keeps its rows claimed, and says why",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repository();
    rmSync(path.join(dir, "node_modules"));
    const adopted = run(ADOPT, "--target", dir, "--dry-run");
    assert.equal(adopted.status, 1, adopted.stderr);
    assert.match(adopted.stdout, /raw-table: the repository has no lint installed/);
  },
);

// The lint runs in a process of its own, in a gate other people wait on: whatever happens to that
// process comes back as a named error, in time.
const ASK = { find: { rules: ["no-restricted-syntax"], candidates: ["src/app/page.tsx"] } };

function repositoryWith(configuration) {
  const dir = repository();
  writeFileSync(path.join(dir, "eslint.config.js"), configuration);
  return dir;
}

test(
  "a lint that fails on its own configuration is reported in the error's own words",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repositoryWith('throw new Error("this configuration is broken on purpose");\n');
    const answer = askLint(dir, ASK);
    assert.match(answer.error, /the repository's lint failed: .*broken on purpose/);
  },
);

test(
  "a lint process that dies is reported in the error's own words, not by where it was thrown",
  { skip: !LINTED && "no lint installed here" },
  () => {
    // Thrown from a task of its own, so nothing can catch it: the runtime prints the place in the
    // source first, and the error after.
    const dir = repositoryWith(
      'queueMicrotask(() => {\n  throw new Error("thrown where nothing catches it");\n});\nexport default [];\n',
    );
    const answer = askLint(dir, ASK);
    assert.equal(answer.error, "the lint could not be run: Error: thrown where nothing catches it");
  },
);

test(
  "a lint that never answers is stopped and named within the limit",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = repositoryWith(
      "await new Promise(() => setInterval(() => {}, 1000));\nexport default [];\n",
    );
    const started = Date.now();
    const answer = askLint(dir, ASK, { seconds: 2 });
    assert.match(answer.error, /the lint did not answer within 2 seconds/);
    assert.ok(Date.now() - started < 15_000);
  },
);

test(
  "the request does not reach the lint through its standard input",
  { skip: !LINTED && "no lint installed here" },
  () => {
    // The configuration writes down what the lint's process was given as standard input.
    const dir = repositoryWith(
      [
        'import { fstatSync, writeFileSync } from "node:fs";',
        "const input = fstatSync(0);",
        'const given = input.isSocket() || input.isFIFO() ? "a pipe" : "no pipe";',
        'writeFileSync(new URL("./standard-input.txt", import.meta.url), given);',
        config([TABLE, TEMPLATE]),
      ].join("\n"),
    );
    const answer = askLint(dir, ASK);
    assert.deepEqual(answer, { at: { "no-restricted-syntax": "src/app/page.tsx" } });
    assert.equal(readFileSync(path.join(dir, "standard-input.txt"), "utf8"), "no pipe");
  },
);

test(
  "the lint's process answers when the machine is slow to hand it the request",
  { skip: !LINTED && "no lint installed here" },
  async () => {
    // On a busy machine the tool reached its process later than the process reached for its
    // request. Read from standard input, the request was then not there yet, and the process died
    // with EAGAIN; the gate showed only `node:fs:483`. Here the request is handed over 1.5 seconds
    // late, both as the tool hands it now, in a folder named on the command line, and on standard
    // input, as it did before.
    const dir = repository();
    const asked = mkdtempSync(path.join(tmpdir(), "design-assembly-late-"));
    made.push(asked);
    const request = JSON.stringify({ root: dir, request: ASK });
    writeFileSync(path.join(asked, "request.json"), request);
    const child = spawn(execPath, [LINT, asked], { stdio: ["pipe", "pipe", "pipe"] });
    let said = "";
    child.stderr.on("data", (chunk) => (said += chunk));
    child.stdout.resume();
    child.stdin.on("error", () => {});
    const late = setTimeout(() => child.stdin.end(request), 1500);
    const [status] = await new Promise((done) => child.on("close", (...end) => done(end)));
    clearTimeout(late);
    assert.equal(status, 0, said);
    assert.deepEqual(JSON.parse(readFileSync(path.join(asked, "answer.json"), "utf8")), {
      at: { "no-restricted-syntax": "src/app/page.tsx" },
    });
  },
);

// A repository born on the floor: the floor's own lint block, its components settings and one
// component of the library, with this repository's packages. Nothing in its ledger yet.
function bornOnTheFloor() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-floor-lint-"));
  made.push(dir);
  const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
  const files = {
    "package.json": '{ "name": "born", "private": true, "type": "module" }\n',
    Makefile: "CHECK_TARGETS := lint\n-include mk/*.mk\ncheck: $(CHECK_TARGETS)\n",
    "eslint.config.js": own("eslint.config.js"),
    "components.json": own("components.json"),
    "src/components/ui/button.tsx": own("src/components/ui/button.tsx"),
    "src/app/page.tsx": "export function Page() {\n  return <main />;\n}\n",
  };
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"));
  return dir;
}

test(
  "on the floor's lint, a colour that is not a role and a class built in pieces are held by the rules that reject them",
  { skip: !LINTED && "no lint installed here" },
  () => {
    const dir = bornOnTheFloor();
    const adopted = run(ADOPT, "--target", dir);
    assert.equal(adopted.status, 1, adopted.stderr);
    // `text-[#ff0000]` is rejected by the rule against arbitrary values, not by the one against
    // palette colours, so the row of the colour roles points at that rule and the tool holds it.
    assert.match(
      adopted.stdout,
      /color-role: every probe is rejected, by shadcn\/no-arbitrary-values/,
    );
    // The rule about static classes reads a component's classes only: it is probed there, not
    // on a plain element it never looks at.
    assert.match(
      adopted.stdout,
      /whole-class-names: every probe is rejected, by shadcn\/require-static-classes/,
    );
    const ledger = readFileSync(path.join(dir, "design/decisions.yaml"), "utf8");
    assert.match(
      ledger,
      /id: color-role\n(?: {4}.*\n)*? {4}check: "eslint:shadcn\/no-arbitrary-values"/,
    );
    const theme = JSON.parse(readFileSync(path.join(dir, "design/theme.json"), "utf8"));
    assert.equal(theme.checks["color-role"][0].rule, "shadcn/no-arbitrary-values");
    assert.equal(theme.checks["whole-class-names"][0].rule, "shadcn/require-static-classes");
    assert.equal(theme.checks["whole-class-names"][0].component.name, "Button");
  },
);

test("a rule that reads a component's classes only is probed on a component, never on a plain element", () => {
  const component = { name: "Button", from: "@/components/ui/button" };
  const rule = "shadcn/require-static-classes";
  const set = probesFor("whole-class-names", { component, rule });
  assert.ok(set.probes.length > 0);
  assert.ok(
    set.probes.every((probe) => probe.label.startsWith("<Button ")),
    set.probes.map((p) => p.label).join(", "),
  );
  // Without a component of the library such a rule cannot be probed at all.
  assert.equal(probesFor("whole-class-names", { rule }), null);
  // Another rule is probed on plain elements as before, and on a component when there is one.
  const other = probesFor("whole-class-names", { component, rule: "no-restricted-syntax" });
  assert.ok(other.probes.some((probe) => probe.label.startsWith("<div ")));
  assert.ok(other.probes.some((probe) => probe.label.startsWith("<Button ")));
});
