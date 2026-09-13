import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { buildGpcImpactCohort } from "./gpc-impact-cohort";
import { gpcProductionRuntimeFixture } from "../../certscore-contracts/src/test-fixtures/gpc-production";
test("cohort preserves failed/missing required scans, excludes ineligible scans and separates published/evidence completion",()=>{
  const b=gpcProductionRuntimeFixture();const bytes=Buffer.from(JSON.stringify(b));
  const source={bytes,pointer:{sha256:createHash('sha256').update(bytes).digest('hex'),sizeBytes:bytes.length}};
  const result=buildGpcImpactCohort([{scanId:b.scanId,required:true,publishedObservation:'missing',revision:'new',gpc:source},
    {scanId:'missing',required:true,publishedObservation:'unavailable',revision:'old'}, {scanId:'excluded',required:false}]);
  assert.equal(result.summary.required,2);assert.equal(result.summary.legitimatelyExcluded,1);
  assert.equal(result.summary.publishedCompletion.numerator,0);
  assert.equal(result.summary.retainedEvidenceCompletion.numerator,1);
  assert.equal(result.summary.matchedWindowCoverage.numerator,0);
  assert.equal(result.summary.windows[1000]!.activity.trackers!.netReductionAmongBaselineActive.fraction,null);
  assert.equal(result.byRevision.new!.required,1);assert.equal(result.rows[0]!.impact.status,'insufficient_evidence');
  assert.throws(()=>buildGpcImpactCohort([{scanId:'same',required:true},{scanId:'same',required:true}]),/unique/);
  const bad=buildGpcImpactCohort([{scanId:b.scanId,required:true,gpc:{...source,pointer:{...source.pointer,sha256:'0'.repeat(64)}}}]);
  assert.equal(bad.summary.retainedEvidenceCompletion.numerator,0);
});
