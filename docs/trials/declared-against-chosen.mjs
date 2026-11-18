// The screens a merged pull request declared against the screens the affected command chooses for
// it, over a range of first-parent merges of a throwaway copy of a repository. A declared screen
// the command leaves out is a miss; a pull request it answers with fewer than every screen is
// narrowed. The copy is checked out at each merge commit, so never give it a working repository.
// Usage: node docs/trials/declared-against-chosen.mjs --copy DIR --range OLDER..NEWER
// Ends with 0 when no declared screen was left out, with 1 when one was, with 2 on a wrong call.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { argv, execPath, exit, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TOOL = path.join(ROOT, "tools/design-assembly/affected.mjs");
const CONTRACT = /^_acceptance\/[^/]+\/contract\.md$/;
// A contract declares its screens in its head, as one line: `screens: [a, b]`.
const DECLARED = /^screens:\s*\[(.*)\]/m;
const HEAD_LINES = 60;

const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const copy = arg("--copy") ? path.resolve(arg("--copy")) : null;
const range = arg("--range");
if (!copy || !range || !existsSync(path.join(copy, ".git"))) {
  stdout.write("Usage: declared-against-chosen.mjs --copy DIR --range OLDER..NEWER\n");
  exit(2);
}

const git = (...args) => spawnSync("git", ["-C", copy, ...args], { encoding: "utf8" }).stdout;
const lines = (text) => text.split("\n").filter(Boolean);

function declaredScreens(files) {
  const names = files
    .filter((file) => CONTRACT.test(file) && existsSync(path.join(copy, file)))
    .flatMap((file) => {
      const head = readFileSync(path.join(copy, file), "utf8").split("\n").slice(0, HEAD_LINES);
      const found = head.join("\n").match(DECLARED);
      return found ? found[1].split(",") : [];
    })
    .map((name) => name.trim().replace(/['"]/g, ""))
    .filter(Boolean);
  return [...new Set(names)];
}

function measure(merge) {
  git("checkout", "-q", "--detach", merge);
  const files = lines(git("diff", "--name-only", "--no-renames", `${merge}^1`, merge));
  const declared = declaredScreens(files);
  const run = spawnSync(execPath, [TOOL, "--target", copy, "--json", "--files", files.join(",")], {
    encoding: "utf8",
  });
  if (run.status !== 0) return { files, declared, failed: run.stderr.split("\n")[0] };
  const answer = JSON.parse(run.stdout);
  const chosen = (answer.screens ?? []).map((screen) => screen.id ?? screen);
  const missing = answer.all ? [] : declared.filter((name) => !chosen.includes(name));
  return { files, declared, all: answer.all, chosen, missing };
}

const merges = lines(
  git("log", "--first-parent", "--merges", "--reverse", "--format=%h %s", range),
);
const rows = merges.map((line) => {
  const merge = line.split(" ")[0];
  const number = line.match(/#(\d+)/)?.[1] ?? "?";
  return { merge, number, ...measure(merge) };
});

stdout.write("pull request\tmerge\tfiles\tdeclared\tchosen\tleft out\n");
for (const row of rows) {
  const chosen = row.failed ?? (row.all ? "whole suite" : row.chosen.join(",") || "none");
  const cells = [
    `#${row.number}`,
    row.merge,
    row.files.length,
    row.declared.join(",") || "-",
    chosen,
    (row.missing ?? []).join(",") || "-",
  ];
  stdout.write(`${cells.join("\t")}\n`);
}
const count = (test) => rows.filter(test).length;
const missed = count((row) => (row.missing ?? []).length > 0);
stdout.write(
  `\n${rows.length} merged, ${count((row) => row.declared.length > 0)} with declared screens, ` +
    `${count((row) => row.all === false)} narrowed, ${count((row) => row.failed)} not answered, ` +
    `${missed} with a declared screen left out\n`,
);
exit(missed > 0 ? 1 : 0);
