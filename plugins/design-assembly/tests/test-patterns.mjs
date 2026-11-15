// States, words and error messages, as far as a tool reads them from source: every screen declares
// the states every view of data has, no screen writes its own words, and an error message has
// both of its parts. Each rule is shown going red on a real change.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseLedger, TOOL } from "../templates/tools/design-assembly/ledger.mjs";
import {
  channelsProblem,
  emptyStateProblem,
  screenLinksProblem,
  screenPaths,
  CORE_STATES,
  errorCopyProblem,
  readScreens,
  statesProblem,
  wordsProblem,
} from "../templates/tools/design-assembly/patterns.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const ROOT = path.resolve(PLUGIN, "../..");
const APPLY = path.join(PLUGIN, "scripts/apply.mjs");
const ADOPT = path.join(PLUGIN, "scripts/adopt.mjs");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const STATES = "design/states.json";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function folder(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-patterns-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

function blueprint() {
  const choices = {
    context: { product_type: "application", conformance_level: "AA" },
    patterns: { record_panel: "beside" },
    foundations: { source_color: "#0246ff" },
  };
  const layers = {};
  for (const layer of LAYERS) {
    layers[layer.id] = layer.built
      ? { status: "decided", source: "proposed", choice: choices[layer.id], why: "For the test." }
      : { status: "planned" };
  }
  return JSON.stringify({ version: 1, status: "approved", layers });
}

const state = (name) => `{ name: "${name}", shows: LABELS.title }`;
const registry = (...screens) =>
  `export const SCREENS = [\n${screens
    .map(([route, names]) => `  { path: "${route}", states: [${names.map(state).join(", ")}] },`)
    .join("\n")}\n];\n`;
const ALL = ["ready", ...CORE_STATES];
const SCREEN = [
  'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";',
  'import { LABELS } from "@/lib/labels";',
  "",
  "export function List(props: { items: Array<string>; failed: boolean }) {",
  "  if (props.failed) {",
  "    return (",
  '      <Alert variant="destructive">',
  "        <AlertTitle>{LABELS.errorTitle}</AlertTitle>",
  "        <AlertDescription>{LABELS.errorDetail}</AlertDescription>",
  "      </Alert>",
  "    );",
  "  }",
  "  return (",
  "    <main aria-label={LABELS.title}>",
  "      <h1>{LABELS.title}</h1>",
  "      {props.items.length > 3 && <p>{LABELS.many}</p>}",
  "    </main>",
  "  );",
  "}",
  "",
].join("\n");

const own = (file) => readFileSync(path.join(ROOT, file), "utf8");
const floor = (extra = {}) =>
  folder({
    "src/index.css": withoutBlock(own("src/index.css")),
    Makefile: own("Makefile"),
    "src/screens.ts": registry(["/", ALL]),
    "src/pages/List.tsx": SCREEN,
    "design/blueprint.json": blueprint(),
    ...extra,
  });

const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const check = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const edit = (dir, file, change) => {
  const before = text(dir, file);
  const next = change(before);
  assert.notEqual(next, before, `the edit of ${file} changed nothing`);
  writeFileSync(path.join(dir, file), next);
};
const rowsOf = (dir) =>
  Object.fromEntries(parseLedger(text(dir, "design/decisions.yaml")).map((r) => [r.id, r]));

test("screens are read from the registry with the states each declares", () => {
  const source = registry(["/", ALL], ["/about", ["ready"]]);
  assert.deepEqual(readScreens(source), [
    { path: "/", states: ALL },
    { path: "/about", states: ["ready"] },
  ]);
  // An apostrophe in a comment is not the start of a string: trial 8 saw a screen lose every
  // state to a comment that said "row's".
  const commented = source.replace(
    "states: [",
    "states: [\n    // the row's own states, and a /* block */ one\n",
  );
  assert.deepEqual(readScreens(commented), readScreens(source));
  assert.deepEqual(readScreens('const a = "http://x"; // it\'s\n' + source), readScreens(source));
  // The registry of the repository this plugin lives in: the real shape.
  const real = readScreens(own("src/screens.ts"));
  assert.equal(real[0].path, "/");
  for (const name of CORE_STATES) assert.ok(real[0].states.includes(name), name);
});

test("every screen declares the required states, or is excused with a reason", () => {
  const table = (extra = {}) => JSON.stringify({ version: 1, required: CORE_STATES, ...extra });
  const two = registry(["/", ALL], ["/about", ["ready"]]);
  assert.equal(statesProblem(table(), registry(["/", ALL])), null);
  assert.match(
    statesProblem(table(), two),
    /^\/about declares no state named loading, empty, error, no-results$/,
  );
  assert.equal(statesProblem(table({ exempt: { "/about": "it loads no data" } }), two), null);
  assert.match(
    statesProblem(table({ exempt: { "/about": " " } }), two),
    /\/about is excused without a reason/,
  );
  // A repository adds states of its own; it cannot take away the four every view of data has.
  const more = table({ required: [...CORE_STATES, "no-permission"] });
  assert.match(
    statesProblem(more, registry(["/", ALL])),
    /\/ declares no state named no-permission/,
  );
  const fewer = JSON.stringify({ version: 1, required: ["loading", "error"] });
  assert.match(statesProblem(fewer, registry(["/", ALL])), /empty, no-results must stay required/);
  // Measuring nothing is not passing.
  assert.match(statesProblem(table(), "export const SCREENS = [];\n"), /no screen is listed/);
});

test("a screen that writes its own words is found; code that looks like tags is not", () => {
  const skip = ["src/components/ui/"];
  assert.equal(wordsProblem({ "src/pages/List.tsx": SCREEN }, skip), null);
  const files = {
    "src/a.tsx": "export const A = () => <h1>Danh sách mục</h1>;\n",
    "src/b.tsx":
      'export const B = () => <input placeholder="Tìm theo tên" aria-label={"Tìm"} />;\n',
    "src/c.tsx": "export const C = () => (\n  <p>\n    Chưa có gì ở đây\n  </p>\n);\n",
    // Type arguments and comparisons are not text between tags.
    "src/d.tsx":
      'type V = ComponentProps<typeof Badge>["variant"];\nconst m = new Map<string, number>();\nexport const D = (n: number) => (n > 1 ? <b>{n}</b> : null);\n',
    "src/components/ui/x.tsx": "export const X = () => <span>Close</span>;\n",
  };
  const found = wordsProblem(files, skip);
  assert.match(found, /src\/a\.tsx: <h1> holds the text "Danh sách mục"/);
  assert.match(found, /src\/b\.tsx: <input> has placeholder="Tìm theo tên"/);
  assert.match(found, /src\/b\.tsx: <input> has aria-label="Tìm"/);
  assert.match(found, /src\/c\.tsx: <p> holds the text "Chưa có gì ở đây"/);
  assert.doesNotMatch(found, /src\/d\.tsx|components\/ui/);
});

test("an error message has both parts: what happened, and what to do next", () => {
  assert.equal(errorCopyProblem({ "src/pages/List.tsx": SCREEN }), null);
  const half = SCREEN.replace(/\n\s+<AlertDescription>.*<\/AlertDescription>/, "");
  assert.match(
    errorCopyProblem({ "src/pages/List.tsx": half }),
    /src\/pages\/List\.tsx: an error message has no description: what to do next/,
  );
  // A notice that is not an error is not held to it; with no error message nothing is measured.
  const calm = SCREEN.replace(' variant="destructive"', "");
  assert.match(errorCopyProblem({ "src/pages/List.tsx": calm }), /nothing is measured/);
});

test("the guide installs the three rules, and each goes red when it is broken", () => {
  const breaks = {
    "state-matrix": (dir) =>
      // The states a screen has are read from the ledger of screens the guide wrote.
      edit(dir, "design/screens.yaml", (s) => s.replace("      - empty\n", "")),
    labels: (dir) =>
      edit(dir, "src/pages/List.tsx", (s) => s.replace("{LABELS.many}", "Nhiều mục")),
    "error-copy": (dir) =>
      edit(dir, "src/pages/List.tsx", (s) => s.replace(/\n\s+<AlertTitle>.*<\/AlertTitle>/, "")),
  };
  for (const [id, change] of Object.entries(breaks)) {
    const dir = floor();
    const applied = run(APPLY, "--target", dir);
    assert.equal(applied.status, 0, applied.stderr);
    assert.match(applied.stdout, new RegExp(`^${id}: `, "m"));
    assert.deepEqual(JSON.parse(text(dir, STATES)).required, CORE_STATES);
    const rows = rowsOf(dir);
    assert.equal(rows[id].check, TOOL, id);
    assert.ok(rows[id].note, id);
    assert.equal(check(dir).status, 0, check(dir).stderr);
    change(dir);
    const broken = check(dir);
    assert.equal(broken.status, 1, id);
    assert.match(broken.stderr, new RegExp(`${id}: `), id);
  }
});

test("a rule the repository does not meet today gets no row, and the guide says where", () => {
  const dir = floor({
    "src/screens.ts": registry(["/", ALL], ["/about", ["ready"]]),
    "src/pages/List.tsx": SCREEN.replace("{LABELS.title}</h1>", "Mục</h1>"),
  });
  const applied = run(APPLY, "--target", dir);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /note: state-matrix: \/about declares no state named loading/);
  assert.match(applied.stdout, /note: labels: src\/pages\/List\.tsx: <h1> holds the text "Mục"/);
  const rows = rowsOf(dir);
  assert.equal(rows["state-matrix"], undefined);
  assert.equal(rows.labels, undefined);
  assert.equal(rows["error-copy"].check, TOOL);
  assert.equal(check(dir).status, 0, check(dir).stderr);

  // The list of required states is the person's: excusing the page there is their decision.
  edit(dir, STATES, (json) => json.replace('"exempt": {}', '"exempt": { "/about": "no data" }'));
  assert.equal(run(APPLY, "--target", dir).status, 0);
  assert.equal(rowsOf(dir)["state-matrix"].check, TOOL);
  assert.match(text(dir, STATES), /"\/about": "no data"/);
});

