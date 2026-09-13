import assert from "node:assert/strict";
import test from "node:test";
import { fullSiteEvidenceExport } from "./full-site-evidence-export";
import { buildReportEvidencePage } from "./report-evidence-page";
import type { FullSiteReportResponse } from "../../server/scans/full-site-report";
const scanId = "9ba99a8c-b1ad-44c1-985f-92cef760ab40";
const pageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function fixture() {
  return {
    pages: { rows: Array.from({ length: 75 }, (_, i) => ({ id: `page${i}`, status: "completed" })), total: 75, offset: 0, limit: 50 },
    resources: { rows: Array.from({ length: 120 }, (_, i) => ({ key: `resource${i}`, evidence: "observed ".repeat(200) })), total: 120, offset: 0, limit: 50 },
    services: [{ key: "service", origins: [{ pageId }] }],
    collectionSurfaces: { pagesWithoutInventory: 2, limitedPages: 1, rows: [
      { id: "form", capturedAt: "2026-09-12T00:00:00Z", form: { formRef: "collection_form_0", fields: Array.from({ length: 70 }, (_, i) => ({ fieldRef: `field${i}`, controlKind: "checkbox", checkedState: "checked", evidenceRefs: [{ refId: `e${i}` }] })), fieldsTruncated: true, candidateFieldCount: 75, retainedFieldCount: 70 }, snapshot: { status: "available", url: `/api/scans/${scanId}/full-site?formPage=${pageId}&formRef=collection_form_0` } },
      { id: "withheld", form: { fields: [] }, snapshot: { status: "withheld" } },
      { id: "unavailable", form: { fields: [] }, snapshot: { status: "unavailable" } },
    ] },
  } as unknown as FullSiteReportResponse;
}
test("full-site export preserves all pages, resources, form fields and coverage through pagination", () => {
  const source = fixture();
  const fullSiteReport = fullSiteEvidenceExport(scanId, source);
  const entries: any[] = [];
  let cursor: string | undefined;
  do {
    const page = buildReportEvidencePage({ scanId, report: { fullSiteReport }, cursor });
    assert.ok(Buffer.byteLength(JSON.stringify(page)) < 20000);
    entries.push(...page.entries);
    cursor = page.pagination.nextCursor ?? undefined;
  } while (cursor);
  let reconstructed: any;
  for (const entry of entries) {
    if (!entry.path) { reconstructed = entry.value; continue; }
    const keys = entry.path.slice(1).split('/').map((key: string) => key.replace(/~1/g, '/').replace(/~0/g, '~'));
    let parent = reconstructed;
    for (const key of keys.slice(0, -1)) parent = parent[key];
    const key = keys.at(-1)!;
    Object.defineProperty(parent, key, { value: entry.stringPart > 0 ? parent[key] + entry.value : entry.value, writable: true, configurable: true, enumerable: true });
  }
  assert.deepEqual(reconstructed.fullSiteReport, JSON.parse(JSON.stringify(fullSiteReport)));
  assert.equal(reconstructed.fullSiteReport.pages.rows.length, 75);
  assert.equal(reconstructed.fullSiteReport.resources.rows.length, 120);
  assert.deepEqual(reconstructed.fullSiteReport.collectionSurfaces.rows[0].form, source.collectionSurfaces.rows[0]!.form);
  assert.equal(reconstructed.fullSiteReport.collectionSurfaces.pagesWithoutInventory, 2);
});
test("available snapshots use scoped downloads; withheld and unavailable states are unchanged", () => {
  const exported = fullSiteEvidenceExport(scanId, fixture());
  const rows = exported.collectionSurfaces.rows;
  assert.equal(rows[0]!.snapshot.status, "available");
  if (rows[0]!.snapshot.status === "available") assert.equal(rows[0]!.snapshot.url, `https://certscore.ai/api/v2/scans/${scanId}/report-evidence/form-snapshot?formPage=${pageId}&formRef=collection_form_0`);
  assert.deepEqual(rows[1]!.snapshot, { status: "withheld" });
  assert.deepEqual(rows[2]!.snapshot, { status: "unavailable" });
});
test("accidental table pagination and malformed image references fail closed", () => {
  const report = fixture();
  assert.throws(() => fullSiteEvidenceExport(scanId, { ...report, pages: { ...report.pages, rows: [] } }), /all retained/);
  assert.throws(() => fullSiteEvidenceExport(scanId, { ...report, resources: { ...report.resources, rows: [] } }), /all retained/);
  report.collectionSurfaces.rows[0]!.snapshot = { status: "available", url: "/bad" };
  assert.throws(() => fullSiteEvidenceExport(scanId, report), /Invalid retained/);
});
