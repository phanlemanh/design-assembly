// Shows the choices of the foundations layer instead of describing them: the repository's own
// screen, drawn once per option, side by side on one sheet. A person picks a letter.
//
// Every option comes from a closed list or a formula, and its values are computed by the same
// code that later writes them, so what is seen is what the gate will hold. Nothing is written to
// the repository's sources: the sheet goes to a folder for build output.
// Usage: node specimen.mjs --target DIR [--section color|around|type|radius|review|all]
//          [--color COLOR]... [--around COLOR] [--all-ratios] [--out DIR] [--plan]
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FILES } from "../templates/tools/design-assembly/check.mjs";
import {
  asWritten,
  clipChroma,
  contrast,
  formatOklch,
  parseColor,
} from "../templates/tools/design-assembly/color.mjs";
import { REGISTRY } from "../templates/tools/design-assembly/patterns.mjs";
import {
  CORNER_RADII,
  modularScale,
  RATIOS,
  TYPE_VARIABLES,
  typeDeclarations,
} from "../templates/tools/design-assembly/scale.mjs";
import { loadStyles, resolve } from "../templates/tools/design-assembly/styles.mjs";
import {
  buildTheme,
  renderBlock,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..");
const COLORS = JSON.parse(readFileSync(path.join(PLUGIN, "references/source-colors.json"), "utf8"));
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
    assumed: [
      ...(context.conformance_level ? [] : ["conformance level AA"]),
      ...(context.product_type ? [] : ["product type application"]),
    ],
  };
}

// One option of the color section: the theme the source color gives, as the guide would write it.
function colorOption(source, label, state, css) {
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
  const seen = new Set([written(base)]);
  const shown = [];
  const same = [];
  steps.forEach((step, index) => {
    if (index > 0 && seen.has(step.color)) same.push(step.label);
    else {
      seen.add(step.color);
      shown.push(step);
    }
  });
  return { shown, same };
}

// The framework's own type sizes, written out: what the standard scale looks like even in a
// repository whose stylesheet has a modular scale today.
function standardType(target, stylesheet) {
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
              `<figure><img src="${escape(shot.file)}" alt="${escape(`${option.letter}, ${shot.what}`)}" /><figcaption>${escape(shot.what)}</figcaption></figure>`,
          )
          .join("");
        const swatches = (option.swatches ?? [])
          .map(
            (swatch) =>
              `<div class="swatch" style="background:${escape(swatch.background)}"><span style="background:${escape(swatch.primary)};color:${escape(swatch.onPrimary)}">Aa</span><i style="color:${escape(swatch.primary)}">Aa</i><small style="color:${escape(swatch.mode === "dark" ? "#fafafa" : "#18181b")}">${escape(swatch.mode)}</small></div>`,
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
        return `<article><header><b>${option.letter}</b><span>${escape(option.label)}</span><code>${escape(option.value)}</code></header>${swatches ? `<div class="swatches">${swatches}</div>` : ""}${shots}${steps ? `<div class="steps">${steps}</div>` : ""}${notes ? `<ul>${notes}</ul>` : ""}</article>`;
      })
      .join("\n");
  const body = plan.sections
    .map(
      (section) =>
        `<section><h2>${escape(section.title)}</h2><p>${escape(section.question)}</p><div class="cards">\n${cards(section)}\n</div></section>`,
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
<p>The repository's own screen, once per option. Every option shown already meets the rules of the conformance level ${escape(plan.state.conformanceLevel)}. Answer with a letter.</p>
${body}
</body>
</html>
`;
}

// Draws the plan: starts the repository's own development server, opens its first screen in a
// browser, puts each option's values on the page and takes a picture. Returns why it could not.
async function draw(target, plan, out) {
  const require = createRequire(path.join(target, "package.json"));
  let chromium;
  let createServer;
  try {
    ({ chromium } = require("@playwright/test"));
    const vite = path.dirname(require.resolve("vite/package.json"));
    const entry = JSON.parse(readFileSync(path.join(vite, "package.json"), "utf8")).exports?.["."];
    const file =
      typeof entry === "string"
        ? entry
        : (entry?.import?.default ?? entry?.import ?? entry?.default);
    ({ createServer } = await import(pathToFileURL(path.join(vite, file)).href));
  } catch (error) {
    return {
      problem: `the repository has no browser to draw with (${error.message.split("\n")[0]})`,
    };
  }
  const reach = shotsOf(
    existsSync(path.join(target, REGISTRY))
      ? readFileSync(path.join(target, REGISTRY), "utf8")
      : "",
  );
  mkdirSync(path.join(target, out), { recursive: true });
  const server = await createServer({
    root: target,
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 5290, strictPort: false },
  });
  let browser;
  const images = {};
  try {
    await server.listen();
    const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
    browser = await chromium.launch();
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
        const root = page.locator("html");
        for (const option of section.options) {
          const tag = option.css ? await page.addStyleTag({ content: option.css }) : null;
          for (const mode of shot === "ready" ? option.modes : ["light"]) {
            await root.evaluate(
              (node, dark) => node.classList.toggle("dark", dark),
              mode === "dark",
            );
            await page.waitForTimeout(80);
            const file = `${section.id}-${option.letter}-${shot}-${mode}.png`;
            // Only the screen's own content: empty space says nothing about a choice.
            await page
              .locator("main")
              .first()
              .screenshot({ path: path.join(target, out, file) });
            (images[section.id][option.letter] ??= []).push({ file, what: `${shot}, ${mode}` });
          }
          await root.evaluate((node) => node.classList.remove("dark"));
          if (tag) await tag.evaluate((node) => node.remove());
        }
      }
    }
    writeFileSync(path.join(target, out, "index.html"), renderSheet(plan, images));
    // The whole sheet as one picture, for where a page cannot be opened.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(pathToFileURL(path.join(target, out, "index.html")).href);
    await page.screenshot({ path: path.join(target, out, "sheet.png"), fullPage: true });
  } catch (error) {
    return { problem: `drawing stopped: ${error.message.split("\n")[0]}` };
  } finally {
    await browser?.close();
    await server.close();
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
      "usage: node specimen.mjs --target DIR [--section color|around|type|radius|review|all] [--color COLOR]... [--around COLOR] [--all-ratios] [--out DIR] [--plan]\n",
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
  });
  if (args.includes("--plan")) {
    stdout.write(`${JSON.stringify({ ...plan, choices: choices(plan) }, null, 2)}\n`);
    return;
  }
  for (const what of plan.state.assumed)
    stdout.write(`note: not decided yet, so shown with ${what}\n`);
  for (const why of plan.dropped) stdout.write(`note: not shown: ${why}\n`);
  const out = value("--out") ?? OUT;
  const drawn = await draw(target, plan, out);
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
    path.join(target, out, "choices.json"),
    `${JSON.stringify(choices(plan), null, 2)}\n`,
  );
  stdout.write(`\nsheet: ${path.join(target, out, "index.html")}\n`);
  stdout.write(`one picture of it: ${path.join(target, out, "sheet.png")}\n`);
  stdout.write(`what each letter writes: ${path.join(target, out, "choices.json")}\n`);
}

if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) await main();
