# Browser offering Public submission readiness

Prepared September 20, 2026. The owner authorized moving toward Public visibility
provided ordinary CertScore.ai operation is preserved. The request payload is
`infra/aws/marketplace-browser/request-public.json`; submitted after the successful
production release as request `8dzi4whivsgpri2f3a35alroi` at
`2026-09-20T20:12:18Z`. Seller portal status: **Under review**; Catalog status: **PREPARING**, no reported errors. Product
visibility is still **Limited**; Public approval has not been granted.

## Concrete configuration

- Product: `prod-35ca6yuplccjo`, code `1rlcf9he502qz0ix13gqfiaoc`.
- Offer: `offer-igm3spsgqmmea`; Free, USD 0.00; 50 single-page scans per
  workspace per UTC calendar month, without rollover or paid conversion.
- Website fulfillment: `https://certscore.ai/api/marketplace/browser/register`.
- Setup: `https://certscore.ai/marketplace/browser`.
- Standard EULA version 2022-07-14; support `support@certscore.ai`.
- The payload changes only this product's visibility. It changes no pricing,
  fulfillment settings, IAM permissions, deployments, or MCP Light entities.
- AWS manually reviews the request. Submission is not Public approval.

## Approved capacity change

The initial deployment's `BROWSER_PILOT_LIMIT=10` counted all browser workspaces,
including historical workspaces. At the limit, a new subscribed buyer cannot
complete linking and is told that the pilot is full. The listing offers 50 scans
to subscribers without disclosing a ten-workspace global enrollment cap. A
Public visibility request can result in publication after AWS review; it is not
a harmless preview that guarantees another seller approval before publication.
Do not knowingly expose that fulfillment failure to general enrollment.

On September 20, the owner explicitly approved the following change and its variable operating cost: remove only this global
pilot enrollment cap for Public launch. Preserve the per-workspace 50-credit
ledger, owner checks, concurrent-agreement isolation, rate limits, cancellation,
and ordinary-login fix. This requires a small Marketplace-only implementation
change, focused tests and the canonical AWS web deployment; it is not a scanner,
finding, login, Stripe-plan or ordinary-quota change.

Planning estimate using the previously disclosed conservative $0.10 per fresh
scan assumption: up to approximately $5 of scan processing per fully utilized
workspace per month, plus $1–$5/month integration overhead. At 100 workspaces,
approximately $501–$505/month; at 1,000, approximately $5,001–$5,005/month.
These are planning estimates, not measured unit costs or a fixed bill ceiling;
actual compute/model/storage costs and utilization vary. The new approval supersedes the $60/month ten-workspace operating envelope for
Public enrollment; it is not a fixed $505/month spending ceiling. The per-workspace
50-scan limit remains unchanged.

The lower-cost alternative is retaining Limited visibility and the ten-workspace
pilot under the existing $60/month envelope. A larger hidden enrollment cap would
only move the same post-subscription failure to a later customer.

AGENTS.md requires explicit approval for implementation/deployment expected to
increase monthly costs by at least $1. Public enrollment beyond the pilot crosses
that threshold; the explicit owner approval above satisfies this requirement.
Implementation removes only the global enrollment guard and its stale admin label.
A database regression links eleven additional buyers while retaining the existing
50-credit limit, ownership, cancellation and re-subscription tests.

## Verification and limitations

Real subscription, registration-token exchange, explicit owner linking, signed
activation, setup email, reused and fresh reports, usage attribution and
cancellation enforcement passed. The test subscription is cancelled. Reopening
setup preserved the workspace and ledger, but this is not re-subscription proof.
Re-subscription, concurrent agreements and independent non-admin onboarding still
need live coverage; expiry and isolation have automated coverage. Do not attest
that those live cases passed. No second buyer AWS account is available.

The ordinary-login regression was fixed in production at `b99910aa`, with a
successful AWS deployment and real signed-in stale-selection regression test.
Read-only public-route probes still pass at preparation time. Preserve that fix
and rerun the affected regression gates before any deployment.

## Official references

- [AWS visibility update API](https://docs.aws.amazon.com/marketplace/latest/developerguide/work-with-seller-products.html)
- [AWS SaaS product lifecycle](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-product-lifecycle.html)
- [AWS SaaS usage and onboarding guidelines](https://docs.aws.amazon.com/marketplace/latest/userguide/saas-guidelines.html)

The capacity blocker above is an engineering assessment of the actual code and
listing, not a claim that AWS has already rejected this product.

## Deployed and submitted evidence

- Web revision `7903a5ee`; AWS deployment `35534121184` succeeded. ECS has two
  running tasks, two desired, and a single COMPLETED deployment.
- Seventeen focused security/routing/payload tests passed, plus the isolated
  PostgreSQL lifecycle suite with eleven additional buyer links and atomic
  50-credit enforcement. Canonical local preflight and deployment checks passed.
- Live stale-cookie probes passed for login, dashboard entry and admin entry.
  The signed-in browser opened the ordinary dashboard from `/login`; the admin
  page showed the corrected 50-scan copy and the revoked test subscription at
  1/50 usage. No new production scan or subscription was created.
- Four browser alarms were OK, both recovery queues empty, signed HTTPS delivery
  confirmed. MCP Light readiness checks passed before and after submission.
- The Public request contains exactly one UpdateVisibility operation for the
  browser product. MCP Light, its request, pricing and subscription records were
  not mutated. The previously documented live-testing limitations remain; this
  submission does not convert automated coverage into real-buyer evidence.

[Public review request](https://aws.amazon.com/marketplace/management/requests/8dzi4whivsgpri2f3a35alroi)
