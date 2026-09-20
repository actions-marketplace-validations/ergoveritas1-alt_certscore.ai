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
| Product visibility / state | Limited / Active |
| Offer state | Released |
| Submitted pricing model | Free |
| Saved dimension / rate | browser_scans / USD 0.00 |
| Legal terms | AWS StandardEula, version 2022-07-14 |
| Delivery | Website callback configured; request 8kzsthwv54nlalto15rmh7jp7 SUCCEEDED |
| Limited release | bs4lizgnfd49qkmbf7ku6o7wl — SUCCEEDED |
| Public release | Not requested |

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
the effective targeting contains only the seller. The product is now Limited.

Use the AWS Marketplace seller console's SaaS product list to find the exact
product ID above. Buyer listing: [CertScore.ai Website Scanner](https://aws.amazon.com/marketplace/pp/prodview-gtrsswq5vpqdc).
This is a Limited listing, not Public availability.

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

Configured fulfillment: `https://certscore.ai/api/marketplace/browser/register`.
Live onboarding: `https://certscore.ai/marketplace/browser`.
AWS accepted the delivery option after the first production deployment succeeded.
The final workspace-binding deployment succeeded. Limited subscription tests remain gates.

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

Draft registration itself introduced no runtime infrastructure, capacity, scan,
model call, or retention: estimated recurring increase $0/month. The subsequent
production integration has the $1–$5/month overhead described below.
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

- Thirty-three targeted tests passed, including shared MCP signature/product regressions,
  browser agreement identities/time, separate runtime flag, and free draft payload.
- The isolated PostgreSQL lifecycle test created 51 scan attempts against a 50-credit
  allowance; exactly 50 committed. It verified single-use claims and permits, foreign
  ownership rejection, API-key issuance isolation, concurrent-workspace isolation, cancellation races,
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

- Cross-tab browser regression: with two local fixture workspaces, changing the
  selection in tab B and submitting tab A's stale form produced an explicit
  selection-changed error; the database confirmed zero fixture scans. Scan forms
  carry their displayed workspace ID, and ordinary forms cannot implicitly spend
  Marketplace credits. The added binding test passed and affected preflight passed.

### Production rollout evidence — September 20, 2026

- Initial web deployment `35529525478` succeeded at revision `2d2b565a`. Its
  migration, contract checks, isolated PostgreSQL lifecycle suite and build passed.
- Follow-up deployment `35530028150` succeeded at `aa2b18d6`, including the tested
  stale-form workspace binding fix. Production `/api/version` confirmed that SHA.
- The separate `certscore-marketplace-browser` stack reached CREATE_COMPLETE.
  Its signed HTTPS notification subscription and `support@certscore.ai` alert
  subscription are confirmed. The exact-product EventBridge rule is enabled.
  Four alarms are OK; both encrypted 14-day recovery queues were empty.
- Production hub returned HTTP 200 and rendered the branded free offer, signed-in
  account, bounded allowance, support and disclaimer. Without a linked agreement,
  scan intake is disabled. Health returned OK. These are not buyer lifecycle tests.
- Website fulfillment request `8kzsthwv54nlalto15rmh7jp7` succeeded. AWS saved
  `https://certscore.ai/api/marketplace/browser/register` as SoftwareRegistration.
- All six current PR checks passed at `aa2b18d6`. The separate MCP Public request
  remained PREPARING; no new request or mutation targeted that listing.
- A bounded read-only production inspection confirmed zero browser workspaces,
  licenses and usage rows before onboarding. The two inspected existing customer
  plans/memberships and all three MCP license/key states matched the saved baseline.
- Production negative probes rejected an unsupported registration content type
  (415), an empty form registration token (400), and an unsigned lifecycle body
  (503). Registration GET redirected to the fixed hub (303). No grant was issued.
- The broad baseline preflight encountered four scanner policy-fixture budget
  failures under parallel load; all four passed when rerun serially, without
  evidence/policy/timeout changes. Both affected-change preflights passed. This
  does not resolve or conceal the separate pre-existing PR 189 GPC fixture failure.
- Limited release request `bs4lizgnfd49qkmbf7ku6o7wl` was submitted after the
  final deployment succeeded. The request targets only the browser product/offer.

- AWS reported Limited release SUCCEEDED, product Limited/Active and offer Released.
  The buyer procurement page shows exact product/offer identity, $0.00 per unit
  and $0.00 contract total; free subscriptions have no end date and can be cancelled.
  The page's “Public offer” label describes the offer type; Catalog product
  visibility remains **Limited**. Do not confuse the two.
- The owner subsequently confirmed the first $0 subscription. Real buyer evidence
  is recorded below; cancellation/re-subscription and Public gates remain separate.
- AWS's “Deployed on AWS” designation is not asserted. It requires AWS review of
  the entire architecture, including applicable third-party data processors, not
  just ECS/Lambda hosting. See the [official SaaS guidelines](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-guidelines.html).
  Continue using only repository-controlled AWS deployment workflows.

### Real Limited onboarding — September 20, 2026

- The owner approved the action-time EULA acceptance. The existing seller AWS
  account successfully subscribed at $0.00; no second AWS account was needed.
  Agreement: `agmt-9qpfb71l8jwnr3u95fifgghk7`; license:
  `l-f67816f4ed3647d99f0fd0a3e2af56ea`. DescribeAgreement confirmed the exact
  buyer, seller, browser product, offer and ACTIVE status, with no end date.
- AWS Set up your account performed the real registration-token exchange. The
  signed-in customer explicitly confirmed linking to separate workspace
  `3fcc7798-18f4-4948-a835-b1789f0cbe6d`. Pending activation denied scanning;
  a genuine lifecycle event at `2026-09-20T19:04:40Z` activated it. The actual
  welcome email arrived with hub, allowance, support and disclaimer instructions.
- The owned broad-baseline canary reused completed report
  `ca74f3ca-d344-4f34-b5b0-dd8e8b0a0214` and consumed zero credits. The report
  opened through the browser workspace and appeared in its history.
- Fresh owned-target scan `9f2b9aca-88cd-4e6b-8dd9-71fb97bb2ac0` of
  `https://ergoveritas.com/test2.html` completed. Its existing canonical report
  displayed one page, retained evidence and explicit inspection limitations.
  Customer usage changed from 0/50 to 1/50; admin confirmed the exact workspace,
  license and completed dispatch attribution. Ordinary workspace selection worked.
- One fresh test scan was executed so far: provisional cost estimate $0.10,
  inside the approved $5 one-time envelope; this is not a measured unit cost.
  No evidence/scanner configuration or retention was changed.
- Report testing found the generic scan-next form was visible inside the browser
  shell although its ordinary intake cannot spend Marketplace credits. Revision
  `5c115313` replaces it with a hub link and uses full navigation for refreshed
  subscription/usage/history. It passed affected preflight and all 10 existing
  scan-form tests. AWS deployment `35531480885` succeeded.
- With action-time owner confirmation, the real browser agreement was cancelled
  at `2026-09-20T19:26:43.939Z`; AWS DescribeAgreement returned `CANCELLED`.
  A submission from the stale, previously active browser form was rejected as
  inactive, with usage unchanged at 1/50 and 49 remaining. Reloading the existing
  completed report still allowed access. AWS's active subscriptions list retained
  MCP Light. The genuine lifecycle event at `2026-09-20T19:27:29Z` persisted
  `revoked`; read-only audit confirmed unchanged usage, ordinary memberships/plans,
  and all three MCP license/key states. Replacement subscription acceptance is
  prepared but not yet executed. No additional scan cost was incurred.
- This live test used an existing account with platform-admin privileges. It
  verifies browser onboarding and attributable usage, not an independent live
  non-admin cross-tenant security test. Ownership and alternate-intake denial
  have isolated database/unit coverage. No new-account credential flow was tested.
- Free agreements have no scheduled expiry. Expiry has automated coverage only.
  Real concurrent agreements and re-subscription remain unverified. Do not request
  Public before the remaining Limited gates and pilot-expansion decision.
- A subsequent read-only production audit confirmed `source=marketplace-browser`,
  one requested page, matching scan/usage workspace and owner, the expected
  agreement/license, one debited credit, a sent welcome timestamp, and no retained
  raw permit in scan config. Both inspected ordinary plans/memberships and all
  three MCP license/key states still matched the pre-release baseline.
- Reopening AWS Set up your account and explicitly linking again selected the
  same existing workspace and retained 1/50 usage with 49 credits remaining. This
  is repeat setup verification, not a substitute for cancellation/re-subscription.
- After ECS stability, the live fresh report showed the corrected scan-next link.
  Clicking it opened the Marketplace URL field with 49 remaining credits and both
  completed reports in history. No additional scan was created by this verification.
  All six PR checks passed for the deployed code revision.

## September 20 ordinary-login incident

A selected browser Marketplace workspace persisted in a 30-day cookie. The
global dashboard context honored it on ordinary app routes, and the app layout
redirected those routes back to the Marketplace hub. This affected browsers with
a selected Marketplace workspace, including the owner test session; it was not
evidence that authentication was down for every user. Clearing the selection
restored the owner's ordinary dashboard immediately. Marketplace release testing
was stopped.

Hotfix `b99910aa` removes the Marketplace selection from the current request and
expires that cookie on ordinary login and app entry. Authentication cookies and
pending registration claims are preserved. Direct report routes retain the
selected Marketplace workspace, and speculative prefetch does not clear the
browser selection. Five middleware tests cover these boundaries; the canonical
local preflight passed. No scanner, billing, database, subscription or allowance
changes are included. Estimated incremental recurring cost: $0/month.

AWS deployment `35532687653` succeeded and ECS stabilized at `b99910aa`. Live
HTTP probes confirmed stale-selection expiry on `/login`, `/app`, and
`/app/admin/scans`, with ordinary login destinations preserved. The signed-in
production browser test explicitly selected the cancelled Marketplace workspace,
then opened `/login`: it reached the ordinary `/app` dashboard instead of the
Marketplace hub. No new subscription or scan was created. Marketplace release
work remains stopped at the owner's request.
