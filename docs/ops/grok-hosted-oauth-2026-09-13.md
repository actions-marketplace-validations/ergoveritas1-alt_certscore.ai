# Grok Bot Hosted OAuth verification and host escalation

September 13, 2026. Grok E2E status: **BLOCKED, reported by tester; not independently reproduced here.** No Grok canary scan was run. The loopback page, Added card, and discovery metadata are not E2E acceptance evidence.

## Independent CertScore verification

Run with Node 22–24 from the repository:

```sh
node scripts/verify-hosted-oauth.mjs
node --test scripts/verify-hosted-oauth.test.mjs
```

The default verifier reads production AS and protected-resource metadata, validates issuer/endpoints, PKCE S256, public-client authentication and all three scopes. It identifies the configured static client but does not claim that discovery proves its database registration. It never creates a scan or uses Light.

To independently test client registration, browser authorization, code exchange, and authenticated MCP:

```sh
node scripts/verify-hosted-oauth.mjs --authorize
```

Run this separately from Grok/Cursor authorization: it must own `localhost:8787`. An occupied port fails; do not terminate another listener blindly. Open the printed authorization URL yourself in a trusted browser. The verifier generates fresh PKCE/state, validates the callback, exchanges the code once using the exact client/callback/verifier, and calls only `tools/list` and `certscore_get_connection_status` on `/mcp`. Credentials remain in memory and are never printed. The server may retain its normal authorization/refresh grant; this is an actual account authorization, not a metadata probe. Close/revoke the diagnostic grant through normal account controls if desired. Do not copy Grok's code into this verifier: its verifier/state belong to a different transaction.

A successful independent check proves this diagnostic client's service path only. Grok's credential storage, tool binding, resume behavior, and scan execution remain unverified. A quota-blocked `canRequestScanNow` is reported separately from valid authentication and create scope. Request bodies, cookies, authorization codes, tokens, verifier and full callback URLs must stay out of shared logs.

## Manual Grok acceptance checklist

1. Record exact Grok/host build, OS, timestamp/timezone and endpoint. Disable Light for this run. Reuse one Hosted OAuth connection, or remove/re-add it for the explicitly clean test; never substitute a Light result.
2. Add `https://mcp.certscore.ai/mcp` using `certscore_cursor_hosted_oauth_v1`, requesting `scan:read scan:create mcp`. This public client permits the exact Cursor callbacks documented in the integration README; do not generalize it to another host's arbitrary callback.
3. Complete authorization. Record whether a consent page appeared and which scopes it displayed. Browser callback success is only an intermediate observation.
4. In the same running Grok agent, require `GetMcpServerStatus` to report **connected**, tools **greater than zero**, and the Hosted OAuth namespace to be present. `needsAuth`, `failed_to_load`, Added, or Retry is a failure/blocked outcome, regardless of browser text. After returning from the browser, record whether the agent resumes without a user ping; measure this separately from eventual manual recovery.
5. Through that exact Hosted OAuth namespace call `certscore_get_connection_status`. Require a non-error result, `authenticated: true`, `diagnostics.mode: hosted_oauth`, `diagnostics.workspaceAccess: active`, and `diagnostics.createAllowedByScope: true`. Check `diagnostics.canRequestScanNow` before creation. If unavailable, retain the returned reason and stop; do not reconnect repeatedly or switch to Light.
6. Once the gate passes and the owned-canary run is authorized, call `certscore_scan_site` for `https://ergoveritas.com/.well-known/certscore-canary/sentinels/broad-baseline.html` with `freshness=refresh`. Require a new scan, retain its ID, and do not label reuse as fresh execution.
7. Call `certscore_get_scan_status` for that ID only while active, honoring returned polling guidance and `Retry-After`. Require completed status; failed/canceled is not success.
8. Call `certscore_get_scan_bundle` for that same ID with `detail=findings`. Require a non-error bundle with matching identity and retain score, coverage, finding IDs and report link. Canary signals describe the synthetic canary, not the main ErgoVeritas site.
9. Mark agent E2E PASS only when steps 4–8 have evidence from the same Hosted OAuth run. Track explicit-consent and automatic-resume acceptance separately; do not infer either from the scan outcome.

## Consent-policy discrepancy

The checked-in authorization page explicitly treats successful sign-in as sufficient on first connection and on `prompt=consent`. Its isolated regression test enforces this behavior. This supersedes the older friction-reduction note that says `prompt=consent` displays a form. Therefore the tester's requested interactive reauthorization is **not satisfied by current source**, and silent authorization alone is not evidence of a host bug. The diagnostic sends `prompt=consent` so this discrepancy remains observable. This change set does not alter the existing sign-in policy; restoring explicit reauthorization consent is a separate product behavior change.

## Host escalation packet — prepared, not submitted

**Title:** OAuth callback reports complete while Grok MCP runtime remains needsAuth/failed_to_load with zero tools.

**Reported reproduction:** Remove Hosted OAuth → add official static client at `/mcp` → authorize → `localhost:8787/callback` says complete → same agent reports needsAuth/failed_to_load and zero tools. Added/Authorize→Retry UI disagrees with runtime. A user ping does not reliably recover tool binding. Light remains discoverable but is excluded from this acceptance run.

**Expected:** Validate state, exchange the code with the original PKCE verifier and exact callback/client, retain the resulting credentials, initialize authenticated MCP, load tools, then report connected and resume the agent. On failure display the failed stage and a safe actionable reason. Never claim connection success from receipt of a code alone.

**Needed to assign root cause:** Redacted stage timestamps and HTTP outcomes for callback receipt/state validation, token POST, credential persistence, authenticated MCP initialize and tools/list; host correlation/request IDs; exact runtime status and tool count. Retain safe OAuth error codes and transport/status codes, not secrets or complete URLs. No token POST points to callback dispatch/binding; a failed token POST requires checking both client inputs and CertScore's response; a successful exchange followed by 401/403 or failed initialization needs both sides' transport logs; successful initialize/tools/list with absent agent tools points to host catalog binding. Current tester evidence does not establish which stage failed.

**Marketplace:** Local package exists at `integrations/cursor/certscore-hosted-oauth`, including its plugin manifest. Marketplace publication/discoverability is not established by this package or this test. Treat submission/listing as a separate distribution task; do not rename Light to imply Hosted OAuth.

No external message or issue has been submitted. No production code, deployment, scan, model call, or recurring capacity is added by these diagnostics. Estimated recurring cost increase: $0/month; occasional metadata/auth requests use existing service capacity and are expected below $1/month.

## Verification performed for this change

The default verifier passed against production AS and protected-resource metadata. Four deterministic regression tests passed, covering scope omissions, endpoint substitution, unique PKCE/state, callback rejection, token validation, Light/empty catalogs, and fail-closed connection gates. The interactive authorization mode was not executed, so no new grant, token exchange, authenticated diagnostic session, or Grok E2E pass is claimed.
