// Shows the choices of the foundations layer instead of describing them: the repository's own
// screen, drawn once per option, side by side on one sheet. A person picks a letter.
//
// Every option comes from a closed list or a formula, and its values are computed by the same
// code that later writes them, so what is seen is what the gate will hold. Nothing is written to
// the repository's sources: the sheet goes to a folder for build output.
// The record section shows how a record opens from a list instead: the same screen and state,
// once per arrangement of the list-detail layout.
// The direction section is asked first, on its own: whole directions, each a colour, a type scale
// and a corner radius drawn together, before any single value is asked.
// Usage: node specimen.mjs --target DIR [--section direction|color|around|type|radius|typeface|neutral|status|review|record|all]
//        [--from PATH]... draws, on the direction section, the candidate direction of a source from
//        outside (see bring-in.mjs) beside the plugin's.
//          [--color COLOR]... [--around COLOR] [--all-ratios] [--out DIR] [--plan]
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FILES } from "../templates/tools/design-assembly/check.mjs";
import { candidateFrom } from "./bring-in.mjs";
import { directionsFor } from "./directions.mjs";
import { buildOf, openStage, reachState, setDark } from "./stage.mjs";
import {
  asWritten,
  clipChroma,
  contrast,
  formatOklch,
  parseColor,
} from "../templates/tools/design-assembly/color.mjs";
import {
  RECORD_LAYOUTS,
  RECORD_LINE,
  REGISTRY,
} from "../templates/tools/design-assembly/patterns.mjs";
import {
  CORNER_RADII,
  modularScale,
  RATIOS,
  TYPE_VARIABLES,
  typeDeclarations,
} from "../templates/tools/design-assembly/scale.mjs";
import { loadStyles, resolve } from "../templates/tools/design-assembly/styles.mjs";
import { readFontSources } from "../templates/tools/design-assembly/sources-ledger.mjs";
import {
  buildTheme,
  fontValues,
  renderBlock,
  sourceFontId,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";
import { FONT_VARIABLES } from "../templates/tools/design-assembly/fonts.mjs";
import {
  NEUTRAL_ROLES,
  neutralRoles,
  over,
  TONE_TINT,
  toneColor,
} from "../templates/tools/design-assembly/color-formulas.mjs";
import {
  neutralValue,
  readVariable,
  THRESHOLDS,
} from "../templates/tools/design-assembly/theme.mjs";
import { recommendations } from "./principles.mjs";
import { adapter as values } from "../templates/tools/design-assembly/adapters/tailwind.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const COLORS = JSON.parse(readFileSync(path.join(PLUGIN, "references/source-colors.json"), "utf8"));
const LAYERS = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8")).layers;
const STATUS = JSON.parse(readFileSync(path.join(PLUGIN, "references/status-tones.json"), "utf8"));
const RECORD_CHOICE = LAYERS.find((layer) => layer.id === "patterns")?.choices?.find(
  (choice) => choice.key === "record_panel",
);
// The arrangements in the order they are offered: the recommendation for the product type first.
const RECORD_ORDER = {
  application: ["beside", "over", "in-place"],
  "content-site": ["in-place", "beside", "over"],
};
const RECORD_LABELS = {
  beside: "beside the list, where both fit",
  over: "over the list, as a side sheet",
  "in-place": "in the list's place",
};
const SIZES = "design/screen-sizes.json";
// What the stage sets on the page to pick the arrangement it draws.
const RECORD_GLOBAL = "__designAssemblyRecordLayout";
const BLUEPRINT = "design/blueprint.json";
export const OUT = "coverage/design-specimen";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// The ratios shown first for each product type; `--all-ratios` shows every one.
const RATIOS_FOR = {
  application: ["major-second", "minor-third"],
  "content-site": ["major-third", "perfect-fourth"],
};
const FLOOR_SMALLEST_PX = 12;

const hueApart = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const written = (color) => formatOklch(asWritten(clipChroma(color)));

// What the blueprint has decided so far, with the floor's answer for what it has not.
export function decided(blueprint) {
  const context = blueprint?.layers?.context?.choice ?? {};
  const foundations = blueprint?.layers?.foundations?.choice ?? {};
  return {
    productType: context.product_type ?? "application",
    conformanceLevel: context.conformance_level ?? "AA",
    sourceColor: foundations.source_color ?? null,
    typeScale: foundations.type_scale ?? "standard",
    typeRatio: foundations.type_ratio ?? null,
    cornerRadius: foundations.corner_radius ?? "floor",
    textFont: foundations.text_font ?? null,
    neutralFamily: foundations.neutral_family ?? null,
    recordPanel: blueprint?.layers?.patterns?.choice?.record_panel ?? null,
    assumed: [
      ...(context.conformance_level ? [] : ["conformance level AA"]),
      ...(context.product_type ? [] : ["product type application"]),
    ],
  };
}

// One option of the color section: the theme the source color gives, as the guide would write it.
export function colorOption(source, label, state, css) {
  const inputs = {
    sourceColor: source,
    conformanceLevel: state.conformanceLevel,
    typeScale: state.typeScale,
    ...(state.typeScale === "modular" ? { typeRatio: state.typeRatio } : {}),
    cornerRadius: state.cornerRadius,
  };
  let theme;
  try {
    theme = buildTheme(inputs, css);
  } catch (error) {
    return { dropped: `${source}: ${error.message}` };
  }
  const notes = theme.modes.map((mode) => {
    const name = mode.selector === ":root" ? "light" : "dark";
    const on = contrast(mode.primary, mode.background).toFixed(2);
    const text = contrast(mode.onPrimary, mode.primary).toFixed(2);
    const moved = mode.adjusted
      ? "moved from the source to reach the contrast ratio"
      : "the source color itself";
    return `${name}: primary ${formatOklch(mode.primary)}, ${moved}; ${on}:1 on the background, text on it ${text}:1`;
  });
  // The colours themselves, for a patch beside the pictures: a screen may show little of them.
  const swatches = theme.modes.map((mode) => ({
    mode: mode.selector === ":root" ? "light" : "dark",
    background: formatOklch(mode.background),
    primary: formatOklch(mode.primary),
    onPrimary: formatOklch(mode.onPrimary),
  }));
  return {
    value: source,
    label,
    notes,
    swatches,
    css: renderBlock(theme),
    modes: ["light", "dark"],
  };
}

// The source colors to show: the person's own first, then the one already decided, then starters
// whose hue is not close to one already shown, up to the number the list says.
export function colorCandidates(state, own = []) {
  const shown = [];
  const add = (color, label) => {
    const parsed = parseColor(String(color));
    if (!parsed) return `${color}: not a colour written as #rrggbb or oklch(L C H)`;
    if (shown.some((item) => item.color === color)) return null;
    shown.push({ color, label, hue: parsed.h, chroma: parsed.c });
    return null;
  };
  const problems = own.map((color) => add(color, "yours")).filter(Boolean);
  if (state.sourceColor) add(state.sourceColor, "decided so far");
  for (const starter of COLORS.starters) {
    if (shown.length >= Math.max(COLORS.show, own.length + 1)) break;
    const hue = parseColor(starter.color).h;
    // A grey has no hue to be close to.
    const close = shown.some(
      (item) => item.chroma > 0.03 && hueApart(item.hue, hue) < COLORS.apart_degrees,
    );
    if (!close) add(starter.color, `starter: ${starter.name}`);
  }
  return { shown, problems };
}

// One step in each direction around a colour: what "warmer", "lighter" or "stronger" mean here.
export function around(color) {
  const base = parseColor(String(color));
  if (!base) return null;
  const { hue_degrees: hue, lightness, chroma } = COLORS.steps;
  const turn = (h) => (((base.h + h) % 360) + 360) % 360;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const steps = [
    { label: "as it is", color: String(color) },
    { label: `hue ${hue} degrees back`, color: written({ ...base, h: turn(-hue) }) },
    { label: `hue ${hue} degrees on`, color: written({ ...base, h: turn(hue) }) },
    { label: "lighter", color: written({ ...base, l: clamp(base.l + lightness, 0.05, 0.95) }) },
    { label: "darker", color: written({ ...base, l: clamp(base.l - lightness, 0.05, 0.95) }) },
    { label: "stronger", color: written({ ...base, c: base.c + chroma }) },
    { label: "softer", color: written({ ...base, c: clamp(base.c - chroma, 0, 1) }) },
  ];
  // A step a screen cannot show lands on a colour already there: it is left out, and said.
  // Two colours an eye cannot tell apart are the same colour here.
  const near = (a, b) =>
    Math.abs(a.l - b.l) < 0.005 && Math.abs(a.c - b.c) < 0.005 && hueApart(a.h, b.h) < 1;
  const seen = [asWritten(clipChroma(base))];
  const shown = [];
  const same = [];
  steps.forEach((step, index) => {
    const colour = parseColor(step.color);
    if (index > 0 && seen.some((other) => near(other, colour))) same.push(step.label);
    else {
      if (index > 0) seen.push(colour);
      shown.push(step);
    }
  });
  return { shown, same };
}

// The framework's own type sizes, written out: what the standard scale looks like even in a
// repository whose stylesheet has a modular scale today.
export function standardType(target, stylesheet) {
  const styles = loadStyles(target, stylesheet);
  const floor = { ...styles, css: withoutBlock(styles.css) };
  const found = TYPE_VARIABLES.map((name) => [name, resolve(floor, ":root", name)?.value]).filter(
    ([, value]) => value,
  );
  const lines = found.map(([name, value]) => `  ${name}: ${value};`);
  return {
    css: lines.length > 0 ? `:root {\n${lines.join("\n")}\n}` : "",
    steps: found
      .filter(([name]) => !name.endsWith("--line-height"))
      .map(([name, value]) => ({ step: name.replace("--text-", ""), size: value })),
  };
}

// Everything the sheet shows, with nothing drawn yet: sections, options, and the CSS each option
// puts on the page. The same input gives the same plan.
export function specimenPlan(target, options = {}) {
  const read = (file) =>
    existsSync(path.join(target, file)) ? readFileSync(path.join(target, file), "utf8") : null;
  const css = read(FILES.css) ?? "";
  const blueprint = JSON.parse(read(BLUEPRINT) ?? "{}");
  const state = decided(blueprint);
  const wanted = options.section ?? "all";
  const want = (id) => wanted === "all" || wanted === id;
  const sections = [];
  const dropped = [];
  const letter = (items) => items.map((item, index) => ({ letter: LETTERS[index], ...item }));

  const colors = (id, title, question, candidates) => {
    const built = candidates.map((item) => colorOption(item.color, item.label, state, css));
    dropped.push(...built.filter((item) => item.dropped).map((item) => item.dropped));
    sections.push({
      id,
      key: "source_color",
      title,
      question,
      shots: ["ready", "empty"],
      options: letter(built.filter((item) => !item.dropped)),
    });
  };
  // Directions are asked before any value, on a sheet of their own: the default run is for refining.
  if (wanted === "direction") {
    sections.push(directionSection(blueprint, state, css, options, dropped));
  }
  if (want("color")) {
    const { shown, problems } = colorCandidates(state, options.colors ?? []);
    dropped.push(...problems);
    colors(
      "color",
      "source color",
      "Which colour is the product's? The primary color role is solved from it, in light and in dark.",
      shown,
    );
  }
  if (wanted === "around" && options.around) {
    const steps = around(options.around);
    if (!steps) dropped.push(`${options.around}: not a colour written as #rrggbb or oklch(L C H)`);
    else {
      for (const label of steps.same) {
        dropped.push(`${label}: a screen cannot show this colour any further that way`);
      }
      colors("around", "source color, one step around", "Closer to which of these?", steps.shown);
    }
  }
  if (want("type")) {
    const ratios = options.allRatios
      ? Object.keys(RATIOS)
      : (RATIOS_FOR[state.productType] ?? RATIOS_FOR.application);
    const standard = standardType(target, FILES.css);
    sections.push({
      id: "type",
      key: "type_scale",
      title: "type scale",
      question: "Which set of sizes reads right on this screen?",
      shots: ["ready"],
      options: letter([
        {
          value: "standard",
          label: "the floor's standard sizes",
          notes: ["the sizes every user of the framework already knows"],
          css: standard.css,
          steps: standard.steps,
          modes: ["light"],
        },
        ...ratios.map((ratio) => {
          const scale = modularScale(ratio);
          const small = scale.filter((step) => step.size < FLOOR_SMALLEST_PX);
          return {
            value: `modular, ${ratio}`,
            choice: { type_scale: "modular", type_ratio: ratio },
            label: `modular scale, ${ratio} (${RATIOS[ratio]})`,
            notes: [
              `sizes in px: ${scale.map((step) => step.size).join(", ")}`,
              ...(small.length > 0
                ? [
                    `${small.map((step) => `text-${step.step} is ${step.size}px`).join(", ")}: below the floor's smallest size`,
                  ]
                : []),
            ],
            css: `:root {\n${typeDeclarations(scale)
              .map((line) => `  ${line}`)
              .join("\n")}\n}`,
            steps: scale.map((step) => ({ step: step.step, size: `${step.size}px` })),
            modes: ["light"],
          };
        }),
      ]),
    });
  }
  if (want("radius")) {
    sections.push({
      id: "radius",
      key: "corner_radius",
      title: "corner radius",
      question: "How round are the corners?",
      shots: ["ready", "empty"],
      options: letter(
        Object.entries(CORNER_RADII).map(([name, value]) => ({
          value: name,
          label: `${name} (${value})`,
          notes: [],
          css: `:root {\n  --radius: ${value};\n}`,
          modes: ["light"],
        })),
      ),
    });
  }
  // The typefaces: each value a choice takes in this version, drawn with what the block would set.
  if (want("typeface")) {
    const context = {
      sources: readFontSources(target),
      stylesheet: FILES.css,
      faces: buildOf(target).fontFaces ?? null,
    };
    sections.push(...typefaceSections(state, css, letter, dropped, context));
  }
  // The neutral family and the status tones: each value drawn with what its formula writes, in
  // light and in dark, the recommendation first.
  if (want("neutral")) sections.push(neutralSection(blueprint, state, css, letter, dropped));
  if (want("status")) sections.push(statusSection(blueprint, state, css, letter, dropped));
  // How a record opens: asked on its own, once a screen opens one.
  if (wanted === "record") {
    const order = RECORD_ORDER[state.productType] ?? RECORD_ORDER.application;
    sections.push({
      id: "record",
      key: "record_panel",
      title: "list-detail layout",
      question:
        "How does a record open from the list? Each picture is the same state of the same screen.",
      shots: [],
      options: letter(
        order
          .filter((layout) => RECORD_LAYOUTS.includes(layout))
          .map((layout) => ({
            value: layout,
            label: RECORD_LABELS[layout],
            notes: [
              RECORD_CHOICE?.options?.[layout],
              ...(layout === state.recordPanel ? ["what the blueprint decides so far"] : []),
            ].filter(Boolean),
            css: "",
            modes: ["light"],
          })),
      ),
    });
  }
  if (wanted === "review" && state.sourceColor) {
    const chosen = colorOption(state.sourceColor, "what the blueprint decides", state, css);
    if (chosen.dropped) dropped.push(chosen.dropped);
    else {
      sections.push({
        id: "review",
        key: null,
        title: "before and after",
        question: "The screen as it is now, and as it will be once this is written.",
        shots: ["ready", "empty"],
        options: letter([
          {
            value: "now",
            label: "as the repository is now",
            notes: [],
            css: "",
            modes: ["light", "dark"],
          },
          { ...chosen, value: "decided" },
        ]),
      });
    }
  }
  return { state, sections, dropped };
}

// The two typeface sections: the text first, then the headings beside the text the blueprint has
// so far, or the floor's. After the words of each choice come the fonts of the sources ledger. A
// value the floor cannot give, or a font that cannot be chosen yet, is dropped and said.
function typefaceSections(state, css, letter, dropped, context) {
  const choiceOf = (key) =>
    LAYERS.find((layer) => layer.id === "foundations").choices.find((item) => item.key === key);
  const [textVariable] = FONT_VARIABLES;
  const option = (key, value, inputs) => {
    let fonts;
    try {
      fonts = fontValues(inputs, css, context);
    } catch (error) {
      // The font of the text may be the one that cannot be drawn: said once, by the text.
      if (key === "text_font" || sourceFontId(value) !== null || sourceFontId(text) === null) {
        dropped.push(`${choiceOf(key).name} ${value}: ${error.message}`);
      }
      return null;
    }
    const heading = fonts.heading === `var(${textVariable})` ? fonts.text : fonts.heading;
    const shown = key === "text_font" ? fonts.text : heading;
    const font = context.sources.find((item) => item.id === sourceFontId(value));
    return {
      value,
      label: font
        ? `${value}: ${font.title}, the font of ${font.file}, from ${font.from}`
        : `${value}: ${choiceOf(key).options[value]}`,
      notes: [`font-family: ${shown}`],
      // What loads a font kept as files is drawn with it; any other font shows as the screen
      // loads it today.
      css: [...fonts.faces, values.fonts.preview({ text: fonts.text, heading })].join("\n"),
      modes: ["light"],
    };
  };
  const valuesOf = (key) => [
    ...Object.keys(choiceOf(key).options),
    ...(choiceOf(key).sourced
      ? context.sources.map((font) => `${choiceOf(key).sourced.prefix}${font.id}`)
      : []),
  ];
  const text = state.textFont ?? "floor";
  const section = (id, key, title, question, inputsOf) => ({
    id,
    key,
    title,
    question,
    shots: ["ready"],
    options: letter(
      valuesOf(key)
        .map((value) => option(key, value, inputsOf(value)))
        .filter(Boolean),
    ),
  });
  return [
    section(
      "text-font",
      "text_font",
      "text typeface",
      "Which typeface reads right for running text on this screen?",
      (value) => ({ textFont: value, headingFont: "text" }),
    ),
    section(
      "heading-font",
      "heading_font",
      "heading typeface",
      `Which typeface do headings take, beside running text in the ${text} typeface?`,
      (value) => ({ textFont: text, headingFont: value }),
    ),
  ];
}

const SHEET_MODES = [
  { name: "light", selector: ":root", dark: false },
  { name: "dark", selector: ".dark", dark: true },
];
// The recommendation for a choice, as the guide gives it, and what it rests on.
const recommended = (blueprint, key) =>
  recommendations(blueprint).find((item) => item.key === key) ?? null;
// The options of a choice, the recommended one first.
function inOrder(names, said) {
  const first = [said?.option].flat()[0];
  return names.includes(first) ? [first, ...names.filter((name) => name !== first)] : names;
}
// The background a mode has before any tone is written: the neutral family's where the blueprint
// has one, else the floor's.
function groundOf(state, css, mode, min) {
  if (state.neutralFamily) {
    const source = parseColor(String(state.sourceColor ?? "")) ?? { l: 0.5, c: 0, h: 0 };
    return neutralRoles(state.neutralFamily, source, min, mode.dark)["--background"];
  }
  return (
    parseColor(readVariable(withoutBlock(css), mode.selector, "--background") ?? "") ?? {
      l: mode.dark ? 0.145 : 1,
      c: 0,
      h: 0,
    }
  );
}

// The neutral section: pure grey and grey leaning to the source colour, each drawn on the screen
// with every neutral role its formula writes, in light and dark.
function neutralSection(blueprint, state, css, letter, dropped) {
  const min = THRESHOLDS[state.conformanceLevel]?.text ?? THRESHOLDS.AA.text;
  const source = parseColor(String(state.sourceColor ?? ""));
  const said = recommended(blueprint, "neutral_family");
  const choice = LAYERS.find((layer) => layer.id === "foundations").choices.find(
    (item) => item.key === "neutral_family",
  );
  const options = inOrder(Object.keys(choice.options), said).flatMap((family) => {
    if (family === "tinted" && !source) {
      dropped.push("neutral family tinted: it leans to the source colour, and none is chosen yet");
      return [];
    }
    let written;
    try {
      written = SHEET_MODES.map((mode) => ({
        mode,
        values: neutralRoles(family, source ?? { l: 0.5, c: 0, h: 0 }, min, mode.dark),
      }));
    } catch (error) {
      dropped.push(`neutral family ${family}: ${error.message}`);
      return [];
    }
    const notes = written.map(({ mode, values }) => {
      const pairs = NEUTRAL_ROLES.filter((entry) => entry.on).flatMap((entry) =>
        entry.on.map((ground) => ({
          what: `${entry.role} on ${ground}`,
          ratio: contrast(values[entry.role], values[ground]),
        })),
      );
      const lowest = [...pairs].sort((a, b) => a.ratio - b.ratio)[0];
      const muted = pairs.find((pair) => pair.what === "--muted-foreground on --muted");
      return `${mode.name}: every neutral pair reaches ${min}:1; --muted-foreground on --muted is ${muted.ratio.toFixed(2)}:1, the lowest is ${lowest.what} at ${lowest.ratio.toFixed(2)}:1`;
    });
    if (family === [said?.option].flat()[0]) {
      notes.unshift(`recommended: ${said.basis.text}`);
    }
    return [
      {
        value: family,
        label: `${family}: ${choice.options[family]}`,
        notes,
        swatches: written.map(({ mode, values }) => ({
          mode: mode.name,
          background: neutralValue(values["--background"]),
          primary: neutralValue(values["--foreground"]),
          onPrimary: neutralValue(values["--background"]),
          tint: neutralValue(values["--muted"]),
          tintText: neutralValue(values["--muted-foreground"]),
        })),
        css: written
          .map(
            ({ mode, values }) =>
              `${mode.selector} {\n${Object.entries(values)
                .map(([role, value]) => `  ${role}: ${neutralValue(value)};`)
                .join("\n")}\n}`,
          )
          .join("\n"),
        modes: ["light", "dark"],
      },
    ];
  });
  return {
    id: "neutral",
    key: "neutral_family",
    title: "neutral family",
    question:
      "Which greys does the interface take? Every neutral role is written by the formula, so every pair of them reaches the contrast ratio.",
    shots: ["ready", "empty"],
    options: letter(options),
  };
}

// The status section: each tone of the closed list, drawn with its value in light and dark on the
// background the blueprint has so far. The error tone is always taken; the others are picked.
function statusSection(blueprint, state, css, letter, dropped) {
  const min = THRESHOLDS[state.conformanceLevel]?.text ?? THRESHOLDS.AA.text;
  const said = recommended(blueprint, "status_tones");
  const choice = LAYERS.find((layer) => layer.id === "foundations").choices.find(
    (item) => item.key === "status_tones",
  );
  const options = STATUS.tones.flatMap((entry) => {
    const tone = { ...entry, light: parseColor(entry.light), dark: parseColor(entry.dark) };
    let written;
    try {
      written = SHEET_MODES.map((mode) => {
        const ground = groundOf(state, css, mode, min);
        const color = toneColor(tone, ground, min, mode.dark);
        return { mode, ground, color, tint: over(color, TONE_TINT[mode.name], ground) };
      });
    } catch (error) {
      dropped.push(`status tone ${entry.tone}: ${error.message}`);
      return [];
    }
    const notes = written.map(
      ({ mode, ground, color, tint }) =>
        `${mode.name}: ${entry.role} ${formatOklch(color)}, ${contrast(color, ground).toFixed(2)}:1 on the background, ${contrast(color, tint).toFixed(2)}:1 on its own tint`,
    );
    if (entry.always) notes.unshift("always taken: every product says when something failed");
    if ([said?.option].flat().includes(entry.tone))
      notes.unshift(`recommended: ${said.basis.text}`);
    return [
      {
        value: entry.tone,
        label: `${entry.tone} (${entry.name}): ${choice.options[entry.tone]}`,
        notes,
        swatches: written.map(({ mode, ground, color, tint }) => ({
          mode: mode.name,
          background: formatOklch(ground),
          primary: formatOklch(color),
          onPrimary: formatOklch(ground),
          tint: formatOklch(tint),
          tintText: formatOklch(color),
        })),
        css: written
          .map(
            ({ mode, color }) => `${mode.selector} {\n  ${entry.role}: ${formatOklch(color)};\n}`,
          )
          .join("\n"),
        modes: ["light", "dark"],
      },
    ];
  });
  return {
    id: "status",
    key: "status_tones",
    many: true,
    title: "status tones",
    question:
      "Which status tones does the product use? Pick the letters: the error tone is always taken, and a tone not picked writes no role.",
    shots: ["ready"],
    options: letter(options),
  };
}

// The candidate directions of sources from outside (the bridge in), drawn as every direction is,
// after the plugin's: what they rest on is the source, and picking one writes its values as the
// owner's answer, as for any direction. A source that cannot be read is left out, and said.
function outsideOptions(files, state, css, dropped) {
  return files.flatMap((file) => {
    let candidate;
    try {
      candidate = candidateFrom(path.resolve(file));
    } catch (error) {
      dropped.push(`${file}: ${error.message}`);
      return [];
    }
    const { values } = candidate;
    const drawn = colorOption(
      values.source_color,
      candidate.name,
      {
        ...state,
        typeScale: values.type_scale,
        typeRatio: values.type_ratio ?? null,
        cornerRadius: values.corner_radius,
      },
      css,
    );
    if (drawn.dropped) return [drawn];
    const type =
      values.type_scale === "modular" ? `modular, ${values.type_ratio}` : values.type_scale;
    const fonts = [...new Set([candidate.fonts.text, candidate.fonts.heading].filter(Boolean))];
    return [
      {
        ...drawn,
        value: candidate.id,
        label: `from ${path.basename(candidate.source.file)}: ${values.source_color}, ${type}, corner radius ${values.corner_radius}`,
        choice: { ...values },
        notes: [
          `taken from ${candidate.source.file}, never written to a ledger: picking it writes its values as the owner's answer, as for any direction`,
          ...(fonts.length > 0
            ? [`fonts named: ${fonts.join(", ")} (a typeface is chosen with its source, not here)`]
            : []),
          `colour taken from ${candidate.picked.source_color}`,
          ...(candidate.dark
            ? [
                `the source's own dark colour ${candidate.dark.source_color} is said, not drawn: dark is derived from the source colour, as for every direction`,
              ]
            : []),
          ...candidate.assumed.map(
            (key) => `not in the source, the floor's: ${key} ${values[key]}`,
          ),
          ...candidate.approximated.map(
            (item) => `taken to the plugin's nearest: ${item.key} ${item.from} as ${item.to}`,
          ),
          ...drawn.notes,
        ],
      },
    ];
  });
}

// The direction section: each direction the guide would show, drawn whole. Its colour is solved as
// the guide would write it, with its own type scale and corner radius on the same page.
function directionSection(blueprint, state, css, options, dropped) {
  for (const colour of (options.colors ?? []).filter((item) => !parseColor(String(item)))) {
    dropped.push(`${colour}: not a colour written as #rrggbb or oklch(L C H), so it is not kept`);
  }
  const built = directionsFor(blueprint, { colors: options.colors ?? [] }).map((direction) => {
    const { values } = direction;
    const drawn = colorOption(
      values.source_color,
      direction.name,
      {
        ...state,
        typeScale: values.type_scale,
        typeRatio: values.type_ratio ?? null,
        cornerRadius: values.corner_radius,
      },
      css,
    );
    if (drawn.dropped) return drawn;
    const type =
      values.type_scale === "modular" ? `modular, ${values.type_ratio}` : values.type_scale;
    return {
      ...drawn,
      value: direction.id,
      label: `${direction.name}: ${values.source_color}, ${type}, corner radius ${values.corner_radius}`,
      choice: { direction: direction.id, ...values },
      notes: [
        direction.character,
        `follows: ${direction.follows.join(", ")}`,
        ...(direction.fit.disagrees.length > 0
          ? [`goes against principles the owner fixed: ${direction.fit.disagrees.join(", ")}`]
          : []),
        ...(direction.fit.mixed.length > 0
          ? [`follows in part principles the owner fixed: ${direction.fit.mixed.join(", ")}`]
          : []),
        ...direction.reasons.map((item) => `${item.key} ${item.value}: ${item.basis.text}`),
        ...drawn.notes,
      ],
    };
  });
  built.push(...outsideOptions(options.from ?? [], state, css, dropped));
  dropped.push(...built.filter((item) => item.dropped).map((item) => item.dropped));
  return {
    id: "direction",
    key: "direction",
    title: "design direction",
    question:
      "Which direction is the product's? Each is a colour, a type scale and a corner radius that go together: one letter sets all three, and each can be changed after.",
    shots: ["ready", "empty"],
    options: built
      .filter((item) => !item.dropped)
      .map((item, index) => ({ letter: LETTERS[index], ...item })),
  };
}

// The first screen of the registry and, for each state a shot needs, how to reach it.
export function shotsOf(registryText) {
  const text = registryText ?? "";
  const route = /\bpath:\s*["']([^"']+)["']/.exec(text)?.[1] ?? "/";
  const reach = { ready: route };
  for (const state of text.matchAll(/\{[^{}]*\bname:\s*["']([\w-]+)["'][^{}]*\}/g)) {
    const scenario = /\bscenario:\s*["']([^"']+)["']/.exec(state[0])?.[1];
    if (/\bsteps\s*:/.test(state[0])) continue;
    if (scenario && !(state[1] in reach)) reach[state[1]] = `${route}?scenario=${scenario}`;
  }
  return reach;
}

const escape = (text) =>
  String(text).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// The sheet as a page: one row of cards per section, a letter on each card.
export function renderSheet(plan, images) {
  const cards = (section) =>
    section.options
      .map((option) => {
        const shots = (images[section.id]?.[option.letter] ?? [])
          .map(
            (shot) =>
              `<figure${shot.narrow ? ' class="narrow"' : ""}><img src="${escape(shot.file)}" alt="${escape(`${option.letter}, ${shot.what}`)}" /><figcaption>${escape(shot.what)}</figcaption></figure>`,
          )
          .join("");
        const swatches = (option.swatches ?? [])
          .map(
            (swatch) =>
              `<div class="swatch" style="background:${escape(swatch.background)}"><span style="background:${escape(swatch.tint ?? swatch.primary)};color:${escape(swatch.tintText ?? swatch.onPrimary)}">Aa</span><i style="color:${escape(swatch.primary)}">Aa</i><small style="color:${escape(swatch.mode === "dark" ? "#fafafa" : "#18181b")}">${escape(swatch.mode)}</small></div>`,
          )
          .join("");
        const notes = option.notes.map((note) => `<li>${escape(note)}</li>`).join("");
        // Every step at its own size: a screen may use only two or three of them.
        const steps = (option.steps ?? [])
          .map(
            (step) =>
              `<div style="font-size:${escape(step.size)}"><small>text-${escape(step.step)}</small> Aa 123</div>`,
          )
          .join("");
        return `<article><header><b>${option.letter}</b><span>${escape(option.label)}</span><code>${escape(option.value)}</code></header>${swatches ? `<div class="swatches">${swatches}</div>` : ""}<div class="shots">${shots}</div>${steps ? `<div class="steps">${steps}</div>` : ""}${notes ? `<ul>${notes}</ul>` : ""}</article>`;
      })
      .join("\n");
  const body = plan.sections
    .map(
      (section) =>
        `<section class="${escape(section.id)}"><h2>${escape(section.title)}</h2><p>${escape(section.question)}</p><div class="cards">\n${cards(section)}\n</div></section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Specimen sheet</title>
<style>
  body { margin: 0; padding: 24px; font: 14px/1.5 system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 32px 0 0; }
  p { margin: 2px 0 12px; color: #52525b; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 16px; }
  article { background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; }
  header { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  header b { font-size: 20px; }
  code { color: #52525b; font-size: 12px; }
  figure { margin: 0 0 8px; }
  img { display: block; width: 100%; border: 1px solid #e4e4e7; border-radius: 4px; }
  .record .cards { grid-template-columns: 1fr; }
  .record .shots { display: flex; gap: 12px; align-items: flex-start; }
  .record figure { flex: 1 1 0; min-width: 0; }
  .record figure.narrow { flex: 0 0 22%; }
  figcaption { font-size: 12px; color: #71717a; }
  ul { margin: 0; padding-left: 16px; font-size: 12px; color: #52525b; }
  .steps { margin-bottom: 8px; line-height: 1.25; white-space: nowrap; overflow: hidden; }
  .steps small { display: inline-block; width: 64px; font-size: 11px; color: #71717a; }
  .swatches { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .swatch { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e4e4e7; border-radius: 4px; font-weight: 600; }
  .swatch span { padding: 6px 14px; border-radius: 6px; }
  .swatch i { font-style: normal; font-size: 18px; }
  .swatch small { margin-left: auto; font-weight: 400; }
</style>
</head>
<body>
<h1>Specimen sheet</h1>
<p>${escape(
    // A sheet drawn for another command says in its own words what it shows.
    plan.lede
      ? plan.lede
      : plan.sections.every((section) => !section.key)
        ? "The repository's own screen as it is now, beside the same screen with what the blueprint decides."
        : plan.sections.every((section) => section.id === "record")
          ? "The repository's own screen with a record open, once per arrangement, at the widest and the narrowest width its pages are checked at. Answer with a letter."
          : `The repository's own screen, once per option. Every option shown already meets the rules of the conformance level ${plan.state.conformanceLevel}. Answer with a letter.`,
  )}</p>
${body}
</body>
</html>
`;
}

// Draws the plan: opens the repository's first screen in a browser, puts each option's values on
// the page and takes a picture. Returns why it could not.
export async function draw(target, plan, out) {
  const stage = await openStage(target);
  if (stage.problem) return { problem: stage.problem };
  const reach = shotsOf(
    existsSync(path.join(target, REGISTRY))
      ? readFileSync(path.join(target, REGISTRY), "utf8")
      : "",
  );
  mkdirSync(path.resolve(target, out), { recursive: true });
  const images = {};
  try {
    const { origin, browser } = stage;
    // A narrow window, drawn at twice the size: the screen's content fills the picture and stays
    // sharp when the sheet shows it small.
    const context = await browser.newContext({
      viewport: { width: 760, height: 720 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const section of plan.sections) {
      images[section.id] = {};
      for (const shot of section.shots.filter((name) => name in reach)) {
        await page.goto(`${origin}${reach[shot]}`, { waitUntil: "networkidle" });
        await page.waitForSelector("main");
        // Let the screen's own data arrive: a state is what the screen shows once it has settled.
        await page.waitForTimeout(700);
        for (const option of section.options) {
          const tag = option.css ? await page.addStyleTag({ content: option.css }) : null;
          for (const mode of shot === "ready" ? option.modes : ["light"]) {
            await setDark(page, mode === "dark");
            await page.waitForTimeout(80);
            const file = `${section.id}-${option.letter}-${shot}-${mode}.png`;
            // Only the screen's own content: empty space says nothing about a choice.
            await page
              .locator("main")
              .first()
              .screenshot({ path: path.resolve(target, out, file) });
            (images[section.id][option.letter] ??= []).push({ file, what: `${shot}, ${mode}` });
          }
          await setDark(page, false);
          if (tag) await tag.evaluate((node) => node.remove());
        }
      }
    }
    writeFileSync(path.resolve(target, out, "index.html"), renderSheet(plan, images));
    // The whole sheet as one picture, for where a page cannot be opened.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(pathToFileURL(path.resolve(target, out, "index.html")).href);
    await page.screenshot({ path: path.resolve(target, out, "sheet.png"), fullPage: true });
  } catch (error) {
    return { problem: `drawing stopped: ${error.message.split("\n")[0]}` };
  } finally {
    await stage.close();
  }
  return { images };
}

// Draws the record section: the first state of the registry that opens a record, once per
// arrangement, at the widest and the narrowest width the pages are checked at. The arrangement is
// changed as the panel is served, never on disk. Returns why it could not.
async function drawRecord(target, plan, out) {
  const section = plan.sections.find((item) => item.id === "record");
  // The arrangement is changed as the panel is served: a build that cannot do that draws none,
  // and is known to before its server is started.
  const { serves } = buildOf(target);
  if (!serves.transform || !serves.load) {
    return { problem: "this build cannot change a module as it is served" };
  }
  const stage = await openStage(target, {
    transform: (code) =>
      RECORD_LINE.test(code)
        ? code.replace(
            RECORD_LINE,
            (line, layout) =>
              `export const RECORD_LAYOUT: RecordLayout = ((globalThis as { ${RECORD_GLOBAL}?: RecordLayout }).${RECORD_GLOBAL} ?? "${layout}");`,
          )
        : null,
  });
  if (stage.problem) return { problem: stage.problem };
  const images = { record: {} };
  try {
    const { SCREENS } = await stage.load(`/${REGISTRY}`);
    const sizes = existsSync(path.join(target, SIZES))
      ? (JSON.parse(readFileSync(path.join(target, SIZES), "utf8")).widths ?? [])
      : [];
    const widths = sizes.length > 0 ? [Math.max(...sizes), Math.min(...sizes)] : [1440, 390];
    const reach = (page, screen, state) => reachState(page, stage.origin, screen, state);
    // The state that opens a record: the first one whose page then shows the record panel.
    const look = await stage.browser.newContext({ viewport: { width: 1440, height: 640 } });
    let found = null;
    for (const screen of SCREENS ?? []) {
      for (const state of screen.states.filter((item) => (item.steps ?? []).length > 0)) {
        const page = await look.newPage();
        await reach(page, screen, state).catch(() => undefined);
        const opens = (await page.locator("[data-record-panel]").count()) > 0;
        await page.close();
        if (opens) {
          found = { screen, state };
          break;
        }
      }
      if (found) break;
    }
    await look.close();
    if (!found) {
      return {
        problem: `no state of ${REGISTRY} opens a record yet, so there is no screen to draw it on`,
      };
    }
    mkdirSync(path.resolve(target, out), { recursive: true });
    for (const option of section.options) {
      for (const width of widths) {
        const narrow = width < 600;
        const context = await stage.browser.newContext({
          viewport: { width, height: 560 },
          deviceScaleFactor: narrow ? 2 : 1,
          reducedMotion: "reduce",
        });
        await context.addInitScript(
          ([name, layout]) => {
            globalThis[name] = layout;
          },
          [RECORD_GLOBAL, option.value],
        );
        const page = await context.newPage();
        await reach(page, found.screen, found.state);
        await page.waitForTimeout(400);
        const file = `record-${option.letter}-${width}.png`;
        // Down to the end of what is drawn: empty space below says nothing about the arrangement.
        const bottom = await page.evaluate(() =>
          Math.max(
            ...[...globalThis.document.querySelectorAll("main, [data-record-panel] > *")].map(
              (node) => node.getBoundingClientRect().bottom,
            ),
          ),
        );
        const height = Math.min(page.viewportSize().height, Math.max(320, Math.ceil(bottom) + 32));
        await page.screenshot({
          path: path.resolve(target, out, file),
          clip: { x: 0, y: 0, width, height },
        });
        (images.record[option.letter] ??= []).push({ file, what: `${width}px`, narrow });
        await context.close();
      }
    }
    section.drawn = `${found.screen.path}, state ${found.state.name}`;
    writeFileSync(path.resolve(target, out, "index.html"), renderSheet(plan, images));
    const page = await stage.browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(pathToFileURL(path.resolve(target, out, "index.html")).href);
    await page.screenshot({ path: path.resolve(target, out, "sheet.png"), fullPage: true });
  } catch (error) {
    return { problem: `drawing stopped: ${error.message.split("\n")[0]}` };
  } finally {
    await stage.close();
  }
  return { images };
}

// What each letter stands for, as the choice keys of the blueprint.
export function choices(plan) {
  const found = {};
  for (const section of plan.sections.filter((item) => item.key)) {
    found[section.id] = Object.fromEntries(
      section.options.map((option) => [
        option.letter,
        option.choice ?? { [section.key]: option.value },
      ]),
    );
  }
  return found;
}

async function main() {
  const args = argv.slice(2);
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const all = (flag) => args.flatMap((arg, index) => (arg === flag ? [args[index + 1]] : []));
  if (!value("--target")) {
    stderr.write(
      "usage: node specimen.mjs --target DIR [--section direction|color|around|type|radius|typeface|neutral|status|review|record|all] [--color COLOR]... [--from PATH]... [--around COLOR] [--all-ratios] [--out DIR] [--plan]\n",
    );
    exit(2);
  }
  const target = path.resolve(value("--target"));
  if (!existsSync(path.join(target, FILES.css))) {
    stderr.write(`design-assembly: ${FILES.css} is missing: there is no screen to draw\n`);
    exit(2);
  }
  const around = value("--around");
  const plan = specimenPlan(target, {
    section: around ? "around" : value("--section"),
    colors: all("--color"),
    around,
    allRatios: args.includes("--all-ratios"),
    from: all("--from"),
  });
  if (args.includes("--plan")) {
    stdout.write(`${JSON.stringify({ ...plan, choices: choices(plan) }, null, 2)}\n`);
    return;
  }
  for (const what of plan.state.assumed)
    stdout.write(`note: not decided yet, so shown with ${what}\n`);
  for (const why of plan.dropped) stdout.write(`note: not shown: ${why}\n`);
  const out = value("--out") ?? OUT;
  const drawn = plan.sections.some((section) => section.id === "record")
    ? await drawRecord(target, plan, out)
    : await draw(target, plan, out);
  for (const section of plan.sections) {
    stdout.write(`\n${section.title}: ${section.question}\n`);
    for (const option of section.options) {
      stdout.write(`  ${option.letter}  ${option.label}  [${option.value}]\n`);
      for (const note of option.notes) stdout.write(`       ${note}\n`);
    }
  }
  if (drawn.problem) {
    stdout.write(
      `\nno sheet was drawn: ${drawn.problem}. The options above are the same ones, in words.\n`,
    );
    return;
  }
  writeFileSync(
    path.resolve(target, out, "choices.json"),
    `${JSON.stringify(choices(plan), null, 2)}\n`,
  );
  stdout.write(`\nsheet: ${path.resolve(target, out, "index.html")}\n`);
  stdout.write(`one picture of it: ${path.resolve(target, out, "sheet.png")}\n`);
  stdout.write(`what each letter writes: ${path.resolve(target, out, "choices.json")}\n`);
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) await main();
