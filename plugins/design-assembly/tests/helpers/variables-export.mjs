// A made-up export of variables in the shape a real file's export has (spec 0018, the test plan):
// the REST shape of `variables/local`, with many collections, aliases across collections and through
// a chain, the same name in two collections and twice in one, a copy of a library that is remote and
// hidden from publishing, true-or-false variables, axes of modes other than light and dark, two
// modes of one collection that both read light, a variable with no value, a value missing in a mode,
// a value under a mode the collection does not declare, a hidden variable in a visible collection, a
// colour below full alpha, and an alias to no variable. Every name and value is made up.

// A colour as the export writes one: channels from 0 to 1.
const rgb = (r, g, b, a = 1) => ({ r: r / 255, g: g / 255, b: b / 255, a });
const alias = (id) => ({ type: "VARIABLE_ALIAS", id });

const collection = (id, name, modes, extra = {}) => ({
  id,
  name,
  defaultModeId: modes[0][0],
  modes: modes.map(([modeId, modeName]) => ({ modeId, name: modeName })),
  ...extra,
});

const variable = (id, name, type, collectionId, valuesByMode, extra = {}) => ({
  id,
  name,
  resolvedType: type,
  variableCollectionId: collectionId,
  valuesByMode,
  ...extra,
});

// The values the tests read back.
export const INK_500 = "#3366cc";
export const INK_300 = "#6699ff";
export const COPY_PRIMARY = "#cc3300";
export const NORTH = "#118844";
export const SOUTH = "#884411";

