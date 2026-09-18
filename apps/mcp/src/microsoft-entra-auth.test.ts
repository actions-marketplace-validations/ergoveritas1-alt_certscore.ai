import assert from "node:assert/strict";
import test from "node:test";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  createLocalJWKSet,
  type JWTPayload
} from "jose";
import {
  createMicrosoftEntraTokenValidator,
  microsoftEntraIssuer,
  microsoftEntraJwksUrl,
  microsoftEntraSessionBinding
} from "./microsoft-entra-auth.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const audience = "22222222-2222-4222-8222-222222222222";
const allowedClientId = "33333333-3333-4333-8333-333333333333";
const kid = "microsoft-test-key";

const delegatedClientId = "55555555-5555-4555-8555-555555555555";
const objectId = "66666666-6666-4666-8666-666666666666";

async function fixture(delegated = false) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  const getKey = createLocalJWKSet({ keys: [{ ...publicJwk, alg: "RS256", kid, use: "sig" }] });
  const validator = createMicrosoftEntraTokenValidator({
    allowedClientId,
    audience,
    requiredRole: "Mcp.Access",
    tenantId,
    delegated: delegated ? { allowedClientId: delegatedClientId, requiredScope: "Mcp.Invoke" } : undefined
  }, { getKey });
  const sign = async (overrides: JWTPayload = {}) => new SignJWT({
    azp: allowedClientId,
    roles: ["Mcp.Access"],
    tid: tenantId,
    ver: "2.0",
    ...overrides
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setAudience(typeof overrides.aud === "string" ? overrides.aud : audience)
    .setIssuer(typeof overrides.iss === "string" ? overrides.iss : microsoftEntraIssuer(tenantId))
    .setIssuedAt()
    .setNotBefore(typeof overrides.nbf === "number" ? overrides.nbf : Math.floor(Date.now() / 1000) - 5)
    .setExpirationTime(typeof overrides.exp === "number" ? overrides.exp : Math.floor(Date.now() / 1000) + 300)
    .sign(privateKey);
  return { sign, validator };
}

test("Microsoft Entra endpoints are tenant-specific", () => {
  assert.equal(microsoftEntraIssuer(tenantId), `https://login.microsoftonline.com/${tenantId}/v2.0`);
  assert.equal(microsoftEntraJwksUrl(tenantId), `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
});

test("delegated pilot requires scope, user identity and separately allowed client; refresh preserves binding", async () => {
  const { sign, validator } = await fixture(true);
  const claims = { azp: delegatedClientId, oid: objectId, scp: "Mcp.Invoke", roles: undefined };
  const first = await validator.verify(await sign(claims));
  const refreshed = await validator.verify(await sign({ ...claims, exp: Math.floor(Date.now() / 1000) + 600 }));
  assert.ok(first.ok && refreshed.ok);
  assert.equal(microsoftEntraSessionBinding(first), microsoftEntraSessionBinding(refreshed));
  const other = await validator.verify(await sign({ ...claims, oid: allowedClientId }));
  assert.ok(other.ok);
  assert.notEqual(microsoftEntraSessionBinding(first), microsoftEntraSessionBinding(other));
  const app = await validator.verify(await sign());
  assert.ok(app.ok);
  assert.notEqual(microsoftEntraSessionBinding(first), microsoftEntraSessionBinding(app));
  for (const [name, overrides, reason] of [
    ["role cannot replace scope", { scp: "Other.Scope", roles: ["Mcp.Invoke"] }, "missing_scope"],
    ["scope substring", { scp: "Mcp.Invoke.All" }, "missing_scope"],
    ["missing user", { oid: undefined }, "invalid_token"],
    ["malformed user", { oid: "ben@example.com" }, "invalid_token"],
    ["application identity", { idtyp: "app" }, "invalid_token"],
    ["wrong client", { azp: allowedClientId }, "wrong_client"],
    ["wrong tenant", { tid: objectId }, "invalid_token"],
    ["wrong audience", { aud: objectId }, "invalid_token"],
    ["expired", { exp: Math.floor(Date.now() / 1000) - 60 }, "invalid_token"],
    ["empty scope", { scp: "" }, "invalid_token"],
    ["malformed scope", { scp: ["Mcp.Invoke"] }, "invalid_token"]
  ] as const) {
    assert.deepEqual(await validator.verify(await sign({ ...claims, ...overrides })), { ok: false, reason }, name);
  }
  // Without a scope this separate client cannot fall through to the app-only path.
  assert.deepEqual(await validator.verify(await sign({ ...claims, scp: undefined, roles: ["Mcp.Access"] })), { ok: false, reason: "wrong_client" });
});

test("Microsoft Entra validator accepts only the configured app-only token", async () => {
  const { sign, validator } = await fixture();
  const result = await validator.verify(await sign());
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.clientId, allowedClientId);
    assert.equal(result.tenantId, tenantId);
    assert.deepEqual(result.claims.roles, ["Mcp.Access"]);
  }
});

test("Microsoft Entra validator fails closed for malformed and invalid claims", async () => {
  const { sign, validator } = await fixture();
  const now = Math.floor(Date.now() / 1000);
  const cases: Array<[string, string, "invalid_token" | "wrong_client" | "missing_role"]> = [
    ["malformed", "not-a-jwt", "invalid_token"],
    ["wrong issuer", await sign({ iss: microsoftEntraIssuer("44444444-4444-4444-8444-444444444444") }), "invalid_token"],
    ["wrong tenant", await sign({ tid: "44444444-4444-4444-8444-444444444444" }), "invalid_token"],
    ["wrong audience", await sign({ aud: "44444444-4444-4444-8444-444444444444" }), "invalid_token"],
    ["expired", await sign({ exp: now - 60 }), "invalid_token"],
    ["not active", await sign({ nbf: now + 60 }), "invalid_token"],
    ["wrong client", await sign({ azp: "44444444-4444-4444-8444-444444444444" }), "wrong_client"],
    ["missing role", await sign({ roles: [] }), "missing_role"],
    ["delegated token", await sign({ scp: "Mcp.Access" }), "invalid_token"],
    ["wrong token version", await sign({ ver: "1.0" }), "invalid_token"]
  ];

  for (const [name, token, reason] of cases) {
    const result = await validator.verify(token);
    assert.deepEqual(result, { ok: false, reason }, name);
  }
});
