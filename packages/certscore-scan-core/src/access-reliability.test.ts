import assert from "node:assert/strict";
import test from "node:test";
import { describeAccessReliability, recoveryNavigationTimeout, resetForNavigationRecovery, passiveReadinessTimeout } from "./access-reliability";
import { gpcRuntimeFixture } from "../../certscore-contracts/src/test-fixtures/gpc-runtime";
test("access diagnostics distinguish site challenges from scanner transport/reset faults without promotion", () => {
  for (const [error, reason] of [["page.goto: Navigation is interrupted by another navigation to \"about:blank\"", "navigation_reset_interruption"],
    ["net::ERR_HTTP2_PROTOCOL_ERROR", "http2_transport_failure"], ["net::ERR_BLOCKED_BY_CLIENT", "client_or_safety_block"],
    ["net::ERR_EMPTY_RESPONSE", "empty_transport_response"], ["Chromium renderer crash event", "renderer_crash"]]) {
    const b=gpcRuntimeFixture({enabled:true}); b.runtimeCoverage!.coverageStatus="limited_none";b.modulesRun[0]!.errors=[error!];
    const d=describeAccessReliability(b);assert.equal(d.reason,reason);assert.equal(d.positiveAccess,false);assert.equal(d.contradictoryAccessLabels,true);assert.equal(d.scoreEffect,"none");
  }
  const b=gpcRuntimeFixture({enabled:true});b.scanLaneRuns[0]!.accessOutcome="bot_challenge";
  assert.equal(describeAccessReliability(b).reason,"bot_challenge");
  assert.equal(describeAccessReliability(null).reason,"source_unverified");
});
test("recovery consumes only the existing deadline and preserves capture reserve",()=>{
  assert.equal(recoveryNavigationTimeout(35000,7500),7500);
  assert.equal(recoveryNavigationTimeout(1500,7500),500);
  assert.equal(recoveryNavigationTimeout(999,7500),0);
  assert.equal(recoveryNavigationTimeout(-100,7500),0);
});
test("committed-page readiness cannot restart the navigation allowance or consume the capture reserve", () => {
  assert.equal(passiveReadinessTimeout(15000, 12000, 20000), 3000);
  assert.equal(passiveReadinessTimeout(15000, 100, 1500), 500);
  assert.equal(passiveReadinessTimeout(15000, 16000, 20000), 0);
  assert.equal(passiveReadinessTimeout(7500, 7000, 999), 0);
  assert.equal(passiveReadinessTimeout(7500, 7000, 10000), 500);
  assert.equal(passiveReadinessTimeout(15000, Number.NaN, 20000), 0);
});
test("failed reset cannot launch a subsequent navigation and cancellation stops dispatch",async()=>{
 let calls=0;
 const page={goto:async(url:string,options?:{waitUntil?:string})=>{calls++;assert.equal(url,'about:blank');assert.equal(options?.waitUntil,'commit');throw Error('reset timeout');}};
 await assert.rejects(resetForNavigationRecovery(page,3000),/reset timeout/);
 assert.equal(calls,1);
 const abort=new AbortController();abort.abort(Error('cancelled'));
 await assert.rejects(resetForNavigationRecovery(page,3000,abort.signal),/cancelled/);
 await assert.rejects(resetForNavigationRecovery(page,500),/budget exhausted/);
 assert.equal(calls,1);
});
