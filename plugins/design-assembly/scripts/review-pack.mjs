// What a review reads of a repository before it draws anything, and what it packs for an eye to
// read beside the pictures: the screen's own row of the ledger of screens, the lines of the rules
// page that apply to it, the principles and the direction the owner fixed, and the rows of the
// decisions ledger a measurement rests on. Read-only, and read from the repository alone: the same
// repository gives the same pack.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { readSources } from "../templates/tools/design-assembly/governance.mjs";
import { LEDGER, readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { REGISTRY } from "../templates/tools/design-assembly/patterns.mjs";
import { ledgerText } from "../templates/tools/design-assembly/screen-fragments.mjs";
import {
  fragmentsFolder,
  readScreenLedger,
  SCREEN_LEDGER,
} from "../templates/tools/design-assembly/screen-ledger.mjs";
import {
  frontMatter,
  globPattern,
  screenFiles,
  SIZES_FILE,
  STARTER_WIDTHS,
} from "../templates/tools/design-assembly/screens.mjs";
import { THRESHOLDS } from "../templates/tools/design-assembly/theme.mjs";
import { RULES_PAGE } from "./apply.mjs";
import { Refusal } from "./command.mjs";
import { directionOf } from "./directions.mjs";
import { FIXED_SECTION, principlesOf, ROW_PREFIX } from "./principles.mjs";

export const PACK_FILE = "review-pack.json";
export const PACK_VERSION = 1;
const BLUEPRINT = "design/blueprint.json";
const THEME = "design/theme.json";
// The rows of the decisions ledger the measurements of a review rest on.
const MEASURED_ROWS = ["color-contrast"];

// The states of a row of the ledger of screens a brief can be made of.
const BRIEFED = ["built", "planned"];

const read = (target, file) =>
  existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
const json = (target, file) => {
  const text = read(target, file);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Refusal(`${file} cannot be read: it is not JSON`);
  }
};
const oneLine = (words) => String(words).replace(/\s+/g, " ").trim();

// The screen a command is asked for, as the ledger of screens has it, with the file its row is
// kept in. A call that names no screen of the ledger is refused, and so is one for a screen not
// built yet, unless the caller reads a screen declared ahead too (`unbuilt`), as a brief does.
export function screenOf(target, id, { unbuilt = false } = {}) {
  const text = ledgerText(target);
  if (text === null) {
    throw new Refusal(
      `there is no ledger of screens (${SCREEN_LEDGER}) to read the screen from: adopt the repository first`,
    );
  }
  const screens = readScreenLedger(text).screens;
  const row = screens.find((screen) => String(screen.id) === id);
  if (!row) {
    throw new Refusal(
      `${id} is not a screen of the ledger; it has: ${screens.map((screen) => screen.id).join(", ")}`,
    );
  }
  const status = String(row.status ?? "built");
  if (!unbuilt && status !== "built") {
    throw new Refusal(`${id} is ${status}, not built: there is no screen to draw yet`);
  }
  if (unbuilt && !BRIEFED.includes(status)) {
    throw new Refusal(`${id} is ${status}: a brief is of a screen that is built or planned`);
  }
  const own = `${fragmentsFolder(SCREEN_LEDGER)}/${id}.yaml`;
  return { row, ledger: existsSync(path.join(target, own)) ? own : SCREEN_LEDGER };
}

// The widths the screen is drawn at: the ones the repository declares, or the two every floor
// starts from, said as such.
export function widthsOf(target) {
  const declared = json(target, SIZES_FILE)?.widths;
  const usable = Array.isArray(declared)
    ? declared.filter((width) => Number.isInteger(width) && width > 0)
    : [];
  return usable.length > 0
    ? { widths: [...new Set(usable)].sort((a, b) => a - b), declared: true }
    : { widths: [...STARTER_WIDTHS], declared: false };
}

// The conformance level the repository chose, and where it says so; null where it names none.
export function levelOf(target) {
  const chosen =
    json(target, THEME)?.inputs?.conformanceLevel ??
    json(target, BLUEPRINT)?.layers?.context?.choice?.conformance_level;
  return chosen in THRESHOLDS ? chosen : null;
}

