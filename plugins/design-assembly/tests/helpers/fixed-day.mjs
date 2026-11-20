// Loaded before a command with `node --import`: the clock of that run says noon of the day named
// in DESIGN_ASSEMBLY_TEST_DAY, whatever day it is. A command whose answer is the same under two
// such days reads no clock for it.
import { env } from "node:process";

const at = new Date(`${env.DESIGN_ASSEMBLY_TEST_DAY}T12:00:00Z`).getTime();
const Clock = Date;

globalThis.Date = class extends Clock {
  constructor(...given) {
    if (given.length === 0) super(at);
    else super(...given);
  }

  static now() {
    return at;
  }
};
