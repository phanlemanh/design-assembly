// What this branch wrote, for the screen brief: the ground the sheet stands on to tell what the
// repository had settled from what a builder wrote a minute ago. The sheet reads the working
// tree; here the same files are read as they were where this branch left the main one, the base
// the gate's own checks compare with, and the two are set side by side: what the data model
// gained, lost or changed, whether a screen's row was there, which of its keys changed, and which
// files differ. Nothing is fetched and nothing is written. Outside git, with no commit, or with
// no main branch git knows, nothing is compared, and the sheet says so instead of failing.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { env } from "node:process";

import { branchBase } from "../templates/tools/design-assembly/owner-calls.mjs";
import { MODEL, modelOfFiles } from "../templates/tools/design-assembly/screen-actions.mjs";
import {
  fragmentsFolder,
  ledgerOfFiles,
  readScreenLedger,
  SCREEN_LEDGER,
} from "../templates/tools/design-assembly/screen-ledger.mjs";

const THEME = "design/theme.json";
// Why nothing was compared, in the sheet's own words.
const NOT_GIT = "this folder is not a git repository";
const NO_COMMIT = "the repository has no commit yet";
const ON_MAIN = (main) =>
  `nothing is committed past ${main} here: only what is not committed yet is compared`;

// Git as the sheet runs it: it never waits on a prompt, and never goes to a remote for an object
// a partial clone left out. What it cannot read here is then said, not fetched.
const QUIET = { ...env, GIT_TERMINAL_PROMPT: "0", GIT_NO_LAZY_FETCH: "1" };

const uncompared = (why) => ({ compared: false, main: null, on_main: false, why });

// The main branch the tool data names, where the repository's has another name; null otherwise.
function namedMain(target) {
  const file = path.join(target, THEME);
  if (!existsSync(file)) return null;
  try {
    const checks = JSON.parse(readFileSync(file, "utf8"))?.checks;
    const found = Object.values(checks && typeof checks === "object" ? checks : {})
      .flat()
      .find((check) => typeof check?.main === "string" && check.main !== "");
    return found?.main ?? null;
  } catch {
    return null;
  }
}

// The files of a commit under some paths, each with its text, in one call of git for the list and
// one for the texts. Paths are named from the target. Throws where git cannot say.
function filesAt(target, base, paths) {
  const git = (args, more = {}) =>
    spawnSync("git", ["-C", target, ...args], { maxBuffer: 1 << 30, env: QUIET, ...more });
  const listed = git(["ls-tree", "-r", "-z", base, "--", ...paths], { encoding: "utf8" });
  if (listed.status !== 0) throw new Error(String(listed.stderr).trim().split("\n")[0]);
  const blobs = listed.stdout
    .split("\0")
    .filter(Boolean)
    .map((line) => {
      const [meta, name] = [line.slice(0, line.indexOf("\t")), line.slice(line.indexOf("\t") + 1)];
      const [, kind, id] = meta.split(" ");
      return { kind, id, name };
    })
    .filter((entry) => entry.kind === "blob");
  if (blobs.length === 0) return {};
  const batch = git(["cat-file", "--batch"], { input: blobs.map((blob) => blob.id).join("\n") });
  if (batch.status !== 0) throw new Error(String(batch.stderr).trim().split("\n")[0]);
  const files = {};
  let at = 0;
  for (const blob of blobs) {
    const end = batch.stdout.indexOf(0x0a, at);
    const [, kind, length] = batch.stdout.subarray(at, end).toString("utf8").split(" ");
    // An object this checkout does not hold is said by git as missing: nothing is read past it.
    if (kind !== "blob") throw new Error(`${blob.name} at ${base} is not in this checkout`);
    const size = Number(length);
    files[blob.name] = batch.stdout.subarray(end + 1, end + 1 + size).toString("utf8");
    at = end + 1 + size + 1;
  }
  return files;
}

// The files that differ from the base, with what is not committed and what git does not know yet,
// named from the target.
function changedSince(target, base) {
  const list = (...args) => {
    const run = spawnSync("git", ["-C", target, ...args], {
      encoding: "utf8",
      maxBuffer: 1 << 30,
      env: QUIET,
    });
    if (run.status !== 0) throw new Error(String(run.stderr).trim().split("\n")[0]);
    return run.stdout.split("\0").filter(Boolean);
  };
  return new Set([
    ...list("diff", "--name-only", "--no-renames", "--relative", "-z", base, "--"),
    ...list("ls-files", "--others", "--exclude-standard", "-z"),
  ]);
}

