// The export of variables that was brought in is kept under the sources ledger (spec 0018,
// criterion 13, with 15): a source of the kind `variables` names the file the repository keeps, by
// its path from the root, with the day it was taken, its hash and the plug it came through;
// `variables-source` writes the row from a file already in the repository and copies nothing;
// `--check` says when a file differs from its pin, naming the row and the file; `--again` pins the
// file as it is now and keeps every other word of the row. What is kept is the JSON of the
// variables: a file that is not one is refused, so a design file itself is never pinned. Every
// export here is made up, and no command reaches the network.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { readCapabilities } from "../scripts/capabilities.mjs";
import { shapeProblems } from "../templates/tools/design-assembly/contract.mjs";
import {
  readPinnedSources,
  readVariablesSources,
} from "../templates/tools/design-assembly/sources-ledger.mjs";
import { adopted, listIn } from "./helpers/core-family.mjs";
import { exportOf } from "./helpers/variables-export.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NO_NETWORK = path.join(PLUGIN, "tests/helpers/no-network.mjs");
const SCRIPT = path.join(PLUGIN, "scripts/variables-source.mjs");
const ON = "2026-11-28";
const LATER = "2026-12-03";
// Where the made-up export is kept in the repository, and the row that pins it.
const KEPT = "design/outside/variables.json";
const ROW = "design/sources/variables.json";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-variables-source-")));
  made.push(dir);
  return dir;
};
const put = (dir, file, content) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (dir, file) => JSON.parse(text(dir, file));
const pretty = (data) => `${JSON.stringify(data, null, 2)}\n`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Every command of these tests runs with the network unreachable, and says what it reached for.
const run = (file, ...args) => {
  const log = path.join(empty(), "reached.log");
  const result = spawnSync(execPath, ["--import", NO_NETWORK, file, ...args], {
    encoding: "utf8",
    env: { ...env, DESIGN_ASSEMBLY_NETWORK_LOG: log, DESIGN_ASSEMBLY_CORES: listIn() },
  });
  return { ...result, reached: existsSync(log) ? readFileSync(log, "utf8") : "" };
};
const source = (dir, ...args) => run(SCRIPT, "--target", dir, ...args);
const gate = (dir) => run(path.join(dir, "tools/design-assembly/check.mjs"), "--target", dir);
function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .filter((name) => name !== ".git")
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (statSync(full).isDirectory()) return snapshot(dir, relative);
      return [`${relative} ${sha(readFileSync(full))}`];
    });
}

// The made-up export as a file's text, and a repository that keeps it.
const EXPORT = pretty(exportOf());
function keeping(dir = empty()) {
  put(dir, KEPT, EXPORT);
  return dir;
}
// The plug a design tool's export comes through: the one whose file says the ways to bring a file in.
const filePlug = () => readCapabilities().plugs.find((plug) => Array.isArray(plug.ways));
// The row as the command writes it for the made-up export.
const rowOf = (more = {}) => ({
  version: 1,
  id: "variables",
  kind: "variables",
  pin: {
    fetched_at: ON,
    files: [{ file: KEPT, bytes: Buffer.byteLength(EXPORT), sha256: sha(EXPORT) }],
  },
  ...more,
});

// ---- the contract: a source of the kind `variables` ---------------------------------------------

