// A small repository the brief command can read: a ledger of screens with one screen that is
// built and one declared ahead, the page of their kind, the screen list of an application, a data
// model, and each ledger a slot of the sheet takes its answer from. Nothing in it is built or
// drawn: the brief reads files and runs nothing. The screen declared ahead names an action and an
// entity the data model does not have. Every file can be changed or left out by the test that asks
// for the copy.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const BUILT = "orders";
export const PLANNED = "returns";
export const WIDTHS = [320, 1280];

const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const lines = (...text) => `${text.join("\n")}\n`;

const row = ({ id, route, status, shows, actions }) => [
  `  - id: ${id}`,
  `    route: ${route}`,
  `    title: ${id}Title`,
  "    family: list",
  `    status: ${status}`,
  "    shows:",
  `      - ${shows}`,
  "    entry: listOrders",
  "    actions:",
  `      - ${actions}`,
  "    states:",
  ...["ready", "loading", "empty", "error", "no-results"].map((state) => `      - ${state}`),
];

export const FILES = {
  "design/screens.yaml": lines(
    "version: 1",
    "statuses:",
    "  - built",
    "  - planned",
    "screens:",
    ...row({ id: BUILT, route: "/", status: "built", shows: "Order", actions: "cancelOrder" }),
    ...row({
      id: PLANNED,
      route: "/returns",
      status: "planned",
      shows: "Return",
      actions: "refundOrder",
    }),
  ),
  "design/patterns/list.md": lines(
    "---",
    "nhom: list",
    "doi_tuong: A screen that shows many records of one kind in a table.",
    "khuon:",
    "  ten: TypedTable",
    '  nhap: "@/components/ui/typed-table"',
    "nhan_dien:",
    '  - "src/screens/**/*.tsx"',
    "mau_dang_chay:",
    "  tep: src/screens/Orders.tsx",
    "khe_bat_buoc: [columns]",
    "cam_ngoai_khuon: [Table]",
    "ngoai_le: []",
    "nhan_viec: Find one order in the list, then act on it",
    "---",
    "",
    "# A list",
  ),
  "src/screens.ts": lines(
    "export const SCREENS = [",
    "  {",
    '    path: "/",',
    '    load: () => import("@/screens/Orders").then((m) => m.Orders),',
    "    states: [",
    '      { name: "ready", shows: "Orders" },',
    '      { name: "loading", scenario: "slow", shows: "Loading" },',
    '      { name: "empty", scenario: "empty", shows: "No orders yet" },',
    '      { name: "error", scenario: "fail", shows: "Orders could not be loaded" },',
    '      { name: "no-results", shows: "No order matches" },',
    "    ],",
    "  },",
    "  {",
    '    path: "/archive",',
    '    load: () => import("@/screens/Archive").then((m) => m.Archive),',
    '    states: [{ name: "ready", shows: "Archive" }],',
    "  },",
    "];",
  ),
  "src/screens/Orders.tsx": "export const Orders = () => null;\n",
  "ontology/actions.yaml": lines(
    "actions:",
    "  - name: listOrders",
    "    entity: Order",
    "    kind: query",
    "    roles: [clerk, manager]",
    "  - name: cancelOrder",
    "    entity: Order",
    "    kind: update",
    "    roles: [manager]",
  ),
  "ontology/roles.yaml": lines("roles:", "  - name: clerk", "  - name: manager"),
  "ontology/entities/Order.yaml": lines(
    "name: Order",
    "properties:",
    "  id: { type: integer, required: true }",
    "  customer: { type: string, required: true, display: text }",
    "  total: { type: number, required: true, display: money }",
  ),
  "design/column-types.json": json({
    version: 1,
    padding_ch: 2,
    types: { text: { base: "text", sample: 16 }, money: { base: "number", sample: 10 } },
  }),
  "design/states.json": json({
    version: 1,
    required: ["loading", "empty", "error", "no-results"],
    exempt: {},
  }),
  "design/screen-sizes.json": json({ version: 1, widths: WIDTHS }),
  "design/component-registry.json": json({
    version: "2",
    components: [
      {
        name: "Button",
        category: "action",
        file: "src/components/ui/button.tsx",
        source: "library",
        props: ["variant", "size"],
        variants: ["variant=default", "variant=outline"],
      },
      {
        name: "TypedTable",
        category: "data",
        file: "src/components/ui/typed-table.tsx",
        source: "own",
        props: ["columns"],
      },
    ],
  }),
  "design/decisions.yaml": lines(
    "version: 1",
    "decisions:",
    "  - id: color-contrast",
    "    layer: foundations",
    "    kind: formula",
    '    source: "WCAG 2.2 level AA, contrast ratio for text"',
    '    check: "tool:tools/design-assembly/check.mjs"',
    "  - id: labels",
    "    layer: content",
    "    kind: closed",
    '    source: "src/lib/labels.ts, the one place for every word a screen shows"',
    '    check: "tool:tools/design-assembly/check.mjs"',
    "  - id: terms",
    "    layer: content",
    "    kind: judgment",
    '    source: "design/terms.json"',
    "  - id: test-screen-sizes",
    "    layer: templates",
    "    kind: closed",
    '    source: "design/screen-sizes.json"',
    '    check: "e2e:tests/e2e/templates.spec.ts"',
  ),
  "design/blueprint.json": json({
    version: 1,
    status: "approved",
    layers: {
      context: {
        status: "decided",
        source: "user",
        choice: { product_type: "application", conformance_level: "AA" },
        // One principle the owner fixed, and one the guide proposed and nobody confirmed.
        principles: [
          { id: "clear-hierarchy", source: "user" },
          { id: "dense-and-scannable", source: "proposed" },
        ],
        why: "For the test.",
      },
      foundations: {
        status: "decided",
        source: "user",
        direction: "workbench",
        choice: { source_color: "#0246ff" },
        why: "For the test.",
      },
    },
  }),
  ".claude/rules/design-assembly.md": lines(
    "---",
    'paths: ["src/**/*.tsx"]',
    "---",
    "",
    "# Design rules the gate holds",
    "",
    "## What the owner fixed before any value",
    "",
    "- `principle-clear-hierarchy`: The order of importance is seen at once.",
    "",
    "## Words",
    "",
    "- A screen writes no word itself.",
    "- An error message says what happened and what to do next.",
    "",
    "## States",
    "",
    "- Every screen declares the states the state table lists.",
  ),
};

