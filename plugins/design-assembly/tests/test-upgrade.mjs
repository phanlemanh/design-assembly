// The tool stamp and upgrade, on throwaway repositories: every command that writes the tool stamps
// it; upgrade says before it writes which tool files change, which entries of the machine-written
// ledgers would be added, removed or changed, which decisions change state and whether the gate
// stays green; it writes exactly that, and stops without writing when an entry would be lost or the
// gate would turn red, unless the person said they accept it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { partsOf, PARTS } from "../scripts/document.mjs";
import { status } from "../scripts/status.mjs";
import { RELEASES, STAMP, TOOL_COPY, treeHash, VERSION } from "../scripts/stamp.mjs";
import { entriesOf, ledgerChanges } from "../scripts/upgrade.mjs";
import { withoutBlock } from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");
const UPGRADE = path.join(PLUGIN, "scripts/upgrade.mjs");
const INSTALLED = treeHash(path.join(PLUGIN, "templates", TOOL_COPY));
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const TOKENS = "design/tokens.json";
const REGISTRY = "design/component-registry.json";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const text = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const json = (dir, file) => JSON.parse(text(dir, file));
const empty = () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-upgrade-")));
  made.push(dir);
  return dir;
};
const run = (script, ...args) => spawnSync(execPath, [script, ...args], { encoding: "utf8" });
const upgrade = (dir, ...args) => run(UPGRADE, "--target", dir, ...args);

// The floor of this repository, with two of its real components so that the guide writes a
// component manifest.
function floor() {
  const dir = empty();
  put(dir, "src/index.css", withoutBlock(text(ROOT, "src/index.css")));
  put(dir, "Makefile", text(ROOT, "Makefile"));
  for (const file of ["src/components/ui/button.tsx", "src/components/ui/card.tsx"]) {
    put(dir, file, text(ROOT, file));
  }
  return dir;
}
const radius = (dir) =>
  put(
    dir,
    "src/index.css",
    text(dir, "src/index.css").replace(/--radius:\s*[^;]+;/g, "--radius: 3rem;"),
  );
let appliedOnce = null;
// The guide applied with every call a person's: a repository on the installed plugin's tool.
function applied() {
  if (!appliedOnce) {
    appliedOnce = floor();
    const choices = {
      context: { product_type: "application", conformance_level: "AA" },
      patterns: { record_panel: "beside" },
      foundations: {
        source_color: "#0246ff",
        type_scale: "standard",
        spacing_unit: "4px",
        corner_radius: "small",
      },
    };
    const layers = Object.fromEntries(
      LAYERS.map((layer) => [
        layer.id,
        layer.built
          ? { status: "decided", source: "user", choice: choices[layer.id], why: "For the test." }
          : { status: "planned" },
      ]),
    );
    put(
      appliedOnce,
      "design/blueprint.json",
      JSON.stringify({ version: 1, status: "approved", layers }),
    );
    const done = run(path.join(PLUGIN, "scripts/apply.mjs"), "--target", appliedOnce);
    assert.equal(done.status, 0, done.stderr);
  }
  const dir = empty();
  cpSync(appliedOnce, dir, { recursive: true });
  return dir;
}
// The same repository as if an older plugin had written its tool: one file of the copy is another,
// one is a file the installed tool no longer has, and the stamp names an older version.
function older() {
  const dir = applied();
  put(dir, `${TOOL_COPY}/scale.mjs`, `${text(dir, `${TOOL_COPY}/scale.mjs`)}// older\n`);
  put(dir, `${TOOL_COPY}/retired.mjs`, "export const retired = true;\n");
  put(
    dir,
    STAMP,
    `${JSON.stringify({ version: "0.0.1", tree: treeHash(path.join(dir, TOOL_COPY)) })}\n`,
  );
  return dir;
}
const withVariants = (dir) => json(dir, REGISTRY).components.find((c) => c.variants?.length > 1);
const firstToken = (dir) => {
  const [group, tokens] = Object.entries(json(dir, TOKENS))[0];
  return [group, Object.keys(tokens)[0]];
};

