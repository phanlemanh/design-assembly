// The floating parts of an item of an outside source (specification 0015, addendum, item 11.7,
// criteria 18 to 20): on each screen that uses an item a conform record holds, each control that
// says it opens a floating part is opened, one level only, on the screen as it stands; with the
// part open, every dialog, alert dialog, menu or list box just opened has a name, held by this
// check itself; the item's own text on the screen goes through the repository's words table; and
// the repository's own accessibility check runs as the repository configured it. The browser is
// the repository's own, on pages served from this machine; nothing calls a model or the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, URL } from "node:url";

import { adapter as browser } from "../templates/tools/design-assembly/adapters/playwright.mjs";
import {
  checkScreen,
  FLOATING_TEST,
  floatingPlanOf,
  itemStrings,
  ownTextProblems,
  wordsEntries,
} from "../templates/tools/design-assembly/floating-parts.mjs";
import { cleanUp, healthyFiles, json, repo, TEAM } from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const require = createRequire(path.join(ROOT, "package.json"));

after(cleanUp);

// ---- the item: the composed case of the specification ---------------------------------------------

const PICKER = "src/components/kit/tree-picker.tsx";
const PICKER_I18N = "src/components/kit/tree-picker-i18n.tsx";
const STYLES = "src/components/kit/tree-picker-styles.tsx";
// A constant and a template string: no string of the file is the whole text on the screen.
const COMPOSED = [
  'const ROOT = "Top level";',
  "export const rootAnnouncement = (n: number) => `${ROOT}, ${n} items`;",
  "",
].join("\n");
// A file that holds only class lists and keys.
const CLASSES_AND_KEYS = [
  'import { cn } from "@/lib/utils";',
  'export const panel = cn("flex flex-col gap-2", "data-[open]:animate-in");',
  'export const KEYS = { root: "tree-picker.root", path: "src/components/kit/x.tsx", slot: "picker:list" };',
  "export const item = `px-2 ${KEYS.root}`;",
  "",
].join("\n");
const PICKER_CODE = [
  `import { rootAnnouncement } from "./tree-picker-i18n";`,
  `import { panel } from "./tree-picker-styles";`,
  "export function TreePicker() {",
  "  return <div className={panel}>{rootAnnouncement(2)}</div>;",
  "}",
  "",
].join("\n");
const RECORD = "design/conform/pick-a-level.json";
const record = (files = [PICKER, PICKER_I18N, STYLES]) => ({
  version: 1,
  need: "pick-a-level",
  source: "kit",
  item: "tree-picker",
  taken: files.map((file) => ({ file, sha256: "0".repeat(64) })),
  conformed: files.map((file) => ({ file, sha256: "0".repeat(64) })),
  patches: [],
  exemptions: [],
});
const LABELS_FILE = "src/lib/labels.ts";
const labels = (...more) =>
  `export const LABELS = {\n  team: "Nhóm",\n  open: "Chọn cấp",\n${more.map((text, index) => `  more${index}: ${JSON.stringify(text)},\n`).join("")}};\n`;
// The repository's own accessibility check, as it configured it: the WCAG tags only.
const OWN_CHECK = "tests/e2e/pages.spec.ts";
const ownCheck = (chain) =>
  [
    'import AxeBuilder from "@axe-core/playwright";',
    'import { expect, test } from "@playwright/test";',
    'test("every page", async ({ page }) => {',
    `  const { violations } = await new AxeBuilder({ page })${chain}.analyze();`,
    "  expect(violations).toEqual([]);",
    "});",
    "",
  ].join("\n");
const WCAG_ONLY = '.withTags(["wcag2a", "wcag2aa"])';
const ledger = (rows) => `version: 1\ndecisions:\n${rows.join("")}`;
const ROW_COPY = `  - id: copy-content\n    layer: context\n    kind: judgment\n    source: "${LABELS_FILE}, the one place for every word a screen shows"\n`;
const ROW_CHECK = (file) =>
  `  - id: wcag-aa\n    layer: templates\n    kind: standard\n    source: "the repository's own browser test of it"\n    check: "e2e:${file}"\n`;

