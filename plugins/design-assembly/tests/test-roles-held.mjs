// Item 9.3 of specification 0012, criterion 12: one command prints each value of the foundations
// beside its source, the rows of the ledger that hold it and their checks, and says which lines are
// not whole; the guide asks the sidebar and the chart questions before its final review; the
// source colour the owner gave says who gave it and when.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const FLOOR_CSS = withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8"));

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const put = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const script = (name) => path.join(PLUGIN, "scripts", name);
const roles = (dir) => run(script("status.mjs"), "--target", dir, "--roles");

const SAID = { by: "Owner Name", on: "2026-11-22" };
const ALL_ANSWERED = {
  "color-roles-sidebar": "follows",
  "color-roles-neutral": "formula",
  "color-roles-status": "floor",
  "color-roles-chart": "floor",
};

// A blueprint the guide can write from: the owner gave every answer, with their name and the day,
// unless the test leaves one out.
// `colourSaid` null leaves out who gave the source colour.
function blueprint({ words = ALL_ANSWERED, colourSaid = SAID, source = "user" } = {}) {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: {
      source_color: "#0246ff",
      text_font: "floor",
      heading_font: "text",
      neutral_family: "grey",
    },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "user", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  layers.foundations.source = source;
  layers.foundations.answered = {
    text_font: SAID,
    heading_font: SAID,
    ...(colourSaid === null ? {} : { source_color: colourSaid }),
  };
  layers.foundations.roles = Object.fromEntries(
    Object.entries(words).map(([question, from]) => [question, { source: from, ...SAID }]),
  );
  return { version: 1, status: "approved", layers };
}

function repository(content) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-roles-held-")));
  made.push(dir);
  put(dir, "src/index.css", FLOOR_CSS);
  put(dir, "Makefile", text(ROOT, "Makefile"));
  put(dir, "design/blueprint.json", JSON.stringify(content, null, 2));
  const font = "node_modules/@fontsource-variable/geist";
  put(dir, `${font}/package.json`, text(ROOT, `${font}/package.json`));
  put(dir, `${font}/index.css`, text(ROOT, `${font}/index.css`));
  return dir;
}
const applied = (content) => {
  const dir = repository(content);
  const done = run(script("apply.mjs"), "--target", dir);
  assert.equal(done.status, 0, done.stderr || done.stdout);
  return dir;
};
const lineOf = (said, variable) =>
  said.stdout.split("\n").find((line) => line.startsWith(`${variable}: `)) ?? "";

test("status --roles prints each value beside its source, its rows and their checks", () => {
  const dir = applied(blueprint());
  const said = roles(dir);
  assert.equal(said.status, 0, said.stderr);
  const primary = lineOf(said, "--primary");
  assert.match(
    primary,
    /from the owner's source color, the owner's word \(Owner Name on 2026-11-22\)/,
  );
  assert.match(primary, /Value: light oklch\([^)]+\), dark oklch\([^)]+\)\./);
  assert.match(
    primary,
    /Held by: tonal-palette \(the generated block\), tool:tools\/design-assembly\/check\.mjs/,
  );
  assert.match(primary, /color-contrast \(\d+ pair\(s\)\)/);
  assert.match(primary, /design-tokens, tool:tools\/design-assembly\/check\.mjs/);
  const chart = lineOf(said, "--chart-1");
  assert.match(
    chart,
    /^--chart-1: kept from the floor, the owner's word \(color-roles-chart, Owner Name on 2026-11-22\)\. Value: /,
  );
  assert.match(chart, /Held by: design-tokens/);
  const sidebar = lineOf(said, "--sidebar-primary");
  assert.match(sidebar, /follows --primary, the owner's word \(color-roles-sidebar/);
  const text = lineOf(said, "--font-sans");
  assert.match(
    text,
    /the owner's typeface of text \(floor\), the owner's word \(Owner Name on 2026-11-22\)/,
  );
  assert.match(text, /typeface, tool:/);
  assert.match(text, /font-loaded, tool:/);
  // Every value is whole, and the tones the owner did not choose are not declared.
  assert.match(
    said.stdout,
    /^whole: (\d+) of \1 values have the owner's word and a row of the ledger with its check; 3 role\(s\) not declared/m,
  );
  assert.doesNotMatch(said.stdout, /not whole:/);
  // As data too.
  const data = JSON.parse(run(script("status.mjs"), "--target", dir, "--roles", "--json").stdout);
  assert.ok(
    data.held.some((item) => item.variable === "--font-heading" && item.missing.length === 0),
  );
});

