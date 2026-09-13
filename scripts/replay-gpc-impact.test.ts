import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { gpcRuntimeFixture } from "../packages/certscore-contracts/src/test-fixtures/gpc-runtime";
const exec=promisify(execFile);

test("replay verifies original file pointers, leaves historical evidence unupgraded, and protects inputs",async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'gpc-replay-'));
  try {
    const pointer=async(enabled:boolean)=>{
      const bytes=Buffer.from(JSON.stringify(gpcRuntimeFixture({enabled})));
      const name=enabled?'gpc.json':'baseline.json'; await writeFile(path.join(root,name),bytes);
      return {path:name,sha256:createHash('sha256').update(bytes).digest('hex'),sizeBytes:bytes.length};
    };
    const manifest={scanId:'gpc-fixture',baseline:await pointer(false),gpc:await pointer(true)};
    const manifestPath=path.join(root,'manifest.json'),out=path.join(root,'impact.json');
    await writeFile(manifestPath,JSON.stringify(manifest));
    const args=['--import','tsx',path.resolve('scripts/replay-gpc-impact.ts'),manifestPath,out];
    await exec(process.execPath,args);
    const result=JSON.parse(await readFile(out,'utf8'));
    assert.equal(result.status,'insufficient_evidence');
    assert.ok(result.limitationKeys.includes('baseline_impact_capture_missing'));
    manifest.gpc.sha256='0'.repeat(64); await writeFile(manifestPath,JSON.stringify(manifest));
    await exec(process.execPath,args);
    assert.ok(JSON.parse(await readFile(out,'utf8')).limitationKeys.includes('gpc_source_unverified'));
    await assert.rejects(exec(process.execPath,[...args.slice(0,-1),path.join(root,'gpc.json')]),/must not overwrite/);
  } finally {await rm(root,{recursive:true,force:true});}
});
