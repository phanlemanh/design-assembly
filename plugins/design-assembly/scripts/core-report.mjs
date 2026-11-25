// The member's report (spec 0016, criterion 12, slice 2 of item 7.2): what a repository of a family
// tells the core about its own store. For each block it answered itself, the need's key, the name
// and what it is for, as its row of the intake ledger says, and nothing else: never code, a file's
// text, a path, a hash or a value. For each block it took in from the core, the core's need alone,
// under `uses`: the block is the core's, and the store's entry follows with `used_by` and
// `second_use`. The report is one file of the core folder named after the repository, and the same
// ledger always gives the same file: it carries no day and no person.
//
// Everything here reads; `writePlan` is the one place that writes, and only inside a core folder.
// The reports a member knows are those its copy of the core holds, byte for byte as they were
// pinned, so find and intake give one answer on every machine (decision 0117); a move that reaches
// the core folder reads the reports there. No model and no network are called.
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import {
  CORE,
  corePartShapeProblems,
  readPinnedCore,
} from "../templates/tools/design-assembly/contract.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import { CORE_SOURCE, declaresFamily } from "./core-blocks.mjs";
import { homeOf } from "./core-list.mjs";
import { STARTER_SOURCE } from "./starter-intake.mjs";
import { readIntake, readTheme, text } from "./store.mjs";

const WIDTH = 100;
const FOLDER = CORE.parts.members.folder;
const ENDING = CORE.parts.members.ending;
const INDEX = CORE.parts.blocks.file;
const RETIRED = CORE.parts.retired.file;
const NEED = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// The kinds of adapter every block of code needs: what a block not yet promoted is taken to need,
// its own adapters being a person's word at the promotion.
export const CODE_ADAPTERS = ["components", "source"];
// What a report holds, said wherever one is printed.
export const REPORT_HOLDS =
  "each block by its need, its name and what it is for; no code, no text of a file, no path and no value";
// Why a row of the intake ledger is left out of the report.
const LEFT = {
  starter: "a piece of the starter kit, which every repository has from the plugin",
  retired: "retired in this repository",
  undescribed:
    "its row does not say what the block is for (description): the family is told a need by its key, its name and that sentence",
  unkeyed: "its need is not a key of lower-case words and digits joined by dashes",
  own: "once the core's, which retired it: it is this repository's own now, and a need the core retired is not proposed again",
  elsewhere: "taken from a family core this repository does not declare",
  unsourced: "taken from the core, and its row does not say which block of the core (source)",
  twice: "a second row for a need an earlier row answers: one need, one block",
};

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
// Where the core keeps a repository's report.
export const reportFileOf = (repository) => path.posix.join(FOLDER, `${repository}${ENDING}`);
// Whether a core's declaration names a repository, as its first or as a member.
export const ofFamily = (declaration, repository) =>
  declaration?.first?.repository === repository ||
  (Array.isArray(declaration?.members) ? declaration.members : []).some(
    (member) => member?.repository === repository,
  );

// What a repository's intake ledger gives its report: the needs it answered itself, the needs of
// the core whose block it took in, and each row left out with why. A repository with no ledger has
// nothing to tell, and `why` says so.
export function reportOf(root) {
  const repository = path.basename(homeOf(root));
  const base = { repository, needs: [], uses: [], left_out: [], why: null };
  let intake;
  try {
    intake = readIntake(root, readTheme(root));
  } catch (error) {
    return { ...base, why: `the intake ledger cannot be read: ${error.message.split("\n")[0]}` };
  }
  if (intake.ledger === null) return { ...base, why: intake.why };
  // A ledger whose blocks are not a list is one that cannot be read: it tells nothing.
  if (intake.ledger.blocks !== undefined && !Array.isArray(intake.ledger.blocks)) {
    return { ...base, why: `${intake.kept}: its blocks are not a list` };
  }
  const member = declaresFamily(root);
  const needs = [];
  const uses = [];
  const left = [];
  for (const row of intake.blocks) {
    const need = text(row.need);
    const name = text(row.name) ?? need ?? "(unnamed)";
    const out = (why) => left.push({ need: need ?? null, name, why });
    const from = text(row.from);
    if (row.retired) out(LEFT.retired);
    else if (row.merged_into) out(`merged into ${text(row.merged_into)} in this repository`);
    else if (from === STARTER_SOURCE) out(LEFT.starter);
    else if (from === CORE_SOURCE && row.own) out(LEFT.own);
    else if (from === CORE_SOURCE && !member) out(LEFT.elsewhere);
    else if (from === CORE_SOURCE) {
      if (text(row.source)) uses.push(text(row.source));
      else out(LEFT.unsourced);
    } else if (!need || !NEED.test(need)) out(LEFT.unkeyed);
    else if (!text(row.description)?.trim()) out(LEFT.undescribed);
    else if (needs.some((one) => one.need === need)) out(LEFT.twice);
    else needs.push({ need, name, description: text(row.description).trim() });
  }
  return { ...base, needs, uses: [...new Set(uses)].sort(), left_out: left };
}

