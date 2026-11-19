// A small repository with a store of its own: two screens, a frame, components of the library and
// of its own, an intake ledger with blocks made by hand and taken from a pinned outside source, and
// a list of what was made before the ledger. Healthy as written; each of the six installs of the
// inventory's findings makes one finding show, and taking it out again makes it go.
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const sha = (text) => createHash("sha256").update(text).digest("hex");
export const json = (data) => `${JSON.stringify(data, null, 2)}\n`;

const made = [];
export const cleanUp = () => made.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
export function empty() {
  const dir = mkdtempSync(path.join(tmpdir(), "design-store-"));
  made.push(dir);
  return dir;
}
export function put(dir, file, text) {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
}
export function repo(files) {
  const dir = empty();
  for (const [file, text] of Object.entries(files)) put(dir, file, text);
  return dir;
}

export const COMPONENT = (name) =>
  `export function ${name}({ rows }: { rows: string[] }) {\n  return <div>{rows.length}</div>;\n}\n`;

const SNAPSHOT = "data-grid-1\nfilter-bar\n";
export const FETCHED = "2026-11-11T01:42:13.053Z";
export const source = (fetched = FETCHED) => ({
  version: 1,
  id: "kit",
  title: "A component kit",
  order: 1,
  pin: { fetched_at: fetched, files: [{ file: "kit.txt", sha256: sha(SNAPSHOT) }] },
  snapshot: "tools/kit/snapshot",
  catalog: "design/kit-catalog.json",
  install: "npx add-from-kit {name}",
});
const CATALOG = {
  items: [
    { name: "data-grid-1", kind: "block", title: "Data grid", description: "Many rows" },
    { name: "filter-bar", kind: "block", title: "Filter bar", description: "Narrow a list" },
  ],
};

const DATA_REGION = COMPONENT("DataRegion");
const FILTER_BAR = COMPONENT("FilterBar");
export const TABLE_ACTIONS = readFileSync(
  path.join(PLUGIN, "templates/owned/table-actions.tsx.template"),
  "utf8",
);

export const block = (said) =>
  [
    `  - name: ${said.name}`,
    `    file: ${said.file}`,
    `    source: ${said.source}`,
    ...(said.from ? [`    from: ${said.from}`] : []),
    ...(said.pin ? [`    pin: ${said.pin}`] : []),
    `    need: ${said.need}`,
    "    approved: 2026-11-12",
    "    approved_by: the owner",
    ...(said.taken ? [`    taken: ${said.taken}`] : []),
    ...(said.retired ? ["    retired: { on: 2026-11-18, by: the owner, why: Not needed }"] : []),
  ].join("\n");

export const BLOCKS = [
  {
    name: "DataRegion",
    file: "src/components/data-region.tsx",
    source: "data-grid-1",
    from: "kit",
    pin: "2026-11-11",
    need: "many-rows",
    taken: sha(DATA_REGION),
  },
  {
    name: "FilterBar",
    file: "src/components/filter-bar.tsx",
    source: "by-hand",
    need: "filter-list",
    taken: sha(FILTER_BAR),
  },
  {
    name: "TableActions",
    file: "src/components/ui/table-actions.tsx",
    source: "TableActions",
    from: "starter",
    need: "row-actions-column",
  },
];

export const intake = (blocks = BLOCKS) =>
  [
    "version: 1",
    "blocks:",
    ...blocks.map(block),
    "before:",
    "  - name: AppFrame",
    "    file: src/components/app-frame.tsx",
    "    why: Made before the ledger",
    "",
  ].join("\n");

const SCREENS = [
  "version: 1",
  "screens:",
  ...["items", "team"].flatMap((id) => [
    `  - id: ${id}`,
    `    route: /${id}`,
    "    title: null",
    "    family: null",
    "    status: built",
  ]),
  "",
].join("\n");

export const ITEMS = [
  'import { DataRegion } from "@/components/data-region";',
  'import { TableActions } from "@/components/ui/table-actions";',
  'import { Button } from "@/components/ui/button";',
  "export default function Items() {",
  "  return <DataRegion rows={[]} />;",
  "}",
  "",
].join("\n");
export const TEAM = [
  'import { FilterBar } from "@/components/filter-bar";',
  "export default function Team() {",
  "  return <FilterBar rows={[]} />;",
  "}",
  "",
].join("\n");