test("a row of the kind variables has its shape in the contract: no catalog, a pin with the day it was taken and each file with its hash", () => {
  assert.deepEqual(shapeProblems("sources", pretty(rowOf()), ROW), []);
  assert.deepEqual(shapeProblems("sources", pretty(rowOf({ plug: "a-plug" })), ROW), []);
  // Without its kind the same row is a library blocks are picked from, which no export is: this is
  // why no shape that was there fits it.
  const library = Object.fromEntries(Object.entries(rowOf()).filter(([key]) => key !== "kind"));
  assert.deepEqual(shapeProblems("sources", pretty(library), ROW), [`${ROW}.catalog is missing`]);
  for (const [row, said] of [
    [{ ...rowOf(), pin: undefined }, /variables\.json\.pin is missing/],
    [
      { ...rowOf(), pin: { files: rowOf().pin.files } },
      /variables\.json\.pin\.fetched_at is missing/,
    ],
    [{ ...rowOf(), pin: { fetched_at: "last week", files: rowOf().pin.files } }, /fetched_at/],
    [
      { ...rowOf(), pin: { fetched_at: ON, files: [{ file: KEPT, sha256: "abc" }] } },
      /pin\.files\[0\]\.sha256/,
    ],
    [
      { ...rowOf(), pin: { fetched_at: ON, files: [] } },
      /is an export of variables and has no pin: its row names the file kept in the repository with its sha256/,
    ],
  ]) {
    const problems = shapeProblems("sources", pretty(row), ROW);
    assert.ok(
      problems.some((line) => said.test(line)),
      `${said}: ${problems.join("; ")}`,
    );
  }
});

test("a row of the kind variables is no library: the ladder of the components socket leaves it out", () => {
  const dir = keeping();
  put(dir, ROW, pretty(rowOf()));
  assert.deepEqual(readPinnedSources(dir), []);
  const [kept] = readVariablesSources(dir);
  assert.equal(kept.id, "variables");
  assert.equal(kept.file, ROW);
  assert.equal(kept.fetched_at, ON);
  assert.deepEqual(kept.problems, []);
  assert.deepEqual(kept.drift, []);
});

// ---- the command writes the row from a file the repository keeps --------------------------------

