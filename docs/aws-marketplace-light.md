# AWS Marketplace Light

Owner approved up to $5/month incremental cost on September 19, 2026.
Expected $1–$5/month at low initial traffic using existing web/MCP ECS tasks and
PostgreSQL, an EventBridge rule, SNS topic and an idle encrypted SQS dead-letter
queue. No new compute capacity, paid metering, model calls, or scan allowance.
This is an estimate, not a billing cap; review actual volume before expanding.

## Listing values after deployment and buyer verification

- Free pricing; MCP server; API key; Redirect to your website; AgentCore disabled.
- Fulfillment: `https://certscore.ai/api/marketplace/light/register`
- MCP endpoint: `https://mcp.certscore.ai/mcp/marketplace/light`
- Setup/key management: `https://certscore.ai/marketplace/light`
- Title: `CertScore.ai MCP Light - Free Website Privacy Scanning`

The anonymous `/mcp/light` remains unchanged. Marketplace keys have their own
table and prefix and cannot authenticate to workspace APIs. Marketplace requests
are checked on each HTTP request, bound to their originating key/session, then
use the existing anonymous Light backend and shared allowance. Rotation or
revocation affects subsequent HTTP requests immediately. Already-running requests
can finish. Revocation does not remove independently public scan reports.

## Onboarding and lifecycle

The registration POST exchanges `x-amzn-marketplace-token` using ResolveCustomer
in the seller account. Require ProductCode, CustomerAWSAccountId, and LicenseArn.
Store an expiring random claim hash and set an HttpOnly Secure cookie, never a
credential in a URL. The buyer signs in and explicitly confirms the AWS account
to link it; an existing owner cannot be replaced by another CertScore account.

Each license is independent to support Concurrent Agreements. ResolveCustomer
does not activate access. A verified EventBridge License Updated event, wrapped
in signed SNS delivery from our exact topic, must arrive and DescribeAgreement
must confirm the buyer, active status, and time window. Deprovisioning revokes
that license and key. Old events cannot revive a deprovisioned license. One key
per license bounds storage; rotation replaces its hash and expires after 90 days.
No raw API keys, registration tokens, or event bodies are logged.

## Release

1. Run focused Marketplace tests, local isolated PostgreSQL lifecycle tests, web
   and MCP typechecks, then change-aware preflight. Commit and push the branch.
2. Use the canonical web workflow with `marketplace_light=enable`; it applies
   migration 0203 before promoting the web image. The endpoint fails closed
   before lifecycle infrastructure is ready. No Marketplace listing publication
   is performed by this release.
3. From seller account 199536052647, deploy `infra/aws/marketplace-light.yaml` in
   us-east-1 with the existing public web task-role name. This grants only the
   required AWS operations and routes license events to the signed HTTPS handler.
   Confirm the SNS subscription is confirmed. Inspect the DLQ for failed delivery.
4. Deploy the canonical MCP workflow with `marketplace_light=enable`.
5. Verify anonymous Light unchanged; missing/invalid Marketplace keys must return
   401. Complete a real free Marketplace subscription/registration, confirm key
   creation and the four-tool workflow, then rotation and cancellation before
   marking the integration ready to publish. A passing synthetic test is not
   evidence of AWS buyer fulfillment or listing approval.

Disable the feature with the same workflows and `marketplace_light=disable`.
Keep lifecycle delivery running for existing records. Never replace invalid
credentials with anonymous fallthrough. Monitor `marketplace_light.event_failed`
and the queue `certscore-marketplace-light-events-dlq`. Unexpected events or AWS
errors fail closed and return 503 for SNS retries.

## Buyer verification and Cloudflare edge configuration (September 20, 2026)

The product `prod-eagvxckgntmxc` successfully reached Limited visibility. A real
free subscription completed the AWS "Set up your account" handoff, account
linking, license activation, and API-key creation.

Python's default user agent initially received Cloudflare HTTP 403 / error 1010
(`browser_signature_banned`) before reaching MCP authentication. With owner
approval, deployed the Cloudflare configuration rule
`Marketplace MCP - allow non-browser clients`
(`1ffa18dd9fde463c8c40da072a6b7144`) with this exact expression:

```text
(http.host eq "mcp.certscore.ai" and http.request.uri.path eq "/mcp/marketplace/light")
```

