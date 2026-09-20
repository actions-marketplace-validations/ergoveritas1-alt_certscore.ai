import { readFile, writeFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { assessGpcCohortRow, summarizeGpcImpactCohort, type GpcCohortInput } from "../packages/certscore-scan-core/src/gpc-impact-cohort";

const source = z.object({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().positive().max(20_000_000) }).strict();
const manifest = z.object({ scans: z.array(z.object({ scanId: z.string().min(1).max(160), required: z.boolean(),
  publishedObservation: z.enum(["complete", "limited", "unavailable", "missing"]).optional(),
  revision: z.string().min(1).max(80).optional(), region: z.string().min(1).max(80).optional(),
  baseline: source.optional(), gpc: source.optional(),
  consent: source.optional(), policy: source.optional(),
}).strict()).max(10000) }).strict();
async function main() {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length) throw Error("Usage: node --import tsx scripts/replay-gpc-impact-cohort.ts manifest.json report.json");
  const m = manifest.parse(JSON.parse(await readFile(input, "utf8")));
  const resolve = (p: string) => path.resolve(path.dirname(input), p);
  const target = await realpath(output).catch(() => path.resolve(output));
  const inputs = [input, ...m.scans.flatMap(r => [r.baseline?.path, r.gpc?.path, r.consent?.path, r.policy?.path].flatMap(p => p ? [resolve(p)] : []))];
  for (const p of inputs) if (await realpath(p).catch(() => path.resolve(p)) === target) throw Error("Output must not overwrite source evidence.");
  const load = async (p?: z.infer<typeof source>) => {
    if (!p) return undefined;
    try {
      if ((await stat(resolve(p.path))).size > 20_000_000) return undefined;
      return { bytes: await readFile(resolve(p.path)), pointer: { sha256: p.sha256, sizeBytes: p.sizeBytes } };
    } catch { return undefined; } // Missing source stays in the denominator.
  };
  // Process bounded rows individually; do not hold 10,000 full browser bundles.
  const reports = [];
  for (const r of m.scans) {
    const row: GpcCohortInput = { ...r, baseline: await load(r.baseline), gpc: await load(r.gpc), consent: await load(r.consent), policy: await load(r.policy) };
    reports.push(assessGpcCohortRow(row));
  }
  const report = summarizeGpcImpactCohort(reports);
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(report.summary, null, 2));
}
main().catch(e => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; });