function snapshot(dir, at = "") {
  return readdirSync(path.join(dir, at))
    .sort()
    .flatMap((name) => {
      const relative = path.posix.join(at, name);
      const full = path.join(dir, relative);
      if (lstatSync(full).isDirectory()) return [`${relative}/`, ...snapshot(dir, relative)];
      return [`${relative} ${createHash("sha256").update(readFileSync(full)).digest("hex")}`];
    });
}
const changed = (before, afterwards) => {
  const was = new Set(before);
  return afterwards
    .filter((line) => !line.endsWith("/") && !was.has(line))
    .map((line) => line.slice(0, line.lastIndexOf(" ")))
    .sort();
};
const gone = (before, afterwards) => {
  const now = new Set(afterwards.map((line) => line.slice(0, line.lastIndexOf(" "))));
  return before
    .filter((line) => !line.endsWith("/"))
    .map((line) => line.slice(0, line.lastIndexOf(" ")))
    .filter((file) => !now.has(file));
};

test("every command that writes the tool writes the stamp: the version and the tree as written", () => {
  const dir = applied();
  assert.deepEqual(json(dir, STAMP), { version: VERSION, tree: INSTALLED });
  assert.equal(treeHash(path.join(dir, TOOL_COPY)), INSTALLED);

  // Adopting writes the tool when it adds a check, and the stamp with it.
  const adopted = floor();
  const done = run(
    path.join(PLUGIN, "scripts/adopt.mjs"),
    "--target",
    adopted,
    "--conformance-level",
    "AA",
  );
  assert.ok([0, 1].includes(done.status), done.stderr);
  assert.ok(existsSync(path.join(adopted, TOOL_COPY, "check.mjs")), done.stdout);
  assert.deepEqual(json(adopted, STAMP), { version: VERSION, tree: INSTALLED });

  // Upgrading writes it too: shown below, on an older stamp.
  const old = older();
  assert.equal(upgrade(old).status, 0);
  assert.deepEqual(json(old, STAMP), { version: VERSION, tree: INSTALLED });
});

test("status reads the stamp: the version the copy came from, and whether it was changed since", () => {
  const dir = applied();
  const stamped = status(dir).tool;
  assert.deepEqual(stamped.recorded, { version: VERSION, tree: INSTALLED });
  assert.equal(stamped.differs, false);
  assert.match(stamped.says, new RegExp(`installed plugin's, version ${VERSION}, as stamped`));

  // Changed after it was stamped: said, and upgrade is the next command.
  put(dir, `${TOOL_COPY}/scale.mjs`, `${text(dir, `${TOOL_COPY}/scale.mjs`)}\n`);
  const edited = status(dir);
  assert.equal(edited.tool.differs, true);
  assert.match(edited.tool.says, new RegExp(`changed after it was stamped as version ${VERSION}`));
  assert.ok(edited.next.some((step) => step.command === "/design-assembly:upgrade"));

  // An older stamp, the copy as stamped: the version it came from, and the one installed.
  const old = older();
  const behind = status(old);
  assert.match(behind.tool.says, /stamped as version 0\.0\.1; the installed plugin is version/);
  assert.match(
    behind.next.find((step) => step.command === "/design-assembly:upgrade").why,
    /0\.0\.1/,
  );
});

