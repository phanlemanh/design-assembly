// Colour maths for design-assembly. Pure functions, no dependencies.
// A colour is { l, c, h }: OKLCH lightness 0..1, chroma, hue in degrees.

const round = (value, places) => Number(value.toFixed(places));

function toLinear(channel) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

// OKLCH to linear sRGB, unclamped: values outside 0..1 mean the colour is out of gamut.
export function oklchToLinear({ l, c, h }) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

export function hexToOklch(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`"${hex}" is not a #rrggbb colour`);
  const [r, g, b] = [0, 2, 4].map((at) => toLinear(parseInt(match[1].slice(at, at + 2), 16) / 255));
  const L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const M = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const S = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
  const a = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
  const bb = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
  const c = Math.hypot(a, bb);
  const h = c < 1e-6 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
}

export function inGamut(color) {
  return oklchToLinear(color).every((v) => v >= -0.0005 && v <= 1.0005);
}

// The same lightness and hue with the highest chroma the screen can show, never above the asked one.
export function clipChroma(color) {
  if (inGamut(color)) return color;
  let low = 0;
  let high = color.c;
  for (let i = 0; i < 24; i += 1) {
    const middle = (low + high) / 2;
    if (inGamut({ ...color, c: middle })) low = middle;
    else high = middle;
  }
  return { ...color, c: low };
}

// Relative luminance as WCAG defines it, from linear sRGB.
export function luminance(color) {
  const [r, g, b] = oklchToLinear(color).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(first, second) {
  const [high, low] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// The value as it is written to CSS. Rounded here once, so what is checked is what is shipped.
export function formatOklch(color) {
  return `oklch(${round(color.l, 3)} ${round(color.c, 3)} ${round(color.h, 2)})`;
}

// Reads `oklch(L C H)` or `#rrggbb`. Returns null for anything else, such as a value with alpha.
export function parseColor(text) {
  const value = text.trim();
  if (value.startsWith("#")) return hexToOklch(value);
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value);
  if (!match) return null;
  const l = Number(match[1]) / (match[2] === "%" ? 100 : 1);
  return { l, c: Number(match[3]), h: Number(match[4]) };
}

// The colour exactly as CSS will hold it. Lightness and hue are rounded first, then chroma is cut to
// what the screen shows at those rounded values and rounded down, so rounding never pushes the
// written colour out of gamut: the browser renders the value the checks computed with.
export function asWritten(color) {
  const l = round(color.l, 3);
  const h = round(color.h, 2);
  let c = Math.floor(clipChroma({ l, c: color.c, h }).c * 1000) / 1000;
  while (c > 0 && !inGamut({ l, c, h })) c = round(c - 0.001, 3);
  return { l, c, h };
}
