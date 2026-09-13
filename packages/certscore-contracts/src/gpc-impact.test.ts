import assert from "node:assert/strict";
import test from "node:test";
import { gpcImpactCaptureSchema, gpcImpactAssessmentSchema } from "./gpc-impact";
import { gpcObservationSessionSchema } from "./gpc-observation-session";
import { gpcProductionRuntimeFixture } from "./test-fixtures/gpc-production";

test("fixed windows reject overflow, impossible intervals, duplicate horizons and unbound windows", () => {
  const capture = {contractVersion:'certscore.gpc-impact-capture.v1',scope:'page_http_request_attempts_after_document_commit',expectedEnabled:true,
    captureStartedAtMs:0,capturedAtMs:1200,readbackDocumentToken:'loader',document:{token:'loader',urlSha256:'a'.repeat(64),committedAtMs:100,secGpc:'1'},requestsDropped:0,
    windows:[{durationMs:1000,requestCount:2,requestSetSha256:'b'.repeat(64)}],limitationKeys:[]};
  assert.ok(gpcImpactCaptureSchema.safeParse(capture).success);
  for (const mutation of [{requestsDropped:1},{capturedAtMs:1000},{document:null},{windows:[...capture.windows,...capture.windows]},{limitationKeys:['capture_failed']}]) {
    assert.equal(gpcImpactCaptureSchema.safeParse({...capture,...mutation}).success,false);
  }
});

test("overlapping finalization is additive to old sessions and requires honest generation and timing", () => {
  const session = gpcProductionRuntimeFixture().gpcObservationSession!;
  assert.deepEqual(gpcObservationSessionSchema.parse(session),session,'historical sessions are not upgraded');
  const finalization={contractVersion:'certscore.gpc-overlapped-finalization.v1',readbackStartedAtMs:800,readbackCompletedAtMs:850,
    requestedGeneration:2,terminalGeneration:2,documentUnchanged:true};
  assert.ok(gpcObservationSessionSchema.safeParse({...session,finalization}).success);
  for(const mutation of [{readbackCompletedAtMs:1100},{terminalGeneration:3},{documentUnchanged:false},{readbackCompletedAtMs:null}]) {
    assert.equal(gpcObservationSessionSchema.safeParse({...session,finalization:{...finalization,...mutation}}).success,false);
  }
});

test("an insufficient assessment cannot carry manufactured measurements", () => {
  assert.equal(gpcImpactAssessmentSchema.safeParse({contractVersion:'certscore.gpc-impact-assessment.v1',status:'measured',durationMs:1000}).success,false);
});
