// The plugin's version, held by the gate instead of by a rule in prose. A repository receives what
// is under the plugin's `templates/` and is run by its `scripts/`; whenever either changes, the
// version goes up. `references/releases.json` records, for each version, the git tree of those two
// folders and of the tool a repository copies. The gate fails when the folders are not the trees
// recorded for the version the plugin says it is, when the two manifests name different versions,
// and when a version that main has released is recorded again with other trees.
// Usage: node tools/plugin_version.mjs [--root DIR] [--base REF]                 check, for the gate
//        node tools/plugin_version.mjs [--root DIR] [--base REF] --bump X.Y.Z    record a version
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { treeHash } from "../plugins/design-assembly/scripts/stamp.mjs";
import { renderJson } from "../plugins/design-assembly/templates/tools/design-assembly/json.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const NAME = "design-assembly";
const PLUGIN = `plugins/${NAME}`;
export const FILES = {
  plugin: `${PLUGIN}/.claude-plugin/plugin.json`,
  marketplace: ".claude-plugin/marketplace.json",
  releases: `${PLUGIN}/references/releases.json`,
  // This repository's own copy of the tool, and its stamp: it adopts the plugin like any other.
  copy: "tools/design-assembly",
  stamp: "design/tool-stamp.json",
};
// What a repository receives, by the key a release records it under.
export const RECEIVED = {
  templates: `${PLUGIN}/templates`,
  scripts: `${PLUGIN}/scripts`,
  tool: `${PLUGIN}/templates/tools/design-assembly`,
};
const WIDTH = 100;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const BUMP = "make plugin-version VERSION=";

