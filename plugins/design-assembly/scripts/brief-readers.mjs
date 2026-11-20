// The readers of a screen brief: one for each slot of references/brief-slots.json that a ledger
// holds. A reader is given what brief-slots.mjs read of the repository for one screen and gives
// back `answer`, each line with the file and the row or line it comes from, and `why`, each reason
// the slot is still open; a slot with no reason is settled. `data` is what the answer for a
// machine carries beside the slots. A reader says what the repository says and decides nothing:
// what a row leaves unsaid is a reason the slot is open, never read as "nothing".
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { TYPES_FILE } from "../templates/tools/design-assembly/columns.mjs";
import {
  REGISTRY as COMPONENTS,
  regenerated,
} from "../templates/tools/design-assembly/components.mjs";
import { LEDGER, literally } from "../templates/tools/design-assembly/ledger.mjs";
import {
  readScreens,
  REGISTRY,
  STATES_FILE,
} from "../templates/tools/design-assembly/patterns.mjs";
import { MODEL } from "../templates/tools/design-assembly/screen-actions.mjs";
import {
  KEY as PAGE,
  KINDS_FOLDER,
  SIZES_FILE,
} from "../templates/tools/design-assembly/screens.mjs";
import { Refusal } from "./command.mjs";
import { plural } from "./document.mjs";
import { ROW_PREFIX } from "./principles.mjs";

const BLUEPRINT = "design/blueprint.json";
const ACTIONS = `${MODEL}/actions.yaml`;
const ROLES = `${MODEL}/roles.yaml`;
// The slots an answer of another slot may wait on, by their id in the catalogue.
const KIND_SLOT = "kind";
const MODEL_SLOT = "model-changes";

// One line of an answer. `waits` is the number of the slot it waits on, where what it would say
// is that slot's to settle: one thing missing opens one slot, and the others point at it.
const answer = (says, source, waits) => ({
  says,
  source,
  ...(waits === undefined ? {} : { waits_on: waits }),
});
const settled = (said, data) => ({ answer: said, why: [], ...(data ? { data } : {}) });
const list = (value) => (Array.isArray(value) ? value.map(String) : []);
const named = (value) =>
  value === null || value === undefined || value === "" || value === "null" ? null : String(value);