// The report of a repository against a core folder: the file as it would be written, what it is
// there now, and how the store's entries follow the uses it tells. Nothing is written here.
// `change` is `none` where there is nothing to tell and no report to correct.
export function planReport(root, folder) {
  const said = reportOf(root);
  const { repository } = said;
  const index = readJson(path.join(folder, INDEX));
  const retired = existsSync(path.join(folder, RETIRED))
    ? (readJson(path.join(folder, RETIRED)).blocks ?? [])
    : [];
  const offered = new Map(index.blocks.map((block) => [block.need, block]));
  const gone = new Set(retired.map((block) => block.need));
  const left = [...said.left_out];
  const uses = said.uses.filter((need) => {
    if (offered.has(need) || gone.has(need)) return true;
    left.push({
      need,
      name: need,
      why: `taken from the core, whose store neither offers nor retired ${need}`,
    });
    return false;
  });
  const data = {
    version: CORE.version,
    repository,
    needs: said.needs,
    ...(uses.length > 0 ? { uses } : {}),
  };
  const file = reportFileOf(repository);
  const full = path.join(folder, file);
  const was = existsSync(full) ? readFileSync(full, "utf8") : null;
  const nothing = said.needs.length === 0 && uses.length === 0;
  // An intake ledger that is not there, or cannot be read, tells nothing and corrects nothing: a
  // report the core holds stays as it is, and `why` says what could not be read.
  const written = said.why !== null || (nothing && was === null) ? null : renderJson(data, WIDTH);
  const change =
    written === null ? "none" : was === null ? "create" : was === written ? "unchanged" : "update";
  // The store's entry follows a use the report tells: the repository joins `used_by`, and a block
  // two repositories use has had its second use. A name is never taken out of `used_by`.
  const used = uses
    .map((need) => offered.get(need))
    .filter((block) => block && !(block.used_by ?? []).includes(repository))
    .map((block) => ({
      need: block.need,
      name: block.name,
      second_use: Boolean(block.second_use) || (block.used_by ?? []).length > 0,
    }));
  const next =
    used.length === 0
      ? null
      : {
          ...index,
          blocks: index.blocks.map((block) => {
            const now = used.find((one) => one.need === block.need);
            return now
              ? {
                  ...block,
                  used_by: [...(block.used_by ?? []), repository],
                  second_use: now.second_use,
                }
              : block;
          }),
        };
  const problems = [
    ...(written === null ? [] : corePartShapeProblems("members", data, file)),
    ...(next === null ? [] : corePartShapeProblems("blocks", next, INDEX)),
  ];
  return {
    repository,
    data,
    file,
    text: written,
    was,
    change,
    index: next === null ? null : { text: renderJson(next, WIDTH), used },
    left_out: left,
    problems,
    why: said.why,
    // Whether the core holds a report of this repository that the plan leaves as it is.
    kept: said.why !== null && was !== null,
  };
}

// Whether a plan writes anything.
export const plans = (plan) =>
  plan.index !== null || (plan.text !== null && plan.change !== "unchanged");

// Writes a plan into the core folder: the store's entries first, then the report, so a use a
// report tells is one the store names at every moment.
export function writePlan(folder, plan) {
  if (plan.index) writeFileSync(path.join(folder, INDEX), plan.index.text);
  if (plan.text !== null && plan.change !== "unchanged") {
    mkdirSync(path.join(folder, FOLDER), { recursive: true });
    writeFileSync(path.join(folder, plan.file), plan.text);
  }
}

