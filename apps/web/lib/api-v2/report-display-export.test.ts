import assert from "node:assert/strict";
import test from "node:test";
import { buildReportDisplayExport } from "./report-display-export";

test("exports report content without internal diagnostic payloads and retains complete form fields", () => {
  const fields = Array.from({ length: 20 }, (_, i) => ({ name: `field${i}`, label: `Field ${i}`, required: false }));
  const result = buildReportDisplayExport({
    internalFutureField: { secret: true }, runtimeEvidenceGraph: { nodes: [1] },
    findings: [{ title: "Review", evidenceJson: "large raw packet", canonicalEvidenceJson: "another packet", evidenceRefs: ["proof"] }],
    fullSiteReport: { collectionSurfaces: { rows: [{ form: { fields }, snapshot: { status: "unavailable" } }] } },
  });
  const json = JSON.stringify(result);
  assert.ok(!json.includes("large raw packet"));
  assert.ok(!json.includes("another packet"));
  assert.ok(!json.includes("internalFutureField"));
  assert.ok(json.includes('"evidenceRefs":["proof"]'));
  assert.deepEqual((result as any).fullSiteReport.collectionSurfaces.rows[0].form.fields, fields);
});

test("repeated display records resolve to the original complete record", () => {
  const row = { key: "resource1", description: "retained display evidence ".repeat(40) };
  const result: any = buildReportDisplayExport({ resourceInventory: { resources: [row], services: [{ resources: [row] }] } });
  const ref = result.resourceInventory.services[0].resources[0].reportContentRef;
  assert.equal(ref, "/resourceInventory/resources/0");
  assert.deepEqual(result.resourceInventory.resources[0], row);
});
