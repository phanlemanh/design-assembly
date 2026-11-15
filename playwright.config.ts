import { createHash } from "node:crypto";

import { defineConfig } from "@playwright/test";

// Each checkout previews on its own port, taken from its folder, so two checkouts of this
// repository can run the gate at the same time. UI_FLOOR_PORT names one by hand.
const fromFolder = 4173 + (createHash("sha1").update(process.cwd()).digest().readUInt16BE(0) % 800);
const port = Number(process.env.UI_FLOOR_PORT ?? fromFolder);
const url = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "coverage/e2e",
  // One dot per test; a failure prints in full.
  reporter: "dot",
  use: { baseURL: url },
  webServer: {
    // Build errors go to stderr, which Playwright shows; a clean build prints nothing.
    command: `npx tsc --noEmit >&2 && npx vite build --logLevel warn >&2 && npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: false,
  },
});
