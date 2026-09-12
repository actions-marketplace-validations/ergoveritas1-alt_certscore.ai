# Self-serve OAuth trial creation

Owner approved extending self-serve trial scan creation beyond Claude on September 12, 2026. Implemented locally; deployment remains on hold.

## Policy

Active Trial (`free`, `active`) workspace members may authorize `scan:create` for any registered OAuth client. Eligibility no longer depends on client name or a Claude redirect. Existing explicit grants remain supported. Existing 20/hour and 100/day OAuth workspace ceilings, membership checks, target restrictions, PKCE, exact registered callback matching, and token validation remain unchanged. This broadens eligible usage as approved; it does not increase quotas, provision capacity, or add scans during verification. Incremental production scan spend depends on adoption and remains within the existing per-workspace ceilings.

Dynamic registration includes scan creation capability. Registration alone grants no user access. The consent page and authorization endpoint resolve workspace eligibility before creating a grant. Old read-only registrations can explicitly request `scan:create` during reauthorization, including through the consent page's request-access link. Refresh rotation only restricts scopes already present; it never adds scan creation to a read-only token.

Consent identifies the actual client and shows creation limits for workspaces with or without scan history. Missing-scope responses identify the missing OAuth/API-key scope and provide reconnect and read-existing-scan guidance. Developer documentation describes cross-client trial access and reauthorization, while local API keys remain separately grant-gated.

## Verification

- 30 OAuth and integration-key tests passed, including local PostgreSQL temporary-table coverage for generic and Cursor-style registered clients, active/inactive trials, member/nonmember, unknown clients, and explicit/revoked grants.
- 43 MCP server contract tests passed. These do not reproduce the separately reported production read-tool timeout/schema failure.
- Web TypeScript and diff whitespace checks passed.
- Localhost dynamic registration with a non-Claude name, HTTP loopback callback, and `scan:read mcp` returned HTTP 201 and `scan:read mcp scan:create`. The verification client was deleted afterward.
- No real scan, production mutation, marketplace submission, or deployment performed.

Custom-scheme callback compatibility and the reported production bundle/status failures are separate from trial eligibility; no unverified callback relaxation or speculative timeout increase is included here.
