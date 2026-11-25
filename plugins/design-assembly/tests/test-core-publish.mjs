// Publishing a family's core (spec 0016, criterion 14 and answer 9): the leave of the family's
// owner, for the family and for one place, recorded with their name and the day and taken back the
// same way; before any push, exactly what would go where; a push the session made, recorded; and a
// refusal that leaves the folder as usable as before. No test creates a repository or pushes: the
// scripts call no network, and every call here runs with the network unreachable.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import { placeOf } from "../scripts/core-publish.mjs";

import {
  adopted,
  change,
  cleanup,
  core,
  coreFolder,
  empty,
  FAMILY,
  gate,
  git,
  join,
  listIn,
  OWNER,
  primaryOf,
  put,
  read,
  snapshot,
} from "./helpers/core-family.mjs";

after(cleanup);

const ON = "2026-11-28";
const PLACE = "github.com/acme/family-core";
// Every call with the network unreachable: a script that reached out would fail, and say for what.
const LOG = path.join(empty(), "network.log");
const publish = (place, list, more = []) =>
  core(["--publish", "--core", place, ...more], list, {
    guard: true,
    env: { DESIGN_ASSEMBLY_NETWORK_LOG: LOG },
  });
const allow = (place, list, to = PLACE, more = []) =>
  publish(place, list, ["--allow", "--to", to, "--by", OWNER, "--on", ON, ...more]);
after(() => assert.ok(!existsSync(LOG), "a move of publishing reached for the network"));

test("with no leave nothing is sent: the command says what would go, and that the owner is asked first", () => {
  const place = coreFolder();
  const list = listIn();
  const before = snapshot(place);
  const said = publish(place, list);
  assert.equal(said.status, 1, said.stderr);
  assert.match(said.stdout, /leave to publish: none yet/);
  assert.match(
    said.stdout,
    /nothing is sent: the family's owner has not given leave to publish this core/,
  );
  // No line a session would push on.
  assert.doesNotMatch(said.stdout, /^sends: /m);
  assert.doesNotMatch(said.stdout, /^to: /m);
  assert.match(
    said.stdout,
    /nothing was sent: this command calls no network, and the local folder is usable as it is/,
  );
  assert.deepEqual(snapshot(place), before);
  assert.ok(!existsSync(list), "looking writes no list");
  const data = JSON.parse(publish(place, list, ["--json"]).stdout);
  assert.equal(data.sends, false);
  assert.equal(data.leave.state, "none");
  assert.deepEqual(
    data.files.map((item) => item.file),
    ["answers.json", "blocks/index.json", "core.json"],
  );
  // A push is recorded only for a place the owner allowed.
  const pushed = publish(place, list, ["--pushed", "--by", OWNER, "--to", PLACE]);
  assert.equal(pushed.status, 2);
  assert.match(pushed.stderr, /no push is recorded: the family's owner has not given leave/);
  assert.deepEqual(snapshot(place), before);
});

test("a refusal leaves the folder fully usable: it holds its shape, changes, and takes a member", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  // The person says no: nothing is recorded, and nothing of the folder changed.
  const before = snapshot(place);
  assert.equal(publish(place, list).status, 1);
  const back = publish(place, list, ["--revoke", "--by", OWNER]);
  assert.equal(back.status, 0, back.stderr);
  assert.match(back.stdout, /no leave to publish .* was given: there is nothing to take back/);
  assert.deepEqual(snapshot(place), before);
  // The core works as before: checked, changed by its owner, joined by a repository.
  assert.equal(core(["--check", "--core", place], list).status, 0);
  change(place, list, "record-panel", [
    "--hold",
    "default",
    "--why",
    "one app opens records in place",
  ]);
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
});

