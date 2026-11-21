// The design principles an owner fixes before any value is chosen, and what every recommendation
// of the guide rests on. A principle comes from the plugin's catalog, which says which option of a
// layer's choice it favours and why, or from the owner's own words, which are recorded and cited
// but favour no option. Only a principle the owner fixed settles a choice: one the guide proposed
// is a question until the owner answers it. No model is called: the same blueprint always gives
// the same recommendations.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));

export const CATALOG = reference("principles.json").principles;
const LAYERS = reference("layers.json").layers;
const BLUEPRINT = "design/blueprint.json";
export const ROW_PREFIX = "principle-";
// The section of the rules page that says what the owner fixed, by its heading.
export const FIXED_SECTION = "What the owner fixed before any value";
export const FEWEST = 3;
export const MOST = 5;
const SOURCES = ["user", "proposed"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UNCONFIRMED_NOTE = "proposed by the guide; a person has not confirmed it";

const optionOf = (key, option) =>
  LAYERS.flatMap((layer) => layer.choices ?? []).find((choice) => choice.key === key)?.options?.[
    option
  ] ?? "";
const productType = (blueprint) =>
  blueprint?.layers?.context?.choice?.product_type === "content-site"
    ? "content-site"
    : "application";

// What the guide recommends where no principle the owner fixed speaks to a choice, by product
// type: the standard each layer page names. Each gives the option and what it rests on.
const DEFAULTS = {
  conformance_level: () => ({
    option: "AA",
    text: "WCAG 2.2: level AA is the level most products commit to and most laws ask for",
  }),
  type_scale: (type) =>
    type === "content-site"
      ? {
          option: "modular",
          text: "the foundations layer page: a modular scale for a content site",
        }
      : {
          option: "standard",
          text: "the foundations layer page: the floor's standard scale for an application",
        },
  type_ratio: (type) =>
    type === "content-site"
      ? {
          option: "major-third",
          text: "the foundations layer page: major third for a content site",
        }
      : {
          option: "minor-third",
          text: `the layers list: minor third, ${optionOf("type_ratio", "minor-third").replace(/^[\d.]+: /, "")}`,
        },
  corner_radius: () => ({
    option: "floor",
    text: "the foundations layer page: keep the floor's corner radius, which its components were drawn with",
  }),
  text_font: () => ({
    option: "floor",
    text: "the foundations layer page: keep the floor's font, which the stylesheet already names and loads, so nothing new is loaded and no screen changes",
  }),
  heading_font: () => ({
    option: "text",
    text: "the foundations layer page: headings in the text typeface, as the floor sets them, so a screen has one typeface",
  }),
  record_panel: (type) =>
    type === "content-site"
      ? { option: "in-place", text: "the patterns layer page: in place for a content site" }
      : { option: "beside", text: "the patterns layer page: beside the list for an application" },
};
// The choices the guide recommends an option for, in the order of the layers.
export const RECOMMENDED_CHOICES = LAYERS.flatMap((layer) =>
  (layer.choices ?? []).map((choice) => choice.key),
).filter((key) => key in DEFAULTS);
const layerOf = (key) =>
  LAYERS.find((layer) => (layer.choices ?? []).some((choice) => choice.key === key)).id;

const listed = (blueprint) => blueprint?.layers?.context?.principles;

// The blueprint's principles, each with what the catalog says of it. An id the catalog does not
// have is the owner's own principle: its words are its text, and it favours nothing. Every reader
// goes through here, and only the guide refuses a blueprint: an entry with no id of words is
// passed over, and an id named twice counts once, so the status and the sheet still read a
// blueprint edited by hand after the guide last ran.
export function principlesOf(blueprint) {
  const list = listed(blueprint);
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const entries = list.filter((entry) => {
    if (typeof entry?.id !== "string" || !SLUG.test(entry.id) || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
  return entries.map((entry) => {
    const known = CATALOG.find((principle) => principle.id === entry.id);
    return {
      id: entry.id,
      name: known?.name ?? entry.id.replaceAll("-", " "),
      statement: typeof entry.text === "string" ? entry.text : (known?.statement ?? ""),
      source: entry.source,
      confirmed: entry.source === "user",
      own: !known,
      favours: known?.favours ?? [],
    };
  });
}

// One line per problem with the blueprint's principles. A blueprint that lists none was decided
// before principles existed, and is not wrong. While it is designed (`preview`), fewer than three
// are a start.
export function principleProblems(blueprint, { preview = false } = {}) {
  const list = listed(blueprint);
  if (list === undefined) return [];
  if (!Array.isArray(list)) return ["context: principles is a list"];
  const found = [];
  const tooMany = list.length > MOST;
  if (tooMany || (!preview && list.length < FEWEST)) {
    found.push(
      `context: an owner fixes three to five principles; the blueprint lists ${list.length}`,
    );
  }
  const seen = new Set();
  for (const entry of list) {
    const id = entry?.id;
    if (typeof id !== "string" || !SLUG.test(id)) {
      found.push(`context: ${id}: an id is lowercase words joined by hyphens`);
      continue;
    }
    if (seen.has(id)) found.push(`context: ${id} is named twice`);
    seen.add(id);
    if (!SOURCES.includes(entry.source)) {
      found.push(`context: ${id}: its source is user or proposed`);
    }
    const known = CATALOG.some((principle) => principle.id === id);
    const words = typeof entry.text === "string" && entry.text.trim() !== "";
    if (!known && !words) {
      found.push(`context: ${id}: a principle of the owner's own words has its text`);
    }
    if (entry.text !== undefined && !words) found.push(`context: ${id}: its text is written`);
  }
  return found;
}

// The rows of the ledger: one judgment of the context layer per principle. A proposal says so
// until the owner fixes it.
export function principleRows(blueprint) {
  return principlesOf(blueprint).map((principle) => ({
    id: `${ROW_PREFIX}${principle.id}`,
    layer: "context",
    kind: "judgment",
    source: BLUEPRINT,
    ...(principle.confirmed ? {} : { note: UNCONFIRMED_NOTE }),
  }));
}

// The option recommended for every choice the guide recommends, and what it rests on. Where the
// principles the owner fixed favour one option, it rests on them; where they favour two, none of
// them settles it and the standard stands, with the disagreement named.
export function recommendations(blueprint) {
  const type = productType(blueprint);
  const fixed = principlesOf(blueprint).filter((principle) => principle.confirmed);
  const chosen = (key) => blueprint?.layers?.[layerOf(key)]?.choice?.[key];
  const result = [];
  for (const key of RECOMMENDED_CHOICES) {
    const standard = DEFAULTS[key](type);
    if (key === "type_ratio") {
      const scale =
        chosen("type_scale") ?? result.find((item) => item.key === "type_scale")?.option;
      if (scale !== "modular") continue;
    }
    const pulls = new Map();
    for (const principle of fixed) {
      const favour = principle.favours.find((item) => item.choice === key);
      if (!favour) continue;
      pulls.set(favour.option, [...(pulls.get(favour.option) ?? []), { principle, favour }]);
    }
    const base = { layer: layerOf(key), key };
    if (pulls.size === 1) {
      const [[option, by]] = [...pulls];
      result.push({
        ...base,
        option,
        basis: {
          kind: "principle",
          principles: by.map((item) => item.principle.id),
          text: by.map((item) => `${item.principle.name}: ${item.favour.why}`).join("; "),
        },
      });
      continue;
    }
    const conflict = [...pulls].map(([option, by]) => ({
      option,
      principles: by.map((item) => item.principle.id),
    }));
    const disagreement =
      conflict.length === 0
        ? ""
        : `; the owner's principles pull different ways here (${conflict
            .map((item) => `${item.principles.join(", ")}: ${item.option}`)
            .join("; ")}), so none of them settles it and the owner chooses`;
    result.push({
      ...base,
      option: standard.option,
      basis: { kind: "standard", text: `${standard.text}${disagreement}` },
      ...(conflict.length > 0 ? { conflict } : {}),
    });
  }
  return result;
}

// The lines of the preview: each principle, then each value of the blueprint that goes against
// what a principle the owner fixed favours. A hint, not a fault: the owner may choose knowingly.
export function principleLines(blueprint) {
  const principles = principlesOf(blueprint);
  if (principles.length === 0) {
    return [
      "hint: no design principle is recorded yet; the guide asks the owner for three to five first (references/principles.json)",
    ];
  }
  const lines = principles.map(
    (principle) => `principle ${principle.id} (${principle.source}): ${principle.statement}`,
  );
  for (const item of recommendations(blueprint)) {
    if (item.basis.kind !== "principle") continue;
    const value = blueprint.layers?.[item.layer]?.choice?.[item.key];
    if (value === undefined || value === item.option) continue;
    lines.push(
      `hint: ${item.key} is ${value}; the principle ${item.basis.text.replace(/^([^:]+): /, `$1 favours ${item.option}: `)}`,
    );
  }
  return lines;
}

// The section of the context layer's record page that lists the principles.
export function principleRecord(blueprint) {
  const principles = principlesOf(blueprint);
  if (principles.length === 0) return [];
  const lines = ["", "## Design principles", ""];
  for (const principle of principles) {
    const who = principle.confirmed ? "fixed by the owner" : "proposed, not confirmed";
    lines.push(`- \`${principle.id}\` (${who}): ${principle.statement}`);
  }
  return lines;
}

// The principle a row of the ledger is, or null.
export function principleOfRow(blueprint, id) {
  const name = String(id);
  if (!name.startsWith(ROW_PREFIX)) return null;
  return (
    principlesOf(blueprint).find((principle) => `${ROW_PREFIX}${principle.id}` === name) ?? null
  );
}

// What a principle gives the decision sheet for a row nobody has confirmed, or null. For a
// principle's own row: the question in its words, and what it rests on. For a row of a choice a
// principle the owner fixed speaks to: keep the value it favours, or reconsider the one that goes
// against it.
export function principleCall(blueprint, id) {
  const principle = principleOfRow(blueprint, id);
  if (principle) {
    const favours = principle.favours.map((item) => `${item.choice} ${item.option}`).join(", ");
    return {
      question: `Is "${principle.statement}" a design principle of this repository?`,
      recommendation:
        "Fix it as it is written, or replace it with one you hold: what it favours is recommended only once you fix it.",
      basis: principle.own
        ? {
            kind: "standard",
            text: `the guide asks the owner to fix three to five principles before any value (the context layer page); these words are the repository's own, in ${BLUEPRINT}, and no option of a layer follows from them`,
          }
        : {
            kind: "standard",
            text: `this plugin's catalog of design principles names it; it favours ${favours}`,
          },
    };
  }
  const key = String(id).replaceAll("-", "_");
  const item = recommendations(blueprint).find((entry) => entry.key === key);
  if (!item || item.basis.kind !== "principle") return null;
  const value = blueprint?.layers?.[item.layer]?.choice?.[key];
  return {
    recommendation:
      value === item.option
        ? `Confirm it: a principle you fixed favours ${item.option}.`
        : `Reconsider it: a principle you fixed favours ${item.option}, and the blueprint has ${value}.`,
    basis: item.basis,
  };
}
