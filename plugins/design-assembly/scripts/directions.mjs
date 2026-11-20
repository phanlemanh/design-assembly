// The whole directions the guide shows before any single value is asked: a colour, a type scale
// and a corner radius that go together. They come from the plugin's catalog; the guide shows the
// ones that agree best with the principles the owner fixed, and each value says what it rests on.
// A colour the owner gave is kept in every direction: the brand is theirs. No model is called: the
// same blueprint always gives the same directions, in the same order.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseColor } from "../templates/tools/design-assembly/color.mjs";
import { principlesOf } from "./principles.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reference = (file) => JSON.parse(readFileSync(path.join(PLUGIN, "references", file), "utf8"));
const CATALOG = reference("directions.json");
export const DIRECTIONS = CATALOG.directions;
export const SHOW = CATALOG.show;
const CATALOG_FILE = "references/directions.json";
const PRINCIPLES = reference("principles.json").principles;

// The colour the owner gave: one passed in, else the blueprint's when a person chose or confirmed
// it. A colour the guide proposed is not theirs.
// Only a colour that can be read counts: a word that is none is passed over.
const readable = (colour) => typeof colour === "string" && parseColor(colour) !== null;
export function ownColour(blueprint, colors = []) {
  const given = colors.find(readable);
  if (given) return given;
  const foundations = blueprint?.layers?.foundations;
  const colour = foundations?.choice?.source_color;
  if (!readable(colour) || foundations?.status !== "decided") return null;
  const theirs =
    foundations.source === "user" ||
    (Array.isArray(foundations.confirmed) && foundations.confirmed.includes("source_color"));
  return theirs ? colour : null;
}

// The favours of a principle that speak to a direction's values: a ratio only to a modular scale.
const speaking = (principle, values) =>
  principle.favours.filter((favour) => favour.choice in values);

// How a direction stands with the principles the owner fixed, one principle at a time: it agrees
// with one whose every favour among its values it has, goes against one it has none of, and
// follows the rest only in part. The score is a point for each it agrees with, one off for each it
// goes against, so a principle that favours many values counts once.
function fitOf(direction, fixed) {
  const fit = { agrees: [], disagrees: [], mixed: [] };
  let score = 0;
  for (const principle of fixed) {
    const favours = speaking(principle, direction.values);
    if (favours.length === 0) continue;
    const kept = favours.filter((favour) => direction.values[favour.choice] === favour.option);
    if (kept.length === favours.length) {
      fit.agrees.push(principle.id);
      score += 1;
    } else if (kept.length === 0) {
      fit.disagrees.push(principle.id);
      score -= 1;
    } else fit.mixed.push(principle.id);
  }
  return { ...fit, score };
}

// What one value of a direction rests on: the principles the owner fixed that favour it, else the
// catalog principle the direction follows, else its character. A fixed principle that favours
// another option is named.
function reasonFor(direction, key, value, fixed, own) {
  if (key === "source_color") {
    return {
      kind: "standard",
      text: own
        ? "the colour the owner gave, kept in every direction: a brand colour is the owner's call"
        : `a starter colour of the plugin (references/source-colors.json), apart in hue from the other directions; the brand colour is the owner's to give`,
    };
  }
  const favouring = (list) =>
    list.flatMap((principle) =>
      speaking(principle, direction.values)
        .filter((favour) => favour.choice === key)
        .map((favour) => ({ principle, favour })),
    );
  const against = favouring(fixed)
    .filter((item) => item.favour.option !== value)
    .map((item) => `; ${item.principle.name}, which the owner fixed, favours ${item.favour.option}`)
    .join("");
  const backing = favouring(fixed).filter((item) => item.favour.option === value);
  // A value a fixed principle backs rests on it, even where another fixed one pulls away: both
  // are said.
  if (backing.length > 0) {
    return {
      kind: "principle",
      principles: backing.map((item) => item.principle.id),
      text: `${backing.map((item) => `${item.principle.name}: ${item.favour.why}`).join("; ")}${against}`,
    };
  }
  // A principle the direction follows that the owner fixed backs its value and was said above: the
  // catalog's test holds that a direction has every option the principles it follows favour.
  const followed = PRINCIPLES.filter((principle) => direction.follows.includes(principle.id));
  const drawnFrom = favouring(followed).filter((item) => item.favour.option === value);
  const text =
    drawnFrom.length > 0
      ? drawnFrom
          .map(
            (item) =>
              `the direction follows ${item.principle.name}, a principle of the catalog the owner has not fixed: ${item.favour.why}`,
          )
          .join("; ")
      : `the direction's character: ${direction.character}`;
  return { kind: "standard", text: `${text}${against}` };
}

// The direction the owner took, as the catalog has it, or null where the blueprint names none.
export const directionOf = (blueprint) =>
  DIRECTIONS.find((item) => item.id === blueprint?.layers?.foundations?.direction) ?? null;

// The directions to show, best first: the ones that agree most with the principles the owner
// fixed, then the ones that suit the product type, then the catalog's order.
export function directionsFor(blueprint, { colors = [] } = {}) {
  const type =
    blueprint?.layers?.context?.choice?.product_type === "content-site"
      ? "content-site"
      : "application";
  const fixed = principlesOf(blueprint).filter((principle) => principle.confirmed);
  const own = ownColour(blueprint, colors);
  const ranked = DIRECTIONS.map((direction, order) => ({
    direction,
    order,
    fit: fitOf(direction, fixed),
    suits: direction.suits.includes(type) ? 1 : 0,
  })).sort((a, b) => b.fit.score - a.fit.score || b.suits - a.suits || a.order - b.order);
  return ranked.slice(0, SHOW).map(({ direction, fit }) => {
    const values = { ...direction.values, ...(own ? { source_color: own } : {}) };
    return {
      id: direction.id,
      name: direction.name,
      // Its own colour is said only where the direction brings it: the owner's is not described.
      character: own
        ? `${direction.character} The colour is the owner's.`
        : `${direction.character} Colour: ${direction.colour}.`,
      values,
      follows: direction.follows,
      fit: { agrees: fit.agrees, disagrees: fit.disagrees, mixed: fit.mixed },
      reasons: Object.entries(values).map(([key, value]) => ({
        key,
        value,
        basis: reasonFor(direction, key, value, fixed, Boolean(own)),
      })),
    };
  });
}

// Why the blueprint's direction cannot be read, or null. A blueprint names a direction only once a
// person picked one; none is not wrong.
export function directionProblem(blueprint) {
  const direction = blueprint?.layers?.foundations?.direction;
  if (direction === undefined) return null;
  if (DIRECTIONS.some((item) => item.id === direction)) return null;
  return `foundations: direction ${direction} is not one of ${CATALOG_FILE}`;
}
