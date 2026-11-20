// A small application the review command can draw: one screen with two states, served by the first
// build this plugin draws with, written without a component library so that nothing but the build
// and the browser is needed. Three places of its screen are planted to break what the review
// measures: a text too pale for its ground, a word broken in its middle, and a line cut off by its
// box with nothing to say so. Each can be left out, and a fourth can be added that breaks only in dark. It is written
// under the build output folder of the repository this plugin lives in, so its packages are found
// where that repository installed them, and a run of its development server writes nothing into
// the plugin's sources.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderScreenLedger } from "../../templates/tools/design-assembly/screen-ledger.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ROOT = path.resolve(PLUGIN, "../..");
const PARENT = path.join(ROOT, "coverage", "plugin-review-sample");

// Whether the repository this plugin lives in has a build and a browser installed to draw with.
export const canDraw = () =>
  ["vite", "@playwright/test"].every((name) =>
    existsSync(path.join(ROOT, "node_modules", name, "package.json")),
  );

export const PLANTED = ["pale", "broken", "cut"];
export const WIDTHS = [320, 1280];

const DARK = `.dark {
  --background: #09090b;
  --foreground: #fafafa;
}
.dark .pale {
  color: #a1a1aa;
}
`;
const FOLLOWS = `@media (prefers-color-scheme: dark) {
  :root {
    --background: #09090b;
    --foreground: #fafafa;
  }
}
`;
// A page that sets no colour of its own: it stands on the browser's page colour, dark where the
// system is, with the browser's own colour for text.
const OWN_PAGE = `:root {
  color-scheme: light dark;
}
body {
  margin: 0;
  font: 16px/1.5 system-ui, sans-serif;
}
main {
  padding: 24px;
}
`;
const STYLES = `:root {
  --background: #ffffff;
  --foreground: #18181b;
}
body {
  margin: 0;
  font: 16px/1.5 system-ui, sans-serif;
  background: var(--background);
  color: var(--foreground);
}
main {
  padding: 24px;
}
.pale {
  color: #9a9a9a;
}
.broken {
  width: 72px;
  overflow-wrap: anywhere;
}
.cut {
  width: 120px;
  white-space: nowrap;
  overflow: hidden;
}
.dim {
  color: #3f3f46;
}
.fits {
  width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hyphen {
  width: 72px;
}
.banner {
  padding: 4px 8px;
  background-image: linear-gradient(#e4e4e7, #a1a1aa);
  color: #18181b;
}
.shelf {
  position: relative;
  width: 200px;
  height: 24px;
  overflow: hidden;
}
.off {
  position: absolute;
  left: 400px;
  margin: 0;
  white-space: nowrap;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
.closed {
  height: 0;
  overflow: hidden;
}
`;

// What every copy of the screen shows beside the planted places, and none of it is a break: a line
// that fits the box that would cut it, words that turn at a hyphen and at a dash of their own, a
// panel kept wholly off the screen, words for a screen reader alone, a folded panel, and a control
// that cannot be used, whose pale words are asked no ratio. Two more are for a person's eye and
// are named, not counted: a line its box shortens with an ellipsis, and words on a gradient.
const FINE = [
  '<p class="fits">Short</p>',
  '<p class="hyphen">state-of-the-art</p>',
  '<p class="hyphen">2020–2024</p>',
  '<p class="fits">A label its box shortens with a mark</p>',
  '<p class="banner">Words on a gradient</p>',
  '<div class="shelf"><p class="off">Kept off the screen until asked for</p></div>',
  '<span class="sr">For a screen reader alone</span>',
  '<div class="closed"><p>Folded away</p></div>',
  '<button type="button" disabled>Not yet</button>',
].join("");

// What the screen shows, by what is planted. A place left out keeps its words and loses only the
// class that breaks it, so the screen with nothing planted is the same screen, clean.
const lines = (planted) =>
  [
    ["pale", "p", "Updated two days ago"],
    ["broken", "p", "Internationalization"],
    ["cut", "p", "A long line that does not fit in the box it is given"],
    ["dim", "p", "Shown since the first release"],
  ]
    .map(([name, tag, words]) =>
      planted.includes(name)
        ? `<${tag} class="${name}">${words}</${tag}>`
        : name === "dim"
          ? ""
          : `<${tag}>${words}</${tag}>`,
    )
    .join("");

