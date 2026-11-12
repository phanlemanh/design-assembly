// What every screen must have, read from source: the states a view of data goes through, that a
// screen takes its words from one place, and that an error message has both of its parts.
import { closing, openingTag } from "./components.mjs";

// The file a person owns: the states every screen must declare, and the screens excused from them.
export const STATES_FILE = "design/states.json";
// Where the floor lists its screens with the states of each.
export const REGISTRY = "src/screens.ts";

// The states every view of data has: waiting for it, having none, failing to get it, and a search
// or filter that matches nothing.
export const CORE_STATES = ["loading", "empty", "error", "no-results"];

// Each screen of the registry with the names of the states it declares.
export function readScreens(text) {
  const found = [];
  for (const screen of text.matchAll(/\bpath:\s*["']([^"']+)["']/g)) {
    const rest = text.slice(screen.index);
    const list = /\bstates:\s*\[/.exec(rest);
    const next = rest.slice(1).search(/\bpath:\s*["']/);
    if (!list || (next !== -1 && list.index > next)) {
      found.push({ path: screen[1], states: [] });
      continue;
    }
    const open = list.index + list[0].length - 1;
    const body = rest.slice(open, closing(rest, open) + 1);
    found.push({
      path: screen[1],
      states: [...body.matchAll(/\bname:\s*["']([^"']+)["']/g)].map((state) => state[1]),
    });
  }
  return found;
}

// Why the screens do not declare the states they must, or null.
export function statesProblem(statesText, registryText, file = STATES_FILE) {
  if (statesText === null || statesText === undefined) return `${file} is missing`;
  let table;
  try {
    table = JSON.parse(statesText);
  } catch {
    return `${file} is not valid JSON`;
  }
  const required = table.required ?? [];
  const dropped = CORE_STATES.filter((state) => !required.includes(state));
  if (dropped.length > 0) {
    return `${file}: ${dropped.join(", ")} must stay required: every view of data has them`;
  }
  const exempt = table.exempt ?? {};
  const unexplained = Object.entries(exempt).filter(([, why]) => !String(why ?? "").trim());
  if (unexplained.length > 0) {
    return `${file}: ${unexplained.map(([path]) => path).join(", ")} is excused without a reason`;
  }
  const screens = readScreens(registryText ?? "");
  if (screens.length === 0) return `no screen is listed in ${REGISTRY}, so no state is measured`;
  const found = [];
  for (const screen of screens.filter((item) => !(item.path in exempt))) {
    const missing = required.filter((state) => !screen.states.includes(state));
    if (missing.length > 0)
      found.push(`${screen.path} declares no state named ${missing.join(", ")}`);
  }
  return found.length > 0 ? found.join("; ") : null;
}

const TEXT_ATTRIBUTES =
  /\b(aria-label|aria-description|placeholder|title|alt)=(?:\{\s*)?(["'])([^"']*)\2/g;
const HAS_WORD = /\p{L}{2,}/u;
// Marks of code, not of text between two tags.
const LOOKS_LIKE_CODE = /[;=()[\]"'`|&]/;

// Places where a screen writes words itself instead of taking them from the repository's one
// place for words: text between tags, and text in an attribute a person reads or hears.
export function wordsProblem(files, skip = []) {
  const found = [];
  for (const [file, text] of Object.entries(files)) {
    if (skip.some((prefix) => file.startsWith(prefix))) continue;
    for (const tag of text.matchAll(/<([A-Za-z][\w.]*)(?=[\s/>])/g)) {
      const from = tag.index + tag[0].length;
      const attributes = openingTag(text, from);
      for (const attribute of attributes.matchAll(TEXT_ATTRIBUTES)) {
        if (HAS_WORD.test(attribute[3])) {
          found.push(`${file}: <${tag[1]}> has ${attribute[1]}="${attribute[3]}"`);
        }
      }
      const after = from + attributes.length + 1;
      const stop = text.slice(after).search(/[<{]/);
      const between = stop === -1 ? "" : text.slice(after, after + stop);
      const tagFollows = /^<[/A-Za-z]/.test(text.slice(after + stop, after + stop + 2));
      if (tagFollows && HAS_WORD.test(between) && !LOOKS_LIKE_CODE.test(between)) {
        found.push(`${file}: <${tag[1]}> holds the text "${between.trim().slice(0, 40)}"`);
      }
    }
  }
  if (found.length === 0) return null;
  return `${found.slice(0, 5).join("; ")}: a screen takes its words from the repository's one place for them`;
}

// Why an error message a screen shows lacks one of its two parts, or null. An error message is an
// `Alert` of the destructive kind: its title says what happened, its description what to do next.
export function errorCopyProblem(files, skip = []) {
  const found = [];
  let measured = 0;
  for (const [file, text] of Object.entries(files)) {
    if (skip.some((prefix) => file.startsWith(prefix))) continue;
    for (const tag of text.matchAll(/<Alert(?=[\s/>])/g)) {
      const from = tag.index + tag[0].length;
      const attributes = openingTag(text, from);
      if (!/\bdestructive\b/.test(attributes)) continue;
      measured += 1;
      const end = text.indexOf("</Alert>", from);
      const body = attributes.trimEnd().endsWith("/") || end === -1 ? "" : text.slice(from, end);
      const missing = [
        ...(/<AlertTitle[\s/>]/.test(body) ? [] : ["title: what happened"]),
        ...(/<AlertDescription[\s/>]/.test(body) ? [] : ["description: what to do next"]),
      ];
      if (missing.length > 0)
        found.push(`${file}: an error message has no ${missing.join(", no ")}`);
    }
  }
  if (measured === 0) return "no screen shows an error message with Alert, so nothing is measured";
  return found.length > 0 ? found.slice(0, 5).join("; ") : null;
}
