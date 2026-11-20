#!/usr/bin/env bash
# The commands that exist give the same output at the branch base and at HEAD, except the places
# item 5.0 adds: the sockets key and the board lines of status, and the open rows of the limits
# ledger the diff adds, which audit counts and lists. The plugin's version is the same text on
# both sides once each side's own version is replaced by one word.
#
# Usage: bash same-outputs.sh [--base REF] [--self-test]
#   --self-test changes one line of one HEAD output outside the allowed places, and must end with 1.
# Exit: 0 the outputs match, 1 a difference (the command and the first differing line are named),
#       2 a wrong call or a tree that cannot be made.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
BASE=""
SELF_TEST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="$2"; shift 2 ;;
    --self-test) SELF_TEST=1; shift ;;
    *) echo "same-outputs: unknown argument $1" >&2; exit 2 ;;
  esac
done
BASE=${BASE:-$(git -C "$ROOT" merge-base HEAD main)} || { echo "same-outputs: no base" >&2; exit 2; }
BASE=$(git -C "$ROOT" rev-parse "$BASE") || exit 2
echo "same-outputs: base $BASE, head $(git -C "$ROOT" rev-parse HEAD)"

WORK=$(mktemp -d)
cleanup() {
  git -C "$ROOT" worktree remove --force "$WORK/base" >/dev/null 2>&1
  rm -rf "$WORK"
}
trap cleanup EXIT
git -C "$ROOT" worktree add --detach --quiet "$WORK/base" "$BASE" || { echo "same-outputs: cannot make the base tree" >&2; exit 2; }
ln -s "$ROOT/node_modules" "$WORK/base/node_modules"
# A clean checkout has none of the derived files a repository keeps out of git: draw them on both
# sides, as make check does, before anything reads one.
for tree in "$WORK/base" "$ROOT"; do
  (cd "$tree" && node tools/design-assembly/derived.mjs --quiet) || { echo "same-outputs: cannot draw the derived files of $tree" >&2; exit 2; }
done

# One command, run on one tree, its output and exit code written to a file.
run() {
  local tree="$1" name="$2"
  shift 2
  (cd "$tree" && node "plugins/design-assembly/scripts/$name.mjs" --target . "$@") > "$WORK/$(basename "$tree")-$name.out" 2>&1
  echo "exit=$?" >> "$WORK/$(basename "$tree")-$name.out"
}

COMMANDS=(
  "audit --json"
  "inventory --json"
  "find data-table --json"
  "decide"
  "upgrade --dry-run --json"
  "status --json"
)
for line in "${COMMANDS[@]}"; do
  read -r -a parts <<< "$line"
  run "$WORK/base" "${parts[@]}"
  run "$ROOT" "${parts[@]}"
done
# The current tree's outputs are written under the name of its folder; give them one name.
HEAD_TAG=$(basename "$ROOT")

if [ "$SELF_TEST" = 1 ]; then
  echo "a line that item 5.0 does not add" >> "$WORK/$HEAD_TAG-decide.out"
fi

node --input-type=module - "$WORK" "$ROOT" "$HEAD_TAG" "$BASE" <<'NODE'
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [work, root, headTag, base] = process.argv.slice(2);
const baseRoot = path.join(work, "base");
const version = (tree) =>
  JSON.parse(readFileSync(path.join(tree, "plugins/design-assembly/.claude-plugin/plugin.json"), "utf8")).version;
const limitsAt = (text) => JSON.parse(text).limits;
const headLimits = limitsAt(readFileSync(path.join(root, "plugins/design-assembly/references/limits.json"), "utf8"));
const baseLimits = limitsAt(
  execFileSync("git", ["-C", root, "show", `${base}:plugins/design-assembly/references/limits.json`], { encoding: "utf8" }),
);
const baseIds = new Set(baseLimits.map((limit) => limit.id));
const added = headLimits.filter((limit) => !baseIds.has(limit.id) && limit.status === "open");
console.log(`same-outputs: ${added.length} open rows of the limits ledger are new: ${added.map((l) => l.id).join(", ")}`);

// Each side's own folder, own version and own tool trees become one word each, so the two sides
// can be compared: a release has a version and trees of its own, and that is not a behaviour.
const { treeHash } = await import(path.join(root, "plugins/design-assembly/scripts/stamp.mjs"));
const trees = (tree) => [
  [treeHash(path.join(tree, "plugins/design-assembly/templates/tools/design-assembly")), "<tool-tree>"],
  [treeHash(path.join(tree, "tools/design-assembly")), "<copy-tree>"],
];
const plain = (text, tree) =>
  trees(tree).reduce(
    (out, [hash, word]) => out.split(hash).join(word),
    text.split(tree).join("<root>").split(version(tree)).join("<version>"),
  );
const parse = (text) => {
  const body = text.replace(/\nexit=\d+\n?$/, "");
  try {
    return { json: JSON.parse(body), exit: /exit=(\d+)\s*$/.exec(text)?.[1] };
  } catch {
    return null;
  }
};
const differs = [];
for (const name of ["audit", "inventory", "find", "decide", "upgrade", "status"]) {
  let before = plain(readFileSync(path.join(work, `base-${name}.out`), "utf8"), baseRoot);
  let after = plain(readFileSync(path.join(work, `${headTag}-${name}.out`), "utf8"), root);
  const b = parse(before);
  const a = parse(after);
  if (name === "status" && a?.json) {
    delete a.json.sockets;
    after = `${JSON.stringify(a.json, null, 2)}\nexit=${a.exit}\n`;
    before = `${JSON.stringify(b.json, null, 2)}\nexit=${b.exit}\n`;
  }
  if (name === "audit" && a?.json && b?.json) {
    const ok =
      a.json.limits.open === b.json.limits.open + added.length &&
      JSON.stringify([...a.json.limits.high].sort()) ===
        JSON.stringify(
          [...b.json.limits.high, ...added.filter((l) => l.severity === "high").map((l) => l.id)].sort(),
        ) &&
      JSON.stringify(a.json.blind.filter((row) => !added.some((l) => l.id === row.id))) === JSON.stringify(b.json.blind) &&
      a.json.blind.length === b.json.blind.length + added.length;
    if (!ok) {
      differs.push(`audit: the open limits are not the base's plus exactly the ${added.length} new rows`);
      continue;
    }
    for (const side of [a.json, b.json]) {
      side.limits.open = "<open>";
      side.limits.high = "<high>";
      side.blind = "<blind>";
    }
    after = `${JSON.stringify(a.json, null, 2)}\nexit=${a.exit}\n`;
    before = `${JSON.stringify(b.json, null, 2)}\nexit=${b.exit}\n`;
  }
  if (before === after) {
    console.log(`same-outputs: ${name} matches`);
    continue;
  }
  const x = before.split("\n");
  const y = after.split("\n");
  const at = x.findIndex((lineOf, index) => lineOf !== y[index]);
  differs.push(`${name}: first difference at line ${at + 1}: base «${x[at] ?? ""}» head «${y[at] ?? ""}»`);
}
for (const line of differs) console.log(`same-outputs: DIFFERS ${line}`);
process.exit(differs.length > 0 ? 1 : 0);
NODE
