// change: retire a block of the store, merge it into the block of another need, or widen it, only
// on the owner's answer. It says the impact first: the screens that reach the block's file (every screen
// when that cannot be traced), the components that import it, the checks of the tool data that
// name it, and each import line to fix, with its file and line. Then it puts one question to the
// owner on the waiting list. Once the owner keeps it, the next call writes `retired`, and
// `merged_into` for a merge, into the block's entry of the intake ledger, with the name and the day
// of the answer. It never removes a file and never changes a screen's code: a retired block that a
// screen still imports is reported by the inventory as retired and still in use. Widening keeps one
// block for the need and changes it for every screen that uses it (spec 0015): once the owner keeps
// it and the block's file holds the change, the next call writes `changed`, with the name and the
// day of the answer, the reason, and the hash of the file as widened. An item an outside source
// holds through its conform record is changed by a recorded patch instead, never here.
// Usage: node change.mjs <need or name of a block> (--retire --why SENTENCE | --merge-into NEED
//        [--why SENTENCE] | --widen --why SENTENCE) [--dry-run] [--target DIR] [--json]
//        [--out DIR [--format html|pdf]]
// Exit: 0 the change is written, or there is nothing left to change; 1 a question waits on the
// owner, or the owner refused; 2 a wrong call, a block the ledger does not keep, or a repository
// that cannot be read. On 2 nothing is written.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";

import { affectedBy, aliasesOf, screensOf } from "../templates/tools/design-assembly/affected.mjs";
import {
  importsOf,
  readSources,
  resolveImport,
  SOURCE_FOLDER,
} from "../templates/tools/design-assembly/governance.mjs";
import { questionFile } from "../templates/tools/design-assembly/waiting.mjs";
import { writeFiles, writtenFiles } from "./apply.mjs";
import { answerOf, questionFiles, readStore, rowOf, rowsOf, today, writable } from "./asking.mjs";
import { finish, readCall, Refusal, start } from "./command.mjs";
import { DOCUMENT_FLAGS, handOver, plural, requested } from "./document.mjs";
import { ledgerWithChange, yamlValue } from "./intake-write.mjs";
import { VERSION } from "./stamp.mjs";
import { componentsOf, fileOf, text } from "./store.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMITS = JSON.parse(readFileSync(path.join(PLUGIN, "references/limits.json"), "utf8")).limits;
// The first version whose tool reads a question about a block.
export const QUESTIONS_SINCE = "0.13.0";
const NEED = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---- the block and what reaches it ----------------------------------------------------------------

// The block a call names: by its need, else by its name. Two blocks of one name is a wrong call.
function blockOf(state, named) {
  const blocks = state.intake.blocks;
  const byNeed = blocks.filter((entry) => text(entry.need) === named);
  if (byNeed.length > 1) {
    throw new Refusal(
      `two blocks of ${state.intake.kept} answer the need ${named}: one need, one block; the gate says so too`,
    );
  }
  if (byNeed.length === 1) return byNeed[0];
  const byName = blocks.filter((entry) => text(entry.name) === named);
  if (byName.length > 1) {
    throw new Refusal(
      `${named} names ${byName.length} blocks: name one by its need, ${byName.map((entry) => text(entry.need)).join(" or ")}`,
    );
  }
  if (byName.length === 0) {
    throw new Refusal(
      `${named} is no block of ${state.intake.kept}: name a block by its need or its name`,
    );
  }
  return byName[0];
}

const live = (entry) => entry && !entry.retired && !entry.merged_into;

// Each line of the repository's sources that imports the file, with the file and the line number.
function importLines(root, file) {
  const sources = readSources(root, SOURCE_FOLDER);
  const aliases = aliasesOf(root);
  const found = [];
  for (const [from, code] of Object.entries(sources).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (from === file) continue;
    for (const [index, line] of code.split("\n").entries()) {
      const names = importsOf(line, { wide: true });
      const reaches = names.some(
        (name) => resolveImport(from, name, sources, { aliases, wide: true }) === file,
      );
      if (reaches) found.push({ file: from, line: index + 1, import: line.trim() });
    }
  }
  return found;
}

