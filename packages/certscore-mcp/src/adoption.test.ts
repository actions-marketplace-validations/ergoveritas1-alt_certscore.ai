import assert from 'node:assert/strict';
import test from 'node:test';
import {PROJECT_REVIEW_INSTRUCTIONS, comparisonPrompt, registerAdoptionFeatures} from './adoption.js';
test('adoption prompts use retained observations and avoid unsolicited scan work',()=>{
 assert.match(PROJECT_REVIEW_INSTRUCTIONS,/Never run unsolicited/);
 const prompt=comparisonPrompt('before','after');
 assert.match(prompt,/before and after/); assert.match(prompt,/do not start a new scan/);
 assert.match(prompt,/not proof of resolution/); assert.match(prompt,/coverage/);
});
test('discovery registers three prompts and four resources; reads execute only on demand',async()=>{
 const prompts=new Map<string,any>(), resources=new Map<string,any>();let reads=0;
 const server={registerPrompt:(name:string,meta:any,handler:any)=>prompts.set(name,{meta,handler}),registerResource:(name:string,uri:string,meta:any,handler:any)=>resources.set(uri,handler)};
 registerAdoptionFeatures(server as any,async()=>{reads++;return {authenticated:true};},async()=>{reads++;return {example:true};});
 assert.equal(prompts.size,3);assert.equal(resources.size,4);assert.equal(reads,0);
 const result=await resources.get('certscore://connection')();
 assert.equal(JSON.parse(result.contents[0].text).authenticated,true);assert.equal(reads,1);
 const comparison=prompts.get('certscore_compare_scans');
 assert.equal(comparison.meta.argsSchema.beforeScanId.safeParse('bad').success,false);
});
