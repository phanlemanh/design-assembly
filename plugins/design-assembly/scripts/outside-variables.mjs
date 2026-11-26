// An export of variables read as tokens (spec 0018, item 13.1): the shape of `variables/local`, as
// a real file's export has it. Each variable is a token of its collection, named `Collection:path`,
// in each mode of its collection, so the same name in two collections, or twice in one, overwrites
// nothing. An alias names one variable, by its id, and is followed there: in the same mode inside
// one collection; across collections to the mode of the same name, else the mode that reads light
// or dark as the source mode does, else the default. A collection copied from a library or hidden
// from publishing is set aside before names are compared, and an alias into it is still followed.
// What the foundations cannot use, what the export holds no value for, and every axis of modes not
// carried is counted, so a person reads what was left and why. It reads the data it is given; it
// calls no model and no network.

// The types of variable the foundations read; any other is counted, never read.
const USABLE = new Set(["COLOR", "FLOAT", "STRING"]);
const DEPTH = 32;
// How many names of set-aside collections a line says before it counts the rest.
const NAMES_SAID = 6;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isAlias = (value) => isObject(value) && value.type === "VARIABLE_ALIAS";
const readsDark = (name) => /dark/i.test(String(name));
const readsLight = (name) => /light/i.test(String(name)) && !readsDark(name);
const rest = (name) =>
  String(name)
    .replace(/light|dark/gi, "")
    .trim()
    .toLowerCase();
const pathOf = (variable) => String(variable.name).split("/").join(".");
// An order that is the same on every machine, whatever its language.
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// A value the export does not hold: counted apart, never a fault of the bridge.
class NoValue extends Error {}

// A colour written as channels from 0 to 1: `#rrggbb`, or `#rrggbbaa` below full alpha.
function colourText({ r, g, b, a }) {
  const byte = (value) =>
    Math.round(Math.min(1, Math.max(0, Number(value))) * 255)
      .toString(16)
      .padStart(2, "0");
  const alpha = typeof a === "number" && a < 1 ? byte(a) : "";
  return `#${byte(r)}${byte(g)}${byte(b)}${alpha}`;
}

const isChannels = (value) =>
  isObject(value) && ["r", "g", "b"].every((key) => typeof value[key] === "number");

function writtenOf(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return isChannels(value) ? colourText(value) : null;
}

// The modes of a collection: the one carried as its base (light, or no mode), the one carried as
// dark, the key each mode's tokens take, and the modes not carried. Of two modes that read light,
// the default (else the first) is carried; the dark carried is the one whose name says the same
// beside the word, else the first.
function modesOf(collection) {
  const modes = Array.isArray(collection.modes) ? collection.modes.filter(isObject) : [];
  const def = modes.find((mode) => mode.modeId === collection.defaultModeId) ?? modes[0] ?? null;
  const lights = modes.filter((mode) => readsLight(mode.name));
  const darks = modes.filter((mode) => readsDark(mode.name));
  let base = def;
  let dark = null;
  if (lights.length + darks.length > 0) {
    base = lights.includes(def) ? def : (lights[0] ?? (darks.includes(def) ? null : def));
    dark =
      darks.find((mode) => base && rest(mode.name) === rest(base.name)) ??
      (darks.includes(def) ? def : (darks[0] ?? null));
  }
  const keys = new Map();
  for (const mode of modes) {
    let key = String(mode.name ?? mode.modeId).toLowerCase();
    if (mode === base) key = readsLight(mode.name) ? "light" : null;
    else if (mode === dark) key = "dark";
    else if (key === "light" || key === "dark") key = `${key} (${mode.modeId})`;
    keys.set(mode.modeId, key);
  }
  const left = modes.filter((mode) => mode !== base && mode !== dark);
  return { modes, def, base, dark, keys, left };
}

