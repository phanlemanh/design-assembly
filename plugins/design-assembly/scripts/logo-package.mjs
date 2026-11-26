// Reads a package of mark files an outside plug left in the repository (spec 0017, «the plug that
// builds a mark», point 4): a folder holding the files of the chosen mark and the manifest beside
// them, which names each file with its hash, its role and its variant, which plug made the mark and
// on which day. Every file is compared with the hash its manifest lists before anything is written,
// and the package holds the files its manifest lists and no other. Nothing is drawn, rebuilt,
// fetched or changed: the plug is never called, only what it left is read. Who chose the mark is
// read from the decision sheet, never from the package.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import { LOGO_PACKAGE } from "../templates/tools/design-assembly/contract.mjs";
import { logoItem, readWaiting } from "../templates/tools/design-assembly/waiting.mjs";

// The path of a folder from the repository's root, or null when it is not a folder inside it. A link
// that leads out of the repository is outside.
function folderOf(root, folder) {
  const full = path.resolve(root, String(folder));
  const relative = path.relative(path.resolve(root), full);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (!existsSync(full) || !statSync(full).isDirectory()) return null;
  const led = path.relative(realpathSync(root), realpathSync(full));
  if (led === "" || led.startsWith("..") || path.isAbsolute(led)) return null;
  return relative.split(path.sep).join("/");
}

// Every file under a folder, by its path from that folder, in order; hidden files left out. A link,
// or anything else that is no plain file or folder, is refused by its path from the repository's
// root: a package holds its own files, and a link could lead out of the repository.
function filesUnder(full, folder, at = "") {
  return readdirSync(path.join(full, at), { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((entry) => {
      const relative = at === "" ? entry.name : `${at}/${entry.name}`;
      if (entry.isDirectory()) return filesUnder(full, folder, relative);
      if (entry.isFile()) return [relative];
      throw new Error(
        `${folder}/${relative} is no plain file: a package holds files of its own, never a link`,
      );
    });
}

const sha256 = (full) => createHash("sha256").update(readFileSync(full)).digest("hex");

// The package as logo-source writes it into a row: each file by its path from the repository's
// root with its role and variant, who made the mark and when, its title, and the manifest. It
// throws one sentence, naming the file, on a package that is not the repository's, has no manifest
// or one that is not whole, names a file it does not hold or holds it with another hash, or holds a
// file its manifest does not name.
export function readLogoPackage(root, given) {
  const folder = folderOf(root, given);
  if (folder === null) throw new Error(`${given} is not a folder of the repository`);
  const full = path.join(root, folder);
  const manifestFile = `${folder}/${LOGO_PACKAGE.file}`;
  if (!existsSync(path.join(full, LOGO_PACKAGE.file))) {
    throw new Error(
      `${folder} holds no ${LOGO_PACKAGE.file}: a package of mark files is read with the manifest its plug leaves beside them, naming each file with its sha256, its role and its variant`,
    );
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path.join(full, LOGO_PACKAGE.file), "utf8"));
  } catch {
    throw new Error(`${manifestFile} is not JSON`);
  }
  const problems = LOGO_PACKAGE.problems(manifest, manifestFile);
  if (problems.length > 0) throw new Error(problems.join("; "));
  const held = new Set(filesUnder(full, folder).filter((name) => name !== LOGO_PACKAGE.file));
  for (const entry of manifest.files) {
    const file = path.join(full, entry.file);
    if (!held.has(entry.file)) {
      throw new Error(`${manifestFile} names ${entry.file}, which is not in the package`);
    }
    if (sha256(file) !== entry.sha256) {
      throw new Error(
        `${folder}/${entry.file} is not the file the manifest lists: its sha256 differs from ${manifestFile}`,
      );
    }
    held.delete(entry.file);
  }
  const [stranger] = [...held];
  if (stranger !== undefined) {
    throw new Error(
      `${folder}/${stranger} is in the package and its manifest does not name it: a package holds the files its manifest lists, and no other`,
    );
  }
  return {
    folder,
    manifest: manifestFile,
    made: { by: manifest.made.by, on: manifest.made.on },
    title: manifest.title ?? null,
    files: manifest.files.map((entry) => ({
      file: `${folder}/${entry.file}`,
      role: entry.role,
      variant: entry.variant,
    })),
  };
}

// Who chose the mark of a row, as the decision sheet wrote it back: the name and the day of the
// owner's answer that keeps the item logo:<id>, with the question it answers; null when the waiting
// list holds no such answer, or cannot be read. Nothing here comes from a plug.
export function chosenOnSheet(root, id) {
  let waiting;
  try {
    waiting = readWaiting(root);
  } catch {
    return null;
  }
  const row = (waiting?.rows ?? []).find(
    (item) => item.item === logoItem(id) && item.answer === "keep",
  );
  return row ? { by: row.by, on: row.on, question: row.id } : null;
}
