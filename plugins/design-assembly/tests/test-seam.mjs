// The seam with the tool that lays a repository's floor and gate: what that tool reads of this
// plugin, and what this plugin reads of it, each held here by a sample of the other side's data and
// never by running the other side's tool. Four promises: the four keys of the affected command, the
// derived target in the gate's shared lists, the strings this plugin reads in a repository's
// Makefile, mk/ files and workflows, all of them listed in one reference file, and a status that
// always ends with a next step or with what is missing.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { HOST_READS } from "../templates/tools/design-assembly/host-make.mjs";
import { ROOT } from "./helpers/guided-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = path.join(PLUGIN, "templates/tools/design-assembly");
const GATE_STEP = path.join(PLUGIN, "templates/mk/design-assembly.mk");
const STATUS = path.join(PLUGIN, "scripts/status.mjs");
const READS_FILE = path.join(PLUGIN, "references/host-strings.json");

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files = {}) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-assembly-seam-")));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}
const run = (args, options = {}) =>
  spawnSync(execPath, args, { encoding: "utf8", maxBuffer: 1 << 28, ...options });

// ---- 1. the four keys of the affected command -----------------------------------------------------

// The keys the floor's test selector reads, and the shape it takes of each, as its seam page has
// them: a sample of the reading side, kept here so that a change on this side fails here first.
const SELECTOR_READS = {
  all: (value) => typeof value === "boolean",
  why: (value) =>
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        Object.keys(item).sort().join() === "file,reason" &&
        (item.file === null || typeof item.file === "string") &&
        typeof item.reason === "string",
    ),
  screens: (value) =>
    Array.isArray(value) &&
    value.every(
      (item) => item !== null && typeof item === "object" && typeof item.route === "string",
    ),
  grep: (value) => value === null || typeof value === "string",
};
// What the selector would make of an answer: the keys it cannot read, in order.
const unreadable = (answer) =>
  Object.entries(SELECTOR_READS)
    .filter(([key, fits]) => !(key in answer) || !fits(answer[key]))
    .map(([key]) => key);

const affected = (...args) => run([path.join(TOOL, "affected.mjs"), "--target", ROOT, ...args]);

test("the affected command gives the four keys the test selector reads, in the shape it reads them", () => {
  const cases = {
    "one screen": ["--files", "src/example/OverdueScreen.tsx"],
    everything: ["--files", "src/index.css"],
    "no screen": ["--files", "src/example/OverdueScreen.tsx", "--files", "vite.config.ts"],
    "nothing changed": ["--files", ","],
  };
  for (const [name, args] of Object.entries(cases)) {
    const said = affected("--json", ...args);
    assert.equal(said.status, 0, `${name}: ${said.stderr}`);
    const answer = JSON.parse(said.stdout);
    assert.deepEqual(unreadable(answer), [], `${name}: ${said.stdout}`);
    // A pattern only where there is a screen to pick tests by; everything runs without one.
    assert.equal(answer.grep === null, answer.all || answer.screens.length === 0, name);
  }
  const one = JSON.parse(affected("--json", ...cases["one screen"]).stdout);
  assert.deepEqual(
    one.screens.map((screen) => screen.route),
    ["/overdue"],
  );
  assert.equal(typeof one.grep, "string");
  const all = JSON.parse(affected("--json", ...cases.everything).stdout);
  assert.deepEqual(all.why, [{ file: "src/index.css", reason: "the stylesheet" }]);

  // The sample is a check that can fail: an answer with a key renamed or of another shape.
  assert.deepEqual(unreadable({ ...one, grep: 3 }), ["grep"]);
  assert.deepEqual(unreadable({ ...all, why: [{ file: 1, reason: "x" }] }), ["why"]);
  const { screens, ...withoutScreens } = one;
  assert.deepEqual(unreadable({ ...withoutScreens, pages: screens }), ["screens"]);
  assert.deepEqual(unreadable({ ...one, all: "no" }), ["all"]);
});