// A report as data, or null when it is not one a reader can use.
function parsed(file, bytes) {
  try {
    const data = JSON.parse(bytes.toString("utf8"));
    if (corePartShapeProblems("members", data, file).length > 0) return null;
    return {
      repository: data.repository,
      needs: data.needs,
      uses: Array.isArray(data.uses) ? data.uses : [],
      file,
      sha256: sha(bytes),
    };
  } catch {
    return null;
  }
}

// The reports a core folder holds now, each with the hash of its file. One that cannot be read, or
// does not hold its shape, is left out: `core --check` says what is wrong with it.
export function reportsIn(folder) {
  const dir = path.join(folder, FOLDER);
  try {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((name) => name.endsWith(ENDING))
      .sort()
      .map((name) => {
        const file = path.posix.join(FOLDER, name);
        return parsed(file, readFileSync(path.join(dir, name)));
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// The text of every report of a core folder, by its file, for a repository that pins the core.
export function reportTexts(folder) {
  const dir = path.join(folder, FOLDER);
  if (!existsSync(dir)) return {};
  return Object.fromEntries(
    readdirSync(dir)
      .filter((name) => name.endsWith(ENDING))
      .sort()
      .map((name) => [path.posix.join(FOLDER, name), readFileSync(path.join(dir, name), "utf8")]),
  );
}

// The reports a repository's copy of the core holds: those its pin lists, each compared with its
// hash when the copy was read. Empty on a copy pinned before copies held reports.
export function copiedReports(root, pinned) {
  return Object.keys(pinned.files ?? {})
    .filter((file) => file.startsWith(`${FOLDER}/`) && file.endsWith(ENDING))
    .sort()
    .map((file) => {
      try {
        return parsed(file, readFileSync(path.join(root, pinned.snapshot, file)));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// The needs the other repositories of a member's family answered that the family's store does not
// hold, as the member's copy of the core knows them: each with the repository, the need's key, the
// block's name and what it is for. Null on a repository of no family; nothing where the copy
// cannot be read. `lacking` has the kinds of adapter a block of code needs that this repository
// has not: a block is then not proposed to it.
export function familyNeeds(root) {
  const pinned = readPinnedCore(root);
  if (pinned === null) return null;
  if (pinned.unreadable) return { pin: null, repository: null, needs: [], lacking: [] };
  const repository = path.basename(homeOf(root));
  const held = new Set((pinned.blocks ?? []).map((block) => block.need));
  const needs = copiedReports(root, pinned)
    .filter(
      (report) =>
        report.repository !== repository && ofFamily(pinned.declaration, report.repository),
    )
    .flatMap((report) =>
      report.needs
        .filter((one) => !held.has(one.need))
        .map((one) => ({ repository: report.repository, ...one })),
    );
  return {
    pin: pinned.label,
    repository,
    needs,
    lacking: CODE_ADAPTERS.filter((kind) => !adapterOf(kind)?.present?.(root)),
  };
}

// Where a member's report stands against the core's folder: its own (`nothing` to tell, `same`, or
// `behind` with how many needs and uses the core is not told), and the repositories whose report
// in the core is not the one the member copied. Null where it cannot be told.
export function reportState(root, folder, pinned) {
  try {
    const plan = planReport(root, folder);
    const before = plan.was === null ? null : parsed(plan.file, Buffer.from(plan.was));
    const told = new Set((before?.needs ?? []).map((one) => one.need));
    const usesTold = new Set(before?.uses ?? []);
    const own =
      plan.change === "none"
        ? "nothing"
        : plan.change === "unchanged" && !plan.index
          ? "same"
          : "behind";
    const now = reportsIn(folder).filter((report) => report.repository !== plan.repository);
    const copied = pinned.files ?? {};
    const others = [
      ...now.filter((report) => copied[report.file] !== report.sha256).map((one) => one.repository),
      ...Object.keys(copied)
        .filter((file) => file.startsWith(`${FOLDER}/`) && file !== plan.file)
        .filter((file) => !now.some((report) => report.file === file))
        .filter((file) => !existsSync(path.join(folder, file)))
        .map((file) => path.posix.basename(file, ENDING)),
    ];
    return {
      own,
      untold: {
        needs: plan.data.needs.filter((one) => !told.has(one.need)).map((one) => one.need),
        uses: (plan.data.uses ?? []).filter(
          (need) => !usesTold.has(need) || plan.index?.used.some((one) => one.need === need),
        ),
      },
      others_differ: [...new Set(others)].sort(),
    };
  } catch {
    return null;
  }
}
