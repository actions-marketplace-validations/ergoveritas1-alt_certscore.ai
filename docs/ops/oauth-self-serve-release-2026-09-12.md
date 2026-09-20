# Hosted OAuth self-serve release

Owner authorized production deployment and a repeat of the actual Claude create/status/bundle test after the production read-only scope failure.

Release checkout: `/Users/benmasek/WC01-oauth-release`, branch `codex/oauth-self-serve-release`, based on live web 7595f96937c8a7c9e707c387694e2d641dc0921e. Unrelated Admin performance changes remain in the original checkout and are not released.

Commits:
- 10a9175c: isolated OAuth self-serve, consent, client registration, token-refresh transport, and response guidance changes.
- 945f9c80: corrected a transport test to verify disallowed CORS preflight has no allow-origin header and actual POST is rejected.
- fd5bab5b: corrected authorization-server discovery to advertise all three self-serve scopes and updated the release verifier's obsolete read-only expectation.

Verification before deployment: full change-aware preflight passed on 945f9c80 and again for the discovery correction on fd5bab5b; 124 MCP response tests; real PostgreSQL OAuth exchange/policy tests; discovery route test; localhost discovery/readiness smoke. Fresh worktree package builds were required before broad preflight could run. No failing behavior assertion was skipped.

AWS workflows:
- Initial web 34723140255: success, migration and ECS rollout passed.
- Initial MCP 34723139689: failed verification because the old verifier explicitly rejected scan:create in discovery; automatic rollback succeeded. Other public health/authentication checks passed. The inconsistency was corrected, not bypassed.
- Corrected web 34723555448: success. Live `/api/version` reports fd5bab5bd4d17789a4c188ee700c931f085dbd57, ecs-fargate. Authorization discovery advertises scan:read, scan:create, mcp and self_serve_scopes without grant_gated_scopes.
- Corrected MCP 34723968609: success. ECS task definition certscore-web-mcp:125; target/image verification, public metadata, and authenticated tool-list parity checks passed. Protected resource discovery now advertises all three self-serve scopes. Both services use fd5bab5bd4d17789a4c188ee700c931f085dbd57.

Actual Claude reauthorization: old read-only connector disconnected through its UI. Connect opened the real production consent screen. Claude requested scan:read mcp; the screen explicitly offers scan:read mcp scan:create, says “Ready to scan. No staff approval needed,” uses generic workspace wording and retains 20/hour and 100/day limits. User action-time consent requested and pending. No expanded account access granted by the agent.

No scanner/validation service deployment, marketplace publication, quota increase, or new recurring infrastructure. Earlier Claude canary creation attempt was rejected before creation and consumed no scan quota. Successful post-release canary test is still pending user consent.

Response iteration prepared after deployment (not yet redeployed): all 12 tools now have short purpose guidance; canonical riskLevel and explicit quotaConsumed are preserved; nested no-go results stop polling; bundle inventory counts are returned. 128 MCP tests, 39 HTTP transport tests, package build and diff whitespace check passed. Identical edits retained in the release and original checkouts.

Actual Claude all-12 baseline and post-iteration runs remain pending action-time Connect consent and test-budget approval. Estimated two-run model usage $2–$5, plus at most $0.20 for two owned-canary scans; requested total budget cap $5. No such test spend has been incurred while approval is pending. Response edits add no service calls, scans or provisioned infrastructure; slightly longer guidance adds bounded client-model input tokens whose aggregate cost depends on client usage.
