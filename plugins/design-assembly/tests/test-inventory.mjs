// The inventory of the store: how many pieces each store and each kind holds, the state of each
// piece of the repository, what it finds, and what it could not look at and why. Read-only, the
// same twice, no network; with --strict a finding ends the call with 1.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, lstatSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process, { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { inventory } from "../scripts/inventory.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";
import {
  BLOCKS,
  cleanUp,
  COMPONENT,
  empty,
  intake,
  json,
  put,
  repo,
  sha,
  source,
  storeRepo,
  TABLE_ACTIONS,
} from "./helpers/store-repo.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const SCRIPT = path.join(PLUGIN, "scripts/inventory.mjs");
after(cleanUp);

const run = (dir, ...args) =>
  spawnSync(execPath, [SCRIPT, ...args, "--target", dir], { encoding: "utf8" });
const item = (result, name) => result.items.find((piece) => piece.name === name);
const blindOf = (result, kind) => result.blind.filter((entry) => entry.kind === kind);
const kinds = (result) => result.findings.map((finding) => finding.kind).sort();

test("each piece of the repository has its state: in use, unused, retired, or retired and still in use", () => {
  const dir = storeRepo();
  put(
    dir,
    "design/intake.yaml",
    intake([
      BLOCKS[0],
      { ...BLOCKS[1], retired: true },
      BLOCKS[2],
      {
        name: "OldHeader",
        file: "src/components/old-header.tsx",
        source: "by-hand",
        need: "page-head",
        retired: true,
      },
    ]),
  );
  put(dir, "src/components/old-header.tsx", COMPONENT("OldHeader"));
  const result = inventory(dir);
  assert.equal(item(result, "DataRegion").state, "in-use");
  assert.deepEqual(item(result, "DataRegion").used_by, ["items"]);
  assert.equal(item(result, "FilterBar").state, "retired-in-use");
  assert.equal(item(result, "OldHeader").state, "retired");
  // A retired block nobody imports is what retiring it was for: not a finding.
  assert.deepEqual(result.findings, []);
  assert.equal(item(result, "Card").state, "unused");
});

test("the frame of the application is a user: a component only the frame reaches is in use", () => {
  const result = inventory(storeRepo());
  const frame = item(result, "AppFrame");
  assert.equal(frame.state, "in-use");
  assert.equal(frame.frame, true);
  assert.deepEqual(frame.used_by, []);
});

test("with no entry of the frame found, nothing is reported unused, and the blind spots say why", () => {
  const dir = storeRepo("unused");
  rmSync(path.join(dir, "index.html"));
  const result = inventory(dir);
  assert.deepEqual(kinds(result), []);
  assert.match(
    blindOf(result, "unused")
      .map((entry) => entry.why)
      .join(" "),
    /frame/,
  );
});

test("a component of the library is counted, never reported", () => {
  const result = inventory(storeRepo());
  assert.equal(item(result, "Card").source, "library");
  assert.equal(item(result, "Card").state, "unused");
  assert.ok(result.stores.some((entry) => entry.store === "repo" && entry.kind === "component"));
});

test("with no intake ledger only the findings that need none are looked for, and the blind spots name the ledger", () => {
  const dir = storeRepo("unused", "unrecorded");
  rmSync(path.join(dir, "design/intake.yaml"));
  const result = inventory(dir);
  assert.deepEqual(kinds(result), ["unused"]);
  for (const kind of ["unrecorded", "duplicate", "outdated", "modified"]) {
    assert.match(
      blindOf(result, kind)
        .map((entry) => entry.why)
        .join(" "),
      /no intake ledger/,
      kind,
    );
  }
});

test("a block with no hash taken is not reported modified, and one with no pin not outdated: they are named blind", () => {
  const dir = storeRepo("outdated", "modified");
  put(
    dir,
    "design/intake.yaml",
    intake([{ ...BLOCKS[0], pin: undefined }, { ...BLOCKS[1], taken: undefined }, BLOCKS[2]]),
  );
  const result = inventory(dir);
  assert.deepEqual(kinds(result), []);
  assert.deepEqual(
    blindOf(result, "modified").flatMap((entry) => entry.items),
    ["FilterBar"],
  );
  assert.deepEqual(
    blindOf(result, "outdated").flatMap((entry) => entry.items),
    ["DataRegion"],
  );
});