// A repository whose screen /team uses the item, which a conform record holds.
const itemRepo = ({
  rows = [ROW_COPY, ROW_CHECK(OWN_CHECK)],
  chain = WCAG_ONLY,
  files = {},
} = {}) =>
  repo(
    Object.fromEntries(
      Object.entries(itemFiles({ rows, chain, files })).filter(([, text]) => text !== null),
    ),
  );
const itemFiles = ({ rows, chain, files }) => ({
  ...healthyFiles(),
  "package.json": json({
    dependencies: { react: "19.0.0" },
    devDependencies: { "@playwright/test": "^1", "@axe-core/playwright": "^4" },
  }),
  "design/theme.json": json({ version: 1, checks: {} }),
  "design/decisions.yaml": ledger(rows),
  [LABELS_FILE]: labels(),
  [OWN_CHECK]: ownCheck(chain),
  [PICKER]: PICKER_CODE,
  [PICKER_I18N]: COMPOSED,
  [STYLES]: CLASSES_AND_KEYS,
  "src/lib/utils.ts": "export const cn = (...names: string[]) => names.join(' ');\n",
  [RECORD]: json(record()),
  "src/pages/Team.tsx": `import { TreePicker } from "@/components/kit/tree-picker";\n${TEAM}`,
  ...files,
});

// ---- what the check holds, without a browser ------------------------------------------------------

test("criterion 19: the item's strings are its written strings and the fixed parts of its template strings, never a class list, a key or a path", () => {
  assert.deepEqual(itemStrings(COMPOSED), ["Top level", "items"]);
  // The module named, the keys and the path are left out. What is left of the class lists is never
  // the text of a screen, so it is never red (below).
  assert.deepEqual(itemStrings(CLASSES_AND_KEYS), ["flex flex-col gap-2", "px-2"]);
  // Words written between two tags are written strings too; numbers and marks are not.
  assert.deepEqual(itemStrings('const a = <p>No results</p>;\nconst b = "42";\nconst c = "—";\n'), [
    "No results",
  ]);
});

test("criterion 19: a string of the item on the screen is red, naming the file and the string, unless the words table holds it", () => {
  const strings = [
    ...itemStrings(COMPOSED).map((text) => ({ file: PICKER_I18N, text })),
    ...itemStrings(CLASSES_AND_KEYS).map((text) => ({ file: STYLES, text })),
  ];
  const said = ["Nhóm", "Top level, 2 items"];
  const at = "screen team (/team)";
  const red = ownTextProblems(at, said, strings, { files: [LABELS_FILE], entries: [] });
  assert.equal(red.length, 1);
  assert.match(
    red[0],
    /^screen team \(\/team\): «Top level, 2 items» on the screen holds text the item writes itself/,
  );
  assert.match(
    red[0],
    /: «Top level» of src\/components\/kit\/tree-picker-i18n\.tsx, «items» of src\/components\/kit\/tree-picker-i18n\.tsx\. /,
  );
  // The words table holds both: whole, or as a whole word of one of its entries.
  const held = wordsEntries(labels("Top level", "2 items"), LABELS_FILE);
  assert.deepEqual(ownTextProblems(at, said, strings, { files: [LABELS_FILE], entries: held }), []);
  // A part of a word is not the word.
  assert.deepEqual(
    ownTextProblems(at, ["Top levels, 2 itemsets"], strings, { files: [], entries: [] }),
    [],
  );
});

// Short words of an item's files, as the filters item holds them: in another file than the one
// that wrote the composed line, and words a row of data may hold.
const PICKER_LIB = "src/components/kit/tree-picker-lib.tsx";
const SHORT_WORDS =
  'export const WORDS = ["to", "in", "and", "level", "status", "open", "items"];\n';