// The source file that draws the screen, where the screen list of the application says so.
function fileOf(target, route) {
  const registry = read(target, REGISTRY);
  const screens = screenFiles(
    registry ?? "",
    readSources(target),
    registry === null ? ledgerText(target) : null,
  );
  return screens.find((screen) => screen.path === route)?.file ?? null;
}

// The lines of the rules page, each with the section it stands under and the line it is on. What
// the owner fixed is left out here: it is given apart, as principles. `covers` says whether the
// page's own paths take in the file that draws the screen; null where that file is not known.
function rulesOf(target, file) {
  const text = read(target, RULES_PAGE);
  if (text === null) return { file: RULES_PAGE, present: false, covers: null, lines: [] };
  const lines = [];
  let section = null;
  text.split(/\r?\n/).forEach((line, index) => {
    const heading = /^##\s+(.*)$/.exec(line);
    if (heading) section = heading[1].trim();
    else if (/^- /.test(line) && section !== null && section !== FIXED_SECTION) {
      lines.push({ line: index + 1, section, text: line.slice(2).trim() });
    }
  });
  const paths = [frontMatter(text)?.paths ?? []].flat().map(String);
  const covers =
    file === null || paths.length === 0 ? null : paths.some((glob) => globPattern(glob).test(file));
  return { file: RULES_PAGE, present: true, covers, lines: covers === false ? [] : lines };
}

// What the owner fixed before any value: each principle that is theirs, the ones in the blueprint
// nobody confirmed, named apart as settling nothing, and the direction they took.
function fixedOf(target) {
  const blueprint = json(target, BLUEPRINT);
  const principles = principlesOf(blueprint).filter(
    (principle) => oneLine(principle.statement) !== "",
  );
  const direction = directionOf(blueprint);
  return {
    principles: principles
      .filter((principle) => principle.confirmed)
      .map((principle) => ({
        id: `${ROW_PREFIX}${principle.id}`,
        name: principle.name,
        statement: oneLine(principle.statement),
      })),
    unfixed_principles: principles
      .filter((principle) => !principle.confirmed)
      .map((principle) => `${ROW_PREFIX}${principle.id}`),
    direction: direction ? { id: direction.id, character: oneLine(direction.character) } : null,
  };
}

// Everything a review reads of the repository for one screen, as data. A brief reads the same of
// a screen declared ahead and not built yet, and asks for it with `unbuilt`.
export function factsOf(target, id, { unbuilt = false } = {}) {
  const { row, ledger } = screenOf(target, id, { unbuilt });
  const decisions = readLedger(target) ?? [];
  const file = fileOf(target, row.route);
  return {
    screen: {
      id: String(row.id),
      route: row.route,
      title: row.title ?? null,
      family: row.family ?? null,
      states: Array.isArray(row.states) ? row.states.map(String) : [],
      file,
    },
    ...widthsOf(target),
    level: levelOf(target),
    rules: rulesOf(target, file),
    ...fixedOf(target),
    decisions,
    ledger_rows: [
      { ledger, id: String(row.id), row },
      ...decisions
        .filter((decision) => MEASURED_ROWS.includes(decision.id))
        .map((decision) => ({ ledger: LEDGER, id: decision.id, row: decision })),
    ],
  };
}

// The pack an eye reads beside the pictures: what was drawn, what was measured, and what the
// repository says of the screen. Nothing in it names a moment or a machine.
export function packOf(facts, drawn) {
  return {
    version: PACK_VERSION,
    screen: facts.screen,
    pictures: drawn.shots.map(({ id, file, state, width, theme, page }) => ({
      id,
      file,
      state,
      width,
      theme,
      page,
    })),
    themes: drawn.themes,
    rules: facts.rules,
    principles: facts.principles,
    unfixed_principles: facts.unfixed_principles,
    direction: facts.direction,
    ledger_rows: facts.ledger_rows,
    findings: drawn.findings,
    unjudged: drawn.unjudged,
  };
}