test("a source whose snapshot is not the one pinned is unreadable: none of its blocks is reported outdated", () => {
  const dir = storeRepo("outdated");
  writeFileSync(path.join(dir, "tools/kit/snapshot/kit.txt"), "changed\n");
  const result = inventory(dir);
  assert.deepEqual(kinds(result), []);
  assert.match(
    blindOf(result, "outdated")
      .map((entry) => entry.why)
      .join(" "),
    /kit/,
  );
});

test("a block of the starter kit is compared with the template of this plugin; a reason recorded keeps it quiet", () => {
  const dir = storeRepo();
  put(dir, "src/components/ui/table-actions.tsx", `${TABLE_ACTIONS}// ours\n`);
  assert.deepEqual(kinds(inventory(dir)), ["modified"]);
  const changed = intake().replace(
    "    need: row-actions-column",
    "    need: row-actions-column\n    changed: { on: 2026-11-19, why: Our own sticky width }",
  );
  put(dir, "design/intake.yaml", changed);
  assert.deepEqual(kinds(inventory(dir)), []);
  put(dir, "src/components/filter-bar.tsx", "changed\n");
  put(
    dir,
    "design/intake.yaml",
    changed.replace(
      `    taken: ${BLOCKS[1].taken}`,
      `    taken: ${BLOCKS[1].taken}\n    changed: { on: 2026-11-19, why: A narrower bar }`,
    ),
  );
  assert.deepEqual(kinds(inventory(dir)), []);
});

test("an own component listed in before, by its name alone, is not unrecorded", () => {
  const dir = storeRepo("unrecorded");
  put(
    dir,
    "design/intake.yaml",
    intake().replace(
      "before:\n",
      "before:\n  - name: BadgeLine\n    why: Made before the ledger\n",
    ),
  );
  assert.deepEqual(kinds(inventory(dir)), []);
});

test("an own component listed in before by its file alone is not unrecorded either", () => {
  const dir = storeRepo("unrecorded");
  put(
    dir,
    "design/intake.yaml",
    intake().replace(
      "before:\n",
      "before:\n  - file: src/components/badge-line.tsx\n    why: Made before the ledger\n",
    ),
  );
  assert.deepEqual(kinds(inventory(dir)), []);
});

test("two blocks that are not components but hold the same bytes are one thing taken twice", () => {
  const dir = storeRepo();
  const hook = "export function useRows() {\n  return [];\n}\n";
  put(dir, "src/lib/use-rows.ts", hook);
  put(dir, "src/lib/use-rows-again.ts", hook);
  put(
    dir,
    "src/pages/Team.tsx",
    `import { useRows } from "@/lib/use-rows";\nimport { useRows as again } from "@/lib/use-rows-again";\n${readFileSync(path.join(dir, "src/pages/Team.tsx"), "utf8")}`,
  );
  const rows = (name, file, need) => ({ name, file, source: "by-hand", need, taken: sha(hook) });
  put(
    dir,
    "design/intake.yaml",
    intake([
      ...BLOCKS,
      rows("useRows", "src/lib/use-rows.ts", "rows"),
      rows("useRowsAgain", "src/lib/use-rows-again.ts", "rows-again"),
    ]),
  );
  const result = inventory(dir);
  assert.deepEqual(kinds(result), ["duplicate"], JSON.stringify(result.findings));
  assert.match(result.findings[0].evidence.join(" "), /the same bytes/);
});

test("blocks that name a word their source's catalog does not hold are not the same item taken twice", () => {
  const dir = storeRepo();
  // The repository's own word for made by hand, not declared under values: two blocks carry it.
  const own = (block) => ({ ...block, source: "made-by-us", from: undefined, pin: undefined });
  put(
    dir,
    "design/intake.yaml",
    intake([BLOCKS[0], own(BLOCKS[1]), BLOCKS[2]]).replace(
      "  - name: TableActions",
      `${[
        "  - name: Spare",
        "    file: src/components/app-frame.tsx",
        "    source: made-by-us",
        "    need: spare",
      ].join("\n")}\n  - name: TableActions`,
    ),
  );
  const result = inventory(dir);
  assert.deepEqual(
    result.findings.filter((finding) => finding.evidence.some((line) => /both/.test(line))),
    [],
  );
});

