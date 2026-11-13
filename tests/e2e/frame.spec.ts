// The application's frame names every screen in its header (design/behaviors.md, moving between
// screens). A name never breaks inside itself: at a narrow width the list of screens moves below
// the application's name and wraps between names. No sideways scroll does not prove this, since a
// broken name still fits. Found by trial 7, when a third screen broke every name at 320px.
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { SCREENS } from "../../src/screens.ts";

const sizes = JSON.parse(
  readFileSync(new URL("../../design/screen-sizes.json", import.meta.url), "utf8"),
) as { widths: number[] };
// The floor's browser checks also look at a phone of 390.
const widths = [...new Set([...sizes.widths, 390])];

for (const width of widths) {
  test(`frame names each screen on one line at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link")).toHaveCount(SCREENS.length);
    const broken = await nav.evaluate((region) =>
      [...region.querySelectorAll("span, a")]
        .filter((name) => {
          // One rectangle per line the text takes; a flex item is a block, so ask its text.
          const text = document.createRange();
          text.selectNodeContents(name);
          return new Set([...text.getClientRects()].map((line) => Math.round(line.top))).size > 1;
        })
        .map((name) => name.textContent),
    );
    expect(broken, `these names break across lines at ${width}px`).toEqual([]);
  });
}
