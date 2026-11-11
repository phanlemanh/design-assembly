import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contrast,
  hexToOklch,
  inGamut,
  luminance,
  parseColor,
} from "../templates/tools/design-assembly/color.mjs";
import {
  applyBlock,
  buildTheme,
  readBlock,
  readVariable,
  renderBlock,
  THRESHOLDS,
  withoutBlock,
} from "../templates/tools/design-assembly/theme.mjs";

const FLOOR = [
  ":root {",
  "  --background: oklch(1 0 0);",
  "  --primary: oklch(0.205 0 0);",
  "}",
  "",
  ".dark {",
  "  --background: oklch(0.145 0 0);",
  "}",
  "",
].join("\n");
const SOURCES = ["#0246ff", "#ffba00", "#e5484d", "#00c853", "#808080", "#ffffff", "#000000"];
const WHITE = { l: 1, c: 0, h: 0 };
const BLACK = { l: 0, c: 0, h: 0 };

test("contrast of black on white is 21, and of a colour on itself is 1", () => {
  assert.equal(Math.round(contrast(BLACK, WHITE) * 100) / 100, 21);
  assert.equal(contrast(hexToOklch("#0246ff"), hexToOklch("#0246ff")), 1);
});

test("a hex colour survives the trip to OKLCH: its luminance is the one WCAG computes", () => {
  // #808080 is 128/255 on every channel, so its luminance is that one channel made linear. The
  // expected value is computed here from the sRGB formula, not typed in.
  const expected = ((128 / 255 + 0.055) / 1.055) ** 2.4;
  assert.ok(Math.abs(luminance(hexToOklch("#808080")) - expected) < 1e-6);
  assert.equal(Math.round(luminance(hexToOklch("#ffffff")) * 10000) / 10000, 1);
  assert.throws(() => hexToOklch("blue"), /not a #rrggbb colour/);
});

test("the same source color gives the same block, byte for byte", () => {
  const inputs = { sourceColor: "#0246ff", conformanceLevel: "AA" };
  const first = renderBlock(buildTheme(inputs, FLOOR));
  const second = renderBlock(buildTheme(inputs, applyBlock(FLOOR, first)));
  assert.equal(first, second);
  assert.notEqual(first, renderBlock(buildTheme({ ...inputs, sourceColor: "#0246fe" }, FLOOR)));
});

for (const level of Object.keys(THRESHOLDS)) {
  for (const sourceColor of SOURCES) {
    test(`${sourceColor} at ${level}: every color role read back from the CSS meets the threshold`, () => {
      const css = applyBlock(
        FLOOR,
        renderBlock(buildTheme({ sourceColor, conformanceLevel: level }, FLOOR)),
      );
      for (const scope of [":root", ".dark"]) {
        const read = (name) => parseColor(readVariable(css, scope, name));
        const min = THRESHOLDS[level].text;
        assert.ok(contrast(read("--primary"), read("--background")) >= min, `${scope} primary`);
        assert.ok(
          contrast(read("--primary-foreground"), read("--primary")) >= min,
          `${scope} on-primary`,
        );
        assert.ok(inGamut(read("--primary")), `${scope} primary is displayable`);
      }
    });
  }
}

test("a source color that already meets the threshold is kept as the primary", () => {
  const theme = buildTheme({ sourceColor: "#0246ff", conformanceLevel: "AA" }, FLOOR);
  const light = theme.modes.find((mode) => mode.selector === ":root");
  assert.equal(light.adjusted, false);
  const yellow = buildTheme({ sourceColor: "#ffba00", conformanceLevel: "AA" }, FLOOR);
  assert.equal(yellow.modes.find((mode) => mode.selector === ":root").adjusted, true);
});

test("the tonal palette runs from black to white and gets lighter at every tone", () => {
  const { palette } = buildTheme({ sourceColor: "#0246ff", conformanceLevel: "AA" }, FLOOR);
  const values = palette.map((entry) => luminance(entry.color));
  assert.equal(palette[0].tone, 0);
  assert.equal(palette.at(-1).tone, 100);
  assert.ok(values[0] < 0.001 && values.at(-1) > 0.99);
  values.slice(1).forEach((value, index) => assert.ok(value > values[index], `tone ${index + 1}`));
  // Tone 50 is mid lightness: luminance 0.184 by the CIE definition.
  const mid = luminance(palette.find((entry) => entry.tone === 50).color);
  assert.ok(Math.abs(mid - 0.184) < 0.005, `tone 50 luminance is ${mid}`);
});

test("the background the repository declares is the one the roles are solved against", () => {
  const dim = FLOOR.replace("oklch(1 0 0)", "oklch(0.8 0 0)");
  const onWhite = buildTheme({ sourceColor: "#0246ff", conformanceLevel: "AA" }, FLOOR);
  const onDim = buildTheme({ sourceColor: "#0246ff", conformanceLevel: "AA" }, dim);
  assert.ok(onDim.modes[0].primary.l < onWhite.modes[0].primary.l);
});

test("the block can be taken out again, leaving the stylesheet as it was", () => {
  const block = renderBlock(buildTheme({ sourceColor: "#0246ff", conformanceLevel: "AA" }, FLOOR));
  const applied = applyBlock(FLOOR, block);
  assert.equal(readBlock(applied), block);
  assert.equal(readBlock(FLOOR), null);
  assert.equal(withoutBlock(applied), FLOOR);
  assert.throws(() => buildTheme({ sourceColor: "#0246ff", conformanceLevel: "A" }, FLOOR));
});
