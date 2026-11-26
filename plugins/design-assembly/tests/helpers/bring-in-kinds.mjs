// What the bridge in prints for the kinds item 13.1 does not change (a token file, a DESIGN.md, a
// system folder), on a repository where nothing was settled and on one whose owner settled the
// colour, the type scale and the corner radius, and on one whose owner settled the typeface too;
// and the sheet of directions of that repository
// with nothing brought in and with a token file brought in. The record of what plugin 0.76.0
// printed (`bring-in-kinds-on-0.76.0.json`) was made with this module before item 13.1 was built,
// so a test can show that these kinds read the same after it. No command reaches the network.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { env, execPath } from "node:process";
import { fileURLToPath } from "node:url";

import { specimenPlan } from "../../scripts/specimen.mjs";
import { withoutBlock } from "../../templates/tools/design-assembly/theme.mjs";
import { DESIGN_MD, TOKENS } from "./bring-in-samples.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "../..");
const ROOT = path.resolve(PLUGIN, "../..");
const BRING_IN = path.join(PLUGIN, "scripts/bring-in.mjs");
const NO_NETWORK = path.join(HERE, "no-network.mjs");
const ON = "2026-11-23";

export const RECORD = path.join(HERE, "bring-in-kinds-on-0.76.0.json");

const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
  return path.join(dir, file);
};

// A repository with the floor's stylesheet, and the owner's foundations when `settled`: with the
// floor's typeface for text and headings when `settled` is "typeface".
function repository(made, settled) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "design-bring-in-kinds-")));
  made.push(dir);
  put(dir, "src/index.css", withoutBlock(readFileSync(path.join(ROOT, "src/index.css"), "utf8")));
  if (settled) {
    const foundations = {
      status: "decided",
      source: "user",
      choice: {
        source_color: "#0246ff",
        type_scale: "standard",
        spacing_unit: "4px",
        corner_radius: "small",
        ...(settled === "typeface" ? { text_font: "floor", heading_font: "text" } : {}),
      },
    };
    put(
      dir,
      "design/blueprint.json",
      `${JSON.stringify({ version: 1, status: "approved", layers: { foundations } })}\n`,
    );
  }
  put(dir, "outside/tokens.json", JSON.stringify(TOKENS));
  put(dir, "outside/DESIGN.md", DESIGN_MD);
  put(dir, "outside/system/tokens.json", JSON.stringify(TOKENS));
  put(dir, "outside/system/README.md", "# Clay Studio\n\nA warm system for a studio.\n");
  return dir;
}

const SOURCES = {
  tokens: "outside/tokens.json",
  "design-md": "outside/DESIGN.md",
  system: "outside/system",
};

const plain = (text, dir) => String(text).replaceAll(dir, "<repo>");

// What each kind prints on each repository, as text and as JSON, and how it ends; then the sheet.
export function observe(made) {
  const seen = {};
  for (const [state, settled] of [
    ["nothing settled", false],
    ["owner settled", true],
    ["owner settled a typeface", "typeface"],
  ]) {
    const dir = repository(made, settled);
    for (const [kind, file] of Object.entries(SOURCES)) {
      for (const json of [false, true]) {
        const run = spawnSync(
          execPath,
          [
            "--import",
            NO_NETWORK,
            BRING_IN,
            "--target",
            dir,
            "--from",
            path.join(dir, file),
            "--on",
            ON,
            "--dry-run",
            ...(json ? ["--json"] : []),
          ],
          { encoding: "utf8", env: { ...env } },
        );
        seen[`${state}, ${kind}${json ? ", --json" : ""}`] = {
          exit: run.status,
          out: plain(run.stdout, dir),
          err: plain(run.stderr, dir),
        };
      }
    }
    if (settled === true) {
      seen["sheet, nothing brought in"] = JSON.parse(
        plain(JSON.stringify(specimenPlan(dir, { section: "direction" })), dir),
      );
      seen["sheet, a token file brought in"] = JSON.parse(
        plain(
          JSON.stringify(
            specimenPlan(dir, { section: "direction", from: [path.join(dir, SOURCES.tokens)] }),
          ),
          dir,
        ),
      );
    }
  }
  return seen;
}

export const readRecord = () => JSON.parse(readFileSync(RECORD, "utf8"));
export const writeRecord = (data) => writeFileSync(RECORD, `${JSON.stringify(data, null, 2)}\n`);