// What retiring the block's file reaches: the screens, as the change map traces them, the frame,
// the components that import it, and the checks of the tool data that name it.
function impactOf(root, state, file, edits) {
  const reached = affectedBy(root, [file]);
  const frame = screensOf(root, state.theme ?? {}).frame?.files.has(file) ?? false;
  const importers = new Set(edits.map((edit) => edit.file));
  const components = [
    ...new Set(
      componentsOf(root)
        .components.filter((component) => importers.has(component.file))
        .map((component) => component.name),
    ),
  ].sort();
  const checks = Object.entries(state.theme?.checks ?? {})
    .filter(([, list]) => JSON.stringify(list).includes(JSON.stringify(file)))
    .map(([id]) => id)
    .sort();
  return {
    all: reached.all,
    why: reached.why.map((item) => item.reason),
    screens: reached.screens.map((screen) => screen.id),
    frame,
    components,
    checks,
  };
}

// The impact in words, for the question and for a person.
function impactWords(impact, edits) {
  const screens = impact.all
    ? `every screen (${impact.why[0]})`
    : impact.screens.length > 0
      ? `the screens ${impact.screens.join(", ")}`
      : "no screen";
  return [
    `it reaches ${screens}${impact.frame ? " and the frame" : ""}`,
    impact.components.length > 0
      ? `the components ${impact.components.join(", ")} import it`
      : "no component imports it",
    impact.checks.length > 0
      ? `the checks ${impact.checks.join(", ")} name its file`
      : "no check names its file",
    `${plural(edits.length, "import line names", "import lines name")} its file`,
  ].join("; ");
}

// ---- the question ---------------------------------------------------------------------------------

// The change a call asks for, or null when it asks for none.
function actionOf(options) {
  if (options.into) {
    return {
      name: `merge into ${options.into}`,
      action: "merge",
      into: options.into,
      why: options.why ?? `merged into ${options.into}`,
    };
  }
  if (options.retire) return { name: "retire", action: "retire", why: options.why };
  if (options.widen) return { name: "widen", action: "widen", why: options.why };
  return null;
}

function questionOf(state, entry, asked, impact, edits, before) {
  const need = text(entry.need);
  const name = text(entry.name) ?? need;
  const said = {
    merge: `Merge the block ${name} (${need}) into the block of ${asked.into}?`,
    retire: `Retire the block ${name} (${need})?`,
    widen: `Widen the block ${name} (${need}), so that every screen that uses it meets the change?`,
  }[asked.action];
  const recommendation = {
    merge: `merge it into ${asked.into}`,
    retire: "retire it",
    widen: "widen it",
  }[asked.action];
  return {
    id: before === 0 ? `change-${need}` : `change-${need}-${before + 1}`,
    group: "blocks to change",
    question: said,
    recommendation,
    basis: `${asked.why}. Impact: ${impactWords(impact, edits)}`,
    hard_to_undo: false,
    where: state.intake.kept,
    if_refused:
      asked.action === "widen"
        ? `the block stays as it is, and ${need} keeps it; no second block is made beside it`
        : `the block stays as it is, and ${need} keeps it`,
    item: `block:${need}`,
    asked_on: today(),
    candidates: [asked],
  };
}

// A merge goes into another need the ledger keeps, and that is not retired.
function intoProblem(state, need, into) {
  if (into === need) return `a block is not merged into its own need, ${need}`;
  const target = state.intake.blocks.find((entry) => text(entry.need) === into);
  if (!target) return `${into} is no need of ${state.intake.kept}`;
  if (!live(target)) return `the block of ${into} is retired or merged itself`;
  return null;
}

// ---- widening -------------------------------------------------------------------------------------