test("criterion 13: variables-source writes one row with the day it was taken, the file's sha256 and the plug it came through, and changes nothing else", () => {
  const plug = filePlug();
  assert.ok(plug, "no plug file says the ways to bring a file in");
  const dir = keeping(adopted());
  const before = snapshot(dir);
  const row = `design/sources/${plug.id}-variables.json`;
  const preview = source(dir, "--file", KEPT, "--plug", plug.id, "--on", ON, "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /preview only: nothing was written/);
  assert.deepEqual(snapshot(dir), before);

  const done = source(dir, "--file", KEPT, "--plug", plug.id, "--on", ON, "--json");
  assert.equal(done.status, 0, done.stderr);
  assert.equal(done.reached, "");
  const result = JSON.parse(done.stdout);
  assert.equal(result.row, row);
  assert.deepEqual(json(dir, row), {
    ...rowOf({ id: `${plug.id}-variables`, plug: plug.id }),
  });
  assert.deepEqual(shapeProblems("sources", text(dir, row), row), []);
  // One file was written, and the export was hashed where it is: not moved, not rewritten.
  assert.deepEqual(
    snapshot(dir).filter((line) => !before.includes(line)),
    [`${row} ${sha(text(dir, row))}`],
  );
  assert.equal(text(dir, KEPT), EXPORT);
  // The repository's own gate reads the row and stays green.
  const checked = gate(dir);
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
});

test("criterion 13: without a plug the row is named variables and names none; --id and --title are the person's", () => {
  const dir = keeping();
  const plain = source(dir, "--file", KEPT, "--on", ON);
  assert.equal(plain.status, 0, plain.stderr);
  assert.match(
    plain.stdout,
    /export of variables: design\/outside\/variables\.json, hashed where it is/,
  );
  assert.deepEqual(json(dir, ROW), rowOf());
  const named = source(dir, "--file", KEPT, "--id", "Brand Tokens", "--title", "A made-up system");
  assert.equal(named.status, 0, named.stderr);
  const row = json(dir, "design/sources/brand-tokens.json");
  assert.equal(row.id, "brand-tokens");
  assert.equal(row.title, "A made-up system");
});

// ---- one command says when the file differs from its pin ----------------------------------------

test("criterion 13: --check says every kept export matches its pin, and ends with 0", () => {
  const dir = keeping();
  assert.equal(source(dir, "--file", KEPT, "--on", ON).status, 0);
  const checked = source(dir, "--check");
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(checked.reached, "");
  assert.match(
    checked.stdout,
    /design\/sources\/variables\.json: design\/outside\/variables\.json is the file it was pinned with on 2026-11-28/,
  );
  // A repository that keeps none says so, and nothing waits.
  const none = source(empty(), "--check");
  assert.equal(none.status, 0, none.stderr);
  assert.match(none.stdout, /no export of variables is kept here/);
});

test("criterion 13, broken: a file that differs from its pin by one byte turns --check red, naming the row and the file", () => {
  const dir = keeping();
  assert.equal(source(dir, "--file", KEPT, "--on", ON).status, 0);
  put(dir, KEPT, EXPORT.replace("ink/500", "ink/501"));
  const changed = source(dir, "--check");
  assert.equal(changed.status, 1, changed.stdout + changed.stderr);
  assert.match(
    changed.stdout,
    /design\/sources\/variables\.json: design\/outside\/variables\.json is not the file it was pinned with: its sha256 differs from the pin/,
  );
  assert.match(changed.stdout, /variables-source --again --id variables/);
  const data = JSON.parse(source(dir, "--check", "--json").stdout);
  assert.deepEqual(data.differs, [
    `${ROW}: ${KEPT} is not the file it was pinned with: its sha256 differs from the pin`,
  ]);
  // The reader says the same, for any command that reads the ledger.
  assert.deepEqual(readVariablesSources(dir)[0].drift, data.differs);
  // Put back, it is green again: the pin was never touched.
  put(dir, KEPT, EXPORT);
  assert.equal(source(dir, "--check").status, 0);
  // A file that is gone is said too.
  rmSync(path.join(dir, KEPT));
  const gone = source(dir, "--check");
  assert.equal(gone.status, 1);
  assert.match(
    gone.stdout,
    /variables\.json: design\/outside\/variables\.json, a file of its pin, is not there/,
  );
});

test("criterion 13: --again pins the file as it is now, with the day, and keeps every other word of the row", () => {
  const dir = keeping();
  assert.equal(source(dir, "--file", KEPT, "--plug", filePlug().id, "--on", ON).status, 0);
  const row = `design/sources/${filePlug().id}-variables.json`;
  // A person added words of their own to the row.
  put(dir, row, pretty({ ...json(dir, row), title: "A made-up system", licence: "Ours." }));
  const newer = EXPORT.replace("ink/500", "ink/501");
  put(dir, KEPT, newer);
  const id = `${filePlug().id}-variables`;
  const again = source(dir, "--again", "--id", id, "--on", LATER);
  assert.equal(again.status, 0, again.stderr);
  const written = json(dir, row);
  assert.deepEqual(written.pin, {
    fetched_at: LATER,
    files: [{ file: KEPT, bytes: Buffer.byteLength(newer), sha256: sha(newer) }],
  });
  assert.equal(written.title, "A made-up system");
  assert.equal(written.licence, "Ours.");
  assert.equal(written.plug, filePlug().id);
  assert.equal(source(dir, "--check").status, 0);
  // A row that is not there, or is of another kind, is refused.
  const missing = source(dir, "--again", "--id", "nothing");
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /design\/sources\/nothing\.json is no row of the kind variables/);
});

// ---- what is refused, in one sentence, with nothing written -------------------------------------