test("--store and --kind narrow the counts, the pieces and the findings", () => {
  const dir = storeRepo("outdated", "unused");
  const starter = inventory(dir, { store: "starter" });
  assert.deepEqual(
    starter.items.map((piece) => piece.name),
    ["TableActions"],
  );
  assert.ok(starter.stores.every((entry) => entry.store === "starter"));
  assert.deepEqual(starter.findings, []);
  const external = inventory(dir, { store: "external" });
  assert.deepEqual(
    external.items.map((piece) => piece.name),
    ["DataRegion"],
  );
  assert.deepEqual(kinds(external), ["outdated"]);
  const blocks = inventory(dir, { kind: "block" });
  assert.ok(blocks.items.every((piece) => piece.kind === "block"));
  assert.deepEqual(kinds(blocks), ["outdated"]);
  const behaviours = inventory(dir, { kind: "behaviour" });
  assert.deepEqual([behaviours.items, behaviours.findings], [[], []]);
  assert.match(behaviours.blind[0].why, /no store keeps behaviours yet/);
});

test("a wrong call ends with 2 and says what is wrong", () => {
  const dir = storeRepo();
  for (const [args, said] of [
    [["--store", "shop"], /--store is repo, starter, external or all/],
    [["--kind", "page"], /--kind is component, block, screen-kind or behaviour/],
    [["--nope"], /--nope/],
    [["rows"], /rows/],
  ]) {
    const call = run(dir, ...args);
    assert.equal(call.status, 2, args.join(" "));
    assert.equal(call.stdout, "", args.join(" "));
    assert.match(call.stderr, said, args.join(" "));
  }
});

test("a person reads the counts, the findings with their evidence, and the blind spots", () => {
  const call = run(storeRepo("unused"));
  assert.equal(call.status, 0, call.stderr);
  assert.match(call.stdout, /^inventory: /);
  assert.match(call.stdout, /unused: .*src\/components\/orphan\.tsx/);
  assert.match(call.stdout, /not looked at:/);
});

// A repository taken in by the tool of version 0.7.3, as git keeps it.
function olderTool() {
  const old = empty();
  const archive = spawnSync("git", ["-C", ROOT, "archive", "03e2a99", "plugins/design-assembly"], {
    maxBuffer: 1 << 28,
  });
  assert.equal(archive.status, 0, String(archive.stderr));
  assert.equal(spawnSync("tar", ["-x", "-C", old], { input: archive.stdout }).status, 0);
  const dir = repo({
    "src/index.css": withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")),
    Makefile: readFileSync(path.join(ROOT, "Makefile"), "utf8"),
  });
  spawnSync(execPath, [
    path.join(old, "plugins/design-assembly/scripts/apply.mjs"),
    "--target",
    dir,
  ]);
  return dir;
}

// A repository built with Next.js: its screens are the pages of its folders, its components sit
// outside src/.
const nextShaped = () =>
  repo({
    "package.json": json({ dependencies: { next: "15.0.0", react: "19.0.0" } }),
    "app/page.tsx":
      'import { Button } from "@/components/ui/button";\nexport default function Page() {\n  return <Button />;\n}\n',
    "components/ui/button.tsx": COMPONENT("Button"),
  });

function blocker() {
  const file = path.join(empty(), "block.mjs");
  writeFileSync(
    file,
    [
      'import { createRequire, syncBuiltinESMExports } from "node:module";',
      "const require = createRequire(import.meta.url);",
      'const refuse = () => { throw new Error("blocked by the test"); };',
      'const net = require("node:net");',
      "net.connect = refuse; net.createConnection = refuse; net.Socket.prototype.connect = refuse;",
      'const dns = require("node:dns"); dns.lookup = refuse;',
      'const child = require("node:child_process");',
      "for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) child[name] = refuse;",
      "globalThis.fetch = refuse;",
      "syncBuiltinESMExports();",
      "",
    ].join("\n"),
  );
  return file;
}
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}

test("on four shapes of repository the inventory opens no connection, starts no program, writes nothing, and says the same twice", () => {
  const block = blocker();
  for (const [shape, dir] of [
    ["nothing, not in git", repo({ "notes.txt": "nothing\n" })],
    ["taken in by the tool of 0.7.3", olderTool()],
    ["built with Next.js", nextShaped()],
    ["with its own store and a pinned source", storeRepo(...["unused", "outdated", "promote"])],
  ]) {
    const before = snapshot(dir);
    const call = () =>
      spawnSync(execPath, ["--import", block, SCRIPT, "--target", dir, "--json"], {
        encoding: "utf8",
      });
    const first = call();
    assert.equal(first.status, 0, `${shape}: ${first.stderr}`);
    assert.doesNotMatch(first.stderr, /blocked by the test|\n\s+at /, shape);
    for (const key of ["stores", "items", "findings", "blind"]) {
      assert.ok(Array.isArray(JSON.parse(first.stdout)[key]), `${shape}: ${key}`);
    }
    assert.equal(call().stdout, first.stdout, shape);
    assert.deepEqual(snapshot(dir), before, `${shape}: the tree changed`);
  }
});

