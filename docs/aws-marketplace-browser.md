# AWS Marketplace browser scanner

## Registration — September 20, 2026

The owner approved a separate browser offering, then explicitly changed the
initial price to free. AWS registration completed successfully:

| Setting | Verified value |
| --- | --- |
| Title | CertScore.ai Website Scanner - Free Browser-Based Privacy Scanning |
| Seller account | 199536052647 |
| Product ID | prod-35ca6yuplccjo |
| Product code | 1rlcf9he502qz0ix13gqfiaoc |
| Offer ID | offer-igm3spsgqmmea |
| Change request | ehphu2ry5kelq20h8bwfw14bq — SUCCEEDED |
| Product visibility / state | Draft / Draft |
| Offer state | Draft |
| Submitted pricing model | Free |
| Saved dimension / rate | browser_scans / USD 0.00 |
| Legal terms | AWS StandardEula, version 2022-07-14 |
| Delivery | Not yet configured |
| Limited or Public release | Not requested |

The submitted payload is
`infra/aws/marketplace-browser/create-draft.json`; the verified identity and
status snapshot is `infra/aws/marketplace-browser/registration.json`.
The request contains no ReleaseProduct, ReleaseOffer, or visibility-promotion
operation. All mutations reference newly created entities. Do not rerun it with
a different ClientRequestToken: that could create duplicate products. Continue
updates against the saved product and offer IDs.

The request targeted the seller account only. AWS's saved targeting additionally
contains five accounts that were also present in the existing MCP listing's
targeting. Record the returned list; do not remove AWS-added accounts or claim
the effective targeting contains only the seller. The product remains Draft.

Use the AWS Marketplace seller console's SaaS product list to find the exact
product ID above. No customer-facing listing URL is asserted at this stage.

## Offer and implementation contract

The intended customer flow is AWS subscription → CertScore sign-in/account
creation → explicit workspace linking → URL entry → scan → browser report.
No MCP client, API-key configuration, or buyer-deployed infrastructure is needed.

The free allowance is 50 single-page scans per UTC calendar month for the linked
subscription workspace. It does not change existing CertScore plans. Completed
result reuse consumes no credit; unused credits do not roll over; cancellation
and re-subscription must not reset current-month usage. Separate concurrent
agreements require isolated ownership and usage attribution. The underlying
allowance continuity must survive license replacement.

The `UsageBasedPricingTerm` is AWS's zero-dollar Free offer representation.
It does not authorize chargeable metering or imply unlimited scans. Access must
be verified against this product's actual free-offer lifecycle and agreement
terms. Do not use MCP Light product codes, ownership rows, API keys, or quota
rules. Do not treat this free usage-shaped offer as the superseded paid contract.

See [the revised design](aws-marketplace-browser-proposal.md) for security,
workspace selection, billing isolation, quota reservations, cancellation,
reporting, and release gates. Current membership storage allows one ordinary
workspace per user; supporting separate Marketplace workspaces needs an explicit
authorized selection path, not silently replacing the existing membership.

Planned fulfillment: `https://certscore.ai/api/marketplace/browser/register`.
Planned onboarding: `https://certscore.ai/marketplace/browser`.
Neither is registered as an operational delivery option yet. Implement and
verify fulfillment before adding it and requesting Limited release.

## Verification and limits

- AWS DescribeChangeSet reported SUCCEEDED with no change errors.
- Separate DescribeEntity calls confirmed Draft product/offer, new product code,
  the saved USD 0.00 rate, dimension, and StandardEula version.
- Two local registration regression tests passed: existing-product isolation,
  draft-only operations, idempotency token, free pricing, and bounded copy.
- MCP Light remains `prod-eagvxckgntmxc`, product code
  `a3p2vfccdufqnuhyn5r8lsx0q`, Limited. No mutation targeted it; its separate
  Public request was still PREPARING when inspected during registration.
- Browser onboarding, scan-quota enforcement, lifecycle cancellation and
  re-subscription now have implementation and local coverage (below). Real AWS
  buyer onboarding and fresh production scan/report tests are not yet verified.
  MCP Light's prior tests do not verify this new offer.
- Do not promote to Public before Limited integration testing. Do not describe
  registration or a Public request as a public launch.

No new runtime infrastructure, capacity, scan, model call, or retention was
introduced by draft registration: estimated recurring increase $0/month.
The approved future operating envelope remains up to $60/month for an initial
ten-customer cohort and up to $5 one-time testing. Free access provides no
subscription revenue; cohort expansion requires reassessing the actual cost.

## AWS references

