// The setup step that chooses a plug for each socket, the machine's side (specification 0014,
// criteria 1, 4, 5 and 6): the board of every socket with its candidates, the questions it puts on
// the waiting list, and the rows an answer becomes. Each rule is seen holding on fixture plugs and
// broken in one place, with a message that names where. Nothing calls a model or the network.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execPath } from "node:process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { fallbackOf, readCapabilities } from "../scripts/capabilities.mjs";
import { documentProblems } from "../scripts/document.mjs";
import { eyeChoice, eyesOf } from "../scripts/review-harvest.mjs";
import { eyeLines } from "../scripts/review.mjs";
import { documentOf } from "../scripts/plugs-page.mjs";
import {
  boardOf,
  carryOut,
  plan,
  recommendationOf,
  recommendationProblem,
  report,
  ROUND,
} from "../scripts/plugs.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { readWaiting, rowProblems } from "../templates/tools/design-assembly/waiting.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGS = path.join(PLUGIN, "scripts/plugs.mjs");
const ON = "2026-11-23";

const made = [];
after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const empty = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "design-plugs-"));
  made.push(dir);
  return dir;
};
const put = (dir, file, text) => {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
};
const read = (dir, file) => readFileSync(path.join(dir, file), "utf8");
const cli = (...args) => spawnSync(execPath, [PLUGS, ...args], { encoding: "utf8" });

const real = readCapabilities();
const copy = (value) => JSON.parse(JSON.stringify(value));

// Fixture plugs from outside, each found in a repository by a file of its own name.
const measured = (sockets, beats = false, record = "d0088") =>
  Object.fromEntries(sockets.map((socket) => [socket, { record, beats_plugin: beats }]));
const FIXTURE_PLUGS = [
  {
    // Measured at direction without beating the plugin's plug, and the owner's named exception at
    // brand-assets and handoff.
    id: "house-system",
    about: "A fixture system that holds a direction and a reference page.",
    sockets: ["direction", "brand-assets", "handoff"],
    names: ["house-system"],
    needs: ["account", "network"],
    sends: "The design values of the repository, to the fixture service.",
    measured: measured(["direction", "brand-assets", "handoff"]),
    recommended_by_owner: {
      "brand-assets": { record: "d0088", said: "Keep at handoff and brand", on: "2026-11-23" },
      handoff: { record: "d0088", said: "Keep at handoff and brand", on: "2026-11-23" },
    },
    detect: { file: "fixtures/house-system" },
  },
  {
    // Measured, and beats the plugin's plug.
    id: "sharp-builder",
    about: "A fixture skill that builds a screen.",
    kind: "skill",
    sockets: ["screen-build"],
    names: ["sharp-builder"],
    skills: ["sharp-builder"],
    needs: [],
    measured: measured(["screen-build"], true, "d0073"),
    detect: { file: "fixtures/sharp-builder" },
  },
  {
    // Measured, loses, and is the only candidate at foundations.
    id: "plain-tokens",
    about: "A fixture tool that writes tokens.",
    sockets: ["foundations"],
    names: ["plain-tokens"],
    needs: [],
    measured: measured(["foundations"], false, "d0073"),
    detect: { file: "fixtures/plain-tokens" },
  },
  {
    // In the repository, never measured.
    id: "loose-blocks",
    about: "A fixture registry of components.",
    sockets: ["components"],
    names: ["loose-blocks"],
    mcp_servers: ["loose-blocks"],
    needs: [],
    detect: { file: "fixtures/loose-blocks" },
  },
  {
    // Measured, and not in the repository.
    id: "far-eye",
    about: "A fixture skill that looks at a drawn screen.",
    kind: "skill",
    sockets: ["design-review"],
    names: ["far-eye"],
    skills: ["far-eye"],
    needs: [],
    measured: measured(["design-review"], true, "d0073"),
    detect: { file: "fixtures/far-eye-is-not-here" },
  },
].map((plug) => ({ ...plug, file: `references/plugs/${plug.id}.json` }));
const fixtureCaps = () => ({ table: real.table, plugs: copy(FIXTURE_PLUGS), problems: [] });