test("where imports cannot be traced, nothing is reported unused, unrecorded or promoted, and the blind spots say why", () => {
  const dir = nextShaped();
  put(dir, "components/orphan.tsx", COMPONENT("Orphan"));
  const result = inventory(dir);
  assert.deepEqual(result.findings, []);
  for (const kind of ["unused", "unrecorded", "promote"]) {
    assert.ok(blindOf(result, kind).length > 0, kind);
  }
  assert.match(blindOf(result, "unused")[0].why, /ledger of screens/);
});

test("this repository is healthy: --strict ends with 0, and its frame component is in use", () => {
  const call = run(ROOT, "--strict", "--json");
  assert.equal(call.status, 0, call.stdout);
  const result = JSON.parse(call.stdout);
  assert.deepEqual(result.findings, []);
  const frame = result.items.find((piece) => piece.file === "src/components/app-frame.tsx");
  assert.equal(frame.state, "in-use");
  assert.equal(frame.frame, true);
  const own = new Set(
    result.items.filter((piece) => piece.source === "own").map((piece) => piece.file),
  );
  for (const file of own) {
    const pieces = result.items.filter((piece) => piece.file === file);
    assert.ok(
      pieces.some((piece) => piece.state === "in-use"),
      `${file} is not in use`,
    );
  }
});

// ---- what an independent review found -----------------------------------------------------------

test("a built screen whose page is not found makes nothing unused, and the blind spots say which", () => {
  const dir = storeRepo("unused");
  put(
    dir,
    "src/screens.ts",
    'export const SCREENS = [{ path: "/items", load: () => import("@/pages/Items") }];\n',
  );
  const result = inventory(dir);
  assert.deepEqual(kinds(result), []);
  assert.match(
    blindOf(result, "unused")
      .map((entry) => entry.why)
      .join(" "),
    /team/,
  );
});

test("a retired copy of a block is not one thing taken twice", () => {
  const dir = storeRepo();
  put(
    dir,
    "src/components/data-region-old.tsx",
    readFileSync(path.join(dir, "src/components/data-region.tsx"), "utf8"),
  );
  put(
    dir,
    "design/intake.yaml",
    intake([
      ...BLOCKS,
      {
        ...BLOCKS[0],
        name: "OldRegion",
        file: "src/components/data-region-old.tsx",
        need: "old-rows",
        retired: true,
      },
    ]),
  );
  assert.deepEqual(kinds(inventory(dir)), []);
});

test("a constant written in a screen's file is not a component to promote", () => {
  const dir = storeRepo();
  put(
    dir,
    "src/pages/Items.tsx",
    `${readFileSync(path.join(dir, "src/pages/Items.tsx"), "utf8")}export const PAGE_SIZE = 10;\n`,
  );
  put(
    dir,
    "src/pages/Team.tsx",
    `import { PAGE_SIZE } from "@/pages/Items";\n${readFileSync(path.join(dir, "src/pages/Team.tsx"), "utf8")}`,
  );
  assert.deepEqual(kinds(inventory(dir)), []);
  put(
    dir,
    "src/pages/Items.tsx",
    `${readFileSync(path.join(dir, "src/pages/Items.tsx"), "utf8")}export async function ItemsBadge() {\n  return null;\n}\n`,
  );
  put(
    dir,
    "src/pages/Team.tsx",
    `import { ItemsBadge } from "@/pages/Items";\n${readFileSync(path.join(dir, "src/pages/Team.tsx"), "utf8")}`,
  );
  assert.deepEqual(kinds(inventory(dir)), ["promote"]);
});

test("an intake ledger whose blocks are not a list reports nothing unrecorded, and says why", () => {
  const dir = storeRepo();
  put(
    dir,
    "design/intake.yaml",
    "version: 1\nblocks:\n  DataRegion: src/components/data-region.tsx\n",
  );
  const result = inventory(dir);
  assert.deepEqual(kinds(result), []);
  assert.match(
    blindOf(result, "unrecorded")
      .map((entry) => entry.why)
      .join(" "),
    /not a list/,
  );
});

