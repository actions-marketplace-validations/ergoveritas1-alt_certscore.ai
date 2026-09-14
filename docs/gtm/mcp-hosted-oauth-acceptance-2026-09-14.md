# Hosted MCP OAuth launch acceptance ledger

Verification date: September 14, 2026 (17:46–18:05 UTC initial verification). Publication authorized by the owner's attached implementation request; social posting is not authorized. This supersedes the plan's earlier planning-only permission boundary.

## Production sources

- Web `/api/version`: `4b73bf8114eb72d975540049d920e4e2fd64ea55`, ECS/Fargate.
- Running MCP ECS service `certscore-web-mcp`, task definition `:133`, image `7835c33a8dd682b4487cf57cb5a413d792df4a13`; `/healthz` and MCP initialize report package 0.2.21. AWS service/task definition read directly, not inferred from workflow history.
- Source policy: `apps/web/server/oauth/mcp-oauth.ts` (`hasMcpOAuthScanCreateGrant`, registered client + active organization + membership); `apps/web/server/oauth/mcp-oauth-scopes.ts`; `apps/web/app/oauth/authorize/page.tsx`. Sign-in completion behavior introduced by `02a60ffd`, included in the serving web revision.
- Claude web acceptance: https://claude.ai/chat/e3402f4e-eb5c-4fc7-9f6a-c85e17fd4cc6, Opus 5 Medium, web surface observed September 14. The host exposes no numeric web build; date and surface are retained rather than inventing one.
- Light SDK probe: `outputs/hosted-oauth-launch-2026-09-14/light-production.json`, probe timestamp and complete catalog. No access credentials are stored in evidence.

## Claim ledger

| Claim | Source / production evidence | Client/date | Approved wording / disposition |
| --- | --- | --- | --- |
| Authenticated workspace access | Serving revisions above; Claude connection reports hosted_oauth, active workspace, scan:read scan:create mcp; successful bundle and export reads. | Claude web, September 14 | “Scan public websites, retrieve reports and access previous scans.” Verified and included. |
| Self-serve eligibility | Serving web source checks registered client, membership and active plan_status, not plan name or client brand. Existing scope/target/quota guards remain unchanged. | Claude observed active workspace plus source policy; September 14 | “Members of active workspaces through registered OAuth clients, across plans, without a manual CertScore access grant.” Verified policy and included in technical/availability copy. Not a claim that every host works. |
| OAuth connection UX | Direct UI disconnect → reload showed not connected and production endpoint → Connect → returned connected with 13 read tools and one write tool. Existing signed-in CertScore session reused without separate CertScore consent form. Same scopes retained. | Claude web, September 14 | Start Connect in the host; sign in if prompted; host may show tool approvals. Verified reconnect. Fresh-account first sign-in and changed-scope UI not claimed as tested; serving code follows same sign-in completion path, refresh does not add scopes. |
| Hosted catalog | Claude discovered exact catalog below and confirmed connection mode/scopes; matches checked-in runtime/smoke contract. | Claude web, September 14 | Verified; technical catalog only, counts excluded from marketing. |
| Light catalog and export | Anonymous SDK discovery; completed status, bundle and two-page export through complete=true. | SDK acceptance 1.0.0, September 14 | Four tools verified; three-step core workflow distinguished. Export technical docs retained, excluded from launch narrative. |
| Claude workflow | Reconnected production connector; scan_site returned reused_scan and quotaConsumed=false for `283c66a7-3b56-49d6-974e-2595815680e9`; completed creation response and successful summary bundle. Explicit same-scan status read returned completed at approximately 17:59 UTC; terminal reuse required no active polling. Prior current-day read test also confirmed status on `e3660aaa-e998-418e-a52b-77421e298926`. | Claude web, September 14 | Verified workflow, with bounded summary/coverage and host approval limitations. No new scan claimed. |
| Cursor support | Actual Cursor 3.20.17 displayed “You've hit your usage limit” before executing acceptance. Historical visible local test was not counted as production acceptance. | Cursor Agents 3.20.17, September 14 | Unavailable for current verification. Supported-client claim removed; configuration explicitly labeled an unverified example. No paid upgrade. |
| Grok compatibility | Not needed for launch; no current evidence asserted. | Not tested | Intentionally excluded. |
| Report evidence on OAuth | Claude retrieved 1–91 and 92–111 entries through complete=true; current export_findings also succeeds. | Claude web, September 14 | Verified; technical documentation only. Historical 502 and wrong guidance no longer reproduced. Full report links use current report-only short-lived capabilities; preserve image-specific authorization rules. |
| Scanner/scoring continuity | This patch changes content/discovery only; existing projected evidence remains authoritative. | Source diff | OAuth does not change methodology/scoring or access login-protected targets. Included. |
| Release/social metadata | Release tests and inspected original 1200×630 PNG; canonical metadata and Article schema tested. | Local validation, September 14 | Prepared; serving-page verification required after deployment. |

