import assert from 'node:assert/strict';
import test from 'node:test';
import {lightWorkflowMetrics} from './mcp-light-metrics';
import type {McpWorkflowEvent} from './mcp-workflows';
function row(tool:string,start:number,end:number,status:string,extra={}) {
 const time=(s:number)=>new Date(Date.UTC(2026,8,12)+s*1000).toISOString();
 return {surface:'mcp_light',tool_name:tool,outcome:'success',occurred_at:time(end), request_details:{version:1,arguments:{},argumentsOmitted:false,actorBasis:'requester_binding',sessionBasis:'mcp_session',rateLimit:null,timing:{startedAt:time(start),responseGeneratedAt:time(end)},response:{bytes:100,truncated:false,summary:{version:1,captureBasis:'response_generated',templateVersion:'2026-09-11.1',kind:'tool_result',isError:false,textOmitted:false,summaryTruncated:false,status,...extra}}}} as McpWorkflowEvent;
}
test('separates internal reads, early caller polls, terminal polls and first results',()=>{
 const result=lightWorkflowMetrics([
 row('certscore_scan_site',0,2,'running',{firstResult:'preview',internalReadCount:2,retryAfterSeconds:5,recommendedNextTool:'certscore_get_scan_status'}),
 row('certscore_get_scan_status',4,5,'completed'),row('certscore_get_scan_status',6,7,'completed'),row('certscore_get_scan_bundle',8,9,'completed')]);
 assert.deepEqual(result,{earlyPolls:1,measuredPolls:1,afterCompletion:1,internalReads:2,internalReadsKnown:1,firstUsefulMs:2000,firstBundleMs:9000});
});
test('overlapping and historical calls do not invent polling violation or timing',()=>{
 const overlap=lightWorkflowMetrics([row('certscore_scan_site',0,4,'running',{retryAfterSeconds:5,recommendedNextTool:'certscore_get_scan_status'}),row('certscore_get_scan_status',1,5,'running')]);
 assert.equal(overlap.measuredPolls,0);
 const old= row('certscore_scan_site',0,1,'completed');delete old.request_details;
 assert.equal(lightWorkflowMetrics([old]).firstUsefulMs,null);
 assert.equal(lightWorkflowMetrics([{...old,surface:'mcp_authenticated'}]).internalReadsKnown,0);
});
