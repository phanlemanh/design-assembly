// Retiring from the core (spec 0016, criterion 24, slice 3 of item 7.2). The family's owner retires
// an answer or a block: it leaves `answers.json` or `blocks/index.json`, which is what `core
// --moved` already reads as retired (decision 0116), and is kept whole in `retired.json`, its
// history included, with who retired it, when and why; the files of a retired block stay where they
// were, held to their hashes. Nothing is deleted from the record. The move writes only in the core
// folder, and says first what it writes there.
//
// A member learns of it at its next look, and nothing of it changes until a person accepts. Once
// accepted, an answer it inherited becomes its own, its row marked as `core --leave` marks a row,
// "when the family core retired it", with the core's reason; a choice of its blueprint likewise;
// and a block it took in stays where it is, its row of the intake ledger saying it is the
// repository's own since then (`own`), `from` and `pin` still saying where it once came from. The
// gate of no member turns red: the copy no longer holds what was retired. No model and no network
// are called, and nothing is committed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  CORE,
  CORE_VALUES,
  corePartShapeProblems,
} from "../templates/tools/design-assembly/contract.mjs";
import { lineWidth, renderJson } from "../templates/tools/design-assembly/json.mjs";
import { LEDGER } from "../templates/tools/design-assembly/ledger.mjs";
import { fileChange, Refusal } from "./command.mjs";
import { CORE_SOURCE } from "./core-blocks.mjs";
import { turnBlueprint, turnLedger } from "./core-leave.mjs";
import { readStore } from "./core-promote.mjs";
import { retiredIn } from "./core-records.mjs";
import { ledgerWithChange } from "./intake-write.mjs";
import { readIntake, readTheme, text } from "./store.mjs";

const WIDTH = 100;
const ANSWERS = CORE.parts.answers.file;
const INDEX = CORE.parts.blocks.file;
const RETIRED = CORE.parts.retired.file;
export { retiredIn };
const BLUEPRINT = "design/blueprint.json";
const NOTHING = ". Nothing was written";
// What a retiring the core's folder does not record is said with: an answer or a block a hand
// took out, or one retired by a plugin before this slice.
export const UNSAID = { by: "no one the core names", why: "the core's folder does not say why" };
export const MEMBERS_LATER =
  "no member repository was written: each member learns at its next look (core --moved, status, inventory), and nothing of it changes until a person there accepts (core --accept); once accepted, what it inherited or took in is its own, with where it came from, and its gate stays as it was";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

// Retires one answer, or one block, of the core in its folder, or says what it would write. `asBlock`
// names a block; otherwise the id is an answer's, and a block's where the core holds no such answer.
export function retireFromCore(core, { id, asBlock = false, by, on, why, dryRun }) {
  const { declaration, index, retired } = readStore(core);
  const answers = readJson(path.join(core, ANSWERS));
  const answer = asBlock ? null : answers.answers.find((item) => item.id === id);
  const block = answer ? null : index.blocks.find((item) => item.need === id);
  const base = { core, family: declaration.family, id, by, on, why, dry_run: dryRun };
  if (!answer && !block) {
    const was =
      (!asBlock && retired.answers.find((item) => item.id === id)) ||
      retired.blocks.find((item) => item.need === id);
    if (was) {
      return { ...base, already: was.retired, kind: was.need ? "block" : "answer", files: [] };
    }
    throw new Refusal(
      `the core holds no ${asBlock ? "block" : "answer or block"} ${id}: it has ${[
        ...answers.answers.map((item) => item.id),
        ...index.blocks.map((item) => item.need),
      ].join(", ")}${NOTHING}`,
    );
  }
  const mark = { by, on, why };
  const kind = answer ? "answer" : "block";
  const record = { ...(answer ?? block), retired: mark };
  const since = answer
    ? (answer.history?.at(-1)?.on ?? answer.on)
    : (block.history?.at(-1)?.on ?? block.promoted.on);
  if (on < since) {
    throw new Refusal(
      `--on ${on} is before ${since}, the day of its last change: a record goes forward${NOTHING}`,
    );
  }
  const nextRetired = {
    version: CORE.version,
    answers: answer ? [...retired.answers, record] : retired.answers,
    blocks: block ? [...retired.blocks, record] : retired.blocks,
  };
  const nextPart = answer
    ? {
        file: ANSWERS,
        data: {
          ...answers,
          version: CORE.version,
          answers: answers.answers.filter((item) => item.id !== id),
        },
      }
    : {
        file: INDEX,
        data: {
          ...index,
          version: CORE.version,
          blocks: index.blocks.filter((item) => item.need !== id),
        },
      };
  const problems = [
    ...corePartShapeProblems("retired", nextRetired, RETIRED),
    ...corePartShapeProblems(answer ? "answers" : "blocks", nextPart.data, nextPart.file),
  ];
  if (problems.length > 0) {
    throw new Refusal(`the core would not hold its own shape: ${problems.join("; ")}${NOTHING}`);
  }
  const retiredFile = path.join(core, RETIRED);
  const files = [
    fileChange(path.join(core, nextPart.file), "update"),
    fileChange(retiredFile, existsSync(retiredFile) ? "update" : "create"),
  ];
  if (!dryRun) {
    writeFileSync(path.join(core, nextPart.file), renderJson(nextPart.data, WIDTH));
    writeFileSync(retiredFile, renderJson(nextRetired, WIDTH));
  }
  return {
    ...base,
    kind,
    name: block?.name ?? null,
    hold: answer?.hold ?? null,
    kept_files: block ? block.files.map((file) => `blocks/${block.need}/${file.file}`) : [],
    files,
  };
}

