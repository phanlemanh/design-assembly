import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

type Json = Record<string, unknown>;
type Entry = { name?: unknown; source?: unknown; version?: unknown };

const ROOT = process.cwd();
const MARKETPLACE = ".claude-plugin/marketplace.json";
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

function readJson(file: string): Json | null {
  const full = path.join(ROOT, file);
  return existsSync(full) ? (JSON.parse(readFileSync(full, "utf8")) as Json) : null;
}

// One line per problem. `load` reads a plugin manifest, or returns null when it is missing.
function problems(marketplace: Json, load: (file: string) => Json | null): string[] {
  const found: string[] = [];
  if (typeof marketplace.name !== "string" || !KEBAB.test(marketplace.name))
    found.push("marketplace name must be kebab-case");
  const entries = Array.isArray(marketplace.plugins) ? (marketplace.plugins as Entry[]) : [];
  if (entries.length === 0) found.push("marketplace lists no plugin");
  for (const entry of entries) {
    const name = String(entry.name);
    if (typeof entry.name !== "string" || !KEBAB.test(entry.name))
      found.push(`${name}: plugin name must be kebab-case`);
    if (typeof entry.source !== "string" || !entry.source.startsWith("./")) {
      found.push(`${name}: source must be a path starting with ./`);
      continue;
    }
    const manifest = load(path.join(entry.source, ".claude-plugin/plugin.json"));
    if (manifest === null) {
      found.push(`${name}: no plugin.json under ${entry.source}`);
      continue;
    }
    if (manifest.name !== entry.name) found.push(`${name}: plugin.json has another name`);
    if (typeof manifest.version !== "string" || !SEMVER.test(manifest.version))
      found.push(`${name}: version must look like 1.2.3`);
    if (manifest.version !== entry.version)
      found.push(`${name}: version differs between marketplace and plugin.json`);
  }
  return found;
}

const real = readJson(MARKETPLACE);

// The same marketplace with its first entry changed, so each rule is seen failing.
function withEntry(change: Entry): Json {
  const entries = (real?.plugins ?? []) as Entry[];
  return { ...real, plugins: [{ ...entries[0], ...change }, ...entries.slice(1)] };
}

test("the marketplace and every plugin it lists are consistent", () => {
  expect(real).not.toBeNull();
  expect(problems(real as Json, readJson)).toEqual([]);
});

test.each([
  [{ version: "9.9.9" }, "version differs between marketplace and plugin.json"],
  [{ source: "./plugins/missing" }, "no plugin.json under ./plugins/missing"],
  [{ source: "plugins/design-assembly" }, "source must be a path starting with ./"],
  [{ name: "Design Assembly" }, "plugin name must be kebab-case"],
])("a marketplace entry changed to %o is reported", (change, message) => {
  const found = problems(withEntry(change), readJson);
  expect(found.join("\n")).toContain(message);
});

test("a plugin.json with a bad version or another name is reported", () => {
  const load = (): Json => ({ name: "something-else", version: "1.0" });
  const found = problems(real as Json, load).join("\n");
  expect(found).toContain("plugin.json has another name");
  expect(found).toContain("version must look like 1.2.3");
});
