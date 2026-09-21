# CertScore.ai Website Scanner — AWS Marketplace proposal

Status: implementation and cost envelope approved September 20, 2026. The owner then directed that the initial offering be free and explicitly authorized AWS registration. Draft registration request: `ehphu2ry5kelq20h8bwfw14bq`. No infrastructure, buyer subscription, entitlement, or production allowance has been created by registration.

## Recommended initial offer

**CertScore.ai Website Scanner — Free Browser-Based Privacy Scanning**, a separate free SaaS product for developers, small agencies, and website owners who want to subscribe through AWS and scan through a browser.

- Free pricing ($0.00), not a paid plan or time-limited trial. No overage charges, automatic paid conversion, or annual commitment.
- 50 single-page scan credits per calendar month (UTC). One submitted public URL is one page; linked policy evidence retrieval is part of that scan. This is explicitly not 50 full-site crawls. No automatic monitoring in this offering.
- One account-owned workspace per agreement, with the existing report/evidence workflow, scan history subject to existing retention, and email support. No additional API or MCP entitlement.
- Existing target safety checks, cooldowns, regional choices, and evidence coverage restrictions remain authoritative. No guaranteed discovery of every issue, legal advice, certification, or compliance determination.
- A fresh dispatched page scan consumes one credit. Validation rejection, quota rejection, and completed-result reuse consume none. Reserve atomically before dispatch; return a reservation on verified pre-dispatch failure. A completed scan with limited evidence still consumes a credit. Reconcile ambiguous dispatch before refunding to avoid free duplicate work.
- Credits expire at the end of each UTC calendar month; no rollover. Do not reset on login, claim replay, event replay, same-period account relinking, cancellation, or re-subscription. Persist the usage continuity key independently of a replaceable license ARN while retaining agreement-specific attribution and cancellation.

The single-page scope deliberately makes the scan unit unambiguous. Existing non-Marketplace Starter allowances and behavior are not changed by this proposal.

## Evidence from the current system

- Production `/api/version` reported ECS/Fargate revision `a00c1493ff7001cead063003e6376f79713d6c1f` on `codex/aws-marketplace-light`. Local HEAD was `36e69892000f8f0b046eceda4d9dd86f1d02fa42`, containing that live revision.
- PR 189 is OPEN, not merged. Web/worker contract checks passed; `production-finding-calibration` failed on the GPC responsive concern-policy fixture (178/179 passed). Do not treat the baseline as wholly green or change scoring to make Marketplace tests pass.
- AWS Catalog confirms MCP Light `prod-eagvxckgntmxc` / `a3p2vfccdufqnuhyn5r8lsx0q` is Active and Limited. Public request `9bftg98xyev4v5b10u7454jov` was PREPARING. These are read-only observations, not publication claims.
- Live homepage renders the URL scanner, sample report, disclaimer, and sign-in links. Unauthenticated `/app` redirects to `/login?next=%2Fapp`, with Google and email sign-in and account creation. Authenticated dashboard behavior has not been exercised in this inspection.
- `packages/shared/src/constants/plans.ts`: Trial 10 page scans/7 days; Starter $40/month and 50; Pro $200/month and 500; Custom negotiated volume. Starter's configured maximum pages per scan is five. These marketing/configuration facts do not prove page-accurate accounting.
- `server/auth-flows/provision-self-serve-user.ts` provisions a workspace through the existing bootstrap/membership path. `server/billing/checkout.ts` uses organization-scoped Stripe subscriptions and a purchasing feature gate.
- `server/scans/create-full-scan.ts` currently uses a calendar-month usage window, reads usage and then writes `currentUsage + 1`, and allows plan/domain overrides. This is insufficient for concurrent agreement-bound credit reservations. Its existing reuse and dispatch behavior needs focused boundary tests before adding the new allowance.
- Reports have both organization-scoped and public read paths. Do not advertise confidential/private reports until route, sharing, reuse, and artifact permissions are explicitly verified.
- MCP lifecycle code has useful token validation, signed delivery, claims, ownership, and agreement checks, but its global config defaults to the MCP product and its access path does not implement contract `GetEntitlements`. Do not call that config/repository as the browser product's entitlement authority.

## AWS requirements and product configuration

Use a new SaaS product with website registration fulfillment and explicit `PricingModel: Free`. The draft uses a zero-dollar `UsageBasedPricingTerm`, dimension `browser_scans`, display name `Free browser scans`, unit `Units`, type `ExternallyMetered`. This is AWS's free-offer representation, not authorization to charge usage or increase allowances. The 50-scan limit is enforced by CertScore, not inferred from the zero-price dimension. The new product ID/code must come from AWS; MCP identifiers are prohibited. Planned fulfillment URL: `https://certscore.ai/api/marketplace/browser/register`; onboarding: `https://certscore.ai/marketplace/browser`. Do not submit a fulfillment URL that does not work: add delivery after deployment and verification.