The sole override is **Browser Integrity Check: off**. It does not disable
API-key validation, rate limits, other WAF protections, or TLS. It does not apply
to anonymous Light or other routes. The rule uses the existing Cloudflare Free
plan; estimated incremental recurring infrastructure cost is $0/month. Roll back
by disabling this single configuration rule in Cloudflare Rules > Overview.
See [Cloudflare's selective BIC configuration documentation](https://developers.cloudflare.com/waf/tools/browser-integrity-check/).

Verified against production with Python urllib's default user agent after the
rule became Active:

- Missing and invalid Marketplace keys return HTTP 401 instead of edge HTTP 403.
- MCP initialize and tools/list succeed with an active subscription key and
  expose exactly the four Light tools.
- All four tool calls succeed, reusing the completed example.com scan
  `20b7af55-e962-4f84-bfa5-eef90e7306d9`. Evidence pagination returned 84 then 20
  items, completing all 104 items. This verifies completed-result reuse and
  retrieval, not a fresh scan's pending-to-terminal lifecycle.
- After rotation, the original key returns HTTP 401; the replacement initializes
  a new session and lists all four tools.
- After revocation, the replacement returns HTTP 401. Temporary test keys were
  revoked and the local verifier stopped; no raw keys are retained in this doc.
- A control request to anonymous `/mcp/light` retains the previous Python
  browser-signature rejection, confirming the exception's route scope.

The free AWS subscription remains active. Real Marketplace cancellation and
deprovisioning have **not** been verified; keep Limited visibility until the
remaining release checks pass. This edge fix required no ECS deployment.

## Setup-page verification (September 20, 2026)

The setup page now uses the shared CertScore header and footer, an explicit
public-scan disclaimer, support contacts, a three-step access/connection/scan
guide, and prompts for follow-up review. The prompt builder runs only in the
browser; it neither starts scans nor stores entered URLs. It rejects credentials,
IP/local addresses, custom ports, and query/fragment tokens before building copy.
The scanner remains responsible for its canonical target/network safety checks.
Client examples contain placeholders only. API keys are masked by default and
rotation/revocation share one action state so a revoked secret is no longer
displayed. Key management and subscription enforcement are otherwise unchanged.
Estimated incremental recurring infrastructure cost: **$0/month**.

Validation: the web preflight passed, focused Marketplace tests passed (9 tests),
and the isolated PostgreSQL repository test passed for one-use claim ownership,
pending denial, independent licenses, rotation/revocation, late-event handling,
expiry, and hashed-only key storage. Browser checks verified prompt creation,
copy feedback, focus selection, and rejection of token-bearing URLs. An active
production key also initialized and listed the four tools through the official
MCP TypeScript SDK, independently of the Python HTTP verifier. These are protocol
checks, not a claim that two assistant applications were certified.

The owner has no second AWS account. A separate-buyer-account test is unverified;
local two-license isolation tests do not replace that end-to-end test. Real AWS
cancellation/re-subscription, fresh-scan lifecycle, and final production page
verification remain release checks until recorded as completed below.

## Copy-ready Marketplace usage instructions

Sign in or create a CertScore account after subscribing to this free offering.
Confirm the AWS account shown on the setup page and create your Marketplace
Light API key after activation completes.

Add a remote MCP server supporting Streamable HTTP:
`https://mcp.certscore.ai/mcp/marketplace/light`

Configure `Authorization: Bearer YOUR_API_KEY`. Store the key securely. Manage,
replace, or revoke keys at https://certscore.ai/marketplace/light. Keys expire
after 90 days. Replacing a key invalidates the previous key; initialize a new
MCP session with the replacement.

Tools: certscore_scan_site, certscore_get_scan_status, certscore_get_scan_bundle,
and certscore_get_report_evidence_page. Start or reuse a public website scan,
check progress at the returned interval while pending, then retrieve the result
bundle and paginated evidence. Stop polling terminal scans. Public results only;
private workspace history is not included.

The shared public Light allowance and scan/retrieval limits apply. This offering
does not add a per-buyer scan allowance. Honor Retry-After on 429 responses.
401 means the key is missing, invalid, expired, revoked, or its subscription is
inactive. 503 means a dependency is temporarily unavailable; retry later.

Documentation: https://certscore.ai/developers/mcp
Support: support@certscore.ai

Findings are automated observations, not legal advice or compliance certification.

Update all short/long descriptions and highlights that say "no account or API
key required" to "Free Marketplace Light access with a CertScore account and
API key." Public anonymous Light documentation does not need that change.
