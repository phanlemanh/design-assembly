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
      "brand-assets": {
        record: "d0088",
        said: "Keep at handoff and brand",
        on: "2026-11-23",
        sends: "The design values of the repository, to the fixture service.",
      },
      handoff: {
        record: "d0088",
        said: "Keep at handoff and brand",
        on: "2026-11-23",
        sends: "The design values of the repository, to the fixture service.",
      },
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
      "ladder",
    ]);
  }
  const direction = socketOf(board, "direction");
  // Only the components socket has a ladder (spec 0015).
  assert.equal(direction.ladder, null);
  assert.equal(socketOf(board, "components").ladder.plug, "intake");
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
    sends: "The design values of the repository, to the fixture service.",
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
    "session_read",
    "questions",
    "later",
    "withdrawn",
    "reasked",
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
  // The unmeasured fixture registry fills a socket with no ladder too, where it can be recommended
  // wrongly; at the components socket, a ladder socket, no question is asked at all.
  caps.plugs.find((plug) => plug.id === "loose-blocks").sockets = ["components", "design-review"];
  const board = boardOf(dir, caps);
  const question = (socket, name) => ({
    id: `plug-${socket}`,
    candidates: [{ name }, { name: socketOf(board, socket).plugin ?? "none" }],
  });
  assert.equal(recommendationProblem(question("screen-build", "sharp-builder"), board), null);
  assert.equal(recommendationProblem(question("handoff", "house-system"), board), null);
  assert.equal(recommendationProblem(question("direction", "directions"), board), null);
  assert.equal(
    recommendationProblem(question("design-review", "loose-blocks"), board),
    "design/waiting/plug-design-review.json recommends loose-blocks, which was never measured at the design-review socket: an unmeasured plug is never the recommendation",
  );
  assert.equal(
    recommendationProblem(question("components", "intake"), board),
    "design/waiting/plug-components.json asks about the components socket, where a plug from outside is a rung of intake, not a rival: no question is asked there",
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
    "design/waiting/plug-design-review.json",
    `${JSON.stringify(
      {
        id: "plug-design-review",
        kind: "question",
        question: "Which plug works the design review socket in this repository?",
        recommendation: "loose-blocks",
        basis: "none",
        item: "decision:plug-design-review",
        candidates: [{ name: "loose-blocks" }, { name: "review" }],
      },
      null,
      2,
    )}\n`,
  );
  assert.throws(
    () => plan(dir, { caps, on: ON }),
    /design\/waiting\/plug-design-review\.json recommends loose-blocks, which was never measured/,
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

test("criterion 3: names the command cannot read one by one are a wrong call, never a session that holds nothing", () => {
  const dir = fixtureRepo();
  const files = () => readdirSync(dir, { recursive: true }).sort();
  const before = files();
  // As a session's names reach the command when a shell does not split them: one value of all.
  const joined = "archify council far-eye frontend-design design:design-critique";
  for (const flag of ["--skill", "--server", "--needs-sign-in"]) {
    for (const value of [joined, "far-eye\tsharp-builder", "far-eye\nsharp-builder", ""]) {
      const said = `${flag} ${JSON.stringify(value)}`;
      const called = cli("--target", dir, "--short", "--session", flag, value);
      assert.equal(called.status, 2, said);
      assert.equal(called.stdout, "", said);
      assert.match(called.stderr, new RegExp(`^design-assembly: ${flag} `), said);
      assert.match(called.stderr, /a flag of its own/, said);
      assert.doesNotMatch(called.stderr, /No outside plug that was measured/, said);
    }
  }
  // A comma or a semicolon between names is refused the same way, in whatever order the names are.
  for (const value of [
    "archify,frontend-design,design:design-critique",
    "design:design-critique,frontend-design,archify",
    "far-eye;sharp-builder",
  ]) {
    const called = cli("--target", dir, "--short", "--session", "--dry-run", "--skill", value);
    assert.equal(called.status, 2, value);
    assert.equal(called.stdout, "", value);
    assert.match(called.stderr, /a flag of its own/, value);
  }
  const named = cli("--target", dir, "--session", "--skill", joined).stderr;
  assert.match(named, /"archify council far-eye …"/);
  // Nothing was written.
  assert.deepEqual(files(), before);
});

test("criterion 3: the command says how many names of each kind it read from the session, short or not, and in --json", () => {
  const dir = fixtureRepo();
  const args = [
    "--target",
    dir,
    "--session",
    "--dry-run",
    "--skill",
    "far-eye",
    "--skill",
    "their-plugin:sharp-builder",
    "--server",
    "loose-blocks",
    "--needs-sign-in",
    "a-host",
    "--needs-sign-in",
    "b-host",
    "--needs-sign-in",
    "c-host",
  ];
  const line = "Read from the session: 2 skills, 1 server, 3 servers waiting for a sign-in.";
  for (const short of [true, false]) {
    const printed = cli(...args, ...(short ? ["--short"] : []));
    assert.ok(
      printed.stdout.split("\n").includes(line),
      `${short ? "--short" : "full"}: ${printed.stdout}`,
    );
  }
  const data = JSON.parse(cli(...args, "--json").stdout);
  assert.deepEqual(data.session_read, { skills: 2, servers: 1, needs_sign_in: 3 });
  // One of each, as the stopped run's call would have read, says so in the singular.
  const one = cli(
    "--target",
    dir,
    "--session",
    "--dry-run",
    "--short",
    "--skill",
    "x",
    "--server",
    "y",
    "--needs-sign-in",
    "z",
  );
  assert.match(
    one.stdout,
    /^Read from the session: 1 skill, 1 server, 1 server waiting for a sign-in\.$/m,
  );
  // It is a statement of what was read: no session listed, no line, and the questions are the same.
  const unlisted = cli("--target", dir, "--dry-run", "--short");
  assert.doesNotMatch(unlisted.stdout, /Read from the session/);
  assert.equal(JSON.parse(cli("--target", dir, "--dry-run", "--json").stdout).session_read, null);
  const none = cli("--target", dir, "--dry-run", "--short", "--session");
  assert.match(
    none.stdout,
    /^Read from the session: 0 skills, 0 servers, 0 servers waiting for a sign-in\.$/m,
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
  assert.match(signIn.stdout, /reui +needs-sign-in, measured in d0096/);
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
    "Plugs: 20 sockets: 2 are closed, 8 have only the plugin's plug, 10 have plugs from outside, 7 of them a measured one.",
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

test("every page that passes the session's names says one name to a flag, written out, on any shell", () => {
  for (const skill of ["new", "adopt", "plugs", "review"]) {
    const page = read(PLUGIN, `skills/${skill}/SKILL.md`);
    assert.match(page, /each name a flag of its own/, skill);
    assert.match(page, /never several names in one value/, skill);
    assert.match(page, /joined by a comma/, skill);
    // Advice true of one shell only would mislead a builder on another.
    assert.doesNotMatch(page, /\b(zsh|bash|fish|PowerShell)\b/, skill);
  }
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

// ---- review of slice 1: a question that outlives its plug, and choosing again -------------------

test("review: a waiting question whose plugs are known to be gone is taken away, and said; one not known to be gone stays", () => {
  const dir = fixtureRepo();
  run(dir);
  rmSync(path.join(dir, "fixtures/house-system"));
  const after = run(dir);
  assert.deepEqual(
    after.withdrawn.map((item) => [item.id, item.plugs]),
    [
      ["plug-direction", ["house-system"]],
      ["plug-brand-assets", ["house-system"]],
    ],
  );
  for (const id of ["plug-direction", "plug-brand-assets"]) {
    assert.ok(!existsSync(path.join(dir, `design/waiting/${id}.json`)), id);
  }
  assert.ok(after.files.some((file) => file.change === "delete"));
  assert.match(
    report(after),
    /^Taken away: plug-direction asked about house-system, which is no longer here\.$/m,
  );
  // The sockets still asked keep their questions, and handoff, with nothing here, is not asked.
  assert.deepEqual(
    after.questions.map((question) => question.id),
    ["plug-foundations", "plug-screen-build"],
  );
  assert.deepEqual(after.later, []);
  // A plug only a session holds, run with no session listed, is not known to be gone: it stays.
  const caps = fixtureCaps();
  delete caps.plugs.find((plug) => plug.id === "far-eye").detect;
  const session = empty();
  const held = SESSION({ skills: ["far-eye"] });
  carryOut(session, plan(session, { caps, on: ON, session: held }), false);
  assert.deepEqual(carryOut(session, plan(session, { caps, on: ON }), false).withdrawn, []);
  assert.ok(existsSync(path.join(session, "design/waiting/plug-design-review.json")));
  // Listed, and not in it: gone.
  const listed = carryOut(session, plan(session, { caps, on: ON, session: SESSION() }), false);
  assert.deepEqual(
    listed.withdrawn.map((item) => item.id),
    ["plug-design-review"],
  );
});

test("review: a recorded choice is asked again with --reask, without a hand edit of the ledger", () => {
  const dir = fixtureRepo();
  run(dir);
  answer(dir, "plug-direction", { answer: "refuse", said: "later" });
  run(dir);
  assert.equal(
    readLedger(dir).find((row) => row.id === "plug-direction").source,
    "plug:directions",
  );
  const again = carryOut(
    dir,
    plan(dir, { caps: fixtureCaps(), on: ON, reask: ["direction"] }),
    false,
  );
  assert.equal(
    readLedger(dir).find((row) => row.id === "plug-direction"),
    undefined,
  );
  // Asked again in its turn: four questions wait already, so it comes in the next round.
  assert.deepEqual(again.later, ["plug-direction"]);
  assert.doesNotThrow(() =>
    readWaiting(
      dir,
      readLedger(dir).map((row) => String(row.id)),
    ),
  );
  assert.throws(
    () => plan(dir, { caps: fixtureCaps(), on: ON, reask: ["nowhere"] }),
    /--reask nowhere names no socket/,
  );
  const skill = read(PLUGIN, "skills/plugs/SKILL.md");
  assert.match(skill, /--reask <socket>/);
});

test("review: --reask says which row left, with the plug, name and day it carried, and the pages say when to use it", () => {
  const dir = fixtureRepo();
  run(dir);
  answer(dir, "plug-direction", { answer: "refuse", said: "later" });
  run(dir);
  const again = carryOut(
    dir,
    plan(dir, { caps: fixtureCaps(), on: ON, reask: ["direction"] }),
    false,
  );
  assert.deepEqual(again.reasked, [
    { id: "plug-direction", plug: "directions", by: "Owner Name", on: ON },
  ]);
  assert.match(
    report(again),
    /^Taken out: plug-direction, which chose directions by Owner Name on 2026-11-23; the socket is asked again in its turn\.$/m,
  );
  const skill = read(PLUGIN, "skills/plugs/SKILL.md");
  assert.match(skill, /only when the person asks to choose again/i);
  for (const page of ["new", "adopt"]) {
    const text = read(PLUGIN, `skills/${page}/SKILL.md`);
    assert.match(text, /may leave questions on the waiting list/, page);
  }
});

test("review: the owner's named exception at handoff and brand assets holds only for the place the word was said of", () => {
  const caps = copy(real);
  const system = caps.plugs.find((plug) => plug.id === "claude-design");
  system.detect = { file: "fixtures/claude-design" };
  system.sends = "The whole repository, to another service.";
  const dir = empty();
  put(dir, "fixtures/claude-design", "here\n");
  const board = boardOf(dir, caps);
  for (const id of ["handoff", "brand-assets"]) {
    const asked = recommendationOf(socketOf(board, id));
    assert.notEqual(asked.candidates[0].name, "claude-design", id);
  }
});

// ---- specification 0015, slice 1: at the components socket an outside plug is a rung ------------

// A pinned outside source of the given id, as the sources ledger keeps one file per source.
const pinSource = (dir, id, order = 1) =>
  put(
    dir,
    `design/sources/${id}.json`,
    `${JSON.stringify({ version: 1, id, order, pin: { version: "1.0.0" } }, null, 2)}\n`,
  );
// The fixture registry, measured at the components socket where it did not beat intake.
const measuredBlocks = () => {
  const caps = fixtureCaps();
  caps.plugs.find((plug) => plug.id === "loose-blocks").measured = measured(
    ["components"],
    false,
    "d0096",
  );
  return caps;
};

test("spec 0015 criterion 2: at the components socket an outside plug is a rung of intake, and no question is asked there", () => {
  const dir = fixtureRepo();
  const caps = measuredBlocks();
  const components = socketOf(boardOf(dir, caps), "components");
  // The ladder of the repository, in intake's three rungs, and no source pinned yet.
  assert.deepEqual(components.ladder, {
    plug: "intake",
    rungs: [
      { rung: 1, store: "repo" },
      { rung: 2, store: "starter" },
      { rung: 2, store: "family" },
      { rung: 3, store: "by-hand" },
    ],
  });
  assert.equal(components.candidates[0].rung, null);
  // Measured and lost, and still no question: losing is no reason to keep the plugin's plug.
  assert.equal(recommendationOf(components), null);
  assert.ok(!plan(dir, { caps, on: ON }).questions.some((q) => q.id === "plug-components"));
  // The other sockets keep the rule of the four measures.
  assert.equal(socketOf(boardOf(dir, caps), "direction").ladder, null);
  assert.equal(
    recommendationOf(socketOf(boardOf(dir, caps), "direction")).candidates[0].name,
    "directions",
  );
  // Pinned as a source, the plug stands on rung 2, after the starter kit, in the order of its pin.
  pinSource(dir, "other-source", 1);
  pinSource(dir, "loose-blocks", 2);
  const pinned = socketOf(boardOf(dir, caps), "components");
  assert.deepEqual(
    pinned.ladder.rungs.map((rung) => [rung.rung, rung.store]),
    [
      [1, "repo"],
      [2, "starter"],
      [2, "family"],
      [2, "sources/other-source"],
      [2, "sources/loose-blocks"],
      [3, "by-hand"],
    ],
  );
  assert.equal(pinned.candidates[0].rung, 2);
  // A pinned source that cannot be read keeps its place, and says why.
  put(dir, "design/sources/broken.json", "not json\n");
  const broken = socketOf(boardOf(dir, caps), "components").ladder.rungs.find(
    (rung) => rung.store === "sources/broken",
  );
  assert.match(broken.unreadable, /is not valid JSON/);
  rmSync(path.join(dir, "design/sources/broken.json"));
  // The printed board shows the ladder and where the plug stands on it.
  const text = report(plan(dir, { caps, on: ON }));
  assert.match(
    text,
    /^ {4}ladder of intake: 1 the repository's own store; 2 the starter kit of this plugin, then the family's store, then the outside sources other-source, loose-blocks; 3 made by hand$/m,
  );
  assert.match(
    text,
    /^ {4}loose-blocks +in-repo, measured in d0096, rung 2 of intake as the source loose-blocks$/m,
  );
  assert.match(
    report(plan(dir, { caps, on: ON }), { short: true }),
    /^loose-blocks is in this repository and pinned as the source loose-blocks: it stands on rung 2 of intake at the components socket\.$/m,
  );
});

test("spec 0015 criterion 2: on a copy that holds the real registry and pins no source, the board says find and intake do not reach it", () => {
  const dir = empty();
  put(dir, "src/components/reui/filters.tsx", "export {};\n");
  const shown = cli("--target", dir, "--json");
  assert.equal(shown.status, 0, shown.stderr);
  const result = JSON.parse(shown.stdout);
  assert.deepEqual(result.questions, []);
  const components = result.sockets.find((socket) => socket.id === "components");
  const reui = components.candidates.find((candidate) => candidate.id === "reui");
  assert.equal(reui.state, "in-repo");
  assert.equal(reui.rung, null);
  const short = cli("--target", dir, "--short");
  assert.equal(short.status, 0, short.stderr);
  assert.match(
    short.stdout,
    /^reui is in this repository and is no pinned source, so find and intake do not reach it at the components socket: pin it by hand in design\/sources\/, as a source of its id or one that names it in plug, to put it on rung 2 of intake\.$/m,
  );
  assert.doesNotMatch(short.stdout, /plug-components/);
  // A measured plug is here, so the board does not say that none is.
  assert.doesNotMatch(short.stdout, /No outside plug that was measured is in this repository/);
  // The same copy with the registry pinned as a source: it stands on rung 2, and still nothing is asked.
  pinSource(dir, "reui");
  const pinned = JSON.parse(cli("--target", dir, "--json").stdout);
  assert.deepEqual(pinned.questions, []);
  const ladder = pinned.sockets.find((socket) => socket.id === "components");
  assert.equal(ladder.candidates.find((candidate) => candidate.id === "reui").rung, 2);
  assert.deepEqual(
    ladder.ladder.rungs.map((rung) => rung.store),
    ["repo", "starter", "family", "sources/reui", "by-hand"],
  );
  const full = cli("--target", dir);
  assert.equal(full.status, 0, full.stderr);
  assert.match(
    full.stdout,
    /^ {4}ladder of intake: 1 the repository's own store; 2 the starter kit of this plugin, then the family's store, then the outside source reui; 3 made by hand$/m,
  );
  assert.match(
    full.stdout,
    /^reui is in this repository and pinned as the source reui: it stands on rung 2 of intake at the components socket\.$/m,
  );
});

test("spec 0015 criterion 2: a waiting question about the components socket is taken away and said; an answered one still becomes a row", () => {
  const dir = fixtureRepo();
  const caps = measuredBlocks();
  const stale = (fields = {}) =>
    put(
      dir,
      "design/waiting/plug-components.json",
      `${JSON.stringify(
        {
          id: "plug-components",
          kind: "question",
          group: "plugs",
          question: "Which plug works the components socket in this repository?",
          recommendation: "intake: The plugin's own plug, as today.",
          basis: "loose-blocks (decision d0096) did not beat the plugin's plug",
          item: "decision:plug-components",
          asked_on: ON,
          candidates: [{ name: "intake" }, { name: "loose-blocks" }],
          ...fields,
        },
        null,
        2,
      )}\n`,
    );
  stale();
  const after = run(dir, caps);
  assert.deepEqual(
    after.withdrawn.filter((item) => item.id === "plug-components"),
    [{ id: "plug-components", plugs: [], ladder: true }],
  );
  assert.ok(!existsSync(path.join(dir, "design/waiting/plug-components.json")));
  assert.match(
    report(after),
    /^Taken away: plug-components asked which plug works the components socket, where an outside plug is a rung of intake, not a rival: no question is asked there\.$/m,
  );
  // The owner's answer is never thrown away: an answered question becomes its row.
  stale({ answer: "keep", by: "Owner Name", on: ON });
  const kept = run(dir, caps);
  assert.deepEqual(
    kept.rows.filter((row) => row.id === "plug-components"),
    [{ id: "plug-components", plug: "intake", by: "Owner Name", on: ON }],
  );
  // An answer that names the outside plug is kept as the owner's word, and read as not applied.
  stale({ answer: "value", said: "loose-blocks", by: "Owner Name", on: ON });
  rmSync(path.join(dir, "design/decisions.yaml"));
  run(dir, caps);
  assert.equal(socketOf(boardOf(dir, caps), "components").chosen.state, "kept-not-applied");
});

// A row of the decision ledger that chose a plug for the components socket, as an answered question
// wrote it before that socket had a ladder.
const choiceRow = (dir, plug) =>
  put(
    dir,
    "design/decisions.yaml",
    `version: 1\ndecisions:\n  - id: plug-components\n    layer: governance\n    kind: judgment\n    source: "plug:${plug}"\n    note: "answered by Owner Name on 2026-11-23"\n`,
  );

test("spec 0015 review: --reask at a ladder socket is refused, and the owner's recorded choice stays", () => {
  const dir = fixtureRepo();
  choiceRow(dir, "loose-blocks");
  const before = read(dir, "design/decisions.yaml");
  assert.throws(
    () => plan(dir, { caps: measuredBlocks(), on: ON, reask: ["components"] }),
    /--reask components names the components socket, where no question is asked: an outside plug there is a rung of intake, not a rival to it, so the recorded choice stays\. Nothing was written/,
  );
  // The command, with the real plug files: refused with --dry-run and without, the ledger unchanged.
  const copyDir = empty();
  choiceRow(copyDir, "reui");
  const kept = read(copyDir, "design/decisions.yaml");
  for (const args of [["--dry-run"], []]) {
    const refused = cli("--target", copyDir, "--reask", "components", "--short", ...args);
    assert.equal(refused.status, 2, args.join(" "));
    assert.equal(refused.stdout, "", args.join(" "));
    assert.match(
      refused.stderr,
      /--reask components names the components socket, where no question is asked/,
    );
    assert.equal(read(copyDir, "design/decisions.yaml"), kept, args.join(" "));
  }
  assert.equal(read(dir, "design/decisions.yaml"), before);
  // Another socket is still asked again.
  assert.doesNotThrow(() => plan(dir, { caps: measuredBlocks(), on: ON, reask: ["direction"] }));
});

test("spec 0015 review: a recorded choice of an outside plug at a ladder socket is kept and not applied, and every reader says so", async () => {
  const dir = fixtureRepo();
  choiceRow(dir, "loose-blocks");
  const caps = measuredBlocks();
  const components = socketOf(boardOf(dir, caps), "components");
  assert.equal(components.chosen.state, "kept-not-applied");
  assert.equal(components.chosen.plug, "loose-blocks");
  assert.equal(fallbackOf(components), null);
  const text = report(plan(dir, { caps, on: ON }));
  assert.match(
    text,
    /^ {2}components +intake; an earlier choice of loose-blocks by Owner Name on 2026-11-23 is kept, not applied: intake works this socket, and loose-blocks counts only as a pinned source$/m,
  );
  assert.doesNotMatch(text, /chosen: loose-blocks/);
  // The page says the same.
  const page = JSON.stringify(documentOf(plan(dir, { caps, on: ON }), "test"));
  assert.match(
    page,
    /intake, the plugin's own; an earlier choice of loose-blocks, by Owner Name on 2026-11-23, is kept, not applied/,
  );
  // A choice of the plugin's own plug there is simply the plugin's.
  choiceRow(dir, "intake");
  assert.equal(socketOf(boardOf(dir, caps), "components").chosen.state, "plugin");
  // status, with the real plug files, does not call it chosen.
  const copyDir = empty();
  choiceRow(copyDir, "reui");
  put(copyDir, "src/components/reui/filters.tsx", "export {};\n");
  const status = spawnSync(
    execPath,
    [path.join(PLUGIN, "scripts/status.mjs"), "--target", copyDir],
    {
      encoding: "utf8",
    },
  );
  assert.match(
    status.stdout,
    /^ {2}kept, not applied: reui \(components\), where intake works the socket$/m,
  );
  assert.doesNotMatch(status.stdout, /^ {2}chosen: .*reui \(components\)/m);
  const plugsJson = JSON.parse(cli("--target", copyDir, "--json").stdout);
  assert.equal(
    plugsJson.sockets.find((socket) => socket.id === "components").chosen.state,
    "kept-not-applied",
  );
});
