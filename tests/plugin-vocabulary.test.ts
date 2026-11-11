import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

type Term = {
  term?: unknown;
  meaning?: unknown;
  source?: unknown;
  trust?: unknown;
  avoid?: unknown;
};
type Vocabulary = { trust: Record<string, string>; terms: Term[] };

const PLUGIN = path.join(process.cwd(), "plugins/design-assembly");
const FILE = path.join(PLUGIN, "references/vocabulary.json");
const vocabulary = JSON.parse(readFileSync(FILE, "utf8")) as Vocabulary;

const filled = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

// One line per problem in the list itself.
function listProblems(v: Vocabulary): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const entry of v.terms) {
    const name = filled(entry.term) ? entry.term : "(no term)";
    if (!filled(entry.term)) found.push("a row has no term");
    if (!filled(entry.meaning)) found.push(`${name}: no meaning`);
    if (!filled(entry.source)) found.push(`${name}: no source`);
    if (!filled(entry.trust) || !(entry.trust in v.trust))
      found.push(`${name}: trust must be one of ${Object.keys(v.trust).join(", ")}`);
    const key = name.toLowerCase();
    if (seen.has(key)) found.push(`${name}: listed twice`);
    seen.add(key);
  }
  return found;
}

// Words the list says to avoid that appear in a text, each with the term to use instead.
function avoided(text: string, v: Vocabulary): string[] {
  const found: string[] = [];
  for (const entry of v.terms) {
    const words = Array.isArray(entry.avoid) ? entry.avoid.filter(filled) : [];
    for (const word of words) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`, "i").test(text))
        found.push(`"${word}": use "${String(entry.term)}"`);
    }
  }
  return found;
}

function textFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return textFiles(full);
    return full !== FILE && /\.(md|json|toml|txt)$/.test(name) ? [full] : [];
  });
}

const withTerm = (change: Term): Vocabulary => ({
  ...vocabulary,
  terms: [...vocabulary.terms, { ...vocabulary.terms[0], term: "extra", ...change }],
});

test("every term has a meaning, a source and a trust level, and is listed once", () => {
  expect(vocabulary.terms.length).toBeGreaterThan(0);
  expect(listProblems(vocabulary)).toEqual([]);
});

test.each([
  [{ source: "" }, "extra: no source"],
  [{ meaning: " " }, "extra: no meaning"],
  [{ trust: "probably" }, "extra: trust must be one of"],
  [{ term: String(vocabulary.terms[0]?.term).toUpperCase() }, "listed twice"],
])("a term changed to %o is reported", (change, message) => {
  expect(listProblems(withTerm(change)).join("\n")).toContain(message);
});

test("plugin text uses the listed terms, not the words to avoid", () => {
  const files = textFiles(PLUGIN);
  expect(files.length).toBeGreaterThan(0);
  const found = files.flatMap((file) =>
    avoided(readFileSync(file, "utf8"), vocabulary).map(
      (line) => `${path.relative(PLUGIN, file)}: ${line}`,
    ),
  );
  expect(found).toEqual([]);
});

test("a text that uses a word to avoid is reported with the term to use", () => {
  const sample = vocabulary.terms.find((t) => Array.isArray(t.avoid) && t.avoid.length > 0);
  expect(sample).toBeDefined();
  const word = String((sample?.avoid as string[])[0]);
  expect(avoided(`Pick the ${word} first.`, vocabulary)).toEqual([
    `"${word}": use "${String(sample?.term)}"`,
  ]);
  expect(avoided("Pick the theme first.", vocabulary)).toEqual([]);
});