test("the leave is a line of the core's declaration: who, when and for which place; it is taken back the same way", () => {
  const place = coreFolder();
  const list = listIn();
  // Said first: a dry run writes nothing.
  const before = snapshot(place);
  const declared = read(place, "core.json");
  const dry = allow(place, list, "git@github.com:acme/family-core.git", ["--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(
    dry.stdout,
    /would record: .* gives leave on 2026-11-28 to publish the family core .* to github\.com\/acme\/family-core, a private repository, and nowhere else/,
  );
  assert.deepEqual(snapshot(place), before);

  // Given: the place is kept as host and path, however the address was written.
  const given = allow(place, list, "git@github.com:acme/family-core.git");
  assert.equal(given.status, 0, given.stderr);
  assert.deepEqual(read(place, "core.json").publish, {
    to: PLACE,
    allowed: { by: OWNER, on: ON },
  });
  // Nothing else of the declaration moved, and the core holds its shape.
  const rest = Object.fromEntries(
    Object.entries(read(place, "core.json")).filter(([key]) => key !== "publish"),
  );
  assert.deepEqual(rest, declared);
  assert.equal(rest.family, FAMILY);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  // Given again for the same place: said, and nothing written.
  const again = allow(place, list, `https://${PLACE}.git`);
  assert.match(again.stdout, /was given already, by .* on 2026-11-28: nothing was written/);

  // Taken back: nothing is sent from then on, and no push is recorded.
  const back = publish(place, list, ["--revoke", "--by", OWNER, "--on", "2026-11-29"]);
  assert.equal(back.status, 0, back.stderr);
  assert.deepEqual(read(place, "core.json").publish.taken_back, { by: OWNER, on: "2026-11-29" });
  assert.deepEqual(read(place, "core.json").publish.allowed, { by: OWNER, on: ON });
  const after = publish(place, list);
  assert.equal(after.status, 0, after.stderr);
  assert.match(after.stdout, /nothing is sent: .* took the leave back on 2026-11-29/);
  assert.doesNotMatch(after.stdout, /^sends: /m);
  assert.equal(publish(place, list, ["--pushed", "--by", OWNER]).status, 2);
  assert.match(publish(place, list, ["--revoke", "--by", OWNER]).stdout, /was taken back already/);
  assert.equal(core(["--check", "--core", place], list).status, 0);
  // A new yes is a new line: the leave is given again.
  assert.equal(allow(place, list).status, 0);
  assert.equal(read(place, "core.json").publish.taken_back, undefined);
  assert.equal(JSON.parse(publish(place, list, ["--json"]).stdout).sends, true);
});

test("before any push the command prints exactly what would go where: the folder, each file, the remote, and that it is private", () => {
  const place = coreFolder();
  const list = listIn();
  put(place, "notes.txt", "a file that is no part of a core\n");
  assert.equal(allow(place, list).status, 0);
  const said = publish(place, list);
  assert.equal(said.status, 0, said.stderr);
  assert.match(
    said.stdout,
    new RegExp(`leave to publish: given by ${OWNER} on ${ON}, for ${PLACE}`),
  );
  assert.match(
    said.stdout,
    /^sends: the folder .*tidewater-core, 4 file\(s\), at state [0-9a-f]{12}:$/m,
  );
  for (const file of ["answers.json", "blocks/index.json", "core.json"]) {
    assert.match(said.stdout, new RegExp(`^  ${file.replace(".", "\\.")}$`, "m"));
  }
  assert.match(said.stdout, /^ {2}notes\.txt {2}\(not a part of a core: it would go too\)$/m);
  assert.match(
    said.stdout,
    /1 file\(s\) of the folder are not parts of a core: say so to the person/,
  );
  assert.match(
    said.stdout,
    new RegExp(`^to: ${PLACE}, as the remote origin of the folder \\(not set yet\\)$`, "m"),
  );
  assert.match(
    said.stdout,
    /^private: the repository there is private, created so and never made public; this command cannot look there/m,
  );
  assert.match(
    said.stdout,
    /the folder is not a git repository yet: git init comes first, on the person's yes/,
  );
  assert.match(said.stdout, /nothing was sent: this command calls no network/);

  // The folder made a repository, with a file git ignores: what git would carry is what is listed.
  git(place, "init", "-q", "-b", "main");
  put(place, ".gitignore", "notes.txt\n");
  git(place, "remote", "add", "origin", `git@github.com:acme/family-core.git`);
  const data = JSON.parse(publish(place, list, ["--json"]).stdout);
  assert.equal(data.sends, true);
  assert.equal(data.to, PLACE);
  assert.deepEqual(data.remote, { name: "origin", names: PLACE });
  assert.deepEqual(
    data.files.map((item) => item.file),
    [".gitignore", "answers.json", "blocks/index.json", "core.json"],
  );
  assert.equal(data.git.repository, true);
  assert.equal(data.git.branch, "main");
  const words = publish(place, list).stdout;
  assert.match(
    words,
    /the folder is a git repository, on main, with 4 file\(s\) not committed: a push carries what is committed/,
  );
  assert.match(words, new RegExp(`^to: ${PLACE}, as the remote origin of the folder$`, "m"));
});

test("a new place is asked first, every time: another place named, or another remote on the folder", () => {
  const place = coreFolder();
  const list = listIn();
  assert.equal(allow(place, list).status, 0);
  // Another place named in the call.
  const other = publish(place, list, ["--to", "gitlab.com/acme/family-core"]);
  assert.equal(other.status, 1, other.stderr);
  assert.match(
    other.stdout,
    /the leave was given for github\.com\/acme\/family-core, and gitlab\.com\/acme\/family-core is another place: a new place is asked first/,
  );
  assert.doesNotMatch(other.stdout, /^sends: /m);
  assert.equal(
    publish(place, list, ["--pushed", "--by", OWNER, "--to", "gitlab.com/acme/family-core"]).status,
    2,
  );
  // The folder's remote names another place than the leave.
  git(place, "init", "-q", "-b", "main");
  git(place, "remote", "add", "origin", "https://gitlab.com/acme/family-core.git");
  const moved = publish(place, list);
  assert.equal(moved.status, 1, moved.stderr);
  assert.match(moved.stdout, /is another place: a new place is asked first/);
  const named = publish(place, list, ["--to", PLACE]);
  assert.equal(named.status, 1);
  assert.match(
    named.stdout,
    /the folder's remote origin names gitlab\.com\/acme\/family-core, and the leave was given for github\.com\/acme\/family-core/,
  );
  // The person's yes for the new place is a new line, and says what it replaces.
  const again = publish(place, list, ["--allow", "--by", OWNER, "--on", "2026-11-30"]);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /to publish the family core .* to gitlab\.com\/acme\/family-core/);
  assert.match(again.stdout, /before: the leave was given, for github\.com\/acme\/family-core/);
  assert.equal(JSON.parse(publish(place, list, ["--json"]).stdout).sends, true);
});