test("adopting holds words and error messages as found, and writes no list of states", () => {
  const dir = floor();
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 1, adopted.stderr);
  const rows = rowsOf(dir);
  assert.equal(rows.labels.check, TOOL);
  assert.equal(rows["error-copy"].check, TOOL);
  assert.equal(rows["state-matrix"], undefined);
  assert.ok(!existsSync(path.join(dir, STATES)));
  assert.equal(check(dir).status, 0, check(dir).stderr);
});

test("a screen that opens a browser dialog or calls a toast library itself is found", () => {
  const skip = ["src/components/ui/"];
  const files = {
    "src/a.tsx": "export const A = () => <button onClick={() => window.confirm(text)} />;\n",
    "src/b.tsx":
      'import { toast } from "sonner";\nexport const B = () => <i onClick={() => toast(text)} />;\n',
    "src/c.tsx": "export const C = () => <button onClick={() => alert(text)} />;\n",
    // A function of the screen's own that asks, and the toast component itself, are fine.
    "src/d.tsx": "export const D = () => <button onClick={() => confirmDelete(item)} />;\n",
    // Nor is a function the screen names `confirm` itself (found by the control arm, trial run 3).
    "src/e.tsx":
      "async function confirm() { await remove(); }\nexport const E = () => <Dialog onConfirm={confirm} />;\n",
    "src/components/ui/sonner.tsx":
      'import { Toaster } from "sonner";\nexport const T = () => <Toaster />;\n',
  };
  const found = channelsProblem(files, skip);
  assert.match(found, /src\/a\.tsx: opens the browser's own confirm dialog/);
  assert.match(found, /src\/b\.tsx: calls the toast library sonner itself/);
  assert.match(found, /src\/c\.tsx: opens the browser's own alert dialog/);
  assert.doesNotMatch(found, /src\/d\.tsx|src\/e\.tsx|components\/ui/);
  assert.equal(channelsProblem({ "src/pages/List.tsx": SCREEN }, skip), null);
});

test("the channel rule is held, and the toast is installed only where its library already is", () => {
  const bare = floor();
  const first = run(APPLY, "--target", bare);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /hint: no toast is installed\. The channel rule is held all the same/);
  assert.ok(!existsSync(path.join(bare, "src/lib/notify.ts")));
  assert.equal(rowsOf(bare)["notification-channel"].check, TOOL);
  assert.equal(check(bare).status, 0, check(bare).stderr);
  edit(bare, "src/pages/List.tsx", (s) =>
    s.replace("<h1>", "<h1 onClick={() => window.alert(LABELS.title)}>"),
  );
  const broken = check(bare);
  assert.equal(broken.status, 1);
  assert.match(
    broken.stderr,
    /notification-channel: src\/pages\/List\.tsx: opens the browser's own alert dialog/,
  );

  const withToast = floor({
    "package.json": JSON.stringify({ dependencies: { sonner: "^2.0.0" } }),
  });
  const second = run(APPLY, "--target", withToast);
  assert.equal(second.status, 0, second.stderr);
  assert.doesNotMatch(second.stdout, /no toast is installed/);
  assert.match(text(withToast, "src/lib/notify.ts"), /export function notifyDone/);
  assert.match(text(withToast, "src/components/ui/sonner.tsx"), /export \{ Toaster \}/);
  // The toast component is listed in the manifest written by the same run.
  assert.match(text(withToast, "design/component-registry.json"), /"name": "Toaster"/);
  assert.equal(check(withToast).status, 0, check(withToast).stderr);
  // A screen that tells a result through it needs the toaster drawn somewhere, once.
  edit(withToast, "src/pages/List.tsx", (s) =>
    s.replace("<h1>", "<h1 onClick={() => notifyDone(LABELS.title)}>"),
  );
  const unseen = check(withToast);
  assert.equal(unseen.status, 1);
  assert.match(unseen.stderr, /notification-channel: .*the toaster is drawn nowhere/);
  writeFileSync(
    path.join(withToast, "src/App.tsx"),
    'import { Toaster } from "@/components/ui/sonner";\nexport const App = () => <Toaster />;\n',
  );
  assert.equal(check(withToast).status, 0, check(withToast).stderr);
  // Once there, the module is the repository's own.
  edit(withToast, "src/lib/notify.ts", (s) => `// ours now\n${s}`);
  assert.equal(run(APPLY, "--target", withToast).status, 0);
  assert.match(text(withToast, "src/lib/notify.ts"), /^\/\/ ours now/);
});

test("a repository's own test that names a decision lets adopting claim it", () => {
  const dir = floor({
    "tests/change.test.tsx": "// decision:undo-or-confirm\nit('asks first', () => {});\n",
    "tests/e2e/flow.spec.ts":
      "// decision:record-panel decision:made-up-one\ntest('opens', () => {});\n",
  });
  const adopted = run(ADOPT, "--target", dir);
  assert.equal(adopted.status, 1, adopted.stderr);
  const rows = rowsOf(dir);
  assert.equal(rows["undo-or-confirm"].check, "test:tests/change.test.tsx");
  assert.equal(rows["record-panel"].check, "e2e:tests/e2e/flow.spec.ts");
  // A tag that names no standard decision claims nothing.
  assert.equal(rows["made-up-one"], undefined);
  assert.match(
    adopted.stdout,
    /claimed\s+named and wired in, not run here\n(.*\n)*\s+undo-or-confirm {2}\(test:tests\/change\.test\.tsx\)/,
  );
});

test("the toast and the notification module the guide installs are the reference implementation's", () => {
  for (const [template, file] of [
    ["sonner.tsx.template", "src/components/ui/sonner.tsx"],
    ["notify.ts.template", "src/lib/notify.ts"],
  ]) {
    assert.equal(text(PLUGIN, `templates/owned/${template}`), own(file), file);
  }
});

test("a rule that is already held keeps its check when it is broken, so the gate says why", () => {
  const dir = floor();
  assert.equal(run(APPLY, "--target", dir).status, 0);
  edit(dir, "src/pages/List.tsx", (s) => s.replace("{LABELS.many}", "Nhiều mục"));
  // Running the guide again must not turn a broken rule into a missing check.
  const again = run(APPLY, "--target", dir);
  assert.equal(again.status, 0, again.stderr);
  assert.match(
    again.stdout,
    /note: labels: .*Its check stays, and the gate fails until that changes/,
  );
  const broken = check(dir);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /labels: src\/pages\/List\.tsx: <p> holds the text "Nhiều mục"/);
  assert.doesNotMatch(broken.stderr, /holds no check for it/);
});

