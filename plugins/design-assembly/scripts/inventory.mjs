// The audit's script was named inventory.mjs until this version; it is now audit.mjs. This name is
// kept for the inventory command of the reusable store, which will take its place. Until then a
// call to it is refused, whatever its flags, and says where the audit is: a caller that ran the
// audit by this name learns it at once, and never reads one command's report as the other's.
// Exit: 2, always.
import path from "node:path";
import { fileURLToPath } from "node:url";

import { refuse, start } from "./command.mjs";

const AUDIT_SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "audit.mjs");

await start(import.meta.url, () =>
  refuse(
    `scripts/inventory.mjs is now scripts/audit.mjs: run node ${AUDIT_SCRIPT} with the same flags. This name is kept for the inventory command, which is not built yet.`,
  ),
);
