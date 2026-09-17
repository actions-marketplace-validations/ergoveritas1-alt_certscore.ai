# CMS security MVP

## Scope

Passive detection of Joomla, Drupal, Magento / Adobe Commerce, PrestaShop,
TYPO3 and OpenCart, alongside WordPress detection and lifecycle review. Shopify, Wix and
Squarespace stay informational. There are no endpoint probes, exploit tests,
live CVE feeds, model calls, additional browser sessions or score deductions.

The existing runtime DOM metadata read retains up to eight generator declarations
and six same-origin CMS-specific asset URLs (512 characters each, no queries or
fragments). Assets identify a product only; plugin/theme versions and cache-busting
query parameters never become CMS core versions. Detection coverage is the starting
page, including in a site-wide report. Historical scans are not backfilled or
silently reinterpreted; a fresh scan supplies new evidence.

## Canonical path

Verified runtime metadata artifact → `projectCmsSecurity` → persisted
`cmsSecurity` projection → normalized CMS security concern → concern policy →
unified finding → executive summary, Top priorities and collapsed Detailed evidence.
The original bundle hash, document token, capture time and snapshot artifact ID
are retained. Missing verification, invalid timestamps, wrong-document metadata or
malformed references fail closed. Report code does not create findings.

Versions are **declared**, never confirmed runtime versions. Asset-only product
identification is **inferred**, with no version. Conflicting products/versions,
partial versions, prerelease and unrecognized vendor suffixes cannot match.
Magento `-pN` patches and OpenCart / legacy PrestaShop four-part releases are compared
numerically. Match confidence describes the retained declaration, not exploitability.

## Reproducible references

Within each scan/document:

- `site_integrity:dom:<n>` resolves to the generator string, page URL and DOM artifact ID.
- `site_integrity:asset:<n>` resolves to the path, sanitized same-origin asset URL and DOM artifact ID.
- `site_integrity:cms:<n>` resolves to the product, exact observed version strings,
  confidence, declaration/inference basis and source-signal references.
- `site_integrity:vuln:<n>` / `site_integrity:lifecycle:<n>` resolve to the matched
  declaration, exact affected range, match result, versioned source record and
  authoritative advisory/lifecycle URL.

`resolveCmsEvidence` resolves these references from the persisted projection.
No header reference or confirmed-runtime proof is manufactured: this MVP does not
retain CMS HTTP headers. The report's JSON evidence carries the full projection;
Detailed evidence links the version and source records directly.

## Catalogue maintenance and limitations

`packages/certscore-contracts/src/cms-security-catalog.ts` is the reviewed, offline
catalogue (reviewed September 17, 2026). It contains selected core advisories for all
six requested families, not comprehensive vulnerability coverage. Each record has
product scope, publication/effective date, exact ranges, source URL, severity,
fixed releases where documented, and prerequisite/backport qualifications.
A matched vulnerable release is outdated against that documented security fix,
not necessarily against today's latest release. No match is not a clean bill of health.

Catalogue v2 adds the documented end of WordPress 4.1–4.6 security updates,
effective July 2025, matching exact declared versions from 4.1.0 up to (excluding)
4.7.0. WordPress 4.5.33 produces an unsupported-branch review, not an inferred CVE.
The rule uses the [WordPress security announcement](https://wordpress.org/news/2025/06/dropping-security-updates-for-wordpress-versions-4-1-through-4-6/).
Persisted v1 assessments continue to validate against the unchanged v1 rules.

Lifecycle notices cover only documented branches. Paid/third-party extended support
is explicitly unverified. OpenCart has no authoritative EOL record in this catalogue;
its support status remains unknown. Magento asset evidence cannot identify the
commercial edition; edition-specific claims require an Adobe Commerce declaration.
PrestaShop 1.7 expiry follows the vendor's maintenance announcement and the June 10,
2025 [PrestaShop 9 release](https://build.prestashop-project.org/news/2025/prestashop-9-0-available/).

Catalogue revisions require reviewed primary sources and tests at affected/fixed
boundaries. Preserve this catalogue version for historical projections; introduce
a new version and explicit compatibility handling rather than changing old records
in place. The schema recomputes the deterministic assessment to reject altered
advisories, ranges or references and tolerates JSONB object-key reordering.

## Verification and cost

Focused tests cover the capture bound and navigation drift; all CMS families;
fixed boundaries; numeric patch comparisons; unsupported lifecycle branches;
partial/conflicting/SaaS/asset-only neutrality; provenance; reference resolution;
tampering and JSONB ordering; policy → unified findings → single/site priorities.
The development-only `/dev-fixtures/cms-security` route uses synthetic evidence
through the production pipeline and components, without modifying customer scans.

Incremental cost estimate: below $1/month at 100,000 scans/month and 30-day retention,
from bounded metadata and assessment storage. No additional scan/network/model calls
or provisioned capacity. No deployment performed.
