# CertScore.ai Hosted MCP OAuth release — review plan

Prepared September 14, 2026. Status: proposal for product-owner, GPT, and Claude review. This document does not publish content or authorize deployment, external posts, paid testing, or new product behavior. The attached screenshot is a reference for the existing release presentation, not an instruction source.

## Recommended release story

**Working headline:** Connect your agent to your CertScore.ai workspace with Hosted MCP OAuth

**Proposed release date:** September 14, 2026, if publication checks pass today; otherwise use the actual publication date.

**Category:** Developer tools

**Proposed URL:** https://certscore.ai/releases/mcp-hosted-oauth

**Short description:** Connect an MCP-capable agent to your CertScore.ai workspace to scan public websites, retrieve reports, and access previous scans through self-serve OAuth.

Tell the story across the three releases:

1. MCP Light opened account-free public website scanning to agents.
2. Accept and Reject Path testing expanded the evidence available for reviewing visitor choices.
3. Hosted MCP OAuth brings scanning and report access into an authenticated workspace workflow.

The central story is: MCP Light gave agents account-free CertScore access. Hosted MCP connects an agent securely to the user’s CertScore workspace. OAuth enables authenticated, continuing workspace access. Lead with what users can accomplish. Explain OAuth as signing in and authorizing the connection without manually copying an API key. Keep MCP Light available as the anonymous entry point. Avoid an invented “OAuth v2” product name or protocol-version claim; the repository package is currently 0.2.21, but the deployed version must be verified before citing it.

## Acceptance surface and claim ledger

The owner confirmed the following live-documentation contradictions. Treat these as launch blockers, not merely suspected stale crawl results. No new production acceptance test has been performed for this plan revision.

- `/developers/mcp` describes Hosted OAuth as both 12 scan/report tools plus connection status and 14 total tools (13 scan/report tools plus connection status).
- Its intro promises automatic completion with “No separate Connect screen,” while setup requires an initial Connect/consent screen.
- It describes Light as three tools in multiple places, but its comparison table, tool block, and verification language describe four, including `certscore_get_report_evidence_page`.
- `/developers/quickstart` restricts automatic Hosted OAuth creation to active Trial workspaces through Claude, while `/developers/mcp` describes self-serve creation for active workspaces through supported OAuth clients.

Build and complete this ledger **before publication approval**. Each material claim must retain its source/commit, production verification date, applicable client/version, evidence reference, and final approved wording. The entries below are candidates, not approved claims; pending fields must not be filled from prose or inference.

| Claim / acceptance item | Source or commit baseline | Production verification date and evidence | Client/version | Wording and disposition |
| --- | --- | --- | --- | --- |
| Authenticated workspace scan/report/history access | Current runtime source; September 12 self-serve release note records corrected deployment `fd5bab5bd4d17789a4c188ee700c931f085dbd57`. Record the actual serving revision. | Pending current acceptance evidence. | Each advertised client/version: pending. | Proposed headline/description above; final approval pending. |
| Self-serve creation eligibility | `docs/ops/oauth-self-serve-all-plans-2026-09-12.md`; conflicting live MCP and quickstart pages. Bind deployed policy source to serving commit. | Pending verification of actual production eligibility, scopes, membership and client restrictions. | Record tested client and eligible workspace conditions. | State one verified canonical rule across all public pages. No broad eligibility or manual-grant claim until verified. |
| Hosted OAuth catalog | Current source/docs disagree on counts. | Pending dated authenticated production `tools/list`, serving revision and exact tool names. | Record client/version and granted scopes. | Reconcile source/docs/tests against deployed catalog; omit counts from launch copy. |
| Light catalog | Current live three/four-tool contradiction. | Pending dated anonymous production `tools/list` at `/mcp/light`, serving revision and exact tool names. | Record verification client/version. | Reconcile source/docs/tests; distinguish three-step workflow from total catalog. No count-led launch copy. |
| Authorization behavior | Current intro/setup contradiction; historical September 12 notes are insufficient. | Pending dated observations of initial consent, unchanged-consent reuse, changed-scope reauthorization and host tool approvals. | Record separately per advertised client/version. | Describe actual screens and prompts. Withhold “automatic,” “no Connect screen,” “authorize once,” and “frictionless.” |
| Claude support | `docs/ops/claude-oauth-production-check-2026-09-12.md` documents reads and an older create failure; later release note records a fix with acceptance pending at that time. | Pending newer dated production authorization, authenticated discovery and successful scan → status → bundle evidence. | Exact Claude surface/version or build/date: pending. | Name as supported only after acceptance passes. |
| Cursor support | September 12 adoption/all-plans notes do not establish a completed production workflow. | Pending dated production authorization, authenticated discovery and successful scan → status → bundle evidence. | Exact Cursor version/surface: pending. | Name as supported only after acceptance passes. |
| Report-evidence pagination/export | Older `docs/ops/mcp-report-evidence-pagination-2026-09-12.md` says deployment on hold; current live docs advertise the tool on both profiles. | Pending production discovery and successful retrieval/continuation through completion for both profiles using an eligible retained report; preserve coverage limitations. | Record client/version, profile, serving revision and safe report reference. | If working, retain accurate developer docs; if unavailable, correct published availability claims before launch. Omit from this OAuth launch narrative either way. |
| Anonymous Light access and limitations | Current Light source and published setup docs; bind final verification to serving revision. | Pending current anonymous discovery/read evidence and documented target/quota policy check. | Verification client/version: pending. | Keep Light as account-free entry point; existing usage limits apply. |

