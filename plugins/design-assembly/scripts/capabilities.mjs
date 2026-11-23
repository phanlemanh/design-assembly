// The capability table: what a user of a design system needs done, the socket this plugin keeps
// for each, and the plugs that fill it. This module reads the table and the plugs from outside, and
// gives every check that holds them as a list of problems, empty when the check holds. It reads
// files of this plugin and of the repository it is asked about; it calls no model and no network.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LEDGERS } from "../templates/tools/design-assembly/contract.mjs";
import { readLedger } from "../templates/tools/design-assembly/ledger.mjs";
import { STAMP } from "../templates/tools/design-assembly/waiting.mjs";

export const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TABLE = "references/capabilities.json";
export const PLUGS = "references/plugs";
// The make file the guide installs: the targets a socket may name as its check.
const MAKE_FILE = "templates/mk/design-assembly.mk";
// Where the scripts that may write a ledger live: their own files, not their subfolders.
const SCRIPT_FOLDERS = ["scripts", "templates/tools/design-assembly"];
// The core, where no outside tool is named: the folders the adapters test calls the core, the
// table itself, and the skills a person reads.
const CORE_FOLDERS = ["scripts", "templates/tools/design-assembly", "templates/mk"];
const CORE_TREES = ["skills"];
const WRITE_CALL = /\b(writeFiles|writeFileSync|appendFileSync)\s*\(/;

const readJson = (full) => JSON.parse(readFileSync(full, "utf8"));
const filled = (value) => typeof value === "string" && value.trim() !== "";
const list = (value) => (Array.isArray(value) ? value : []);

// The table and the plugs from outside, and what could not be read: a plug file that is not JSON,
// or names no socket, is named here and left out.
export function readCapabilities(plugin = PLUGIN) {
  const table = readJson(path.join(plugin, TABLE));
  const problems = [];
  const plugs = [];
  const folder = path.join(plugin, PLUGS);
  const files = existsSync(folder) ? readdirSync(folder).filter((f) => f.endsWith(".json")) : [];
  for (const file of files.sort()) {
    const where = `${PLUGS}/${file}`;
    let plug;
    try {
      plug = readJson(path.join(folder, file));
    } catch {
      problems.push(`${where}: not a JSON file`);
      continue;
    }
    plugs.push({ ...plug, file: where });
  }
  return { table, plugs, problems: [...problems, ...plugProblems(plugs, table)] };
}

// What a plug file may say. `skills` and `mcp_servers` are the names a session lists it under, kept
// apart; `measured` names, for each socket it fills, the decision record that holds its measure
// and whether that measure beat the plugin's plug at holding the decision or at what the user must
// guess; `recommended_by_owner` is the owner's named exception, with their words and the day.
const PLUG_KEYS = [
  "id",
  "about",
  "kind",
  "sockets",
  "names",
  "skills",
  "mcp_servers",
  "needs",
  "sends",
  "detect",
  "measured",
  "recommended_by_owner",
  "file",
];
const PLUG_KINDS = ["skill"];
export const NEEDS = ["account", "network"];
// A decision record, as the limits ledger names one: d and its four digits.
export const RECORD = /^d\d{4}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (value) =>
  DAY.test(String(value)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Whether a value is a list of written names, each once.
const nameList = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(filled) &&
  new Set(value.map((name) => name.trim())).size === value.length;

// What a plug's measure and the owner's word at its sockets say wrongly.
function measureProblems(plug, where) {
  const found = [];
  const own = list(plug.sockets);
  for (const [key, label] of [
    ["measured", "measured"],
    ["recommended_by_owner", "recommended by the owner"],
  ]) {
    if (plug[key] === undefined) continue;
    if (!isObject(plug[key])) {
      found.push(`${where}: ${key} names, for each socket, what holds it`);
      continue;
    }
    for (const [socket, entry] of Object.entries(plug[key])) {
      const at = `${where}: ${label} at ${socket}`;
      if (!own.includes(socket)) {
        found.push(`${at}, a socket it does not fill`);
        continue;
      }
      if (!isObject(entry) || !RECORD.test(String(entry.record))) {
        found.push(
          `${at} points at ${entry?.record}, which is not a decision record such as d0088`,
        );
        continue;
      }
      if (key === "measured" && typeof entry.beats_plugin !== "boolean") {
        found.push(`${at} says neither true nor false of beating the plugin's plug`);
      }
      if (key === "recommended_by_owner" && !filled(entry.said)) {
        found.push(`${at} without the owner's words`);
      } else if (key === "recommended_by_owner" && !isDay(entry.on)) {
        found.push(`${at} on no day written YYYY-MM-DD`);
      }
    }
  }
  return found;
}

// What a plug says of how it is found, what it needs and what it sends out.
function plugReachProblems(plug, where) {
  const found = [];
  if (plug.kind !== undefined && !PLUG_KINDS.includes(plug.kind)) {
    found.push(`${where}: kind is ${PLUG_KINDS.join(" or ")}, or left out`);
  }
  for (const key of ["skills", "mcp_servers"]) {
    if (plug[key] !== undefined && !nameList(plug[key])) {
      found.push(`${where}: ${key} is a list of written names, each once`);
    }
  }
  if (plug.kind === "skill" && plug.skills === undefined) {
    found.push(`${where}: is a skill and declares no skill name`);
  }
  if (!Array.isArray(plug.needs))
    found.push(`${where}: needs is a list, empty when it needs nothing`);
  for (const need of list(plug.needs).filter((value) => !NEEDS.includes(value))) {
    found.push(`${where}: needs ${need}, which is none of ${NEEDS.join(", ")}`);
  }
  if (plug.sends !== undefined && !filled(plug.sends)) {
    found.push(`${where}: sends is a written text`);
  } else if (list(plug.needs).includes("network") && plug.sends === undefined) {
    found.push(`${where}: needs the network and does not say what it sends, or where`);
  }
  if (plug.detect !== undefined) {
    const ways = ["file", "package"].filter((way) => filled(plug.detect?.[way]));
    const strangers = isObject(plug.detect)
      ? Object.keys(plug.detect).filter((way) => !["file", "package"].includes(way))
      : [];
    if (ways.length !== 1 || strangers.length > 0) {
      found.push(`${where}: detect names one file or one package`);
    }
  }
  return found;
}

// What a plug from outside must say: an id like its file, what it does, the sockets it fills, the
// names the clean-core check looks for, what it needs, and, when given, how a session lists it, how
// a repository shows it, and its measure. A closed socket takes no plug from outside.
export function plugProblems(plugs, table) {
  const sockets = new Map(table.capabilities.map((item) => [item.id, item.socket]));
  return plugs.flatMap((plug) => {
    const where = plug.file ?? plug.id;
    const found = [];
    for (const key of Object.keys(plug).filter((name) => !PLUG_KEYS.includes(name))) {
      found.push(`${where}: unknown key '${key}'`);
    }
    if (plug.file && path.basename(plug.file, ".json") !== plug.id) {
      found.push(`${where}: its id is not the name of its file`);
    }
    if (!filled(plug.about)) found.push(`${where}: says nothing of what it does`);
    if (list(plug.sockets).length === 0) found.push(`${where}: names no socket`);
    for (const id of list(plug.sockets)) {
      if (!sockets.has(id)) found.push(`${where}: fills ${id}, which is not a capability`);
      else if (sockets.get(id).closed) found.push(`${where}: fills ${id}, a closed socket`);
    }
    if (list(plug.names).filter(filled).length === 0) found.push(`${where}: declares no name`);
    return [...found, ...plugReachProblems(plug, where), ...measureProblems(plug, where)];
  });
}

// The decision records of a folder of records, each named as a plug file names it: d0088 for
// 0088-a-title.md. An absent folder holds none.
export function recordsIn(folder) {
  if (!existsSync(folder)) return new Set();
  return new Set(
    readdirSync(folder)
      .map((name) => /^(\d{4})-.+\.md$/.exec(name)?.[1])
      .filter(Boolean)
      .map((digits) => `d${digits}`),
  );
}

// A measure, and the owner's word, point at a decision record that exists. The records are those of
// the repository that keeps this plugin; one installed elsewhere has none beside it, so this check
// runs where the plugin is made.
export function recordProblems(plugs, records) {
  return plugs.flatMap((plug) =>
    [
      ["measured", "measured"],
      ["recommended_by_owner", "recommended by the owner"],
    ].flatMap(([key, label]) =>
      Object.entries(isObject(plug[key]) ? plug[key] : {})
        .filter(([, entry]) => !records.has(entry?.record))
        .map(
          ([socket, entry]) =>
            `${plug.file ?? plug.id}: ${label} at ${socket} points at ${entry?.record}, which is no decision record`,
        ),
    ),
  );
}

// What the shape check compares against: the files of the plugin, the ledgers of the contract,
// the targets the tool installs, and the commands of the plugin.
export function contextOf(plugin = PLUGIN) {
  const make = readFileSync(path.join(plugin, MAKE_FILE), "utf8");
  return {
    plugin,
    ledgers: Object.keys(LEDGERS),
    targets: [...make.matchAll(/^([a-z][a-z0-9-]*):/gm)].map((match) => match[1]),
    commands: readdirSync(path.join(plugin, "skills")),
  };
}

const knownCheck = (check, context) => {
  const target = /^make ([a-z][a-z0-9-]*)$/.exec(check)?.[1];
  if (target) return context.targets.includes(target);
  const command = /^\/design-assembly:([a-z][a-z0-9-]*)$/.exec(check)?.[1];
  return command ? context.commands.includes(command) : false;
};

// Each capability has an id, a stage, a socket with its four fields, and plugs that point to files
// of the plugin; a socket names only ledgers of the contract and checks that exist.
export function shapeProblems(table, context) {
  const stages = list(table.stages);
  const seen = new Set();
  return table.capabilities.flatMap((item) => {
    const found = [];
    const at = (problem) => found.push(`${item.id}: ${problem}`);
    if (seen.has(item.id)) at("a second capability has this id");
    seen.add(item.id);
    if (!stages.includes(item.stage)) at(`stage ${item.stage} is not a stage of the table`);
    const socket = item.socket ?? {};
    if (!Array.isArray(socket.writes)) at("the socket says nothing of the ledgers it writes");
    if (list(socket.outputs).length === 0) at("the socket names no output");
    if (list(socket.checks).length === 0) at("the socket names no check");
    if (!["owner", "machine"].includes(socket.decides)) at("the socket says nobody decides");
    for (const ledger of list(socket.writes)) {
      if (!context.ledgers.includes(ledger))
        at(`writes ${ledger}, which is not a ledger of the contract`);
    }
    for (const check of list(socket.checks)) {
      if (!knownCheck(check, context)) {
        at(
          `checks ${check}, which is neither a target the tool installs nor a command of the plugin`,
        );
      }
    }
    for (const plug of list(item.plugs)) {
      for (const script of list(plug.scripts)) {
        const full = path.join(context.plugin, script);
        if (!existsSync(full) || !statSync(full).isFile()) {
          at(`plug ${plug.id} points to ${script}, which is not a file of the plugin`);
        }
      }
      // A reference file of the plugin the plug reads, such as the table of colour roles.
      for (const reference of list(plug.references)) {
        const full = path.join(context.plugin, reference);
        if (!existsSync(full) || !statSync(full).isFile()) {
          at(`plug ${plug.id} reads ${reference}, which is not a file of the plugin`);
        }
      }
      for (const ledger of list(plug.reads)) {
        if (!context.ledgers.includes(ledger))
          at(`plug ${plug.id} reads ${ledger}, which is not a ledger of the contract`);
      }
      if (
        plug.writes_through !== undefined &&
        !table.capabilities.some((other) => other.id === plug.writes_through)
      ) {
        at(`plug ${plug.id} writes through ${plug.writes_through}, which is not a capability`);
      }
    }
    return found;
  });
}

const openLimit = (id, limits) =>
  limits.some((limit) => limit.id === id && limit.status === "open");

// No gap: a capability with no default plug is an open row of the limits ledger, never silent.
export function gapProblems(table, limits) {
  return table.capabilities.flatMap((item) => {
    if (list(item.plugs).some((plug) => plug.default === true)) return [];
    if (!item.limit)
      return [`${item.id}: no default plug, and no open row of the limits ledger says so`];
    if (!openLimit(item.limit, limits)) {
      return [
        `${item.id}: no default plug, and its limit ${item.limit} is not an open row of the limits ledger`,
      ];
    }
    return [];
  });
}

// Every layer of layers.json and every tier of tiers.json is reached by at least one capability.
export function reachProblems(table, layers, tiers) {
  const reached = (field) => new Set(table.capabilities.flatMap((item) => list(item[field])));
  const layersReached = reached("layers");
  const tiersReached = reached("tiers");
  return [
    ...layers
      .filter((layer) => !layersReached.has(layer.id))
      .map((layer) => `layer ${layer.id}: no capability reaches it`),
    ...tiers
      .filter((tier) => !tiersReached.has(tier.id))
      .map((tier) => `tier ${tier.id}: no capability reaches it`),
  ];
}

// A face is given when it says something, or when it says why it is missing.
const faceGiven = (face, fields) =>
  face !== null &&
  typeof face === "object" &&
  (fields.some((field) => filled(face[field])) || filled(face.reason));

// Two faces: what a person is shown and asked, and what becomes a rule a check holds.
export function faceProblems(table) {
  return table.capabilities.flatMap((item) => {
    const socket = item.socket ?? {};
    const found = [];
    if (!faceGiven(socket.human, ["shows", "asks"])) {
      found.push(`${item.id}: the socket has no human face and gives no reason`);
    }
    if (!faceGiven(socket.machine, ["rules", "held_by"])) {
      found.push(`${item.id}: the socket has no machine face and gives no reason`);
    }
    return found;
  });
}

// No overlap, first half: a ledger is written by one socket only.
export function overlapProblems(table) {
  const owners = new Map();
  for (const item of table.capabilities) {
    for (const ledger of list(item.socket?.writes))
      owners.set(ledger, [...(owners.get(ledger) ?? []), item.id]);
  }
  return [...owners]
    .filter(([, sockets]) => sockets.length > 1)
    .map(
      ([ledger, sockets]) => `ledger ${ledger}: written by two sockets, ${sockets.join(" and ")}`,
    );
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// The ledgers a script's text reaches while it can write: it calls a writer, and it names a
// ledger's file or folder, or the ledger by its key of LEDGERS. A static reading: a ledger reached
// through a helper of another file is not seen (the limits ledger says so).
export function writesOf(text, ledgers = LEDGERS) {
  if (!WRITE_CALL.test(text)) return [];
  return Object.entries(ledgers)
    .filter(([key, ledger]) => {
      const where = ledger.file ?? ledger.folder;
      if (where && text.includes(where)) return true;
      const byKey = /^[a-z][a-z0-9]*$/.test(key)
        ? `LEDGERS\\.${key}\\b`
        : `LEDGERS\\[["']${escape(key)}["']\\]`;
      return new RegExp(byKey).test(text);
    })
    .map(([key]) => key);
}

// The scripts that may write a ledger, by path from the plugin's folder, with their text.
export function scriptFiles(plugin = PLUGIN) {
  return SCRIPT_FOLDERS.flatMap((folder) =>
    readdirSync(path.join(plugin, folder))
      .map((name) => `${folder}/${name}`)
      .filter((file) => file.endsWith(".mjs") && statSync(path.join(plugin, file)).isFile())
      .map((file) => ({ path: file, text: readFileSync(path.join(plugin, file), "utf8") })),
  );
}

// For a script: the ledgers it may write (those of the sockets it is a plug of, of the socket a
// plug of it writes through, or of the sockets its route passes through and their plugs write
// through) and the ledgers its plugs say it reads.
function allowedOf(script, table) {
  const writes = new Set();
  const reads = new Set();
  const socketOf = (id) => table.capabilities.find((item) => item.id === id)?.socket;
  const through = (plug) => list(socketOf(plug.writes_through)?.writes);
  for (const item of table.capabilities) {
    for (const plug of list(item.plugs)) {
      if (!list(plug.scripts).includes(script)) continue;
      list(item.socket?.writes).forEach((ledger) => writes.add(ledger));
      through(plug).forEach((ledger) => writes.add(ledger));
      list(plug.reads).forEach((ledger) => reads.add(ledger));
    }
  }
  for (const route of list(table.routes)) {
    if (route.script !== script) continue;
    for (const id of list(route.through)) {
      list(socketOf(id)?.writes).forEach((ledger) => writes.add(ledger));
      const item = table.capabilities.find((capability) => capability.id === id);
      list(item?.plugs)
        .flatMap(through)
        .forEach((ledger) => writes.add(ledger));
    }
  }
  return { writes, reads };
}

// No overlap, second half: a script that writes reaches only the ledgers of its own sockets, or the
// ones it says it reads.
export function scriptProblems(table, scripts, ledgers = LEDGERS) {
  return scripts.flatMap((script) => {
    const { writes, reads } = allowedOf(script.path, table);
    return writesOf(script.text, ledgers)
      .filter((ledger) => !writes.has(ledger) && !reads.has(ledger))
      .map(
        (ledger) =>
          `${script.path}: can write and reaches ledger ${ledger}, which no socket of this script holds`,
      );
  });
}

// The other way round: a ledger a socket says it writes is reached by a script of that socket, or
// the socket is empty and says so, or the limits ledger says its writer cannot be seen.
export function unwrittenProblems(table, scripts, limits, ledgers = LEDGERS) {
  const reached = new Map(
    scripts.map((script) => [script.path, new Set(writesOf(script.text, ledgers))]),
  );
  return table.capabilities.flatMap((item) => {
    const sockets = [item.id];
    const writers = [
      ...list(item.plugs).flatMap((plug) => list(plug.scripts)),
      // The plugs of other sockets that write through this one.
      ...table.capabilities
        .flatMap((other) => list(other.plugs))
        .filter((plug) => plug.writes_through === item.id)
        .flatMap((plug) => list(plug.scripts)),
      ...list(table.routes)
        .filter((route) => list(route.through).some((id) => sockets.includes(id)))
        .map((route) => route.script),
    ];
    return list(item.socket?.writes)
      .filter((ledger) => !writers.some((script) => reached.get(script)?.has(ledger)))
      .filter(() => !(item.limit && openLimit(item.limit, limits)))
      .filter((ledger) => !openLimit(table.unseen_writes?.[ledger], limits))
      .map(
        (ledger) =>
          `${item.id}: says it writes ${ledger}, and no script of the socket is seen writing it`,
      );
  });
}

// The files of the core, by path from the plugin's folder: the core folders' own files, the table,
// and every file under the skills.
export function coreFiles(plugin = PLUGIN) {
  const own = CORE_FOLDERS.flatMap((folder) =>
    readdirSync(path.join(plugin, folder))
      .map((name) => `${folder}/${name}`)
      .filter((file) => statSync(path.join(plugin, file)).isFile()),
  );
  const tree = (folder) =>
    readdirSync(path.join(plugin, folder)).flatMap((name) => {
      const file = `${folder}/${name}`;
      return statSync(path.join(plugin, file)).isDirectory() ? tree(file) : [file];
    });
  return [...own, TABLE, ...CORE_TREES.flatMap(tree)];
}

// Every name an outside plug is known by: its names, and the names of its skills and servers.
const namesOf = (plug) => [...list(plug.names), ...list(plug.skills), ...list(plug.mcp_servers)];

// The names of outside plugs a text holds, matched whole and in any case, as the adapters match.
export function outsideNamesIn(text, plugs) {
  const found = new Set();
  for (const plug of plugs) {
    for (const name of namesOf(plug).filter(filled)) {
      if (new RegExp(`(?<![\\w@/-])${escape(name)}(?![\\w-])`, "i").test(text)) found.add(name);
    }
  }
  return [...found].sort();
}

// Clean core: no name of an outside plug appears in a file of the core.
export function coreProblems(plugs, files) {
  return files
    .map((file) => [file.path, outsideNamesIn(file.text, plugs)])
    .filter(([, names]) => names.length > 0)
    .map(
      ([file, names]) => `${file}: names ${names.join(", ")}, which only a plug's folder may name`,
    );
}

const readsAsFile = (root, file) => {
  try {
    return existsSync(path.join(root, file));
  } catch {
    return false;
  }
};

const dependsOn = (root, name) => {
  try {
    const pkg = readJson(path.join(root, "package.json"));
    return name in (pkg.dependencies ?? {}) || name in (pkg.devDependencies ?? {});
  } catch {
    return false;
  }
};

// Whether a plug from outside is plugged in a repository: the file it detects is there, or the
// repository depends on its package. A repository that cannot be read plugs nothing in.
export function pluggedHere(root, plug) {
  const detect = plug.detect ?? {};
  if (filled(detect.file)) return readsAsFile(root, detect.file);
  if (filled(detect.package)) return dependsOn(root, detect.package);
  return false;
}

// The row of the decision ledger that records the plug chosen for a socket: its id, and the plug
// it names, written plug:ID in its source. The owner's name and day are in its note, as the
// decision sheet stamps every answer.
export const plugRowId = (socket) => `plug-${socket}`;
export const plugSource = (plug) => `plug:${plug}`;
const SOURCE = /^plug:([a-z0-9][a-z0-9-]*)$/;
// What a chosen socket that keeps nothing names: the socket stays empty.
export const NONE = "none";

// The plug chosen for a socket, with who chose it and when, or null when no row records it.
export function choiceOf(rows, socket) {
  const row = rows.find((item) => String(item.id) === plugRowId(socket));
  if (!row) return null;
  const stamp = STAMP.exec(String(row.note ?? ""));
  return {
    plug: SOURCE.exec(String(row.source ?? ""))?.[1] ?? null,
    by: stamp?.[2] ?? null,
    on: stamp?.[3] ?? null,
  };
}

// Where a plug from outside stands for a socket, as a repository shows it: its file or package is
// here, or the ledger chose it and the repository does not show it, or neither. What a session
// holds, the skill sees; this reads files only.
const outsideState = (here, chosen, id) =>
  here ? "in-repo" : chosen?.plug === id ? "chosen-but-missing" : "absent";

// Where the chosen plug of a socket stands: one of the plugin's, the socket left empty, or an
// outside plug in the repository or missing from it.
function chosenState(chosen, item, outside) {
  if (list(item.plugs).some((plug) => plug.id === chosen.plug)) return "plugin";
  if (chosen.plug === NONE) return "empty";
  return outside.find((plug) => plug.id === chosen.plug)?.state === "in-repo"
    ? "in-repo"
    : "chosen-but-missing";
}

// The rows of the decision ledger, none when there is no ledger. A ledger that cannot be read is
// not "nothing chosen": the error goes up to the command, which says the repository cannot be read.
const ledgerRows = (root) => readLedger(root) ?? [];

// The socket board of a repository: each capability, the plug at its socket or that it is empty,
// its limit, the plug the owner chose for it, and the plugs from outside that can fill it, with
// whether each is plugged in here, where it stands, its measure and what it needs.
export function socketsOf(root, { table, plugs } = readCapabilities(), rows = ledgerRows(root)) {
  return table.capabilities.map((item) => {
    const plug = list(item.plugs).find((candidate) => candidate.default === true);
    const chosen = choiceOf(rows, item.id);
    const outside = plugs
      .filter((candidate) => list(candidate.sockets).includes(item.id))
      .map((candidate) => {
        const here = pluggedHere(root, candidate);
        return {
          id: candidate.id,
          here,
          state: outsideState(here, chosen, candidate.id),
          measured: candidate.measured?.[item.id]?.record ?? "unmeasured",
          needs: list(candidate.needs),
        };
      });
    return {
      id: item.id,
      name: item.name,
      plug: plug?.id ?? null,
      state: plug ? "plugged" : "empty",
      limit: item.limit ?? null,
      chosen: chosen ? { ...chosen, state: chosenState(chosen, item, outside) } : null,
      outside,
    };
  });
}
