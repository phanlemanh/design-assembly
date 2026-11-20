// A do and a don't for every rule of the handoff book that has a picture. Two kinds of each:
// - a small example drawn inside the book with the repository's own values, the do keeping the
//   rule and the don't breaking exactly that rule, measured where a number says so;
// - for a rule a stylesheet can break, the repository's own screen beside the same screen with a
//   stylesheet that breaks that rule laid over it, drawn where the repository has a browser.
// The same facts always give the same examples.
import { contrast, formatOklch, parseColor } from "../templates/tools/design-assembly/color.mjs";
import { escape } from "./family.mjs";

// The rules with an example, in the order the book shows them.
export const EXAMPLE_RULES = [
  "color-contrast",
  "type-scale-values",
  "spacing-values",
  "radius-value",
  "target-size",
  "error-copy",
  "notification-channel",
];
// What a don't's contrast ratio stays under: below even the ratio for large text.
const FAILING_RATIO = 3;
// A colour is written into a page only when it is one this plugin reads.
const colorOf = (facts, name) => {
  const value = facts.colors?.find((item) => item.name === name)?.light;
  return typeof value === "string" && parseColor(value) ? value : null;
};
// A size only counts when it is a number of pixels: a fluid size, such as clamp(), has none.
const finite = (px) => typeof px === "number" && Number.isFinite(px) && px > 0;
const stepPx = (facts, step) => {
  const px = facts.type?.find((item) => item.step === step)?.px;
  return finite(px) ? px : null;
};
const typeSteps = (facts) => (facts.type ?? []).filter((item) => finite(item.px));
const radiusSteps = (facts) =>
  (facts.radius ?? []).map((item) => item.px).filter((px) => finite(px));

// A size from `px` that is none of `taken`, by half pixels in one direction: up when `way` is 1,
// down when it is -1. Never below half a pixel.
function offScale(px, taken, way = 1) {
  for (let delta = 0.5; delta < 40; delta += 0.5) {
    const candidate = px + way * delta;
    if (candidate > 0 && !taken.includes(candidate)) return candidate;
  }
  return px + 0.25;
}

// Three corners none of `steps`: the card's, the button's and the field's.
const offCorners = (steps) =>
  [3, 13, 21, 2, 17, 9, 25, 5, 11, 19].filter((px) => !steps.includes(px)).slice(0, 3);

