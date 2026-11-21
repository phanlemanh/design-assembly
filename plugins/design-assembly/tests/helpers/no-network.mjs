// Loaded before a command with `node --import`: the network is unreachable for that run. A TCP
// connection to anything but this machine (by name or by address, through a socket or a client of
// the web), a name looked up by callback or by promise, a fetch, or a datagram socket, is written
// to the file DESIGN_ASSEMBLY_NETWORK_LOG names and then throws, so a command that reaches out
// fails, and the test reads what it reached for. A connection to this machine itself is let
// through: a command that draws a screen talks to its own development server. A child started with
// node inherits the guard through NODE_OPTIONS, unless it is started with an environment of its own
// that leaves NODE_OPTIONS out; a browser a command starts is not node and is not guarded.
import { appendFileSync } from "node:fs";
import dgram from "node:dgram";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import { env } from "node:process";
import { fileURLToPath, URL } from "node:url";

const LOG = env.DESIGN_ASSEMBLY_NETWORK_LOG;
const HERE = new Set(["127.0.0.1", "::1", "localhost", "0.0.0.0", "::", ""]);

const own = `--import ${fileURLToPath(import.meta.url)}`;
if (!(env.NODE_OPTIONS ?? "").includes(own)) {
  env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ""} ${own}`.trim();
}

function reached(what) {
  if (LOG) appendFileSync(LOG, `${what}\n`);
  throw new Error(`the network is unreachable in this test, and the command reached for ${what}`);
}

const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function guarded(...given) {
  // The clients of node call this with the arguments already put in a list, the options first.
  const first = Array.isArray(given[0]) ? given[0][0] : given[0];
  const second = Array.isArray(given[0]) ? given[0][1] : given[1];
  const options = typeof first === "object" && first !== null ? first : {};
  // A path is a pipe of this machine; a port with no host is this machine too.
  const host = options.path ? "" : (options.host ?? (typeof second === "string" ? second : ""));
  if (!HERE.has(String(host))) reached(`a connection to ${host}`);
  return connect.apply(this, given);
};

// A name looked up by callback, and by promise, from either module that offers it.
for (const target of new Set([dns, dns.promises, dnsPromises])) {
  for (const name of ["lookup", "resolve", "resolve4", "resolve6", "resolveAny"]) {
    const real = target[name];
    if (typeof real !== "function") continue;
    target[name] = function guarded(hostname, ...rest) {
      if (!HERE.has(String(hostname))) reached(`the address of ${hostname}`);
      return real.call(target, hostname, ...rest);
    };
  }
}

const fetched = globalThis.fetch;
globalThis.fetch = function guarded(input, ...rest) {
  const address = String(input?.url ?? input);
  let host = "";
  try {
    host = new URL(address).hostname.replace(/^\[|\]$/g, "");
  } catch {
    // Not an address: the real fetch says so.
  }
  if (!HERE.has(host)) reached(`a fetch of ${address}`);
  return fetched(input, ...rest);
};

const socket = dgram.createSocket;
dgram.createSocket = function guarded() {
  reached("a datagram socket");
  return socket.apply(dgram, arguments);
};

// A module that imports one of these by name gets the guarded one.
syncBuiltinESMExports();