## Canonical catalogs

Hosted OAuth, authenticated `scan:read scan:create mcp`:

- certscore_explain_finding
- certscore_export_findings
- certscore_get_connection_status
- certscore_get_evidence
- certscore_get_latest_domain_pre_consent_cookies_trackers
- certscore_get_latest_domain_scan
- certscore_get_pre_consent_cookies_trackers
- certscore_get_report
- certscore_get_report_evidence_page
- certscore_get_scan
- certscore_get_scan_bundle
- certscore_get_scan_status
- certscore_list_findings
- certscore_scan_site

Light, anonymous:

- certscore_get_report_evidence_page
- certscore_get_scan_bundle
- certscore_get_scan_status
- certscore_scan_site

## Existing distribution

- MCP.so existing submission `0e8a5aac-f983-40fc-bfc1-e68f8068ae19`: updated the overview to the four-tool catalog, core three-step workflow, canonical quota/setup links, Hosted OAuth workspace distinction and bounded evidence language. Still queued for review; no paid expedited publication, new submission, ticket or message.
- Official registry direct API currently returns 0.2.20 for `ai.certscore/mcp-light`; a direct 0.2.21 lookup returned 404. This contradicts the older repository claim of 0.2.21 publication. Existing manifest validates. An update attempt first encountered expired registry credentials; after ordinary GitHub sign-in renewal, the registry rejected the namespace with 403: the account has `io.github.ergoveritas1-alt/*`, not `ai.certscore/*`. No alternate namespace created and no permission expansion. Listing version is not runtime proof. Existing listing endpoint and generic description remain accurate; publishing a new immutable version needs the domain-authorized publisher and is an explicitly excluded distribution follow-up, not a new marketplace submission.
- Claude Community listing: current connector is accessible, but its available controls are View details, Refresh tools list and Remove; no listing-description edit control is exposed. No external message was sent to request changes. The live catalog itself refreshed to 14 tools.
- Smithery existing listing reviewed at https://smithery.ai/servers/ben-qe1c/certscore-ai: generic account-free Light description and homepage remain accurate; no update needed. Cursor Directory reviewed at https://cursor.directory/plugins/certscoreai-mcp-light: Light endpoint is correct; no edit access is exposed. Its older consent-path description is not treated as current policy authority or Hosted OAuth client acceptance.
- Existing repository Cursor integration README updated for canonical eligibility and honest verification status. No marketplace approval claimed.

## Costs and exclusions

No new infrastructure, quotas, retention or model services. Production acceptance reused retained scans; no new scans in the successful Claude run. Ordinary bounded client-model and read usage estimated below $1 total incremental execution cost; actual provider billing is not exposed by the UI. Static image transfer uses existing capacity and is estimated below $1/month incremental at ordinary launch traffic. No advertising, paid publishing, scheduled tests, emails, DMs, LinkedIn or X posts.

Fresh-account first sign-in and changed-scope UI are not advertised as tested. Cursor and Grok support are not advertised. Registry 0.2.21 publication is not claimed. Bounded bundles are not complete evidence exports or compliance conclusions.

## Deployment and final checks

To be completed with serving revision, workflow URL and post-deployment checks. The release is not declared ready solely from this file or repository state.

Local QA: desktop release screenshot inspected; 390×844 mobile headline and body inspected with no overflow. Homepage shows OAuth, A/R, Light in order. Share asset inspected at 1200×630. Focused release/docs tests 11/11 pass; OAuth policy tests 10 pass with two database-dependent tests skipped (no local production DB access). Public AS/resource metadata verifier passes. X weighted-length estimate 239 characters.

Light full workflow at 18:05:42 UTC: production scan_site reused `283c66a7-3b56-49d6-974e-2595815680e9`, quotaConsumed=false; explicit status completed and summary bundle succeeded. Safe evidence: `outputs/hosted-oauth-launch-2026-09-14/light-workflow.json`.

Final preflight: `pnpm preflight:fast` exited 0. The last wording-only correction was followed by the focused 11-test release/docs suite (all passed). No behavior assertion was skipped to obtain preflight success. Local 15-page HTTP verification passed metadata, canonical URL, schema, image dimensions, feed/sitemap/llms inclusion, ordering and reconciled documentation.