// A repository that holds the files of the four fixture plugs that are present.
function fixtureRepo() {
  const dir = empty();
  for (const id of ["house-system", "sharp-builder", "plain-tokens", "loose-blocks"]) {
    put(dir, `fixtures/${id}`, "here\n");
  }
  return dir;
}
const socketOf = (board, id) => board.find((socket) => socket.id === id);
const waitingIds = (dir) => (readWaiting(dir)?.rows ?? []).map((row) => row.id);
// Answers a question the way the decision sheet writes it back: in the question's own file.
function answer(dir, id, fields) {
  const file = `design/waiting/${id}.json`;
  const row = JSON.parse(read(dir, file));
  put(dir, file, `${JSON.stringify({ ...row, ...fields, by: "Owner Name", on: ON }, null, 2)}\n`);
}
const run = (dir, caps = fixtureCaps()) => carryOut(dir, plan(dir, { caps, on: ON }), false);

test("criterion 1: each socket gives the plugin's plug, the outside candidates, and for each its state, measure and needs", () => {
  const dir = fixtureRepo();
  const board = boardOf(dir, fixtureCaps());
  assert.deepEqual(
    board.map((socket) => socket.id),
    real.table.capabilities.map((item) => item.id),
  );
  for (const socket of board) {
    assert.deepEqual(Object.keys(socket), [
      "id",
      "name",
      "stage",
      "closed",
      "plugin",
      "chosen",
      "candidates",
    ]);
  }
  const direction = socketOf(board, "direction");
  assert.equal(direction.plugin, "directions");
  assert.equal(direction.chosen, null);
  assert.deepEqual(direction.candidates, [
    {
      id: "house-system",
      about: "A fixture system that holds a direction and a reference page.",
      state: "in-repo",
      measured: "d0088",
      beats_plugin: false,
      owner: null,
      needs: ["account", "network"],
      sends: "The design values of the repository, to the fixture service.",
      skills: [],
      mcp_servers: [],
    },
  ]);
  const handoff = socketOf(board, "handoff").candidates[0];
  assert.deepEqual(handoff.owner, {
    record: "d0088",
    said: "Keep at handoff and brand",
    on: "2026-11-23",
  });
  const components = socketOf(board, "components").candidates[0];
  assert.equal(components.measured, "unmeasured");
  assert.deepEqual(components.mcp_servers, ["loose-blocks"]);
  assert.equal(socketOf(board, "design-review").candidates[0].state, "absent");
  assert.equal(socketOf(board, "decision").closed, true);
  assert.deepEqual(socketOf(board, "decision").candidates, []);
  // An empty socket has no plugin's plug.
  assert.equal(socketOf(board, "reference").plugin, null);
});

test("criterion 1: the command prints the board, and --json is one document by the common contract", () => {
  const dir = empty();
  const shown = cli("--target", dir);
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /^Plugs: 20 sockets/m);
  // The real plugs: one that was measured is named with its record, one that was not says so.
  assert.match(shown.stdout, /claude-design +absent, measured in d0088, needs account, network/);
  assert.match(shown.stdout, /stitch +absent, unmeasured, needs account, network/);
  assert.match(
    shown.stdout,
    /^No outside plug that was measured is in this repository or this session; every socket keeps the plugin's plug\.$/m,
  );
  const data = cli("--target", dir, "--json");
  assert.equal(data.status, 0, data.stderr);
  const result = JSON.parse(data.stdout);
  assert.deepEqual(Object.keys(result), [
    "sockets",
    "session_listed",
    "questions",
    "later",
    "rows",
    "files",
    "dry_run",
  ]);
  assert.equal(result.session_listed, false);
  assert.equal(result.sockets.length, 20);
  assert.deepEqual(result.questions, []);
  assert.deepEqual(result.files, []);
  // A wrong call ends with 2, the reason on the error stream and no answer.
  for (const args of [["--no-such-flag"], ["--target"], ["--on", "yesterday"]]) {
    const wrong = cli(...args, "--target", dir, "--json");
    assert.equal(wrong.status, 2, args.join(" "));
    assert.equal(wrong.stdout, "", args.join(" "));
    assert.match(wrong.stderr, /^(usage|design-assembly): /, args.join(" "));
  }
});