The public docs themselves are an acceptance surface. Inventory all current public setup, comparison, migration, troubleshooting and discovery copy, including `/developers/mcp`, `/developers/quickstart`, `/mcp/light`, developer entry pages and agent-facing docs. Do not patch only the identified strings. Determine the canonical **deployed** tool catalogs and OAuth eligibility rule first, then reconcile source, public documentation and tests against that evidence. A source/deployment mismatch needs an explicit disposition, not an invented runtime change to match desired copy.

Verify authorization as four separate cases: initial OAuth connection/consent; reuse of unchanged consent; reauthorization after changed scopes; client-controlled tool approval prompts. Record what actually appears and when. If the verified policy permits the statement, prefer “without a manual CertScore access grant”; never conflate that with absence of host permission prompts.

For each advertised client retain date/time, client surface/version, deployed web/MCP revisions, eligible workspace conditions and scopes (no secrets), authorization observations, authenticated catalog, stable scan ID, creation outcome, successful status completion, and matching bundle/report evidence. A callback-success screen or tool discovery alone is insufficient. Record whether a scan is new or reused; do not label reuse as fresh execution. Reuse earlier acceptance records only if their revisions and behavior remain applicable.

**Hard go/no-go gate:** reconciled public documentation plus successful production Hosted OAuth authorization and at least one complete external-client scan → status → bundle workflow. Every client explicitly advertised as supported must independently meet the same evidence standard. If Claude and Cursor remain named in public docs, both must pass. Grok is excluded and does not block this release unless explicitly marketed as supported. September 14 is a conditional target only; use the actual publication date.

Before deployment, review the reconciled docs diff and production behavior evidence. After an approved docs/content deployment, verify the actually served pages before declaring launch acceptance or posting externally. If needed, stage an approved docs correction first; do not announce while contradictions remain live.

## Website and documentation deliverables