test("a block whose file is outside the repository is never read, and is named blind", () => {
  const dir = storeRepo();
  put(
    dir,
    "design/intake.yaml",
    intake([
      ...BLOCKS,
      {
        name: "Far",
        file: "../../../etc/hosts",
        source: "by-hand",
        need: "far",
        taken: "0".repeat(64),
      },
    ]),
  );
  const result = inventory(dir);
  assert.deepEqual(kinds(result), []);
  assert.ok(
    result.blind.some(
      (entry) => entry.items.includes("Far") && /outside the repository/.test(entry.why),
    ),
  );
});

test(
  "a file that cannot be read is named blind, and the rest of the inventory is given",
  { skip: process.getuid?.() === 0 },
  () => {
    const dir = storeRepo();
    const file = path.join(dir, "src/components/filter-bar.tsx");
    chmodSync(file, 0o000);
    try {
      const call = run(dir, "--json");
      assert.equal(call.status, 0, call.stderr);
      const result = JSON.parse(call.stdout);
      assert.ok(
        result.blind.some(
          (entry) => /cannot be read/.test(entry.why) && entry.items.includes("FilterBar"),
        ),
      );
    } finally {
      chmodSync(file, 0o644);
    }
  },
);

test("a reason for a change written as words keeps a block quiet too", () => {
  const dir = storeRepo("modified");
  put(
    dir,
    "design/intake.yaml",
    intake().replace(
      `    taken: ${BLOCKS[1].taken}`,
      `    taken: ${BLOCKS[1].taken}\n    changed: A narrower bar`,
    ),
  );
  assert.deepEqual(kinds(inventory(dir)), []);
});

test("a block pinned at the version of its source is not outdated when the pin also has a day", () => {
  const dir = storeRepo();
  put(
    dir,
    "design/sources/kit.json",
    json({ ...source(), pin: { ...source().pin, version: "4.2.0" } }),
  );
  put(dir, "design/intake.yaml", intake([{ ...BLOCKS[0], pin: "4.2.0" }, BLOCKS[1], BLOCKS[2]]));
  assert.deepEqual(kinds(inventory(dir)), []);
});

test("the frame's entries are the module scripts of the page, not a commented one, with any query left off", () => {
  const dir = storeRepo();
  put(
    dir,
    "index.html",
    '<!-- <script type="module" src="/src/old.tsx"></script> -->\n<script type="module" data-src="/src/x.tsx" src="/src/main.tsx?v=1"></script>\n',
  );
  put(dir, "src/old.tsx", 'import { Orphan } from "@/components/orphan";\nOrphan;\n');
  put(dir, "src/components/orphan.tsx", COMPONENT("Orphan"));
  const result = inventory(dir);
  assert.deepEqual(kinds(result), ["unused"]);
  assert.equal(item(result, "AppFrame").state, "in-use");
});

test("the frame's entries read comments as a browser does: closed at the first end, or never", () => {
  for (const [page, used] of [
    // `<!-` is no opening, so the comment is the inner one and the script after it is loaded.
    ['<!-<!-- x -->-<script type="module" src="/src/old.tsx"></script>\n', true],
    // `<!-->` closes at once, so the script after it is loaded.
    ['<!--><script type="module" src="/src/old.tsx"></script>\n', true],
    // A comment never closed hides the rest of the page.
    ['<!-- <script type="module" src="/src/old.tsx"></script>\n', false],
  ]) {
    const dir = storeRepo();
    put(dir, "index.html", `${page}<script type="module" src="/src/main.tsx"></script>\n`);
    put(dir, "src/old.tsx", 'import { Orphan } from "@/components/orphan";\nOrphan;\n');
    put(dir, "src/components/orphan.tsx", COMPONENT("Orphan"));
    const result = inventory(dir);
    assert.equal(item(result, "Orphan").state, used ? "in-use" : "unused", page);
  }
});

test("a block with neither name nor need is named blind as unnamed, never as nothing", () => {
  const dir = storeRepo();
  put(
    dir,
    "design/intake.yaml",
    `${intake()}`.replace(
      "before:",
      "  - file: src/components/gone.tsx\n    source: by-hand\nbefore:",
    ),
  );
  const result = inventory(dir);
  for (const entry of result.blind)
    assert.ok(
      entry.items.every((name) => typeof name === "string" && name),
      JSON.stringify(entry),
    );
});
