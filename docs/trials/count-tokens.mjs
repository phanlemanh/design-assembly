// The tokens and tool calls of one session's transcript, counted the way trial 17 counted: the
// context of the last model call plus the words the model wrote in every call, each call counted
// once by its message id; a tool call is one tool_use block, counted once by its id. With --from
// and --to only the calls between the two times count, and the context the first of them already
// carried is given apart, so the share of that stretch is the growth plus what was written.
// Usage: node docs/trials/count-tokens.mjs --transcript FILE [--from ISO-TIME] [--to ISO-TIME]
// Ends with 0, or with 2 on a wrong call or a transcript with no model call in the stretch.
import { existsSync, readFileSync } from "node:fs";
import { argv, exit, stderr, stdout } from "node:process";

const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const file = arg("--transcript");
const from = arg("--from") ?? "";
const to = arg("--to") ?? "9999"; // after every ISO time

if (!file || !existsSync(file)) {
  stderr.write(
    "usage: node docs/trials/count-tokens.mjs --transcript FILE [--from ISO] [--to ISO]\n",
  );
  exit(2);
}

const parse = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};
const rows = readFileSync(file, "utf8").split("\n").filter(Boolean).map(parse).filter(Boolean);
const calls = new Map();
const tools = new Set();
for (const row of rows) {
  const usage = row.message?.usage;
  if (row.type !== "assistant" || !usage || row.timestamp < from || row.timestamp > to) continue;
  for (const block of row.message.content ?? []) if (block.type === "tool_use") tools.add(block.id);
  calls.set(row.message.id, { usage, at: row.timestamp });
}
const ordered = [...calls.values()].sort((a, b) => a.at.localeCompare(b.at));
if (ordered.length === 0) {
  stderr.write("no model call in that stretch of the transcript\n");
  exit(2);
}
const context = ({ usage }) =>
  (usage.input_tokens ?? 0) +
  (usage.cache_read_input_tokens ?? 0) +
  (usage.cache_creation_input_tokens ?? 0);
const written = ordered.reduce((sum, call) => sum + (call.usage.output_tokens ?? 0), 0);
const first = ordered[0];
const last = ordered.at(-1);
const result = {
  calls: ordered.length,
  tool_calls: tools.size,
  first_call: first.at,
  last_call: last.at,
  first_context: context(first),
  last_context: context(last),
  written,
  total: context(last) + written,
  share: context(last) - context(first) + written,
};
stdout.write(`${JSON.stringify(result, null, 2)}\n`);
