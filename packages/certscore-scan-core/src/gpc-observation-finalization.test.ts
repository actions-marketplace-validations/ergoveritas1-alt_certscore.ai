import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import type { Page } from "playwright";
import { gpcProductionRuntimeFixture } from "../../certscore-contracts/src/test-fixtures/gpc-production";
import { startGpcObservationSession } from "./gpc-observation-session";

async function fixture() {
  const b = gpcProductionRuntimeFixture();
  const started = Date.now() - 1000;
  let treeCalls = 0;
  let resolveTree!: (value: unknown) => void;
  const cdp = Object.assign(new EventEmitter(), {
    send: async (method: string) => {
      if (method !== 'Page.getFrameTree') return {};
      if (++treeCalls === 1) return { frameTree:{ frame:{id:'main',loaderId:'initial',url:'about:blank'} } };
      return new Promise(resolve => { resolveTree = resolve; });
    }, detach:async()=>{},
  });
  const page = Object.assign(new EventEmitter(), {context:()=>({addInitScript:async()=>{},newCDPSession:async()=>cdp}),isClosed:()=>false,url:()=>b.url,mainFrame:()=>({})});
  const s = await startGpcObservationSession({page:page as unknown as Page,scanId:b.scanId,captureId:b.gpcObservationSession!.captureId,scanStartedAtMs:started});
  cdp.emit('Network.requestWillBeSent',{type:'Document',frameId:'main',loaderId:'fixture-loader',requestId:'doc',request:{url:b.url,headers:{'Sec-GPC':'1'}}});
  cdp.emit('Page.frameNavigated',{frame:{id:'main',loaderId:'fixture-loader',url:b.url}});
  const semantic = structuredClone(b.gpcObservationSession!.semanticObservation!);
  semantic.capturedAtMs = Date.now()-started;
  s.recordRequest({eventId:'request',timestampMs:Date.now()-started,requestUrl:b.url,requestHeaders:{secGpc:'1'}});
  return {s,page,cdp,semantic,treeCalls:()=>treeCalls,resolve:async()=>{resolveTree({frameTree:{frame:{id:'main',loaderId:'fixture-loader',url:b.url}}});await Promise.resolve();await Promise.resolve();}};
}
const listener = {callbacks:0,dropped:0,registered:false};

test("same-URL history while readback is pending adds no read and cannot override cancellation", async () => {
  for (const aborted of [false, true]) {
    const f = await fixture(); f.s.prepareFinalization();
    f.cdp.emit('Page.navigatedWithinDocument', { frameId: 'main', url: f.page.url(), navigationType: 'historyApi' });
    await f.resolve();
    const packet = await f.s.finish(f.semantic, listener, aborted);
    assert.equal(packet.terminal, aborted ? 'aborted' : 'completed');
    assert.equal(f.treeCalls(), 2);
    await f.s.close();
  }
});

test("exact-URL history no-ops preserve terminal proof; changed or unknown history stays stale", async () => {
  for (const change of ['noop', 'return', 'fragment', 'unknown', 'missing']) {
    const f = await fixture();
    f.s.prepareFinalization(); await f.resolve();
    const url = f.page.url();
    if (change === 'return') f.cdp.emit('Page.navigatedWithinDocument', { frameId: 'main', url: `${url}?changed=1`, navigationType: 'historyApi' });
    f.cdp.emit('Page.navigatedWithinDocument', { frameId: 'main', url: change === 'missing' ? undefined : change === 'fragment' ? `${url}#other` : url,
      navigationType: change === 'unknown' ? undefined : 'historyApi' });
    const packet = await f.s.finish(f.semantic, listener, false);
    assert.equal(packet.terminal, change === 'noop' ? 'completed' : 'incomplete', change);
    assert.equal(packet.finalization!.invalidationReasons!.length > 0, change !== 'noop');
    const frozen = JSON.stringify(packet);
    f.cdp.emit('Page.navigatedWithinDocument', { frameId: 'main', url: `${url}?late=1` });
    assert.equal(JSON.stringify(await f.s.finish(f.semantic, listener, false)), frozen);
    assert.equal(f.treeCalls(), 2);
    await f.s.close();
    assert.equal(f.page.listenerCount('crash'), 0);
    assert.equal(f.page.listenerCount('close'), 0);
  }
});

test("a stalled final readback preserves a terminal packet immediately; late resolution cannot mutate it", async()=>{
  const f=await fixture();
  f.s.prepareFinalization();
  const start=performance.now();
  const packet=await f.s.finish(f.semantic,listener,false);
  assert.ok(performance.now()-start<100);
  assert.equal(packet.terminal,'incomplete');
  assert.ok(packet.limitationKeys.includes('terminal_document_unverified'));
  assert.equal(packet.requests.length,1);
  const frozen=JSON.stringify(packet);
  await f.resolve();
  assert.equal(JSON.stringify(await f.s.finish(f.semantic,listener,false)),frozen);
  assert.equal(f.treeCalls(),2,'one initial and one overlapping tree read, no retries');
  await f.s.close();
});
test("completed overlapping proof is accepted, and later navigation, history changes and crashes invalidate it",async()=>{
  for(const change of ['none','navigation','history','crash']){
    const f=await fixture(); f.s.prepareFinalization(); await f.resolve();
    if(change==='navigation') f.cdp.emit('Network.requestWillBeSent',{type:'Document',frameId:'main',loaderId:'next',requestId:'next',request:{url:'https://other.test/',headers:{'Sec-GPC':'1'}}});
    if(change==='history') f.cdp.emit('Page.navigatedWithinDocument',{frameId:'main',url:'https://example.test/new'});
    if(change==='crash') f.page.emit('crash');
    const packet=await f.s.finish(f.semantic,listener,false);
    assert.equal(packet.terminal,change==='none'?'completed':'incomplete',change);
    await f.s.close();
  }
});
