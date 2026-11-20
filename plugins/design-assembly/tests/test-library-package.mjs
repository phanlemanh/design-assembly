// The second component source: a component library kept in a package of a monorepo, its folder
// named by the package's own alias and shared with the components the package writes itself. The
// library's files are told from the repository's own by the settings and by the library's list of
// items, never by the name of a folder; every check that leaves the library out reads that one list.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import { audit } from "../scripts/audit.mjs";
import { adapter as shadcn } from "../templates/tools/design-assembly/adapters/shadcn.mjs";
import {
  inLibrary,
  libraryFolders,
  libraryParts,
  libraryTest,
  readComponents,
  readFolder,
} from "../templates/tools/design-assembly/components.mjs";
import { liveSkip } from "../templates/tools/design-assembly/check.mjs";
import { bypasses, sheetProblem } from "../templates/tools/design-assembly/owner-calls.mjs";
import { channelsProblem } from "../templates/tools/design-assembly/patterns.mjs";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const BUTTON = `import { cva } from "class-variance-authority";
const buttonVariants = cva("inline-flex text-[13px] rounded-[3px]", {
  variants: { size: { sm: "h-8", lg: "h-10" } },
});
export function Button({ size, className }) {
  return <button className={buttonVariants({ size, className })} />;
}
`;
const TOASTER = `import { Toaster as Sonner } from "sonner";
export function Toaster(props) {
  return <Sonner {...props} />;
}
`;
const OWN = `export function OwnCard({ children }) {
  return <div className="p-[7px]">{children}</div>;
}
`;
const BADGE = `export function Badge() {
  return <span className="text-[11px]" />;
}
`;

// A package of a monorepo that keeps its library in src/components, beside its own components.
function uiPackage({ alias = "@acme/ui/components", registries = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-library-"));
  made.push(dir);
  const put = (file, text) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  };
  put(
    "package.json",
    JSON.stringify({
      name: "@acme/ui",
      private: true,
      exports: {
        "./globals.css": "./src/styles/globals.css",
        "./components/*": "./src/components/*.tsx",
        "./lib/*": "./src/lib/*.ts",
      },
    }),
  );
  put(
    "components.json",
    JSON.stringify({
      style: "radix-nova",
      tailwind: { css: "src/styles/globals.css", cssVariables: true },
      aliases: { components: alias, ui: alias, utils: "@acme/ui/lib/utils" },
      ...(registries
        ? { registries: { "@reui": { url: "https://example.test/{name}.json" } } }
        : {}),
    }),
  );
  put("src/styles/globals.css", ":root {\n  --primary: oklch(0.5 0.2 260);\n}\n");
  put("src/components/button.tsx", BUTTON);
  put("src/components/sonner.tsx", TOASTER);
  put("src/components/own-card.tsx", OWN);
  put("src/components/reui/badge.tsx", BADGE);
  return dir;
}

test("the library's items are its registry's, read at the source with the day they were read", () => {
  assert.ok(shadcn.items.length >= 60);
  for (const name of ["button", "sonner", "scroll-area", "tabs", "calendar"]) {
    assert.ok(shadcn.items.includes(name), name);
  }
  assert.deepEqual([...shadcn.items].sort(), shadcn.items, "kept in order");
  assert.match(shadcn.itemsSource, /^https:\/\/ui\.shadcn\.com\/r\/index\.json, read 2026-11-20$/);
});

test("an alias of the package's own is followed through its exports to a folder", () => {
  const pkg = {
    name: "@acme/ui",
    exports: { "./components/*": "./src/components/*.tsx", "./lib/*": "./src/lib/*.ts" },
  };
  const settings = (ui, components = ui) => ({ aliases: { ui, components } });
  assert.equal(shadcn.folderIn(settings("@acme/ui/components"), pkg), "src/components");
  assert.equal(shadcn.folderIn(settings("@/components/ui"), pkg), "src/components/ui");
  // Another package's alias, or one its exports do not reach, names no folder here.
  assert.equal(shadcn.folderIn(settings("@other/ui/components"), pkg), null);
  // A package whose name is as long as this one's, and differs, is still another package.
  assert.equal(shadcn.folderIn(settings("@acme/uz/components"), pkg), null);
  assert.equal(shadcn.folderIn(settings("@acme/ui/widgets"), pkg), null);
  assert.equal(shadcn.folderIn(settings("@acme/ui/components"), null), null);
  const registries = { ...settings("@acme/ui/components"), registries: { "@reui": {} } };
  assert.deepEqual(shadcn.registryFoldersIn(registries, pkg), ["src/components/reui"]);
  assert.deepEqual(importPath(), "@acme/ui/components");
  function importPath() {
    return shadcn.importPathIn(settings("@acme/ui/components"));
  }
});

test("in a folder the library shares, only the files of its items are the library's", () => {
  const dir = uiPackage();
  assert.deepEqual(libraryFolders(dir), ["src/components", "src/components/reui"]);
  assert.deepEqual(libraryParts(dir), [
    "src/components/button.tsx",
    "src/components/sonner.tsx",
    "src/components/reui/",
  ]);
  const mine = libraryTest(dir);
  assert.ok(mine("src/components/button.tsx"));
  assert.ok(mine("src/components/reui/badge.tsx"));
  assert.ok(!mine("src/components/own-card.tsx"));
  // A name that only begins with an item's is not that item.
  assert.ok(!inLibrary("src/components/button-row.tsx", libraryParts(dir)));
});

