// Where a checkout of the acceptance kit keeps one of its files. An older kit keeps its core
// plugin's files at its root; a kit that keeps each plugin in a folder of its own keeps them under
// `plugins/<name>/`. The root is tried first, then each plugin folder in name order, so one path
// serves both layouts without naming a plugin. Nothing found gives null: the caller skips.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function pluginFolders(kit) {
  const plugins = path.join(kit, "plugins");
  if (!existsSync(plugins)) return [];
  return readdirSync(plugins, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(plugins, entry.name))
    .sort();
}

export function kitFile(kit, file) {
  if (!kit) return null;
  const places = [kit, ...pluginFolders(kit)].map((folder) => path.join(folder, file));
  return places.find((place) => existsSync(place)) ?? null;
}
