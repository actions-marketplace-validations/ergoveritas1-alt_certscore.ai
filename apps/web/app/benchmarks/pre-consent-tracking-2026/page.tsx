import { HistoricalBenchmarkPage } from "../../../components/marketing/historical-benchmark-page";
import { createPageMetadata } from "../../../lib/seo";
const content = {"title": "Pre-consent tracking: historical benchmark notes", "path": "/benchmarks/pre-consent-tracking-2026", "description": "Historical CertScore.ai counts for pre-consent requests and cookies, recorded in May 2026. Review the aggregate, source revision, and incomplete provenance."};
export const metadata = createPageMetadata(content);
export default function BenchmarkPage() {
  return <HistoricalBenchmarkPage {...content} ids={["pre_consent_tracking_detected", "third_party_cookie_pre_consent"]} />;
}
