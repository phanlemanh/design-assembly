// The proposal to graduate (spec 0016, criterion 13 and answer 6, slice 2 of item 7.2): a need a
// repository of the family meets, which another repository of the family already answered and the
// family's store does not hold, is put to the family's owner as a question, before the second
// repository makes a block of its own; where two repositories answered one need in two ways, the
// question is which one. The question is a proposal of the core folder, of the kind `graduation`:
// it names blocks only, as each repository's report tells them, and never carries code.
//
// Asking writes one file in the core folder and nothing else. Granting records the owner's yes
// with who and why, and the block the owner chose; the promotion itself is the move that exists,
// `core --promote`, run in the repository that has the block: the grant names the exact call, and
// runs it only when the owner names that repository's folder in the same call, so nothing is ever
// promoted without the owner's name and reason. A refusal is kept, and the block it refused is not
// proposed again for that need; a need the core retired is not proposed. Nothing is ever taken
// from a repository by another: the core is the only way between two. No model, no network.
import path from "node:path";

import { adapterOf } from "../templates/tools/design-assembly/adapters/index.mjs";
import { Refusal } from "./command.mjs";
import { homeOf } from "./core-list.mjs";
import { promoteBlock, promoteReport, readStore } from "./core-promote.mjs";
import { proposalsIn } from "./core-records.mjs";
import { CODE_ADAPTERS, copiedReports, ofFamily, reportsIn } from "./core-report.mjs";

export const GRADUATION = "graduation";
const NOTHING = ". Nothing was written";
export const OWNER_SEES_GRADUATION =
  "the family's owner sees it with core --proposals --core DIR, and the first line of a session in a member says a proposal waits; the owner grants it (core --grant, with --choose REPOSITORY where it names two blocks) or refuses it with a reason (core --refuse). Granted, the block is promoted from the repository that has it, and no repository takes anything from another";

const blockWords = (one) => `${one.name} of ${one.repository}`;
const joined = (names) =>
  names.length < 3
    ? names.join(" and ")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
const graduations = (proposals) =>
  proposals.filter((item) => item.kind === GRADUATION && !item.unreadable);
// Whether a refused proposal names a block: the same repository's, of the same name.
const names = (proposal, one) =>
  (proposal.graduation?.candidates ?? []).some(
    (each) => each.repository === one.repository && each.name === one.name,
  );

// The blocks that answer a need in a family, as its repositories' reports tell them, in the order
// of the repositories' names.
const candidatesFor = (reports, need) =>
  reports
    .flatMap((report) =>
      report.needs
        .filter((one) => one.need === need)
        .map((one) => ({ repository: report.repository, ...one })),
    )
    .sort((a, b) => (a.repository < b.repository ? -1 : a.repository > b.repository ? 1 : 0));

// The promotion a granted graduation is carried out with, as the owner runs it in the repository
// that has the block: the move that exists, with the owner's name and the reason of the grant.
export const grantReason = (proposal, why) =>
  `granted ${proposal.id} of ${proposal.repository}: ${why}`;
// A word as a shell takes it whole and unread: in single quotes, a quote inside it closed, escaped
// and opened again. The call is printed for a person to run, and holds words others gave: a
// repository's name, a reason, a folder.
const quoted = (word) => `'${String(word).replaceAll("'", "'\\''")}'`;
export const promotionCall = (core, proposal) =>
  `core --promote ${proposal.subject} --core ${quoted(core)} --by ${quoted(proposal.decided.by)} --why ${quoted(grantReason(proposal, proposal.decided.why))}`;

// ---- asking ---------------------------------------------------------------------------------------

