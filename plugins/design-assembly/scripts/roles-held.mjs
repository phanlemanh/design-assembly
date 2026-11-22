// Each value of the foundations beside what holds it: for every colour role of the table and each
// typeface, its value in light and dark mode, where it comes from with the owner's word, the rows of
// the decisions ledger whose checks name it, and the check each row points to. `status --roles`
// prints it for a repository the guide or adopting has written, and says which lines are not whole.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { FONT_VARIABLES } from "../templates/tools/design-assembly/fonts.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import {
  darkScopes,
  DEFAULT_STYLESHEET,
  findStylesheet,
  loadStyles,
  resolve,
} from "../templates/tools/design-assembly/styles.mjs";
import { readBlock } from "../templates/tools/design-assembly/theme.mjs";
import { COLOR_ROLES, sourceWords } from "./color-roles.mjs";

const THEME_FILE = "design/theme.json";

// The tool data the gate reads, or null where the guide and adopting wrote none.
function readTheme(root) {
  const file = path.join(root, THEME_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

// Whether a check names a variable: any of its fields says it, alone or in a list.
const names = (check, variable) =>
  Object.values(check).some((value) =>
    Array.isArray(value) ? value.includes(variable) : value === variable,
  );

// The variables the generated block declares, in any scope.
const blockVariables = (css) =>
  new Set([...(readBlock(css) ?? "").matchAll(/(--[\w-]+)\s*:/g)].map((found) => found[1]));

// The rows of the ledger that hold a variable, each with the check it points to: a row whose
// checks name it, the row of the generated block where the block declares it, and the row of the
// design tokens file, which is written from the stylesheet and fails when the stylesheet changes
// without it.
function rowsHolding(variable, { checks, ledger, generated, tokenNames }) {
  const held = [];
  for (const [id, list] of Object.entries(checks ?? {})) {
    const row = ledger.find((entry) => entry.id === id);
    if (!row?.check) continue;
    const own = list.filter((check) => names(check, variable));
    const pairs = own.filter((check) => check.kind === "contrast").length;
    const block = generated.has(variable) && list.some((check) => check.kind === "generated");
    const tokens = list.some(
      (check) => check.kind === "tokens" && tokenNames(check.file).has(variable),
    );
    if (own.length === 0 && !block && !tokens) continue;
    const what = pairs > 0 ? `${pairs} pair(s)` : block ? "the generated block" : null;
    held.push({ id, check: row.check, what });
  }
  return held;
}

// Each line of the report as data: what it is, its values, its source, and the parts it lacks.
export function heldRoles(root) {
  const theme = readTheme(root);
  if (!theme) return null;
  // The stylesheet the gate reads, found the way the gate finds it.
  const stylesheet = theme.stylesheet ?? findStylesheet(root) ?? DEFAULT_STYLESHEET;
  const styles = loadStyles(root, stylesheet);
  if (!styles.css) return null;
  const ledger = readLedger(root) ?? [];
  const blueprint = readJson(root, "design/blueprint.json");
  const foundations = blueprint?.layers?.foundations ?? {};
  const words = foundations.roles ?? {};
  const answered = foundations.answered ?? {};
  const scopes = [":root", ...darkScopes(styles)];
  const context = {
    checks: theme.checks,
    ledger,
    generated: blockVariables(styles.css),
    tokenNames: (file) => tokensIn(readJson(root, file)),
  };
  const valuesOf = (variable) =>
    scopes
      .map((scope) => ({ scope, value: resolve(styles, scope, variable)?.value ?? null }))
      .filter((found) => found.value !== null);
  const roles = COLOR_ROLES.roles.map((entry) => {
    const values = valuesOf(entry.role);
    const source = sourceWords(entry, words, foundations.choice ?? null, answered);
    const word = entry.asks ? words[entry.asks] : answered.source_color;
    return line(entry.role, values, source, word, rowsHolding(entry.role, context));
  });
  const fonts = FONT_VARIABLES.map((variable, index) => {
    const key = index === 0 ? "text_font" : "heading_font";
    const word = answered[key];
    const chosen = foundations.choice?.[key];
    const source = chosen
      ? `the owner's ${index === 0 ? "typeface of text" : "typeface of headings"} (${chosen})${word ? `, the owner's word (${word.by} on ${word.on})` : ""}`
      : "the floor's declaration, not chosen yet";
    return line(variable, valuesOf(variable), source, word, rowsHolding(variable, context));
  });
  return [...roles, ...fonts];
}

// The variables a design tokens file carries: a colour by its role's own name, every other group
// under its group's prefix, as the tokens command writes them from the stylesheet.
function tokensIn(tokens) {
  const found = new Set();
  for (const [group, entries] of Object.entries(tokens ?? {})) {
    if (!entries || typeof entries !== "object" || group.startsWith("$")) continue;
    for (const name of Object.keys(entries)) {
      found.add(group === "color" ? `--${name}` : `--${group}-${name}`);
    }
  }
  return found;
}

function readJson(root, file) {
  try {
    return JSON.parse(readFileSync(path.join(root, file), "utf8"));
  } catch {
    return null;
  }
}

function line(variable, values, source, word, rows) {
  const written = values.length > 0;
  const missing = written
    ? [
        ...(word?.by && word?.on ? [] : ["the owner's word"]),
        ...(rows.length > 0 ? [] : ["a row and its check"]),
      ]
    : [];
  return { variable, values, source, written, rows, missing };
}

// The report as words: one line per value, then how many lines are whole and which are not.
export function heldLines(lines) {
  const said = lines.map((item) => {
    if (!item.written) return `${item.variable}: ${item.source}.`;
    const same = new Set(item.values.map((found) => found.value)).size === 1;
    const values = same
      ? `${item.values.length > 1 && !item.variable.startsWith("--font-") ? "light and dark " : ""}${item.values[0].value}`
      : item.values
          .map((found) => `${found.scope === ":root" ? "light" : "dark"} ${found.value}`)
          .join(", ");
    const rows =
      item.rows.length > 0
        ? item.rows
            .map((row) => `${row.id}${row.what ? ` (${row.what})` : ""}, ${row.check}`)
            .join("; ")
        : "no row of the ledger";
    return `${item.variable}: ${item.source}. Value: ${values}. Held by: ${rows}.`;
  });
  const written = lines.filter((item) => item.written);
  const whole = written.filter((item) => item.missing.length === 0);
  const open = written.filter((item) => item.missing.length > 0);
  return [
    ...said,
    `whole: ${whole.length} of ${written.length} values have the owner's word and a row of the ledger with its check${
      lines.length > written.length
        ? `; ${lines.length - written.length} role(s) not declared, as the owner's choices leave them`
        : ""
    }`,
    ...open.map((item) => `  not whole: ${item.variable} lacks ${item.missing.join(" and ")}`),
  ];
}
