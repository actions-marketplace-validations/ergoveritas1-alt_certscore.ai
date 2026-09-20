# All twelve OAuth MCP tools — local live verification

September 12, 2026. All twelve advertised tools passed through the real localhost OAuth token endpoint and HTTP MCP transport, using the current local workspace grant and completed canary scan `4bb8f7a1-bd70-492c-a520-bf6979cfcff6`.

This is a live authenticated integration run, not mocked tool responses or public unauthenticated reads. It uses the reusable integration harness; actual Cursor consent and fresh creation were separately verified in `oauth-cursor-local-gate-2026-09-12.md`.

| Tool | Result | Observed duration |
| --- | --- | --- |
| `certscore_scan_site` | Pass | 568 ms |
| `certscore_get_scan` | Pass | 363 ms |
| `certscore_get_scan_status` | Pass | 290 ms |
| `certscore_get_report` | Pass | 390 ms |
| `certscore_get_evidence` | Pass | 426 ms |
| `certscore_get_scan_bundle` | Pass | 977 ms |
| `certscore_export_findings` | Pass | 392 ms |
| `certscore_list_findings` | Pass | 419 ms |
| `certscore_get_pre_consent_cookies_trackers` | Pass | 413 ms |
| `certscore_explain_finding` | Pass | 398 ms |
| `certscore_get_latest_domain_scan` | Pass | 283 ms |
| `certscore_get_latest_domain_pre_consent_cookies_trackers` | Pass | 434 ms |

Each call returned a non-error MCP result, nonempty TextContent, and structured output matching its declared contract. Checks also verified scan IDs, completed lifecycle for scan/status/bundle, a real finding ID passed from list to explanation, latest-domain lookup returning the retained canary scan, and requested limits on findings and pre-consent rows. The create call correctly reused the eligible recent scan with `freshness=latest`; no additional physical scan was started. Fresh creation was verified in the prior Cursor run.

After all twelve calls, the harness exchanged a real refresh token and successfully read status and bundle again using the replacement token in the same MCP session. Temporary harness authorization-code/refresh records and its session were cleaned up. Cursor's connection was left intact.

The first all-tool pass validated schemas; a second pass added semantic cross-checks and passed again. Web TypeScript and diff checks passed. No application defect was exposed by these calls, so no speculative runtime fixes were introduced. These are local timings, not production percentiles. This does not establish every optional argument, quota boundary, or scan lifecycle state; those remain covered by focused contract and transport regression suites.

Repeat with:

```sh
OAUTH_GATE_ALL_TOOLS=1 OAUTH_GATE_SCAN_ID=4bb8f7a1-bd70-492c-a520-bf6979cfcff6 TSX_TSCONFIG_PATH=apps/web/tsconfig.test.json node --env-file=apps/web/.env.local --import tsx --test apps/web/server/oauth/local-oauth-gate.test.ts
```

No production changes, deployment, new infrastructure, model calls, or recurring tasks were added. Creation reused the retained scan, so no incremental scanner compute was required.