test("criterion 19: a one-word string of the item is red only on a line where a string of two words or more of its own file stands too", () => {
  const strings = [
    ...itemStrings(COMPOSED).map((text) => ({ file: PICKER_I18N, text })),
    ...itemStrings(SHORT_WORDS).map((text) => ({ file: PICKER_LIB, text })),
  ];
  const none = { files: [LABELS_FILE], entries: [] };
  const at = "screen team (/team)";
  // Rows of data that hold short words of the item's files, Vietnamese and English: not red.
  const rows = ["Máy in to Quá hạn 9/3/2026 90 ₫", "Open status report", "Level and items"];
  assert.deepEqual(ownTextProblems(at, rows, strings, none), []);
  // The composed line is red still, naming «Top level» and «items» of the file that wrote it, and
  // no short word of another file.
  const red = ownTextProblems(at, ["Top level, 2 items"], strings, none);
  assert.equal(red.length, 1);
  assert.match(
    red[0],
    /: «Top level» of src\/components\/kit\/tree-picker-i18n\.tsx, «items» of src\/components\/kit\/tree-picker-i18n\.tsx\. /,
  );
  assert.doesNotMatch(red[0], /tree-picker-lib/);
  // What the narrower rule lets through, and says: a line whose only text of the item is one word.
  assert.deepEqual(ownTextProblems(at, ["2 items"], strings, none), []);
});

test("the screens of an item are the ones the change map reaches from a file of its record, with the repository's words and its own check", () => {
  const dir = itemRepo();
  const plan = floatingPlanOf(dir);
  assert.deepEqual(
    plan.screens.map((screen) => [screen.id, screen.route, screen.records]),
    [["team", "/team", [RECORD]]],
  );
  assert.deepEqual(
    plan.screens[0].strings.map((item) => `${item.file}: ${item.text}`),
    [
      `${PICKER_I18N}: Top level`,
      `${PICKER_I18N}: items`,
      `${STYLES}: flex flex-col gap-2`,
      `${STYLES}: px-2`,
    ],
  );
  assert.deepEqual(plan.words.files, [LABELS_FILE]);
  assert.ok(plan.words.entries.includes("Chọn cấp"));
  // The repository's own check, read from the file its ledger names, as it configured it.
  assert.deepEqual(plan.checks, [
    { file: OWN_CHECK, calls: [{ method: "withTags", args: [["wcag2a", "wcag2aa"]] }] },
  ]);
  assert.equal(plan.unchecked, null);
  assert.equal(FLOATING_TEST, "tests/e2e/floating-parts.spec.ts");
});

test("criterion 20: a repository with no check of its conformance level still has the names and the item's text held, and the plan says its check does not run", () => {
  const plan = floatingPlanOf(itemRepo({ rows: [ROW_COPY] }));
  assert.equal(plan.screens.length, 1);
  assert.deepEqual(plan.checks, []);
  assert.match(plan.unchecked, /no row of design\/decisions\.yaml names a browser test that runs/);
  // A check configured in a way this tool cannot read is said, not guessed.
  const odd = floatingPlanOf(itemRepo({ chain: ".withTags(TAGS)" }));
  assert.deepEqual(odd.checks, []);
  assert.match(odd.unchecked, /cannot read how .*pages\.spec\.ts configures/);
});

test("a repository with no conform record has no screen to open", () => {
  const dir = itemRepo({ files: { [RECORD]: null } });
  assert.deepEqual(floatingPlanOf(dir).screens, []);
});

// ---- in the repository's own browser --------------------------------------------------------------

