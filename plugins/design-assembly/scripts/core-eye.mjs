// Accepting by eye (spec 0016, criterion 19, slice 3 of item 7.1): for a change of the family's core
// whose value can be seen, the repository's own screen is drawn as it is now and as it would be
// with the core's answer, in light and in dark, on the specimen sheet the plugin already draws.
// The values before and after are always listed in words; where nothing can be drawn, the reason is
// given beside them. Nothing of the repository's sources is written: the sheet goes to a folder for
// build output. No model and no network are called.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { FILES } from "../templates/tools/design-assembly/check.mjs";
import {
  modularScale,
  RATIOS,
  typeDeclarations,
} from "../templates/tools/design-assembly/scale.mjs";
import { findStylesheet } from "../templates/tools/design-assembly/styles.mjs";
import { colorOption, decided, draw, OUT, standardType } from "./specimen.mjs";

const BLUEPRINT = "design/blueprint.json";
const THEME = "design/theme.json";

// The stylesheet the repository's gate reads, found the way the gate finds it: the one its tool
// data names, else the one found where adopting looks, else the usual path.
function stylesheetOf(root) {
  const named = (() => {
    try {
      return JSON.parse(readFileSync(path.join(root, THEME), "utf8")).stylesheet;
    } catch {
      return null;
    }
  })();
  return (typeof named === "string" ? named : null) ?? findStylesheet(root) ?? FILES.css;
}
const shown = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// The answers of a core a picture can show, each with what it puts on the page for the core's
// value: `{ css, notes, swatches }`, or `{ problem }` when the value cannot be drawn. A core holds
// two such values today, the source colour and the type scale; an answer of another id is listed in
// words, with why no picture shows it.
const SEEN = {
  "source-color": {
    title: "source colour",
    option(value, { state, css }) {
      const made = colorOption(String(value), "", state, css);
      return made.dropped ? { problem: made.dropped } : made;
    },
  },
  "type-scale-values": {
    title: "type scale",
    option(value, { root, stylesheet }) {
      if (value === "standard") {
        const standard = standardType(root, stylesheet);
        return { css: standard.css, notes: [], steps: standard.steps };
      }
      const ratio = /^modular (\S+)$/.exec(String(value))?.[1];
      if (!ratio || !(ratio in RATIOS)) {
        return { problem: `${shown(value)} is not a type scale this plugin draws` };
      }
      const scale = modularScale(ratio);
      return {
        css: `:root {\n${typeDeclarations(scale)
          .map((line) => `  ${line}`)
          .join("\n")}\n}`,
        notes: [`sizes in px: ${scale.map((step) => step.size).join(", ")}`],
        steps: scale.map((step) => ({ step: step.step, size: `${step.size}px` })),
      };
    },
  },
};
const NOT_SEEN = {
  "record-panel":
    "how a record opens is an arrangement, drawn by the specimen sheet's own section (specimen --section record), not as one screen before and after",
  "test-screen-sizes": "the widths pages are checked at change no screen: there is nothing to see",
};

// Why a change has no picture, or null when it can have one.
function unseen(change) {
  if (change.now === null) return "the core no longer holds it: there is no value to draw";
  if (change.kind !== "value") return "a rule has no value to draw: its words are its row's";
  if (change.was && JSON.stringify(change.was.value) === JSON.stringify(change.now.value)) {
    return "its value did not change, only its hold: the screen stays as it is";
  }
  if (!(change.id in SEEN)) {
    return NOT_SEEN[change.id] ?? "this plugin draws no picture of this answer";
  }
  if (change.would === "holds") {
    return "this repository holds the core's value already: the screen stays as it is";
  }
  return null;
}

// What is looked at, change by change: the value before (in the copy, and what the repository
// holds) and after (in the core), and whether a picture can show it. `only` names the answers
// looked at; none means every one.
export function looksOf(changes, only = []) {
  return changes
    .filter((change) => only.length === 0 || only.includes(change.id))
    .map((change) => {
      const why = unseen(change);
      return {
        id: change.id,
        before: change.was ? change.was.value : null,
        here: change.held_here ?? null,
        after: change.now ? change.now.value : null,
        hold: change.now?.hold ?? change.was?.hold ?? null,
        drawn: why === null,
        ...(why === null ? {} : { why }),
      };
    });
}