test("an expression between two tags is not text", () => {
  const app =
    "export const App = () => (\n  <>\n    {Screen ? <Screen /> : null}\n    <Toaster />\n  </>\n);\n";
  assert.equal(wordsProblem({ "src/App.tsx": app }), null);
});

test("words handed to a component in code are found too", () => {
  const files = {
    "src/a.tsx": 'const COLUMNS = [{ field: "Order.total", header: "Số lượng" }];\n',
    "src/b.tsx": 'export const B = () => <Button>{"Lưu trữ"}</Button>;\n',
    // A field name, a variant and a label taken from the words file are not words written here.
    "src/c.tsx":
      'const C = [{ field: "Order.total", header: LABELS.total, variant: "outline" }];\n',
  };
  const found = wordsProblem(files);
  assert.match(found, /src\/a\.tsx: gives header: "Số lượng"/);
  assert.match(found, /src\/b\.tsx: writes the text "Lưu trữ"/);
  assert.doesNotMatch(found, /src\/c\.tsx/);
});

test("one module may call the toast library; a second one is found, whatever it is called", () => {
  const one = {
    "src/lib/notify.ts": 'import { toast } from "sonner";\nexport const tell = toast;\n',
  };
  assert.equal(channelsProblem(one), null);
  const two = {
    ...one,
    "src/lib/notify-clear.ts":
      'import { toast } from "sonner";\nexport const clear = () => toast.dismiss();\n',
  };
  assert.match(
    channelsProblem(two),
    /src\/lib\/notify\.ts and src\/lib\/notify-clear\.ts each call a toast library/,
  );
  // A function of the repository's own that happens to be called confirm is not a browser dialog.
  assert.equal(channelsProblem({ "src/lib/ask.ts": "export const ok = confirm(1);\n" }), null);
});