// The healthy repository, as files.
export const healthyFiles = () => ({
  "components.json": json({ aliases: { ui: "@/components/ui" } }),
  "package.json": json({ dependencies: { react: "19.0.0" } }),
  "index.html":
    '<!doctype html>\n<div id="root"></div>\n<script type="module" src="/src/main.tsx"></script>\n',
  "src/main.tsx": 'import { App } from "./App";\nApp();\n',
  "src/App.tsx":
    'import { AppFrame } from "@/components/app-frame";\nexport const App = () => AppFrame;\n',
  "src/screens.ts": [
    "export const SCREENS = [",
    '  { path: "/items", load: () => import("@/pages/Items") },',
    '  { path: "/team", load: () => import("@/pages/Team") },',
    "];",
    "",
  ].join("\n"),
  "src/pages/Items.tsx": ITEMS,
  "src/pages/Team.tsx": TEAM,
  "src/components/ui/button.tsx": COMPONENT("Button"),
  "src/components/ui/card.tsx": COMPONENT("Card"),
  "src/components/ui/table.tsx": COMPONENT("Table"),
  "src/components/ui/table-actions.tsx": TABLE_ACTIONS,
  "src/components/app-frame.tsx": COMPONENT("AppFrame"),
  "src/components/data-region.tsx": DATA_REGION,
  "src/components/filter-bar.tsx": FILTER_BAR,
  "design/screens.yaml": SCREENS,
  "design/intake.yaml": intake(),
  "design/sources/kit.json": json(source()),
  "tools/kit/snapshot/kit.txt": SNAPSHOT,
  "design/kit-catalog.json": json(CATALOG),
});

// The six installs of the inventory's findings, each the files it changes from the healthy ones.
export const INSTALLS = {
  // An own component no file imports.
  unused: () => ({ "src/components/orphan.tsx": COMPONENT("Orphan") }),
  // A new own component a screen imports, with no row in the ledger.
  unrecorded: () => ({
    "src/components/badge-line.tsx": COMPONENT("BadgeLine"),
    "src/pages/Team.tsx": `import { BadgeLine } from "@/components/badge-line";\n${TEAM}`,
  }),
  // A block copied to another path, recorded a second time for the same item of the same source.
  duplicate: () => ({
    "src/components/data-region-copy.tsx": DATA_REGION,
    "src/pages/Team.tsx": `import { DataRegion as Copy } from "@/components/data-region-copy";\n${TEAM}`,
    "design/intake.yaml": intake([
      ...BLOCKS,
      {
        ...BLOCKS[0],
        name: "DataRegionCopy",
        file: "src/components/data-region-copy.tsx",
        need: "rows-again",
      },
    ]),
  }),
  // The source pinned again, the block not taken again.
  outdated: () => ({ "design/sources/kit.json": json(source("2026-11-19T08:00:00.000Z")) }),
  // A line of a block's file changed, with no reason recorded.
  modified: () => ({ "src/components/filter-bar.tsx": `${FILTER_BAR}// changed here\n` }),
  // A component written in the file of one screen, which another screen imports.
  promote: () => ({
    "src/pages/Items.tsx": `${ITEMS}export function ItemsHeading() {\n  return <h1>Items</h1>;\n}\n`,
    "src/pages/Team.tsx": `import { ItemsHeading } from "@/pages/Items";\n${TEAM}`,
  }),
};

// The healthy repository with the given installs, merged in the order given.
export function storeRepo(...installs) {
  const files = healthyFiles();
  for (const kind of installs) {
    for (const [file, text] of Object.entries(INSTALLS[kind]())) {
      // Two installs that rewrite the same screen keep both lines of imports.
      files[file] =
        file.startsWith("src/pages/") && files[file] !== healthyFiles()[file]
          ? `${text.split("\n")[0]}\n${files[file]}`
          : text;
    }
  }
  return repo(files);
}
