import assert from "node:assert/strict";
import test from "node:test";
import { loadAuthorizedReportEvidence, ReportEvidenceAccessError } from "./report-evidence-access";

test("anonymous reads never query workspace projections", async () => {
  assert.equal(await loadAuthorizedReportEvidence({ scanId: 'scan', bearer: { provided: false, token: null }, validate: async () => { throw Error('unexpected auth'); }, loadOwned: async () => { throw Error('private query'); }, loadPublic: async () => 'public' }), 'public');
});
test("OAuth reads bind the verified workspace and can fall back only to an anonymous scan", async () => {
  const calls: unknown[] = [];
  const result = await loadAuthorizedReportEvidence({ scanId: 'scan', bearer: { provided: true, token: 'valid' }, validate: async (token, scopes) => { assert.equal(token, 'valid'); assert.deepEqual(scopes, ['pulse:read']); return { ok: true, key: { organizationId: 'own-workspace' } }; }, loadOwned: async (scope) => { calls.push(scope); return null; }, loadPublic: async (scope) => { calls.push(scope); return null; } });
  assert.equal(result, null);
  assert.deepEqual(calls, [{ scanId: 'scan', organizationId: 'own-workspace' }, { scanId: 'scan' }]);
});
test("missing, rejected or unscoped bearer credentials fail before any projection read", async () => {
  for (const auth of [{ ok: false }, { ok: true, key: { organizationId: null } }]) {
    for (const token of [null, 'invalid']) await assert.rejects(loadAuthorizedReportEvidence({ scanId: 'scan', bearer: { provided: true, token }, validate: async () => auth, loadOwned: async () => { throw Error('private read'); }, loadPublic: async () => { throw Error('public fallback'); } }), ReportEvidenceAccessError);
  }
});
