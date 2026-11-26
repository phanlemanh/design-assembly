// Every name the guide shows a person must be a term of the vocabulary.
import "./helpers/own-cores.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(path.join(PLUGIN, file), "utf8"));
const vocabulary = read("references/vocabulary.json");
const { layers } = read("references/layers.json");

// The names in `layers` that are not terms of `terms`.
function unknownNames(layerList, terms) {
  const known = new Set(terms.map((entry) => entry.term.toLowerCase()));
  const names = layerList.flatMap((layer) => [
    [layer.id, layer.title],
    ...(layer.choices ?? []).map((choice) => [`${layer.id}.${choice.key}`, choice.name]),
  ]);
  return names.filter(([, name]) => !known.has(name.toLowerCase())).map(([where]) => where);
}

test("every layer title and every choice name is a term of the vocabulary", () => {
  assert.ok(layers.length > 0);
  assert.deepEqual(unknownNames(layers, vocabulary.terms), []);
});

test("a layer or a choice with a made-up name is reported", () => {
  const coined = [
    { id: "paint", title: "paint job", choices: [{ key: "hue", name: "favourite hue" }] },
  ];
  assert.deepEqual(unknownNames(coined, vocabulary.terms), ["paint", "paint.hue"]);
});

test("no term is still unchecked, and every built layer has its page", () => {
  const unchecked = vocabulary.terms.filter((entry) => entry.trust === "unchecked");
  assert.deepEqual(
    unchecked.map((entry) => entry.term),
    [],
  );
  for (const layer of layers.filter((entry) => entry.built)) {
    const page = readFileSync(path.join(PLUGIN, `references/layers/${layer.id}.md`), "utf8");
    assert.match(page, new RegExp(`^# Layer: ${layer.title}$`, "m"));
  }
});
