// Draws one screen of a repository for a review: at every width, in light and in dark, in the
// state it opens in or in every state the application's own screen list reaches. Each picture is
// read by the probe of the measures while its page is still open, so what is measured is what was
// drawn. Nothing is written here: a picture is handed back as bytes with the name its file would
// have, and the caller writes it once the whole review stands.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { readSources } from "../templates/tools/design-assembly/governance.mjs";
import { REGISTRY } from "../templates/tools/design-assembly/patterns.mjs";
import { Refusal } from "./command.mjs";
import { probe } from "./measure.mjs";
import { openStage, reachState, setDark } from "./stage.mjs";

export const SHOTS_FOLDER = "shots";
export const THEMES = ["light", "dark"];
// How long a state is given to settle once it is on the page, and how long a page may take to
// come to rest: a colour still moving to its dark value is no colour to measure.
const SETTLE_MS = 350;
const REST_MS = 2000;
// The window a width is drawn in; the picture is of the whole page, however tall.
const windowOf = (width) => ({ width, height: width < 600 ? 720 : 900 });
const firstLine = (error) => error.message.split("\n")[0];
// A name as part of a file's name: what a folder or an address would read as its own is taken out.
const slug = (name) => String(name).replace(/[^A-Za-z0-9_-]+/g, "-");

// The folders an application keeps its own source in, and its page where the build has one.
const SOURCE_FOLDERS = ["src", "app"];
const ENTRY_PAGE = "index.html";
// A line of source that sets dark on the page: the word dark, as a text, said to a class, an
// attribute or a theme.
const SWITCH = /(?:classList|className|setAttribute|dataset|[tT]heme)[^\n;]{0,80}["'`]dark["'`]/;

// The first source file of the application that sets dark itself, or null. Read from its text: a
// switch written another way is not seen, and the limits ledger says so.
export function darkSwitchIn(target) {
  const sources = Object.assign({}, ...SOURCE_FOLDERS.map((folder) => readSources(target, folder)));
  const page = path.join(target, ENTRY_PAGE);
  if (existsSync(page)) sources[ENTRY_PAGE] = readFileSync(page, "utf8");
  return (
    Object.keys(sources)
      .sort()
      .find((file) => SWITCH.test(sources[file])) ?? null
  );
}

// Runs inside the page: waits until every transition, and every animation that ends, has ended,
// or the limit has passed. One that never ends, as a turning circle, is not waited for.
function atRest(limit) {
  const { document, setTimeout } = globalThis;
  const ending = document
    .getAnimations()
    .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime));
  return Promise.race([
    Promise.all(ending.map((animation) => animation.finished.catch(() => null))).then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), limit)),
  ]);
}

// The states to draw and how each is reached: read from the application's own screen list where
// the build can load it, else the one state the screen opens in at its route. What is asked for
// and cannot be reached is said, never guessed at.
async function statesOf(stage, target, screen, all) {
  const [opens = "ready"] = screen.states;
  const listed = existsSync(path.join(target, REGISTRY));
  const entry =
    listed && stage.can.load
      ? ((await stage.load(`/${REGISTRY}`)).SCREENS ?? []).find(
          (item) => item.path === screen.route,
        )
      : null;
  if (!entry || entry.states.length === 0) {
    const why = !listed
      ? `there is no ${REGISTRY} to say how it is reached`
      : !stage.can.load
        ? `${REGISTRY} cannot be loaded on this build`
        : `${REGISTRY} does not list ${screen.route}`;
    return {
      states: [{ name: opens, shows: null }],
      left: all ? screen.states.slice(1).map((name) => ({ state: name, why })) : [],
    };
  }
  const names = entry.states.map((state) => state.name);
  return {
    states: all ? entry.states : entry.states.slice(0, 1),
    left: all
      ? screen.states
          .filter((name) => !names.includes(name))
          .map((name) => ({ state: name, why: `${REGISTRY} does not say how it is reached` }))
      : [],
  };
}

// What a page looks like to the measures, as one text: two pages with the same text are painted
// the same colours. How faint a layer is drawn is left out: a part that pulses while it waits is
// the same look at every moment.
const lookOf = (probed) =>
  JSON.stringify([
    probed.paper,
    probed.texts.map((text) => [text.color, text.layers.map((layer) => layer.color)]),
  ]);

