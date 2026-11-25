// Item 7.4, part one: a repository that keeps no Makefile reaches the gate (decision 0023, point 6,
// and decision 0120). Adopting lays the tool as anywhere else, declares one check command as a
// script of the package, never writes a Makefile or a make step there, never writes over a script
// the repository already has, and says every file it would touch before it touches one. The rows it
// writes name a check that is found and run; status counts them held. A repository with a Makefile
// is wired as it always was. Every repository is a synthetic fixture in a throwaway folder.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import {
  cleanup,
  empty,
  gate,
  git,
  json,
  listIn,
  noMakefile,
  put,
  run,
  snapshot,
  text,
} from "./helpers/core-family.mjs";
import { KINDS, readRecord } from "./helpers/four-kinds.mjs";
import { gateHost, withCheckScript } from "../templates/tools/design-assembly/host-make.mjs";

after(cleanup);

const ANSWERS = [
  "--conformance-level",
  "AA",
  "--product-type",
  "application",
  "--record",
  "source-color",
];
// A package file written with tabs, a script of its own and a list on one line, as a repository
// keeps one: adopting adds a line and leaves the rest as it is.
const PACKAGE =
  '{\n\t"name": "member-app",\n\t"private": true,\n\t"scripts": {\n\t\t"dev": "serve ."\n\t},\n\t"files": ["dist"]\n}\n';

function package_(scripts = null) {
  const dir = noMakefile();
  put(dir, "package.json", scripts ? PACKAGE.replace('"dev": "serve ."', scripts) : PACKAGE);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "first");
  return dir;
}
const adopt = (dir, ...more) => run("adopt.mjs", ["--target", dir, ...ANSWERS, ...more], listIn());

