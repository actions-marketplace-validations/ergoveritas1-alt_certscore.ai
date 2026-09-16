import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

test("finish retry acknowledges a matching terminal receipt without rereading or republishing evidence", async () => {
  const directory = await mkdtemp(resolve("tmp/full-site-receipt-test-"));
  const output = join(directory,"route.cjs");
  try {
    await build({entryPoints:[resolve("apps/web/app/api/internal/full-site/page/route.ts")],outfile:output,bundle:true,platform:"node",format:"cjs",packages:"external",plugins:[{
      name:"retained-terminal-fixture",setup(builder) {
        builder.onResolve({filter:/^@website-signal-risk-scanner\/db$/},()=>({path:"db",namespace:"fixture"}));
        builder.onResolve({filter:/runtime-evidence-graph-projection$/},()=>({path:"graph",namespace:"fixture"}));
        builder.onLoad({filter:/.*/,namespace:"fixture"},({path})=>({contents:path==="graph" ? `export const projectCrawlRuntimeGraph=()=>{throw new Error('Unexpected projection')}` : `
          import {createHash} from 'node:crypto';
          export async function queryOne(sql,params) {
            if (!sql.includes('p.token_hash=$3') || params[2]!==createHash('sha256').update('a'.repeat(64)).digest('hex')) return null;
            return {status:'completed',artifact_json:{sha256:'b'.repeat(64),sizeBytes:100,evidenceSizeBytes:200}};
          }
          export const claimFullSitePage=()=>{throw new Error('Unexpected claim')};
          export const completeFullSitePage=()=>{throw new Error('Unexpected publication')};
          export const readFullSiteArtifact=()=>{throw new Error('Unexpected evidence read')};
        `,loader:"js"}));
      },
    }]});
    const {POST} = createRequire(import.meta.url)(output);
    const body = {operation:"finish",contractVersion:"certscore.full-site-page-dispatch.v1",pageId:"11111111-1111-4111-8111-111111111111",attemptId:"22222222-2222-4222-8222-222222222222",token:"a".repeat(64),sha256:"b".repeat(64),sizeBytes:100,evidenceSizeBytes:200};
    const request = (input:unknown)=>new Request("http://localhost:3000/api/internal/full-site/page",{method:"POST",body:JSON.stringify(input)});
    assert.deepEqual(await (await POST(request(body))).json(),{accepted:true});
    assert.deepEqual(await (await POST(request({...body,sha256:"c".repeat(64)}))).json(),{accepted:false});
    assert.equal((await POST(request({...body,token:"d".repeat(64)}))).status,403);
  } finally {await rm(directory,{recursive:true,force:true});}
});
