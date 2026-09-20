# Actual Claude Hosted OAuth check — September 12, 2026

Result: read path works; authenticated create is blocked on the existing production connection. Do not describe this as a completed frictionless onboarding verification.

Used the real signed-in Claude Chat UI and existing connected Community directory entry CertScore.ai. Its directory detail shows https://mcp.certscore.ai/mcp and required sign-in. All 12 tools are installed (11 read-only, one write). The separate CertScore MCP Light QA connection was not used.

Observed calls:
- certscore_get_latest_domain_scan(ergoveritas.com): succeeded; text returned only a report URL, requiring Claude to extract the scan ID.
- certscore_get_scan_status: succeeded, completed.
- certscore_get_scan_bundle: succeeded, score 92, partial coverage.
- Retained scan: 76165e75-76b7-4acc-87fb-ac15b0b06a18.
- certscore_scan_site, exactly once, freshness refresh, eu_ie, owned broad-baseline canary: failed HTTP 403 forbidden. Actual error: “This CertScore.ai API key does not include the required Pulse scope.” Response: freshnessDecision=request_rejected, quotaConsumed=false, reused=false, upgradeSupportEmail=null. No scan ID or new scan. No retry.

The create request was https://ergoveritas.com/.well-known/certscore-canary/sentinels/broad-baseline.html.

Claude prompted for Allow once for status, bundle, and creation; each single requested operation was allowed. No persistent permissions were expanded. Its initial generated summary incorrectly said no permission friction; actual UI prompts are authoritative. Claude's connector settings showed several tools requiring approval and a Claude organization restriction on Always allow for write tools in Cowork. These are host-side controls, separate from CertScore staff authorization.

The current local OAuth policy suite passed all 11 tests, including active membership across plans and older read-only registrations gaining scan:create at reauthorization without manual grant-table approval. Those changes remain undeployed. The existing token cannot be silently expanded on refresh. The production error's obsolete Pulse wording and missing next action also match the older response path.

Outstanding: release the approved local fixes when deployment is authorized, then user reauthorizes the existing Claude connection and repeat create/status/bundle. New-account consent and actual Claude token refresh have not been tested in this check. Claude remote connectors run from Anthropic's cloud and cannot directly reach localhost; testing undeployed code requires an explicitly authorized reachable test environment. No public tunnel was opened, no deployment, no account/workspace changes, no new connector duplicate.

Costs: bounded Claude test usage estimated under $1, disclosed before testing. The one scan attempt was estimated under $0.10 but rejected before creation and consumed no scan quota. No recurring infrastructure added.