// How a user of the application comes to dark, or that none was found.
function reachOf({ exists, follows }, target) {
  if (!exists) {
    return {
      name: "dark",
      drawn: false,
      reachable: false,
      how: "neither the system asking for dark nor a dark class on the root changes this screen: the application has no dark theme this command can turn on",
    };
  }
  if (follows) {
    return {
      name: "dark",
      drawn: true,
      reachable: true,
      how: "the screen turns dark when the system asks for dark",
    };
  }
  const file = darkSwitchIn(target);
  return {
    name: "dark",
    drawn: true,
    reachable: file !== null,
    how: file
      ? `a source file of the application sets dark itself: ${file}`
      : "no switch to dark was found: the screen looks the same when the system asks for dark, and no source file of the application sets dark itself",
  };
}

// One picture: the state reached on a new page of the window, put in its theme, read by the
// probe, and taken where pictures are kept. Gives the picture, or null where the state could not
// be shown, read or taken, which is added to `left`. The first picture of each theme says what the
// theme is: `seen` keeps what light looks like, whether the screen follows the system into dark,
// and whether dark is another look at all.
async function shoot(stage, context, { screen, state, width, theme, first, keep }, seen, left) {
  const page = await context.newPage();
  try {
    const shown = await reachState(page, stage.origin, { path: screen.route }, state);
    if (!shown) throw new Error("it shows no main region");
    await page.waitForTimeout(SETTLE_MS);
    await page.evaluate(atRest, REST_MS);
    if (theme === "dark") {
      if (first) seen.follows = lookOf(await page.evaluate(probe)) !== seen.light;
      await setDark(page, true);
      await page.evaluate(atRest, REST_MS);
    }
    const probed = await page.evaluate(probe);
    if (first && theme === "light") seen.light = lookOf(probed);
    if (first && theme === "dark" && lookOf(probed) === seen.light) {
      seen.exists = false;
      return null;
    }
    const id = `${slug(screen.id)}-${slug(state.name)}-${width}-${theme}`;
    return {
      id,
      state: state.name,
      width,
      theme,
      file: keep ? `${SHOTS_FOLDER}/${id}.png` : null,
      page: probed.page,
      probed,
      bytes: keep ? await page.screenshot({ fullPage: true }) : null,
    };
  } catch (error) {
    left.push({ state: state.name, width, theme, why: firstLine(error) });
    return null;
  } finally {
    await page.close();
  }
}

// Every picture of the plan: each width, light then dark, each state. A screen whose first
// picture cannot be drawn is refused; a later one that cannot is left out and said.
async function shootAll(stage, screen, plan, { widths, keep }, seen, left) {
  const shots = [];
  for (const width of widths) {
    for (const theme of THEMES) {
      if (theme === "dark" && !seen.exists) continue;
      const context = await stage.browser.newContext({
        viewport: windowOf(width),
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        colorScheme: theme,
      });
      try {
        for (const state of plan.states) {
          const first = width === widths[0] && state === plan.states[0];
          const shot = await shoot(
            stage,
            context,
            { screen, state, width, theme, first, keep },
            seen,
            left,
          );
          if (shot) shots.push(shot);
          else if (first && theme === "light" && seen.light === null) {
            throw new Refusal(
              `${screen.id} could not be drawn at ${screen.route}: ${left.at(-1).why}`,
            );
          }
          if (!seen.exists) break;
        }
      } finally {
        await context.close();
      }
    }
  }
  return shots;
}

// Draws the screen. `keep` says whether each picture is taken as well as read. Gives each picture
// with what the probe read on it, the themes with whether a user can reach each, and what was
// asked for and not drawn. A repository with nothing to draw with is refused.
export async function drawScreen(target, screen, { widths, all = false, keep = false }) {
  const stage = await openStage(target);
  if (stage.problem) {
    throw new Refusal(`this repository has no build the plugin can draw: ${stage.problem}`);
  }
  const seen = { light: null, exists: true, follows: false };
  let shots;
  let plan;
  try {
    plan = await statesOf(stage, target, screen, all);
    shots = await shootAll(stage, screen, plan, { widths, keep }, seen, plan.left);
  } catch (error) {
    if (error instanceof Refusal) throw error;
    throw new Refusal(`drawing ${screen.id} stopped: ${firstLine(error)}`);
  } finally {
    await stage.close();
  }
  // By state, then by width, light before dark: the order a person reads them in.
  const order = plan.states.map((state) => state.name);
  shots.sort(
    (a, b) =>
      order.indexOf(a.state) - order.indexOf(b.state) ||
      a.width - b.width ||
      THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme),
  );
  return {
    shots,
    themes: [{ name: "light", drawn: true, reachable: true }, reachOf(seen, target)],
    left: plan.left,
  };
}