test("a folder the library keeps to itself is the library's whole, as before", () => {
  const dir = uiPackage({ alias: "@/components/ui", registries: false });
  assert.deepEqual(libraryParts(dir), ["src/components/ui/"]);
  // With no settings at all, the usual folders are the library's.
  const bare = mkdtempSync(path.join(tmpdir(), "design-library-"));
  made.push(bare);
  const usual = libraryTest(bare);
  assert.ok(usual("apps/web/src/components/ui/button.tsx"));
  assert.ok(usual("src/components/reui/badge.tsx"));
  assert.ok(!usual("src/components/own-card.tsx"));
});

test("the audit counts the bypasses of the package's own components, not the library's", () => {
  const dir = uiPackage();
  const decisions = Object.fromEntries(audit(dir).decisions.map((item) => [item.id, item]));
  assert.equal(decisions.spacing.bypassed, 1);
  assert.ok(!decisions["type-scale"].bypassed, JSON.stringify(decisions["type-scale"]));
  assert.ok(!decisions.radius.bypassed, JSON.stringify(decisions.radius));
});

test("the gate's bypass count and the channel rule leave the library's files out", () => {
  const dir = uiPackage();
  const sources = readFolder(dir, "src");
  const parts = libraryParts(dir);
  const counted = bypasses(sources, libraryTest(dir));
  assert.deepEqual(counted.spacing.files, ["src/components/own-card.tsx (1)"]);
  assert.equal(counted["type-scale"].count, 0);
  // Without the list, the library's button is counted as the repository's own.
  assert.equal(bypasses(sources)["type-scale"].count, 1);
  const rows = [{ id: "type-scale", layer: "foundations", kind: "closed" }];
  assert.equal(sheetProblem({ ledger: rows, sources, library: parts }), null);
  assert.match(sheetProblem({ ledger: rows, sources }), /type-scale: 1 place/);
  // The library's toaster calls its toast library: it is no screen.
  assert.equal(channelsProblem(sources, parts), null);
  assert.match(channelsProblem(sources, []), /sonner\.tsx: calls the toast library sonner itself/);
});

test("the component manifest marks the library's components and the package's own apart", () => {
  const dir = uiPackage();
  const manifest = readComponents(readFolder(dir, "src/components"), {
    library: libraryParts(dir),
  });
  const source = Object.fromEntries(manifest.components.map((item) => [item.name, item.source]));
  assert.deepEqual(source, {
    Badge: "library",
    Button: "library",
    OwnCard: "own",
    Toaster: "library",
  });
});

test("a repository whose settings name the usual folder keeps every folder it was told apart by", () => {
  // Settings that name src/components/ui and no other registry; a reui folder and a nested app's
  // ui folder were the library's before, by their names, and stay so.
  const dir = uiPackage({ alias: "@/components/ui", registries: false });
  mkdirSync(path.join(dir, "src/components/reui"), { recursive: true });
  writeFileSync(path.join(dir, "src/components/reui/badge.tsx"), BADGE);
  const mine = libraryTest(dir);
  assert.ok(mine("src/components/reui/badge.tsx"));
  assert.ok(mine("apps/web/src/components/ui/button.tsx"));
  assert.ok(!mine("src/components/own-card.tsx"));
  const sources = readFolder(dir, "src");
  const rows = [{ id: "type-scale", layer: "foundations", kind: "closed" }];
  // The button sits outside the folder the settings name, so it is the repository's own here; the
  // reui badge is not.
  const said = sheetProblem({ ledger: rows, sources, library: libraryParts(dir) }) ?? "";
  assert.match(said, /src\/components\/button\.tsx/);
  assert.doesNotMatch(said, /reui/);
  const decisions = Object.fromEntries(audit(dir).decisions.map((item) => [item.id, item]));
  assert.ok(!decisions["type-scale"].bypassed_in?.some((file) => file.includes("reui")));
});

test("a shared folder with no file of the library's lists its components as the repository's own", () => {
  const dir = uiPackage({ registries: false });
  for (const file of ["button.tsx", "sonner.tsx"]) {
    rmSync(path.join(dir, "src/components", file));
  }
  rmSync(path.join(dir, "src/components/reui"), { recursive: true });
  assert.deepEqual(libraryParts(dir), []);
  const manifest = readComponents(readFolder(dir, "src/components"), {
    library: libraryParts(dir),
  });
  assert.deepEqual(
    manifest.components.map((item) => [item.name, item.source]),
    [["OwnCard", "own"]],
  );
  // With no list at all, as a caller that knows of no library asks, every component is listed as
  // before.
  assert.equal(readComponents(readFolder(dir, "src/components")).components[0].source, "library");
});

test("the gate adds the library's files read now to a skip list the guide wrote earlier", () => {
  const dir = uiPackage();
  const state = { root: dir, library: libraryParts(dir) };
  // The guide wrote its list before the toaster was installed.
  const check = { skip: ["src/components/button.tsx", "src/generated/"] };
  assert.deepEqual(liveSkip(state, check), [
    "src/components/button.tsx",
    "src/generated/",
    "src/components/sonner.tsx",
    "src/components/reui/",
  ]);
  assert.deepEqual(liveSkip({ root: dir, library: null }, check), check.skip);
  assert.deepEqual(liveSkip({ root: dir, library: null }, {}), []);
});
