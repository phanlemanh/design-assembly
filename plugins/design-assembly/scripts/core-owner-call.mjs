// How the moves of slice 3 of item 7.2 are called and what they print (spec 0016, criteria 21, 23
// and 24). The core command reads its flags and hands each of these moves here.
//   --promote NEED   the family's owner promotes a block of a repository's own store into the core:
//                    0 once written (or it would be); 1 when the block came from an outside source
//                    whose licence line a person reads first (--licence-allows is their word)
//   --retire ID      the family's owner retires an answer, or a block (--block), from the core: 0
//   --propose ID     a member proposes upward what it holds otherwise, an answer or a block it
//                    took from the core and changed (--block): 0 once written, or when the same
//                    proposal waits already
//   --proposals      the proposals a core holds: 1 when one waits on the family's owner, else 0
//   --grant ID       the owner grants a proposal, carried out with --change or the replace: 0
//   --refuse ID      the owner refuses a proposal, with the reason: 0
// Every move ends with 2 on a wrong call, a repository or a core that cannot be read or reached, or
// a core of a newer shape; then nothing is written. None calls a model or the network.
import path from "node:path";

import { ADDRESS } from "../templates/tools/design-assembly/contract.mjs";
import { isDay } from "../templates/tools/design-assembly/waiting.mjs";
import { today } from "./asking.mjs";
import { finish, refuse } from "./command.mjs";
import { promoteBlock, promoteReport } from "./core-promote.mjs";
import {
  decideProposal,
  decideReport,
  listProposals,
  listReport,
  proposeReport,
  proposeToCore,
} from "./core-propose.mjs";
import { retireFromCore, retireReport } from "./core-retire.mjs";

export const OWNER_MOVES = [
  "--promote",
  "--retire",
  "--propose",
  "--proposals",
  "--grant",
  "--refuse",
];
export const OWNER_FLAGS = {
  "--promote": "value",
  "--retire": "value",
  "--propose": "value",
  "--proposals": "switch",
  "--grant": "value",
  "--refuse": "value",
  "--replace": "switch",
  "--adapter": "names",
  "--licence-allows": "switch",
  "--block": "switch",
};
export const OWNER_USAGE =
  "       node core.mjs --promote NEED|FILE --core DIR --by NAME --why TEXT [--replace] [--adapter KIND]... [--licence-allows] [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --retire ID [--block] --core DIR --by NAME --why TEXT [--on DATE] [--dry-run] [--json]\n" +
  "       node core.mjs --propose ID [--block] --by NAME --why TEXT [--core DIR] [--on DATE] [--dry-run] [--target DIR] [--json]\n" +
  "       node core.mjs --proposals --core DIR [--json]\n" +
  "       node core.mjs --grant ID | --refuse ID --core DIR --by NAME --why TEXT [--on DATE] [--dry-run] [--json]\n";

const WRITES = ["--core", "--by", "--why", "--on", "--dry-run"];
const TAKES = {
  "--promote": [...WRITES, "--replace", "--adapter", "--licence-allows"],
  "--retire": [...WRITES, "--block"],
  "--propose": [...WRITES, "--block"],
  "--proposals": ["--core"],
  "--grant": WRITES,
  "--refuse": WRITES,
};
const NEED = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const blank = (value) => value === undefined || String(value).trim() === "";

// Runs one move of this slice, the call read by the core command.
export function ownerMain(move, call, usage) {
  const { flags } = call;
  const stray = Object.keys(flags).find(
    (flag) => flag !== move && !TAKES[move].includes(flag) && flags[flag] !== undefined,
  );
  if (stray) return refuse(`${stray} is not taken by ${move}`, usage);
  const core = flags["--core"] === undefined ? null : path.resolve(flags["--core"]);
  if (move !== "--propose" && core === null) {
    return refuse(`say which core, with --core DIR`, usage);
  }
  const done = (result, lines, work = false) =>
    finish({ json: call.json, result, text: `${lines.join("\n")}\n`, work });
  if (move === "--proposals") {
    const result = listProposals(core);
    return done(result, listReport(result), result.waiting.length > 0);
  }
  const named = String(flags[move]).trim();
  if (move !== "--promote" && !NEED.test(named)) {
    return refuse(
      `${move} ${named} is not an id: lower-case letters and digits, a dash between words`,
      usage,
    );
  }
  if (move === "--promote" && named === "")
    return refuse("say which block, with --promote NEED", usage);
  if (blank(flags["--by"])) {
    return refuse(
      `say who ${move === "--propose" ? "proposes" : "answers for the family"}, with --by NAME: nothing in a core changes without a person`,
      usage,
    );
  }
  const reasons = flags["--why"] ?? [];
  if (reasons.length !== 1 || blank(reasons[0])) {
    return refuse(`say why, once, with --why TEXT: the core keeps every reason`, usage);
  }
  const by = flags["--by"].trim();
  const why = reasons[0].trim();
  // A name, never an address: the core is the family's data and may be shared.
  for (const [flag, value] of [
    ["--by", by],
    ["--why", why],
  ]) {
    if (ADDRESS.test(value)) {
      return refuse(
        `${flag} holds an e-mail address; a core keeps a person's name, never an address`,
        usage,
      );
    }
  }
  const on = flags["--on"] ?? today();
  if (!isDay(on)) return refuse(`--on ${on} is not a day written YYYY-MM-DD`, usage);
  const dryRun = flags["--dry-run"] === true;
  const asBlock = flags["--block"] === true;

  if (move === "--promote") {
    const result = promoteBlock(call.target, {
      core,
      named,
      by,
      on,
      why,
      replace: flags["--replace"] === true,
      adapters: flags["--adapter"] ?? [],
      licenceAllows: flags["--licence-allows"] === true,
      dryRun,
    });
    return done(result, promoteReport(result), Boolean(result.waits));
  }
  if (move === "--retire") {
    const result = retireFromCore(core, { id: named, asBlock, by, on, why, dryRun });
    return done(result, retireReport(result));
  }
  if (move === "--propose") {
    const result = proposeToCore(call.target, { id: named, asBlock, by, on, why, core, dryRun });
    return done(result, proposeReport(result));
  }
  const result = decideProposal(core, {
    id: named,
    outcome: move === "--grant" ? "granted" : "refused",
    by,
    on,
    why,
    dryRun,
  });
  return done(result, decideReport(result));
}
