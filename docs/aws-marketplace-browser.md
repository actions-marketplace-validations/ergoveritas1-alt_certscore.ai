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
- Browser onboarding, scan-quota enforcement, lifecycle cancellation,
  re-subscription, and fresh browser scan/report tests are **not yet implemented
  or verified for this new offer**. MCP Light's prior tests do not verify them.
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