test("criterion 4: only a socket with a measured candidate in the repository is asked, four at most a round, each question whole", () => {
  const dir = fixtureRepo();
  const first = plan(dir, { caps: fixtureCaps(), on: ON });
  // Five sockets could be asked: direction, foundations, brand-assets, screen-build and handoff.
  // components has only an unmeasured plug, design-review a measured one that is not here.
  assert.equal(ROUND, 4);
  assert.deepEqual(
    first.questions.map((question) => question.id),
    ["plug-direction", "plug-foundations", "plug-brand-assets", "plug-screen-build"],
  );
  assert.deepEqual(first.later, ["plug-handoff"]);
  for (const question of first.questions) {
    for (const key of ["question", "recommendation", "basis", "where", "if_refused"]) {
      assert.ok(typeof question[key] === "string" && question[key].trim() !== "", key);
    }
    assert.deepEqual(rowProblems(question, question.id), [], question.id);
    assert.equal(question.item, `decision:${question.id}`);
    assert.equal(question.asked_on, ON);
  }
  carryOut(dir, first, false);
  assert.deepEqual(waitingIds(dir), first.questions.map((question) => question.id).sort());
  // The questions wait: a run in between asks nothing new, and handoff waits for its round.
  const again = plan(dir, { caps: fixtureCaps(), on: ON });
  assert.deepEqual(again.later, ["plug-handoff"]);
  assert.deepEqual(Object.keys(again.files), []);
  // One answered question frees one place in the round.
  answer(dir, "plug-direction", { answer: "keep" });
  const next = run(dir);
  assert.deepEqual(
    next.questions.map((question) => question.id),
    ["plug-foundations", "plug-brand-assets", "plug-screen-build", "plug-handoff"],
  );
  assert.deepEqual(next.later, []);
  // The printed board says what waits, and that the sheet answers it.
  assert.match(report(next), /^Waiting on the owner: 4 questions/m);
  assert.match(report(next), /plug-handoff: Which plug works the showcase and hand-over socket/);
});

