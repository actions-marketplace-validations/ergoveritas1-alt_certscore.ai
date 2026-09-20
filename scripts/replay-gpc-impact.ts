import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { buildGpcImpactAssessment } from "../packages/certscore-scan-core/src/gpc-impact-assessment";

const sourceSchema = z.object({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().positive().max(20_000_000) }).strict();
const manifestSchema = z.object({ scanId:z.string().min(1).max(200), baseline:sourceSchema, gpc:sourceSchema }).strict();

async function main() {
  const args=process.argv.slice(2);
  const manifestPath=args[0], output=args[1];
  if(!manifestPath || !output || args.length!==2) throw Error('Usage: node --import tsx scripts/replay-gpc-impact.ts <manifest.json> <output.json>');
  const manifest=manifestSchema.parse(JSON.parse(await readFile(manifestPath,'utf8')));
  const sourcePath=(p:z.infer<typeof sourceSchema>)=>path.resolve(path.dirname(manifestPath),p.path);
  if ([path.resolve(manifestPath),sourcePath(manifest.baseline),sourcePath(manifest.gpc)].includes(path.resolve(output))) throw Error('Output must not overwrite the manifest or source evidence.');
  const load=async (p:z.infer<typeof sourceSchema>)=>{
    if ((await stat(sourcePath(p))).size>20_000_000) throw Error('Evidence exceeds the retained-source size limit.');
    return {bytes:await readFile(sourcePath(p)),pointer:{sha256:p.sha256,sizeBytes:p.sizeBytes}};
  };
  const [baseline,gpc]=await Promise.all([load(manifest.baseline),load(manifest.gpc)]);
  const result=buildGpcImpactAssessment({scanId:manifest.scanId,baseline,gpc});
  await writeFile(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({scanId:result.scanId,status:result.status,durationMs:result.durationMs,limitationKeys:result.limitationKeys,output},null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
