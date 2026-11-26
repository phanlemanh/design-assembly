// Item 7.4, part two: a package that keeps no src/ folder is read where it keeps its screens and
// components, and the root of a workspace says which package to aim at (decision 0120). Where the
// folder is learnt: the tool data's own word, then the package's TypeScript settings, then src. The
// audit, find, inventory and the checks that walk the source all read through that one answer, and
// say where they read. A stylesheet in a sibling package is found by every reader, and a value
// declared in a cascade layer of a file it imports is followed. A lint rule of a lint tool the
// repository lacks is never held. Every repository is a synthetic fixture.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import path from "node:path";
import { after, test } from "node:test";

import { cleanup, empty, json, listIn, put, run, snapshot } from "./helpers/core-family.mjs";
import { parseColor, toHex } from "../templates/tools/design-assembly/color.mjs";
import { leftOut, sourceFolder } from "../templates/tools/design-assembly/source-folders.mjs";
import { resolve } from "../templates/tools/design-assembly/styles.mjs";

after(cleanup);

const COMPONENT = (name, extra = "") =>
  `export function ${name}() {\n  return <button className="h-10 px-4">${name}</button>;\n}\n${extra}`;

// A package with its source at its root: screens under app/, components beside them, a component
// library under components/ui, tests, an installed package and this tool's own copy, which are
// never its source. Its TypeScript settings map `@/` to the root, with a glob that holds the signs
// of a comment, and a comment of their own.
function rootPackage(dir, { settings = true } = {}) {
  put(dir, "package.json", json({ name: "web", private: true }));
  if (settings) {
    put(
      dir,
      "tsconfig.json",
      '{\n  // the package is its own source root\n  "compilerOptions": { "paths": { "@/*": ["./*"] } },\n  "include": ["**/*.ts", "**/*.tsx"],\n}\n',
    );
  }
  put(
    dir,
    "components.json",
    json({ aliases: { components: "@/components", ui: "@/components/ui" } }),
  );
  put(
    dir,
    "app/page.tsx",
    'import { SaveButton } from "@/components/save-button";\nexport default SaveButton;\n',
  );
  put(dir, "components/save-button.tsx", COMPONENT("SaveButton"));
  put(dir, "components/ui/button.tsx", COMPONENT("Button"));
  put(dir, "lib/format.ts", "export const format = (value) => String(value);\n");
  put(dir, "test/save-button.test.tsx", COMPONENT("SaveButtonTest"));
  put(dir, "node_modules/other/index.tsx", COMPONENT("Installed"));
  put(dir, "tools/design-assembly/check.mjs", "export {};\n");
  return dir;
}
const audit = (dir) => run("audit.mjs", ["--target", dir], listIn());
const auditJson = (dir) =>
  JSON.parse(run("audit.mjs", ["--target", dir, "--json"], listIn()).stdout);

test("the source folder is the tool data's word, then the package's settings, then src", () => {
  const dir = rootPackage(path.join(empty(), "web"));
  assert.deepEqual(sourceFolder(dir), {
    folder: ".",
    from: "settings",
    said: "tsconfig.json maps @/ to the package's root",
  });
  put(dir, "design/theme.json", json({ version: 1, source_folder: "app" }));
  assert.equal(sourceFolder(dir).folder, "app");
  assert.equal(sourceFolder(dir).from, "declared");
  // A word that names no folder of the package is set aside, and said.
  put(dir, "design/theme.json", json({ version: 1, source_folder: "../elsewhere" }));
  const set = sourceFolder(dir);
  assert.equal(set.folder, ".");
  assert.match(
    set.ignored,
    /source_folder in design\/theme\.json is "\.\.\/elsewhere", which is no folder of the package/,
  );
  // Neither: the usual folder, as before.
  const bare = rootPackage(path.join(empty(), "bare"), { settings: false });
  assert.deepEqual(sourceFolder(bare), {
    folder: "src",
    from: "default",
    said: "the usual folder",
  });
  // A walk from the root leaves out what is never the package's source; a folder of its own is
  // read whole.
  assert.equal(leftOut(".", "node_modules"), true);
  assert.equal(leftOut(".", "tools/design-assembly"), true);
  assert.equal(leftOut(".", ".next"), true);
  assert.equal(leftOut("src", "src/.hidden"), false);
});

