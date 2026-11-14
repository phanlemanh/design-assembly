// decision:screen-ledger
// The ledger of screens says what the application has: the same screens at the same routes, each
// with its title and the names of its states as the code that reaches them names them. Read while
// the code runs, so states built by a function are read as well as states written out.
import { describe, expect, test } from "vitest";

import ledgerText from "../design/screens.yaml?raw";
import { builtScreens, readScreenLedger } from "../tools/design-assembly/screen-ledger.mjs";
import { LABELS } from "@/lib/labels";
import { SCREENS } from "@/screens";

const listed = builtScreens(readScreenLedger(ledgerText));

describe("the ledger of screens", () => {
  test("lists every screen of the application, and nothing else, at the same route", () => {
    expect(listed.map((screen) => screen.path).sort()).toEqual(
      SCREENS.map((screen) => screen.path).sort(),
    );
  });

  test.each(SCREENS.map((screen) => [screen.path, screen] as const))(
    "%s: its title and its states are the ledger's",
    (route, screen) => {
      const entry = listed.find((item) => item.path === route);
      expect(entry, `${route} is not in design/screens.yaml`).toBeDefined();
      if (!entry) return;
      // A screen list that gives no title has none to compare.
      if (entry.title !== null && "title" in screen) {
        const words: Record<string, unknown> = LABELS;
        expect(words[entry.title], `${entry.title} is not a key of the words`).toBe(screen.title);
      }
      expect(entry.states).toEqual(screen.states.map((state) => state.name));
    },
  );
});