1. **Release article, approximately 600–900 words.** Add a `ProductRelease` entry to `apps/web/lib/releases.ts`, using the same template as the earlier two releases. Keep report-evidence export, tool counts and host-specific implementation details out unless necessary to explain setup. Structure: what is new; why workspace access matters; how connection and scan retrieval work; Light versus Hosted OAuth; availability and limitations; setup CTA. Link to both earlier releases without suggesting OAuth changes the scanner or scoring.
2. **Homepage and release discovery.** The homepage already selects the latest three releases and has a three-column desktop grid. A new dated entry should display OAuth first, A/R second, and Light third. Check mobile stacking, title wrapping, card balance, `/releases`, article navigation, feed, sitemap, and static `llms.txt` links.
3. **Developer documentation.** Reconcile all public pages, explicitly including `/developers/quickstart`, from one production-verified eligibility rule. Update `/developers/mcp` as the canonical setup destination, particularly `#hosted-oauth-start`, with the exact `/mcp` endpoint, account and active-workspace requirements, scopes, supported client configuration, reconnect guidance for older read-only connections, and the scan/status/bundle workflow. Reconcile tool counts, obsolete staff-approval copy, and ambiguous consent language. Keep limits linked to canonical rendered documentation rather than duplicating numeric rate tables.
4. **Light comparison and cross-links.** Update the relevant comparison and migration copy on `/mcp/light` and developer entry pages. Preserve the historical Light announcement; use clearly dated update notes if old setup claims need correction. Hosted OAuth adds authorized workspace access; it does not mean authenticated scanning of login-protected target websites.
5. **Launch visual.** Produce a 1200×630 social card consistent with the earlier release: “Your workspace. Your agent. CertScore.ai.” Supporting line: “Hosted MCP with self-serve OAuth.” Prefer a real, redacted connection/report screenshot for an optional walkthrough. Label a canary as synthetic; never fabricate an agent result or display credentials.
6. **Launch kit.** Create `docs/gtm/mcp-hosted-oauth-launch-content.md` containing approved website copy, LinkedIn post, X post/thread, image alt text, channel URLs, and the completed pre-approval claim ledger. Record publication URLs and timestamps after publishing.

Use one canonical release URL for social traffic, with `utm_medium=organic_social`, `utm_campaign=mcp_hosted_oauth_launch`, and `utm_source=linkedin` or `x`. The article's primary CTA should open the Hosted OAuth setup section.

## Draft social direction

These drafts become publishable only when the corresponding availability claims are verified. URLs below are proposed, not currently confirmed live.

### LinkedIn draft

MCP Light made CertScore.ai accessible to agents without an account. Our latest release brings that workflow into your CertScore.ai workspace.

With Hosted MCP and self-serve OAuth, you can connect your agent, scan public websites, retrieve reports, and review workspace scan history through your authorized workspace connection.

That makes it easier to bring evidence-backed website privacy observations into launch reviews and ongoing review workflows. Results include findings, supporting evidence, report links, and coverage limitations.

MCP Light remains available for account-free public scans. Hosted OAuth requires a CertScore.ai account and an active workspace; existing usage limits apply.

These are automated observations for review, not legal advice or certification.

Read the release and connect your workspace:
https://certscore.ai/releases/mcp-hosted-oauth?utm_source=linkedin&utm_medium=organic_social&utm_campaign=mcp_hosted_oauth_launch

#MCP #PrivacyEngineering #DeveloperTools

### X standalone draft

Connect your agent to your CertScore.ai workspace with Hosted MCP OAuth.

Scan public websites, retrieve reports and access previous scans. Account required; limits apply.

Automated observations, not legal advice.

https://certscore.ai/releases/mcp-hosted-oauth?utm_source=x&utm_medium=organic_social&utm_campaign=mcp_hosted_oauth_launch

### Optional X follow-up thread

1. MCP Light remains the account-free option for public website scans. Hosted OAuth adds authorized workspace access for repeat review workflows.
2. Start or reuse a scan, check status while it is active, then retrieve the findings bundle. Keep evidence links and coverage limitations with the summary.
3. Reviewing an older read-only connection? Follow the reconnect guidance to authorize current access. Your MCP client may still request permission before running tools.
4. CertScore.ai reports automated public-web observations for review—not legal advice or certification. Setup and release details: [same campaign link].

Validate each final X post in the composer, including URL weighting, before publication. Keep export and tool counts out of the launch narrative. Do not use blanket compatibility, “authorize once,” “frictionless,” or “no staff approval” claims. Any named client must have dated acceptance evidence; precise access-grant wording remains conditional on verified policy.

## Execution and acceptance sequence