// What a member asks when it asks that a block for a need graduate: the blocks the family's
// repositories told the core they answer the need with. Refused where there is nothing to ask:
// the store holds the need, the core retired it, nobody else answered it, the owner refused the
// block already, or the asking repository could not take a block of code in. `owed` instead where
// the owner granted it already and the promotion has not been carried out.
export function graduationAsk(root, { folder, repository, need, existing }) {
  const { declaration, index, retired } = readStore(folder);
  const held = index.blocks.find((block) => block.need === need);
  if (held) {
    throw new Refusal(
      `the family's store holds ${need} already, with ${held.name} (promoted by ${held.promoted.by} on ${held.promoted.on}): pin the store with core --join, and find gives it at tier 3${NOTHING}`,
    );
  }
  const gone = retired.blocks.find((block) => block.need === need);
  if (gone) {
    throw new Refusal(
      `the core retired its block of ${need} on ${gone.retired.on} (by ${gone.retired.by}, because ${gone.retired.why}): a need the core retired is not proposed again${NOTHING}`,
    );
  }
  const all = candidatesFor(
    reportsIn(folder).filter((report) => ofFamily(declaration, report.repository)),
    need,
  );
  if (all.length === 0) {
    throw new Refusal(
      `no repository of the family tells the core it answered ${need}: there is no block to graduate. A repository tells the core what it answered with core --report, and find and intake say which needs the family answered${NOTHING}`,
    );
  }
  if (all.every((one) => one.repository === repository)) {
    throw new Refusal(
      `only this repository answers ${need}: a graduation is asked when a second repository of the family meets the need. The family's owner may promote the block on their own word with core --promote ${need}${NOTHING}`,
    );
  }
  const about = graduations(existing).filter((item) => item.subject === need);
  const granted = about.find((item) => item.decided?.outcome === "granted");
  if (granted) return { subject: need, owed: granted, call: promotionCall(folder, granted) };
  const refusals = about.filter((item) => item.decided?.outcome === "refused");
  const open = all.filter((one) => !refusals.some((item) => names(item, one)));
  if (open.every((one) => one.repository === repository)) {
    const [last] = refusals.slice(-1);
    throw new Refusal(
      `the family's owner refused to graduate ${joined(last.graduation.candidates.map(blockWords))} for ${need} (${last.id}, by ${last.decided.by} on ${last.decided.on}, because ${last.decided.why}): a block the owner refused is not proposed again for the same need${NOTHING}`,
    );
  }
  // The asking repository takes the block in once it is promoted: it needs what a block of code
  // needs, unless it has such a block itself.
  if (!all.some((one) => one.repository === repository)) {
    const lacking = CODE_ADAPTERS.filter((kind) => !adapterOf(kind)?.present?.(root));
    if (lacking.length > 0) {
      throw new Refusal(
        `${need} is not proposed to ${repository}: it has no ${lacking.join(" and no ")} adapter, which a block of code needs, so it could not take the block in${NOTHING}`,
      );
    }
  }
  return { subject: need, graduation: { candidates: open } };
}

// What a graduation asks, as a person reads it before and after it is written.
export function askLines(proposal) {
  const { candidates } = proposal.graduation;
  return [
    candidates.length === 1
      ? `  it asks the family's owner to promote a block for ${proposal.subject} into the family's store:`
      : `  it asks the family's owner to choose one block for ${proposal.subject}, which ${candidates.length} repositories answered in ${candidates.length} ways, and promote it into the family's store:`,
    ...candidates.map((one) => `    ${blockWords(one)}: ${one.description}`),
    "  it names blocks only, as each repository's report tells them: no code, no path and no value",
  ];
}
// A graduation in one line, for the list of the proposals a core holds.
export const askWords = (item) =>
  `${item.repository} asks that a block for ${item.subject} graduate: ${(item.graduation?.candidates ?? []).map(blockWords).join(", or ")}`;

// ---- answering ------------------------------------------------------------------------------------

