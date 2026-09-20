import { HistoricalBenchmarkPage } from "../../../components/marketing/historical-benchmark-page";
import { createPageMetadata } from "../../../lib/seo";
const content = {"title": "Website consent and tracking: historical benchmark notes", "path": "/benchmarks/website-consent-tracking-2026", "description": "Historical CertScore.ai counts for consent and tracking, recorded in May 2026. Review the aggregate, source revision, and incomplete provenance."};
export const metadata = createPageMetadata(content);
export default function BenchmarkPage() {
  return <HistoricalBenchmarkPage {...content} />;
}
