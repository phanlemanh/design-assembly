// The samples of the bridge in's tests (specification 0014, criteria 9 and 15), shared by the tests
// and by the record of what the bridge printed before item 13.1: a token file in the token format
// the design token group writes, a DESIGN.md, and an export of variables of one collection. Every
// sample is made up.

// A token file: groups, a type on each token, a reference, two expressions, and a dark group.
export const TOKENS = {
  color: {
    primary: { $type: "color", $value: "#cc785c" },
    accent: { $type: "color", $value: "{color.primary}" },
    dark: { primary: { $type: "color", $value: "#e0957b" } },
  },
  radius: {
    base: { $type: "dimension", $value: "12px" },
    sm: { $type: "dimension", $value: "calc(var(--radius-base) - 4px)" },
    lg: { $type: "dimension", $value: "calc({radius.base} + 0.25rem)" },
  },
  font: {
    size: {
      sm: { $value: "14px" },
      base: { $value: "16px" },
      lg: { $value: "19.2px" },
      xl: { $value: "1.44rem" },
    },
    family: { body: { $value: "Inter" }, heading: { $value: "Fraunces" } },
  },
};

// A DESIGN.md: its front matter, a mode group, a reference, and the sections after it.
export const DESIGN_MD = [
  "---",
  "version: alpha",
  "name: Daylight Prestige",
  "colors:",
  '  primary: "#1A1C1E"',
  "  light:",
  '    surface: "#FAFDF7"',
  "  dark:",
  '    surface: "#10130E"',
  "typography:",
  "  body-md:",
  "    fontFamily: Public Sans",
  "    fontSize: 16px",
  "  h1:",
  "    fontFamily: Public Sans",
  "    fontSize: 48px",
  "rounded:",
  "  sm: 4px",
  '  md: "{rounded.sm}"',
  "---",
  "",
  "## Overview",
  "",
  "A quiet product.",
  "",
].join("\n");

// An export of variables: one collection with a light and a dark mode, colours as channels from 0
// to 1, a variable that refers to another, and a radius as a number of pixels.
export const VARIABLES = {
  meta: {
    variableCollections: {
      c1: {
        id: "c1",
        name: "Theme",
        defaultModeId: "m1",
        modes: [
          { modeId: "m1", name: "Light" },
          { modeId: "m2", name: "Dark" },
        ],
      },
    },
    variables: {
      v1: {
        id: "v1",
        name: "brand/blue",
        resolvedType: "COLOR",
        variableCollectionId: "c1",
        valuesByMode: {
          m1: { r: 2 / 255, g: 70 / 255, b: 1, a: 1 },
          m2: { r: 0.4, g: 0.55, b: 1, a: 1 },
        },
      },
      v2: {
        id: "v2",
        name: "color/primary",
        resolvedType: "COLOR",
        variableCollectionId: "c1",
        valuesByMode: {
          m1: { type: "VARIABLE_ALIAS", id: "v1" },
          m2: { type: "VARIABLE_ALIAS", id: "v1" },
        },
      },
      v3: {
        id: "v3",
        name: "radius/base",
        resolvedType: "FLOAT",
        variableCollectionId: "c1",
        valuesByMode: { m1: 8, m2: 8 },
      },
    },
  },
};