// A granted graduation: the block the owner chose, the promotion that carries it out, and, where
// the call names the folder of the repository that has the block, the promotion itself, made with
// the owner's name and reason. Refused where the choice is not said or cannot be carried out.
export function grantGraduation(core, proposal, request) {
  const { by, on, why, choose = null, from = null, dryRun } = request;
  const { declaration, index, retired } = readStore(core);
  const { candidates } = proposal.graduation;
  const need = proposal.subject;
  if (index.blocks.some((block) => block.need === need)) {
    throw new Refusal(
      `the family's store holds ${need} already: refuse ${proposal.id}, with that as its reason${NOTHING}`,
    );
  }
  if (retired.blocks.some((block) => block.need === need)) {
    throw new Refusal(
      `the core retired its block of ${need}: refuse ${proposal.id}, with that as its reason${NOTHING}`,
    );
  }
  const said = candidates.map((one) => one.repository);
  if (choose === null && candidates.length > 1) {
    throw new Refusal(
      `${proposal.id} names ${candidates.length} blocks: say which with --choose REPOSITORY (${said.join(" or ")}); the others keep their own${NOTHING}`,
    );
  }
  const chosen =
    choose === null ? candidates[0] : candidates.find((one) => one.repository === choose);
  if (!chosen) {
    throw new Refusal(
      `--choose ${choose}: ${proposal.id} names no block of ${choose}; it names ${said.join(" and ")}${NOTHING}`,
    );
  }
  if (!ofFamily(declaration, chosen.repository)) {
    throw new Refusal(
      `${chosen.repository} is no longer of the family: refuse ${proposal.id}, with that as its reason${NOTHING}`,
    );
  }
  const decided = { outcome: "granted", by, on, why, chose: chosen.repository };
  const call = promotionCall(core, { ...proposal, decided });
  if (from === null) return { kind: GRADUATION, chosen, decided, call, promoted: null, files: [] };
  const holder = path.basename(homeOf(from));
  if (holder !== chosen.repository) {
    throw new Refusal(
      `--from ${from} is ${holder}, and the block chosen is ${chosen.repository}'s: name the folder of ${chosen.repository}, or leave --from out and run the promotion there${NOTHING}`,
    );
  }
  const promoted = promoteBlock(from, {
    core,
    named: need,
    by,
    on,
    why: grantReason(proposal, why),
    adapters: request.adapters ?? [],
    licenceAllows: request.licenceAllows === true,
    dryRun,
  });
  return { kind: GRADUATION, chosen, decided, call, promoted, files: promoted.files ?? [] };
}

// How a granted graduation was carried out, as a person reads it.
export function grantLines(result, carried) {
  const { proposal } = result;
  const lines = [`  chose ${blockWords(carried.chosen)} for ${proposal.subject}`];
  if (carried.promoted) {
    return [
      ...lines,
      `  ${result.dry_run ? "would promote" : "promoted"} at once from the folder named, by the owner's name and reason given here:`,
      ...promoteReport(carried.promoted)
        .slice(1)
        .map((line) => `    ${line}`),
    ];
  }
  return [
    ...lines,
    `  the block is promoted from ${carried.chosen.repository}, which has it: nothing is promoted here. Run there, as the family's owner:`,
    `    ${carried.call}`,
    `  or give a grant the folder of ${carried.chosen.repository} with --from DIR, and it promotes at once. The store holds the block only once that is done`,
  ];
}

// ---- what waits -----------------------------------------------------------------------------------

// The needs of a family that wait on a graduation: one asked and not answered; one granted whose
// promotion has not been carried out; and one two repositories answered in two ways that nobody
// asked about yet. A need the store holds or the core retired waits on nothing, and neither does
// one whose every block the owner refused.
function waitingOf({ reports, offered, retired = new Set(), proposals = [], core = null }) {
  const about = graduations(proposals);
  const needs = [...new Set(reports.flatMap((report) => report.needs.map((one) => one.need)))];
  const found = [];
  for (const need of needs.sort()) {
    if (offered.has(need) || retired.has(need)) continue;
    const mine = about.filter((item) => item.subject === need);
    const asked = mine.find((item) => !item.decided);
    const granted = mine.find((item) => item.decided?.outcome === "granted");
    const blocks = candidatesFor(reports, need);
    if (asked) {
      found.push({
        need,
        state: "asked",
        id: asked.id,
        by: asked.repository,
        on: asked.on,
        blocks: asked.graduation?.candidates ?? [],
      });
    } else if (granted) {
      const chosen = (granted.graduation?.candidates ?? []).find(
        (one) => one.repository === granted.decided.chose,
      );
      found.push({
        need,
        state: "owed",
        id: granted.id,
        by: granted.decided.by,
        on: granted.decided.on,
        blocks: chosen ? [chosen] : [],
        ...(core ? { call: promotionCall(core, granted) } : {}),
      });
    } else {
      const refusals = mine.filter((item) => item.decided?.outcome === "refused");
      const open = blocks.filter((one) => !refusals.some((item) => names(item, one)));
      if (open.length > 1) found.push({ need, state: "two-ways", blocks: open });
    }
  }
  return found;
}