// The retiring as a person reads it.
export function retireReport(result) {
  const where = `family core${result.dry_run ? " (not written: --dry-run)" : ""}: ${result.family}, at ${result.core}`;
  if (result.already) {
    return [
      where,
      `${result.id} was retired already, by ${result.already.by} on ${result.already.on}, because ${result.already.why}: nothing was written`,
    ];
  }
  const what =
    result.kind === "answer"
      ? `the answer ${result.id} (${result.hold})`
      : `the block ${result.name} (${result.id})`;
  return [
    where,
    `${result.dry_run ? "would retire" : "retired"} ${what}, by ${result.by} on ${result.on}, because ${result.why}`,
    `  it leaves ${result.kind === "answer" ? ANSWERS : INDEX} and is kept whole in ${RETIRED}, its history included: nothing is deleted from the record`,
    ...(result.kept_files.length > 0
      ? [`  its files stay where they were, held to their hashes: ${result.kept_files.join(", ")}`]
      : []),
    `${result.dry_run ? "would write" : "wrote"}, in the core folder only:`,
    ...result.files.map((file) => `  ${file.change.padEnd(7)} ${file.path}`),
    MEMBERS_LATER,
    "nothing was committed or sent anywhere",
  ];
}

// ---- a member accepts a retiring ------------------------------------------------------------------

// The keys of the blueprint an answer of the core is held by, each as `<layer>.<key>`.
const choiceKeys = (id) => {
  const place = CORE_VALUES[id];
  return place?.layer
    ? [place.key, place.ratio].filter(Boolean).map((key) => `${place.layer}.${key}`)
    : [];
};

// The files a member writes once a person accepts retirings: each row of an answer retired turned
// into the repository's own, "when the family core retired it", with the core's reason and the name
// it gives; each choice of the blueprint the same; each block it took in marked `own` in its row of
// the intake ledger. `files` has the texts the move is about to write, read in place of the disk;
// `answers` are the answers of the copy before (for a value only the copy held); `records` is what
// the core's folder says of each retiring. Gives the files and what was turned.
export function acceptRetired(
  root,
  { answerIds = [], blockNeeds = [], answers = [], records, on, files = {} },
) {
  const read = (file) =>
    file in files
      ? files[file]
      : existsSync(path.join(root, file))
        ? readFileSync(path.join(root, file), "utf8")
        : null;
  const out = {};
  const turned = { rows: [], choices: [], blocks: [], not_taken_in: [] };
  const said = (record) => ({ by: record?.by ?? UNSAID.by, why: record?.why ?? UNSAID.why });

  let ledger = read(LEDGER);
  if (ledger !== null) {
    for (const id of answerIds) {
      const made = turnLedger(ledger, {
        on,
        ...said(records.answers[id]),
        answers,
        only: [id],
        how: "retired",
      });
      ledger = made.text;
      turned.rows.push(...made.rows);
    }
    if (ledger !== read(LEDGER)) out[LEDGER] = ledger;
  }
  const blueprintText = read(BLUEPRINT);
  if (blueprintText !== null) {
    let blueprint;
    try {
      blueprint = JSON.parse(blueprintText);
    } catch {
      blueprint = null;
    }
    for (const id of blueprint ? answerIds : []) {
      const only = choiceKeys(id);
      if (only.length === 0) continue;
      const made = turnBlueprint(blueprint, {
        on,
        ...said(records.answers[id]),
        answers,
        only,
        how: "retired",
      });
      blueprint = made.blueprint;
      turned.choices.push(...made.turned);
    }
    if (blueprint && turned.choices.length > 0) {
      out[BLUEPRINT] = renderJson(blueprint, lineWidth(root));
    }
  }
  if (blockNeeds.length > 0) {
    const theme = readTheme(root);
    const intake = readIntake(root, theme);
    for (const need of blockNeeds) {
      const rows = intake.blocks.filter(
        (row) => text(row.from) === CORE_SOURCE && text(row.source) === need && !row.own,
      );
      if (rows.length === 0) {
        turned.not_taken_in.push(need);
        continue;
      }
      for (const row of rows) {
        const record = said(records.blocks[need]);
        Object.assign(
          out,
          ledgerWithChange(
            root,
            intake.file,
            text(row.need),
            { own: { since: on, by: record.by, why: record.why } },
            intake.ledger.spelled,
            out,
          ),
        );
        turned.blocks.push({
          need: text(row.need),
          block: need,
          name: text(row.name),
          file: text(row.file),
        });
      }
    }
  }
  return { files: out, turned };
}
