import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

type Environment = { name: string; value: string };
type Task = { family: string; containerDefinitions: { name: string; environment?: Environment[]; [key: string]: unknown }[]; [key: string]: unknown };

// Approved single-tenant pilot. These identifiers are not credentials.
export function configureMicrosoftPilot(task: Task, mode: string): Task {
  assert.ok(["preserve", "enable", "disable"].includes(mode), "Invalid pilot mode");
  assert.equal(task.family, "certscore-web-mcp");
  assert.equal(task.containerDefinitions.length, 1, "Only the isolated MCP task is eligible");
  const container = task.containerDefinitions[0]!;
  assert.equal(container.name, "mcp-http");
  if (mode === "preserve") return task;
  const environment = container.environment ?? [];
  assert.equal(new Set(environment.map(({ name }) => name)).size, environment.length, "Duplicate environment names");
  const current = Object.fromEntries(environment.map(({ name, value }) => [name, value]));
  if (mode === "enable") {
    assert.equal(current.CERTSCORE_MICROSOFT_MCP_ENABLED, "1");
    assert.equal(current.CERTSCORE_MICROSOFT_TENANT_ID, "3fecc197-3e2f-415e-9a36-9fbed37cce61");
    assert.equal(current.CERTSCORE_MICROSOFT_RESOURCE_AUDIENCE, "29eaafce-c468-4f71-8408-8cbdc1bb535b");
    assert.equal(current.CERTSCORE_MICROSOFT_ALLOWED_CLIENT_ID, "87f30881-d870-422a-96f2-95a7c7d38f50");
    assert.equal(current.CERTSCORE_MICROSOFT_REQUIRED_ROLE, "Mcp.Access");
  }
  const updates: Record<string, string> = mode === "enable" ? {
    CERTSCORE_MICROSOFT_DELEGATED_ENABLED: "1",
    CERTSCORE_MICROSOFT_DELEGATED_CLIENT_ID: "d1d8e2a9-8a68-4170-a158-58230c8c5402",
    CERTSCORE_MICROSOFT_DELEGATED_SCOPE: "Mcp.Invoke"
  } : { CERTSCORE_MICROSOFT_DELEGATED_ENABLED: "0" };
  return { ...task, containerDefinitions: [{ ...container, environment: [
    ...environment.filter(({ name }) => !(name in updates)),
    ...Object.entries(updates).map(([name, value]) => ({ name, value }))
  ] }] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [path, mode] = process.argv.slice(2);
  assert.ok(path && mode, "Usage: configure-microsoft-mcp-pilot.ts <task-definition.json> <preserve|enable|disable>");
  const task = configureMicrosoftPilot(JSON.parse(readFileSync(path, "utf8")), mode);
  writeFileSync(path, JSON.stringify(task));
  console.log(`Microsoft delegated pilot configuration: ${mode}; capacity and existing credentials unchanged.`);
}