test("criterion 5: an outside plug is the recommendation only when its measure wins, or by the owner's named word", () => {
  const dir = fixtureRepo();
  const board = boardOf(dir, fixtureCaps());
  const at = (id) => recommendationOf(socketOf(board, id));
  // Wins its measure: first, its record named.
  assert.equal(at("screen-build").candidates[0].name, "sharp-builder");
  assert.match(at("screen-build").basis, /d0073/);
  // Measured, loses, no word of the owner: the plugin's plug, the outside plug after it.
  assert.deepEqual(
    at("direction").candidates.map((candidate) => candidate.name),
    ["directions", "house-system"],
  );
  assert.match(at("direction").basis, /did not beat the plugin's plug/);
  assert.deepEqual(
    at("foundations").candidates.map((candidate) => candidate.name),
    ["tokens", "plain-tokens"],
  );
  // The owner's named exception: first, with the record and the owner's word and its date.
  for (const id of ["brand-assets", "handoff"]) {
    assert.equal(at(id).candidates[0].name, "house-system", id);
    assert.match(at(id).basis, /d0088/, id);
    assert.match(at(id).basis, /"Keep at handoff and brand" on 2026-11-23/, id);
  }
  // Nothing to ask where nothing measured is here.
  assert.equal(at("components"), null);
  assert.equal(at("design-review"), null);
  assert.equal(at("audit"), null);
});

test("criterion 5: the real plug of the reference system is recommended at handoff and brand assets only", () => {
  // The real plug files, with the reference system made present by a file of its own.
  const caps = copy(real);
  const system = caps.plugs.find((plug) => plug.id === "claude-design");
  system.detect = { file: "fixtures/claude-design" };
  const dir = empty();
  put(dir, "fixtures/claude-design", "here\n");
  const board = boardOf(dir, caps);
  for (const id of ["handoff", "brand-assets"]) {
    const asked = recommendationOf(socketOf(board, id));
    assert.equal(asked.candidates[0].name, "claude-design", id);
    assert.match(asked.basis, /decision d0088/, id);
    assert.match(asked.basis, /the owner's word "Keep at handoff and brand" on 2026-11-23/, id);
  }
  for (const id of ["direction", "foundations"]) {
    const asked = recommendationOf(socketOf(board, id));
    assert.notEqual(asked.candidates[0].name, "claude-design", id);
    assert.ok(
      asked.candidates.some((candidate) => candidate.name === "claude-design"),
      id,
    );
  }
});

test("criterion 5, broken: a question that recommends an unmeasured plug, or a measured one that lost, is refused with its file", () => {
  const dir = fixtureRepo();
  const caps = fixtureCaps();
  const board = boardOf(dir, caps);
  const question = (socket, name) => ({
    id: `plug-${socket}`,
    candidates: [{ name }, { name: socketOf(board, socket).plugin ?? "none" }],
  });
  assert.equal(recommendationProblem(question("screen-build", "sharp-builder"), board), null);
  assert.equal(recommendationProblem(question("handoff", "house-system"), board), null);
  assert.equal(recommendationProblem(question("direction", "directions"), board), null);
  assert.equal(
    recommendationProblem(question("components", "loose-blocks"), board),
    "design/waiting/plug-components.json recommends loose-blocks, which was never measured at the components socket: an unmeasured plug is never the recommendation",
  );
  assert.equal(
    recommendationProblem(question("direction", "house-system"), board),
    "design/waiting/plug-direction.json recommends house-system, which was measured in d0088 and did not beat the plugin's plug at the direction socket, and no word of the owner names it there",
  );
  assert.equal(
    recommendationProblem(question("direction", "no-such-plug"), board),
    "design/waiting/plug-direction.json recommends no-such-plug, which is no plug of the direction socket",
  );
  // The command refuses such a waiting list, names the file, and writes nothing.
  put(
    dir,
    "design/waiting/plug-components.json",
    `${JSON.stringify(
      {
        id: "plug-components",
        kind: "question",
        question: "Which plug works the components socket in this repository?",
        recommendation: "loose-blocks",
        basis: "none",
        item: "decision:plug-components",
        candidates: [{ name: "loose-blocks" }, { name: "intake" }],
      },
      null,
      2,
    )}\n`,
  );
  assert.throws(
    () => plan(dir, { caps, on: ON }),
    /design\/waiting\/plug-components\.json recommends loose-blocks, which was never measured/,
  );
});

test("criterion 6: an answer becomes a row with a name and a date, and the same answers again ask nothing", () => {
  const dir = fixtureRepo();
  run(dir);
  answer(dir, "plug-direction", { answer: "keep" });
  answer(dir, "plug-foundations", { answer: "value", said: "plain-tokens" });
  answer(dir, "plug-brand-assets", { answer: "refuse", said: "Not yet" });
  const done = run(dir);
  assert.deepEqual(
    done.rows.map((row) => [row.id, row.plug, row.by, row.on]),
    [
      ["plug-direction", "directions", "Owner Name", ON],
      ["plug-foundations", "plain-tokens", "Owner Name", ON],
      ["plug-brand-assets", "font-source", "Owner Name", ON],
    ],
  );
  const rows = readLedger(dir);
  const row = (id) => rows.find((item) => item.id === id);
  assert.deepEqual(row("plug-direction"), {
    id: "plug-direction",
    layer: "governance",
    kind: "judgment",
    source: "plug:directions",
    note: `confirmed by Owner Name on ${ON}`,
  });
  assert.equal(row("plug-foundations").note, `answered by Owner Name on ${ON}`);
  assert.equal(row("plug-brand-assets").source, "plug:font-source");
  assert.equal(row("plug-brand-assets").note, `refused by Owner Name on ${ON}: Not yet`);
  // The answered questions leave the waiting list once their rows are written.
  for (const id of ["plug-direction", "plug-foundations", "plug-brand-assets"]) {
    assert.ok(!existsSync(path.join(dir, `design/waiting/${id}.json`)), id);
  }
  // The board says what was chosen, by whom and when.
  const chosen = socketOf(boardOf(dir, fixtureCaps()), "foundations").chosen;
  assert.deepEqual(chosen, { plug: "plain-tokens", by: "Owner Name", on: ON, state: "in-repo" });
  // The rest are answered too; then a run asks nothing, and writes nothing.
  answer(dir, "plug-screen-build", { answer: "keep" });
  answer(dir, "plug-handoff", { answer: "keep" });
  run(dir);
  const ledger = read(dir, "design/decisions.yaml");
  const settled = plan(dir, { caps: fixtureCaps(), on: "2026-12-01" });
  assert.deepEqual(settled.questions, []);
  assert.deepEqual(settled.later, []);
  assert.deepEqual(settled.rows, []);
  assert.deepEqual(Object.keys(settled.files), []);
  carryOut(dir, settled, false);
  assert.equal(read(dir, "design/decisions.yaml"), ledger);
  assert.deepEqual(readdirSync(path.join(dir, "design/waiting")), []);
});

test("criterion 6: the command writes the rows, --dry-run names the same files and writes nothing", () => {
  const dir = empty();
  // A question the command would have asked had the reference system been present, answered.
  put(
    dir,
    "design/waiting/plug-handoff.json",
    `${JSON.stringify(
      {
        id: "plug-handoff",
        kind: "question",
        question: "Which plug works the handoff socket in this repository?",
        recommendation: "claude-design",
        basis: "decision d0088",
        item: "decision:plug-handoff",
        candidates: [{ name: "claude-design" }, { name: "handoff" }],
        answer: "keep",
        by: "Owner Name",
        on: ON,
      },
      null,
      2,
    )}\n`,
  );
  const preview = cli("--target", dir, "--json", "--dry-run");
  assert.equal(preview.status, 0, preview.stderr);
  const planned = JSON.parse(preview.stdout);
  assert.equal(planned.dry_run, true);
  assert.deepEqual(planned.files, [
    { path: "design/decisions.yaml", change: "create" },
    { path: "design/waiting/plug-handoff.json", change: "delete" },
  ]);
  assert.ok(!existsSync(path.join(dir, "design/decisions.yaml")));
  const real = cli("--target", dir, "--json");
  assert.equal(real.status, 0, real.stderr);
  assert.deepEqual(JSON.parse(real.stdout).files, planned.files);
  assert.match(read(dir, "design/decisions.yaml"), /- id: plug-handoff\n/);
  assert.ok(!existsSync(path.join(dir, "design/waiting/plug-handoff.json")));
  // The choice is not in the repository: the board says so.
  const shown = cli("--target", dir);
  assert.equal(shown.status, 0);
  assert.match(
    shown.stdout,
    /chosen: claude-design by Owner Name on 2026-11-23, chosen-but-missing/,
  );
});

test("a question that waits ends the command with 1, and an unreadable waiting list with 2", () => {
  const dir = empty();
  put(
    dir,
    "design/waiting/plug-handoff.json",
    `${JSON.stringify(
      {
        id: "plug-handoff",
        kind: "question",
        question: "Which plug works the handoff socket in this repository?",
        recommendation: "handoff",
        basis: "the plugin's plug",
        item: "decision:plug-handoff",
        candidates: [{ name: "handoff" }, { name: "claude-design" }],
      },
      null,
      2,
    )}\n`,
  );
  const waits = cli("--target", dir);
  assert.equal(waits.status, 1, waits.stderr);
  assert.match(waits.stdout, /^Waiting on the owner: 1 question/m);
  put(dir, "design/waiting/plug-direction.json", "{ not json");
  const broken = cli("--target", dir, "--json");
  assert.equal(broken.status, 2);
  assert.equal(broken.stdout, "");
  assert.match(broken.stderr, /plug-direction\.json is not JSON/);
});

test("the skill of the command exists, runs the script, asks nothing itself and answers nothing for anyone", () => {
  const skill = read(PLUGIN, "skills/plugs/SKILL.md");
  assert.match(skill, /^---\nname: plugs\ndescription: \S/);
  assert.match(skill, /scripts\/plugs\.mjs --target/);
  assert.match(skill, /answers nothing for anyone and asks nothing itself/);
  assert.match(skill, /\/design-assembly:decide/);
  assert.match(skill, /--skill <name>/);
  assert.match(skill, /in-session/);
  assert.match(skill, /falling back/);
});

test("a waiting list kept as one shared file still shows the board, and stops only a run that would change it", () => {
  const dir = empty();
  put(dir, "design/waiting-list.json", `${JSON.stringify({ version: 1, rows: [] }, null, 2)}\n`);
  const shown = cli("--target", dir, "--json");
  assert.equal(shown.status, 0, shown.stderr);
  assert.equal(JSON.parse(shown.stdout).sockets.length, 20);
  const asking = fixtureRepo();
  put(asking, "design/waiting-list.json", `${JSON.stringify({ version: 1, rows: [] }, null, 2)}\n`);
  assert.throws(
    () => plan(asking, { caps: fixtureCaps(), on: ON }),
    /design\/waiting-list\.json, and this would change it: split it first/,
  );
});

test("an answer that names no candidate stops the run, and a question gone stale says the way out", () => {
  const dir = fixtureRepo();
  run(dir);
  answer(dir, "plug-direction", { answer: "value", said: "no-such-plug" });
  assert.throws(
    () => plan(dir, { caps: fixtureCaps(), on: ON }),
    /design\/waiting\/plug-direction\.json: no-such-plug is not among its candidates: directions, house-system/,
  );
  // The plug that led at screen-build is measured again and loses: its open question is stale.
  answer(dir, "plug-direction", { answer: "keep" });
  const caps = fixtureCaps();
  caps.plugs.find((plug) => plug.id === "sharp-builder").measured["screen-build"].beats_plugin =
    false;
  assert.throws(
    () => plan(dir, { caps, on: ON }),
    /plug-screen-build\.json recommends sharp-builder, which was measured in d0073 and did not beat the plugin's plug.*take design\/waiting\/plug-screen-build\.json away and run this again/,
  );
});

test("the closing line is printed only where no measured plug is in the repository", () => {
  const dir = fixtureRepo();
  for (let round = 0; round < 3; round += 1) {
    const done = run(dir);
    for (const question of done.questions) answer(dir, question.id, { answer: "refuse" });
  }
  const settled = run(dir);
  assert.deepEqual(settled.questions, []);
  assert.doesNotMatch(
    report(settled),
    /No outside plug that was measured is in this repository or this session/,
  );
});

// ---- slice 2: the session, the fallback, the page, and the routes that call the step ----------

const SESSION = (fields = {}) => ({ skills: [], servers: [], signIn: [], ...fields });

test("criterion 3: the session's skills and servers are matched to the plug files by the names they declare, and only those", () => {
  const dir = fixtureRepo();
  const at = (session, socket, id) =>
    socketOf(boardOf(dir, fixtureCaps(), undefined, session), socket).candidates.find(
      (candidate) => candidate.id === id,
    ).state;
  // A skill listed under a plugin's name, or bare, is the plug that declares that name.
  assert.equal(at(SESSION({ skills: ["far-eye"] }), "design-review", "far-eye"), "in-session");
  assert.equal(
    at(SESSION({ skills: ["their-plugin:far-eye"] }), "design-review", "far-eye"),
    "in-session",
  );
  // A name the plug files do not declare is nobody's, however close.
  for (const skills of [["far"], ["far-eye-2"], ["their-plugin:far-eye-2"], ["far-eye:x"]]) {
    assert.equal(at(SESSION({ skills }), "design-review", "far-eye"), "absent", skills.join());
  }
  // A server is matched to the servers a plug declares, never to its skills, and the other way.
  const servers = boardOf(dir, fixtureCaps(), undefined, SESSION({ servers: ["far-eye"] }));
  assert.equal(socketOf(servers, "design-review").candidates[0].state, "absent");
  const blocks = fixtureCaps();
  blocks.plugs.find((plug) => plug.id === "loose-blocks").detect = { file: "fixtures/none" };
  const listed = boardOf(dir, blocks, undefined, SESSION({ servers: ["their-host:loose-blocks"] }));
  assert.equal(socketOf(listed, "components").candidates[0].state, "in-session");
  // A server that is there and not given access needs a sign-in.
  const waiting = boardOf(dir, blocks, undefined, SESSION({ signIn: ["loose-blocks"] }));
  assert.equal(socketOf(waiting, "components").candidates[0].state, "needs-sign-in");
  // A plug in the repository stays in-repo whatever the session holds.
  assert.equal(
    at(SESSION({ skills: ["sharp-builder"] }), "screen-build", "sharp-builder"),
    "in-repo",
  );
});

test("criterion 3: a measured plug the session holds is asked about, as one the repository holds", () => {
  const dir = empty();
  const asked = plan(dir, {
    caps: fixtureCaps(),
    on: ON,
    session: SESSION({ skills: ["their-plugin:far-eye"] }),
  });
  assert.deepEqual(
    asked.questions.map((question) => question.id),
    ["plug-design-review"],
  );
  assert.equal(asked.questions[0].candidates[0].name, "far-eye");
  // The command takes the session as flags, and the real plug files: the reviewer skill of the
  // design review socket is measured and does not beat the plugin's plug, so the plugin's comes first.
  const real = cli("--target", empty(), "--json", "--skill", "some-plugin:design-critique");
  assert.equal(real.status, 1, real.stderr);
  const [question] = JSON.parse(real.stdout).questions;
  assert.equal(question.id, "plug-design-review");
  assert.deepEqual(
    question.candidates.map((candidate) => candidate.name),
    ["review", "design-critique"],
  );
  // A server that waits for a sign-in is shown, with how to give it access, and is not asked about.
  const signIn = cli("--target", empty(), "--needs-sign-in", "reui");
  assert.equal(signIn.status, 0, signIn.stderr);
  assert.match(signIn.stdout, /reui +needs-sign-in, unmeasured/);
  assert.match(
    signIn.stdout,
    /^reui waits for a sign-in: give its server access in the session, then run this again\.$/m,
  );
});

test("criterion 8: a socket whose chosen plug from outside the session does not have falls back to the plugin's plug, and says so", () => {
  const dir = fixtureRepo();
  put(
    dir,
    "design/decisions.yaml",
    'version: 1\ndecisions:\n  - id: plug-design-review\n    layer: governance\n    kind: judgment\n    source: "plug:far-eye"\n    note: "confirmed by Owner Name on 2026-11-23"\n',
  );
  const missing = socketOf(boardOf(dir, fixtureCaps(), undefined, SESSION()), "design-review");
  assert.equal(missing.chosen.state, "chosen-but-missing");
  assert.equal(
    fallbackOf(missing),
    "falling back at the design review socket: far-eye was chosen and is not here; the plugin's plug review works it until it is",
  );
  const here = socketOf(
    boardOf(dir, fixtureCaps(), undefined, SESSION({ skills: ["far-eye"] })),
    "design-review",
  );
  assert.equal(here.chosen.state, "in-session");
  assert.equal(fallbackOf(here), null);
  // A run that lists no session does not say the plug is missing from it.
  const unlisted = carryOut(dir, plan(dir, { caps: fixtureCaps(), on: ON }), true);
  assert.doesNotMatch(report(unlisted), /falling back/);
  assert.match(
    report(unlisted),
    /^far-eye was chosen for the design review socket and the repository does not show it; the session was not listed/m,
  );
  // The board prints the line.
  const result = carryOut(
    dir,
    plan(dir, { caps: fixtureCaps(), on: ON, session: SESSION() }),
    true,
  );
  assert.match(report(result), /^falling back at the design review socket: far-eye was chosen/m);
});

test("criterion 8, on the design review route: the eye the owner chose looks only where the session has it, else the command's run alone, saying so", () => {
  const dir = empty();
  const caps = copy(real);
  const [eye] = eyesOf(caps);
  // No choice: every eye the board names, as before.
  assert.deepEqual(eyeChoice(dir, null, caps), {
    eyes: eyesOf(caps),
    chosen: null,
    falling_back: null,
  });
  put(
    dir,
    "design/decisions.yaml",
    `version: 1\ndecisions:\n  - id: plug-design-review\n    layer: governance\n    kind: judgment\n    source: "plug:${eye.id}"\n    note: "confirmed by Owner Name on 2026-11-23"\n`,
  );
  // The session has it: that eye, and no other.
  const held = eyeChoice(dir, [`some-plugin:${eye.names[0]}`], caps);
  assert.deepEqual(held.eyes, [eye]);
  assert.equal(held.falling_back, null);
  // The session does not: no eye, and the line that says the plugin's plug works alone.
  const lacking = eyeChoice(dir, ["some-plugin:another-skill"], caps);
  assert.deepEqual(lacking.eyes, []);
  assert.match(
    lacking.falling_back,
    new RegExp(
      `^falling back at the design review socket: ${eye.id} was chosen and is not here; the plugin's plug review works it until it is$`,
    ),
  );
  // The review's answer for a person carries the line.
  assert.match(
    eyeLines({ eye: { looked: false }, eyes: [], falling_back: lacking.falling_back }).join("\n"),
    /^falling back at the design review socket/m,
  );
  // The owner chose the plugin's own plug: no eye from outside is handed the pictures.
  put(
    dir,
    "design/decisions.yaml",
    'version: 1\ndecisions:\n  - id: plug-design-review\n    layer: governance\n    kind: judgment\n    source: "plug:review"\n    note: "confirmed by Owner Name on 2026-11-23"\n',
  );
  assert.deepEqual(eyeChoice(dir, null, caps).eyes, []);
});

test("the overview page: every socket by stage, each candidate with its state, its measure or an invitation to measure it, and what it needs", () => {
  const dir = empty();
  const out = empty();
  const shown = cli("--target", dir, "--out", out);
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /^document: .*plugs-board\.html$/m);
  const page = read(out, "plugs-board.html");
  for (const item of real.table.capabilities) assert.ok(page.includes(item.name), item.id);
  assert.match(page, /claude-design/);
  assert.match(page, /measured in decision d0088/);
  assert.match(page, /unmeasured: it can be measured on a throwaway copy/);
  assert.match(page, /sends: The design values and files of the repository/);
  const data = JSON.parse(cli("--target", dir, "--out", empty(), "--json").stdout);
  assert.equal(data.files.length, 1);
  assert.match(data.files[0].path, /plugs-board\.html$/);
  const doc = documentOf(plan(dir, { on: ON }), { name: "fixture", date: null, revision: null });
  assert.deepEqual(documentProblems(doc), []);
});

test("--short gives one line where nothing is asked, and the questions where some are", () => {
  const dir = empty();
  const short = cli("--target", dir, "--short");
  assert.equal(short.status, 0, short.stderr);
  assert.deepEqual(short.stdout.trim().split("\n"), [
    "Plugs: 20 sockets: 2 are closed, 8 have only the plugin's plug, 10 have plugs from outside, 5 of them a measured one.",
    "No outside plug that was measured is in this repository or this session; every socket keeps the plugin's plug.",
  ]);
  const asking = cli("--target", empty(), "--short", "--skill", "design-critique");
  assert.equal(asking.status, 1);
  assert.match(asking.stdout, /^Waiting on the owner: 1 question/m);
  assert.doesNotMatch(asking.stdout, /^ {2}audit/m);
});

test("new and adopt call the step once, before the direction layer, and go on when it asks nothing", () => {
  for (const skill of ["new", "adopt"]) {
    const page = read(PLUGIN, `skills/${skill}/SKILL.md`);
    assert.match(page, /scripts\/plugs\.mjs --target <repo> --short/, skill);
    assert.match(page, /--skill/, skill);
    assert.match(page, /once/, skill);
    assert.match(page, /does not stop/, skill);
  }
  const guide = read(PLUGIN, "skills/new/SKILL.md");
  assert.ok(guide.indexOf("plugs.mjs") < guide.indexOf("### Directions first"));
});

test("the reference system is seen in a session by its command design-sync, and is then asked about at the four sockets it fills", () => {
  const dir = empty();
  const asked = plan(dir, { on: ON, session: SESSION({ skills: ["design-sync"] }) });
  const first = (socket) =>
    asked.questions.find((question) => question.id === `plug-${socket}`).candidates[0].name;
  assert.deepEqual(
    asked.questions.map((question) => question.id),
    ["plug-direction", "plug-foundations", "plug-brand-assets", "plug-handoff"],
  );
  assert.equal(first("handoff"), "claude-design");
  assert.equal(first("brand-assets"), "claude-design");
  assert.equal(first("direction"), "directions");
  assert.equal(first("foundations"), "tokens");
  // The bare word of its other command is no name of it.
  assert.deepEqual(plan(dir, { on: ON, session: SESSION({ skills: ["design"] }) }).questions, []);
});
