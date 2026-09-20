# Hosted OAuth adoption follow-up

Prepared locally September 12, 2026. No deployment, migration application in production, marketplace submission, or paid scan canary was performed.

## Implemented

- Migration 0198 seeds the public PKCE client `certscore_cursor_hosted_oauth_v1` with Cursor's documented exact web/Agents and desktop callbacks. Unused-DCR cleanup excludes this first-party registration. It is a public client identifier, not proof of identity. Arbitrary custom-scheme redirects remain rejected.
- Added `integrations/cursor/certscore-hosted-oauth`, its `.cursor-plugin/plugin.json`, static OAuth `mcp.json`, README, license, and repository marketplace entry. The existing Light plugin remains intact. Configuration requires the migration and application release before use.
- Developer setup recipe uses the documented `auth.CLIENT_ID` and scopes. Independent Grok hosts must provide their own configuration contract; no unsupported portable AddMcpServer format was invented.
- Consent distinguishes requested scopes from those granted after approval.
- Initialize instructions include route, validated hosted OAuth scopes, create-scope permission, recommended next tool, and the three-tool sequence. Remaining quota is explicitly unknown, avoiding a new database read or invented allowance. Runtime quota enforcement remains authoritative.
- Light instructions explain public scanning versus workspace history and point to Hosted OAuth. Documentation recommends a stable name and reuse of an existing endpoint installation. A server cannot deduplicate local namespaces or independently verify a declared client name.
- Bundle TextContent puts scan ID, score, risk, returned finding IDs, pre-consent counts, and report URL before long optional sections. This supplements canonical projected data, without synthesizing findings.
- Create permission errors include a read-existing-scan alternative and `scanStarted: false`; permission/quota errors include support email. Errors remain JSON TextContent with `isError: true`, because their advertised output schemas describe successful results.

## Evidence and verification

- 99 MCP server/text tests and 30 OAuth/API-key tests passed, including initialize instructions, package/client configuration, bounded summary ordering, and actionable errors.
- MCP package build, hosted MCP typecheck, web typecheck, and diff checks passed.
- Applied migration twice inside a local transaction: one public client, exactly two callbacks, three scopes, public `none` authentication method. Rolled back afterward.
- Existing local completed scan status passed the MCP output schema.
- Read-only reproduction against reported scan `9ba99a8c-b1ad-44c1-985f-92cef760ab40`: production public status returned HTTP 200 and passed the MCP schema in approximately 390 ms. A real MCP client using local server code against production public read APIs obtained a schema-valid bundle in approximately 632 ms.
- Those public reads did not use the original user's OAuth credential. The earlier intermittent/authenticated timeout and schema failure remain unproven; these measurements are not production latency percentiles or proof that the incident is fixed. No speculative schema relaxation, retry increase, or timeout increase was added.

## Remaining release and product work

Deploy only after owner authorization, then verify actual Cursor browser consent and authenticated tools against the released static client. Publish the plugin only after release verification. Live remaining-quota reporting, an in-product paid-volume request workflow, and a recurring public scan canary are not implemented here. A scheduled scan canary requires an explicit frequency and cost budget; no recurring paid usage was created.

Incremental storage for one client record and bounded handshake text is estimated below $0.01/month at 50,000 connections. No new service, capacity, retention extension, or paid model call is added. Trial scan usage expansion remains within the owner's previously approved existing quotas.

Primary configuration sources: [Cursor MCP](https://prod.cursor.com/docs/mcp), [Cursor plugin reference](https://prod.cursor.com/docs/reference/plugins).
