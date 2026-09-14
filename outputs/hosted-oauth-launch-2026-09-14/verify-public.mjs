import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const origin=process.argv[2]||'https://certscore.ai';
const paths=['/','/releases','/releases/mcp-hosted-oauth','/releases/mcp-light','/releases/accept-and-reject-path-testing','/developers/mcp','/developers/quickstart','/developers','/mcp/light','/claude','/releases/feed.xml','/sitemap.xml','/llms.txt','/llms-full.txt','/api-pulse-agent-guide.txt'];
const results=[];const bodies={};
for(const path of paths){const r=await fetch(origin+path);assert.equal(r.status,200,path);bodies[path]=await r.text();results.push({path,status:r.status});}
for(const path of ['/','/releases']){const b=bodies[path]; const slugOrder=['mcp-hosted-oauth','accept-and-reject-path-testing','mcp-light'].map(s=>b.indexOf('/releases/'+s));assert.ok(slugOrder.every(i=>i>=0));assert.ok(slugOrder[0]<slugOrder[1]&&slugOrder[1]<slugOrder[2],path+' order');}
for(const path of ['/developers/mcp','/developers/quickstart','/mcp/light','/llms.txt','/llms-full.txt','/api-pulse-agent-guide.txt'])assert.doesNotMatch(bodies[path],/12 scan\/report|Active Trial workspaces connecting|No separate Connect screen|approve the connection once|exactly the three Light tools|certscore_get_scan_bundle only/);
assert.match(bodies['/developers/mcp'],/id="hosted-oauth-start"/);assert.match(bodies['/developers/mcp'],/Members of active CertScore/);assert.match(bodies['/developers/quickstart'],/Members of active CertScore/);
for(const path of ['/releases/feed.xml','/sitemap.xml','/llms.txt','/llms-full.txt'])assert.ok(bodies[path].includes('/releases/mcp-hosted-oauth'),path);
const article=bodies['/releases/mcp-hosted-oauth'];assert.match(article, /rel="canonical" href="https:\/\/certscore.ai\/releases\/mcp-hosted-oauth"/);assert.match(article,/name="twitter:card" content="summary_large_image"/);assert.match(article,/property="og:image" content="https:\/\/certscore.ai\/images\/releases\/mcp-hosted-oauth-social-card.png"/);assert.ok(article.includes('"@type":"Article"'));assert.ok(article.includes('/developers/mcp#hosted-oauth-start'));
const img=await fetch(origin+'/images/releases/mcp-hosted-oauth-social-card.png');assert.equal(img.status,200);const png=Buffer.from(await img.arrayBuffer());assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
const version=await fetch(origin+'/api/version').then(r=>r.json());const evidence={at:new Date().toISOString(),origin,version,pages:results,metadata:'pass',ordering:'pass',documentation:'pass',asset:{width:1200,height:630,bytes:png.length}};
writeFileSync('outputs/hosted-oauth-launch-2026-09-14/'+(origin.includes('localhost')?'local':'production')+'-public.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
