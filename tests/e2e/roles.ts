import type { Page } from "@playwright/test";

// One way in for each role of ontology/roles.yaml, as the browser test by role enters it
// (tests/e2e/screen-actions-seen.spec.ts): a function given the page that makes the browser that
// role and no other. This application has no sign-in and one role, so a person using it is a
// `user` as soon as it opens: the way in does nothing. A new role gets its own entry here, in the
// same change that adds it to the model.
export const DOORS: Record<string, (page: Page) => Promise<void>> = {
  user: async () => {},
};