// Pages served from this machine, by route; every request is kept, so a test can say what was asked.
const PAGES = {};
const asked = [];
let server;
let origin;
let chromium = null;
before(async () => {
  server = createServer((request, response) => {
    asked.push(`${request.method} ${request.url}`);
    const page = PAGES[new URL(request.url, "http://here").pathname];
    response.writeHead(page ? 200 : 404, { "content-type": "text/html; charset=utf-8" });
    response.end(page ?? "<!doctype html><title>none</title><main><h1>none</h1></main>");
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  origin = `http://127.0.0.1:${server.address().port}`;
  try {
    chromium = await browser.launch(require);
  } catch {
    chromium = null;
  }
});
after(async () => {
  await chromium?.close();
  server?.close();
});

// A page of the application: a main region with a heading, and the body given. A control marked
// data-opens shows, beside itself, the part its template holds, on a click.
const OPEN_ON_CLICK = `document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-opens]");
  if (!control) return;
  control.setAttribute("aria-expanded", "true");
  control.after(document.getElementById(control.dataset.opens).content.cloneNode(true));
});`;
const page = (body) =>
  `<!doctype html><html lang="vi"><head><title>Nhóm</title></head><body><main><h1>Nhóm</h1>${body}</main><script>${OPEN_ON_CLICK}</script></body></html>`;
// A control that opens a floating part with the given inside.
const opener = (id, inside, said = "Chọn cấp") =>
  `<template id="part-${id}">${inside}</template><button type="button" aria-haspopup="dialog" aria-expanded="false" data-opens="part-${id}">${said}</button>`;
const UNNAMED = '<div role="dialog"><p>Nhóm</p></div>';
const COMPOSED_INSIDE =
  '<div role="dialog" aria-label="Chọn cấp"><div role="status">Top level, 2 items</div></div>';

async function opened(t, route, body, plan, { run = null } = {}) {
  if (!chromium) {
    t.skip("the browser of this machine is not installed");
    return null;
  }
  PAGES[route] = page(body);
  const context = await chromium.newContext({ baseURL: origin });
  const tab = await context.newPage();
  try {
    return await checkScreen(tab, { id: route.slice(1), route, ...plan.screen }, plan, { run });
  } finally {
    await context.close();
  }
}
const planOf = (strings = [], entries = []) => ({
  screen: { strings },
  words: { files: [LABELS_FILE], entries },
});
const composedStrings = () => itemStrings(COMPOSED).map((text) => ({ file: PICKER_I18N, text }));
const ownRun = (calls) => (tab) =>
  browser.accessibility.run(tab, [{ file: OWN_CHECK, calls }], require);

test("criterion 18, broken: an unnamed dialog the item opens is red, naming the screen and the control, where the repository's check runs only the WCAG tags", async (t) => {
  const calls = [{ method: "withTags", args: [["wcag2a", "wcag2aa"]] }];
  const result = await opened(t, "/team", opener("pick", UNNAMED), planOf(), {
    run: ownRun(calls),
  });
  if (!result) return;
  const named = result.problems.filter((line) => /no accessible name/.test(line));
  assert.equal(named.length, 1, result.problems.join("\n"));
  assert.match(named[0], /^screen team \(\/team\)/);
  assert.match(named[0], /«Chọn cấp» opens a dialog with no accessible name/);
  // The repository's check, as it configured it, does not see it: this check holds it alone.
  assert.ok(
    !result.problems.some((line) => /aria-dialog-name/.test(line)),
    result.problems.join("\n"),
  );
  // Named, it is green.
  const fine = await opened(
    t,
    "/team-named",
    opener("pick", '<div role="dialog" aria-label="Chọn cấp"><p>Nhóm</p></div>'),
    planOf(),
    { run: ownRun(calls) },
  );
  assert.deepEqual(fine.problems, []);
});

test("criterion 19, broken: a status region reading «Top level, 2 items» is red, naming «Top level» and «items»; green once the words table holds both", async (t) => {
  const result = await opened(
    t,
    "/team",
    opener("pick", COMPOSED_INSIDE),
    planOf(composedStrings()),
  );
  if (!result) return;
  assert.equal(result.problems.length, 1, result.problems.join("\n"));
  assert.match(
    result.problems[0],
    /with the control «Chọn cấp» open: «Top level, 2 items» on the screen/,
  );
  assert.match(result.problems[0], /«Top level» of src\/components\/kit\/tree-picker-i18n\.tsx/);
  assert.match(result.problems[0], /«items» of src\/components\/kit\/tree-picker-i18n\.tsx/);
  const held = wordsEntries(labels("Top level", "items"), LABELS_FILE);
  const green = await opened(
    t,
    "/team",
    opener("pick", COMPOSED_INSIDE),
    planOf(composedStrings(), held),
  );
  assert.deepEqual(green.problems, []);
  // A file of only class lists and keys adds nothing.
  const classes = itemStrings(CLASSES_AND_KEYS).map((text) => ({ file: STYLES, text }));
  const none = await opened(t, "/team", opener("pick", COMPOSED_INSIDE), planOf(classes));
  assert.deepEqual(none.problems, []);
});

test("criterion 19, in the browser: rows of data that hold short words of the item are not red; the composed line still is", async (t) => {
  const rows =
    "<table><tbody><tr><td>Máy in to</td><td>Quá hạn</td></tr><tr><td>Open status report</td></tr></tbody></table>";
  const strings = [
    ...composedStrings(),
    ...itemStrings(SHORT_WORDS).map((text) => ({ file: PICKER_LIB, text })),
  ];
  const result = await opened(
    t,
    "/team",
    `${rows}${opener("pick", COMPOSED_INSIDE)}`,
    planOf(strings),
  );
  if (!result) return;
  assert.equal(result.problems.length, 1, result.problems.join("\n"));
  assert.match(result.problems[0], /«Top level, 2 items» on the screen/);
  assert.doesNotMatch(result.problems.join("\n"), /Máy in to|Open status report|tree-picker-lib/);
});

test("criterion 20: the repository's own check runs with the floating part open, as it is configured; with no check, the names and the text are held all the same", async (t) => {
  // An image with no text, only inside the part: the repository's check sees it only open.
  const inside =
    '<div role="dialog" aria-label="Chọn cấp"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="8" height="8"></div>';
  const calls = [{ method: "withTags", args: [["wcag2a", "wcag2aa"]] }];
  const result = await opened(t, "/team", opener("pick", inside), planOf(), { run: ownRun(calls) });
  if (!result) return;
  assert.equal(result.problems.length, 1, result.problems.join("\n"));
  assert.match(
    result.problems[0],
    /with the control «Chọn cấp» open: the repository's accessibility check found image-alt/,
  );
  // With no check of the repository's, only this check's own two things are held.
  const both = await opened(
    t,
    "/team",
    opener("pick", `${UNNAMED}<div role="status">Top level, 2 items</div>`),
    planOf(composedStrings()),
  );
  assert.equal(both.problems.length, 2, both.problems.join("\n"));
  assert.ok(both.problems.some((line) => /no accessible name/.test(line)));
});

test("the check opens one level only, follows no link, submits no form, starts each control from the screen as it stands, and says what it could not open", async (t) => {
  // Inside the first part, a second control opens an unnamed dialog: that level is not opened.
  const nested = `<div role="dialog" aria-label="Chọn cấp">${opener("deeper", UNNAMED, "Sâu hơn")}</div>`;
  const body = [
    opener("pick", nested),
    '<a href="/elsewhere" aria-haspopup="menu">Đi nơi khác</a>',
    '<form method="post" action="/sent"><button aria-haspopup="menu">Gửi đi</button></form>',
    '<button type="button" aria-expanded="false">Không mở gì</button>',
    '<button type="button" aria-haspopup="menu" disabled>Đã khoá</button>',
  ].join("");
  const before = asked.length;
  const result = await opened(t, "/team", body, planOf());
  if (!result) return;
  // Nothing opened: said, and red.
  assert.deepEqual(
    result.problems.map((line) => line.replace(/\. .*/, "")),
    [
      'screen team (/team): the control «Không mở gì» says it opens a floating part (aria-expanded="false"), and neither a click nor the down arrow opened anything',
    ],
  );
  // What it did not open, and why, is said too.
  assert.deepEqual(result.notes, [
    "screen team (/team): opened 1 control(s): «Chọn cấp»",
    "screen team (/team): the control «Đi nơi khác» was not opened: it is a link, and this check follows none",
    "screen team (/team): the control «Gửi đi» was not opened: it would submit a form, and this check submits none",
    "screen team (/team): the control «Đã khoá» was not opened: it is disabled",
  ]);
  const since = asked.slice(before);
  assert.ok(!since.some((line) => /elsewhere|sent|POST/.test(line)), since.join("\n"));
  // The screen as it stands, then once again for each control it opened or tried: it starts from
  // the screen as it stands every time.
  assert.deepEqual(since, ["GET /team", "GET /team", "GET /team"]);
});

test("the browser test the guide installs is two statements that call the check", async () => {
  const { readFileSync } = await import("node:fs");
  const template = readFileSync(
    path.join(PLUGIN, "templates/owned/floating-parts.spec.ts.template"),
    "utf8",
  );
  const code = template
    .split("\n")
    .filter((line) => !line.startsWith("//"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  assert.equal(code.length, 2);
  assert.match(code[0], /tools\/design-assembly\/adapters\/playwright-floating-parts\.mjs/);
  // The test runner places a test in the file that declares it: this file declares each one.
  assert.match(code[1], /test\(item\.title, \(\{ page \}\) => floatingCheck\(page, item\)\)/);
  // It proves no row of the ledger: a repository with no check of its conformance level runs it
  // too, and the gate holds the file itself.
  assert.doesNotMatch(template, /decision:/);
});
