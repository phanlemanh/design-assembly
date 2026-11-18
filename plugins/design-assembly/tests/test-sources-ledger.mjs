// The ledger of outside sources: which libraries a repository picks blocks from, in what order,
// at which pin, and where the list of what each offers is. One file per source, so that pinning
// one source again writes one file. The tools never fetch: a pin is read, and the snapshot it names
// is compared with the hashes it records.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import { readState, runChecks } from "../templates/tools/design-assembly/check.mjs";
import {
  LEDGERS,
  presentLedgers,
  shapeProblems,
  UNSETTLED,
} from "../templates/tools/design-assembly/contract.mjs";
import {
  catalogItems,
  readPinnedSources,
  SOURCES_FOLDER,
} from "../templates/tools/design-assembly/sources-ledger.mjs";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function repo(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-assembly-sources-"));
  made.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const sha = (text) => createHash("sha256").update(text).digest("hex");

const SNAPSHOT = "## Blocks (2)\n- grid-1: a grid\n- grid-2: another grid\n";

// A source pinned by the files it was read from, with a flat catalog.
const kit = {
  version: 1,
  id: "kit",
  title: "A component kit",
  order: 2,
  pin: {
    fetched_at: "2026-11-11T01:42:13.053Z",
    files: [
      {
        file: "kit.txt",
        url: "https://example.test/kit.txt",
        bytes: Buffer.byteLength(SNAPSHOT),
        sha256: sha(SNAPSHOT),
      },
    ],
  },
  snapshot: "tools/kit/snapshot",
  catalog: "design/kit-catalog.json",
  install: "npx add-from-kit {name}",
  licence: "Blocks need the repository's key when they are taken in.",
};

const flatCatalog = {
  items: [
    { name: "grid-1", kind: "block", title: "Data grid", description: "Many rows to read" },
    { name: "button", kind: "component", title: "Button", description: "A control to press" },
  ],
};

// A source pinned by a version number, with a catalog kept in groups, as one repository keeps it.
const pack = {
  version: 1,
  id: "pack",
  title: "A pack of examples",
  order: 1,
  pin: { version: "3.0.1" },
  catalog: "design/pack-catalog.json",
};

const groupedCatalog = {
  pin: { fetched_at: "2026-11-11" },
  counts: { block: 1 },
  groups: [
    {
      kind: "block",
      group: "Application",
      category: "App Shell",
      base: "https://example.test/blocks/app-shell",
      items: [
        { name: "app-shell-1", title: "Sidebar shell", description: "A frame with a sidebar" },
      ],
    },
  ],
};

const healthy = () =>
  repo({
    [`${SOURCES_FOLDER}/kit.json`]: json(kit),
    [`${SOURCES_FOLDER}/pack.json`]: json(pack),
    "tools/kit/snapshot/kit.txt": SNAPSHOT,
    "design/kit-catalog.json": json(flatCatalog),
    "design/pack-catalog.json": json(groupedCatalog),
  });

test("the sources are the thirteenth ledger of the contract, one file per source, and settled", () => {
  assert.equal(Object.keys(LEDGERS).length, 13);
  assert.equal(LEDGERS.sources.folder, SOURCES_FOLDER);
  assert.equal(SOURCES_FOLDER, "design/sources");
  assert.equal(LEDGERS.sources.version, 1);
  assert.ok(!("sources" in UNSETTLED));
});

test("a source of that shape holds, pinned by its files or by a version", () => {
  assert.deepEqual(shapeProblems("sources", json(kit), "design/sources/kit.json"), []);
  assert.deepEqual(shapeProblems("sources", json(pack), "design/sources/pack.json"), []);
  const pointed = { ...pack, pin: undefined, pin_file: "tools/pack/pin.json" };
  assert.deepEqual(shapeProblems("sources", json(pointed), "design/sources/pack.json"), []);
  // Keys of the repository's own are kept.
  const own = { ...kit, owner_note: "pinned by the platform team" };
  assert.deepEqual(shapeProblems("sources", json(own), "design/sources/kit.json"), []);
});

test("a source file named otherwise than its id, or without a pin, does not hold", () => {
  const problems = (data, file = "design/sources/kit.json") =>
    shapeProblems("sources", json(data), file).join("\n");
  assert.match(problems(kit, "design/sources/other.json"), /named other\.json.*id is kit/);
  assert.match(problems({ ...kit, pin: undefined }), /pin.*missing/);
  assert.match(problems({ ...kit, pin: { fetched_at: "2026-11-11" } }), /pin.*files.*version/);
  assert.match(problems({ ...kit, order: "first" }), /order is string/);
  assert.match(problems({ ...kit, id: "Kit One" }), /id is "Kit One"/);
  assert.match(problems({ ...kit, catalog: undefined }), /catalog is missing/);
  assert.match(problems({ ...kit, install: "npx add-from-kit" }), /install.*\{name\}/);
  const badHash = { ...kit, pin: { ...kit.pin, files: [{ file: "kit.txt", sha256: "abc" }] } };
  assert.match(problems(badHash), /sha256 is "abc"/);
  assert.match(problems({ ...kit, version: 2 }), /design\/sources\/kit\.json has shape 2/);
  assert.match(
    shapeProblems("sources", "{ not json", "design/sources/kit.json").join(),
    /not valid JSON/,
  );
});

test("the pinned sources are read in their order, with every item of their catalogs", () => {
  const sources = readPinnedSources(healthy());
  assert.deepEqual(
    sources.map((source) => [source.id, source.unreadable]),
    [
      ["pack", null],
      ["kit", null],
    ],
  );
  const [packRead, kitRead] = sources;
  assert.deepEqual(packRead.pin, { version: "3.0.1" });
  assert.deepEqual(packRead.items, [
    {
      name: "app-shell-1",
      kind: "block",
      title: "Sidebar shell",
      description: "A frame with a sidebar",
      group: "Application",
      category: "App Shell",
      page: "https://example.test/blocks/app-shell",
    },
  ]);
  assert.deepEqual(
    kitRead.items.map((item) => item.name),
    ["grid-1", "button"],
  );
  assert.equal(kitRead.install, "npx add-from-kit {name}");
  // A pin that names no snapshot cannot be compared, and the source says so.
  assert.deepEqual(kitRead.blind, []);
  assert.match(packRead.blind.join(), /pinned by a version/);
});

test("a snapshot that differs from its pin makes the source unreadable, and only that source", () => {
  const dir = healthy();
  writeFileSync(
    path.join(dir, "tools/kit/snapshot/kit.txt"),
    `${SNAPSHOT}- grid-3: added by hand\n`,
  );
  const [packRead, kitRead] = readPinnedSources(dir);
  assert.equal(packRead.unreadable, null);
  assert.match(kitRead.unreadable, /kit\.txt.*sha256/);
  assert.equal(kitRead.items, null);
});

test("a source reads the pin from the file a repository already keeps", () => {
  const dir = healthy();
  const pinned = { ...kit, pin: undefined, pin_file: "tools/kit/pin.json" };
  writeFileSync(path.join(dir, `${SOURCES_FOLDER}/kit.json`), json(pinned));
  writeFileSync(path.join(dir, "tools/kit/pin.json"), json(kit.pin));
  const kitRead = readPinnedSources(dir).find((source) => source.id === "kit");
  assert.equal(kitRead.unreadable, null);
  assert.equal(kitRead.pin.fetched_at, kit.pin.fetched_at);
  rmSync(path.join(dir, "tools/kit/pin.json"));
  assert.match(readPinnedSources(dir)[1].unreadable, /tools\/kit\/pin\.json/);
});

test("a source whose catalog is missing, or of a newer shape, is unreadable and says why", () => {
  const dir = healthy();
  rmSync(path.join(dir, "design/pack-catalog.json"));
  writeFileSync(path.join(dir, `${SOURCES_FOLDER}/kit.json`), json({ ...kit, version: 2 }));
  const [packRead, kitRead] = readPinnedSources(dir);
  assert.match(packRead.unreadable, /design\/pack-catalog\.json/);
  assert.match(kitRead.unreadable, /shape 2.*update the design-assembly plugin/);
});

test("a repository with no sources reads as none, never as an error", () => {
  assert.deepEqual(readPinnedSources(repo({ "README.md": "nothing here\n" })), []);
  assert.deepEqual(catalogItems({}), []);
});

test("every source file is a ledger the audit lists, with what is wrong with it", () => {
  const dir = healthy();
  writeFileSync(path.join(dir, `${SOURCES_FOLDER}/stray.json`), json({ ...kit }));
  const sources = presentLedgers(dir).filter((ledger) => ledger.kind === "sources");
  assert.deepEqual(
    sources.map(({ file, problems }) => [file, problems.length > 0]),
    [
      ["design/sources/kit.json", false],
      ["design/sources/pack.json", false],
      ["design/sources/stray.json", true],
    ],
  );
});

test("the gate's shape check holds the source files, and is seen failing", () => {
  const dir = healthy();
  writeFileSync(
    path.join(dir, "design/theme.json"),
    json({ checks: { "ledger-shapes": [{ kind: "shapes" }] } }),
  );
  const shapes = () => runChecks(readState(dir)).find((result) => result.id === "ledger-shapes");
  assert.equal(shapes().problem, null);
  writeFileSync(path.join(dir, `${SOURCES_FOLDER}/kit.json`), json({ ...kit, pin: undefined }));
  assert.match(shapes().problem, /design\/sources\/kit\.json\.pin/);
});
