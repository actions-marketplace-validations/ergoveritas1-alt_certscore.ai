import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec=promisify(execFile);
test("cohort CLI retains missing required rows, prevents overwrites and rejects duplicate IDs",async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'gpc-cohort-'));
 try {
   const input=path.join(root,'manifest.json'),output=path.join(root,'report.json');
   const row={scanId:'required-missing',required:true,publishedObservation:'unavailable',revision:'new',gpc:{path:'missing.json',sha256:'0'.repeat(64),sizeBytes:1}};
   await writeFile(input,JSON.stringify({scans:[row,{scanId:'excluded',required:false}]}));
   const args=['--import','tsx',path.resolve('scripts/replay-gpc-impact-cohort.ts'),input,output];
   await exec(process.execPath,args);
   const r=JSON.parse(await readFile(output,'utf8'));assert.equal(r.summary.required,1);assert.equal(r.summary.retainedSourceCoverage.numerator,0);
   assert.equal(r.summary.publishedCompletion.denominator,1);assert.equal(r.summary.matchedWindowCoverage.numerator,0);
   await assert.rejects(exec(process.execPath,args),/EEXIST/);
   const alias=path.join(root,'alias.json');await symlink(input,alias);
   await assert.rejects(exec(process.execPath,[...args.slice(0,-1),alias]),/overwrite/);
   await writeFile(input,JSON.stringify({scans:[row,row]}));
   await assert.rejects(exec(process.execPath,[...args.slice(0,-1),path.join(root,'duplicate.json')]),/unique/);
 }finally{await rm(root,{recursive:true,force:true});}
});
