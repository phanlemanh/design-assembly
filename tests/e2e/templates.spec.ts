// decision:one-main-one-h1 decision:no-sideways-scroll decision:wcag-aa
// Every state of every screen, at every width of design/screen-sizes.json: one main region and one
// top heading, no sideways scroll, and the automated accessibility checks. The widths are a
// person's list; the narrowest is the reflow width of WCAG 2.2.
import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { ROUTES } from "./routes.ts";

const sizes = JSON.parse(
  readFileSync(new URL("../../design/screen-sizes.json", import.meta.url), "utf8"),
) as { widths: number[] };

for (const route of ROUTES) {
  for (const width of sizes.widths) {
    test(`page ${route.title} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route.url);
      // Reach the state the way a person does, then wait until it is on the page.
      for (const step of route.steps) {
        if ("press" in step)
          await page.getByRole("button", { name: step.press, exact: true }).click();
        else await page.getByLabel(step.fill, { exact: true }).fill(step.text);
      }
      await page.waitForFunction((text) => document.body.textContent?.includes(text), route.shows);
      // An open dialog hides the page behind it from assistive tech; the structure is still there.
      const structure = "one-main-one-h1: a page has exactly one main region and one top heading";
      await expect(page.getByRole("main", { includeHidden: true }), structure).toHaveCount(1);
      await expect(
        page.getByRole("heading", { level: 1, includeHidden: true }),
        structure,
      ).toHaveCount(1);
      // Let what is opening finish, so the page is measured as a person sees it.
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined)),
        ),
      );
      // A part that needs two dimensions, such as a table of data, scrolls inside itself.
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        sideways,
        `no-sideways-scroll: the page is ${sideways}px wider than a ${width}px screen. Let the wide part wrap, or scroll inside itself`,
      ).toBeLessThanOrEqual(0);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(
        violations.map(
          (violation) => `${violation.id}: ${violation.help} (${violation.nodes[0]?.html})`,
        ),
        "wcag-aa: the automated accessibility checks found these",
      ).toEqual([]);
    });
  }
}