test("with no Makefile, the dry run names every file it would touch, the package file among them, and writes none", () => {
  const dir = package_();
  const before = snapshot(dir);
  const preview = adopt(dir, "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /^ {2}update {4}package\.json$/m);
  assert.match(preview.stdout, /^ {2}create {4}tools\/design-assembly\/check\.mjs$/m);
  assert.doesNotMatch(preview.stdout, /mk\/design-assembly\.mk|Makefile does not include/);
  assert.match(preview.stdout, /checks-in-gate: the package script design:check runs this tool/);
  assert.match(
    preview.stdout,
    /^gate: the package script design:check of package\.json runs this plugin's check/m,
  );
  assert.match(preview.stdout, /preview only: nothing was written/);
  assert.deepEqual(snapshot(dir), before);
});

test("adopting writes the script and no make file, the gate runs green, and status counts the rows held", () => {
  const dir = package_();
  const done = adopt(dir);
  assert.equal(done.status, 0, done.stderr);
  // The script is the first line of the scripts, in the file's own indent; the rest is as it was.
  assert.equal(
    text(dir, "package.json"),
    PACKAGE.replace(
      '\t\t"dev"',
      '\t\t"design:check": "node tools/design-assembly/check.mjs",\n\t\t"dev"',
    ),
  );
  assert.equal(existsSync(path.join(dir, "Makefile")), false);
  assert.equal(existsSync(path.join(dir, "mk")), false);
  const ledger = text(dir, "design/decisions.yaml");
  assert.match(
    ledger,
    /id: checks-in-gate\n {4}layer: \w+\n {4}kind: standard\n {4}source: "the package script design:check"/,
  );
  const theme = JSON.parse(text(dir, "design/theme.json"));
  assert.deepEqual(theme.checks["checks-in-gate"], [{ kind: "gate", script: "design:check" }]);

  const green = gate(dir);
  assert.equal(green.status, 0, green.stdout + green.stderr);

  const status = run("status.mjs", ["--target", dir, "--json"], listIn());
  const said = JSON.parse(status.stdout);
  assert.equal(said.missing, null);
  const plain = run("status.mjs", ["--target", dir], listIn()).stdout;
  const [, found, total] = /(\d+) of (\d+) row\(s\) name a check that can be found; 0 failing/.exec(
    plain,
  );
  // Every row that names a check names one that is found: the judgments name none.
  const judged = (ledger.match(/kind: judgment/g) ?? []).length;
  assert.equal(Number(found), Number(total) - judged);
  assert.doesNotMatch(plain, /Makefile/);
});

test("the gate's own check fails when the script can no longer fail", () => {
  const dir = package_();
  assert.equal(adopt(dir).status, 0);
  put(
    dir,
    "package.json",
    text(dir, "package.json").replace(
      '"node tools/design-assembly/check.mjs"',
      '"node tools/design-assembly/check.mjs || true"',
    ),
  );
  const red = gate(dir);
  assert.equal(red.status, 1, red.stdout);
  assert.match(
    red.stdout + red.stderr,
    /checks-in-gate.*design:check of package\.json does not run the check alone/s,
  );
});

test("a script of the repository's own under the name is kept, and the gate takes the next name, said", () => {
  const dir = package_('"design:check": "stylelint src"');
  const done = adopt(dir);
  assert.equal(done.status, 0, done.stderr);
  const scripts = JSON.parse(text(dir, "package.json")).scripts;
  assert.equal(scripts["design:check"], "stylelint src");
  assert.equal(scripts["design-assembly:check"], "node tools/design-assembly/check.mjs");
  assert.match(
    done.stdout,
    /design:check is already a script of package\.json that runs something else, so it is left as it is and the gate is design-assembly:check/,
  );
  assert.equal(gate(dir).status, 0);

  // Both names taken: nothing is added to the gate, and the person is told why.
  const both = package_('"design:check": "stylelint src",\n\t\t"design-assembly:check": "true"');
  const refused = adopt(both, "--dry-run");
  assert.match(
    refused.stdout,
    /already has scripts named design:check and design-assembly:check that run something else/,
  );
  assert.doesNotMatch(refused.stdout, /update {4}package\.json/);
});

test("upgrading a repository whose gate is a script writes no make step", () => {
  const dir = package_();
  assert.equal(adopt(dir).status, 0);
  put(dir, "tools/design-assembly/check.mjs", `${text(dir, "tools/design-assembly/check.mjs")}\n`);
  const preview = run("upgrade.mjs", ["--target", dir, "--dry-run"], listIn());
  assert.equal(preview.status, 0, preview.stderr);
  assert.doesNotMatch(preview.stdout, /mk\/design-assembly\.mk/);
  assert.match(preview.stdout, /gate after upgrading: green/);
});

test("the acceptance kit is told the command: written where its file is in the folder adopted, said where it is above", () => {
  const kit =
    'schema_version: 1\nexecutors:\n  test:\n    api: "npm test"\n  script:\n    cli: "node cli.mjs"\nrisk_tiers:\n  t1_skip_globs: []\n';
  const dir = package_();
  put(dir, "_acceptance/config.yaml", kit);
  const done = adopt(dir);
  assert.equal(done.status, 0, done.stderr);
  assert.equal(
    text(dir, "_acceptance/config.yaml"),
    kit.replace(
      "  script:\n",
      '  script:\n    design_assembly: "node tools/design-assembly/check.mjs"\n',
    ),
  );
  assert.match(
    done.stdout,
    /declared to the acceptance kit: _acceptance\/config\.yaml, executors\.script\.design_assembly/,
  );

  // A package of a workspace whose kit sits at the workspace's root: the line is said, not written.
  const root = path.join(empty(), "workspace");
  put(root, "_acceptance/config.yaml", kit);
  put(root, "package.json", json({ name: "workspace", private: true, workspaces: ["apps/*"] }));
  const member = path.join(root, "apps/web");
  put(member, "package.json", PACKAGE);
  put(member, "src/index.css", text(noMakefile(), "src/index.css"));
  git(root, "init", "-q", "-b", "main");
  const inner = adopt(member);
  assert.equal(inner.status, 0, inner.stderr);
  assert.equal(text(root, "_acceptance/config.yaml"), kit);
  assert.match(
    inner.stdout,
    /under executors\.script of \.\.\/\.\.\/_acceptance\/config\.yaml, add design_assembly: "cd apps\/web && node tools\/design-assembly\/check\.mjs"/,
  );
});

test("a repository with a Makefile is wired exactly as before: the same files, byte for byte", () => {
  const record = readRecord();
  const dir = KINDS.adopted();
  // The stamp names the plugin's version and the tree of its tool, which move with every version.
  const files = snapshot(dir).filter(
    (line) => !line.startsWith("tools/") && !line.startsWith("design/tool-stamp.json"),
  );
  const before = record.adopted_files.filter((line) => !line.startsWith("design/tool-stamp.json"));
  assert.deepEqual(files, before);
  assert.equal(
    JSON.parse(text(dir, "design/theme.json")).checks["checks-in-gate"][0].script,
    undefined,
  );
});

test("a package file is kept as it is written: no scripts, empty scripts, CRLF, a script that is no text", () => {
  const crlf = '{\r\n  "name": "a",\r\n  "files": ["a", "b"],\r\n  "scripts": {}\r\n}\r\n';
  assert.equal(
    withCheckScript(crlf, "design:check"),
    '{\r\n  "name": "a",\r\n  "files": ["a", "b"],\r\n  "scripts": {\r\n    "design:check": "node tools/design-assembly/check.mjs"\r\n  }\r\n}\r\n',
  );
  const none = '{\n\t"name": "a",\n\t"files": ["a", "b"]\n}\n';
  assert.equal(
    withCheckScript(none, "design:check"),
    '{\n\t"name": "a",\n\t"files": ["a", "b"],\n\t"scripts": {\n\t\t"design:check": "node tools/design-assembly/check.mjs"\n\t}\n}\n',
  );
  // A script of the repository's that is not text is the repository's: kept, never read as ours.
  const dir = path.join(empty(), "odd");
  put(dir, "package.json", json({ name: "odd", scripts: { "design:check": 5 } }));
  assert.deepEqual(gateHost(dir), {
    kind: "script",
    name: "design-assembly:check",
    have: false,
    taken: ["design:check"],
  });
});
