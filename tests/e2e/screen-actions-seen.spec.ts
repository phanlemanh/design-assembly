// decision:screen-actions-seen
// Each built screen opened as each role that opens it, at the narrowest and the widest width of
// design/screen-sizes.json. The ledger of screens and the domain model say which buttons a role
// may press there, and the gate works that out (tools/design-assembly/screen-actions.mjs); this
// test reads that very plan, enters as the role through tests/e2e/roles.ts, walks every state of
// the screen by the steps the screen list declares, and records every control marked
// data-model-action="<action name>". A role sees each of its buttons at least once and none it may not
// press; a locked button still counts as seen. A role that holds every action of the screen
// reaches every state. A role that opens no screen is not walked yet, but every test checks that
// each role of the model has its way in.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import {
  doorProblem,
  MARK,
  seenProblems,
  walkPlanOf,
  widthsOf,
  type SeenState,
} from "../../tools/design-assembly/screen-actions-seen.mjs";
import { DOORS } from "./roles.ts";
import { ROUTES, type Route } from "./routes.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DOOR_FILE = "tests/e2e/roles.ts";
const sizes = JSON.parse(
  readFileSync(new URL("../../design/screen-sizes.json", import.meta.url), "utf8"),
) as { widths: number[] };
// How long one step, or the words of a state, may take to come before the state counts as not
// reached.
const WAIT_MS = 10_000;

// The path a route opens, and the name of its state, as the screen list gives them.
const pathOf = (route: Route) => route.url.split("?")[0] ?? route.url;
const stateOf = (route: Route) => {
  const at = pathOf(route);
  return route.title.startsWith(`${at} `) ? route.title.slice(at.length + 1) : route.title;
};

// Every mark on the page now, of every control there, locked or not.
const marksOn = (page: Page) =>
  page.evaluate(
    (mark) =>
      [...document.querySelectorAll(`[${mark}]`)].map((node) => node.getAttribute(mark) ?? ""),
    MARK,
  );

// Let what is opening finish, so the page is read as a person sees it.
const settle = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );

// One state, reached the way a person reaches it. The marks are read before each step as well as
// at the end, so a control seen on the way counts: the list a row's button opens, for one. A role
// that lacks an action of the screen may lack the control a step presses: `absent` keeps each
// control it already waited for in vain, so a later state that needs it stops at once. A role that
// holds every action passes none, and waits for every control.
async function walk(page: Page, route: Route, absent?: Set<string>): Promise<SeenState> {
  const name = stateOf(route);
  const marks = new Set<string>();
  const read = async () => (await marksOn(page)).forEach((mark) => marks.add(mark));
  const missed = (why: string): SeenState => ({ name, reached: false, why, marks: [...marks] });
  await page.goto(route.url);
  for (const step of route.steps) {
    const control =
      "press" in step
        ? page.getByRole("button", { name: step.press, exact: true })
        : page.getByLabel(step.fill, { exact: true });
    const said =
      "press" in step ? `the control to press, «${step.press}»` : `the field «${step.fill}»`;
    if (absent?.has(said)) return missed(`${said} is not on the page`);
    try {
      await control.waitFor({ timeout: WAIT_MS });
    } catch {
      absent?.add(said);
      return missed(`${said} is not on the page`);
    }
    await read();
    try {
      if ("press" in step) await control.click({ timeout: WAIT_MS });
      else await control.fill(step.text, { timeout: WAIT_MS });
    } catch {
      return missed(`${said} could not be used`);
    }
  }
  try {
    await page.waitForFunction((text) => document.body.textContent?.includes(text), route.shows, {
      timeout: WAIT_MS,
    });
  } catch {
    return missed(`«${route.shows}» never appeared`);
  }
  await settle(page);
  await read();
  return { name, reached: true, marks: [...marks] };
}

const plan = walkPlanOf(ROOT);
// Every role of the model, whether it opens a screen or not.
const roles = [...new Set(plan.map((item) => item.role))];

for (const row of plan.filter((item) => item.opens)) {
  const routes = ROUTES.filter((route) => pathOf(route) === row.route);
  for (const width of widthsOf(sizes)) {
    test(`screen ${row.screen} as ${row.role} at ${width}px`, async ({ page }) => {
      // Every state of the screen, one after another.
      test.slow();
      expect(
        roles.map((role) => doorProblem(role, DOORS, DOOR_FILE)).filter(Boolean),
        "screen-actions-seen: every role of the domain model has a way in",
      ).toEqual([]);
      expect(
        routes.length,
        `screen-actions-seen: screen ${row.screen} opens at ${row.route}, and the screen list has no state there. List its states in the screen list, or correct its route in the ledger of screens`,
      ).toBeGreaterThan(0);
      await page.setViewportSize({ width, height: 800 });
      await DOORS[row.role]?.(page);
      const states: SeenState[] = [];
      const absent = row.holdsAll ? undefined : new Set<string>();
      for (const route of routes) states.push(await walk(page, route, absent));
      expect(
        seenProblems(row, states, { width }),
        "screen-actions-seen: each role sees the buttons the ledger of screens and the domain model give it, and no other",
      ).toEqual([]);
    });
  }
}
