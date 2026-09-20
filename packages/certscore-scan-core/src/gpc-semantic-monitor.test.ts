import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { chromiumLaunchOptions } from "./playwright-runtime";
import { installGpcSemanticMonitor } from "./gpc-semantic-monitor";
import { captureGpcOptOutObservation } from "./gpc-opt-out-capture";
test("loaded CMP replacing a stub retains ready transitions without accepting stale stub callbacks", async()=>{
 const browser=await chromium.launch(chromiumLaunchOptions({headless:true}));
 try {const context=await browser.newContext();await installGpcSemanticMonitor(context,'fixtureMonitor');
 await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Monitor fixture</body>'}));
 const page=await context.newPage(),started=Date.now();await page.goto('https://fixture.test/');
 await page.evaluate(async()=>{
   const w=window as any;let oldCallback:any;
   w.__gpp=(cmd:string,cb:any)=>{if(cmd==='addEventListener')oldCallback=cb;};
   document.dispatchEvent(new Event('load'));
   const ping={gppVersion:'1.1',cmpStatus:'loaded',signalStatus:'ready',sectionList:[8],applicableSections:[8],parsedSections:{usca:[{Version:1,SaleOptOutNotice:1,SharingOptOutNotice:1,SaleOptOut:1,SharingOptOut:1},{GpcSegmentType:1,Gpc:true}]}};
   w.__gpp=(cmd:string,cb:any)=>{if(cmd==='addEventListener')cb({eventName:'listenerRegistered',data:true,listenerId:1,pingData:ping},true);if(cmd==='ping')cb(ping,true);};
   document.dispatchEvent(new Event('load'));
   oldCallback?.({eventName:'signalStatus',pingData:{...ping,signalStatus:'not ready'}},true);
 });
 const result=await captureGpcOptOutObservation(page,{scanId:'monitor',scanStartedAtMs:started,monitorKey:'fixtureMonitor',semanticOnly:true});
 assert.equal(result.gppStatus,'observed');assert.deepEqual(result.stateTransitions?.map(x=>x.status),['observed']);
 } finally {await browser.close();}
});
