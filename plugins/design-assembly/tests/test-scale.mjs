import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BASE_PX,
  CORNER_RADII,
  modularScale,
  RATIOS,
  SPACING_UNIT_PX,
  toPx,
  toRatio,
  TYPE_STEPS,
  typeDeclarations,
} from "../templates/tools/design-assembly/scale.mjs";
import {
  buildTheme,
  readVariable,
  renderBlock,
} from "../templates/tools/design-assembly/theme.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { layers } = JSON.parse(readFileSync(path.join(PLUGIN, "references/layers.json"), "utf8"));
const foundations = layers.find((layer) => layer.id === "foundations");
const option = (key) => Object.keys(foundations.choices.find((c) => c.key === key).options);

test("the options the guide offers are exactly the ones the engine knows", () => {
  assert.deepEqual(option("type_ratio"), Object.keys(RATIOS));
  assert.deepEqual(option("corner_radius"), Object.keys(CORNER_RADII));
  assert.deepEqual(option("spacing_unit"), [`${SPACING_UNIT_PX}px`]);
});

for (const name of Object.keys(RATIOS)) {
  test(`${name}: steps grow by the ratio, text-base stays the base, lines sit on the 4px grid`, () => {
    const scale = modularScale(name);
    assert.deepEqual(
      scale.map((s) => s.step),
      TYPE_STEPS.map(([step]) => step),
    );
    assert.equal(scale.find((s) => s.step === "base").size, BASE_PX);
    scale.forEach((entry, index) => {
      const power = TYPE_STEPS[index][1];
      assert.ok(Math.abs(entry.size - BASE_PX * RATIOS[name] ** power) <= 0.5, entry.step);
      assert.equal(entry.lineHeight % SPACING_UNIT_PX, 0, `${entry.step} line height`);
      assert.ok(entry.lineHeight >= entry.size, `${entry.step} lines overlap`);
      if (index > 0) assert.ok(entry.size > scale[index - 1].size, `${entry.step} not larger`);
    });
  });
}

test("written declarations read back as the sizes and line heights they came from", () => {
  const scale = modularScale("minor-third");
  const css = `:root {\n  ${typeDeclarations(scale).join("\n  ")}\n}\n`;
  for (const { step, size, lineHeight } of scale) {
    assert.equal(toPx(readVariable(css, ":root", `--text-${step}`)), size);
    const ratio = toRatio(readVariable(css, ":root", `--text-${step}--line-height`));
    assert.ok(Math.abs(ratio * size - lineHeight) < 1e-9);
  }
});

test("without type scale or shape, the block is what the first version wrote", () => {
  const floor = ":root {\n  --background: oklch(1 0 0);\n}\n";
  const base = { sourceColor: "#0246ff", conformanceLevel: "AA" };
  const old = renderBlock(buildTheme(base, floor));
  assert.doesNotMatch(old, /--radius|--text-/);
  const standard = renderBlock(
    buildTheme({ ...base, typeScale: "standard", cornerRadius: "small" }, floor),
  );
  assert.match(standard, /--radius: 0\.5rem;/);
  assert.doesNotMatch(standard, /--text-/);
  const modular = renderBlock(
    buildTheme(
      { ...base, typeScale: "modular", typeRatio: "major-third", cornerRadius: "floor" },
      floor,
    ),
  );
  assert.match(modular, /--text-5xl: 3\.8125rem;/);
  assert.throws(() => modularScale("golden"), /ratio must be one of/);
  assert.throws(() => buildTheme({ ...base, cornerRadius: "round" }, floor), /corner radius/);
});