const readJson = (root, file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const parts = (version) => SEMVER.exec(version)?.slice(1).map(Number) ?? null;
// Below zero when `a` comes before `b`.
export function compare(a, b) {
  const [x, y] = [parts(a), parts(b)];
  for (let index = 0; index < 3; index += 1) {
    if (x[index] !== y[index]) return x[index] - y[index];
  }
  return 0;
}

// What the repository at `root` says and holds now.
export function readNow(root) {
  const marketplace = readJson(root, FILES.marketplace).plugins?.find((p) => p.name === NAME);
  return {
    plugin: readJson(root, FILES.plugin).version,
    marketplace: marketplace?.version ?? null,
    releases: readJson(root, FILES.releases).releases ?? [],
    trees: Object.fromEntries(
      Object.entries(RECEIVED).map(([key, folder]) => [key, treeHash(path.join(root, folder))]),
    ),
    copy: existsSync(path.join(root, FILES.copy)) ? treeHash(path.join(root, FILES.copy)) : null,
    stamp: existsSync(path.join(root, FILES.stamp)) ? readJson(root, FILES.stamp) : null,
  };
}

// The releases as `base` has them, or null when `base` cannot be seen from here. A base with no
// record yet has released nothing that can be compared.
export function releasedOn(root, base) {
  const git = (...args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  if (git("rev-parse", "--verify", "--quiet", base).status !== 0) return null;
  const shown = git("show", `${base}:${FILES.releases}`);
  if (shown.status !== 0) return [];
  return JSON.parse(shown.stdout).releases ?? [];
}

const same = (a, b) => Object.keys(RECEIVED).every((key) => a[key] === b[key]);

// Every way the version is out of step with what a repository receives, one line each.
export function versionProblems(now, released) {
  const found = [];
  if (!parts(now.plugin)) found.push(`${FILES.plugin} gives no version written x.y.z`);
  if (now.marketplace !== now.plugin) {
    found.push(
      `${FILES.marketplace} gives version ${now.marketplace}, ${FILES.plugin} gives ${now.plugin}: the two say the same`,
    );
  }
  now.releases.forEach((release, index) => {
    if (!parts(release.version)) found.push(`release ${index + 1} has no version written x.y.z`);
    const before = now.releases[index - 1];
    if (before && parts(before.version) && parts(release.version)) {
      if (compare(before.version, release.version) >= 0) {
        found.push(`${release.version} is recorded after ${before.version}: versions only go up`);
      }
    }
  });
  const last = now.releases.at(-1);
  if (!last) {
    found.push(`${FILES.releases} records no version: run ${BUMP}${now.plugin}`);
    return found;
  }
  if (last.version !== now.plugin) {
    found.push(
      `the last version ${FILES.releases} records is ${last.version}, the plugin says ${now.plugin}: run ${BUMP}${now.plugin}`,
    );
  }
  const isReleased = (version) => (released ?? []).some((item) => item.version === version);
  for (const item of released ?? []) {
    const here = now.releases.find((release) => release.version === item.version);
    if (!here) found.push(`${item.version} is released on main and no longer recorded here`);
    else if (!same(here, item)) {
      found.push(
        `${item.version} is released on main with other trees: a released version is never recorded again`,
      );
    }
  }
  const differs = Object.keys(RECEIVED).filter((key) => last[key] !== now.trees[key]);
  if (last.version === now.plugin && differs.length > 0) {
    const what = differs.map((key) => RECEIVED[key]).join(", ");
    found.push(
      isReleased(last.version)
        ? `${what} changed after version ${last.version} was released: a change reaches what a repository receives, so the version goes up (${BUMP}<next>)`
        : `${what} changed after version ${last.version} was recorded, and main has not released it: record it again (${BUMP}${last.version})`,
    );
  }
  // This repository keeps a copy of the tool, as any repository that adopted the plugin does.
  if (now.copy !== null && now.copy !== now.trees.tool) {
    found.push(
      `${FILES.copy} is not the plugin's tool: copy ${RECEIVED.tool} into it, file for file`,
    );
  }
  if (now.copy !== null) {
    const stamp = now.stamp;
    if (stamp?.version !== now.plugin || stamp?.tree !== now.trees.tool) {
      found.push(
        `${FILES.stamp} does not stamp version ${now.plugin} and the plugin's tool: run ${BUMP}${now.plugin}`,
      );
    }
  }
  return found;
}

// Why `version` cannot be recorded now, or null.
export function bumpProblem(now, released, version) {
  if (!parts(version)) return `the version is written x.y.z, not ${JSON.stringify(version)}`;
  const order = compare(version, now.plugin);
  if (order < 0) return `${version} comes before ${now.plugin}: versions only go up`;
  if (order === 0 && (released ?? []).some((item) => item.version === version)) {
    return `${version} is released on main: a released version is never recorded again; give the next one`;
  }
  return null;
}

// Writes `version` everywhere it is said, and records the trees of what a repository receives for
// it. A version not yet released is recorded again in place; a new one is added after the last.
export function bump(root, now, version) {
  const swap = (file) => {
    const text = readFileSync(path.join(root, file), "utf8");
    const next = text.replace(/("version":\s*)"[^"]*"/, `$1"${version}"`);
    writeFileSync(path.join(root, file), next);
  };
  swap(FILES.plugin);
  // The marketplace names a version once, for its one plugin.
  const market = readFileSync(path.join(root, FILES.marketplace), "utf8");
  const at = market.indexOf(`"name": "${NAME}"`, market.indexOf('"plugins"'));
  writeFileSync(
    path.join(root, FILES.marketplace),
    market.slice(0, at) + market.slice(at).replace(/("version":\s*)"[^"]*"/, `$1"${version}"`),
  );
  const record = { version, ...now.trees };
  const kept = now.releases.filter((release) => release.version !== version);
  const data = readJson(root, FILES.releases);
  data.releases = [...kept, record];
  writeFileSync(path.join(root, FILES.releases), renderJson(data, WIDTH));
  if (now.copy !== null) {
    mkdirSync(path.dirname(path.join(root, FILES.stamp)), { recursive: true });
    writeFileSync(
      path.join(root, FILES.stamp),
      `${JSON.stringify({ version, tree: now.trees.tool }, null, 2)}\n`,
    );
  }
  return record;
}

function main() {
  const args = argv.slice(2);
  const value = (flag, fallback) => {
    const at = args.indexOf(flag);
    return at === -1 ? fallback : args[at + 1];
  };
  const root = path.resolve(value("--root", ROOT));
  const base = value("--base", "origin/main");
  const released = releasedOn(root, base);
  const now = readNow(root);
  const version = value("--bump", null);
  if (args.includes("--bump")) {
    const problem = bumpProblem(now, released, version);
    if (problem) {
      stderr.write(`plugin version: ${problem}\n`);
      exit(1);
    }
    const record = bump(root, now, version);
    stdout.write(
      `plugin version: ${version}, templates ${record.templates.slice(0, 12)}, scripts ${record.scripts.slice(0, 12)}, tool ${record.tool.slice(0, 12)}\n`,
    );
    return;
  }
  const problems = versionProblems(now, released);
  if (problems.length > 0) {
    stderr.write(`plugin version: ${problems.length} problem(s)\n`);
    for (const line of problems) stderr.write(`  ${line}\n`);
    exit(1);
  }
  const seen = released === null ? `; ${base} cannot be seen here, so no release was compared` : "";
  stdout.write(
    `plugin version: ${now.plugin}, the templates and scripts are the trees recorded for it${seen}\n`,
  );
}

if (argv[1] && realpathSync(argv[1]) === SELF) main();