const json = (target, file) => {
  const full = path.join(target, file);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch {
    throw new Refusal(`${file} cannot be read: it is not JSON`);
  }
};
// Whether a file a page names lies inside the repository, and is there.
function insideAndThere(target, file) {
  const relative = path.relative(target, path.resolve(target, file));
  const inside = relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  return { inside, there: inside && existsSync(path.join(target, relative)) };
}
// The line of a text the first match of `pattern` is on, or nothing.
function lineOf(text, pattern) {
  const at = String(text)
    .split(/\r?\n/)
    .findIndex((line) => pattern.test(line));
  return at === -1 ? {} : { line: at + 1 };
}
// A source with its comments blanked and every line kept, strings left as they are: a line found
// in it is the line of the file, and a path named only in a comment is not found.
function uncommented(text) {
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' || char === "'" || char === "`") {
      let end = i + 1;
      while (end < text.length && text[end] !== char) end += text[end] === "\\" ? 2 : 1;
      out += text.slice(i, end + 1);
      i = end;
    } else if (char === "/" && text[i + 1] === "/") {
      const end = text.indexOf("\n", i);
      i = (end === -1 ? text.length : end) - 1;
    } else if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, "");
      i = stop - 1;
    } else out += char;
  }
  return out;
}
// The line of the screen list that names a route.
const routeLine = (registry, route) =>
  lineOf(uncommented(registry), new RegExp(`\\bpath:\\s*["']${literally(route)}["']`));
// Where a key of the page of a kind is read from: the page, the key, and the line it is on.
const pageAt = (page, key) => ({
  file: page.file,
  key,
  ...lineOf(page.text, new RegExp(`^${literally(key)}:`)),
});
const ORDINALS = ["first", "second", "third", "fourth", "fifth"];
const ordinal = (place) => ORDINALS[place - 1] ?? `in place ${place}`;

// The reference screen the page of a kind names: a line of the answer where the file is there,
// else the reason the screen cannot be built like it.
function referenceOf({ target, screen, kind: page, drawn }) {
  if (page.reference === "") {
    return { why: `${page.file} names no reference screen to build the screen like` };
  }
  const { inside, there } = insideAndThere(target, page.reference);
  if (!inside) {
    return { why: `${page.file} names ${page.reference}, a file outside the repository` };
  }
  if (!there) {
    return {
      why: `${page.file} names ${page.reference} as its reference screen, and there is no such file`,
    };
  }
  const like = drawn().find((item) => item.file === page.reference);
  return {
    line: answer(
      page.reference === screen.file
        ? `The reference screen of the kind is this screen, ${page.reference}`
        : `Build the screen like the reference screen of the kind, ${page.reference}`,
      pageAt(page, PAGE.reference),
    ),
    data: { file: page.reference, screen: like?.id ?? null, route: like?.path ?? null },
  };
}

// Slot 1: the kind the screen's row names, the page of that kind, and the reference screen the
// page names. Open where the row names no kind, no page describes it, or the page's reference
// screen is not there.
function kind(context) {
  const { screen, at, kind: page } = context;
  const none = { kind: null, reference: null };
  if (screen.family === null) {
    return {
      answer: [],
      why: ["the screen's row names no kind: its `family` is empty"],
      data: none,
    };
  }
  const said = [answer(`The screen is of the kind ${screen.family}`, at("family"))];
  if (page === null) {
    return {
      answer: said,
      why: [`no page under ${KINDS_FOLDER} describes the kind ${screen.family}`],
      data: none,
    };
  }
  said.push(
    answer(
      `The page of the kind is ${page.file}: read it before the screen is built`,
      pageAt(page, PAGE.kind),
    ),
  );
  if (page.task) {
    said.push(
      answer(
        `What a person comes to a screen of this kind for: ${page.task}`,
        pageAt(page, PAGE.task),
      ),
    );
  }
  const reference = referenceOf(context);
  return {
    answer: [...said, ...(reference.line ? [reference.line] : [])],
    why: reference.why ? [reference.why] : [],
    data: {
      kind: { name: screen.family, page: page.file, task: page.task || null },
      reference: reference.data ?? null,
    },
  };
}

// What a field of an entity is shown as: the column type it names, said as missing where the
// table of column types does not list it.
function columnWords(display, types) {
  if (!display) return ", with no column type named";
  const listed = Object.hasOwn(types, display) ? "" : `, which ${TYPES_FILE} does not list`;
  return `, shown as the column type ${display}${listed}`;
}

// Whether the data model has an entity of that name: a file of its own, not a name every object has.
const hasEntity = (raw, name) => Object.hasOwn(raw.entities, name) && Boolean(raw.entities[name]);

// One entity the row says the screen shows: a line for each of its fields, or, where the data
// model has no such entity, one line that waits on the slot of changes to the model.
function entityLines(entity, { at, keys, raw, numberOf }, types) {
  if (!hasEntity(raw, entity)) {
    const slot = numberOf(MODEL_SLOT);
    return [
      answer(
        `${entity}: the data model has no such entity, so its fields wait on slot ${slot}`,
        at(keys.shows),
        slot,
      ),
    ];
  }
  const file = `${MODEL}/entities/${entity}.yaml`;
  const { properties } = raw.entities[entity];
  const fields = Object.entries(properties && typeof properties === "object" ? properties : {});
  if (fields.length === 0) {
    return [answer(`${entity}: the data model names no field of it`, { file, key: "properties" })];
  }
  return fields.map(([name, field]) =>
    answer(
      `${entity}.${name}: ${field?.type ?? "of no type named"}${columnWords(field?.display, types)}`,
      { file, row: name },
    ),
  );
}

// Slot 2: the entities the row says the screen shows, each with its fields and the column type
// each field names. Open where the row says nothing of it, or says it as something other than a
// list. An entity the data model lacks is said here and opens the slot of changes to the model.
function shows(context) {
  const { target, row, keys, at } = context;
  if (!(keys.shows in row)) {
    return {
      answer: [],
      why: [`the screen's row does not say what the screen shows: it has no \`${keys.shows}\``],
    };
  }
  if (!Array.isArray(row[keys.shows])) {
    return {
      answer: [],
      why: [`the screen's row does not list what it shows: its \`${keys.shows}\` is not a list`],
    };
  }
  const entities = list(row[keys.shows]);
  if (entities.length === 0) {
    return settled([answer("The screen shows no record of the data model", at(keys.shows))]);
  }
  const types = json(target, TYPES_FILE)?.types ?? {};
  return settled(entities.flatMap((entity) => entityLines(entity, context, types)));
}

// The roles the data model gives an action to, as its file writes them: a list of roles, or one
// scope a role.
function givenTo(raw, name) {
  const written = raw.actions.find((item) => item && String(item.name) === name);
  return [
    ...list(written?.roles),
    ...(written?.scope && typeof written.scope === "object" ? Object.keys(written.scope) : []),
  ];
}

// An action the row names and the data model does not have: the line waits on the slot of changes
// to the model.
function unknownAction(name, as, told, { at, keys, numberOf }) {
  const slot = numberOf(MODEL_SLOT);
  return {
    data: { name, as, in_model: false, kind: null, entity: null, roles: [], planned: false },
    line: answer(
      `${told} ${name}, which the data model does not have: who may run it waits on slot ${slot}`,
      at(as === "entry" ? keys.entry : keys.actions),
      slot,
    ),
  };
}

// One action the row names, as the entry of the screen or a button on it: what the data model
// says of it and who holds it, or that the model does not have it. `why` is a reason the slot is
// open: the model gives the action to a role its list of roles does not have.
function actionOf(name, as, context) {
  const { model, raw } = context;
  const action = model.actions.find((item) => item.name === name);
  const told = as === "entry" ? "Opens with" : "A button for";
  if (!action) return unknownAction(name, as, told, context);
  const given = givenTo(raw, name);
  const unlisted = given.filter((role) => !model.roles.includes(role));
  const what = `${action.kind}${action.entity ? ` of ${action.entity}` : ""}${action.planned ? ", planned in the model" : ""}`;
  const who =
    action.holders.length > 0
      ? `held by ${action.holders.join(", ")}`
      : given.length > 0
        ? `given to ${given.join(", ")}`
        : "held by no role";
  return {
    data: {
      name,
      as,
      in_model: true,
      kind: action.kind,
      entity: action.entity,
      roles: action.holders,
      planned: action.planned,
    },
    line: answer(`${told} ${name} (${what}): ${who}`, { file: ACTIONS, row: name }),
    ...(unlisted.length > 0
      ? {
          why: `the data model gives ${name} to ${unlisted.join(", ")}, which ${ROLES} does not list`,
        }
      : {}),
  };
}

// Slot 3: the action that opens the screen and the actions it has buttons for, each with the
// roles that hold it in the data model. Open where the row leaves either unsaid, or the model
// gives an action to a role it does not list.
function actions(context) {
  const { row, keys, at } = context;
  const why = [];
  // Each line of the answer in the order a person reads it: what opens the screen, then its
  // buttons. `data` is what the answer for a machine keeps of an action the row names.
  const told = [];
  const plain = (says, key) => told.push({ line: answer(says, at(key)), data: null });
  if (!(keys.entry in row)) {
    why.push(
      `the screen's row does not say which action opens the screen: it has no \`${keys.entry}\``,
    );
  } else if (named(row[keys.entry]) === null) {
    plain("Every role opens the screen: the row names no action to open it with", keys.entry);
  } else told.push(actionOf(named(row[keys.entry]), "entry", context));
  if (!(keys.actions in row)) {
    why.push(
      `the screen's row does not say which actions the screen has buttons for: it has no \`${keys.actions}\``,
    );
  } else if (!Array.isArray(row[keys.actions])) {
    why.push(`the screen's row does not list its buttons: its \`${keys.actions}\` is not a list`);
  } else if (row[keys.actions].length === 0) {
    plain("The screen has no button for an action of the data model", keys.actions);
  } else told.push(...list(row[keys.actions]).map((name) => actionOf(name, "button", context)));
  return {
    answer: told.map((item) => item.line),
    why: [...why, ...told.map((item) => item.why).filter(Boolean)],
    data: { actions: told.map((item) => item.data).filter(Boolean) },
  };
}

// What the state table says of the screen: the line of the answer, the states it requires of the
// screen, and the reason the slot is open where the row lacks one of them. A repository with no
// state table says nothing here.
function tableOf(target, screen) {
  const table = json(target, STATES_FILE);
  if (table === null) return { lines: [], required: [], why: [] };
  const exempt = table.exempt && typeof table.exempt === "object" ? table.exempt : {};
  if (screen.route !== null && Object.hasOwn(exempt, screen.route)) {
    const excused = `The state table excuses ${screen.route} from the states every screen must have: ${exempt[screen.route]}`;
    return {
      lines: [answer(excused, { file: STATES_FILE, key: "exempt" })],
      required: [],
      why: [],
    };
  }
  const required = list(table.required);
  const missing = required.filter((state) => !screen.states.includes(state));
  return {
    lines: [
      answer(`Every screen must have: ${required.join(", ")}`, {
        file: STATES_FILE,
        key: "required",
      }),
    ],
    required,
    why:
      missing.length > 0
        ? [`the state table requires ${missing.join(", ")}, which the row does not list`]
        : [],
  };
}

// What the screen list of the application says of the screen's states: the states it names by
// name, and the line of the answer. Null where there is no list, or it does not name the screen.
function reachOf(screen, registry) {
  if (registry === null || screen.route === null) return null;
  const found = readScreens(registry).find((item) => item.path === screen.route);
  if (!found) return null;
  const unnamed = screen.states.filter((state) => !found.states.includes(state));
  const names =
    found.states.length === 0
      ? "it names the screen, and no state of it by name"
      : `it names ${found.states.join(", ")}${unnamed.length > 0 ? `, and not ${unnamed.join(", ")}` : ""}`;
  return {
    states: found.states,
    line: answer(
      `The way into each state is written in the screen list of the application: ${names}`,
      { file: REGISTRY, ...routeLine(registry, screen.route) },
    ),
  };
}

// Slot 4: the states the row lists, the states the state table asks of every screen, and where
// the way into each is written. Open where the row lists none, or lacks one the table requires.
function states({ target, screen, at, registry }) {
  if (screen.states.length === 0) {
    return { answer: [], why: ["the screen's row lists no state"], data: { states: [] } };
  }
  const table = tableOf(target, screen);
  const reach = reachOf(screen, registry);
  return {
    answer: [
      answer(`The screen has these states: ${screen.states.join(", ")}`, at("states")),
      ...table.lines,
      ...(reach ? [reach.line] : []),
    ],
    why: table.why,
    data: {
      states: screen.states.map((name) => ({
        name,
        required: table.required.includes(name),
        listed: reach ? reach.states.includes(name) : null,
      })),
    },
  };
}

// The components a ledger names, each with a name; a ledger that names them any other way cannot
// be read, and is refused by its file.
function componentsOf(data, file) {
  const found = data?.components;
  const usable =
    Array.isArray(found) && found.every((item) => item && typeof item.name === "string");
  if (!usable) {
    throw new Refusal(`${file} cannot be read: its components are not a list of named components`);
  }
  return found;
}

// The component ledger as the repository keeps it, or, where it keeps the file out of git, as
// its own command would write it now; null where the repository has none.
function componentLedger(target) {
  const kept = json(target, COMPONENTS);
  if (kept !== null) {
    return {
      components: componentsOf(kept, COMPONENTS),
      source: { file: COMPONENTS, key: "components" },
    };
  }
  const made = regenerated(target);
  if (made === null) return null;
  return {
    components: componentsOf(made.data, made.file),
    source: {
      file: made.read,
      key: "components",
      note: `read from the source as the repository's own command would write ${made.file}, which is not on disk`,
    },
  };
}

// The frame the page of the kind names, what it must be given and what may not be used outside
// it: lines of the answer, or the reason the page gives none. Where no page describes the kind
// the frame is not known, and the line waits on the slot of the kind.
function frameOf({ kind: page, at, numberOf }) {
  if (page === null) {
    const slot = numberOf(KIND_SLOT);
    const unknown = `The frame to build the screen in is not known: it waits on slot ${slot}, the page of the screen's kind`;
    return { lines: [answer(unknown, at("family"), slot)] };
  }
  const frame = page.front[PAGE.frame];
  const name = frame && typeof frame === "object" ? named(frame[PAGE.frameName]) : null;
  if (name === null) {
    return { lines: [], why: `${page.file} names no frame to build the screen in` };
  }
  const from = named(frame[PAGE.frameImport]);
  const more = [
    [PAGE.required, "The frame must be given"],
    [PAGE.forbidden, "Not to be used outside the frame"],
  ]
    .filter(([key]) => list(page.front[key]).length > 0)
    .map(([key, told]) =>
      answer(`${told}: ${list(page.front[key]).join(", ")}`, pageAt(page, key)),
    );
  return {
    lines: [
      answer(
        `Build the screen in the frame ${name}${from ? `, imported from ${from}` : ""}`,
        pageAt(page, PAGE.frame),
      ),
      ...more,
    ],
  };
}

// Slot 5: the components of the ledger, and the frame the page of the kind names with what it
// must be given and what may not be used outside it. Open where there is no component ledger, or
// the page of the kind names no frame.
function components(context) {
  const ledger = componentLedger(context.target);
  const found = ledger?.components ?? [];
  const frame = frameOf(context);
  const why = [];
  if (ledger === null) why.push(`the repository keeps no component ledger (${COMPONENTS})`);
  else if (found.length === 0) why.push("the component ledger names no component");
  if (frame.why) why.push(frame.why);
  const usable =
    found.length > 0
      ? [
          answer(
            `${plural(found.length, "component", "components")} can be used: ${found.map((item) => item.name).join(", ")}`,
            ledger.source,
          ),
        ]
      : [];
  return { answer: [...usable, ...frame.lines], why, data: { components: found } };
}

// Slot 6: the rows of the decisions ledger in the content layer, which say where the words of a
// screen are kept and which terms it uses, and the key of the screen's title. Open where the
// ledger has no such row.
function words({ facts, screen, at }) {
  const rows = facts.decisions.filter((row) => row.layer === "content");
  if (rows.length === 0) {
    return {
      answer: [],
      why: [
        `the decisions ledger (${LEDGER}) has no row of the content layer: nothing says where the words of a screen are kept`,
      ],
    };
  }
  const said = rows.map((row) =>
    answer(
      `${row.id}: ${row.source}${row.check ? `, held by ${row.check}` : ", which no check holds"}`,
      { file: LEDGER, row: String(row.id) },
    ),
  );
  if (screen.title !== null) {
    said.push(
      answer(
        `The screen's title is the key ${screen.title} among the repository's words`,
        at("title"),
      ),
    );
  }
  return settled(said);
}

// Slot 7: the lines of the rules page that apply to the screen, one rule a line, as the review
// reads them. Open where there is no rules page, or its paths leave the screen's file out.
function rules({ facts, screen }) {
  const { file, present, covers, lines } = facts.rules;
  if (!present) return { answer: [], why: [`the repository has no rules page (${file})`] };
  if (covers === false) {
    return {
      answer: [],
      why: [`the rules page (${file}) does not take in ${screen.file}: its paths leave it out`],
    };
  }
  if (lines.length === 0) return { answer: [], why: [`the rules page (${file}) has no rule`] };
  return settled(
    lines.map((line) => answer(line.text, { file, line: line.line, section: line.section })),
  );
}

// Why the slot of principles is open where the owner fixed none: the ones that stand in the
// blueprint with nobody's confirmation are named, and settle nothing.
function unfixedWords(unfixed) {
  if (unfixed.length === 0) return "the owner fixed no design principle";
  const one = unfixed.length === 1;
  return `the owner fixed no design principle: ${unfixed.join(", ")} ${one ? "stands" : "stand"} in the blueprint with nobody's confirmation, and ${one ? "settles" : "settle"} nothing`;
}

// Slot 8: the principles the owner fixed and the direction they took, as the rules page and the
// review read them. Open where the owner fixed no principle or took no direction.
function principles({ facts }) {
  const { principles: fixed, unfixed_principles: unfixed, direction } = facts;
  const taken = direction
    ? [
        answer(`The direction the owner took is ${direction.id}: ${direction.character}`, {
          file: BLUEPRINT,
          key: "layers.foundations.direction",
        }),
      ]
    : [];
  return {
    answer: [
      ...fixed.map((principle) =>
        answer(`${principle.name}: ${principle.statement}`, {
          file: BLUEPRINT,
          key: "layers.context.principles",
          // The id as the blueprint writes it: the rules page and the ledger put a prefix before it.
          row: principle.id.slice(ROW_PREFIX.length),
        }),
      ),
      ...taken,
    ],
    why: [
      ...(fixed.length === 0 ? [unfixedWords(unfixed)] : []),
      ...(direction === null ? ["the owner took no direction"] : []),
    ],
  };
}

// The checks the rows of the decisions ledger name, each with the rows it holds, in the order the
// ledger first names them.
function checksOf(decisions) {
  const rows = new Map();
  for (const row of decisions.filter((item) => item.check)) {
    const check = String(row.check);
    rows.set(check, [...(rows.get(check) ?? []), String(row.id)]);
  }
  return [...rows].map(([check, held]) => {
    const [by, ...rest] = check.split(":");
    return { check, by, file: rest.join(":"), rows: held };
  });
}

// Slot 9: the widths the repository declares, and the checks the rows of the decisions ledger
// name. Open where no widths are declared, or no row names a check.
function widthsAndChecks({ facts }) {
  const checks = checksOf(facts.decisions);
  const widths = facts.declared
    ? [
        answer(`The widths every screen is checked at: ${facts.widths.join(", ")} pixels`, {
          file: SIZES_FILE,
          key: "widths",
        }),
      ]
    : [];
  return {
    answer: [
      ...widths,
      ...checks.map((check) =>
        answer(
          `${check.check} holds ${plural(check.rows.length, "row", "rows")} of the decisions ledger`,
          { file: LEDGER, key: "check", rows: check.rows },
        ),
      ),
    ],
    why: [
      ...(facts.declared
        ? []
        : [
            `the repository declares no widths (${SIZES_FILE}): ${facts.widths.join(" and ")} are the two every floor starts from, and nothing says they are this repository's`,
          ]),
      ...(checks.length > 0
        ? []
        : [
            `no row of the decisions ledger (${LEDGER}) names a check: nothing says what will grade the screen`,
          ]),
    ],
    data: { checks },
  };
}

// Slot 10, computed: each action and entity the row names, looked up in the data model. Open
// where the row names one the model does not have, by name, and where the row leaves unsaid what
// it shows, opens with or offers: what the screen needs of the model is then not known.
function modelChanges({ row, keys, at, model, raw }) {
  const unsaid = [keys.shows, keys.entry, keys.actions].filter(
    (key) => !(key in row) || (key !== keys.entry && !Array.isArray(row[key])),
  );
  const asked = [...new Set([named(row[keys.entry]), ...list(row[keys.actions])].filter(Boolean))];
  const shown = list(row[keys.shows]);
  const known = new Set(model.actions.map((action) => action.name));
  const lost = {
    actions: asked.filter((name) => !known.has(name)),
    entities: shown.filter((name) => !hasEntity(raw, name)),
  };
  const why = [
    ...lost.actions.map(
      (name) => `the row names the action ${name}, which the data model (${ACTIONS}) does not have`,
    ),
    ...lost.entities.map(
      (name) => `the row shows ${name}, which the data model (${MODEL}/entities) has no entity for`,
    ),
    ...(unsaid.length > 0
      ? [
          `the row does not say its ${unsaid.map((key) => `\`${key}\``).join(", ")}, so what the screen needs of the data model is not known`,
        ]
      : []),
  ];
  const nothing = `The row names nothing the data model lacks: its ${plural(asked.length, "action", "actions")} and ${plural(shown.length, "entity", "entities")} are in it`;
  return {
    answer: why.length > 0 ? [] : [answer(nothing, at())],
    why,
    data: { model_changes: lost },
  };
}

// Slot 11, for a screen that is built: where it stands in the screen list of the application.
// Open where the application keeps no such list, or the list does not name the screen.
function navigation({ screen, registry }) {
  if (registry === null) {
    return {
      answer: [],
      why: [`the application keeps no screen list this command reads (${REGISTRY})`],
    };
  }
  if (screen.route === null) {
    return {
      answer: [],
      why: ["the screen's row names no route to look for in the screen list of the application"],
    };
  }
  const paths = readScreens(registry).map((item) => item.path);
  const place = paths.indexOf(screen.route);
  if (place === -1) {
    return {
      answer: [],
      why: [`the screen list of the application (${REGISTRY}) does not name ${screen.route}`],
    };
  }
  const beside = [
    place > 0 ? `after ${paths[place - 1]}` : null,
    place < paths.length - 1 ? `before ${paths[place + 1]}` : null,
  ]
    .filter(Boolean)
    .join(" and ");
  return settled([
    answer(
      `The screen stands ${ordinal(place + 1)} of ${paths.length} in the screen list of the application${beside ? `, ${beside}` : ""}`,
      { file: REGISTRY, ...routeLine(registry, screen.route) },
    ),
  ]);
}

// What the sheet measures for the recommendation of a slot no ledger holds, by the slot's id: one
// sentence of what the ledgers that are there say, for the recommendation to rest on. A slot with
// no measure rests on the catalogue's own words and on what its reader found.
function navigationMeasure({ registry }) {
  if (registry === null) return null;
  const paths = readScreens(registry).map((item) => item.path);
  if (paths.length === 0)
    return `The screen list of the application (${REGISTRY}) names no screen.`;
  return `The screen list of the application (${REGISTRY}) has ${plural(paths.length, "screen", "screens")}, the last at ${paths.at(-1)}.`;
}

function touchedMeasure({ row, keys, others }) {
  if (others.length === 0) return "The ledger of screens has no other screen.";
  const namesOf = (item) => [
    ...list(item?.[keys.shows]),
    ...[named(item?.[keys.entry])].filter(Boolean),
    ...list(item?.[keys.actions]),
  ];
  const own = new Set(namesOf(row));
  const sharing = others
    .map((item) => ({
      id: String(item.id),
      shared: [...new Set(namesOf(item))].filter((name) => own.has(name)),
    }))
    .filter((item) => item.shared.length > 0);
  const of = `Of the ${plural(others.length, "other screen", "other screens")} of the ledger`;
  if (sharing.length === 0) return `${of}, none names an action or an entity this screen names.`;
  const which = sharing.map((item) => `${item.id} (${item.shared.join(", ")})`).join("; ");
  return `${of}, ${plural(sharing.length, "names", "name")} an action or an entity this screen names: ${which}. Those are the ones to look at before the recommendation is kept.`;
}

export const MEASURES = {
  navigation: navigationMeasure,
  "touched-screens": touchedMeasure,
};

// One reader for each slot a ledger holds, by the slot's id in the catalogue.
export const READERS = {
  kind,
  shows,
  actions,
  states,
  components,
  words,
  rules,
  principles,
  "widths-and-checks": widthsAndChecks,
  "model-changes": modelChanges,
  navigation,
};