test("the affected command ends with 0 with an answer, with 2 on a wrong call, and never with 1", () => {
  const ends = {
    answer: affected("--json", "--files", "src/index.css").status,
    help: affected("--help").status,
    "unknown flag": affected("--json", "--everything").status,
    "flag without its value": affected("--json", "--base").status,
    "base and files": affected("--json", "--base", "HEAD", "--files", "a.ts").status,
    "base git does not know": affected("--json", "--base", "no-such-commit-here").status,
    "target that is not a folder": run([
      path.join(TOOL, "affected.mjs"),
      "--target",
      path.join(ROOT, "package.json"),
    ]).status,
  };
  assert.deepEqual(ends, {
    answer: 0,
    help: 0,
    "unknown flag": 2,
    "flag without its value": 2,
    "base and files": 2,
    "base git does not know": 2,
    "target that is not a folder": 2,
  });
});

// ---- 2. the derived target, in the gate's shared lists -------------------------------------------

// A sample of the shared lists the floor's gate keeps: its mk file of derived files, and a Makefile
// whose check steps wait for `derived`. Only what the seam promises, not the floor's own file.
const SHARED_LISTS = `DERIVED_TARGETS += wiki-derived
DERIVED_FILES += wiki/log.md
.PHONY: derived wiki-derived
.SECONDEXPANSION:
derived: $$(DERIVED_TARGETS)
\t@:
wiki-derived:
\t@echo drawing the wiki
`;
const MAKEFILE = `CHECK_TARGETS := test
-include mk/*.mk
test:
\t@echo running the tests
show:
\t@echo "targets: $(DERIVED_TARGETS)"
\t@echo "files: $(DERIVED_FILES)"
`;

// A repository that keeps one derived file out of git, with the plugin's tool and gate step.
function derivedRepository(withLists) {
  const dir = folder({
    Makefile: MAKEFILE,
    "mk/design-assembly.mk": readFileSync(GATE_STEP, "utf8"),
    "design/theme.json": `${JSON.stringify({
      checks: {
        "component-manifest": [{ kind: "untracked", file: "design/component-registry.json" }],
      },
    })}\n`,
    ...(withLists ? { "mk/derived.mk": SHARED_LISTS } : {}),
  });
  cpSync(TOOL, path.join(dir, "tools/design-assembly"), { recursive: true });
  return dir;
}
const make = (dir, ...args) =>
  spawnSync("make", ["--no-print-directory", "-C", dir, ...args], { encoding: "utf8" });

test("the gate step puts its derived target and its derived files in the gate's shared lists", () => {
  const dir = derivedRepository(true);
  const shown = make(dir, "-s", "show");
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /^targets: .*\bdesign-derived\b/m);
  assert.match(shown.stdout, /^files: .*\bdesign\/component-registry\.json\b/m);
  // `derived` draws the plugin's files; the tests do not reach for them on their own.
  assert.match(make(dir, "-n", "derived").stdout, /derived\.mjs/);
  assert.doesNotMatch(make(dir, "-n", "test").stdout, /derived\.mjs/);

  // How the floor's tool reads which targets a layer's mk file joins to the gate, as its own
  // source has it: a line that sets one of the lists, each word that is not a variable.
  const SETS_A_LIST =
    /^(?:CHECK_TARGETS|HEAVY_TARGETS|DERIVED_TARGETS)[ \t]*(?:\+|\?|::?)?=[ \t]*(.*)$/gm;
  const joined = [...readFileSync(GATE_STEP, "utf8").matchAll(SETS_A_LIST)].flatMap((line) =>
    line[1]
      .split("#")[0]
      .split(/\s+/)
      .filter((word) => word && !word.startsWith("$")),
  );
  assert.ok(joined.includes("design-assembly"), joined.join());
  assert.ok(joined.includes("design-derived"), joined.join());
});

test("on a gate laid before the shared lists, the tests still wait for the derived files", () => {
  const dir = derivedRepository(false);
  assert.match(make(dir, "-n", "test").stdout, /derived\.mjs/);
  // A repository with no derived file names none, and make still reads.
  const none = derivedRepository(true);
  writeFileSync(path.join(none, "design/theme.json"), "{}\n");
  const shown = make(none, "-s", "show");
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /^files: wiki\/log\.md\s*$/m);
});

