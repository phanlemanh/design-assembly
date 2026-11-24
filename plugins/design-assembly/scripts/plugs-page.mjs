// The overview page of the setup step (specification 0014, step 2): every socket of the capability
// table on the frame every document of this plugin shares, by stage, each with what it does in a
// sentence, who works it, and each plug from outside with where it stands, its measure or an
// invitation to measure it, and what it needs and sends. It reads the result of the plugs command
// and nothing else; it calls no model.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { plural } from "./document.mjs";
import { VERSION } from "./stamp.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const TABLE = json("references/capabilities.json");
const LIMITS = json("references/limits.json").limits;
const DECIDE = "/design-assembly:decide";
const PLUGS = "/design-assembly:plugs";

// What a socket is for, in the plain sentence the capability table gives it.
const plainOf = (id) => TABLE.capabilities.find((capability) => capability.id === id)?.plain ?? "";

// Who works a socket now: the plug chosen, else the plugin's, else nobody.
function whoOf(socket) {
  if (socket.closed) return `${socket.plugin}, the plugin's own; no plug from outside fills it`;
  if (socket.chosen?.state === "kept-not-applied") {
    return `${socket.plugin}, the plugin's own; an earlier choice of ${socket.chosen.plug}, by ${socket.chosen.by} on ${socket.chosen.on}, is kept, not applied: at this socket ${socket.chosen.plug} counts only as a pinned source`;
  }
  if (socket.chosen) {
    return `${socket.chosen.plug}, chosen by ${socket.chosen.by} on ${socket.chosen.on} (${socket.chosen.state})`;
  }
  return socket.plugin ? `${socket.plugin}, the plugin's own` : "nobody: the socket is empty";
}

// What the measure of a plug from outside says, in words. At a ladder socket a plug from outside is
// a rung of the plugin's plug, never its rival, so its measure is not a contest and no question is
// put there: it says the rung it stands on instead (spec 0015).
function measureOf(candidate, socket) {
  if (socket.ladder) {
    const measured =
      candidate.measured === "unmeasured"
        ? "unmeasured"
        : `measured in decision ${candidate.measured}`;
    const rung =
      candidate.rung === 2
        ? `rung 2 of ${socket.plugin}, as a pinned source`
        : "no pinned source, so find and intake do not reach it";
    return `${measured}; a rung of ${socket.plugin}, not a rival to it; ${rung}`;
  }
  return candidate.measured === "unmeasured"
    ? "unmeasured: it can be measured on a throwaway copy, with the cost in tokens said before it runs, and is never recommended until then"
    : `measured in decision ${candidate.measured}${candidate.beats_plugin ? ", where it beat the plugin's plug" : ", where it did not beat the plugin's plug"}`;
}

// One plug from outside, in a sentence: where it stands, its measure or the invitation to measure
// it, the owner's word, what it needs and what it sends.
function candidateOf(candidate, socket) {
  const measure = measureOf(candidate, socket);
  const owner = candidate.owner
    ? `; recommended by the owner ("${candidate.owner.said}", ${candidate.owner.on}, decision ${candidate.owner.record})`
    : "";
  const needs =
    candidate.needs.length > 0 ? `; needs ${candidate.needs.join(" and ")}` : "; needs nothing";
  const sends = candidate.sends ? `; sends: ${candidate.sends}` : "";
  return `${candidate.id}: ${candidate.state}, ${measure}${owner}${needs}${sends}`;
}

const candidatesOf = (socket) =>
  socket.candidates.length > 0
    ? socket.candidates.map((candidate) => candidateOf(candidate, socket)).join(" · ")
    : socket.closed
      ? "closed"
      : "only the plugin's plug";

