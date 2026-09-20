import assert from "node:assert/strict";
import test from "node:test";
import { getEnv } from "./env.js";

test("delegated Microsoft auth is opt-in and requires explicit isolated configuration", () => {
  const saved = { ...process.env };
  try {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("CERTSCORE_MICROSOFT_")) delete process.env[key];
    }
    process.env.CERTSCORE_OAUTH_JWT_SECRET = "local-test-signing-secret-only";
    assert.equal(getEnv().microsoftDelegatedEnabled, false);
    process.env.CERTSCORE_MICROSOFT_DELEGATED_ENABLED = "1";
    assert.throws(() => getEnv(), /requires/);
    Object.assign(process.env, {
      CERTSCORE_MICROSOFT_MCP_ENABLED: "1",
      CERTSCORE_MICROSOFT_TENANT_ID: "11111111-1111-4111-8111-111111111111",
      CERTSCORE_MICROSOFT_RESOURCE_AUDIENCE: "22222222-2222-4222-8222-222222222222",
      CERTSCORE_MICROSOFT_ALLOWED_CLIENT_ID: "33333333-3333-4333-8333-333333333333",
      CERTSCORE_MICROSOFT_DELEGATED_CLIENT_ID: "55555555-5555-4555-8555-555555555555",
      CERTSCORE_MICROSOFT_DELEGATED_SCOPE: "Mcp.Invoke"
    });
    assert.equal(getEnv().microsoftDelegatedEnabled, true);
    process.env.CERTSCORE_MICROSOFT_DELEGATED_CLIENT_ID = process.env.CERTSCORE_MICROSOFT_ALLOWED_CLIENT_ID;
    assert.throws(() => getEnv(), /separate delegated client/);
    process.env.CERTSCORE_MICROSOFT_DELEGATED_CLIENT_ID = process.env.CERTSCORE_MICROSOFT_RESOURCE_AUDIENCE;
    assert.throws(() => getEnv(), /distinct from the API/);
    process.env.CERTSCORE_MICROSOFT_DELEGATED_CLIENT_ID = "55555555-5555-4555-8555-555555555555";
    process.env.CERTSCORE_MICROSOFT_DELEGATED_SCOPE = "Mcp.Invoke Other.Scope";
    assert.throws(() => getEnv());
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
