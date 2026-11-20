// A do and a don't for every rule of the handoff book that has a picture: small examples drawn
// with the repository's own values inside the book, and, where it has a browser, its own screen as
// it is beside the same screen with the rule broken by a stylesheet. Each don't breaks exactly its
// rule, which the tests measure; each do keeps it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { collectFacts, renderBook, WORDS } from "../scripts/book.mjs";
import {
  breakingCss,
  EXAMPLE_RULES,
  examplePairs,
  exampleRules,
  shown,
} from "../scripts/examples.mjs";
import { contrast, parseColor } from "../templates/tools/design-assembly/color.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(PLUGIN, "../..");

// The facts of a repository like this one, with every example's rule in its ledger.
const FACTS = {
  name: "sample",
  revision: null,
  level: "AA",
  threshold: 4.5,
  colors: [
    { name: "background", light: "oklch(1 0 0)", dark: "oklch(0.145 0 0)" },
    { name: "foreground", light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
    { name: "primary", light: "oklch(0.488 0.243 264.376)", dark: "oklch(0.6 0.2 264)" },
    { name: "primary-foreground", light: "oklch(0.985 0 0)", dark: "oklch(0.145 0 0)" },
    { name: "destructive", light: "oklch(0.577 0.245 27.325)", dark: "oklch(0.7 0.19 22)" },
  ],
  type: [
    { step: "sm", size: "0.875rem", px: 14, line: 20 },
    { step: "base", size: "1rem", px: 16, line: 24 },
    { step: "2xl", size: "1.5rem", px: 24, line: 32 },
  ],
  radius: [
    { step: "sm", size: "0.375rem", px: 6 },
    { step: "md", size: "0.5rem", px: 8 },
    { step: "lg", size: "0.625rem", px: 10 },
  ],
  spacing: 4,
  target: 24,
  rules: [...EXAMPLE_RULES],
};
const pxOf = (text) => [...text.matchAll(/(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));

test("the examples are for the rules the ledger holds and the facts can draw", () => {
  assert.deepEqual(EXAMPLE_RULES, [
    "color-contrast",
    "type-scale-values",
    "spacing-values",
    "radius-value",
    "target-size",
    "error-copy",
    "notification-channel",
  ]);
  assert.deepEqual(exampleRules(FACTS), EXAMPLE_RULES);
  // A rule the ledger has no row for gets no example, nor one the facts cannot draw.
  assert.deepEqual(exampleRules({ ...FACTS, rules: ["radius-value", "brand-exceptions"] }), [
    "radius-value",
  ]);
  assert.deepEqual(exampleRules({ ...FACTS, target: null }).includes("target-size"), false);
  assert.deepEqual(exampleRules({ ...FACTS, radius: [] }).includes("radius-value"), false);
  assert.deepEqual(exampleRules({ ...FACTS, colors: [] }).includes("color-contrast"), false);
});

test("each do keeps its rule with the repository's values, and each don't breaks it", () => {
  const pairs = Object.fromEntries(examplePairs(FACTS, WORDS).map((pair) => [pair.rule, pair]));
  // Contrast: the do is the primary with its own text; the don't, a text the ratio says fails.
  const contrastPair = pairs["color-contrast"];
  assert.ok(contrastPair.do.includes("oklch(0.488 0.243 264.376)"));
  assert.ok(contrastPair.doRatio >= 4.5, contrastPair.doRatio);
  assert.ok(contrastPair.dontRatio < 3, contrastPair.dontRatio);
  assert.match(contrastPair.dont, new RegExp(`${contrastPair.dontRatio.toFixed(1)}:1`));
  // Type: the do's sizes are steps of the scale; the don't's are none of them.
  const steps = FACTS.type.map((step) => step.px);
  assert.ok(pxOf(pairs["type-scale-values"].do).every((px) => steps.includes(px)));
  assert.ok(pxOf(pairs["type-scale-values"].dont).every((px) => !steps.includes(px)));
  // Spacing: multiples of the unit, and not.
  assert.ok(pxOf(pairs["spacing-values"].do).every((px) => px % 4 === 0));
  assert.ok(pxOf(pairs["spacing-values"].dont).every((px) => px % 4 !== 0));
  // Corners: one step of the scale for every shape, and three corners that are none of them.
  const corners = FACTS.radius.map((step) => step.px);
  const radiiOf = (html) =>
    [...html.matchAll(/border-radius:\s*(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
  assert.equal(new Set(radiiOf(pairs["radius-value"].do)).size, 1);
  assert.ok(radiiOf(pairs["radius-value"].do).every((px) => corners.includes(px)));
  assert.ok(radiiOf(pairs["radius-value"].dont).every((px) => !corners.includes(px)));
  assert.equal(new Set(radiiOf(pairs["radius-value"].dont)).size, 3);
  // Target size: a control as tall as the level asks, and one below it.
  const heightOf = (html) => Number(/min-height:\s*(\d+)px/.exec(html)[1]);
  assert.ok(heightOf(pairs["target-size"].do) >= 24);
  assert.ok(heightOf(pairs["target-size"].dont) < 24);
  // Words and channels say the rule in the book's own words.
  assert.ok(pairs["error-copy"].do.includes(WORDS.examples["error-copy"].doText));
  assert.ok(pairs["error-copy"].dont.includes(WORDS.examples["error-copy"].dontText));
  assert.ok(
    pairs["notification-channel"].dont.includes(WORDS.examples["notification-channel"].dontText),
  );
  for (const pair of Object.values(pairs)) {
    assert.ok(pair.title && pair.why, pair.rule);
    assert.notEqual(pair.do, pair.dont, pair.rule);
  }
});

test("a value from the repository is written into an example as a value, never as markup", () => {
  const hostile = {
    ...FACTS,
    colors: FACTS.colors.map((item) =>
      item.name === "primary" ? { ...item, light: 'red"><script>x</script>' } : item,
    ),
  };
  const html = examplePairs(hostile, WORDS)
    .map((pair) => pair.do + pair.dont)
    .join("");
  assert.doesNotMatch(html, /<script>/);
  // A colour that cannot be read gives no contrast example rather than a wrong one.
  assert.ok(!exampleRules(hostile).includes("color-contrast"));
});

test("the stylesheet that breaks a rule on the screen breaks that rule and no other", () => {
  const contrastCss = breakingCss("color-contrast", FACTS);
  const [, text] = /--foreground:\s*([^;]+);/.exec(contrastCss);
  assert.ok(contrast(parseColor(text), parseColor("oklch(1 0 0)")) < 3);
  assert.doesNotMatch(contrastCss, /--radius|--spacing|--text-/);
  const typeCss = breakingCss("type-scale-values", FACTS);
  assert.ok(pxOf(typeCss).length >= 3);
  assert.ok(pxOf(typeCss).every((px) => !FACTS.type.map((step) => step.px).includes(px)));
  assert.doesNotMatch(typeCss, /--radius|--spacing|--foreground/);
  assert.match(breakingCss("spacing-values", FACTS), /--spacing:\s*[\d.]+px/);
  assert.ok(pxOf(breakingCss("spacing-values", FACTS)).every((px) => px % 4 !== 0));
  assert.match(breakingCss("radius-value", FACTS), /border-radius/);
  // Words, channels and sizes of controls are not broken by a stylesheet.
  for (const rule of ["target-size", "error-copy", "notification-channel"]) {
    assert.equal(breakingCss(rule, FACTS), null, rule);
  }
});

test("the book has a sheet of dos and don'ts before its last, in the repository's words", () => {
  const page = renderBook(FACTS_WITH_REST());
  assert.match(page, /<span>07<\/span>Do and don't/);
  assert.match(page, /<span>08<\/span>/);
  for (const rule of EXAMPLE_RULES) assert.ok(page.includes(`data-rule="${rule}"`), rule);
  const translated = renderBook(FACTS_WITH_REST(), {
    words: {
      examplesTitle: "Nên và không nên",
      examples: { "error-copy": { title: "Lời báo lỗi" } },
    },
  });
  assert.match(translated, /<span>07<\/span>Nên và không nên/);
  assert.ok(translated.includes("Lời báo lỗi"));
  // A word left out of the repository's file falls back to the book's own.
  assert.ok(translated.includes(WORDS.examples["error-copy"].doText));
  // With no rule to show, the sheet says so in one line.
  const none = renderBook({ ...FACTS_WITH_REST(), rules: [] });
  assert.ok(none.includes(WORDS.noExamples));
});

test("on this repository the book draws its own screen beside it broken, rule by rule", (t) => {
  if (!existsSync(path.join(ROOT, "node_modules/@playwright/test"))) {
    t.skip("the reference implementation has no browser installed");
    return;
  }
  const facts = collectFacts(ROOT);
  assert.ok(facts.rules.includes("color-contrast"), facts.rules.join(", "));
  const out = "coverage/plugin-book-examples";
  rmSync(path.join(ROOT, out), { recursive: true, force: true });
  const drawn = spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts/book.mjs"), "--target", ROOT, "--out", out],
    { encoding: "utf8", timeout: 300000 },
  );
  assert.ok([0, 1].includes(drawn.status), drawn.stderr);
  const page = readFileSync(path.join(ROOT, out, "book.html"), "utf8");
  for (const rule of ["color-contrast", "type-scale-values", "spacing-values", "radius-value"]) {
    const shown = new RegExp(
      `<figure class="broken" data-rule="${rule}"><img src="(data:image/png;base64,[^"]{2000,})"`,
    ).exec(page);
    assert.ok(shown, rule);
    const kept = /<figure class="kept"><img src="(data:image\/png;base64,[^"]{2000,})"/.exec(page);
    assert.ok(kept);
    assert.notEqual(shown[1], kept[1], rule);
  }
});

function FACTS_WITH_REST() {
  const facts = collectFacts(ROOT);
  return { ...facts, ...FACTS, coverage: facts.coverage, tiers: facts.tiers };
}

// An oklab mix written out again here, apart from the module, to measure what a page draws.
function drawnMix(html) {
  const [, first, share, second] =
    /color-mix\(in oklab, (oklch\([^)]*\)) (\d+)%, (oklch\([^)]*\))\)/.exec(html);
  const lab = (text) => {
    const { l, c, h } = parseColor(text);
    const turn = ((Number.isFinite(h) ? h : 0) * Math.PI) / 180;
    return [l, c * Math.cos(turn), c * Math.sin(turn)];
  };
  const [a, b] = [lab(first), lab(second)];
  const t = Number(share) / 100;
  const [l, x, y] = a.map((value, i) => value * t + b[i] * (1 - t));
  return {
    mixed: { l, c: Math.hypot(x, y), h: (Math.atan2(y, x) * 180) / Math.PI },
    ground: parseColor(second),
  };
}

test("the contrast don't is measured as the browser mixes it, and never rounds up to the ratio", () => {
  const pair = examplePairs(FACTS, WORDS).find((item) => item.rule === "color-contrast");
  const { mixed, ground } = drawnMix(pair.dont);
  const ratio = contrast(mixed, ground);
  assert.ok(ratio < 3, ratio);
  assert.ok(Math.abs(ratio - pair.dontRatio) < 0.01, `${ratio} against ${pair.dontRatio}`);
  const printed = Number(/(\d+\.\d):1/.exec(pair.dont)[1]);
  assert.ok(printed < 3 && printed <= ratio, printed);
});

test("a pair the repository's own colours already fail is not shown as a do", () => {
  const failing = {
    ...FACTS,
    colors: FACTS.colors.map((item) =>
      item.name === "primary-foreground" ? { ...item, light: "oklch(0.6 0.2 264)" } : item,
    ),
  };
  assert.ok(!exampleRules(failing).includes("color-contrast"));
});

test("the type don't blurs the order without turning it over, and a size not in pixels is left out", () => {
  const pair = examplePairs(FACTS, WORDS).find((item) => item.rule === "type-scale-values");
  const [heading, body, note] = pxOf(pair.dont);
  assert.ok(heading > body && body > note, `${heading} ${body} ${note}`);
  assert.ok(heading - note < 6, "the three sizes sit close together");
  const fluid = {
    ...FACTS,
    type: [...FACTS.type, { step: "4xl", size: "clamp(2rem, 5vw, 3rem)", px: null, line: null }],
  };
  const sizes = pxOf(
    examplePairs(fluid, WORDS).find((item) => item.rule === "type-scale-values").do,
  );
  assert.ok(
    sizes.every((px) => px > 0),
    sizes.join(", "),
  );
  assert.doesNotMatch(breakingCss("type-scale-values", fluid), /--text-4xl/);
  // With no size in pixels but one, there is no scale to show.
  const flat = { ...FACTS, type: [{ step: "base", size: "1rem", px: 16, line: 24 }] };
  assert.ok(!exampleRules(flat).includes("type-scale-values"));
});

test("the corners the screen is broken with are off the repository's own scale", () => {
  const scale = {
    ...FACTS,
    radius: [3, 13, 21].map((px, i) => ({ step: `s${i}`, size: `${px}px`, px })),
  };
  const css = breakingCss("radius-value", scale);
  const used = [...css.matchAll(/border-radius:\s*(\d+)px/g)].map((match) => Number(match[1]));
  assert.equal(used.length, 3);
  assert.ok(
    used.every((px) => ![3, 13, 21].includes(px)),
    used.join(", "),
  );
  const unread = {
    ...FACTS,
    radius: [{ step: "md", size: "calc(var(--radius) - 2px)", px: null }],
  };
  assert.ok(!exampleRules(unread).includes("radius-value"));
});

test("a ratio is printed cut, never rounded up past the one it fails", () => {
  assert.equal(shown(2.96), "2.9:1");
  assert.equal(shown(4.49), "4.4:1");
  assert.equal(shown(6.04), "6.0:1");
});

test("a target too small to show a smaller control below it gets no example", () => {
  assert.ok(!exampleRules({ ...FACTS, target: 10 }).includes("target-size"));
  assert.ok(exampleRules({ ...FACTS, target: 24 }).includes("target-size"));
});

test("the rules of the facts are the ones the repository's ledger holds", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-examples-"));
  try {
    mkdirSync(path.join(dir, "design"));
    writeFileSync(
      path.join(dir, "design/decisions.yaml"),
      'version: 1\ndecisions:\n  - id: radius-value\n    layer: foundations\n    kind: closed\n    source: "shape scale"\n',
    );
    assert.deepEqual(collectFacts(dir).rules, ["radius-value"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
