import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

type Task = { family: string; containerDefinitions: { name: string; environment?: { name: string; value: string }[]; [key: string]: unknown }[]; [key: string]: unknown };
export function configureMarketplaceBrowser(task: Task, mode: string) {
  assert.ok(["preserve", "enable", "disable"].includes(mode));
  if (mode === "preserve") return task;
  assert.equal(task.family, "certscore-web-certscore", "Only the public web runtime is eligible");
  const target = task.containerDefinitions.find(container => container.name === "certscore-web");
  assert.ok(target, "Expected runtime container");
  const environment = target.environment ?? [];
  assert.equal(new Set(environment.map(entry => entry.name)).size, environment.length);
  const updates = { CERTSCORE_MARKETPLACE_BROWSER_ENABLED: mode === "enable" ? "1" : "0" };
  return { ...task, containerDefinitions: task.containerDefinitions.map(container => container !== target ? container : {
    ...container, environment: [...environment.filter(entry => !(entry.name in updates)), ...Object.entries(updates).map(([name, value]) => ({ name, value }))],
  }) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [path, mode] = process.argv.slice(2);
  assert.ok(path && mode, "Usage: configure-marketplace-browser.ts <task.json> <preserve|enable|disable>");
  writeFileSync(path, JSON.stringify(configureMarketplaceBrowser(JSON.parse(readFileSync(path, "utf8")), mode)));
  console.log(`Marketplace browser: ${mode}; capacity unchanged.`);
}
