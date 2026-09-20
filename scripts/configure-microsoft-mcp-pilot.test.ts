import assert from "node:assert/strict";
import test from "node:test";
import { configureMicrosoftPilot } from "./configure-microsoft-mcp-pilot.js";

const fixture = () => ({ family: "certscore-web-mcp", cpu: "256", containerDefinitions: [{ name: "mcp-http", secrets: [{ name: "EXISTING", valueFrom: "unchanged" }], environment: Object.entries({
  CERTSCORE_MICROSOFT_MCP_ENABLED: "1",
  CERTSCORE_MICROSOFT_TENANT_ID: "3fecc197-3e2f-415e-9a36-9fbed37cce61",
  CERTSCORE_MICROSOFT_RESOURCE_AUDIENCE: "29eaafce-c468-4f71-8408-8cbdc1bb535b",
  CERTSCORE_MICROSOFT_ALLOWED_CLIENT_ID: "87f30881-d870-422a-96f2-95a7c7d38f50",
  CERTSCORE_MICROSOFT_REQUIRED_ROLE: "Mcp.Access"
}).map(([name, value]) => ({ name, value })) }] });

test("pilot enable is bounded, repeatable and preserves existing task configuration", () => {
  const task = fixture();
  assert.equal(configureMicrosoftPilot(task, "preserve"), task);
  const enabled = configureMicrosoftPilot(task, "enable");
  assert.equal(enabled.cpu, task.cpu);
  assert.deepEqual(enabled.containerDefinitions[0]!.secrets, task.containerDefinitions[0]!.secrets);
  assert.deepEqual(enabled.containerDefinitions[0]!.environment!.slice(0, 5), task.containerDefinitions[0]!.environment);
  assert.deepEqual(configureMicrosoftPilot(enabled, "enable"), enabled);
  const disabled = configureMicrosoftPilot(enabled, "disable");
  assert.equal(disabled.containerDefinitions[0]!.environment!.find(e => e.name === "CERTSCORE_MICROSOFT_DELEGATED_ENABLED")!.value, "0");
  assert.equal(task.containerDefinitions[0]!.environment.length, 5);
});

test("pilot fails closed for another service, tenant, or invalid mode", () => {
  assert.throws(() => configureMicrosoftPilot({ ...fixture(), family: "certscore-web" }, "enable"));
  const task = fixture();
  task.containerDefinitions[0]!.environment[1]!.value = "other-tenant";
  assert.throws(() => configureMicrosoftPilot(task, "enable"));
  assert.throws(() => configureMicrosoftPilot(fixture(), "anything"));
});