// A value with the keys of each of its objects in one order: two ways of writing the same thing
// are then the same text.
const ordered = (value) => {
  if (Array.isArray(value)) return value.map(ordered);
  if (value === null || typeof value !== "object") return value ?? null;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, ordered(value[key])]),
  );
};
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const fieldsOf = (entity) =>
  entity?.properties && typeof entity.properties === "object" ? entity.properties : {};
const VERBS = { added: "adds", changed: "changes", removed: "removes" };

// What the data model has now that it did not have before, lost, or has otherwise: its actions by
// name, its entities by name, and the fields of an entity both have, in that order. Each with the
// entity it belongs to, and with a few words of what it is.
export function modelWritten(before, now) {
  const found = [];
  const note = (what, name, change, entity, shape) =>
    found.push({
      what,
      name,
      change,
      entity,
      says: `${VERBS[change]} the ${what} ${name}${shape ? ` (${shape})` : ""}`,
    });
  const actionsOf = (model) =>
    new Map(model.actions.filter((item) => item?.name).map((item) => [String(item.name), item]));
  const [was, is] = [actionsOf(before), actionsOf(now)];
  const shapeOf = (action) =>
    `${action.kind ?? "of no kind named"}${action.entity ? ` of ${action.entity}` : ""}`;
  for (const [name, action] of is) {
    const entity = action.entity ? String(action.entity) : null;
    if (!was.has(name)) note("action", name, "added", entity, shapeOf(action));
    else if (!same(was.get(name), action)) note("action", name, "changed", entity, shapeOf(action));
  }
  for (const [name, action] of was) {
    if (!is.has(name))
      note("action", name, "removed", action.entity ? String(action.entity) : null);
  }
  const names = (model) => Object.keys(model.entities).filter((name) => model.entities[name]);
  for (const name of names(now).filter((entity) => !names(before).includes(entity))) {
    note("entity", name, "added", name);
  }
  for (const name of names(before).filter((entity) => !names(now).includes(entity))) {
    note("entity", name, "removed", name);
  }
  for (const name of names(now).filter((entity) => names(before).includes(entity))) {
    const [old, fresh] = [fieldsOf(before.entities[name]), fieldsOf(now.entities[name])];
    const typeOf = (field) => String(field?.type ?? "of no type named");
    for (const [field, shape] of Object.entries(fresh)) {
      const at = `${name}.${field}`;
      if (!(field in old)) note("field", at, "added", name, typeOf(shape));
      else if (!same(old[field], shape)) note("field", at, "changed", name, typeOf(shape));
    }
    for (const field of Object.keys(old).filter((key) => !(key in fresh))) {
      note("field", `${name}.${field}`, "removed", name);
    }
  }
  return found;
}

// How one row of the ledger of screens stands against the same row at the base: new where the
// base has no such row, and else the keys whose value is not the one the base has.
export function rowWritten(before, now) {
  if (!before) return { new: true, changed: [] };
  const keys = [...new Set([...Object.keys(before), ...Object.keys(now)])];
  return { new: false, changed: keys.filter((key) => !same(before[key], now[key])) };
}

// What the sheet is given of the branch. Where something was compared: the name of the main
// branch, whether this is where it stands, the data model and the rows of the ledger of screens
// as the base has them, and the files that differ from it. Where nothing was: why, in words the
// sheet prints.
export function branchOf(target) {
  let found;
  try {
    found = branchBase(target, { main: namedMain(target), fetch: false });
  } catch (error) {
    return uncompared(`git could not say where this branch left the main one (${error.message})`);
  }
  if (found === null) return uncompared(NOT_GIT);
  if (found.unborn) return uncompared(NO_COMMIT);
  if (found.problem) return uncompared(found.problem);
  const { git, base, main } = found;
  try {
    const head = git("rev-parse", "HEAD").stdout.trim();
    const folder = fragmentsFolder(SCREEN_LEDGER);
    const files = filesAt(target, base, [`${MODEL}/`, SCREEN_LEDGER, `${folder}/`]);
    const under = (prefix) =>
      Object.fromEntries(
        Object.entries(files)
          .filter(([name]) => name.startsWith(prefix))
          .map(([name, text]) => [name.slice(prefix.length), text]),
      );
    const ledger = ledgerOfFiles(
      Object.fromEntries(Object.entries(files).filter(([name]) => !name.startsWith(`${MODEL}/`))),
    );
    return {
      compared: true,
      main,
      on_main: head === base,
      why: head === base ? ON_MAIN(main) : null,
      model: modelOfFiles(under(`${MODEL}/`)),
      screens: ledger === null ? [] : readScreenLedger(ledger).screens,
      changed: changedSince(target, base),
    };
  } catch (error) {
    return uncompared(`git could not read what ${main} has (${error.message})`);
  }
}