test("a push the session made is recorded on this machine, and the command says when the folder moved past it", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(allow(place, list).status, 0);
  const before = snapshot(place);
  const dry = publish(place, list, ["--pushed", "--by", OWNER, "--on", ON, "--dry-run"]);
  assert.equal(dry.status, 0, dry.stderr);
  assert.ok(!existsSync(list));
  const pushed = publish(place, list, ["--pushed", "--by", OWNER, "--on", ON]);
  assert.equal(pushed.status, 0, pushed.stderr);
  assert.match(
    pushed.stdout,
    /recorded: the family core .* was pushed to github\.com\/acme\/family-core on 2026-11-28, from state [0-9a-f]{12}, as .* said/,
  );
  // Recorded in the machine's list, never in the folder that was pushed.
  assert.deepEqual(snapshot(place), before);
  const state = JSON.parse(publish(place, list, ["--json"]).stdout).state;
  assert.deepEqual(read(path.dirname(list), "cores.json").pushed, [
    { path: place, to: PLACE, on: ON, by: OWNER, state },
  ]);
  assert.match(
    publish(place, list).stdout,
    /^pushed: to .* on 2026-11-28, from state [0-9a-f]{12}; the folder is at the same state$/m,
  );
  // A line of another kind keeps it: a repository joins, and the record of the push stays.
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(read(path.dirname(list), "cores.json").pushed.length, 1);
  assert.equal(read(path.dirname(list), "cores.json").cores.length, 1);
  // The folder moved since: the copy there is behind.
  assert.match(
    publish(place, list).stdout,
    /the folder is at [0-9a-f]{12}: the copy there is behind/,
  );
  // Pushed again: one record for the place, the last.
  assert.equal(publish(place, list, ["--pushed", "--by", OWNER, "--on", "2026-11-30"]).status, 0);
  assert.equal(read(path.dirname(list), "cores.json").pushed.length, 1);
  assert.equal(read(path.dirname(list), "cores.json").pushed[0].on, "2026-11-30");
});