// Whether a widening the owner kept is already recorded on the block: its change says the day and
// the reason of that answer. Then the question is done, and another widening asks again.
function carriedOut(entry, question) {
  const kept = question?.candidates?.[0];
  if (!question?.answer || question.answer === "refuse" || kept?.action !== "widen") return false;
  return (
    text(entry.changed?.on) === text(question.on) &&
    text(entry.changed?.why) === text(kept.why) &&
    Boolean(text(entry.changed?.sha256))
  );
}

// The widening the owner kept, carried out once the block's file holds it: `changed` on the
// block's row, with the answer's name and day, the reason, and the hash of the file as widened. A
// file still as it was last recorded holds no change yet, and nothing is written.
function widened(root, state, entry, question, kept, answered) {
  const need = text(entry.need);
  const file = fileOf(entry.file);
  const full = file ? path.join(root, file) : null;
  if (!full || !existsSync(full)) {
    throw new Refusal(
      `${need} names no file of this repository to widen${file ? `: ${file} is not there` : ""}. Nothing was written`,
    );
  }
  const now = createHash("sha256").update(readFileSync(full)).digest("hex");
  const before = text(entry.changed?.sha256) ?? text(entry.taken);
  if (before === now) {
    return {
      ...answered,
      next: `${question.id} was ${answerOf(question)}: widen ${file}, then call this again; the change is recorded once the file holds it`,
      writes: {},
      work: true,
    };
  }
  writable(state);
  const added = {
    changed: { on: question.on, by: question.by, why: kept.why, sha256: now },
  };
  return {
    ...answered,
    row: { ...entry, ...added },
    next: `${text(entry.name) ?? need} is widened, ${answerOf(question)}: every screen that uses it meets the change`,
    writes: ledgerWithChange(root, state.intake.file, need, added, state.spelled),
    work: false,
  };
}

// ---- the call -------------------------------------------------------------------------------------

