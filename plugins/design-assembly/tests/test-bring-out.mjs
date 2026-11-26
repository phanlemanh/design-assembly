// The bridge out (specification 0014, criteria 10 and 14): the design ledgers of a repository
// written out for tools that do not read them, a DESIGN.md first and a design system bundle (a
// README, tokens of both themes, type, spacing, corners, the components and the assets) second,
// each stamped with the state of the ledgers it was written from; the gate goes red when a ledger
// changes and an export is not written again. Every run is on a copy; nothing calls the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { candidateFrom } from "../scripts/bring-in.mjs";
import { bringOut } from "../scripts/bring-out.mjs";
import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import { regenerated } from "../templates/tools/design-assembly/components.mjs";
import {
  designMdProblems,
  DESIGN_MD,
  ROLE_PAIRS,
  SYSTEM_FOLDER,
  stampIn,
} from "../templates/tools/design-assembly/exports.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const BRING_OUT = path.join(PLUGIN, "scripts/bring-out.mjs");
// The whole design folder: the ledgers, and the pages of screen kinds the component manifest reads.
const LEDGERS = ["design"];

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const cli = (...args) => spawnSync(execPath, [BRING_OUT, ...args], { encoding: "utf8" });

// A copy of this repository's ledgers, its stylesheet and its tool, without its exports.
function copyRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-bring-out-"));
  made.push(dir);
  for (const file of [...LEDGERS, "src", "tools/design-assembly", "Makefile", "mk"]) {
    if (existsSync(path.join(ROOT, file)))
      cpSync(path.join(ROOT, file), path.join(dir, file), { recursive: true });
  }
  put(dir, "package.json", `${JSON.stringify({ name: "fixture-product" })}\n`);
  const theme = JSON.parse(read(dir, "design/theme.json"));
  delete theme.checks["design-exports"];
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  put(
    dir,
    "design/decisions.yaml",
    read(dir, "design/decisions.yaml").replace(/ {2}- id: design-exports\n(?: {4}.*\n)*/, ""),
  );
  rmSync(path.join(dir, DESIGN_MD), { force: true });
  rmSync(path.join(dir, SYSTEM_FOLDER), { recursive: true, force: true });
  return dir;
}
const exportsCheck = (dir) =>
  runChecks(readState(dir)).find((item) => item.id === "design-exports");

test("criterion 10: the DESIGN.md is written from the ledgers, stamped, and reads as its specification says", () => {
  const dir = copyRepo();
  const result = bringOut(dir, { dryRun: false });
  const text = read(dir, DESIGN_MD);
  assert.ok(result.files.some((file) => file.path === DESIGN_MD));
  assert.match(text, /^---\nversion: alpha\nname: "fixture-product"\n/);
  assert.match(text, /^ {2}primary: "#0246ff"$/m);
  // A role that follows another is a reference to it, as the ledger holds it.
  assert.match(text, /^ {2}sidebar-primary: "\{colors\.primary\}"$/m);
  assert.match(text, /^ {2}dark:$/m);
  assert.match(text, /^ {2}base: 10px$/m);
  assert.match(text, /^ {2}unit: "4px"$/m);
  const stamp = stampIn(text);
  assert.match(stamp, /^[0-9a-f]{12}$/);
  assert.deepEqual(designMdProblems(text), []);
  // The sections stand in the order the specification fixes.
  const headings = [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings, [
    "Overview",
    "Colors",
    "Typography",
    "Layout",
    "Shapes",
    "Do's and Don'ts",
  ]);
  // A file that breaks the specification is named with what is wrong.
  assert.equal(
    designMdProblems(text.replace('  primary: "#0246ff"\n', ""))[0],
    "DESIGN.md: its colours have no primary",
  );
  assert.deepEqual(
    designMdProblems(text.replace('"{colors.primary}"', '"{colors.nowhere}"')).slice(0, 1),
    ["DESIGN.md: colors.sidebar-primary refers to {colors.nowhere}, which is no token"],
  );
});

