import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { writeFileSync } from 'node:fs';
const client=new Client({name:'certscore-release-acceptance',version:'1.0.0'});
await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.certscore.ai/mcp/light')));
const evidence={at:new Date().toISOString(),endpoint:'https://mcp.certscore.ai/mcp/light',calls:[]};
async function call(name,args){const r=await client.callTool({name,arguments:args}); if(r.isError)throw Error(name+' failed');const p=r.structuredContent; if(!p)throw Error('Missing structured result');evidence.calls.push({name,scanId:p.scanId,status:p.status,provenance:p.provenance,quotaConsumed:p.quotaConsumed});return p;}
let p=await call('certscore_scan_site',{url:'https://ergoveritas.com/.well-known/certscore-canary/sentinels/broad-baseline.html',freshness:'latest'});const scanId=p.scanId;if(!scanId)throw Error('No scan ID');
for(let i=0;i<6;i++){if(['queued','running','finalizing'].includes(p.status)){await new Promise(r=>setTimeout(r,Math.min(60000,Math.max(1000,(p.retryAfterSeconds||15)*1000))));}p=await call('certscore_get_scan_status',{scanId});if(!['queued','running','finalizing'].includes(p.status))break;}
if(!['completed','completed_limited'].includes(p.status))throw Error('Not completed');await call('certscore_get_scan_bundle',{scanId,detail:'summary',maxBytes:5000});await client.close();writeFileSync('outputs/hosted-oauth-launch-2026-09-14/light-workflow.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