test("status without a stamp: a repository adopted before stamps still reads, and says so", () => {
  const dir = applied();
  rmSync(path.join(dir, STAMP));
  const tool = status(dir).tool;
  assert.equal(tool.recorded, null);
  assert.equal(tool.differs, false);
  assert.match(tool.says, /no stamp/);
  // A copy that is exactly the tool of a recorded release is named by its content.
  if (RELEASES.some((release) => release.tool === INSTALLED)) {
    assert.match(tool.says, new RegExp(`version ${VERSION}`));
  }
  put(dir, `${TOOL_COPY}/scale.mjs`, `${text(dir, `${TOOL_COPY}/scale.mjs`)}\n`);
  assert.match(status(dir).tool.says, /differs from the installed plugin's.*no stamp/);
});

test("upgrade on a repository already on the installed tool: exit 0, nothing written", () => {
  const dir = applied();
  const before = snapshot(dir);
  const result = upgrade(dir, "--json");
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.deepEqual(data.files, []);
  assert.deepEqual(data.tool_files, []);
  assert.deepEqual(data.ledgers, []);
  assert.deepEqual(data.from, {
    version: VERSION,
    tree: INSTALLED,
    stamp: { version: VERSION, tree: INSTALLED },
    edited: false,
  });
  assert.equal(data.to.version, VERSION);
  assert.equal(upgrade(dir).status, 0);
  assert.match(upgrade(dir).stdout, /already the installed plugin's tool/);
  assert.deepEqual(snapshot(dir), before);
});

test("upgrade from an older stamp: the preview lists the files and the changed ledger entries, and the real run writes exactly those", () => {
  const dir = older();
  // What an older tool left in two machine-written ledgers: a token with another value, and a
  // component without one of its variants.
  const [group, name] = firstToken(dir);
  const tokens = json(dir, TOKENS);
  tokens[group][name].$value = "#123456";
  put(dir, TOKENS, `${JSON.stringify(tokens, null, 2)}\n`);
  const component = withVariants(dir);
  const registry = json(dir, REGISTRY);
  const dropped = component.variants.at(-1);
  registry.components.find((c) => c.name === component.name).variants.pop();
  put(dir, REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
  // The repository's own tool and a person's ledger rows are there to be left alone.
  put(dir, "tools/own-tool.mjs", "export const own = true;\n");
  const before = snapshot(dir);

  const preview = upgrade(dir, "--dry-run", "--json");
  assert.equal(preview.status, 0, preview.stderr);
  const plan = JSON.parse(preview.stdout);
  assert.equal(plan.dry_run, true);
  assert.deepEqual(plan.from.version, "0.0.1");
  assert.deepEqual(plan.to, { version: VERSION, tree: INSTALLED });
  assert.deepEqual(plan.tool_files, [
    { path: `${TOOL_COPY}/retired.mjs`, change: "delete" },
    { path: `${TOOL_COPY}/scale.mjs`, change: "update" },
  ]);
  const byFile = Object.fromEntries(plan.ledgers.map((ledger) => [ledger.file, ledger]));
  assert.deepEqual(byFile[TOKENS].changed, [`${group}.${name}`]);
  assert.deepEqual(byFile[TOKENS].removed, []);
  assert.deepEqual(byFile[REGISTRY].added, [`components[${component.name}].variants[${dropped}]`]);
  assert.deepEqual(byFile[REGISTRY].removed, []);
  // Both were failing on the stale files, and are held once they are written again.
  const states = Object.fromEntries(plan.decisions.map((d) => [d.id, [d.from, d.to]]));
  assert.deepEqual(states["design-tokens"], ["FAILING", "held"]);
  assert.deepEqual(states["component-manifest"], ["FAILING", "held"]);
  assert.equal(plan.gate.green, true, JSON.stringify(plan.gate));
  assert.deepEqual(plan.blocked, []);
  assert.deepEqual(snapshot(dir), before, "the preview wrote something");
  // A person reads the same, in words.
  const shown = upgrade(dir, "--dry-run").stdout;
  for (const line of [
    /from: version 0\.0\.1/,
    /delete\s+tools\/design-assembly\/retired\.mjs/,
    new RegExp(`changed ${group}\\.${name}`),
    /design-tokens: FAILING -> held/,
    /gate after upgrading: green/,
    /preview only: nothing was written/,
  ]) {
    assert.match(shown, line);
  }

  const real = upgrade(dir, "--json");
  assert.equal(real.status, 0, real.stderr);
  const done = JSON.parse(real.stdout);
  const afterwards = snapshot(dir);
  const written = plan.files.filter((file) => file.change !== "delete").map((file) => file.path);
  assert.deepEqual(changed(before, afterwards), written.sort());
  assert.deepEqual(gone(before, afterwards), [`${TOOL_COPY}/retired.mjs`]);
  assert.deepEqual(done.files, plan.files);
  assert.ok(written.includes(STAMP) && written.includes(TOKENS) && written.includes(REGISTRY));
  // The copy is the installed tool, the stamp says so, and the repository's gate holds.
  assert.equal(treeHash(path.join(dir, TOOL_COPY)), INSTALLED);
  assert.deepEqual(json(dir, STAMP), { version: VERSION, tree: INSTALLED });
  const gate = run(path.join(dir, TOOL_COPY, "check.mjs"), "--target", dir);
  assert.equal(gate.status, 0, gate.stderr);
  // Run again, nothing is left to do.
  assert.deepEqual(JSON.parse(upgrade(dir, "--json").stdout).files, []);
});

test("a ledger row a person wrote, the stylesheet and the repository's own tools never change", () => {
  const dir = older();
  put(dir, "tools/own-tool.mjs", "export const own = true;\n");
  const kept = ["design/decisions.yaml", "src/index.css", "design/blueprint.json", "Makefile"];
  const before = Object.fromEntries(kept.map((file) => [file, text(dir, file)]));
  // Even with both acceptances given, and a stylesheet that turns the gate red.
  radius(dir);
  before["src/index.css"] = text(dir, "src/index.css");
  const result = upgrade(dir, "--accept-red-gate", "--accept-lost-entries", "--json");
  assert.equal(result.status, 0, result.stderr);
  for (const file of kept) assert.equal(text(dir, file), before[file], file);
  assert.equal(text(dir, "tools/own-tool.mjs"), "export const own = true;\n");
  for (const file of JSON.parse(result.stdout).files) {
    assert.ok(
      file.path.startsWith(`${TOOL_COPY}/`) ||
        [STAMP, TOKENS, REGISTRY, "design/columns.json"].includes(file.path),
      file.path,
    );
  }
});

test("an upgrade that would lose a ledger entry stops: exit 1, nothing written, until the person accepts it", () => {
  const dir = older();
  // An entry the installed tool would not write again: lost if the ledger is regenerated.
  const component = withVariants(dir);
  const registry = json(dir, REGISTRY);
  registry.components.find((c) => c.name === component.name).variants.push("tone=ghost");
  put(dir, REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
  const before = snapshot(dir);
  for (const mode of [["--dry-run"], []]) {
    const stopped = upgrade(dir, ...mode, "--json");
    assert.equal(stopped.status, 1, stopped.stderr);
    const data = JSON.parse(stopped.stdout);
    const ledger = data.ledgers.find((item) => item.file === REGISTRY);
    assert.deepEqual(ledger.removed, [`components[${component.name}].variants[tone=ghost]`]);
    assert.equal(data.blocked.length, 1);
    assert.equal(data.blocked[0].accept, "--accept-lost-entries");
    assert.deepEqual(data.files, []);
    assert.deepEqual(snapshot(dir), before, "something was written");
  }
  const shown = upgrade(dir);
  assert.equal(shown.status, 1);
  assert.match(shown.stdout, /stopped: .*would lose 1 entry .*--accept-lost-entries/);
  assert.match(shown.stdout, /nothing was written/);
  // The person accepts the loss: then, and only then, it is written.
  const accepted = upgrade(dir, "--accept-lost-entries", "--json");
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.deepEqual(JSON.parse(accepted.stdout).accepted, ["--accept-lost-entries"]);
  assert.ok(!text(dir, REGISTRY).includes("tone=ghost"));
});

test("a ledger the repository keeps out of git loses nothing: a clean checkout without it upgrades, and the file is written", () => {
  const dir = older();
  const asked = run(path.join(dir, TOOL_COPY, "components.mjs"), "--target", dir, "--out-of-git");
  assert.equal(asked.status, 0, asked.stderr);
  // A clean checkout: the derived file is not there.
  rmSync(path.join(dir, REGISTRY));
  const shown = upgrade(dir, "--dry-run", "--json");
  assert.equal(shown.status, 0, shown.stdout);
  const data = JSON.parse(shown.stdout);
  const ledger = data.ledgers.find((item) => item.file === REGISTRY);
  assert.deepEqual(ledger.removed, []);
  assert.equal(ledger.derived, true);
  assert.deepEqual(data.blocked, []);
  assert.match(upgrade(dir, "--dry-run").stdout, /kept out of git: nothing in it is a person's/);
  const done = upgrade(dir, "--json");
  assert.equal(done.status, 0, done.stdout);
  assert.ok(existsSync(path.join(dir, REGISTRY)), "the derived file was not written");
  assert.equal(treeHash(path.join(dir, TOOL_COPY)), INSTALLED);
});

test("an upgrade that would leave the gate red stops the same way, and says why", () => {
  const dir = older();
  radius(dir);
  const before = snapshot(dir);
  const stopped = upgrade(dir, "--json");
  assert.equal(stopped.status, 1);
  const data = JSON.parse(stopped.stdout);
  assert.equal(data.gate.green, false);
  assert.ok(
    data.gate.problems.some((line) => /^radius-value: /.test(line)),
    data.gate.problems,
  );
  assert.ok(data.blocked.some((item) => item.accept === "--accept-red-gate"));
  assert.deepEqual(snapshot(dir), before);
  assert.equal(upgrade(dir, "--accept-red-gate").status, 0);
  assert.equal(treeHash(path.join(dir, TOOL_COPY)), INSTALLED);
});

test("a wrong call, or a repository with no copy of the tool, ends with 2 and writes nothing", () => {
  const dir = older();
  const before = snapshot(dir);
  for (const args of [["--no-such-flag"], ["--accept-lost-entries", "x"], ["--remove"]]) {
    const called = upgrade(dir, ...args);
    assert.equal(called.status, 2, args.join(" "));
    assert.equal(called.stdout, "");
  }
  assert.deepEqual(snapshot(dir), before);
  const none = upgrade(floor(), "--json");
  assert.equal(none.status, 2);
  assert.match(none.stderr, /no copy of the tool.*adopt/);
  assert.equal(none.stdout, "");
});

test("the same call twice gives the same answer, to a person and to a machine", () => {
  const dir = older();
  for (const args of [["--dry-run"], ["--dry-run", "--json"]]) {
    const first = upgrade(dir, ...args);
    assert.equal(upgrade(dir, ...args).stdout, first.stdout);
    assert.ok(!first.stdout.includes(dir), "the answer carries where the repository sits");
  }
});

test("the release notes: the same facts on the frame every document shares, written only into --out", () => {
  const dir = older();
  const out = empty();
  const before = snapshot(dir);
  const result = upgrade(dir, "--dry-run", "--out", out, "--json");
  assert.equal(result.status, 0, result.stderr);
  const page = path.join(out, "release-notes.html");
  // The files the upgrade would write, then the one document it did write.
  const files = JSON.parse(result.stdout).files;
  assert.deepEqual(files.at(-1), { path: page, change: "create" });
  assert.ok(files.slice(0, -1).every((file) => !file.path.startsWith(out)));
  assert.deepEqual(
    partsOf(text(out, "release-notes.html")).map((part) => part.id),
    PARTS,
  );
  const html = text(out, "release-notes.html");
  assert.match(html, /Release notes/);
  assert.match(html, /0\.0\.1/);
  assert.match(html, /retired\.mjs/);
  assert.deepEqual(snapshot(dir), before);
  // The same facts give the same page.
  upgrade(dir, "--dry-run", "--out", out);
  assert.equal(text(out, "release-notes.html"), html);
});

test("ledger entries: a token is one entry, a list of names is one entry per name, a record by its name", () => {
  const entries = entriesOf({
    version: "2",
    color: { primary: { $type: "color", $value: "#000" } },
    components: [{ name: "Button", file: "a.tsx", variants: ["size=sm", "size=lg"] }],
  });
  assert.deepEqual([...entries.keys()].sort(), [
    "color.primary",
    "components[Button].file",
    "components[Button].variants[size=lg]",
    "components[Button].variants[size=sm]",
    "version",
  ]);
  const before = { components: [{ name: "A", parts: ["B", "C"] }], version: "2" };
  const afterwards = { components: [{ name: "A", parts: ["B"] }], version: "3" };
  assert.deepEqual(ledgerChanges(before, afterwards), {
    added: [],
    removed: ["components[A].parts[C]"],
    changed: ["version"],
  });
});

test("the reference repository: upgrade previews read-only, and its tree is unchanged", (t) => {
  const reference = env.DESIGN_ASSEMBLY_REFERENCE_LEDGER;
  if (!reference || !existsSync(path.join(reference, TOOL_COPY))) {
    return t.skip("no reference repository on this machine");
  }
  const git = (...args) => spawnSync("git", ["-C", reference, ...args], { encoding: "utf8" });
  const porcelain = git("status", "--porcelain").stdout;
  const head = git("rev-parse", "HEAD").stdout;
  const preview = upgrade(reference, "--dry-run", "--json");
  assert.ok([0, 1].includes(preview.status), preview.stderr);
  const data = JSON.parse(preview.stdout);
  assert.equal(data.to.version, VERSION);
  assert.ok(Array.isArray(data.tool_files) && Array.isArray(data.ledgers));
  assert.equal(git("status", "--porcelain").stdout, porcelain);
  assert.equal(git("rev-parse", "HEAD").stdout, head);
});
