import assert from "node:assert/strict";
import test from "node:test";
import { buildReportEvidencePage, ReportPageCursorError } from "./report-evidence-page";
import { SHADOW_REPORT } from "../../components/scans/report-lab/shadow-report-data";
import { reportEvidencePageSchema } from "@certscore/api-contracts";
const scanId = "9ba99a8c-b1ad-44c1-985f-92cef760ab40";

test("pages reconstruct all report fields without truncation, including oversized Unicode and escaped paths", () => {
  const fields = Array.from({ length: 90 }, (_, index) => ({
    fieldRef: `field_${index}`, label: `Field ${index}`, controlIndex: index,
    elementType: "input", inputType: "checkbox", controlKind: "checkbox",
    semanticCategory: "marketing_opt_in", required: false, disabled: false, readOnly: false,
    checkedState: index % 2 ? "checked" : "unchecked", autocompleteToken: "off",
    confidence: 0.95, directVsInferred: "direct",
    review: { category: "marketing_opt_in", preselectedMarketing: index % 2 === 1 },
    evidenceRefs: [{ refId: `retained_${index}`, kind: "field" }],
  }));
  const report = { ...SHADOW_REPORT,
    collectionTableRows: [{ id: "form_1", capturedAt: "2026-09-12T00:00:00Z", snapshot: { status: "unavailable", reason: "review_failed" }, form: {
      formRef: "form_1", title: "Newsletter", method: "post", pageUrl: "https://example.test/",
      fields, candidateFieldCount: 95, retainedFieldCount: 90, fieldsTruncated: true,
    } },
      { id: "form_2", form: { formRef: "form_2", fields: [] }, snapshot: { status: "available", url: `/api/scans/${scanId}/form-snapshot?formRef=form_2` } },
      { id: "form_3", form: { formRef: "form_3", fields: [] }, snapshot: { status: "withheld", reason: "review_withheld" } },
    ],
    inventory: Array.from({ length: 400 }, (_, i) => ({ name: `cookie${i}`, evidence: "retained observation".repeat(20) })),
    "a/b~c": "😀\n".repeat(6000), empty: [], unknown: null,
  };
  const entries: any[] = [];
  let cursor: string | undefined;
  let snapshot: string | undefined;
  do {
    const page = buildReportEvidencePage({ scanId, report, cursor });
    reportEvidencePageSchema.parse(page);
    assert.ok(Buffer.byteLength(JSON.stringify(page)) < 68000);
    assert.equal(page.coverage.exportTruncated, false);
    assert.equal(page.coverage.observationCompleteness, "see_report_coverage");
    if (snapshot) assert.equal(page.snapshot, snapshot);
    snapshot = page.snapshot;
    entries.push(...page.entries);
    cursor = page.pagination.nextCursor ?? undefined;
    assert.equal(page.pagination.complete, !cursor);
  } while (cursor);
  let output: any;
  for (const entry of entries) {
    const keys = entry.path.slice(1).split('/').map((k: string) => k.replace(/~1/g, '/').replace(/~0/g, '~'));
    if (!entry.path) { output = entry.value; continue; }
    let parent = output;
    for (const key of keys.slice(0, -1)) parent = parent[key];
    const key = keys.at(-1)!;
    parent[key] = entry.stringPart !== undefined && entry.stringPart > 0 ? parent[key] + entry.value : entry.value;
  }
  assert.deepEqual(output, JSON.parse(JSON.stringify(report)));
  assert.deepEqual(output.collectionTableRows, report.collectionTableRows);
  assert.deepEqual(output.collectionTableRows[0].form.fields, fields);
  assert.equal(output.collectionTableRows[0].form.fieldsTruncated, true);
  assert.equal(output.collectionTableRows[0].form.candidateFieldCount, 95);
});

test("snapshot binds scan, report content and schema; malformed and stale cursors fail closed", () => {
  const report = { rows: Array.from({ length: 100 }, (_, i) => ({ i, text: 'x'.repeat(1000) })) };
  const page = buildReportEvidencePage({ scanId, report });
  assert.ok(page.pagination.nextCursor);
  const cursor = page.pagination.nextCursor!;
  for (const bad of ['junk', cursor.replace(/\.\d+$/, '.999999'), cursor.replace(/\.\d+$/, '.-1')]) assert.throws(() => buildReportEvidencePage({ scanId, report, cursor: bad }), ReportPageCursorError);
  assert.throws(() => buildReportEvidencePage({ scanId, report: { ...report, changed: true }, cursor }), ReportPageCursorError);
  assert.throws(() => buildReportEvidencePage({ scanId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', report, cursor }), ReportPageCursorError);
  assert.equal(buildReportEvidencePage({ scanId, report: { a: 1, b: 2 } }).snapshot, buildReportEvidencePage({ scanId, report: { b: 2, a: 1 } }).snapshot);
});

test("multi-megabyte retained inventories complete within the existing ordinary-read allowance", () => {
  const rows = Array.from({length: 1920}, (_, i) => ({ id: i, fields: [{name: `field_${i}`, evidence: "retained".repeat(240)}] }));
  const report = { fullSiteReport: { collectionSurfaces: { rows } } };
  let cursor: string | undefined;
  let pageCount = 0;
  const returnedRows: unknown[] = [];
  do {
    const page = buildReportEvidencePage({scanId, report, cursor});
    assert.ok(Buffer.byteLength(JSON.stringify(page)) < 68000);
    for (const entry of page.entries) if (/^\/fullSiteReport\/collectionSurfaces\/rows\/\d+$/.test(entry.path)) returnedRows.push(entry.value);
    cursor = page.pagination.nextCursor ?? undefined;
    pageCount++;
    assert.ok(pageCount <= 120, "one large export must fit the existing 120-unit allowance");
  } while (cursor);
  assert.ok(pageCount > 30, "fixture exceeds the old 30-heavy-read ceiling");
  assert.deepEqual(returnedRows, rows);
});
