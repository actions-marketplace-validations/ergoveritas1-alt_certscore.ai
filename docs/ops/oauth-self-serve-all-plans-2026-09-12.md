# Self-serve OAuth across active workspace plans

This owner-approved policy supersedes the trial-only policy earlier on September 12, 2026. All supported OAuth MCP scopes (`scan:read`, `scan:create`, `mcp`) are offered by default at authorization to members of active workspaces using registered clients, regardless of plan or client name. No manual CertScore grant is required. Legacy manual grants no longer bypass active-workspace membership checks. Local scoped API keys are outside this OAuth change.

Existing read-only refresh tokens do not gain scopes silently; reconnecting presents the full permissions for user consent, including older read-only client registrations. Existing per-workspace creation limits, target guards, PKCE and callback matching remain unchanged. Metadata and setup/consent/error copy describe self-serve access.

Verification: 31 OAuth/API-key tests passed, including the real database-backed authorization-code exchange, bad PKCE/callback rejection, code replay rejection, refresh rotation, and read-only scope preservation. Eligibility fixtures cover active free, paid, and custom plans, inactive plans, nonmembers, unknown clients, and manual-grant non-bypass. Web and hosted MCP typechecks passed. Actual Cursor opened the localhost consent page using the static client and PKCE. Reloading after the policy change showed all three granted scopes on the existing custom workspace without changing its plan.

The connecting user's consent is not staff approval or a separate workspace-owner approval. Actual Cursor callback completion and live tool execution remain pending that consent. The local test connection and static client are retained for this continuation; localhost MCP runs on port 3004. No production deployment or plan change occurred.

Adoption-driven scan usage expansion is owner-approved within existing quotas. No new infrastructure, quota increase, recurring canary, or paid scan was added by this change.