test("criterion 13: what is kept is the JSON of the variables: a design file, a token file, a file outside the repository or in the ledger's own folder is refused", () => {
  const dir = keeping();
  // A design file as the tool saves it: not JSON at all.
  writeFileSync(
    path.join(dir, "design/outside/system.bin"),
    Buffer.from([0x00, 0x9f, 0x92, 0x96, 0xff, 1, 2, 3]),
  );
  put(dir, "design/outside/tokens.json", pretty({ color: { primary: { $value: "#3366cc" } } }));
  put(dir, "design/sources/loose.json", EXPORT);
  const away = empty();
  put(away, "variables.json", EXPORT);
  const before = snapshot(dir);
  for (const [args, said] of [
    [
      ["--file", "design/outside/system.bin"],
      /design\/outside\/system\.bin is not JSON: what is kept is the JSON of the variables, and a design file itself is never pinned/,
    ],
    [
      ["--file", "design/outside/tokens.json"],
      /design\/outside\/tokens\.json is not an export of variables: it lists no variables by collection/,
    ],
    [
      ["--file", path.join(away, "variables.json")],
      /is not a file of the repository: put the export in the repository first, outside design\/sources/,
    ],
    [
      ["--file", "design/sources/loose.json"],
      /design\/sources\/loose\.json is in the folder of the ledger's own rows, where it would be read as a row: keep the export in another folder/,
    ],
    [
      ["--file", KEPT, "--plug", "no-such-plug"],
      /--plug no-such-plug names no plug file of the plugin/,
    ],
    [["--file", KEPT, "--on", "2026-13-40"], /--on takes a day written YYYY-MM-DD/],
    [[], /--file names the export of variables/],
    [["--file", KEPT, "--check"], /give --file, --again or --check, one of them/],
  ]) {
    const refused = source(dir, ...args);
    assert.equal(refused.status, 2, `${args.join(" ")}: ${refused.stdout}${refused.stderr}`);
    assert.match(refused.stderr, said);
    assert.equal(refused.reached, "");
  }
  assert.deepEqual(snapshot(dir), before);
});

test("criterion 13: a row that is there is never written over, and a tool copy that predates the kind is brought up first", () => {
  const dir = keeping();
  assert.equal(source(dir, "--file", KEPT, "--on", ON).status, 0);
  const twice = source(dir, "--file", KEPT, "--on", LATER);
  assert.equal(twice.status, 2);
  assert.match(
    twice.stderr,
    /design\/sources\/variables\.json is already there: a row is never written over\. Pin its file again with --again --id variables, or give another --id/,
  );
  assert.equal(json(dir, ROW).pin.fetched_at, ON);
  // A repository whose copy of the tool does not know the kind: its gate would read the row as a
  // library with no catalog.
  const old = keeping();
  put(
    old,
    "tools/design-assembly/sources-ledger.mjs",
    "export const SOURCES_FOLDER = 'design/sources';\n",
  );
  const early = source(old, "--file", KEPT);
  assert.equal(early.status, 2);
  assert.match(early.stderr, /predates the kind variables/);
  assert.match(early.stderr, /upgrade first/);
  assert.equal(existsSync(path.join(old, ROW)), false);
});

// ---- review: what the first reading of this change found ---------------------------------------

test("review: a row whose pin names a file by a path that leads out, from the machine's root, in the ledger's own folder, or twice, is red in the shapes of the ledgers", () => {
  const withFile = (...files) => ({
    ...rowOf(),
    pin: { fetched_at: ON, files: files.map((file) => ({ file, sha256: sha(EXPORT) })) },
  });
  for (const [row, said] of [
    [
      withFile("/etc/variables.json"),
      /pin names \/etc\/variables\.json, which is no path from the repository's root/,
    ],
    [
      withFile("../variables.json"),
      /pin names \.\.\/variables\.json, which is no path from the repository's root/,
    ],
    [
      withFile("design/outside/../../../variables.json"),
      /which is no path from the repository's root/,
    ],
    [
      withFile("design/sources/loose.json"),
      /pin names design\/sources\/loose\.json, a file in the folder of the ledger's own rows/,
    ],
    [withFile(KEPT, KEPT), /names design\/outside\/variables\.json twice/],
  ]) {
    const problems = shapeProblems("sources", pretty(row), ROW);
    assert.ok(
      problems.some((line) => said.test(line)),
      `${said}: ${problems.join("; ")}`,
    );
  }
  // A file in a folder under the ledger's is no row, and may be pinned.
  assert.deepEqual(
    shapeProblems("sources", pretty(withFile("design/sources/kept/v.json")), ROW),
    [],
  );
});

