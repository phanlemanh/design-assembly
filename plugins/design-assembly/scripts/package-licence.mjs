// The licence an outside package itself declares, read from the package as the repository holds it
// installed: the `license` its own package.json states (spec 0017 as amended, decision 0134). An
// icon set that is an outside package is used under that licence, so its row waits on no sentence
// of a person. Nothing is fetched and no registry is asked: a package that is not installed, is
// installed at another version than the lockfile pins, declares no licence, points at a file for
// it, or declares another than the lockfile says it states, gives none, and the row then waits on a
// person's sentence as before.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Words a package writes where a licence would be, that are none: it grants none, or it keeps the
// licence in a file a person reads.
const GRANTS_NONE = /^unlicen[cs]ed$/i;
const IN_A_FILE = /^see licen[cs]e in\b/i;

// The file of an installed package that says what the package is, by its path from the
// repository's root, or null when the name would lead out of the folder of installed packages.
function installedFile(name) {
  const file = path.posix.normalize(`node_modules/${name}/package.json`);
  return file.startsWith("node_modules/") && !file.split("/").includes("..") ? file : null;
}

// The licence the installed package declares, with where it was read, or why none is taken.
// `locked` is what the lockfile pins the package at, as pinnedPackage gives it.
//   { licence, from: { package, version, file } }   declared, and taken
//   { why }                                         not taken: one sentence a person reads
export function declaredLicence(root, name, locked) {
  const file = installedFile(name);
  if (file === null) return { why: `${name} is no name of an installed package` };
  const full = path.join(root, file);
  if (!existsSync(full)) {
    return {
      why: `the package ${name} is not installed here (no ${file}), so the licence it declares cannot be read: install it as the repository installs a package, and nothing is fetched here`,
    };
  }
  let data;
  try {
    data = JSON.parse(readFileSync(full, "utf8"));
  } catch {
    return { why: `${file} cannot be read, so the licence ${name} declares is not known` };
  }
  if (data?.name !== name) {
    return { why: `${file} is not the package ${name}: it says it is ${String(data?.name)}` };
  }
  if (data.version !== locked.version) {
    return {
      why: `the package ${name} is installed at ${String(data.version)}, and ${locked.lockfile} pins ${locked.version}: the licence of another version is not taken`,
    };
  }
  const declared = typeof data.license === "string" ? data.license.trim() : "";
  if (IN_A_FILE.test(declared)) {
    return {
      why: `the package ${name} points at a file for its licence (${declared}), which a person reads`,
    };
  }
  if (declared === "" || GRANTS_NONE.test(declared)) {
    return { why: `the package ${name} declares no licence in ${file}` };
  }
  if (locked.license && locked.license !== declared) {
    return {
      why: `the installed package ${name} declares the licence ${declared}, and ${locked.lockfile} says it states ${locked.license}: a person reads which one holds`,
    };
  }
  return { licence: declared, from: { package: name, version: locked.version, file } };
}

// A licence taken from a package, as the command that wrote the row says it.
export const declaredLine = (licence, from) =>
  `${licence}, as the package ${from.package} declares it at ${from.version} (${from.file}): an outside package is used under the licence it declares, and no sentence of a person is waited for`;
