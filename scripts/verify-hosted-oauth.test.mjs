import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { authorizationRequest, callbackCode, verifyConnection, verifyMetadata, verifyToken, ISSUER, RESOURCE, CALLBACK, CLIENT_ID, SCOPES } from './verify-hosted-oauth.mjs';

test('metadata fails closed when create is missing from either discovery surface', () => {
  const as = { issuer: ISSUER, authorization_endpoint: `${ISSUER}/oauth/authorize`, token_endpoint: `${ISSUER}/api/v2/oauth/token`, scopes_supported: SCOPES, self_serve_scopes: SCOPES, code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'], response_types_supported: ['code'], grant_types_supported: ['authorization_code'] };
  const resource = { resource: RESOURCE, authorization_servers: [ISSUER], scopes_supported: SCOPES };
  verifyMetadata(as, resource);
  for (const field of ['scopes_supported', 'self_serve_scopes']) assert.throws(() => verifyMetadata({ ...as, [field]: ['scan:read', 'mcp'] }, resource));
  assert.throws(() => verifyMetadata(as, { ...resource, scopes_supported: ['scan:read', 'mcp'] }));
  assert.throws(() => verifyMetadata({ ...as, token_endpoint: 'https://other.example/token' }, resource));
});

test('independent requests use unique PKCE and state and reject mismatched callbacks', () => {
  const a = authorizationRequest();
  const b = authorizationRequest();
  assert.notEqual(a.state, b.state);
  assert.notEqual(a.verifier, b.verifier);
  assert.equal(a.url.searchParams.get('client_id'), CLIENT_ID);
  assert.equal(a.url.searchParams.get('redirect_uri'), CALLBACK);
  assert.equal(a.url.searchParams.get('code_challenge'), createHash('sha256').update(a.verifier).digest('base64url'));
  const callback = new URL(`${CALLBACK}?code=mcp_code_test&state=${a.state}`);
  assert.equal(callbackCode(callback, a.state), 'mcp_code_test');
  assert.throws(() => callbackCode(callback, b.state));
  for (const query of [`code=mcp_code_test`, `code=mcp_code_test&state=${a.state}&state=${a.state}`, `error=access_denied&state=${a.state}`, `code=mcp_code_test&code=mcp_code_other&state=${a.state}`]) {
    assert.throws(() => callbackCode(new URL(`${CALLBACK}?${query}`), a.state));
  }
});

test('successful HTTP token response still requires bearer credentials and create scope', () => {
  const token = { access_token: 'test-only', token_type: 'Bearer', expires_in: 3600, scope: SCOPES.join(' ') };
  verifyToken(token);
  for (const patch of [{ scope: 'scan:read mcp' }, { access_token: '' }, { expires_in: 0 }, { token_type: 'other' }]) assert.throws(() => verifyToken({ ...token, ...patch }));
});

test('callback/UI success and Light tools cannot satisfy the hosted connection gate', () => {
  const tools = ['certscore_get_connection_status', 'certscore_scan_site', 'certscore_get_scan_status', 'certscore_get_scan_bundle'].map(name => ({ name }));
  const payload = { authenticated: true, diagnostics: { mode: 'hosted_oauth', workspaceAccess: 'active', createAllowedByScope: true, canRequestScanNow: true } };
  assert.equal(verifyConnection(tools, { structuredContent: payload }).tools, 4);
  for (const badTools of [[], tools.slice(1)]) assert.throws(() => verifyConnection(badTools, { structuredContent: payload }));
  assert.throws(() => verifyConnection(tools, { content: [{ type: 'text', text: 'Authorization complete!' }] }));
  assert.throws(() => verifyConnection(tools, { isError: true, structuredContent: payload }));
  for (const patch of [{ mode: 'scoped_api_key' }, { createAllowedByScope: false }, { workspaceAccess: 'unavailable' }]) {
    assert.throws(() => verifyConnection(tools, { structuredContent: { ...payload, diagnostics: { ...payload.diagnostics, ...patch } } }));
  }
  assert.equal(verifyConnection(tools, { structuredContent: { ...payload, diagnostics: { ...payload.diagnostics, canRequestScanNow: false } } }).canRequestScanNow, false);
});