AWS explicitly supports free SaaS with a zero-dollar usage or configurable upfront pricing term. This offer uses usage-shaped free pricing to avoid a paid contract journey. [Free SaaS configuration](https://docs.aws.amazon.com/marketplace/latest/developerguide/work-with-saas-products.html).

New SaaS products must support Concurrent Agreements from June 1, 2026. Key grants by product and LicenseArn/agreement, never buyer AWS account alone. ResolveCustomer alone never grants access. Verify the new product's actual free agreement terms and current lifecycle state before granting browser access; do not import MCP Light entitlement rules. GetEntitlements was required by the superseded paid-contract design and must not be assumed authoritative for this free usage-shaped offer. [Integration requirements](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-integrate-contract.html).

Fulfillment must offer existing-account sign-in, email account setup, account-created notification/next steps, subscription and usage visibility, and support. The Marketplace journey must not collect card details or direct buyers to off-Marketplace upsells/trials. Use CertScore branding with a Marketplace-specific navigation/footer where necessary. Architecture disclosure must include actual third-party data processing; AWS hosting alone does not establish eligibility for the “deployed on AWS” designation. [SaaS guidelines](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-guidelines.html).

AWS recommends subscribing to the seller's own listing for testing. Attempt the allowlisted seller account first; do not assume a second account is necessary or claim free browser fulfillment verified in advance. This offer stays free during and after Limited testing. Verify the actual free-offer cancellation behavior; do not import paid contract cancellation assumptions. Public review follows successful integration testing. [Creation and testing](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-create-product.html).

## Account, workspace, and billing behavior

1. Exchange the registration token server-side; bind a short-lived one-use claim to the new product and set a separate secure HttpOnly claim cookie. Never log tokens or put credentials in links.
2. Sign in or create an account using existing auth; preserve the claim through either path. Show the masked AWS account, agreement, free allowance, any expiry, signed-in email, and destination workspace before explicit linking. Require the appropriate workspace ownership/admin role.
3. A new customer uses their provisioned workspace. An existing customer may link an eligible unbilled workspace. For a workspace with an active Stripe or manually contracted paid plan, offer a separate Marketplace workspace or a support-assisted migration. Never cancel Stripe, replace the paid plan, or pool allowances silently.
4. Every concurrent agreement remains independent and maps to a distinct workspace for this initial release. Provisioning a second workspace requires verifying current membership selection behavior; no invisible reassignment of the user's existing workspace. A repeated claim for an already-linked license returns its existing destination.
5. Activation requires verified current free-offer agreement and lifecycle state. Pending or unavailable verification shows a useful pending state and support action, with new Marketplace scans blocked. Lifecycle refresh must be idempotent and resist stale/out-of-order updates and deprovision resurrection.
6. Expiry or effective cancellation blocks new Marketplace-funded dispatch. Already dispatched scans finish and existing report access follows current retention/access rules. Re-subscription creates or verifies its own agreement without reviving an old revoked grant or resetting another agreement's credits.
7. Resolve the funding source server-side on every browser scan entry point, including rescan and direct actions. Prevent API, scheduler, full-site, plan override, and alternate-route bypass. Do not silently fall back to a different paid allowance when Marketplace credits are exhausted.

## Implementation boundaries

- Separate browser config with required new product identity and default-off flag; reject MCP IDs/codes. Separate claim cookie, routes, grant/claim/usage tables, event topic, rule, DLQs, and alarms. Reuse pure signature/validation utilities only after isolation tests.
- Add a grant-scoped, transactionally locked credit ledger with unique request/reservation IDs and UTC calendar-month boundaries and a stable usage-continuity identity. Bind reservation and scan identity; use the durable scan outbox as the reservation/dispatch boundary and retain refunds with a documented recovery path.
- Reuse existing ECS, PostgreSQL, scanner dispatch, and report projection. No new scanner lane, model call per scan, timeout, reserved capacity, retention extension, or finding logic.
- Customer page: activation status, next renewal/expiry, credits used/reserved/remaining, URL entry, scan progress, report/history actions, AWS subscription management, support and refunds contact.
- Admin page: product/license/agreement, owner/workspace, verification freshness, lifecycle state, usage attribution, scan IDs, and failure/recovery status. Never display raw registration credentials.
- Billing guards must block Stripe checkout for the Marketplace-funded workspace and prevent Stripe webhook updates from replacing its entitlement source.
- Migration and web deployment follow repository AWS workflows and the forward-only live-revision guard. Preserve MCP lifecycle delivery, credentials, listing, and Public review throughout.

## Listing and onboarding copy draft

**Short description:** Scan public website URLs in your browser and review evidence-backed privacy risk signals. Free access includes 50 single-page scans per month, report history, and email support. Subscribe through AWS Marketplace and sign in at CertScore.ai.

**Highlights:**
- Enter a public URL and review cookies, trackers, consent behavior, policy disclosures, and other available website risk signals.
- Inspect retained evidence, coverage limitations, and reports through the CertScore.ai website.
- Get a bounded free monthly allowance through AWS Marketplace with visible usage and subscription status.

**First-use page:** “Your website review starts here.” Steps: Confirm your account and workspace → Enter a website URL → Run a scan and review the report. Pending state: “We’re verifying your AWS subscription. You can finish account setup now; scanning becomes available once verification succeeds.” Show retry guidance and support rather than a fabricated activation ETA.

**Disclaimer:** “CertScore.ai provides automated observations about public website behavior. Results may be incomplete or incorrect and require human review. They are not legal advice, certification, or proof of compliance.”

**Support:** `support@certscore.ai`, with subscription/setup, scan/report, and refund-request guidance. Use existing published support commitments; promise no new response-time SLA.

Prepare a current logo, actual onboarding/scan/report screenshots, public methodology/support links, and the selected EULA before submission. Do not reuse MCP connection media or fabricate completed reports. The owner approved AWS Standard Contract. The draft uses AWS StandardEula version 2022-07-14. No buyer contract is accepted by registering a draft offer.

## Approved cost envelope and free-pricing amendment

Draft registration and preparation change no infrastructure or allowances: $0/month recurring increase. Read-only diagnostics add negligible request traffic, estimated below $0.01 total.

For an initial ten-customer cohort, budget **up to $60/month incremental operating spend**, excluding any applicable taxes: $1–$5/month for isolated events, queues, alarms, logs and modest metadata/storage on existing services, plus a conservative planning allowance of $0.10 per fresh single-page scan × 500 scans = $50/month, with $5 contingency. The $0.10 is a provisional envelope, not a measured production unit cost; verify compute, model, evidence storage, and transfer against actual cohort usage before expansion. No capacity increase is included. A budget alarm is not a hard spending cap; reapproval is required before expanding this cohort or capacity.

The original $60/month operating envelope and up to $5 one-time test budget were approved before the owner changed pricing to free. Free access generates no subscription revenue to offset scanner costs. At $0.00 there is no positive software charge on which to calculate the percentage Marketplace fee. No paid test purchase is planned; the one-time test allowance remains for bounded owned-target scans. No paid advertising, capacity increase, or additional model service is authorized. Keep the initial rollout at ten customers maximum until measured costs and expansion are approved.

Lower-cost alternative: keep the same offer but cap the initial cohort at one customer, with an estimated $1–$5 integration overhead plus up to $5 scan spend/month ; defer expansion pending measured usage. Staying at local preparation costs $0 recurring but cannot verify real AWS fulfillment.

## Verification and release gates

1. Resolve or accurately disposition the pre-existing calibration failure without changing evidence policy for this integration. Recheck current PR/live state before branching and deployment.
2. Deterministic tests: wrong product, forged/replayed tokens/events, owner conflict, workspace permissions, wrong free-offer terms, quota exhaustion, clock boundaries, duplicate renewal, concurrent agreements, cancellation races, expiry, and re-subscription.
3. Isolated PostgreSQL tests: 51 simultaneous requests cannot spend more than 50 credits; duplicate dispatch/claim/event recovery; pre-dispatch refunds; ambiguous dispatch; funding isolation; existing billing and MCP regression checks.
4. Browser verification: new/existing accounts, pending activation, explicit workspace linking, bounded URL scan → progress → canonical report, usage/status, exhaustion, sign-out/in, and accessible mobile layout. Validate account-created notification and error/support paths.
5. Prepare actual media, EULA choice, final pricing/dimension settings, distinct AWS identity, least-privilege IAM, signed events, recovery procedures, and alarms. Run relevant typechecks and preflight against the live revision.
6. Deploy default-off web/migration and isolated lifecycle infrastructure after cost approval; enable only the correctly identified product. Release the prepared draft to Limited with unchanged $0.00 pricing after fulfillment is operational. Verify same-account eligibility rather than assuming it.
7. Real tests: registration POST, entitlement activation, new scan/report, attributable usage, second concurrent agreement, effective cancellation via AWS, re-subscription, and MCP non-regression. Mock cancellation is not AWS cancellation evidence. Real expiry may remain unverified until a short test agreement actually ends; report that explicitly.
8. Before Public request, retain a release evidence matrix and review final price, EULA, listing, support, media and remaining limitations. Request Public only after the agreed Limited gate passes. Report Public only when AWS Catalog confirms it.

## Recorded owner decisions

- September 20, 2026: owner approved implementation, the $60/month ten-customer operating envelope, up to $5 one-time testing, and AWS Standard Contract.
- Subsequent owner direction supersedes all paid pricing: make the browser SaaS offering **free**. Keep the proposed 50 single-page scans/month; no silent change to existing product quotas.
- Owner explicitly requested beginning AWS Marketplace registration. Draft creation is authorized; Limited release still requires working fulfillment and real tests precede any Public request.
- The registration payload is `infra/aws/marketplace-browser/create-draft.json`. It creates new entities only, excludes ReleaseProduct/ReleaseOffer/Public requests, and initially targets seller account 199536052647.
