// The files of a small repository the guide can build: two screens of one kind, the floor's
// stylesheet and Makefile, an approved blueprint. Shared by the tests that need such a repository,
// so the fixture is written once.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CORE_STATES } from "../../templates/tools/design-assembly/patterns.mjs";
import { withoutBlock } from "../../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "../..");
export const ROOT = path.resolve(PLUGIN, "../..");
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;

// A file of this repository, as it is.
export const own = (file) => readFileSync(path.join(ROOT, file), "utf8");

export function blueprint() {
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

const ALL = ["ready", ...CORE_STATES];
const screen = (route, source) =>
  `  { path: "${route}", load: () => import("${source}").then((m) => m.Page), states: [${ALL.map(
    (name) => `{ name: "${name}", shows: LABELS.title }`,
  ).join(", ")}] },`;
export const REGISTRY = `export const SCREENS = [\n${screen("/", "@/pages/List")}\n${screen("/archive", "@/pages/Archive")}\n];\n`;
export const SOURCE = [
  'import { LABELS } from "@/lib/labels";',
  "",
  "export function Page() {",
  "  return (",
  "    <main>",
  "      <h1>{LABELS.title}</h1>",
  "    </main>",
  "  );",
  "}",
  "",
].join("\n");
export const PAGE = [
  "---",
  "nhom: list",
  "doi_tuong: A screen that shows many items of one type.",
  "khuon:",
  "  ten: Table",
  '  nhap: "@/components/ui/table"',
  "nhan_dien:",
  '  - "src/pages/**/*.tsx"',
  "mau_dang_chay:",
  "  tep: src/pages/List.tsx",
  "khe_bat_buoc: []",
  "cam_ngoai_khuon: []",
  "ngoai_le: []",
  "nhan_viec: Find one item, then work with it",
  "---",
  "",
  "## When to use",
  "",
  "A list of items.",
  "",
].join("\n");

// Every file of the repository, with `extra` added or put in place of one.
export const floorFiles = (extra = {}) => ({
  "src/index.css": withoutBlock(own("src/index.css")),
  Makefile: own("Makefile"),
  "src/screens.ts": REGISTRY,
  "src/pages/List.tsx": SOURCE,
  "src/pages/Archive.tsx": SOURCE,
  "design/blueprint.json": blueprint(),
  "design/patterns/list.md": PAGE,
  ...extra,
});
