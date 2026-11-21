// A repository of this version whose owner spoke to every question of the table of colour roles:
// the words the blueprint holds, and the floor it can keep them on.

// The owner's word for each question, with a name and a day. The day is not today's: a page dated
// by the last commit must not hold the clock's date.
export function roleWords(by = "Owner Name", on = "2026-11-20") {
  const word = (source) => ({ source, by, on });
  return {
    "color-roles-sidebar": word("follows"),
    "color-roles-neutral": word("floor"),
    "color-roles-status": word("floor"),
    "color-roles-chart": word("floor"),
  };
}

// The floor of the sample application with its muted text a little darker in light mode: the
// floor's own is 4.34:1 on its muted ground, below the threshold, so a repository that kept it by
// the owner's word could not be one where nothing is left. Only a test's copy is changed.
export const passingFloor = (css) =>
  css.replace("--muted-foreground: oklch(0.556 0 0);", "--muted-foreground: oklch(0.54 0 0);");