// What takes the source of one slot away from the built screen of the sample, by the slot's id: the
// slot is then open. The two slots no ledger holds have none: they are open as they stand.
export const DROPS = {
  kind: { "design/patterns/list.md": null },
  shows: { "design/screens.yaml": (text) => text.replace("    shows:\n      - Order\n", "") },
  actions: {
    "design/screens.yaml": (text) =>
      text.replace("    entry: listOrders\n    actions:\n      - cancelOrder\n", ""),
  },
  states: { "design/screens.yaml": (text) => text.replace("      - error\n", "") },
  components: { "design/component-registry.json": null },
  words: {
    "design/decisions.yaml": (text) => text.replaceAll("layer: content", "layer: patterns"),
  },
  rules: { ".claude/rules/design-assembly.md": null },
  principles: { "design/blueprint.json": null },
  "widths-and-checks": { "design/screen-sizes.json": null },
  "model-changes": { "ontology/actions.yaml": null },
  navigation: { "src/screens.ts": null },
};

// Writes a fresh copy and gives its folder, with a way to remove it. `change` names files by
// path: a text replaces the file, a function is given the file's text and returns the new one, and
// null leaves the file out. The copy is a repository of its own with no commit.
export function briefRepository(change = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-brief-"));
  const files = { ...FILES };
  for (const [file, to] of Object.entries(change)) {
    if (to === null) delete files[file];
    else files[file] = typeof to === "function" ? to(files[file]) : to;
  }
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  spawnSync("git", ["init", "--quiet"], { cwd: dir });
  return { dir, remove: () => rmSync(dir, { recursive: true, force: true }) };
}