test("a value whose question no one answered is named as not whole", () => {
  const rest = Object.fromEntries(
    Object.entries(ALL_ANSWERED).filter(
      ([question]) => !["color-roles-sidebar", "color-roles-chart"].includes(question),
    ),
  );
  const dir = applied(blueprint({ words: rest }));
  const said = roles(dir);
  assert.equal(said.status, 0, said.stderr);
  for (const variable of ["--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring"]) {
    assert.match(
      said.stdout,
      new RegExp(`^ {2}not whole: ${variable} lacks the owner's word$`, "m"),
    );
  }
  for (const n of [1, 2, 3, 4, 5]) {
    assert.match(
      said.stdout,
      new RegExp(`^ {2}not whole: --chart-${n} lacks the owner's word$`, "m"),
    );
  }
  assert.match(said.stdout, /^whole: (\d+) of (\d+) values/m);
});

test("a source colour with no name and day leaves the primary roles not whole", () => {
  const dir = applied(blueprint({ colourSaid: null }));
  const said = roles(dir);
  assert.match(lineOf(said, "--primary"), /from the owner's source color\. Value:/);
  assert.match(said.stdout, /^ {2}not whole: --primary lacks the owner's word$/m);
  assert.match(said.stdout, /^ {2}not whole: --ring lacks the owner's word$/m);
});

test("a value no row of the ledger holds says so", () => {
  const dir = applied(blueprint());
  const theme = JSON.parse(text(dir, "design/theme.json"));
  delete theme.checks["design-tokens"];
  put(dir, "design/theme.json", JSON.stringify(theme, null, 2));
  const said = roles(dir);
  assert.match(lineOf(said, "--chart-1"), /Held by: no row of the ledger\./);
  assert.match(said.stdout, /^ {2}not whole: --chart-1 lacks a row and its check$/m);
});

test("the row of the source colour says who gave it and when", () => {
  const dir = applied(blueprint());
  const ledger = text(dir, "design/decisions.yaml");
  assert.match(
    ledger,
    /- id: source-color\n(?: {4}.*\n)*? {4}note: "answered by Owner Name on 2026-11-22"/,
  );
});

test("the guide refuses a source colour given with no name or day", () => {
  const dir = repository(blueprint({ colourSaid: { by: "Owner Name" } }));
  const done = run(script("apply.mjs"), "--target", dir, "--dry-run");
  assert.equal(done.status, 2, done.stdout);
  assert.match(done.stderr, /answered\.source_color with by and on/);
});

test("the guide refuses who gave a source colour that is a proposal", () => {
  const dir = repository(blueprint({ source: "proposed" }));
  const done = run(script("apply.mjs"), "--target", dir, "--dry-run");
  assert.equal(done.status, 2, done.stdout);
  assert.match(done.stderr, /answered\.source_color says who gave/);
});

test("the guide asks the sidebar, the chart and the font's licence before its final review", () => {
  const page = text(PLUGIN, "skills/new/SKILL.md");
  const review = page.indexOf("## 5. Final review");
  const section = page.indexOf("### The sidebar, the chart roles and the font's licence");
  assert.ok(section > 0 && section < review, "the section stands before the final review");
  const asked = page.slice(section, review);
  for (const said of ["color-roles-sidebar", "color-roles-chart", "licence"]) {
    assert.ok(asked.includes(said), said);
  }
  assert.match(page, /status\.mjs --target <repo> --roles/);
});

// Owed since 2026-11-22: plain status names the lines status --roles reports as not
// whole as a step to take, and says nothing of them when every line is whole.
test("plain status names the values status --roles reports as not whole, as a step to take", () => {
  const open = applied(blueprint({ colourSaid: null }));
  const said = run(script("status.mjs"), "--target", open);
  const step = said.stdout
    .split("\n")
    .find((line) => /^(next|then): \/design-assembly:status --roles, /.test(line));
  assert.ok(step, said.stdout);
  assert.match(step, /values? of the foundations (is|are) not whole \(--primary, /);
  assert.match(step, /it names what each lacks/);
  const data = JSON.parse(run(script("status.mjs"), "--target", open, "--json").stdout);
  const listed = data.next.find((item) => item.command === "/design-assembly:status --roles");
  assert.ok(listed, JSON.stringify(data.next));
  assert.ok(said.stdout.split("\n").length <= 40, "more than one screen");

  const whole = applied(blueprint());
  const quiet = run(script("status.mjs"), "--target", whole);
  assert.doesNotMatch(quiet.stdout, /status --roles/);

  // While a question waits on the owner, answering it comes first: the values that lack only
  // that answer are not named a second time.
  const asked = applied(blueprint({ words: { "color-roles-neutral": "formula" } }));
  const waiting = JSON.parse(run(script("status.mjs"), "--target", asked, "--json").stdout);
  assert.ok(waiting.waiting.length > 0);
  assert.ok(!waiting.next.some((item) => item.command === "/design-assembly:status --roles"));

  // Where the gate cannot run yet, what is missing is said instead, as for the audit's step.
  put(open, "Makefile", "check:\n\techo no gate here\n");
  const unrun = run(script("status.mjs"), "--target", open);
  assert.match(unrun.stdout, /nothing more this plugin can run here yet/);
  assert.doesNotMatch(unrun.stdout, /status --roles/);
});