// A ratio as the book prints it: cut, never rounded up, so a failing ratio never reads as the one
// it fails.
export const shown = (ratio) => `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;

// A text colour of `base`'s hue whose ratio against `ground` is under the failing ratio: moved
// from `ground` toward `base` in steps of lightness until it is as near as it can be while the
// ratio stays under.
function faintText(base, ground) {
  const from = parseColor(ground);
  const to = parseColor(base);
  let best = null;
  for (let i = 1; i <= 50; i += 1) {
    const l = from.l + ((to.l - from.l) * i) / 50;
    const color = { l, c: to.c * (i / 50), h: to.h };
    if (contrast(color, from) >= FAILING_RATIO) break;
    best = color;
  }
  return best ?? { ...from };
}

// Two colours mixed in the oklab space, `share` of the first, as `color-mix(in oklab, ...)` draws
// them: the mix as a colour, to measure.
function mixOklab(first, second, share) {
  const lab = ({ l, c, h }) => {
    const turn = ((Number.isFinite(h) ? h : 0) * Math.PI) / 180;
    return [l, c * Math.cos(turn), c * Math.sin(turn)];
  };
  const [l1, a1, b1] = lab(first);
  const [l2, a2, b2] = lab(second);
  const [l, a, b] = [
    l1 * share + l2 * (1 - share),
    a1 * share + a2 * (1 - share),
    b1 * share + b2 * (1 - share),
  ];
  return { l, c: Math.hypot(a, b), h: ((((Math.atan2(b, a) * 180) / Math.PI) % 360) + 360) % 360 };
}

// The largest whole percent of `text` mixed into `ground` whose ratio against `ground` is still
// under the failing ratio: a text the don't writes in the repository's own two colours.
function faintMix(text, ground) {
  const from = parseColor(ground);
  const to = parseColor(text);
  let best = 0;
  for (let percent = 1; percent <= 100; percent += 1) {
    if (contrast(mixOklab(to, from, percent / 100), from) >= FAILING_RATIO) break;
    best = percent;
  }
  return {
    css: `color-mix(in oklab, ${text} ${best}%, ${ground})`,
    ratio: contrast(mixOklab(to, from, best / 100), from),
  };
}

// Whether the facts hold what an example of the rule is drawn from.
function drawable(rule, facts) {
  switch (rule) {
    case "color-contrast": {
      const primary = colorOf(facts, "primary");
      const onPrimary = colorOf(facts, "primary-foreground");
      if (!primary || !onPrimary || !colorOf(facts, "background")) return false;
      // A do must keep the rule: a pair the repository's own colours already fail is no do.
      const ratio = contrast(parseColor(onPrimary), parseColor(primary));
      return ratio >= (facts.threshold ?? 4.5) && faintMix(onPrimary, primary).ratio < ratio;
    }
    case "type-scale-values":
      return stepPx(facts, "base") !== null && typeSteps(facts).length >= 2;
    case "spacing-values":
      return typeof facts.spacing === "number" && facts.spacing >= 2;
    case "radius-value":
      return radiusSteps(facts).length > 0;
    case "target-size":
      // A don't is a control below the target, still large enough to see.
      return typeof facts.target === "number" && facts.target > 12;
    default:
      return true;
  }
}

// The rules the book shows an example for: those the repository's ledger holds, and the facts can
// draw.
export function exampleRules(facts) {
  const held = new Set(facts.rules ?? []);
  return EXAMPLE_RULES.filter((rule) => held.has(rule) && drawable(rule, facts));
}

const box = (style, inner) => `<div class="ex-box" style="${escape(style)}">${inner}</div>`;

// The pair of one rule, as HTML, with the numbers it was measured by.
function pairOf(rule, facts, w) {
  const words = w.examples?.[rule] ?? {};
  const base = { rule, title: words.title ?? rule, why: words.why ?? "" };
  switch (rule) {
    case "color-contrast": {
      const primary = colorOf(facts, "primary");
      const onPrimary = colorOf(facts, "primary-foreground");
      // The text of the do, mixed into the primary it sits on until the ratio fails: written as a
      // mix of the repository's two colours, never as a colour of its own.
      const faint = faintMix(onPrimary, primary);
      const doRatio = contrast(parseColor(onPrimary), parseColor(primary));
      const dontRatio = faint.ratio;
      const button = (color, ratio) =>
        `${box(`background:${primary};color:${color};padding:10px 18px;display:inline-block;font-weight:600`, escape(words.label ?? "Save"))}<small class="ex-ratio">${shown(ratio)}</small>`;
      return {
        ...base,
        doRatio,
        dontRatio,
        do: button(onPrimary, doRatio),
        dont: button(faint.css, dontRatio),
      };
    }
    case "type-scale-values": {
      const taken = typeSteps(facts).map((item) => item.px);
      const body = stepPx(facts, "base");
      const heading =
        [...taken].filter((px) => px > body && px <= 28).sort((a, b) => b - a)[0] ??
        Math.max(...taken);
      const note = stepPx(facts, "sm") ?? Math.min(...taken);
      const text = (h, b, n) =>
        `<div class="ex-type"><div style="font-size:${h}px;font-weight:620;line-height:1.2">${escape(words.heading ?? "Heading")}</div><div style="font-size:${b}px;line-height:1.5">${escape(words.body ?? "Body text")}</div><div style="font-size:${n}px;line-height:1.5;opacity:.7">${escape(words.note ?? "Note")}</div></div>`;
      return {
        ...base,
        do: text(heading, body, note),
        // Sizes between the steps that blur the order without turning it over: a heading barely
        // above the body, and a note barely below it.
        dont: text(
          offScale(offScale(body, taken, 1) + 1.5, taken, 1),
          offScale(body, taken, 1),
          offScale(body, taken, -1),
        ),
      };
    }
    case "spacing-values": {
      const unit = facts.spacing;
      const stack = (pad, gap, inner) =>
        `<div class="ex-stack" style="display:flex;flex-direction:column;padding:${pad}px;gap:${gap}px">${inner}</div>`;
      const item = (margin) =>
        margin > 0
          ? `<div class="ex-line" style="margin-left:${margin}px"></div>`
          : `<div class="ex-line"></div>`;
      const off = (n) => (n % unit === 0 ? n + 1 : n);
      return {
        ...base,
        do: stack(unit * 4, unit * 2, [0, 0, 0].map(() => item(0)).join("")),
        // Edges that almost line up: each line starts a few pixels off the one above.
        dont: stack(
          off(unit * 3 + 1),
          off(unit * 2 - 1),
          [off(unit + 1), 0, off(unit * 3 - 1)].map(item).join(""),
        ),
      };
    }
    case "radius-value": {
      const steps = radiusSteps(facts);
      const middle = steps[Math.floor((steps.length - 1) / 2)];
      const wrong = offCorners(steps);
      const shapes = ([card, button, field]) =>
        `<div class="ex-shapes"><div class="ex-card" style="border-radius:${card}px"></div><div class="ex-button" style="border-radius:${button}px"></div><div class="ex-field" style="border-radius:${field}px"></div></div>`;
      return { ...base, do: shapes([middle, middle, middle]), dont: shapes(wrong) };
    }
    case "target-size": {
      const control = (height) =>
        `<div class="ex-control" style="min-height:${height}px">${escape(words.label ?? "Remove")}</div>`;
      return {
        ...base,
        do: control(Math.max(facts.target, 32)),
        dont: control(Math.floor(facts.target * 0.6)),
      };
    }
    case "error-copy":
      return {
        ...base,
        do: `<div class="ex-alert">${escape(words.doText ?? "")}</div>`,
        dont: `<div class="ex-alert">${escape(words.dontText ?? "")}</div>`,
      };
    case "notification-channel":
      return {
        ...base,
        do: `<div class="ex-toast">${escape(words.doText ?? "")}</div>`,
        dont: `<div class="ex-dialog"><p>${escape(words.dontText ?? "")}</p><span>${escape(words.ok ?? "OK")}</span></div>`,
      };
    default:
      return null;
  }
}

// The pairs of every rule the book shows, in order.
export function examplePairs(facts, w) {
  return exampleRules(facts)
    .map((rule) => pairOf(rule, facts, w))
    .filter(Boolean);
}

// The stylesheet laid over the repository's own screen to break one rule, or null for a rule a
// stylesheet does not break. It sets the values the floor's components read, and nothing else.
export function breakingCss(rule, facts) {
  switch (rule) {
    case "color-contrast": {
      const ground = colorOf(facts, "background");
      const text = colorOf(facts, "foreground") ?? colorOf(facts, "primary");
      if (!ground || !text) return null;
      const faint = formatOklch(faintText(text, ground));
      return `:root {\n  --foreground: ${faint};\n  --muted-foreground: ${faint};\n  --card-foreground: ${faint};\n}\n`;
    }
    case "type-scale-values": {
      const steps = typeSteps(facts);
      const taken = steps.map((item) => item.px);
      if (taken.length === 0) return null;
      const lines = steps.map((item) => `  --text-${item.step}: ${offScale(item.px, taken)}px;`);
      return `:root {\n${lines.join("\n")}\n}\n`;
    }
    case "spacing-values": {
      const unit = facts.spacing;
      if (typeof unit !== "number") return null;
      const off = unit + 1.5;
      return `:root {\n  --spacing: ${off % unit === 0 ? off + 0.5 : off}px;\n}\n`;
    }
    case "radius-value": {
      // The same three corners the small example breaks with, none of them a step.
      const [card, button, field] = offCorners(radiusSteps(facts));
      return `button { border-radius: ${button}px !important; }\ninput, select, textarea { border-radius: ${field}px !important; }\ntable, [data-slot="card"], [role="dialog"] { border-radius: ${card}px !important; }\n`;
    }
    default:
      return null;
  }
}
