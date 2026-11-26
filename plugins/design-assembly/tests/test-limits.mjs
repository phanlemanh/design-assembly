// The ledger of what this plugin is known not to hold. A limit written only in prose is lost the
// next time someone reads past it, so every one of them has a row here, and the row is checked.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const ledger = read("references/limits.json");

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REQUIRED = ["id", "area", "kind", "severity", "plan", "opened", "where", "status", "note"];
const SEVERITIES = ["high", "medium", "low"];
const STATUSES = ["open", "closed"];

// Every way a row can be wrong, as one line each. Empty means the ledger can be read and acted on.
export function limitProblems(data) {
  const found = [];
  const areas = Object.keys(data.areas ?? {});
  const kinds = Object.keys(data.kinds ?? {});
  const plans = Object.keys(data.plans ?? {});
  const seen = new Set();
  for (const [index, limit] of (data.limits ?? []).entries()) {
    const where = limit.id ?? `row ${index + 1}`;
    for (const field of REQUIRED) {
      if (limit[field] === undefined || limit[field] === "") found.push(`${where}: no ${field}`);
    }
    if (limit.id !== undefined && !ID.test(limit.id)) found.push(`${where}: id is not kebab-case`);
    if (seen.has(limit.id)) found.push(`${where}: a second row has this id`);
    seen.add(limit.id);
    const oneOf = (field, allowed) => {
      if (limit[field] !== undefined && !allowed.includes(limit[field])) {
        found.push(`${where}: ${field} must be one of ${allowed.join(", ")}`);
      }
    };
    oneOf("area", areas);
    oneOf("kind", kinds);
    oneOf("severity", SEVERITIES);
    oneOf("plan", plans);
    oneOf("status", STATUSES);
    if (limit.opened !== undefined && !DAY.test(limit.opened)) {
      found.push(`${where}: opened is not a date written YYYY-MM-DD`);
    }
    // A limit nobody can trace back to where it was admitted cannot be checked by a reader.
    if (limit.where !== undefined && !(Array.isArray(limit.where) && limit.where.length > 0)) {
      found.push(`${where}: where does not name a record that states it`);
    }
    // A closed row says what closed it, so a reader can check the claim; an open row must not
    // pretend to be closed.
    if (limit.status === "closed") {
      if (!DAY.test(limit.closed ?? "")) found.push(`${where}: closed, with no date it closed`);
      if (!limit.closed_by) found.push(`${where}: closed, with nothing named that closed it`);
    } else if (limit.closed || limit.closed_by) {
      found.push(`${where}: open, but carries what closed it`);
    }
    // A limit someone else must fix names whose repository it is, else nobody can act on it.
    if (limit.plan === "hand-off" && !limit.repo) found.push(`${where}: handed off to nobody`);
    if (limit.plan !== "hand-off" && limit.repo) found.push(`${where}: names a repo it is not for`);
    if (limit.note !== undefined && !/^[A-Z].*\.$/.test(limit.note)) {
      found.push(`${where}: the note is not one written sentence`);
    }
  }
  return found;
}

test("every row of the limits ledger can be read and acted on", () => {
  assert.ok(ledger.limits.length > 0, "the ledger is empty");
  assert.deepEqual(limitProblems(ledger), []);
});

test("a row that cannot be acted on is reported", () => {
  const broken = {
    ...ledger,
    limits: [
      { ...ledger.limits[0], id: "Not Kebab" },
      { ...ledger.limits[0], status: "closed", closed: undefined, closed_by: undefined },
      { ...ledger.limits[0], plan: "hand-off", repo: undefined },
      { ...ledger.limits[0], id: "no-note", note: "lower case, no stop" },
    ],
  };
  assert.deepEqual(limitProblems(broken), [
    "Not Kebab: id is not kebab-case",
    `${ledger.limits[0].id}: closed, with no date it closed`,
    `${ledger.limits[0].id}: closed, with nothing named that closed it`,
    `${ledger.limits[0].id}: a second row has this id`,
    `${ledger.limits[0].id}: handed off to nobody`,
    "no-note: the note is not one written sentence",
  ]);
});

test("the vocabulary of the ledger is declared, and every word of it is used", () => {
  for (const field of ["areas", "kinds", "plans"]) {
    const declared = Object.entries(ledger[field] ?? {});
    assert.ok(declared.length > 0, `${field} is not declared`);
    for (const [, meaning] of declared) assert.match(meaning, /^[A-Z].*\.$/, field);
    const used = new Set(ledger.limits.map((limit) => limit[field.slice(0, -1)]));
    const idle = declared.map(([word]) => word).filter((word) => !used.has(word));
    assert.deepEqual(idle, [], `${field} declares a word no row uses`);
  }
});