// A new copy of the export each call, so a test may change it.
export function exportOf() {
  const collections = [
    collection("c-base", "Base", [["b-value", "Value"]]),
    collection("c-look", "Look", [
      ["l-light", "Light"],
      ["l-dark", "Dark"],
    ]),
    collection("c-tone", "Tone", [
      ["t-plain", "Plain"],
      ["t-strong", "Strong"],
      ["t-quiet", "Quiet"],
    ]),
    collection("c-looks", "Looks", [
      ["s-north-light", "North Light"],
      ["s-north-dark", "North Dark"],
      ["s-south-light", "South Light"],
    ]),
    collection("c-size", "Size", [
      ["z-base", "Base"],
      ["z-small", "Small"],
      ["z-large", "Large"],
      ["z-huge", "Huge"],
    ]),
    collection(
      "c-lib",
      "Look",
      [
        ["x-light", "Light"],
        ["x-dark", "Dark"],
      ],
      { remote: true, hiddenFromPublishing: true },
    ),
  ];
  const B = { b: "b-value" };
  const variables = [
    // Base: one mode.
    variable("v-ink-500", "ink/500", "COLOR", "c-base", { [B.b]: rgb(0x33, 0x66, 0xcc) }),
    variable("v-ink-300", "ink/300", "COLOR", "c-base", { [B.b]: rgb(0x66, 0x99, 0xff) }),
    variable("v-ink-alpha", "ink/alpha/10", "COLOR", "c-base", {}),
    variable("v-ink-fade", "ink/fade", "COLOR", "c-base", { [B.b]: rgb(0x33, 0x66, 0xcc, 0.5) }),
    variable("v-base-accent", "color/accent", "COLOR", "c-base", { [B.b]: rgb(0xaa, 0x22, 0x88) }),
    variable("v-space-4", "space/4", "FLOAT", "c-base", { [B.b]: 16 }),
    variable("v-radius", "radius/default", "FLOAT", "c-base", { [B.b]: 8 }),
    ...[
      ["sm", 14],
      ["md", 16],
      ["lg", 18],
      ["xl", 20],
      ["2xl", 24],
    ].map(([step, px]) =>
      variable(`v-size-${step}`, `font/size/${step}`, "FLOAT", "c-base", { [B.b]: px }),
    ),
    variable("v-family", "font/family/body", "STRING", "c-base", { [B.b]: "Lumen Grotesk" }),
    // Look: light and dark.
    variable("v-primary", "color/primary", "COLOR", "c-look", {
      "l-light": alias("v-ink-500"),
      "l-dark": alias("v-ink-300"),
    }),
    variable("v-look-accent", "color/accent", "COLOR", "c-look", {
      "l-light": alias("v-ink-alpha"),
      "l-dark": rgb(0x22, 0x22, 0x22),
    }),
    variable("v-tint", "color/tint", "COLOR", "c-look", { "l-light": rgb(0xee, 0xee, 0xff) }),
    variable("v-show", "show/icon", "BOOLEAN", "c-look", { "l-light": true, "l-dark": false }),
    variable(
      "v-muted",
      "color/muted",
      "COLOR",
      "c-look",
      { "l-light": rgb(0x77, 0x77, 0x77), "l-dark": rgb(0x99, 0x99, 0x99) },
      { hiddenFromPublishing: true },
    ),
    variable("v-dup-1", "color/dup", "COLOR", "c-look", {
      "l-light": rgb(1, 2, 3),
      "l-dark": rgb(4, 5, 6),
    }),
    variable("v-dup-2", "color/dup", "COLOR", "c-look", {
      "l-light": rgb(7, 8, 9),
      "l-dark": rgb(10, 11, 12),
    }),
    variable("v-edge", "color/edge", "COLOR", "c-look", {
      "l-light": rgb(0x10, 0x20, 0x30),
      "l-dark": rgb(0x30, 0x20, 0x10),
      "x:9": rgb(0xff, 0xff, 0xff),
    }),
    variable("v-link", "color/link", "COLOR", "c-look", {
      "l-light": alias("v-lib-link"),
      "l-dark": alias("v-lib-link"),
    }),
    variable("v-lost", "color/lost", "COLOR", "c-look", {
      "l-light": alias("v-nowhere"),
      "l-dark": rgb(0, 0, 0),
    }),
    // Tone: an axis of three modes, none of them light or dark, pointing into Look.
    variable("v-icon", "icon/fg", "COLOR", "c-tone", {
      "t-plain": alias("v-primary"),
      "t-strong": alias("v-primary"),
      "t-quiet": alias("v-primary"),
    }),
    // Looks: two modes that read light.
    variable("v-accent-default", "color/accent-default", "COLOR", "c-looks", {
      "s-north-light": alias("v-base-accent"),
      "s-north-dark": alias("v-base-accent"),
      "s-south-light": alias("v-base-accent"),
    }),
    variable("v-brand", "color/brand", "COLOR", "c-looks", {
      "s-north-light": rgb(0x11, 0x88, 0x44),
      "s-north-dark": rgb(0x44, 0x88, 0x11),
      "s-south-light": rgb(0x88, 0x44, 0x11),
    }),
    // Size: an axis of four modes.
    variable("v-control", "control/height", "FLOAT", "c-size", {
      "z-base": 40,
      "z-small": 32,
      "z-large": 48,
      "z-huge": 56,
    }),
    // The copy of a library: remote and hidden from publishing, of the same name as Look.
    variable("v-lib-primary", "color/primary", "COLOR", "c-lib", {
      "x-light": rgb(0xcc, 0x33, 0x00),
      "x-dark": rgb(0xee, 0x55, 0x22),
    }),
    variable("v-lib-size", "font/size/3xl", "FLOAT", "c-lib", { "x-light": 40, "x-dark": 40 }),
    variable("v-lib-link", "color/link", "COLOR", "c-lib", {
      "x-light": rgb(0x00, 0x55, 0xaa),
      "x-dark": rgb(0x55, 0x99, 0xee),
    }),
    variable("v-lib-show", "show/badge", "BOOLEAN", "c-lib", { "x-light": true, "x-dark": true }),
  ];
  return {
    status: 200,
    error: false,
    meta: {
      variableCollections: Object.fromEntries(collections.map((item) => [item.id, item])),
      variables: Object.fromEntries(variables.map((item) => [item.id, item])),
    },
  };
}

// The same export with its collections and its variables listed in the other order.
export function reversed(data) {
  const flip = (map) => Object.fromEntries(Object.entries(map).reverse());
  return {
    ...data,
    meta: {
      variableCollections: flip(data.meta.variableCollections),
      variables: flip(data.meta.variables),
    },
  };
}