// The labels collections are named by: the name, or the name and the id where two share a name.
function labelsOf(list) {
  const count = new Map();
  for (const item of list) count.set(item.name, (count.get(item.name) ?? 0) + 1);
  return new Map(
    list.map((item) => [
      item.id,
      count.get(item.name) > 1 ? `${item.name} (${item.id})` : String(item.name),
    ]),
  );
}

// The mode of `to` an alias from a mode of `from` means.
function modeIn(from, modeId, to) {
  if (from === to) return modeId;
  const name = from.modes.find((mode) => mode.modeId === modeId)?.name;
  const same = to.modes.find((mode) => mode.name === name);
  if (same) return same.modeId;
  if (readsLight(name) && to.base && readsLight(to.base.name)) return to.base.modeId;
  if (readsDark(name) && to.dark) return to.dark.modeId;
  return to.def?.modeId ?? null;
}

// Every token of an export of variables, each with its final value; the ones that could not be
// read and why; and what was counted: set aside, not for the foundations, no value in the export,
// one name twice in a collection, the axes of modes not carried, colours below full alpha.
export function readVariables(data, evaluate) {
  const meta = isObject(data.meta) ? data.meta : data;
  if (!isObject(meta.variables)) throw new Error("it lists no variables");
  // Each variable by its key, with an id: the key where the variable writes none.
  const variables = Object.fromEntries(
    Object.entries(meta.variables)
      .filter(([, item]) => isObject(item))
      .map(([id, item]) => [id, { ...item, id: String(item.id ?? id) }]),
  );
  const given = isObject(meta.variableCollections) ? meta.variableCollections : {};
  const all = Object.entries(given).map(([id, item]) => ({
    id: String(item?.id ?? id),
    name: item?.name ?? id,
    aside: item?.remote === true || item?.hiddenFromPublishing === true,
    ...modesOf(item ?? {}),
  }));
  const kept = all.filter((item) => !item.aside);
  const aside = all.filter((item) => item.aside);
  const label = labelsOf(kept);
  const asideLabel = labelsOf(all);
  const byId = new Map(all.map((item) => [item.id, item]));
  const none = { modes: [], def: null, base: null, dark: null, keys: new Map(), left: [] };
  const collectionOf = (variable) => byId.get(String(variable.variableCollectionId)) ?? none;
  const nameOf = (variable) => {
    const collection = collectionOf(variable);
    const shown = label.get(collection.id) ?? asideLabel.get(collection.id) ?? "?";
    return `${shown}:${pathOf(variable)}`;
  };

  const done = new Map();
  const resolve = (variable, modeId, seen) => {
    const at = `${variable.id}|${modeId}`;
    if (done.has(at)) return done.get(at);
    if (seen.includes(at)) throw new Error(`${nameOf(variable)} refers back to itself`);
    if (seen.length > DEPTH) throw new Error(`${nameOf(variable)} refers through too many tokens`);
    const values = isObject(variable.valuesByMode) ? variable.valuesByMode : {};
    if (!(modeId in values)) throw new NoValue(`${nameOf(variable)} holds no value in that mode`);
    const raw = values[modeId];
    let value;
    if (isAlias(raw)) {
      const target = variables[raw.id];
      if (!target) throw new Error(`{${raw.id}} names no token`);
      const mode = modeIn(collectionOf(variable), modeId, collectionOf(target));
      value = resolve(target, mode, [...seen, at]);
    } else {
      const written = writtenOf(raw);
      if (written === null) {
        throw new Error(`${nameOf(variable)} holds a value that is not text, a length or a colour`);
      }
      value = evaluate(written, {});
    }
    done.set(at, value);
    return value;
  };

  const counted = {
    not_used: { variables: 0, values: 0, types: new Set() },
    no_value: { empty: 0, missing: 0, aliases: 0, undeclared: 0, orphans: 0 },
    alpha: 0,
  };
  const tokens = [];
  const unread = [];
  // The variables at least one value of which was read.
  const readIds = new Set();
  const order = (variable) => [
    label.get(collectionOf(variable).id),
    String(variable.name),
    String(variable.id),
  ];
  // A variable of a collection the export does not list is counted, never read.
  counted.no_value.orphans = Object.values(variables).filter(
    (variable) => !byId.has(String(variable.variableCollectionId)),
  ).length;
  const mine = Object.values(variables)
    .filter((variable) => label.has(collectionOf(variable).id))
    .sort((a, b) => {
      const [x, y] = [order(a), order(b)];
      return byText(x[0], y[0]) || byText(x[1], y[1]) || byText(x[2], y[2]);
    });
  for (const variable of mine) {
    const collection = collectionOf(variable);
    const values = isObject(variable.valuesByMode) ? variable.valuesByMode : {};
    const type = variable.resolvedType;
    const usable = type
      ? USABLE.has(type)
      : !Object.values(values).some((value) => typeof value === "boolean");
    if (!usable) {
      counted.not_used.variables += 1;
      counted.not_used.values += Object.keys(values).length;
      counted.not_used.types.add(String(type ?? "BOOLEAN"));
      continue;
    }
    const declared = new Set(collection.modes.map((mode) => mode.modeId));
    counted.no_value.undeclared += Object.keys(values).filter((id) => !declared.has(id)).length;
    if (Object.keys(values).length === 0) {
      counted.no_value.empty += 1;
      continue;
    }
    for (const mode of collection.modes) {
      const key = collection.keys.get(mode.modeId);
      const path = pathOf(variable);
      const token = `${label.get(collection.id)}:${path}${key ? `@${key}` : ""}`;
      const raw = values[mode.modeId];
      if (raw === undefined) {
        counted.no_value.missing += 1;
        continue;
      }
      const target = isAlias(raw) ? variables[raw.id] : null;
      const written = target
        ? `{${nameOf(target)}}`
        : isAlias(raw)
          ? `{${raw.id}}`
          : writtenOf(raw);
      try {
        const value = resolve(variable, mode.modeId, []);
        readIds.add(variable.id);
        // A colour below full alpha, written or reached through an alias, keeps its alpha.
        if (/^#[0-9a-f]{8}$/i.test(value) && !/ff$/i.test(value)) counted.alpha += 1;
        tokens.push({
          token,
          mode: key,
          logical: path,
          collection: label.get(collection.id),
          collection_id: collection.id,
          written,
          value,
        });
      } catch (error) {
        if (error instanceof NoValue) counted.no_value.aliases += 1;
        else unread.push({ token, written, why: error.message });
      }
    }
  }

  const names = new Map();
  for (const variable of mine) {
    const at = `${label.get(collectionOf(variable).id)}\u0000${pathOf(variable)}`;
    names.set(at, (names.get(at) ?? 0) + 1);
  }
  const summary = {
    values: {
      read: tokens.length,
      variables: readIds.size,
      collections: kept.length,
    },
    kept: kept
      .map((item) => ({ label: label.get(item.id), name: String(item.name), id: item.id }))
      .sort((a, b) => byText(a.label, b.label)),
    set_aside: aside
      .map((item) => ({
        collection: asideLabel.get(item.id),
        name: String(item.name),
        id: item.id,
        variables: Object.values(variables).filter(
          (variable) => String(variable?.variableCollectionId) === item.id,
        ).length,
      }))
      .sort((a, b) => byText(a.collection, b.collection)),
    not_used: { ...counted.not_used, types: [...counted.not_used.types].sort(byText) },
    no_value: counted.no_value,
    same_name: [...names.entries()]
      .filter(([, count]) => count > 1)
      .map(([at, count]) => {
        const [collection, name] = at.split("\u0000");
        return { collection, name, variables: count };
      }),
    modes: kept
      .filter((item) => item.left.length > 0)
      .map((item) => ({
        collection: label.get(item.id),
        modes: item.modes.map((mode) => String(mode.name)),
        base: item.base ? String(item.base.name) : null,
        base_reads_light: Boolean(item.base && readsLight(item.base.name)),
        dark: item.dark ? String(item.dark.name) : null,
        left: item.left.map((mode) => ({
          name: String(mode.name),
          reads: readsLight(mode.name) ? "light" : readsDark(mode.name) ? "dark" : null,
        })),
      }))
      .sort((a, b) => byText(a.collection, b.collection)),
    alpha: counted.alpha,
  };
  return { tokens, unread, summary };
}

// What a person reads of an export beside the candidate: each line only where it counts something.
export function variablesLines(summary) {
  const lines = [];
  const { values, set_aside: aside, not_used: unused, no_value: none } = summary;
  lines.push(
    `read: ${plural(values.read, "value")} of ${plural(values.variables, "variable")} in ${plural(values.collections, "collection")}`,
  );
  if (aside.length > 0) {
    const count = new Map();
    for (const item of aside) count.set(item.name, (count.get(item.name) ?? 0) + 1);
    const said = [...count.entries()].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name));
    const shown =
      said.length > NAMES_SAID
        ? `${said.slice(0, NAMES_SAID).join(", ")}, and ${plural(said.length - NAMES_SAID, "name")} more`
        : said.join(", ");
    const held = aside.reduce((sum, item) => sum + item.variables, 0);
    lines.push(
      `set aside, not in the candidate: ${plural(aside.length, "collection")} copied from a library or hidden from publishing (${shown}), ${plural(held, "variable")}; an alias into ${aside.length === 1 ? "it" : "them"} is still followed`,
    );
  }
  if (unused.variables > 0) {
    lines.push(
      `not for the foundations: ${plural(unused.variables, "variable")} of type ${unused.types.join(", ")} (${plural(unused.values, "value")}), counted and not read`,
    );
  }
  const gaps = [
    none.empty && `${plural(none.empty, "variable")} ${none.empty === 1 ? "holds" : "hold"} none`,
    none.missing &&
      `${plural(none.missing, "value")} ${none.missing === 1 ? "is" : "are"} missing in a mode of ${none.missing === 1 ? "its" : "their"} collection`,
    none.aliases &&
      `${plural(none.aliases, "alias", "aliases")} ${none.aliases === 1 ? "ends" : "end"} at one of them`,
    none.orphans &&
      `${plural(none.orphans, "variable")} ${none.orphans === 1 ? "names" : "name"} a collection the export does not list`,
    none.undeclared &&
      `${plural(none.undeclared, "value")} ${none.undeclared === 1 ? "sits" : "sit"} under a mode ${none.undeclared === 1 ? "its" : "their"} collection does not declare`,
  ].filter(Boolean);
  if (gaps.length > 0) lines.push(`no value in the export: ${gaps.join(", ")}`);
  if (summary.same_name.length > 0) {
    const said = summary.same_name
      .map((item) => `${item.name} in ${item.collection} (${item.variables})`)
      .join(", ");
    lines.push(`one name held by more than one variable of a collection, each kept: ${said}`);
  }
  for (const axis of summary.modes) {
    const took =
      axis.base && axis.dark
        ? `took ${axis.base} as ${axis.base_reads_light ? "light" : "its base"} and ${axis.dark} as dark`
        : axis.dark
          ? `took ${axis.dark} as dark`
          : `took ${axis.base}`;
    const light = axis.base_reads_light || axis.dark;
    const left = light
      ? `; not carried: ${axis.left
          .map((mode) => (mode.reads ? `${mode.name}, which reads ${mode.reads} too` : mode.name))
          .join("; ")}`
      : "";
    lines.push(
      `mode axis not carried: ${axis.collection} (${axis.modes.join(", ")}): ${took}${left}`,
    );
  }
  if (summary.alpha > 0) {
    lines.push(
      `alpha: ${plural(summary.alpha, "colour value")} below full alpha, kept as #rrggbbaa; a direction draws its colour opaque`,
    );
  }
  return lines;
}