test("review: --check does not say nothing is kept beside a file of the ledger it cannot read", () => {
  const dir = empty();
  put(dir, "design/sources/torn.json", '{"version":1,"kind":"variab');
  const checked = source(dir, "--check");
  assert.equal(checked.status, 1, checked.stdout + checked.stderr);
  assert.match(
    checked.stdout,
    /design\/sources\/torn\.json is not valid JSON, so whether it pins an export of variables is not known/,
  );
  assert.doesNotMatch(checked.stdout, /no export of variables is kept here/);
  const data = JSON.parse(source(dir, "--check", "--json").stdout);
  assert.equal(data.differs.length, 1);
});

test("review: a path written otherwise than the repository holds it is refused, so the ledger's own folder is not reached under another spelling", () => {
  const dir = keeping();
  put(dir, "design/sources/loose.json", EXPORT);
  const before = snapshot(dir);
  // Where letters' case does not tell two names apart this reaches the file, and is refused for
  // its spelling; where it does, there is no such file. Nothing is written either way.
  for (const file of ["design/Sources/loose.json", "Design/Outside/variables.json"]) {
    const refused = source(dir, "--file", file);
    assert.equal(refused.status, 2, refused.stdout + refused.stderr);
    assert.ok(refused.stderr.includes(file), refused.stderr);
  }
  assert.deepEqual(snapshot(dir), before);
});

test("review: --again changes the pin alone, and says which row when it has nothing to pin", () => {
  const dir = keeping();
  assert.equal(source(dir, "--file", KEPT, "--on", ON).status, 0);
  const before = text(dir, ROW);
  for (const [args, said] of [
    [
      ["--again", "--id", "variables", "--plug", "any"],
      /--again changes the pin alone: --plug is written into the row by hand/,
    ],
    [
      ["--again", "--id", "variables", "--title", "A name"],
      /--again changes the pin alone: --title is written into the row by hand/,
    ],
    [["--again"], /--again takes --id, the row whose file is pinned again/],
  ]) {
    const refused = source(dir, ...args);
    assert.equal(refused.status, 2, args.join(" "));
    assert.match(refused.stderr, said);
  }
  // The pinned file is gone: nothing to pin, and the row stays.
  rmSync(path.join(dir, KEPT));
  const gone = source(dir, "--again", "--id", "variables");
  assert.equal(gone.status, 2);
  assert.match(gone.stderr, /design\/outside\/variables\.json is not a file of the repository/);
  // A row whose pin names no file.
  put(
    dir,
    "design/sources/hollow.json",
    pretty({ ...rowOf({ id: "hollow" }), pin: { fetched_at: ON, files: [{}] } }),
  );
  const hollow = source(dir, "--again", "--id", "hollow");
  assert.equal(hollow.status, 2);
  assert.match(
    hollow.stderr,
    /design\/sources\/hollow\.json names no file in its pin: there is nothing to pin again/,
  );
  assert.equal(text(dir, ROW), before);
});

// ---- the skill leads a person to it -------------------------------------------------------------

test("criterion 13: the bring-in skill says how the export is kept, how a change is seen, and that the design file is never the file kept", () => {
  const skill = text(PLUGIN, "skills/bring-in/SKILL.md").replace(/\s+/g, " ");
  assert.match(skill, /scripts\/variables-source\.mjs --target <repo> --file <path> --plug <id>/);
  assert.match(skill, /scripts\/variables-source\.mjs --target <repo> --check/);
  assert.match(skill, /--again --id <id>/);
  assert.match(skill, /never the design file it was read from/);
  assert.match(skill, /it enters the repository only when the user puts it there/);
});