// The sheet as the specimen draws it: one section for each change a picture shows, the screen as
// it is now beside the screen with the core's value, both in light and in dark.
export function eyePlan(root, looks) {
  const read = (file) =>
    existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), "utf8") : null;
  const stylesheet = stylesheetOf(root);
  const css = read(stylesheet) ?? "";
  const state = decided(JSON.parse(read(BLUEPRINT) ?? "{}"));
  const sections = [];
  const dropped = [];
  for (const look of looks.filter((item) => item.drawn)) {
    const seen = SEEN[look.id];
    const made = seen.option(look.after, { root, state, css, stylesheet });
    if (made.problem) {
      dropped.push({ id: look.id, why: made.problem });
      continue;
    }
    const modes = ["light", "dark"];
    sections.push({
      id: look.id,
      key: null,
      title: `${seen.title}: ${look.id}`,
      question: `The family core holds ${shown(look.after)}; ${look.here === null ? "this repository's screen is drawn as it is" : `this repository holds ${shown(look.here)}`}.`,
      shots: ["ready", "empty"],
      options: [
        {
          letter: "A",
          value: look.here === null ? "now" : shown(look.here),
          label: "before: as the repository is now",
          notes: [],
          css: "",
          modes,
        },
        {
          ...made,
          letter: "B",
          value: shown(look.after),
          label: "after: with the core's answer",
          notes: made.notes ?? [],
          modes,
        },
      ],
    });
  }
  return {
    state,
    sections,
    dropped,
    lede: "The repository's own screen as it is now, beside the same screen with the answer of the family core, in light and in dark. Nothing of the repository was changed to draw it.",
  };
}

// Looks at changes of the core by eye: the values before and after for each, and one sheet with a
// picture of each change that can be drawn, or why there is none. `out` is the folder the sheet
// goes to, inside the repository's build output.
export async function lookByEye(root, changes, { only = [], out = OUT } = {}) {
  const unknown = only.filter((id) => !changes.some((change) => change.id === id));
  const looks = looksOf(changes, only);
  const wanted = looks.filter((look) => look.drawn);
  if (wanted.length === 0) {
    return { looks, unknown, sheet: null, why: "no change looked at has a value a picture shows" };
  }
  const stylesheet = stylesheetOf(root);
  if (!existsSync(path.join(root, stylesheet))) {
    return {
      looks,
      unknown,
      sheet: null,
      why: `${stylesheet} is missing: there is no screen to draw`,
    };
  }
  const plan = eyePlan(root, looks);
  const withWhy = looks.map((look) => {
    const lost = plan.dropped.find((item) => item.id === look.id);
    return lost ? { ...look, drawn: false, why: lost.why } : look;
  });
  if (plan.sections.length === 0) {
    return { looks: withWhy, unknown, sheet: null, why: "no value looked at could be drawn" };
  }
  const drawn = await draw(root, plan, out);
  if (drawn.problem) return { looks: withWhy, unknown, sheet: null, why: drawn.problem };
  return {
    looks: withWhy,
    unknown,
    sheet: path.resolve(root, out, "index.html"),
    picture: path.resolve(root, out, "sheet.png"),
    why: null,
  };
}

// What a look says, for a person.
export function eyeLines(result) {
  const lines = ["before and after, by value:"];
  for (const look of result.looks) {
    const before = look.before === null ? "not in the copy" : `${shown(look.before)} in the copy`;
    const here = look.here === null ? "" : `, ${shown(look.here)} held here`;
    const after =
      look.after === null ? "no longer in the core" : `${shown(look.after)} in the core`;
    lines.push(
      `  ${look.id}: ${before}${here}; ${after}${look.drawn ? "" : `; no picture: ${look.why}`}`,
    );
  }
  for (const id of result.unknown) {
    lines.push(`  ${id}: did not change in the core, so there is nothing to look at`);
  }
  if (result.sheet) {
    lines.push(
      `sheet: ${result.sheet}`,
      `one picture of it: ${result.picture}`,
      "each change is drawn before (A) and after (B), in light and in dark; nothing was written to the repository's sources",
    );
  } else {
    lines.push(
      `no picture was drawn: ${result.why}. The values before and after are the ones above.`,
    );
  }
  return lines;
}