function changeCall(root, state, options) {
  const entry = blockOf(state, options.named);
  const need = text(entry.need);
  const file = fileOf(entry.file);
  const edits = file ? importLines(root, file) : [];
  const impact = file
    ? impactOf(root, state, file, edits)
    : {
        all: true,
        why: ["the block names no file"],
        screens: [],
        frame: false,
        components: [],
        checks: [],
      };
  const base = {
    block: { name: text(entry.name), need, file },
    impact,
    edits,
    waiting: null,
    question: null,
    row: entry,
  };
  if (!live(entry)) {
    const when = entry.retired ? ` on ${text(entry.retired.on)} by ${text(entry.retired.by)}` : "";
    return {
      ...base,
      next: `${text(entry.name) ?? need} was retired${when}${entry.merged_into ? `, merged into ${text(entry.merged_into)}` : ""}: nothing is left to change`,
      writes: {},
      work: false,
    };
  }
  // An entry that says it is retired, or merged, with nothing in it: written over, it would hold
  // the key twice.
  const empty = ["retired", "merged_into"].filter((key) => key in entry);
  if (empty.length > 0) {
    throw new Refusal(
      `the entry of ${need} has ${empty.join(" and ")} with nothing in it: take that away, then ask again. Nothing was written`,
    );
  }
  const asked = actionOf(options);
  if (asked?.action === "merge") {
    const problem = intoProblem(state, need, asked.into);
    if (problem) throw new Refusal(`${problem}. Nothing was written`);
  }
  if (asked?.action === "widen" && text(entry.conform)) {
    throw new Refusal(
      `${text(entry.name) ?? need} is an item of the source ${text(entry.from) ?? text(entry.source)}, held by its conform record ${text(entry.conform)}: a change to it is a recorded patch, with conform --need ${need} --patch PATH --reason SENTENCE. Nothing was written`,
    );
  }
  const item = `block:${need}`;
  const question = rowOf(state, item);
  const differs = (row) => asked && row?.candidates?.[0]?.name !== asked.name;
  const done = carriedOut(entry, question);
  if (!question || done || (question.answer === "refuse" && differs(question))) {
    if (done && !asked) {
      return {
        ...base,
        waiting: question.id,
        question: "answered",
        next: `${question.id} is recorded on ${need}: to widen it again, --widen --why SENTENCE`,
        writes: {},
        work: false,
      };
    }
    if (!asked) {
      throw new Refusal(
        `say the change: --retire --why SENTENCE, --merge-into NEED, or --widen --why SENTENCE. Nothing was written`,
      );
    }
    const row = questionOf(state, entry, asked, impact, edits, rowsOf(state, item).length);
    return {
      ...base,
      waiting: row.id,
      question: "asked",
      next: `asked the owner in ${questionFile(row.id)}: the ledger is changed once the owner answers on the decision sheet, and this is called again`,
      writes: questionFiles(state, row),
      work: true,
    };
  }
  const kept = question.candidates?.[0];
  if (!kept?.action) {
    throw new Refusal(
      `${question.id} asks about ${item} with no change to make: take it away from the waiting list, then ask again. Nothing was written`,
    );
  }
  const was = { ...base, waiting: question.id, question: question.answer ? "answered" : "waits" };
  if (!question.answer) {
    const other =
      asked && asked.name !== kept.name
        ? `; "${asked.name}" is not asked while it waits for "${kept.name}"`
        : "";
    return {
      ...was,
      next: `${question.id} waits on the owner: answer it on the decision sheet, then call this again${other}`,
      writes: {},
      work: true,
    };
  }
  if (question.answer === "refuse") {
    return {
      ...was,
      next: `${question.id} was ${answerOf(question)}: ${need} keeps its block; to ask again, ask for another change`,
      writes: {},
      work: true,
    };
  }
  if (asked && asked.name !== kept.name) {
    throw new Refusal(
      `${question.id} was ${answerOf(question)} for "${kept.name}": call this without a change to carry it out, or ask for another change once it is done. Nothing was written`,
    );
  }
  if (kept.action === "merge") {
    const problem = intoProblem(state, need, kept.into);
    if (problem) throw new Refusal(`${problem}. Nothing was written`);
  }
  if (kept.action === "widen") return widened(root, state, entry, question, kept, was);
  writable(state);
  const added = {
    retired: { on: question.on, by: question.by, why: kept.why },
    ...(kept.action === "merge" ? { merged_into: kept.into } : {}),
  };
  return {
    ...was,
    row: { ...entry, ...added },
    next: `${text(entry.name) ?? need} is ${kept.action === "merge" ? `merged into ${kept.into}` : "retired"}, ${answerOf(question)}; no file is removed: fix the import lines listed`,
    writes: ledgerWithChange(root, state.intake.file, need, added, state.spelled),
    work: false,
  };
}

// ---- for a person ---------------------------------------------------------------------------------

export function report(result, written) {
  const { block, impact, edits } = result;
  const lines = [
    `change: ${block.name ?? block.need} (${block.need})${block.file ? `, ${block.file}` : ""}`,
    `impact: ${impactWords(impact, edits)}`,
  ];
  if (impact.all) lines.push(...impact.why.map((why) => `  every screen, because ${why}`));
  if (edits.length > 0) {
    lines.push(
      "import lines that name its file (this command changes none):",
      ...edits.map((edit) => `  ${edit.file}:${edit.line}  ${edit.import}`),
    );
  }
  if (written.length > 0) {
    lines.push(
      `${result.dry_run ? "would write" : "files"}:`,
      ...written.map((line) => `  ${line}`),
    );
  }
  lines.push(`next: ${result.next}`);
  if (result.dry_run) lines.push("preview only: nothing was written");
  return `${lines.join("\n")}\n`;
}

// ---- the document ---------------------------------------------------------------------------------