const main = (
  planted,
  { toggle },
) => `const scenario = new URLSearchParams(location.search).get("scenario");
const app = document.querySelector("#app");
const ready = ${JSON.stringify(`<main><h1>Orders</h1>${lines(planted)}${FINE}<button type="button">Refresh</button></main>`)};
const empty = "<main><h1>Orders</h1><p>No orders yet</p></main>";
app.innerHTML = scenario === "empty" ? empty : ready;
${
  toggle
    ? 'document.querySelector("button")?.addEventListener("click", () => {\n  document.documentElement.classList.toggle("dark");\n});\n'
    : ""
}`;

const LEDGER = [
  "version: 1",
  "decisions:",
  "  - id: color-contrast",
  "    layer: foundations",
  "    kind: formula",
  '    source: "WCAG 2.2 level AA, contrast ratio for text"',
  '    check: "tool:tools/design-assembly/check.mjs"',
  "",
].join("\n");

const RULES = [
  "---",
  'paths: ["src/**/*.js"]',
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
].join("\n");

const BLUEPRINT = {
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
};

// Writes a fresh copy and gives its folder, with a way to remove it. `planted` names the places
// that break a measurement; `toggle` gives the application a switch to dark of its own; `follows`
// makes it take the dark of the system; `dark: false` leaves it with no dark theme; `ownPage`
// leaves every colour to the browser; `listed: false` leaves it with no screen list, so nothing
// says how a state is reached; `ledger` keeps a decisions ledger with the contrast row. The copy is
// a repository of its own with no commit, so a record made of it is the same whatever state the
// repository around it is in.
export function reviewRepository({
  planted = PLANTED,
  toggle = false,
  follows = false,
  dark = true,
  ownPage = false,
  listed = true,
  ledger = true,
} = {}) {
  mkdirSync(PARENT, { recursive: true });
  const dir = mkdtempSync(path.join(PARENT, "app-"));
  const files = {
    "package.json": `${JSON.stringify(
      {
        name: "review-sample",
        private: true,
        type: "module",
        scripts: { dev: "vite" },
        devDependencies: { vite: "*" },
      },
      null,
      2,
    )}\n`,
    "index.html":
      '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8" /><title>Review sample</title><link rel="stylesheet" href="/src/index.css" /></head>\n<body><div id="app"></div><script type="module" src="/src/main.js"></script></body>\n</html>\n',
    "src/index.css": ownPage ? OWN_PAGE : `${STYLES}${dark ? DARK : ""}${follows ? FOLLOWS : ""}`,
    "src/main.js": main(planted, { toggle }),
    [listed ? "src/screens.ts" : "src/notes.ts"]:
      'export const SCREENS = [\n  {\n    path: "/",\n    states: [\n      { name: "ready", shows: "Orders" },\n      { name: "empty", scenario: "empty", shows: "No orders yet" },\n    ],\n  },\n];\n',
    "design/screens.yaml": renderScreenLedger({
      families: { list: "List" },
      screens: [
        {
          id: "orders",
          route: "/",
          title: "Orders",
          family: "list",
          status: "built",
          states: ["ready", "empty"],
        },
        {
          id: "returns",
          route: "/returns",
          title: "Returns",
          family: "list",
          status: "planned",
          states: ["ready"],
        },
      ],
    }),
    "design/screen-sizes.json": `${JSON.stringify({ version: 1, widths: WIDTHS }, null, 2)}\n`,
    "design/blueprint.json": `${JSON.stringify(BLUEPRINT, null, 2)}\n`,
    ".claude/rules/design-assembly.md": RULES,
    ...(ledger ? { "design/decisions.yaml": LEDGER } : {}),
  };
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  spawnSync("git", ["init", "--quiet"], { cwd: dir });
  return { dir, remove: () => rmSync(dir, { recursive: true, force: true }) };
}
