// decision:one-main-one-h1 decision:no-sideways-scroll decision:wcag-aa decision:focus-after-action
// decision:row-actions-in-view decision:asked-action-closes
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
      // Reach the state the way a person does, then wait until it is on the page. Where each
      // pressed control sat is kept: on a row (its table body, or the list a row's button opens),
      // in a dialog that asks, in a dialog that is a form, or elsewhere on the page.
      const places: string[] = [];
      for (const step of route.steps) {
        if ("press" in step) {
          const control = page.getByRole("button", { name: step.press, exact: true });
          places.push(
            await control.evaluate((button) => {
              const dialog = button.closest("[data-slot=dialog-content], [role=alertdialog]");
              if (dialog) return dialog.querySelector("input, textarea, select") ? "form" : "asks";
              return button.closest("tbody, [data-row-actions]") ? "row" : "page";
            }),
          );
          await control.click();
        } else {
          places.push("field");
          await page.getByLabel(step.fill, { exact: true }).fill(step.text);
        }
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
      // A table may scroll sideways inside itself, but what a person does with a row stays in
      // view: the controls of the first row are inside the window at every width.
      const row = page.locator("table tbody tr").first();
      if ((await row.count()) > 0 && (await row.isVisible())) {
        const outside = await row
          .getByRole("button")
          .evaluateAll(
            (buttons, edge) =>
              buttons
                .map((button) => button.getBoundingClientRect())
                .filter((box) => box.width > 0 && (box.left < 0 || box.right > edge)).length,
            width,
          );
        expect(
          outside,
          `row-actions-in-view: ${outside} control(s) of the first row are outside a ${width}px window. Keep the column of actions in place when the table scrolls sideways`,
        ).toBe(0);
        // What stays in place leaves room for what scrolls: the band between the pinned columns
        // is at least as wide as the widest column that scrolls through it.
        const cramped = await page
          .locator("table thead tr")
          .first()
          .evaluate((head) => {
            const place = head.closest("table")?.parentElement?.getBoundingClientRect().width ?? 0;
            const cells = [...head.children].map((cell) => ({
              width: cell.getBoundingClientRect().width,
              pinned: getComputedStyle(cell).position === "sticky",
            }));
            const pinned = cells.filter((cell) => cell.pinned).reduce((sum, c) => sum + c.width, 0);
            const widest = Math.max(0, ...cells.filter((c) => !c.pinned).map((c) => c.width));
            return Math.ceil(widest - (place - pinned));
          });
        expect(
          cramped,
          `row-actions-in-view: at ${width}px the pinned columns leave ${cramped}px too little to read the widest column that scrolls between them. Make the pinned columns narrower, or pin fewer, on a narrow screen`,
        ).toBeLessThanOrEqual(0);
      }
      // A record opens the way the person chose (design/blueprint.json, record panel; the gate's
      // record-panel row holds the choice, this measures what it draws): beside the
      // list where both fit, from 1024px, and in its place below that; over the list; or in its
      // place at every width. Inside the window either way, and, once a person opened it, with focus.
      const panel = page.locator("[data-record-panel]");
      if ((await panel.count()) > 0) {
        const seen = await panel.first().evaluate((node) => {
          const box = node.getBoundingClientRect();
          const place = document.querySelector("table")?.parentElement;
          const list = place?.checkVisibility() ? place.getBoundingClientRect() : null;
          return {
            layout: node.getAttribute("data-record-panel"),
            top: Math.round(box.top),
            left: Math.round(box.left),
            right: Math.round(box.right),
            listRight: list ? Math.round(list.right) : null,
            modal: node.closest("[role=dialog]") !== null,
            focused: node.contains(document.activeElement),
          };
        });
        const wrong = [];
        if (seen.left < 0 || seen.right > width) wrong.push("it is not inside the window");
        if (seen.layout === "beside" && width >= 1024) {
          if (seen.listRight === null) wrong.push("the list is hidden where both fit");
          else if (seen.listRight > seen.left) wrong.push("it is not beside the list");
        }
        if (seen.layout === "beside" && width < 1024 && seen.listRight !== null) {
          wrong.push("the list still shows where only one fits");
        }
        if (seen.layout === "over" && !seen.modal) wrong.push("it is not a dialog over the list");
        // A sheet over the list leaves the application frame's header, the page's banner: it
        // starts below it, and the header can still be seen and pressed.
        const banner = await page.evaluate(() => {
          const node = [...document.querySelectorAll("header, [role=banner]")].find(
            (item) =>
              item.getAttribute("role") === "banner" ||
              item.closest("main, article, aside, nav, section, [role=dialog]") === null,
          );
          if (!node) return null;
          const box = node.getBoundingClientRect();
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return { bottom: Math.round(box.bottom), clear: hit !== null && node.contains(hit) };
        });
        if (seen.layout === "over" && banner && seen.top < banner.bottom) {
          wrong.push("it starts above the bottom of the frame's header");
        }
        if (seen.layout === "over" && banner && !banner.clear) {
          wrong.push("something covers the frame's header");
        }
        if (seen.layout === "in-place" && seen.listRight !== null) {
          wrong.push("the list still shows beside it");
        }
        if (route.steps.length > 0 && !seen.focused) wrong.push("focus is not in it");
        expect(
          wrong,
          `record-panel: at ${width}px the record that opened ${seen.layout} the list is wrong: ${wrong.join("; ")}. Open it with WithRecord, never with a panel of the screen's own`,
        ).toEqual([]);
      }
      // An action on a row that asks first closes its dialog once the person answers: the row
      // waits for the answer on its own, so the other rows can still be used, and a failure is
      // told the way any action done at once tells it.
      if (places.at(-1) === "asks" && places.at(-2) === "row") {
        await expect(
          page.locator("[data-slot=dialog-content], [role=alertdialog]"),
          "asked-action-closes: the dialog that asked about a row is still open after the person answered. Close it at once and let the row's own button wait; tell the result in a toast",
        ).toHaveCount(0);
      }
      // Looked at last, once the page has settled: a control that left must not take focus with it.
      if (route.steps.some((step) => "press" in step)) {
        const lost = await page.evaluate(
          () => document.activeElement === null || document.activeElement === document.body,
        );
        expect(
          lost,
          "focus-after-action: after the last action nothing has focus. Move it to what follows the control that left, or back to where the person was",
        ).toBe(false);
      }
    });
  }
}
