// Publishing a family's core to a private repository (spec 0016, criterion 14 and answer 9, slice 3
// of item 7.1). No script of this plugin calls the network, so this one's part is the record and
// the words: the leave of the family's owner, given for the family and for one place, kept in the
// core's declaration with their name and the day, and taken back the same way; before any push,
// exactly what would go where, from the folder as it is; and, once the session pushed, that it did,
// where to and from which state of the folder, kept in the machine's list of cores. The session
// creates the repository and pushes, after the person's yes; a refusal leaves the folder as usable
// as before.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  CORE,
  corePartShapeProblems,
  familyCoreProblems,
  newerCoreParts,
} from "../templates/tools/design-assembly/contract.mjs";
import { renderJson } from "../templates/tools/design-assembly/json.mjs";
import { fileChange, Refusal } from "./command.mjs";
import { addLine, readList } from "./core-list.mjs";

const WIDTH = 100;
const DECLARATION = CORE.parts.declaration.file;
const STATE_DIGITS = 12;
export const REMOTE = "origin";
// The files and folders of a core folder that are parts of a core.
const PARTS = [
  DECLARATION,
  CORE.parts.answers.file,
  `${path.posix.dirname(CORE.parts.blocks.file)}/`,
  `${CORE.parts.members.folder}/`,
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (folder, ...args) => spawnSync("git", ["-C", folder, ...args], { encoding: "utf8" });

// A place a core is published to, as it is kept and compared: the host and the path, with no
// scheme, no user and no `.git`, so the same repository reads the same however its address is
// written. Refused when it carries a password or a token: a core keeps no secret.
export function placeOf(text) {
  const raw = String(text ?? "").trim();
  if (raw === "" || /\s/.test(raw)) {
    return { problem: "a place is one word, as host/owner/name or the address of a git remote" };
  }
  const secret = {
    problem: "the place carries a password or a token: give the address without it",
  };
  // A query or a fragment is where a token rides; an address of a repository has neither.
  if (/[?#]/.test(raw)) return secret;
  const tidy = (place) => place.replace(/\/+$/, "").replace(/\.git$/, "");
  // The one user an address may name: the login of a remote reached over ssh, before the host,
  // with no password. Anything else with an @ is a secret, wherever it stands.
  const ats = raw.split("@").length - 1;
  if (ats > 1) return secret;
  const url = /^([a-z][a-z0-9+.-]*):\/\/(.*)$/i.exec(raw);
  if (url) {
    const [, scheme, body] = url;
    let rest = body;
    if (ats === 1) {
      const user = body.slice(0, body.indexOf("@"));
      if (/^https?$/i.test(scheme) || /[:/]/.test(user) || user === "") return secret;
      rest = body.slice(body.indexOf("@") + 1);
    }
    const cut = rest.indexOf("/");
    const host = cut === -1 ? rest : rest.slice(0, cut);
    if (host === "" && !/^file$/i.test(scheme)) {
      return { problem: "the place names no host: give it as host/owner/name" };
    }
    return { place: tidy(`${host.toLowerCase()}${cut === -1 ? "" : rest.slice(cut)}`) };
  }
  if (ats === 1) {
    // user@host:path, the short form of a remote reached over ssh, and nothing else.
    const short = /^([^@/:]+)@([^/:@]+):(?!\/)([^@]+)$/.exec(raw);
    return short ? { place: tidy(`${short[2].toLowerCase()}/${short[3]}`) } : secret;
  }
  const scp = /^([^/:]+):(?!\/)(.+)$/.exec(raw);
  if (scp) return { place: tidy(`${scp[1].toLowerCase()}/${scp[2]}`) };
  return { place: tidy(raw) };
}

// The core to publish: its folder by its real path, and its declaration. Refused, with nothing
// written, when it is not a core, holds a part of a newer shape, does not hold its shape, or lies
// inside a repository that is not its own.
function readCore(core) {
  if (!existsSync(core) || !statSync(core).isDirectory()) {
    throw new Refusal(`${core} is not a folder`);
  }
  const folder = realpathSync(core);
  const newer = newerCoreParts(folder);
  if (newer.length > 0) throw new Refusal(`${newer.join("; ")}. Nothing was written`);
  if (!existsSync(path.join(folder, DECLARATION))) {
    throw new Refusal(`${core} holds no family core: ${DECLARATION} is not there`);
  }
  // A place written by hand that does not read as one may carry a secret: it is never repeated.
  const problems = familyCoreProblems(folder).map((line) =>
    line.startsWith(`${DECLARATION}.publish.to is `)
      ? `${DECLARATION}.publish.to is not a place written as host and path, and is not repeated here`
      : line,
  );
  if (problems.length > 0) {
    throw new Refusal(
      `the core at ${core} does not hold its shape, so nothing of it is published: ${problems.join("; ")}. Run core --check --core ${core}; nothing was written`,
    );
  }
  const top = git(folder, "rev-parse", "--show-toplevel");
  const tree =
    top.status === 0 && top.stdout.trim() !== "" ? realpathSync(top.stdout.trim()) : null;
  if (tree !== null && tree !== folder) {
    throw new Refusal(
      `${core} lies inside the git work tree of ${tree}: the core is outside every repository, and may be the root of a repository of its own. Nothing was written`,
    );
  }
  const declaration = JSON.parse(readFileSync(path.join(folder, DECLARATION), "utf8"));
  const kept = declaration.publish?.to;
  if (kept !== undefined && placeOf(kept).place !== kept) {
    throw new Refusal(
      `${DECLARATION} of the core at ${core} holds a leave whose place is not written as host and path; it is not repeated here. Write the leave again with --allow --to PLACE; nothing was written`,
    );
  }
  return { folder, repository: tree === folder, declaration };
}

// Every file of a folder, by its path from the folder, git's own folder left out.
function walk(folder, at = "") {
  return readdirSync(path.join(folder, at), { withFileTypes: true })
    .filter((entry) => entry.name !== ".git")
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = path.posix.join(at, entry.name);
      return entry.isDirectory() ? walk(folder, relative) : [relative];
    });
}

// The files a push would carry: what git would take of the folder when it is a repository (the
// files it tracks and the ones it would add, its ignore rules kept), else every file of the folder.
// Each says whether it is a part of a core: a stray file would go too, and is named.
function filesOf(folder, repository) {
  let names = null;
  if (repository) {
    const listed = git(folder, "ls-files", "-z", "--cached", "--others", "--exclude-standard");
    if (listed.status === 0) {
      names = listed.stdout
        .split("\0")
        .filter((name) => name !== "" && existsSync(path.join(folder, name)))
        .sort();
    }
  }
  return (names ?? walk(folder)).map((file) => ({
    file,
    part: PARTS.some((part) => (part.endsWith("/") ? file.startsWith(part) : file === part)),
  }));
}

// The state of the folder a push carries, as one short hash of its files and their bytes.
const stateOf = (folder, files) =>
  sha256(
    files.map(({ file }) => `${file}\0${sha256(readFileSync(path.join(folder, file)))}\n`).join(""),
  ).slice(0, STATE_DIGITS);

// The leave the declaration holds: none, given, or taken back.
function leaveOf(declaration) {
  const publish = declaration.publish;
  if (!publish?.allowed) return { state: "none", to: null };
  const back = publish.taken_back;
  return {
    state: back ? "taken-back" : "given",
    to: publish.to,
    by: (back ?? publish.allowed).by,
    on: (back ?? publish.allowed).on,
    allowed: publish.allowed,
  };
}

// What git holds of the folder, read from the folder alone: whether it is a repository, its
// branch, how many files are not committed, and the place its remote names. No network.
function gitOf(folder, repository, remote) {
  if (!repository) {
    return { repository: false, branch: null, uncommitted: null, remote: null, secret: false };
  }
  const branch = git(folder, "symbolic-ref", "--short", "-q", "HEAD");
  const dirty = git(folder, "status", "--porcelain");
  const url = git(folder, "remote", "get-url", remote);
  const named = url.status === 0 ? placeOf(url.stdout.trim()) : null;
  return {
    repository: true,
    branch: branch.status === 0 ? branch.stdout.trim() : null,
    uncommitted: dirty.status === 0 ? dirty.stdout.split("\n").filter(Boolean).length : null,
    remote: named?.place ?? null,
    // An address that does not read as a place may carry a secret: it is never said again, only
    // that it is so, and nothing is sent or recorded while it stands.
    secret: named !== null && named.place === undefined,
  };
}

// The place named by a flag, or a refusal that says how to write it.
function askedPlace(to) {
  if (to === undefined || to === null) return null;
  const read = placeOf(to);
  if (read.problem) throw new Refusal(`--to: ${read.problem}`);
  return read.place;
}

// What would go where, said before any push, and whether the leave covers it. Read-only. `sends`
// is true only when the family's owner gave leave for this very place: the session pushes only
// then, and only after the person's yes.
export function publishPlan(core, { to = null, remote = REMOTE } = {}) {
  const read = readCore(core);
  const { folder, declaration } = read;
  const leave = leaveOf(declaration);
  const held = gitOf(folder, read.repository, remote);
  const asked = askedPlace(to);
  const place = asked ?? held.remote ?? leave.to;
  const files = filesOf(folder, read.repository);
  const state = stateOf(folder, files);
  let why = null;
  if (held.secret) {
    why = `the folder's remote ${remote} is written with a password or a token, or not as an address: take that out of the remote (git remote set-url) before anything is sent; it is not repeated here`;
  } else if (leave.state === "none") {
    why =
      "the family's owner has not given leave to publish this core: ask first, then record the yes with --allow";
  } else if (leave.state === "taken-back") {
    why = `${leave.by} took the leave back on ${leave.on}: nothing is sent; a new yes is recorded with --allow`;
  } else if (place !== leave.to) {
    why = `the leave was given for ${leave.to}, and ${place} is another place: a new place is asked first, then recorded with --allow`;
  } else if (held.remote !== null && held.remote !== leave.to) {
    why = `the folder's remote ${remote} names ${held.remote}, and the leave was given for ${leave.to}: a new place is asked first`;
  }
  const pushes = readList()
    .pushed.filter((entry) => entry.path === folder)
    .map((entry) => ({ ...entry, behind: entry.state !== state }));
  return {
    core: folder,
    family: declaration.family,
    leave: { state: leave.state, to: leave.to, by: leave.by ?? null, on: leave.on ?? null },
    to: place ?? null,
    remote: { name: remote, names: held.remote },
    git: { repository: held.repository, branch: held.branch, uncommitted: held.uncommitted },
    files,
    state,
    sends: why === null,
    why,
    waits: held.secret || leave.state === "none" || (leave.state === "given" && why !== null),
    pushes,
  };
}

// The declaration with another leave, written, or what would be. Nothing else of the core changes.
function writeLeave(read, publish, dryRun) {
  const declared = { ...read.declaration, publish };
  const problems = corePartShapeProblems("declaration", declared, DECLARATION);
  if (problems.length > 0) {
    throw new Refusal(`${problems.join("; ")}. Nothing was written`);
  }
  if (!dryRun) writeFileSync(path.join(read.folder, DECLARATION), renderJson(declared, WIDTH));
  return [fileChange(path.join(read.folder, DECLARATION), "update")];
}

// Records the leave of the family's owner to publish the core to one place.
export function allowPublish(core, { to = null, remote = REMOTE, by, on, dryRun }) {
  const read = readCore(core);
  const held = gitOf(read.folder, read.repository, remote);
  if (held.secret) {
    throw new Refusal(
      `the folder's remote ${remote} is written with a password or a token, or not as an address: take that out of the remote (git remote set-url) first; it is not repeated here. Nothing was written`,
    );
  }
  const place = askedPlace(to) ?? held.remote;
  if (!place) {
    throw new Refusal(
      "say where the core is published, with --to PLACE (host/owner/name, or the address of the remote): the leave is for one place",
    );
  }
  const leave = leaveOf(read.declaration);
  const base = {
    core: read.folder,
    family: read.declaration.family,
    to: place,
    by,
    on,
    dry_run: dryRun,
  };
  if (leave.state === "given" && leave.to === place) {
    return { ...base, already: leave.allowed, files: [] };
  }
  return {
    ...base,
    already: null,
    was: leave.state === "none" ? null : { state: leave.state, to: leave.to },
    files: writeLeave(read, { to: place, allowed: { by, on } }, dryRun),
  };
}

// Takes the leave back: from then on nothing is sent, until a new yes is recorded.
export function revokePublish(core, { by, on, dryRun }) {
  const read = readCore(core);
  const leave = leaveOf(read.declaration);
  const base = {
    core: read.folder,
    family: read.declaration.family,
    to: leave.to,
    by,
    on,
    dry_run: dryRun,
  };
  if (leave.state !== "given") return { ...base, nothing: leave.state, files: [] };
  return {
    ...base,
    nothing: null,
    files: writeLeave(read, { ...read.declaration.publish, taken_back: { by, on } }, dryRun),
  };
}

// Records that the session pushed the core: where to, who said so, on which day and from which
// state of the folder, in the machine's list of cores. Refused where no leave covers the place: a
// push is recorded only for a place the family's owner allowed.
export function recordPush(core, { to = null, remote = REMOTE, by, on, dryRun }) {
  const plan = publishPlan(core, { to, remote });
  if (!plan.sends) {
    throw new Refusal(`no push is recorded: ${plan.why}. Nothing was written`);
  }
  const list = readList();
  if (list.problem) {
    throw new Refusal(`${list.problem}: the list was left as it is. Nothing was written`);
  }
  const line = addLine({ path: plan.core, to: plan.to, on, by, state: plan.state }, { dryRun });
  if (line.why) throw new Refusal(`${line.why}. Nothing was written`);
  return {
    core: plan.core,
    family: plan.family,
    to: plan.to,
    by,
    on,
    state: plan.state,
    list: line.file,
    dry_run: dryRun,
  };
}

// ---- for a person -------------------------------------------------------------------------------

const leaveWords = (leave) =>
  leave.state === "given"
    ? `given by ${leave.by} on ${leave.on}, for ${leave.to}`
    : leave.state === "taken-back"
      ? `taken back by ${leave.by} on ${leave.on}; it was for ${leave.to}`
      : "none yet";

export function planReport(plan) {
  const stray = plan.files.filter((item) => !item.part);
  const lines = [
    `family core: ${plan.family}, at ${plan.core}`,
    `leave to publish: ${leaveWords(plan.leave)}`,
  ];
  const where = plan.to ?? "no place named yet (name one with --to)";
  if (plan.sends) {
    lines.push(
      `sends: the folder ${plan.core}, ${plan.files.length} file(s), at state ${plan.state}:`,
      ...plan.files.map(
        (item) => `  ${item.file}${item.part ? "" : "  (not a part of a core: it would go too)"}`,
      ),
      `to: ${where}, as the remote ${plan.remote.name} of the folder${plan.remote.names ? "" : " (not set yet)"}`,
    );
  } else {
    lines.push(
      `nothing is sent: ${plan.why}`,
      `it would send the folder ${plan.core}, ${plan.files.length} file(s), at state ${plan.state}, to ${where}:`,
      ...plan.files.map(
        (item) => `  ${item.file}${item.part ? "" : "  (not a part of a core: it would go too)"}`,
      ),
    );
  }
  lines.push(
    "private: the repository there is private, created so and never made public; this command cannot look there, so the session checks before it pushes",
    plan.git.repository
      ? `the folder is a git repository${plan.git.branch ? `, on ${plan.git.branch}` : ""}${plan.git.uncommitted ? `, with ${plan.git.uncommitted} file(s) not committed: a push carries what is committed` : ""}`
      : "the folder is not a git repository yet: git init comes first, on the person's yes",
  );
  if (stray.length > 0) {
    lines.push(
      `${stray.length} file(s) of the folder are not parts of a core: say so to the person before anything goes`,
    );
  }
  for (const push of plan.pushes) {
    lines.push(
      `pushed: to ${push.to} on ${push.on}, from state ${push.state}; ${push.behind ? `the folder is at ${plan.state}: the copy there is behind` : "the folder is at the same state"}`,
    );
  }
  lines.push(
    "nothing was sent: this command calls no network, and the local folder is usable as it is",
  );
  return `${lines.join("\n")}\n`;
}

export function allowReport(result) {
  if (result.already) {
    return `leave to publish the family core ${result.family} to ${result.to} was given already, by ${result.already.by} on ${result.already.on}: nothing was written\n`;
  }
  return `${[
    `${result.dry_run ? "would record" : "recorded"}: ${result.by} gives leave on ${result.on} to publish the family core ${result.family} to ${result.to}, a private repository, and nowhere else`,
    ...(result.was ? [`  before: the leave was ${result.was.state}, for ${result.was.to}`] : []),
    ...result.files.map((file) => `  ${file.change}  ${file.path}`),
    "it is taken back with --revoke; nothing was sent",
  ].join("\n")}\n`;
}

export function revokeReport(result) {
  if (result.nothing === "none") {
    return `no leave to publish the family core ${result.family} was given: there is nothing to take back, and nothing was written\n`;
  }
  if (result.nothing === "taken-back") {
    return `the leave to publish the family core ${result.family} was taken back already: nothing was written\n`;
  }
  return `${[
    `${result.dry_run ? "would record" : "recorded"}: ${result.by} takes back on ${result.on} the leave to publish the family core ${result.family} to ${result.to}: nothing is sent from now on`,
    ...result.files.map((file) => `  ${file.change}  ${file.path}`),
    "what was pushed before stays where it is: taking it down there is the person's to do",
  ].join("\n")}\n`;
}

export const pushReport = (result) =>
  `${result.dry_run ? "would record" : "recorded"}: the family core ${result.family} was pushed to ${result.to} on ${result.on}, from state ${result.state}, as ${result.by} said (${result.list}); this command sent nothing and did not look there\n`;