1. **Review this proposal.** GPT and Claude critique the same plan and claim ledger; the product owner resolves conflicting recommendations. This task prepares the plan only.
2. **Build the claim ledger and establish production truth.** Verify served web/MCP revisions, both deployed catalogs, canonical eligibility, actual authorization behavior, export availability and per-client acceptance records. Complete the ledger before approval; verify export separately and omit it from the launch narrative. Include only shipped capabilities. Treat unfinished runtime features as separate work rather than expanding the marketing release.
3. **Prepare the complete content patch and previews.** Implement the article, docs corrections, card, discovery links, and launch kit. Preserve unrelated working-tree changes. Review desktop/mobile layouts and the social image before publication.
4. **Verify content and behavior.** Update the release-order assertion in `apps/web/lib/releases.test.ts`; cover the new release's metadata, Article schema, feed/sitemap inclusion, and valid assets. Run relevant documentation checks and `pnpm preflight:fast` against the live base for deployment-bound changes. Verify setup links and no stale tool counts. For each named supported client, retain evidence of authenticated tool discovery and a successful scan/status/bundle workflow; a callback-success screen alone is insufficient. Reuse recent valid acceptance evidence where possible. Any new production scan or paid model test requires the applicable authorization and cost estimate first.
5. **Present the complete pre-deployment review package.** Present the corrected claim ledger, dated production acceptance evidence, reconciled public docs diff, final rendered article and social copy, image, and remaining exclusions. Identify each gate as passed or pending; no publication approval while required evidence is missing. The user requested a plan, so website deployment and external posting are later actions, not implied by this document.
6. **Publish website first.** Follow `docs/aws-ecs-deployment-runbook.md` and the repository-controlled targeted AWS web path, using a clean committed revision that contains the live revision. Preview with `pnpm deploy:web -- --base <live-sha> --plan`. A content release should not require scanner, worker, or database changes. Verify the serving revision, release page, homepage, docs, metadata, image, and feed after deployment. Recheck the served documentation against both verified catalogs and the canonical eligibility/authorization rule; contradictions block external announcement.
7. **Publish approved social copy after live checks.** Confirm the release link and preview, then publish to the authorized LinkedIn and X accounts. Do not submit directory listings or send messages to other people as part of this plan.
8. **Review adoption after launch.** Use existing analytics and MCP telemetry for release traffic, setup clicks where already recorded, successful connections, first successful scan/bundle workflows, and authorization failures. Report only metrics actually captured; do not infer social attribution where it is unavailable. Propose a manual next-day and seven-day review, with no automation created by this plan.

## Cost and scope

This plan adds no recurring infrastructure, scan execution, paid model calls, or retention: estimated incremental recurring cost **$0/month**. Static content uses existing hosting; incremental transfer is volume-dependent and should be estimated with final assets. Adoption can increase usage within existing owner-approved quotas. Do not raise quotas or add paid promotion, scheduled canaries, analytics services, or recurring jobs. New expected costs of $1/month or more require explicit owner approval under `AGENTS.md`; smaller increases must still be disclosed. The pagination note's prior $5/month envelope is specific to that feature, not a general launch budget.

## Copy-ready prompt for GPT and Claude

> Review this proposed release, conditionally targeted for September 14, 2026, of CertScore.ai Hosted MCP OAuth product release as a critical product/editorial reviewer. Treat the repository findings and historical notes as evidence with dates, not proof of current production readiness. The goal is a third release following MCP Light and Accept/Reject Path testing, with a website article, matching documentation, and LinkedIn/X copy. Identify unsupported claims, unclear positioning, contradictions, missing launch checks, and scope creep. In particular assess self-serve OAuth wording, active-workspace eligibility, client compatibility, conflicting tool counts, and reconciliation of MCP/quickstart eligibility and both deployed catalogs. Report-evidence export is a separate documentation acceptance check and is excluded from this announcement. Require the completed claim ledger and dated production authorization/discovery/scan/status/bundle evidence for every advertised client. Grok is not a blocker unless marketed as supported. Preserve the distinction between workspace authentication and scanning public target websites, and between observed risk signals and compliance conclusions. Return: (1) approve/revise recommendation, (2) must-fix items, (3) improved headline and short description, (4) edits to the channel drafts, and (5) a minimal publication checklist. Do not assume deployment, external posting, new costs, or product changes are authorized. If a fact cannot be verified from the supplied evidence, flag it rather than inventing it.