// ---- 3. every string read in a repository's Makefile, mk/ and workflows is listed ----------------

// Every module of the plugin's code: its scripts and the tool it installs.
function modules(dir = PLUGIN, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = at === "" ? name : `${at}/${name}`;
      if (statSync(path.join(dir, relative)).isDirectory()) {
        return ["tests", "node_modules"].includes(name) ? [] : modules(dir, relative);
      }
      return relative.endsWith(".mjs") ? [relative] : [];
    });
}

const HOST_MODULE = "templates/tools/design-assembly/host-make.mjs";
// The ways a module reads a repository's make files or workflows: it names one of those files as a
// path, or it matches their text by the names of the gate's lists, its include line or the gate
// step. A sentence a person reads may name them, with a file in backticks; a comment is no reading.
const OPENS = [
  /(["'])(?:Makefile|mk|\.github|\.github\/workflows[^"'`]*)\1/,
  /`mk\/\$\{/,
  /(["'])\$\([A-Z_]+\)\1/,
  /(["'])mk\/[^"'`\s]*\.mk\1/,
];
const REGEX_LITERAL =
  /(?<![\w)\]])\/(?![/*])((?:\\.|\[(?:\\.|[^\]\n])*\]|[^/\\\n[])+)\/[dgimsuy]*/g;
const MATCHES = /_TARGETS|_FILES|include mk|mk\\\/|Makefile|workflows/;

// The places a module reads around the reference file, as "file: line".
function readsProblems(file, text) {
  // The module that holds the reads may open the files; its list of reads is what it matches by.
  const own = file === HOST_MODULE;
  const body = own
    ? text.replace(/\/\/ ---- reads ----[\s\S]*?\/\/ ---- end of reads ----/, "")
    : text;
  return body.split("\n").flatMap((line, index) => {
    if (/^\s*(\/\/|\*)/.test(line)) return [];
    const opens = !own && OPENS.some((rule) => rule.test(line));
    const matches = [...line.matchAll(REGEX_LITERAL)].some((found) => MATCHES.test(found[1]));
    return opens || matches ? [`${file}:${index + 1}: ${line.trim()}`] : [];
  });
}

test("the reference file lists every string the plugin reads in a repository's make files and workflows", () => {
  const listed = JSON.parse(readFileSync(READS_FILE, "utf8"));
  // The module that reads them and the file a person and the other side read say the same.
  assert.deepEqual(
    listed.reads,
    Object.entries(HOST_READS).map(([id, item]) => ({ id, ...item })),
  );
  for (const item of listed.reads) {
    assert.ok(item.files.length > 0 && item.why.trim().length > 0, item.id);
  }
  // What the gate step writes into the gate's lists is listed as it is written.
  const step = readFileSync(GATE_STEP, "utf8");
  for (const item of listed.writes.filter((write) => !write.text.includes("<"))) {
    assert.ok(step.split("\n").includes(item.text), item.text);
  }
  // Every list of the gate the step reads or adds to is listed.
  const lists = [...new Set(step.match(/\b[A-Z]+_(?:TARGETS|FILES)\b/g))].sort();
  const named = listed.reads
    .filter((item) => item.kind === "variable")
    .map((item) => item.text)
    .concat(listed.writes.map((item) => item.text.split(" ")[0]));
  for (const list of lists) assert.ok(named.includes(list), list);
  // Every tool path a row may point at, which the gate must name, is listed by its path.
  const proofs = JSON.parse(
    readFileSync(path.join(PLUGIN, "references/known-proofs.json"), "utf8"),
  );
  const pointed = [
    "tools/design-assembly/check.mjs",
    ...proofs.proofs
      .map((proof) => proof.check ?? "")
      .filter((check) => check.startsWith("tool:"))
      .map((check) => check.slice("tool:".length)),
  ];
  const known = listed.known_tools.tools.map((tool) => tool.path);
  for (const tool of new Set(pointed)) assert.ok(known.includes(tool), tool);
  // No other module of the plugin opens those files or matches their text.
  const found = modules().flatMap((file) =>
    readsProblems(file, readFileSync(path.join(PLUGIN, file), "utf8")),
  );
  assert.deepEqual(found, []);
});

test("a module that reads a repository's make files around the reference file is named", () => {
  // Each way of reading around it, on a changed copy of a module.
  const changed = {
    "scripts/opens-the-makefile.mjs": 'const text = read(root, "Makefile");\n',
    "scripts/lists-mk.mjs": 'const names = readdirSync(path.join(root, "mk"));\n',
    "scripts/reads-a-step.mjs": "const text = read(root, `mk/${name}`);\n",
    "scripts/reads-workflows.mjs": 'const flows = readdirSync(".github/workflows");\n',
    "scripts/matches-a-list.mjs": "const joins = /^HEAVY_TARGETS \\+=/m.test(text);\n",
    "scripts/matches-the-include.mjs": "const ok = /^-?include mk\\/\\*\\.mk/m.test(text);\n",
    "scripts/names-a-list.mjs": 'const at = words.includes("$(DERIVED_TARGETS)");\n',
    "scripts/names-the-step.mjs": 'const step = "mk/design-assembly.mk";\n',
  };
  for (const [file, text] of Object.entries(changed)) {
    assert.equal(readsProblems(file, text).length, 1, file);
  }
  // A sentence a person reads that names those files is no reading of them.
  assert.deepEqual(
    readsProblems(
      "scripts/says.mjs",
      'const why = "the Makefile does not include mk/*.mk, so CHECK_TARGETS does not run";\n// read(root, "Makefile")\n',
    ),
    [],
  );
});

// ---- 4. status on a repository with no floor -----------------------------------------------------

const status = (dir, ...args) => run([STATUS, "--target", dir, ...args]);
const lastLine = (text) => text.trimEnd().split("\n").at(-1);

test("status on a repository with no floor ends with what is missing, never with nothing to do", () => {
  const empty = folder();
  const said = status(empty);
  assert.ok([0, 1].includes(said.status), said.stderr);
  const last = lastLine(said.stdout);
  assert.match(last, /^next: /);
  assert.doesNotMatch(last, /nothing to run now/);
  assert.match(last, /src\/index\.css/);
  assert.match(last, /\/design-assembly:adopt --starter/);
  const data = JSON.parse(status(empty, "--json").stdout);
  assert.match(data.missing, /src\/index\.css is missing/);

  // A stylesheet, and a Makefile that does not read the mk folder: that is what is missing.
  const unjoined = folder({ "src/index.css": ":root {}\n", Makefile: "check:\n\t@echo ok\n" });
  const second = lastLine(status(unjoined).stdout);
  assert.match(second, /^next: /);
  assert.match(second, /Makefile does not include mk\/\*\.mk/);
  assert.match(JSON.parse(status(unjoined, "--json").stdout).missing, /Makefile/);

  // A stylesheet where the components settings name it is a floor, as adopting reads it.
  const elsewhere = folder({
    "app/globals.css": ":root {}\n",
    "components.json": `${JSON.stringify({ tailwind: { css: "app/globals.css" } })}\n`,
    Makefile: "-include mk/*.mk\ncheck:\n\t@echo ok\n",
  });
  const named = JSON.parse(status(elsewhere, "--json").stdout);
  assert.equal(named.missing, null, named.missing);
  assert.doesNotMatch(lastLine(status(elsewhere).stdout), /nothing more this plugin can run/);
  // So is one the tool data names.
  const kept = folder({
    "styles/app.css": ":root {}\n",
    "design/theme.json": `${JSON.stringify({ stylesheet: "styles/app.css" })}\n`,
    Makefile: "-include mk/*.mk\ncheck:\n\t@echo ok\n",
  });
  assert.equal(JSON.parse(status(kept, "--json").stdout).missing, null);

  // A repository on a floor is not missing one.
  const floored = JSON.parse(status(ROOT, "--json").stdout);
  assert.equal(floored.missing, null);
});
