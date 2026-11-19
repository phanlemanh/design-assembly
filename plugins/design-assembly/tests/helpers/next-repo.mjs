// A small application built with Next.js, the second build this plugin draws with: two screens of
// the app router, a stylesheet with the floor's colour roles, a ledger of screens and the widths
// they are drawn at. It is written under the build output folder of the repository this plugin
// lives in, so its packages are found where that repository installed them, and a run of its
// development server writes nothing into the plugin's sources.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderScreenLedger } from "../../templates/tools/design-assembly/screen-ledger.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ROOT = path.resolve(PLUGIN, "../..");
const PARENT = path.join(ROOT, "coverage", "plugin-next-sample");

const FILES = {
  "package.json": `${JSON.stringify(
    {
      name: "next-sample",
      private: true,
      scripts: { dev: "next dev" },
      dependencies: { next: "16.4.6", react: "^19.3.1", "react-dom": "^19.3.1" },
    },
    null,
    2,
  )}\n`,
  "src/index.css": `:root {
  --background: #ffffff;
  --foreground: #18181b;
  --primary: #0246ff;
  --primary-foreground: #ffffff;
  --radius: 0.625rem;
}
.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --primary: #5b8cff;
  --primary-foreground: #09090b;
}
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--background);
  color: var(--foreground);
}
main {
  padding: 24px;
}
a {
  color: var(--primary);
}
`,
  "app/layout.jsx": `import "../src/index.css";

export const metadata = { title: "Next sample" };

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  "app/page.jsx": `export default function Overview() {
  return (
    <main>
      <h1>Overview</h1>
      <p>Three items wait for a reply.</p>
      <a href="/items">All items</a>
    </main>
  );
}
`,
  "app/items/page.jsx": `const ITEMS = ["Annual plan", "Onboarding session", "Support pack"];

export default function Items() {
  return (
    <main>
      <h1>Items</h1>
      <ul>
        {ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}
`,
  "design/screens.yaml": renderScreenLedger({
    families: { list: "List" },
    screens: [
      {
        id: "overview",
        route: "/",
        title: "Overview",
        family: "list",
        status: "built",
        states: ["ready"],
      },
      {
        id: "items",
        route: "/items",
        title: "Items",
        family: "list",
        status: "built",
        states: ["ready"],
      },
    ],
  }),
  "design/screen-sizes.json": `${JSON.stringify({ widths: [390, 1280] }, null, 2)}\n`,
};

// Writes a fresh copy and gives its folder, with a way to remove it.
export function nextRepository() {
  mkdirSync(PARENT, { recursive: true });
  const dir = mkdtempSync(path.join(PARENT, "app-"));
  for (const [file, text] of Object.entries(FILES)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  return { dir, remove: () => rmSync(dir, { recursive: true, force: true }) };
}
