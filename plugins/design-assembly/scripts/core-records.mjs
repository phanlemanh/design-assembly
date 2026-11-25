// What a core folder records beside its answers and its store (spec 0016, slice 3 of item 7.2): what
// it retired, with who, when and why, and the proposals of its members. Read here, in one place, by
// the moves of the family's owner, by a member's look at the core (core-moved.mjs) and by the line
// at the start of a session. Nothing here writes a file, and nothing that cannot be read is an
// error: a record that cannot be read gives nothing, or says why.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { CORE } from "../templates/tools/design-assembly/contract.mjs";

const RETIRED = CORE.parts.retired.file;
const FOLDER = CORE.parts.proposals.folder;
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

// What a core folder retired, by id and by need: each with who, when and why. Empty where the folder
// keeps no record, or it cannot be read.
export function retiredIn(folder) {
  try {
    const file = path.join(folder, RETIRED);
    if (!existsSync(file)) return { answers: {}, blocks: {} };
    const data = readJson(file);
    const by = (list, key) =>
      Object.fromEntries(
        (Array.isArray(list) ? list : [])
          .filter((one) => typeof one?.[key] === "string" && one.retired)
          .map((one) => [one[key], one.retired]),
      );
    return { answers: by(data.answers, "id"), blocks: by(data.blocks, "need") };
  } catch {
    return { answers: {}, blocks: {} };
  }
}

// Every proposal a core folder holds, in the order of their ids: each as its data, or, where a file
// cannot be read, its id and why. Empty where there is none.
export function proposalsIn(folder) {
  const dir = path.join(folder, FOLDER);
  try {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => {
        try {
          return readJson(path.join(dir, name));
        } catch {
          return {
            id: name.replace(/\.json$/, ""),
            unreadable: `${FOLDER}/${name} is not valid JSON`,
          };
        }
      });
  } catch {
    return [];
  }
}

// The state of a proposal: waiting, granted or refused.
export const stateOfProposal = (proposal) => proposal.decided?.outcome ?? "waiting";