test("the audit, find and inventory read the package's own folders, and say which and why", () => {
  const dir = rootPackage(path.join(empty(), "web"));
  const said = audit(dir).stdout;
  assert.match(
    said,
    /^source files read: 3 of 4 screens and components in app, components, test \(tsconfig\.json maps @\/ to the package's root\)/m,
  );
  assert.doesNotMatch(said, /Installed/);
  const result = auditJson(dir);
  assert.equal(result.source_folder.folder, ".");
  assert.equal(result.source_folder.files, 4);

  const found = run("find.mjs", ["--target", dir, "save"], listIn());
  assert.match(found.stdout, /SaveButton \(component, components\): components\/save-button\.tsx/);
  assert.match(
    found.stdout,
    /components: components\/ \(tsconfig\.json maps @\/ to the package's root\)/,
  );
  const counted = run("inventory.mjs", ["--target", dir], listIn()).stdout;
  assert.match(counted, /repo: 0 blocks, 2 components, 0 screen-kinds/);
  assert.match(
    counted,
    /repo components read from components\/ \(tsconfig\.json maps @\/ to the package's root\)/,
  );

  // The tool data's word moves every reader at once.
  put(dir, "design/theme.json", json({ version: 1, source_folder: "app" }));
  assert.match(
    audit(dir).stdout,
    /^source files read: 1 of 1 screens and components in app \(source_folder in design\/theme\.json names it\)/m,
  );
});

// A workspace: an application package with its source at its root, whose component settings name
// the stylesheet of a sibling package; that stylesheet imports a file whose values sit in a cascade
// layer, and one of them is written in lab().
function workspace() {
  const root = path.join(empty(), "suite");
  put(
    root,
    "package.json",
    json({ name: "suite", private: true, workspaces: ["apps/*", "packages/*"] }),
  );
  const web = path.join(root, "apps/web");
  rootPackage(web);
  put(
    web,
    "components.json",
    json({
      tailwind: { css: "../../packages/ui/src/styles/globals.css" },
      aliases: { components: "@/components", ui: "@suite/ui/components" },
    }),
  );
  put(root, "packages/ui/package.json", json({ name: "@suite/ui", private: true }));
  put(root, "packages/ui/components.json", json({ tailwind: { css: "src/styles/globals.css" } }));
  put(
    root,
    "packages/ui/src/styles/globals.css",
    '@import "./palette.css";\n\n:root {\n  --background: var(--palette-paper);\n  --foreground: var(--palette-ink);\n  --primary: #1f5f8b;\n  --primary-foreground: var(--palette-paper);\n}\n',
  );
  put(
    root,
    "packages/ui/src/styles/palette.css",
    "@layer base {\n\t:root {\n\t\t--palette-paper: lab(98.144% 0 0);\n\t\t--palette-ink: hsl(0 0% 9%);\n\t}\n}\n",
  );
  put(root, "packages/ui/src/components/button.tsx", COMPONENT("Button"));
  put(root, "packages/empty/package.json", json({ name: "empty", private: true }));
  return { root, web };
}

test("at the root of a workspace every command names the packages to aim at, and adopting writes nothing", () => {
  const { root } = workspace();
  const before = snapshot(root);
  for (const script of ["audit.mjs", "status.mjs", "inventory.mjs"]) {
    const said = run(script, ["--target", root], listIn());
    assert.equal(said.status, 1, `${script}: ${said.stderr}`);
    assert.match(
      said.stdout,
      /^workspace: this folder is the root of a workspace of 3 package\(s\)/m,
      script,
    );
    assert.match(
      said.stdout,
      /^ {4}apps\/web: 4 source file\(s\), stylesheet \.\.\/\.\.\/packages\/ui\/src\/styles\/globals\.css$/m,
      script,
    );
    assert.match(
      said.stdout,
      /^ {4}packages\/ui: 1 source file\(s\), stylesheet src\/styles\/globals\.css$/m,
      script,
    );
    assert.match(said.stdout, /aim at one with --target, as --target apps\/web/, script);
  }
  assert.match(run("find.mjs", ["--target", root, "save"], listIn()).stdout, /^workspace: /m);
  const adopted = run("adopt.mjs", ["--target", root, "--product-type", "application"], listIn());
  assert.equal(adopted.status, 2);
  assert.match(adopted.stderr, /workspace of 3 package\(s\)[\s\S]*Nothing was written/);
  assert.deepEqual(snapshot(root), before);
});

test("aimed at a package, the sibling's stylesheet is read by every reader, its layered values followed", () => {
  const { web } = workspace();
  const result = auditJson(web);
  assert.deepEqual(result.stylesheets, [
    "../../packages/ui/src/styles/globals.css",
    "../../packages/ui/src/styles/palette.css",
  ]);
  const preview = run(
    "adopt.mjs",
    ["--target", web, "--dry-run", "--conformance-level", "AA"],
    listIn(),
  );
  assert.equal(preview.status, 1, preview.stderr);
  assert.match(preview.stdout, /--foreground on --background \d+\.\d\d:1/);
  assert.doesNotMatch(preview.stdout, /cannot be read \(--background is written as var/);
  assert.doesNotMatch(preview.stdout, /--color-background points nowhere/);
});

test("lab() and hsl() are read as the colours they are; one with transparency is not", () => {
  assert.equal(toHex(parseColor("lab(54.29% 80.8 69.89)")), "#ff0000");
  assert.equal(toHex(parseColor("lab(98.144% 0 -0.0000119209)")), "#fafafa");
  assert.equal(toHex(parseColor("hsla(0, 0%, 0%, 1)")), "#000000");
  assert.equal(toHex(parseColor("hsl(120 100% 50%)")), "#00ff00");
  assert.equal(parseColor("hsla(0, 0%, 0%, 0.5)"), null);
  assert.equal(parseColor("lab(50% 0 0 / 40%)"), null);
});

test("a row held by a lint rule, where the repository keeps no configuration of that lint tool, waits and is never held", () => {
  const dir = path.join(empty(), "other-lint");
  put(dir, "package.json", json({ name: "other-lint", private: true }));
  put(dir, "src/index.css", ":root {\n  --primary: #1f5f8b;\n}\n");
  // A file named for the rule: before, that was taken for the rule being there.
  put(dir, "lint/no-raw-colors.mjs", "export default {};\n");
  put(
    dir,
    "design/decisions.yaml",
    'version: 1\ndecisions:\n  - id: color-role\n    layer: foundations\n    kind: closed\n    source: "the lint"\n    check: "eslint:no-raw-colors"\n',
  );
  const result = auditJson(dir);
  const row = result.decisions.find((decision) => decision.id === "color-role");
  assert.equal(row.state, "not-held");
  assert.match(row.seen, /shows no sign of the lint tool this check is run by/);
  const status = run("status.mjs", ["--target", dir], listIn()).stdout;
  assert.match(
    status,
    /0 of 1 row\(s\) name a check that can be found; \d+ failing or bypassed; 1 wait on a lint tool the repository lacks, so they are not held;/,
  );
});

test("a lint the repository uses in another shape, or from a folder above, is never called missing", () => {
  const ledger =
    'version: 1\ndecisions:\n  - id: color-role\n    layer: foundations\n    kind: closed\n    source: "the lint"\n    check: "eslint:no-raw-colors"\n';
  const lacks = (dir) =>
    auditJson(dir).decisions.find((decision) => decision.id === "color-role").seen ?? "";
  // A configuration of an older shape.
  const legacy = path.join(empty(), "legacy");
  put(legacy, "package.json", json({ name: "legacy", private: true }));
  put(legacy, ".eslintrc.json", "{}\n");
  put(legacy, "design/decisions.yaml", ledger);
  assert.doesNotMatch(lacks(legacy), /shows no sign of the lint tool/);
  // A package of a workspace whose lint sits at the workspace's root.
  const root = path.join(empty(), "suite");
  put(root, "package.json", json({ name: "suite", devDependencies: { eslint: "^9.0.0" } }));
  put(root, ".git/HEAD", "ref: refs/heads/main\n");
  const member = path.join(root, "apps/web");
  put(member, "package.json", json({ name: "web", private: true }));
  put(member, "design/decisions.yaml", ledger);
  assert.doesNotMatch(lacks(member), /shows no sign of the lint tool/);
});

test("a selector or a name with the signs of a pattern is read as written in a layer", () => {
  const css =
    '@layer base {\n  [data-theme="dark"] { --paper: #000000; }\n  * { box-sizing: border-box; }\n  :root { --paper: #ffffff; --ink: var(--paper); }\n}\n';
  assert.equal(resolve({ css, base: "" }, ":root", "--ink").value, "var(--paper)");
  assert.equal(toHex(resolve({ css, base: "" }, ":root", "--ink").color), "#ffffff");
  assert.equal(
    toHex(resolve({ css, base: "" }, '[data-theme="dark"]', "--paper").color),
    "#000000",
  );
});

test("a workspace root that keeps screens of its own says where, and is then read as any repository", () => {
  const root = path.join(empty(), "own");
  put(root, "package.json", json({ name: "own", private: true, workspaces: ["packages/*"] }));
  put(root, "pages/home.tsx", COMPONENT("Home"));
  // A test kit's fixtures beside the packages are not screens of the root's own.
  put(root, "_acceptance/case/fixture.tsx", COMPONENT("Fixture"));
  put(root, "packages/ui/package.json", json({ name: "ui", private: true }));
  put(root, "packages/ui/src/button.tsx", COMPONENT("Button"));
  const before = run("audit.mjs", ["--target", root], listIn()).stdout;
  assert.match(before, /^workspace: /m);
  assert.match(before, /names their folder with source_folder in design\/theme\.json/);
  put(root, "design/theme.json", json({ version: 1, source_folder: "pages" }));
  const after = run("audit.mjs", ["--target", root], listIn()).stdout;
  assert.doesNotMatch(after, /^workspace: /m);
  assert.match(after, /^source files read: 1 of 1 screens and components in pages/m);
});
