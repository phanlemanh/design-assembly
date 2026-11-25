// The one line at the start of a session (spec 0016, criterion 18 and answer 12): the plugin's
// first hook runs this, and it prints at most one line, only when something about the family's
// core waits in the repository the session opened: the core moved ahead of the pin, a question
// about the core waits on the owner, or a locked answer is held otherwise with no exception. In
// every other case it prints nothing: a repository of no family, a folder that is no repository, a
// copy or a list that cannot be read. It calls no model, no network and no git, never fails a
// session (whatever goes wrong, it ends silently with 0), and reads little: the declaration first,
// and nothing more on a repository that declares no family.
// Usage: node session-line.mjs [--hook] [--target DIR]
//   --hook    print the line as the JSON a SessionStart hook hands the session, shown to the person
//             and added to the session's context; without it, the line as plain text
//   --target  the folder the session opened; else CLAUDE_PROJECT_DIR, else the folder it is run from
import { existsSync } from "node:fs";
import path from "node:path";
import process, { argv, env, stdout } from "node:process";

const DECLARATION = "design/sources/core.json";

// The root of the repository a folder lies in, found by git's own entry and with no git run; the
// folder itself where there is none above it.
function rootOf(start) {
  let at = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(at, ".git"))) return at;
    const up = path.dirname(at);
    if (up === at) return path.resolve(start);
    at = up;
  }
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// What waits about the family's core in a repository, as one line, or null when nothing does.
// Each part is read on its own: one that cannot be read says nothing and stops no other.
async function lineOf(root) {
  const contract = await import("../templates/tools/design-assembly/contract.mjs");
  const pinned = contract.readPinnedCore(root);
  if (pinned === null || pinned.unreadable) return null;
  const quiet = (read) => {
    try {
      return read();
    } catch {
      return null;
    }
  };
  const {
    answerChanges,
    answersIn,
    coreOf,
    coreQuestionId,
    countWords,
    mainFolderOf,
    settledQuestions,
  } = await import("./core-moved.mjs");
  const parts = [];
  let next = null;

  // The core moved ahead of the pin: its answers are not the ones copied.
  const place = quiet(() =>
    coreOf(pinned, { shape: false, repository: () => path.basename(mainFolderOf(root)) }),
  );
  const moved = quiet(() => {
    if (!place || place.path === null) return null;
    const answers = answersIn(place.path);
    if (answers === null) return null;
    const changes = answerChanges(pinned.answers, answers);
    return changes.length > 0 ? changes : null;
  });
  if (moved) {
    parts.push(
      `the family core ${pinned.family} is ahead of this repository's pin (${countWords(moved)})`,
    );
    next = "core --moved shows each change, and nothing here changes until a person accepts";
  }

  // A proposal of a member waits on the family's owner (slice 3 of item 7.2).
  const proposals = quiet(async () => {
    if (!place || place.path === null) return 0;
    const { proposalsIn } = await import("./core-records.mjs");
    return proposalsIn(place.path).filter((item) => !item.unreadable && !item.decided).length;
  });
  const waitingProposals = (await Promise.resolve(proposals).catch(() => 0)) ?? 0;
  if (waitingProposals > 0) {
    parts.push(
      `${plural(waitingProposals, "proposal to the family core waits", "proposals to the family core wait")} on the family's owner`,
    );
    next ??= "core --proposals --core DIR lists them";
  }

  // A question about the core waits on the owner. One whose answer is recorded already, the
  // exception with its reason in the row's note against this pin, waits on nobody.
  const { readLedger } = await import("../templates/tools/design-assembly/ledger.mjs");
  const ledger = quiet(() => readLedger(root)) ?? [];
  const settled = settledQuestions(pinned, ledger);
  const waiting = await import("../templates/tools/design-assembly/waiting.mjs");
  const asked =
    quiet(() => {
      const rows = waiting.readWaiting(root)?.rows ?? [];
      const replaced = waiting.replacedBy(rows);
      return rows.filter(
        (row) =>
          typeof row?.id === "string" &&
          row.id.startsWith("core-") &&
          row.kind !== "permission" &&
          !row.answer &&
          !replaced.has(row.id) &&
          !settled.has(row.id),
      );
    }) ?? [];
  if (asked.length > 0) {
    parts.push(
      `${plural(asked.length, "question about the core waits", "questions about the core wait")} on the owner`,
    );
    next ??= "decide shows the decision sheet";
  }

  // A locked answer is held otherwise with no exception: what the gate holds red. One whose
  // question waits is said above.
  const red = quiet(() => {
    const values = contract.memberValues(pinned, contract.memberFiles(root));
    const waits = new Set(asked.map((row) => row.id));
    const askedOf = pinned.answers.filter((answer) =>
      waits.has(coreQuestionId(answer.id, pinned.label)),
    );
    return contract
      .lockedCoreProblems({ pinned, values }, ledger)
      .filter((line) => !askedOf.some((answer) => line.startsWith(`${answer.id}:`)));
  });
  if (red && red.length > 0) {
    parts.push(
      `${plural(red.length, "locked answer is", "locked answers are")} held otherwise here with no exception`,
    );
    next ??= "core --settle records the owner's answer, and the gate is red until then";
  }
  return parts.length === 0 ? null : `design-assembly: ${parts.join("; ")}. ${next}.`;
}

async function main() {
  const at = argv.indexOf("--target");
  const start = at !== -1 && argv[at + 1] ? argv[at + 1] : env.CLAUDE_PROJECT_DIR || process.cwd();
  const root = rootOf(start);
  // A repository that declares no family: nothing more is read, and nothing is said.
  if (!existsSync(path.join(root, DECLARATION))) return;
  const line = await lineOf(root);
  if (!line) return;
  stdout.write(
    argv.includes("--hook")
      ? `${JSON.stringify({
          systemMessage: line,
          hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: line },
        })}\n`
      : `${line}\n`,
  );
}

// Whatever goes wrong, a session opens: nothing is said, and the hook ends well.
try {
  await main();
} catch {
  // Silence is the answer.
}
process.exitCode = 0;