// The page, as the frame of documents takes it.
export function documentOf(result, origin) {
  const { sockets, questions, later } = result;
  const open = sockets.filter((socket) => !socket.closed);
  const outside = open.filter((socket) => socket.candidates.length > 0);
  // A chosen plug is said to be missing only where the session was listed.
  const missing = result.session_listed
    ? sockets.filter((socket) => socket.chosen?.state === "chosen-but-missing")
    : [];
  const signIn = sockets.flatMap((socket) =>
    socket.candidates.filter((candidate) => candidate.state === "needs-sign-in"),
  );
  const asks = plural(questions.length, "question waits", "questions wait");
  const attention = [
    questions.length > 0 && {
      title: `${asks} on the owner`,
      detail: "Each chooses the plug of one socket; the recommendation comes first.",
    },
    missing.length > 0 && {
      title: `${plural(missing.length, "chosen plug is", "chosen plugs are")} not here`,
      detail: `${missing.map((socket) => socket.chosen.plug).join(", ")}: the plugin's plug works there until it is.`,
    },
    signIn.length > 0 && {
      title: `${plural(signIn.length, "plug waits", "plugs wait")} for a sign-in`,
      detail: `${[...new Set(signIn.map((candidate) => candidate.id))].join(", ")}: give its server access in the session.`,
    },
  ].filter(Boolean);
  return {
    kind: "plugs-board",
    title: "Plugs board",
    lede: "Which plug works each socket of the design system, and which plugs from outside could.",
    origin,
    version: VERSION,
    scope: [
      "The capability table of the plugin and its plug files",
      "The files and packages of the repository a plug file names",
      "The plugs chosen, as rows plug-<socket> of the decision ledger",
      result.session_listed
        ? "The skills and servers of the session, as the skill that ran the command listed them"
        : "Not the session: the call listed none, so a plug only a session holds reads as absent",
    ],
    decision: {
      conclusion: `${sockets.length} sockets: ${open.length - outside.length} have only the plugin's plug, ${outside.length} have plugs from outside; ${questions.length === 0 ? "nothing waits on the owner" : `${asks} on the owner`}.`,
      figures: [
        { value: String(questions.length), label: "questions wait on the owner" },
        { value: String(later.length), label: "questions wait for a later round" },
        { value: String(missing.length), label: "chosen plugs are not here" },
      ],
      attention,
      decide:
        questions.length > 0
          ? [
              {
                what: `Answer ${plural(questions.length, "question", "questions")}`,
                items: questions.map((question) => `${question.id}: ${question.question}`),
                more: null,
                command: DECIDE,
              },
            ]
          : [],
    },
    findings: missing.map((socket) => ({
      severity: "medium",
      title: `${socket.chosen.plug} was chosen for the ${socket.name} socket and is not here`,
      detail: "A route that reaches the socket falls back to the plugin's plug and says so.",
      evidence: [`row ${`plug-${socket.id}`} of the decision ledger, ${whoOf(socket)}`],
    })),
    recommendations: questions.map((question) => ({
      about: `${question.id}: ${question.question}`,
      what: question.recommendation,
      basis: {
        kind: question.basis.includes("measured") ? "measurement" : "standard",
        text: question.basis,
      },
      action: "Give your answer on the decision sheet, then run the plugs command again.",
      command: DECIDE,
    })),
    next: [
      ...(questions.length > 0
        ? [{ command: DECIDE, why: "the questions about plugs wait on the owner" }]
        : []),
      { command: PLUGS, why: "run again after an answer, or when a plug is added" },
    ],
    blind: LIMITS.filter(
      (limit) =>
        limit.area === "capabilities" && limit.status === "open" && limit.id.startsWith("plugs-"),
    ).map(({ id, note }) => ({ id, note })),
    register: {
      title: "Each socket, by stage of the life of a design system",
      columns: ["Socket", "What it does", "Who works it", "Plugs from outside"],
      groups: [...new Set(sockets.map((socket) => socket.stage))].map((stage) => ({
        title: stage,
        note: null,
        rows: sockets
          .filter((socket) => socket.stage === stage)
          .map((socket) => [socket.name, plainOf(socket.id), whoOf(socket), candidatesOf(socket)]),
      })),
    },
  };
}