// What waits, read from a core folder: every report, the store, what it retired and its proposals.
export function graduationsIn(folder) {
  try {
    const { declaration, index, retired } = readStore(folder);
    return waitingOf({
      reports: reportsIn(folder).filter((report) => ofFamily(declaration, report.repository)),
      offered: new Set(index.blocks.map((block) => block.need)),
      retired: new Set(retired.blocks.map((block) => block.need)),
      proposals: proposalsIn(folder),
      core: folder,
    });
  } catch {
    return null;
  }
}

// What waits, as far as a member's copy of the core tells: the reports and the store as they were
// pinned. What the owner answered or the core retired since is not in the copy.
export function graduationsCopied(root, pinned) {
  if (!pinned || pinned.unreadable) return [];
  return waitingOf({
    reports: copiedReports(root, pinned).filter((report) =>
      ofFamily(pinned.declaration, report.repository),
    ),
    offered: new Set((pinned.blocks ?? []).map((block) => block.need)),
  });
}

// One need that waits, in words.
export function waitingWords(one) {
  if (one.state === "asked") {
    return `${one.need} (asked by ${one.by} on ${one.on}: ${one.blocks.map(blockWords).join(", or ")}; it waits on the family's owner)`;
  }
  if (one.state === "owed") {
    return `${one.need} (granted on ${one.on} by ${one.by}: ${one.blocks.map(blockWords).join(", ")}, not promoted yet)`;
  }
  // Two repositories may hold a block of one name, each its own copy: said as it is.
  const repositories = joined(one.blocks.map((each) => each.repository));
  const alike = one.blocks.every((each) => each.name === one.blocks[0].name);
  const how = alike
    ? `answered by ${repositories}, each with its own ${one.blocks[0].name}`
    : `answered in ${one.blocks.length} ways, by ${repositories}`;
  return `${one.need} (${how}: the family's owner chooses one; core --propose ${one.need} --graduate asks)`;
}

// What the periodic line of status says of a member's family: how many needs wait on a
// graduation, and which. `copied` says the count is the copy's, the core's folder being out of
// reach.
export function graduationLine(waiting, { copied = false } = {}) {
  const count = waiting.length;
  const said =
    count === 0
      ? "no need of the family waits on a graduation"
      : `${count} need${count === 1 ? "" : "s"} of the family ${count === 1 ? "waits" : "wait"} on a graduation: ${waiting.map(waitingWords).join("; ")}`;
  return copied
    ? `${said} (as this repository's copy of the core tells it at its pin: the core's folder cannot be looked at, so what its owner answered since is not known)`
    : said;
}

// ---- at the moment of need ------------------------------------------------------------------------

// What find and intake say of the needs the family answered and its store does not hold, once
// those that match the words asked are known: the lines for a person, and the next step, or null
// when none is proposed here.
export function needLines(needs, pin) {
  if (needs.length === 0) return [];
  const lines = [
    `in the family, not in its store yet (as its repositories told the core, at the pin ${pin}):`,
  ];
  for (const one of needs) {
    lines.push(
      `  ${one.name} (need ${one.need}), answered by ${one.repository}`,
      `    ${one.description}`,
    );
    if (!one.proposed) lines.push(`    not proposed here: ${one.why}`);
  }
  return lines;
}
export const needSentence = (one) =>
  `in the family, not in its store yet: ${one.name} (need ${one.need}), answered by ${one.repository}: ${one.description}`;
export function needNext(needs) {
  const one = needs.find((each) => each.proposed);
  if (!one) return null;
  return `${one.name} answers this in ${one.repository}, a repository of the family, and the family's store does not hold it yet: before a block is made or taken from outside, ask the family's owner to promote it with core --propose ${one.need} --graduate --by NAME --why TEXT, which writes a proposal in the core folder only and prints it first. Once the owner grants it and the block is promoted, core --join pins the store and find gives it at tier 3; nothing is taken from ${one.repository} directly`;
}
// The needs of the family as find and intake give them: each with whether it is proposed here.
export const proposedHere = (needs, lacking) =>
  needs.map((one) =>
    lacking.length === 0
      ? { ...one, proposed: true }
      : {
          ...one,
          proposed: false,
          why: `this repository has no ${lacking.join(" and no ")} adapter, which a block of code needs`,
        },
  );
