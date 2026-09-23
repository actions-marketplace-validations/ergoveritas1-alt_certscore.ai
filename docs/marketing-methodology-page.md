# Methodology page: feature tour and free scan

The public `/methodology` page uses the existing `DomainScanForm` full-scan flow, with a prominent free-scan prompt. No API, authentication, workspace, Marketplace, scan allowance, scanner, evidence, finding, or scoring behavior changes.

## Feature coverage

The page describes CMP detection; first-layer consent controls; available after-Accept and after-Reject observations; cookies and storage; services and network requests; GPC observations and comparisons; TLS and transport; forms and fields; hidden outbound links; policies and disclosures; embeds, session replay, and fingerprinting signals; and timing/geographic context. Separate links explain report sharing, exports, plan-dependent full-site scanning/monitoring, and integrations.

The screenshot carousel is manually controlled, with named feature selectors, previous/next controls, live description updates, and a native modal supporting Escape dismissal and focus restoration. There is no automatic rotation. Mobile selectors scroll horizontally; the screenshots appear before the explanation on narrow screens.

## Screenshot provenance

Captured from the public production reports on September 23, 2026. All scanned targets are owned `ergoveritas.com` test pages. These are real retained results, not fabricated findings or promises about a visitor's website.

- Overview, consent, inventory, GPC, transport: https://certscore.ai/scan/f4362840-376e-4d8c-897a-34a220136ad4 (September 3 retained scan, `https://ergoveritas.com/sample_09_03_26_01.html`).
- Forms: https://certscore.ai/scan/63b87ff5-07c5-4c7b-895a-028ea6bb43c9#report-forms (September 21 retained scan, `https://ergoveritas.com/form-inventory-01/`).

Source captures are in `apps/web/public/methodology/`. The feature component uses SVG view boxes and clip paths to frame relevant portions without changing screenshot content. Vendor names/destinations remain as reported; no unrelated customer website is used. Captions identify the owned sample and its scope. Historical limited observations remain visible and are not upgraded.

## Cost

No new service, capacity, background job, model call, or per-scan cost. Six static PNGs total less than 0.5 MB. Estimated incremental image delivery is below $0.10 per 1,000 visits that view every capture, before caching/free allowances; storage is negligible. Traffic volume determines actual transfer cost. Existing scan allowances remain enforced by the existing endpoint.

## Verification

- Web TypeScript check: passed.
- Existing `domain-scan-form.test.ts`: 10 tests passed, including anonymous report routing, submission recovery, and scan-option restrictions.
- Browser checks: all seven feature selectors, previous/next wraparound, screenshot enlargement, Escape dismissal, invalid URL disabled state, valid URL enabled state, and return-to-scan links.
- Responsive review at desktop and 390px mobile; no document horizontal overflow. The feature selector rail intentionally scrolls on mobile.
- No new scan was dispatched for these marketing checks. End-to-end scan execution was not re-tested.
- Production release status must be verified from `/api/version` and the AWS web deployment workflow.
