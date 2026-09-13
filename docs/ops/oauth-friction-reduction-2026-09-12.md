# Hosted OAuth friction reduction — local implementation

## New changes

- Reuse a single unexpired, non-revoked refresh grant as evidence of prior consent for the exact client, signed-in user, workspace and complete requested scope set. Require current active workspace membership. Read the primary database to avoid stale replica revocation. Preserve client redirect validation, PKCE S256 and one-time authorization-code exchange. Explicit prompt=consent still shows the form. No new consent table or longer token lifetime was introduced.
- Reorder the developer setup page so Hosted OAuth is the primary option, with all 12 tools, account-specific consent and the create/status/bundle sequence. Keep Light as the account-free three-tool preview and keep local API-key permissions distinct.
- Creation quota errors offer waiting or an existing domain scan instead of requiring support approval. Expose scanStarted=false, quotaConsumed=false and recovery.requiresReauthorization=false for typed creation-rate-limit rejection. Preserve support contact as an optional fallback and retain upstream error details.
- Keep the earlier all-12 purpose, canonical riskLevel, explicit quotaConsumed, nested no-go and inventory-count response improvements.

## Verification

129 MCP package tests passed. MCP package build and web typecheck passed. Real PostgreSQL OAuth exchange tests cover first consent, successful grant reuse, client/user/workspace/scope mismatch, removed membership, inactive workspace, refresh rotation, family replay revocation, read-only grants and expired grants. Fixtures now match production's text OAuth owner ID versus UUID member ID.

Restarted localhost MCP with the built package and passed all 12 authenticated tools with output-schema validation and tool-purpose guidance, followed by same-session token refresh, status and bundle. Used existing local canary 4bb8f7a1-bd70-492c-a520-bf6979cfcff6; creation reused the result and did not launch a scan. Verified Hosted OAuth setup renders through the browser on localhost. Diff whitespace check passed.

## Release and remaining scope

Copied changed OAuth/MCP files into the isolated release checkout. These new edits are not deployed. Live services remain on fd5bab5b. The actual Claude production run still requires the pending Connect action-time confirmation and test-spend answer; localhost transport verification is not evidence of Claude production completion.

Existing implementation includes initialization scopes/create permission and next-tool guidance, bounded bundle text, transport refresh compatibility, static Cursor registration/plugin files, and operational invocation/activation telemetry. Marketplace submission is not performed. Live remaining quota in the initial handshake is still unavailable and explicitly null. An integrated connection-to-bundle conversion funnel is not added by this patch. Existing admin activity metrics must not be described as a complete linked OAuth consent funnel.

Paid self-serve checkout has an independent purchasing-paused guard and existing OAuth quotas do not automatically increase with plan. No promise of paid OAuth capacity or bypass of that guard was added. Defining higher paid allowances requires an explicit product/cost decision.

## Cost

One existing indexed primary lookup per authorization attempt, no additional service, table, scan, model call, retention extension or provisioned capacity. Estimated incremental database cost below $1/month at 50,000 reconnections; disclosed before implementation. Longer response guidance adds bounded client input tokens. Existing paid Claude test budget remains unapproved; no such usage was incurred during this implementation.