test("criterion 10, broken: a ledger changed and the DESIGN.md not written again turns the gate red, naming both states", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  const held = exportsCheck(dir);
  assert.equal(held.problem, null);
  assert.equal(held.seenFailing, true);
  const stamp = stampIn(read(dir, DESIGN_MD));
  const tokens = JSON.parse(read(dir, "design/tokens.json"));
  tokens.color.primary.$value = "#cc0000";
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  const stale = exportsCheck(dir);
  assert.match(
    stale.problem,
    new RegExp(
      `DESIGN\\.md was written from the design ledgers at ${stamp}; they are now at [0-9a-f]{12}: write it again with make design-exports`,
    ),
  );
  // Written again, the gate is green.
  bringOut(dir, { dryRun: false });
  assert.equal(exportsCheck(dir).problem, null);
});

test("criterion 14: the system bundle holds a README, tokens of both themes, type, spacing, corners, the components listed and the fonts", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  for (const file of ["README.md", "tokens.json", "components.md", "assets.json"]) {
    assert.ok(existsSync(path.join(dir, SYSTEM_FOLDER, file)), file);
  }
  const tokens = JSON.parse(read(dir, `${SYSTEM_FOLDER}/tokens.json`));
  const colour = (name) => tokens.color.tokens.find((item) => item.name === name);
  assert.deepEqual(tokens.color.themes, [
    { id: "light", name: "Light" },
    { id: "dark", name: "Dark" },
  ]);
  assert.equal(colour("primary").value.light, "#0246ff");
  assert.match(colour("primary").value.dark, /^#[0-9a-f]{6}/);
  assert.equal(
    colour("primary").usage,
    "Text on background. Ground of the text primary-foreground.",
  );
  // A role that follows another is a reference to it, in both themes.
  assert.deepEqual(colour("sidebar-primary").value, { light: "{primary}", dark: "{primary}" });
  assert.match(colour("sidebar-primary").usage, /^Follows primary: it takes that role's value\./);
  const token = (family, name) => tokens[family].tokens.find((item) => item.name === name);
  assert.equal(token("radius", "radius-base").value, "10px");
  assert.equal(token("spacing", "spacing-unit").value, "4px");
  const styles = tokens.type.groups.flatMap((group) => group.styles);
  assert.equal(styles.find((style) => style.name === "text-base").fontSize, "16px");
  assert.equal(tokens.type.families.sans, '"Geist Variable", sans-serif');
  assert.match(tokens.$description, /written from the design ledgers at [0-9a-f]{12}/i);
  assert.match(read(dir, `${SYSTEM_FOLDER}/README.md`), /^# fixture-product\n/);
  assert.match(read(dir, `${SYSTEM_FOLDER}/components.md`), /\bItemList\b/);
  const assets = JSON.parse(read(dir, `${SYSTEM_FOLDER}/assets.json`));
  assert.equal(assets.fonts[0].family, "Geist Variable");
  // What goes out comes back in as the ledger holds it: the bridge in reads the bundle to the
  // owner's own values, so a copy made elsewhere from it starts where the ledger is.
  const back = candidateFrom(path.join(dir, SYSTEM_FOLDER));
  assert.deepEqual(back.values, {
    source_color: "#0246ff",
    type_scale: "standard",
    corner_radius: "floor",
  });
  assert.equal(back.name, "fixture-product");
});

test("criterion 14, broken: a bundle file changed by hand, or left behind a ledger, turns the gate red with its name", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  const file = `${SYSTEM_FOLDER}/tokens.json`;
  const tokens = JSON.parse(read(dir, file));
  tokens.color.tokens.find((item) => item.name === "primary").value.light = "#123456";
  put(dir, file, `${JSON.stringify(tokens, null, 2)}\n`);
  assert.match(
    exportsCheck(dir).problem,
    new RegExp(`${file.replaceAll(".", "\\.")} differs from what the design ledgers give`),
  );
  bringOut(dir, { dryRun: false });
  const registry = regenerated(dir).data;
  registry.components = registry.components.slice(1);
  put(dir, "design/component-registry.json", `${JSON.stringify(registry, null, 2)}\n`);
  assert.match(exportsCheck(dir).problem, /components\.md was written from the design ledgers at/);
});

test("the command: written once, then nothing; --dry-run names the files; a repository with no tokens is refused", () => {
  const dir = copyRepo();
  const preview = cli("--target", dir, "--json", "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  const planned = JSON.parse(preview.stdout);
  assert.deepEqual(Object.keys(planned), ["stamp", "exports", "files", "dry_run"]);
  assert.ok(!existsSync(path.join(dir, DESIGN_MD)));
  const real = cli("--target", dir, "--json");
  assert.equal(real.status, 0, real.stderr);
  assert.deepEqual(JSON.parse(real.stdout).files, planned.files);
  assert.ok(planned.files.some((file) => file.path === "design/theme.json"));
  assert.ok(planned.files.some((file) => file.path === "design/decisions.yaml"));
  assert.match(
    read(dir, "design/decisions.yaml"),
    /- id: design-exports\n {4}layer: governance\n {4}kind: formula\n/,
  );
  const again = JSON.parse(cli("--target", dir, "--json").stdout);
  assert.deepEqual(again.files, []);
  const bare = mkdtempSync(path.join(tmpdir(), "design-bring-out-"));
  made.push(bare);
  const refused = cli("--target", bare, "--json");
  assert.equal(refused.status, 2);
  assert.equal(refused.stdout, "");
  assert.match(refused.stderr, /^design-assembly: design\/tokens\.json is missing/);
});

test("this repository holds its own exports, and its gate holds them", () => {
  assert.ok(existsSync(path.join(ROOT, DESIGN_MD)));
  assert.deepEqual(designMdProblems(read(ROOT, DESIGN_MD)), []);
  const held = exportsCheck(ROOT);
  assert.equal(held?.problem, null);
  assert.equal(held?.held, true);
});

test("the skill of the command exists, runs the script, and sends nothing anywhere", () => {
  const skill = readFileSync(path.join(PLUGIN, "skills/bring-out/SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: bring-out\ndescription: \S/);
  assert.match(skill, /scripts\/bring-out\.mjs --target <repo>/);
  assert.match(skill, /sends nothing to any account or service/);
  assert.match(skill, /make design-exports/);
});

test("review: a markdown export changed by hand, or an export the tool data stops listing, turns the gate red", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  put(
    dir,
    DESIGN_MD,
    read(dir, DESIGN_MD).replace("- Do take every colour", "- Do take any colour"),
  );
  assert.match(
    exportsCheck(dir).problem,
    /DESIGN\.md differs from what the design ledgers give: it was changed by hand/,
  );
  // Laid out again by a formatter, it is the same export.
  bringOut(dir, { dryRun: false });
  put(dir, DESIGN_MD, read(dir, DESIGN_MD).replace(/\n\n/g, "\n\n\n").replace(/ {2}/g, "  "));
  assert.equal(exportsCheck(dir).problem, null);
  // One file dropped from the tool data's list is named.
  const theme = JSON.parse(read(dir, "design/theme.json"));
  theme.checks["design-exports"] = theme.checks["design-exports"].filter(
    (check) => !check.file.endsWith("assets.json"),
  );
  put(dir, "design/theme.json", `${JSON.stringify(theme, null, 2)}\n`);
  assert.match(
    exportsCheck(dir).problem,
    /design\/export\/system\/assets\.json is an export the tool data does not hold/,
  );
});

test("review: a repository whose copy of the tool is older than the exports is refused, and a broken tool data is named", () => {
  const dir = copyRepo();
  rmSync(path.join(dir, "tools/design-assembly/exports.mjs"));
  assert.throws(
    () => bringOut(dir, { dryRun: true }),
    /copy of the tool has no exports\.mjs: bring it up with upgrade first/,
  );
  const broken = copyRepo();
  put(broken, "design/theme.json", "{ no");
  assert.throws(() => bringOut(broken, { dryRun: true }), /design\/theme\.json is not JSON/);
});

// ---- review of PR #109 ---------------------------------------------------------------------------

test("review: the exports stand on a clean clone, where the component manifest is not yet written", () => {
  const dir = copyRepo();
  rmSync(path.join(dir, "design/component-registry.json"), { force: true });
  bringOut(dir, { dryRun: false });
  assert.ok(!existsSync(path.join(dir, "design/component-registry.json")));
  assert.equal(exportsCheck(dir).problem, null);
  assert.match(read(dir, `${SYSTEM_FOLDER}/components.md`), /\bItemList\b/);
  // Written by the tool alone, as a repository that took this version of it would, the gate agrees.
  const tool = spawnSync(
    execPath,
    [path.join(PLUGIN, "templates/tools/design-assembly/exports.mjs"), "--write", "--target", dir],
    {
      encoding: "utf8",
    },
  );
  assert.equal(tool.status, 0, tool.stderr);
  assert.equal(exportsCheck(dir).problem, null);
});

test("review: the tool's writer refuses a --target with no folder, with the reason and 2", () => {
  const tool = spawnSync(
    execPath,
    [path.join(PLUGIN, "templates/tools/design-assembly/exports.mjs"), "--write", "--target"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(tool.status, 2);
  assert.match(tool.stderr, /^usage: /);
});

test("review: a name from the ledgers that YAML or Markdown would read otherwise is quoted or escaped", () => {
  const dir = copyRepo();
  const tokens = JSON.parse(read(dir, "design/tokens.json"));
  tokens.color['we: ird "q"'] = { $type: "color", $value: "#123456" };
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  const registry = regenerated(dir).data;
  registry.components = [
    ...registry.components,
    { name: "Odd*Name_", category: "component", file: "src/x.tsx", level: "atom", source: "own" },
  ];
  put(dir, "design/component-registry.json", `${JSON.stringify(registry, null, 2)}\n`);
  bringOut(dir, { dryRun: false });
  const text = read(dir, DESIGN_MD);
  assert.match(text, /^ {2}"we: ird \\"q\\"": "#123456"$/m);
  assert.deepEqual(designMdProblems(text), []);
  assert.match(read(dir, `${SYSTEM_FOLDER}/components.md`), /\*\*Odd\\\*Name\\_\*\*/);
});

test("review: a path in the component list is a code span, the file's own path, with no mark escaped in it", () => {
  const dir = copyRepo();
  bringOut(dir, { dryRun: false });
  const list = read(dir, `${SYSTEM_FOLDER}/components.md`);
  assert.match(list, /`src\/components\/app-frame\.tsx`/);
  assert.doesNotMatch(list, /\\-/);
});

// ---- the bundle as a design system tool reads it -------------------------------------------------

// The forty colour roles of a product like the first one that sent its bundle out: the floor's, the
// status tones with their text, and two of its own.
const ROLES = [
  ...Object.keys(ROLE_PAIRS),
  "destructive-foreground",
  "success-foreground",
  "warning-foreground",
  "info-foreground",
  "invert",
  "invert-foreground",
];
const hex = (index, shift) =>
  `#${((index * 2654435 + shift) & 0xffffff).toString(16).padStart(6, "0")}`;
const TEXT_SIZES = {
  xs: ["0.75rem", "calc(1 / 0.75)"],
  sm: ["0.875rem", "calc(1.25 / 0.875)"],
  base: ["1rem", "calc(1.5 / 1)"],
  lg: ["1.125rem", "calc(1.75 / 1.125)"],
  xl: ["1.25rem", "calc(1.75 / 1.25)"],
  "2xl": ["1.5rem", "calc(2 / 1.5)"],
  "3xl": ["1.875rem", "calc(2.25 / 1.875)"],
  "4xl": ["2.25rem", "calc(2.5 / 2.25)"],
  "5xl": ["3rem", "1"],
};

// A repository built with Next.js whose running text is a hosted face its build's font loader sets
// (the stylesheet names only the variable), forty colour roles in light and dark, some dark ones
// written as CSS that is no hexadecimal, the type scale, corners and the floor's spacing unit.
function hostedFaceRepo({ face = "Inter" } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-bring-out-hosted-"));
  made.push(dir);
  cpSync(
    path.join(PLUGIN, "templates/tools/design-assembly"),
    path.join(dir, "tools/design-assembly"),
    {
      recursive: true,
    },
  );
  put(
    dir,
    "package.json",
    `${JSON.stringify({ name: "hosted-face", dependencies: { next: "16.0.0" } })}\n`,
  );
  put(dir, "next.config.mjs", "export default {};\n");
  put(
    dir,
    "src/app/layout.tsx",
    `import { ${face.replace(/ /g, "_")} } from "next/font/google";\n\nconst sans = ${face.replace(/ /g, "_")}({ subsets: ["latin"], variable: "--font-sans" });\n\nexport default function Layout({ children }) {\n  return <html className={sans.variable}><body>{children}</body></html>;\n}\n`,
  );
  const color = Object.fromEntries(
    ROLES.map((role, index) => {
      const dark =
        index % 7 === 0
          ? "oklch(1 0 0 / 10%)"
          : index % 5 === 0
            ? `color-mix(in oklch, ${hex(index, 0)} 60%, white)`
            : hex(index, 99);
      return [
        role,
        { $type: "color", $value: hex(index, 0), $extensions: { "design-assembly": { dark } } },
      ];
    }),
  );
  const text = Object.fromEntries(
    Object.entries(TEXT_SIZES).map(([step, [size]]) => [
      step,
      { $type: "dimension", $value: size },
    ]),
  );
  const radius = Object.fromEntries(
    [
      ["sm", "0.375rem"],
      ["md", "0.5rem"],
      ["lg", "0.625rem"],
      ["xl", "0.875rem"],
    ].map(([step, size]) => [step, { $type: "dimension", $value: size }]),
  );
  put(dir, "design/tokens.json", `${JSON.stringify({ color, radius, text }, null, 2)}\n`);
  put(
    dir,
    "src/app/globals.css",
    [
      "@theme inline {",
      "  --font-heading: var(--font-sans);",
      "  --font-sans: var(--font-sans);",
      "  --font-mono: ui-monospace, SFMono-Regular, monospace;",
      ...Object.entries(TEXT_SIZES).flatMap(([step, [size, leading]]) => [
        `  --text-${step}: ${size};`,
        `  --text-${step}--line-height: ${leading};`,
      ]),
      "}",
      ":root {",
      ...ROLES.map((role) => `  --${role}: ${color[role].$value};`),
      "}",
      "",
    ].join("\n"),
  );
  put(
    dir,
    "design/theme.json",
    `${JSON.stringify({ version: 1, stylesheet: "src/app/globals.css", inputs: { conformanceLevel: "AA" }, checks: {} }, null, 2)}\n`,
  );
  put(dir, "design/decisions.yaml", "decisions:\n");
  return dir;
}

// What a design system tool takes as a name, a colour and a length.
const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const COLOUR = /^(#[0-9a-f]{6}([0-9a-f]{2})?|\{[A-Za-z0-9][A-Za-z0-9_.-]*\})$/;
const LENGTH = /^-?\d*\.?\d+(px|rem|em|%)?$/;

test("the system bundle's tokens are lists a design system tool reads: forty roles in light and dark, the hosted face, the scale, corners and spacing, each with its use", () => {
  const dir = hostedFaceRepo();
  bringOut(dir, { name: "Hosted Face", dryRun: false });
  const tokens = JSON.parse(read(dir, `${SYSTEM_FOLDER}/tokens.json`));
  assert.equal(tokens.name, "Hosted Face");
  assert.equal(tokens.version, 1);
  assert.deepEqual(
    tokens.color.themes.map((theme) => theme.id),
    ["light", "dark"],
  );
  assert.equal(tokens.color.tokens.length, 40);
  for (const item of tokens.color.tokens) {
    assert.match(item.value.light, COLOUR, item.name);
    assert.match(item.value.dark, COLOUR, item.name);
    assert.ok(item.usage.length > 0, item.name);
  }
  // A dark value the stylesheet writes with alpha, or mixed, is written as the hexadecimal it is.
  assert.equal(tokens.color.tokens.find((item) => item.name === ROLES[7]).value.dark, "#ffffff1a");
  // Each role's use is the plugin's table of colour roles, never words made up for it.
  const use = (name) => tokens.color.tokens.find((item) => item.name === name).usage;
  assert.equal(use("muted-foreground"), "Text on muted, background.");
  assert.equal(use("ring"), "A part that is not text, against background.");
  assert.match(
    use("chart-3"),
    /^Measured in no pair: a chart's colours are read beside each other/,
  );
  assert.match(use("invert"), /the plugin's table of colour roles does not describe it/);
  // The face the build's font loader sets is the family, named only, since it is hosted.
  assert.deepEqual(tokens.type.fonts, []);
  assert.deepEqual(tokens.type.families, {
    sans: '"Inter"',
    heading: '"Inter"',
    mono: "ui-monospace, SFMono-Regular, monospace",
  });
  assert.deepEqual(
    tokens.type.groups.map((group) => [group.name, group.family, group.styles.length]),
    [
      ["Text", "sans", 4],
      ["Headings", "heading", 5],
    ],
  );
  const styles = tokens.type.groups.flatMap((group) => group.styles);
  assert.deepEqual(
    styles.find((style) => style.name === "text-sm"),
    {
      name: "text-sm",
      fontSize: "14px",
      lineHeight: "20px",
      usage: "Running text: step sm of the type scale.",
    },
  );
  assert.deepEqual(tokens.spacing.tokens, [
    {
      name: "spacing-unit",
      value: "4px",
      usage: "The spacing unit: every distance is a multiple of it.",
    },
  ]);
  assert.deepEqual(
    tokens.radius.tokens.map((item) => [item.name, item.value]),
    [
      ["radius-base", "10px"],
      ["radius-sm", "6px"],
      ["radius-md", "8px"],
      ["radius-lg", "10px"],
      ["radius-xl", "14px"],
    ],
  );
  // Every name is one a tool takes, each used once across the families.
  const names = [
    ...tokens.color.tokens,
    ...tokens.spacing.tokens,
    ...tokens.radius.tokens,
    ...styles,
  ].map((item) => item.name);
  for (const name of names) assert.match(name, NAME);
  assert.equal(new Set(names).size, names.length);
  for (const item of [...tokens.spacing.tokens, ...tokens.radius.tokens]) {
    assert.match(item.value, LENGTH);
    assert.ok(item.usage);
  }
  assert.equal(tokens.$left_out, undefined);
  // The assets say which face it is and what loads it; the sources ledger pins no font file here.
  const assets = JSON.parse(read(dir, `${SYSTEM_FOLDER}/assets.json`));
  assert.deepEqual(assets.typefaces[0], {
    key: "sans",
    variable: "--font-sans",
    family: "Inter",
    loaded_by: "the font loader in src/app/layout.tsx",
    hosted: "google",
  });
  assert.deepEqual(assets.fonts, []);
  // The DESIGN.md names the face too.
  assert.match(read(dir, DESIGN_MD), /^ {4}fontFamily: "Inter"$/m);
  // The gate holds what was written.
  assert.equal(exportsCheck(dir).problem, null);
  // What goes out comes back in: the bridge in reads the lists.
  const back = candidateFrom(path.join(dir, SYSTEM_FOLDER));
  assert.equal(back.values.source_color, hex(ROLES.indexOf("primary"), 0));
  assert.equal(back.values.type_scale, "standard");
  assert.equal(back.fonts.text, '"Inter"');
});

test("the system bundle, broken: the face the build loads changes and the exports are not written again, the gate goes red", () => {
  const dir = hostedFaceRepo();
  bringOut(dir, { dryRun: false });
  assert.equal(exportsCheck(dir).problem, null);
  put(
    dir,
    "src/app/layout.tsx",
    read(dir, "src/app/layout.tsx").replaceAll("Inter", "Roboto_Mono"),
  );
  assert.match(exportsCheck(dir).problem, /tokens\.json was written from the design ledgers at/);
  bringOut(dir, { dryRun: false });
  const tokens = JSON.parse(read(dir, `${SYSTEM_FOLDER}/tokens.json`));
  assert.equal(tokens.type.families.sans, '"Roboto Mono"');
});

test("the system bundle: a name a design system tool would not take is left out of the lists and named", () => {
  const dir = hostedFaceRepo();
  const tokens = JSON.parse(read(dir, "design/tokens.json"));
  tokens.color["-odd name"] = { $type: "color", $value: "#123456" };
  put(dir, "design/tokens.json", `${JSON.stringify(tokens, null, 2)}\n`);
  bringOut(dir, { dryRun: false });
  const written = JSON.parse(read(dir, `${SYSTEM_FOLDER}/tokens.json`));
  assert.ok(!written.color.tokens.some((item) => item.name === "-odd name"));
  assert.deepEqual(written.$left_out, ["-odd name"]);
});

test("the pairs the exports write a colour role's use from are the plugin's table of colour roles", () => {
  const table = JSON.parse(readFileSync(path.join(PLUGIN, "references/color-roles.json"), "utf8"));
  const fromTable = Object.fromEntries(
    table.roles.map((entry) => [
      entry.role.slice(2),
      Object.fromEntries(
        [
          ["on", entry.on?.map((role) => role.slice(2))],
          ["against", entry.against?.map((role) => role.slice(2))],
          ["unmeasured", entry.unmeasured],
        ].filter(([, value]) => value !== undefined),
      ),
    ]),
  );
  assert.deepEqual(ROLE_PAIRS, fromTable);
});