export function documentOf(result, origin) {
  const measured = (value) => ({ kind: "measurement", text: value });
  const blind = LIMITS.filter(
    (limit) => ["change", "document"].includes(limit.area) && limit.status === "open",
  );
  const { block, impact, edits } = result;
  return {
    kind: "change-report",
    title: "Change report",
    lede: "What retiring, merging or widening a block of the store reaches, and what waits on the owner.",
    origin,
    version: VERSION,
    scope: [`The block ${block.name ?? block.need}, for the need ${block.need}`],
    decision: {
      conclusion: result.next,
      figures: [
        { value: impact.all ? "all" : String(impact.screens.length), label: "screens reached" },
        { value: String(impact.components.length), label: "components import it" },
        { value: String(edits.length), label: "import lines to fix" },
      ],
      attention:
        result.question === "asked" || result.question === "waits"
          ? [{ title: `${result.waiting} waits on the owner`, detail: result.next }]
          : [],
      decide: [],
    },
    findings: edits.map((edit) => ({
      severity: "note",
      title: `${edit.file}, line ${edit.line}`,
      evidence: [edit.import],
    })),
    recommendations: [
      {
        what: "Fix each import line before the block's file goes",
        basis: measured(impactWords(impact, edits)),
        action: result.next,
      },
    ],
    next: [{ why: result.next }],
    blind: blind.map(({ id, note }) => ({ id, note })),
  };
}

// ---- the call as given ----------------------------------------------------------------------------

const CALL =
  "usage: node change.mjs <need or name of a block> (--retire --why SENTENCE | --merge-into NEED [--why SENTENCE] | --widen --why SENTENCE) [--dry-run] [--target DIR] [--json] [--out DIR [--format html|pdf]]\n";

function optionsOf(call) {
  const flags = call.flags;
  const wrong = (why) => new Refusal(`${why}\n${CALL.trimEnd()}`);
  if (call.words.length !== 1) throw wrong("name one block, by its need or its name");
  const [named] = call.words;
  const retire = flags["--retire"] === true;
  const widen = flags["--widen"] === true;
  const into = flags["--merge-into"];
  if ([retire, widen, into !== undefined].filter(Boolean).length > 1)
    throw wrong("--retire, --merge-into and --widen are three changes: give one");
  if (into !== undefined && !NEED.test(into)) throw wrong(`${into} is not a need key`);
  const why = flags["--why"];
  if (why !== undefined && why.trim() === "") throw wrong("--why is a sentence");
  if (retire && why === undefined) throw wrong("--retire says why with --why SENTENCE");
  if (widen && why === undefined) throw wrong("--widen says why with --why SENTENCE");
  if (why !== undefined && !retire && !widen && into === undefined) {
    throw wrong("--why goes with --retire, --merge-into or --widen");
  }
  if (why !== undefined) {
    try {
      yamlValue(why.trim());
    } catch (error) {
      throw wrong(`--why is written to the ledger, and ${error.message}`);
    }
  }
  return { named, retire, widen, into: into ?? null, why: why?.trim() ?? null };
}

async function main(args) {
  const call = readCall(
    args,
    {
      "--retire": "switch",
      "--widen": "switch",
      "--merge-into": "value",
      "--why": "value",
      "--dry-run": "switch",
      ...DOCUMENT_FLAGS,
    },
    { words: true },
  );
  if (call.problem) throw new Refusal(`${call.problem}\n${CALL.trimEnd()}`);
  if (call.help) {
    stdout.write(CALL);
    return;
  }
  const options = optionsOf(call);
  const asked = requested(call);
  const dryRun = call.flags["--dry-run"] === true;
  const root = call.target;
  const state = readStore(root, { since: QUESTIONS_SINCE, none: false });
  const { writes, work, ...result } = changeCall(root, state, options);
  const lines = writeFiles(root, writes, dryRun);
  const files = writtenFiles(lines);
  const answer = { ...result, files, dry_run: dryRun };
  const handed = await handOver(asked, root, (origin) => documentOf(answer, origin));
  finish({
    json: call.json,
    result: { ...answer, ...handed.data, files: [...files, ...(handed.data.files ?? [])] },
    text: `${report(
      answer,
      lines.filter((line) => !line.startsWith("unchanged")),
    )}${handed.text}`,
    work: work || handed.work,
  });
}

await start(import.meta.url, main);
