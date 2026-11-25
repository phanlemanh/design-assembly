// A machine's list of cores that knows the cores a test names, as `core --build` and `core --join`
// leave it: the file a test points its commands at, never the list of the person running them.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { BUILT_ON, json, listIn } from "./core-family.mjs";

// The family a core folder declares.
const familyOf = (place) => JSON.parse(readFileSync(path.join(place, "core.json"), "utf8")).family;

// A list of a test's own that holds each core given, each as one this machine built.
export function listOf(...places) {
  const list = listIn();
  writeFileSync(
    list,
    json({
      version: 1,
      cores: places.map((place) => ({
        family: familyOf(place),
        path: place,
        on: BUILT_ON,
        how: "built",
      })),
      declined: [],
    }),
  );
  return list;
}