test("a place that carries a secret, a name that is an address, and a wrong call are refused with nothing written", () => {
  const place = coreFolder();
  const list = listIn();
  const before = snapshot(place);
  for (const [args, why] of [
    [
      ["--allow", "--to", "https://token123@github.com/acme/family-core.git", "--by", OWNER],
      /carries a password or a token/,
    ],
    [
      ["--allow", "--to", "https://me:secret@github.com/acme/family-core", "--by", OWNER],
      /carries a password or a token/,
    ],
    [
      ["--allow", "--to", "ssh://git:secret@github.com/acme/family-core", "--by", OWNER],
      /carries a password or a token/,
    ],
    [["--allow", "--to", PLACE, "--by", "mai@example.invalid"], /e-mail address/],
    [["--allow", "--to", PLACE], /say who said so, with --by NAME/],
    [["--allow", "--by", OWNER], /say where the core is published, with --to PLACE/],
    [["--allow", "--revoke", "--by", OWNER], /--allow and --revoke are two calls; give one/],
    [["--revoke", "--to", PLACE, "--by", OWNER], /--to is not taken by --revoke/],
    [["--by", OWNER], /--by goes with --allow, --revoke or --pushed/],
    [["--accept-all"], /are two calls; give one/],
  ]) {
    const refused = publish(place, list, args);
    assert.equal(refused.status, 2, args.join(" "));
    assert.match(refused.stderr, why, args.join(" "));
    assert.doesNotMatch(
      refused.stderr + refused.stdout,
      /token123|secret/,
      "a secret is never said again",
    );
  }
  assert.equal(core(["--publish"], list).status, 2);
  assert.deepEqual(snapshot(place), before);
  // A folder that is no core, and one inside another repository.
  assert.equal(publish(empty(), list).status, 2);
  const outer = empty();
  git(outer, "init", "-q");
  const inside = coreFolder();
  const nested = path.join(outer, "nested-core");
  for (const file of ["core.json", "answers.json", "blocks/index.json"]) {
    put(nested, file, readFileSync(path.join(inside, file), "utf8"));
  }
  const refused = publish(nested, list);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /lies inside the git work tree of/);
  // A place is read the same however its address is written.
  for (const address of [
    "git@github.com:acme/family-core.git",
    "ssh://git@github.com/acme/family-core.git",
    "https://github.com/acme/family-core",
    "https://GitHub.com/acme/family-core.git/",
    "github.com/acme/family-core",
  ]) {
    assert.deepEqual(placeOf(address), { place: PLACE }, address);
  }
  assert.ok(placeOf("two words").problem);
  // A secret survives in no form of an address: none is read as a place.
  for (const address of [
    "user:pw@github.com/acme/family-core",
    "user:pw@github.com:acme/family-core.git",
    "https://user:pa/ss@github.com/acme/family-core",
    "https://github.com/acme/family-core?token=abc",
    "https://github.com/acme/family-core#abc",
    "ssh://git@github.com/acme/family-core@abc",
    "abc@github.com/acme/family-core",
    "git@github.com:acme/fam@ily",
  ]) {
    const read = placeOf(address);
    assert.equal(read.place, undefined, address);
    assert.match(read.problem, /password or a token/, address);
  }
});

test("a remote or a leave written with a secret sends nothing, records nothing and is never repeated", () => {
  const place = coreFolder();
  const list = listIn();
  git(place, "init", "-q", "-b", "main");
  git(place, "remote", "add", "origin", "https://hunter2token@github.com/acme/family-core.git");
  const quiet = (done) =>
    assert.doesNotMatch(done.stdout + done.stderr, /hunter2token/, "the secret was repeated");
  // With no place named, the leave is not taken from such a remote.
  const before = snapshot(place);
  const refused = publish(place, list, ["--allow", "--by", OWNER]);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /the folder's remote origin is written with a password or a token/);
  quiet(refused);
  assert.deepEqual(snapshot(place), before);
  // A leave given for the place by name still sends nothing while the remote stands so.
  assert.equal(allow(place, list).status, 2);
  git(place, "remote", "remove", "origin");
  assert.equal(allow(place, list).status, 0);
  git(place, "remote", "add", "origin", "https://hunter2token@github.com/acme/family-core.git");
  const said = publish(place, list);
  assert.equal(said.status, 1, said.stderr);
  assert.match(
    said.stdout,
    /nothing is sent: the folder's remote origin is written with a password or a token/,
  );
  assert.doesNotMatch(said.stdout, /^sends: /m);
  quiet(said);
  quiet(publish(place, list, ["--json"]));
  const pushed = publish(place, list, ["--pushed", "--by", OWNER]);
  assert.equal(pushed.status, 2);
  quiet(pushed);
  assert.ok(!existsSync(list), "no push was recorded");
  // A leave edited by hand to hold a secret is refused, and its place is not said again.
  git(place, "remote", "remove", "origin");
  const declared = read(place, "core.json");
  for (const to of [
    "https://hunter2token@github.com/acme/x",
    "github.com/acme/x?token=hunter2token",
  ]) {
    put(
      place,
      "core.json",
      `${JSON.stringify({ ...declared, publish: { ...declared.publish, to } })}\n`,
    );
    const wrong = publish(place, list);
    assert.equal(wrong.status, 2, to);
    assert.match(wrong.stderr, /is not repeated here/, to);
    quiet(wrong);
  }
});

test("a core that holds a leave is joined and held as any other: the member's gate stays green", () => {
  const dir = adopted();
  const place = coreFolder({ colour: primaryOf(dir) });
  const list = listIn();
  assert.equal(allow(place, list).status, 0);
  assert.equal(join(dir, place, list).status, 0);
  assert.equal(gate(dir).status, 0, gate(dir).stderr);
  // A leave written wrongly is a wrong shape, named by the check of the core.
  put(
    place,
    "core.json",
    `${JSON.stringify({ ...read(place, "core.json"), publish: { to: "a b" } })}\n`,
  );
  const checked = core(["--check", "--core", place], list);
  assert.equal(checked.status, 1);
  assert.match(checked.stdout, /core\.json\.publish/);
});