- [Free SaaS pricing and website delivery](https://docs.aws.amazon.com/marketplace/latest/developerguide/work-with-saas-products.html)
- [Product creation and metadata](https://docs.aws.amazon.com/marketplace/latest/developerguide/work-with-seller-products.html)
- [Offer pricing and legal terms](https://docs.aws.amazon.com/marketplace/latest/developerguide/work-with-private-offers.html)
- [SaaS listing and testing process](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-create-product.html)

## Browser implementation and operations

Migration `0204_marketplace_browser.sql` adds dedicated ownership, licenses,
single-use hashed claims, short-lived scan permits, UTC-month counters and
scan-attribution records. It does not touch MCP tables or credentials. A user
keeps their existing ordinary membership. Selecting a separately owned browser
workspace sets an HttpOnly, SameSite=Lax cookie; every request rechecks ownership.
Marketplace workspaces cannot receive Stripe identifiers or lose their guard.
Concurrent active agreements have separate workspaces. A replacement subscription
reuses the oldest cancelled/expired slot and its current-month counter. All slots
for one AWS buyer have one CertScore owner; transfers require support review.
Existing slots are refreshed against AWS before another is allocated. Pending or
stale earlier activation blocks extra workspace allocation rather than granting
another allowance. The pilot permits ten workspace slots total, including
historical slots, not an unlimited sequence of ten active slots.

Each new scan verifies the exact AWS buyer, seller, agreement, browser product and
free offer. AWS failure grants no access. Signed product-specific lifecycle events
remain enabled when new onboarding/scanning is disabled. A revocation cannot be
resurrected by an older or later update for that license; a verification response
cannot overwrite a newer event. Expiry is checked at intake and in the database.

The existing `scans` row is the durable dispatch outbox. A database trigger consumes
one authenticated permit and one credit atomically with its insertion, and records
license, workspace, user/request and month attribution. No MCP/API client can obtain
a browser permit. Single-page manual scope is enforced even on alternate intake
paths. Duplicate request IDs cannot debit twice. A failed insertion rolls back the
credit. Existing scanner safety, cooldown, evidence and report projection remain
unchanged. Completed-result reuse consumes no credit and uses the existing authorized
reuse/report path; it appears in browser history through `scan_requests`.

`/app/admin/marketplace-browser` shows the latest 100 licenses and attributable
fresh scans. Support may cancel and return a credit only if the scan row still has
`pending_dispatch` and zero dispatch attempts. Recovery locks the same row as the
dispatch worker, marks it failed and records the admin/reason. Publishing, retried,
accepted, completed or ambiguous work must be investigated without this refund.
A limited-evidence or failed scan after dispatch still consumes its credit.

The customer hub is `/marketplace/browser`. It provides explicit linking, workspace
selection, subscription verification, usage, URL intake, report history, email setup
instructions and support. Claiming sends one welcome email through the existing
configured mail service; failure leaves access intact and exposes a retry action.
Delivery acknowledgement can be lost, so email is not claimed to be exactly-once.
Reports remain accessible after cancellation under existing access/retention rules;
new scans are refused. Ordinary workspace access remains available separately.

### Deployment and recovery

1. Use the canonical public-web ECS workflow with the committed forward revision.
   It applies migrations from the target image before promotion. Its
   `marketplace_browser` input preserves state by default; enable only this browser
   flag. It does not modify MCP Light settings. Lifecycle processing does not depend
   on this flag. No worker or scanner deployment is required for these web-only
   intake changes; the dispatch worker already consumes the durable scan outbox.
2. Deploy `infra/aws/marketplace-browser.yaml` in `us-east-1`, stack
   `certscore-marketplace-browser`, WebTaskRoleName `certscore-web-ecs-task`,
   AlertEmail `support@certscore.ai`. Confirm the alert email subscription. Verify
   the HTTPS subscription ARN is confirmed before testing a buyer agreement.
3. This stack matches only the new product/code. Its two encrypted queues retain
   failed events for 14 days. Four alarms cover EventBridge/SNS delivery failures
   and both backlogs. Cost envelope: $1–$5/month integration overhead, including
   roughly $0.40/month for four standard alarms, inside the approved $60/month pilot.
4. On backlog, fix delivery/IAM/endpoint faults first. Read the original event and
   verify product, buyer, agreement and event time. Replay the original event
   through the **browser** SNS topic; never fabricate a new lifecycle timestamp or
   edit entitlement rows to bypass verification. Process idempotently and confirm
   the intended license only changed before deleting the recovered queue message.
5. If AWS verification is unavailable, leave new scans blocked. Disabling the
   browser flag stops new setup/scans without disabling cancellation handling.
   Existing MCP flags, credentials and topics are independent.

### Verification evidence — implementation stage

- Twelve targeted tests passed, including shared MCP signature/product regressions,
  browser agreement identities/time, separate runtime flag, and free draft payload.
- The isolated PostgreSQL lifecycle test created 51 scan attempts against a 50-credit
  allowance; exactly 50 committed. It verified single-use claims and permits, foreign
  ownership rejection, concurrent-workspace isolation, cancellation races,
  re-subscription continuity, expiry, billing guards and safe pre-dispatch refunds.
- The migration applied successfully to local `certscore` through the canonical
  migration runner. Temporary UI fixture data and the temporary local enable flag
  were removed after verification.
- Local browser checks verified default-off, signed-in/unlinked, pending activation,
  explicit selection, check-subscription feedback and return to ordinary workspace.
  A 390px mobile viewport had no horizontal overflow. No real AWS subscription or
  scanner run was simulated as a successful end-to-end test.
- Real token exchange, account email delivery, fresh production scan/report,
  cancellation, replacement/concurrent agreements, and expiry remain release gates.
  The original MCP Public request remains PREPARING on the latest read.
