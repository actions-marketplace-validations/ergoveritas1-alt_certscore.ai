# Cursor authenticated OAuth local verification

September 12, 2026. No production deployment or marketplace publication.

## Actual Cursor result

The owner completed the fresh localhost consent request. Cursor used `certscore_cursor_hosted_oauth_v1`, PKCE S256, and its documented `http://localhost:8787/callback`. It discovered 12 tools on **CertScore OAuth Local Test**, using `http://localhost:3004/mcp` and the local web OAuth issuer. The existing workspace remained on its original custom plan; no temporary Trial conversion was applied.

Cursor executed exactly one new canary scan using `freshness=refresh`:

- Target: `https://ergoveritas.com/.well-known/certscore-canary/sentinels/broad-baseline.html`
- Scan: `4bb8f7a1-bd70-492c-a520-bf6979cfcff6`
- Create: accepted, queued, `executionMode=new_scan`, not reused. MCP creation timing: approximately 1,777 ms.
- Status: completed after following the returned polling interval.
- Bundle: returned successfully in Cursor, score 39, partial coverage, `significant_review_recommended`.
- Report: `http://localhost:3000/scan/4bb8f7a1-bd70-492c-a520-bf6979cfcff6`
- Cursor reported no permission, quota, schema, or transport errors. The synthetic canary's score is not a conclusion about the main ErgoVeritas site.

## Real refresh exchange

`apps/web/server/oauth/local-oauth-gate.test.ts` uses the account context of the local static-client OAuth grant, creates a separate PKCE authorization code through the real server function, exchanges it at the actual localhost token endpoint, and initializes an authenticated HTTP MCP session. It retrieves status and bundle, exchanges the refresh token at the real endpoint, then retrieves status and bundle using the replacement access token and unchanged session ID. This passed in approximately 3.4 seconds. The test deletes its own authorization-code and refresh-token records and its MCP session afterward, leaving Cursor's grant intact. It does not create an additional scan.

This harness does not automate user consent or force Cursor itself to refresh an unexpired token. Actual Cursor consent/create/read and actual token-endpoint refresh/same-session reads are verified separately, without claiming an hour-long Cursor expiry cycle was observed.

Run against localhost only:

```sh
OAUTH_GATE_SCAN_ID=4bb8f7a1-bd70-492c-a520-bf6979cfcff6 TSX_TSCONFIG_PATH=apps/web/tsconfig.test.json node --env-file=apps/web/.env.local --import tsx --test apps/web/server/oauth/local-oauth-gate.test.ts
```

## Fix and regression coverage

- Default MCP origin allowlist now includes exactly `https://www.cursor.com`. Previously browser requests from this origin were rejected. No wildcard was added; a lookalike origin remains rejected.
- Authenticated HTTP regression coverage now checks successful create/status/bundle results against their output schemas, replacement-token credential forwarding, concurrent isolation, and Cursor-origin CORS responses. The 39 hosted MCP tests passed.
- The database-backed OAuth exchange regression checks bad verifier/callback rejection, one-time code use, refresh rotation, and preservation of read-only scopes.

The original production incident remains subject to post-deployment verification against AWS; local success is not a production latency guarantee. No production data or policy was changed. One local canary scan was authorized for verification, estimated below $0.10 incremental compute; no recurring job or capacity increase was created.

The local MCP process, local static-client record, and Cursor test connection remain available for review. They are deliberately named local test resources, separate from the existing Light connection.
