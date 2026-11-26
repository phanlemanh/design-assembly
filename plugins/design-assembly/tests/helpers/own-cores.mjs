// Loaded first by every test file of the plugin: the machine's list of cores this test process and
// every process it starts read is a file of its own, in a folder of its own, never the list of the
// person running the tests and never one the environment named. The file is not made, so the list
// is empty until a command of the test writes it. A test that wants a list of its own gives it to
// each process it starts (`DESIGN_ASSEMBLY_CORES` in that process's environment), which wins.
//
// It is set here, in each test process, and not only in the test command of `make plugin-test`, so
// that a test file run on its own (`node --test tests/<file>`) reads no other list either, and two
// test files run at once never share one.
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process, { env } from "node:process";

const folder = realpathSync(mkdtempSync(path.join(tmpdir(), "design-own-cores-")));
process.on("exit", () => rmSync(folder, { recursive: true, force: true }));

export const OWN_CORES = path.join(folder, "cores.json");
env.DESIGN_ASSEMBLY_CORES = OWN_CORES;
