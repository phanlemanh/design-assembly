// What every page this plugin hands to a person has in common, so that the handoff book and the
// documents of the commands read as one family: the look, taken from the repository's own design
// tokens, and the line that says which state of the repository a page was made from.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_STYLESHEET,
  findStylesheet,
  loadStyles,
  resolve,
} from "../templates/tools/design-assembly/styles.mjs";
import { tokenCss, TOKENS } from "../templates/tools/design-assembly/tokens.mjs";

export const escape = (text) =>
  String(text).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const git = (target, ...args) => {
  const run = spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
  return run.status === 0 ? run.stdout.trim() : null;
};

// Which state of a repository a page was made from: its name, its last commit, and the day of
// that commit. Nothing here is read from a clock, so the same state gives the same answer. A plus
// after the revision says the repository had changes not yet committed. `apart` is a folder the
// page itself is written to: it is not the repository's state, even when it lies inside it.
export function originOf(target, { apart = null } = {}) {
  let name = null;
  try {
    name = JSON.parse(readFileSync(path.join(target, "package.json"), "utf8")).name ?? null;
  } catch {
    name = null;
  }
  const head = git(target, "rev-parse", "--short", "HEAD");
  const inside = apart === null ? "" : path.relative(target, apart);
  const kept = inside !== "" && !inside.startsWith("..") && !path.isAbsolute(inside);
  const changed =
    head === null
      ? null
      : git(
          target,
          "status",
          "--porcelain",
          ...(kept ? ["--", ".", `:(exclude)${inside.split(path.sep).join("/")}`] : []),
        );
  return {
    name: typeof name === "string" && name.trim() !== "" ? name : path.basename(target),
    revision: head === null ? null : `${head}${changed === "" ? "" : "+"}`,
    // The day of the last commit, as the commit itself writes it.
    date: head === null ? null : git(target, "log", "-1", "--format=%cs"),
  };
}

// The look of a repository, as far as a page of the family uses it: its color roles in light, its
// corner radii, its type sizes, its font. Read from the design tokens file and the stylesheet; a
// repository that has neither gives an empty look, and the page falls back to plain values.
export function readLook(target) {
  let tokens = {};
  let font = null;
  try {
    tokens = JSON.parse(readFileSync(path.join(target, TOKENS), "utf8")) ?? {};
  } catch {
    tokens = {};
  }
  try {
    const theme = existsSync(path.join(target, "design/theme.json"))
      ? JSON.parse(readFileSync(path.join(target, "design/theme.json"), "utf8"))
      : {};
    const stylesheet = theme.stylesheet ?? findStylesheet(target) ?? DEFAULT_STYLESHEET;
    const value = resolve(loadStyles(target, stylesheet), ":root", "--font-sans")?.value ?? null;
    font = /var\(/.test(value ?? "var(") ? null : value;
  } catch {
    font = null;
  }
  const values = (group, read) =>
    Object.fromEntries(
      Object.entries(tokens[group] ?? {}).flatMap(([name, token]) => {
        try {
          return [[name, read(token)]];
        } catch {
          return [];
        }
      }),
    );
  return {
    colors: values("color", tokenCss),
    radius: values("radius", (token) => token.$value),
    sizes: values("text", (token) => token.$value),
    font,
  };
}

// A value is written into a stylesheet only when it can be nothing but a value: a repository's
// file never gets to close the rule it is put in.
const PLAIN_VALUE = /^[\w\s#.,%()/*+-]+$/;
const PLAIN_FONT = /^[\w\s"',.-]+$/;
const plain = (value, fallback, shape = PLAIN_VALUE) =>
  typeof value === "string" && shape.test(value) ? value : fallback;

// The rules every page of the family starts from: the variables of the look, the sheet a part is
// set on, the eyebrow above a heading, the four sizes of heading, and the plain list. A page adds
// its own rules after these.
export function familyStyles(look = {}) {
  const color = (name, fallback) => plain(look.colors?.[name], fallback);
  const size = (step, fallback) => plain(look.sizes?.[step], fallback);
  const font = plain(look.font, "system-ui, sans-serif", PLAIN_FONT);
  return `  :root {
    --bg: ${color("background", "#fff")}; --fg: ${color("foreground", "#111")};
    --muted: ${color("muted-foreground", "#666")}; --surface: ${color("muted", "#f4f4f5")};
    --line: ${color("border", "#e4e4e7")}; --accent: ${color("primary", "#111")};
    --on-accent: ${color("primary-foreground", "#fff")}; --radius: ${plain(look.radius?.lg, "0.5rem")};
    --xs: ${size("xs", "0.75rem")}; --sm: ${size("sm", "0.875rem")}; --base: ${size("base", "1rem")};
    --lg: ${size("lg", "1.125rem")}; --xl: ${size("xl", "1.25rem")}; --h2: ${size("3xl", "1.875rem")};
    --h1: ${size("5xl", "3rem")};
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: var(--sm)/1.55 ${font}; -webkit-font-smoothing: antialiased; }
  .book { max-width: 1240px; margin: 0 auto; padding: 0 56px 96px; }
  .sheet { padding: 72px 0 56px; border-top: 1px solid var(--line); break-inside: avoid-page; }
  .sheet.cover { border-top: 0; padding-top: 96px; }
  .eyebrow { margin: 0 0 12px; font-size: var(--xs); letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
  .eyebrow span { color: var(--accent); margin-right: 12px; font-variant-numeric: tabular-nums; }
  h1 { margin: 0; font-size: var(--h1); line-height: 1.05; letter-spacing: -0.02em; font-weight: 650; }
  h2 { margin: 0; font-size: var(--h2); line-height: 1.15; letter-spacing: -0.01em; font-weight: 620; max-width: 24ch; }
  h3 { margin: 40px 0 12px; font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  h4 { margin: 20px 0 8px; font-size: var(--xs); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
  .lede { margin: 16px 0 0; max-width: 62ch; font-size: var(--lg); line-height: 1.5; color: var(--muted); }
  .muted { color: var(--muted); margin: 8px 0 0; }
  code, .mono { font: 0.92em ui-monospace, SFMono-Regular, Menlo, monospace; }
  .plain { margin: 0; padding: 0; list-style: none; }
  .plain li { padding: 10px 0; border-top: 1px solid var(--line); max-width: 62ch; }
  .two, .cover-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 72px; }
  .cover-grid { margin-top: 56px; }
  .two { margin-top: 48px; }
  .cover-grid h3:first-child, .two h3:first-child { margin-top: 0; }
  .big { margin: 0; display: flex; align-items: baseline; gap: 12px; line-height: 1; }
  .big b { font-size: 112px; font-weight: 650; letter-spacing: -0.04em; }
  .big span { font-size: var(--h2); color: var(--muted); }
  .note { margin: 20px 0 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); }`;
}