test("an empty state that dresses a link as a button is found; a button or a plain link is not", () => {
  const skip = ["src/components/ui/"];
  const found = emptyStateProblem(
    {
      "src/a.tsx":
        'export const A = () => <Empty><EmptyContent><a href="/" className={buttonVariants({ variant: "outline" })}>{w}</a></EmptyContent></Empty>;\n',
      "src/b.tsx": "export const B = () => <Empty><Button onClick={add}>{w}</Button></Empty>;\n",
      "src/c.tsx": 'export const C = () => <Empty><p>{w} <a href="/help">{w}</a></p></Empty>;\n',
      // Outside an empty state, a link may look like a button (the floor's own pages say so).
      "src/d.tsx": 'export const D = () => <a href="/x" className={buttonVariants()}>{w}</a>;\n',
    },
    skip,
  );
  assert.match(found, /src\/a\.tsx: an empty state dresses a link as a button/);
  assert.doesNotMatch(found, /src\/[bcd]\.tsx/);
});

test("a screen that links to another screen is found; the frame, and other links, are not", () => {
  const paths = screenPaths(registry(["/", ["ready"]], ["/aside", ["ready"]]));
  assert.deepEqual(paths, ["/", "/aside"]);
  const found = screenLinksProblem(
    {
      "src/example/A.tsx": 'export const A = () => <h1>{t}</h1><a href="/aside">{w}</a>;\n',
      "src/example/B.tsx": 'export const B = () => <a href={"/?scenario=x"}>{w}</a>;\n',
      "src/example/C.tsx": 'export const C = () => <a href="https://example.com">{w}</a>;\n',
      // The frame lists the screens itself, and a shared part draws them from a list.
      "src/App.tsx": 'export const App = () => <a href="/aside">{w}</a>;\n',
      "src/components/app-frame.tsx": "export const F = () => <a href={screen.path}>{w}</a>;\n",
    },
    paths,
    ["src/components/ui/"],
  );
  assert.match(found, /src\/example\/A\.tsx: links to the screen \/aside itself/);
  assert.match(found, /src\/example\/B\.tsx: links to the screen \/\?scenario=x itself/);
  assert.doesNotMatch(found, /C\.tsx|App\.tsx|app-frame/);
});
