import { HistoricalBenchmarkPage } from "../../../components/marketing/historical-benchmark-page";
import { createPageMetadata } from "../../../lib/seo";
const content = {"title": "Session replay: historical benchmark notes", "path": "/benchmarks/session-replay-risk-2026", "description": "Historical CertScore.ai counts for session recording and sensitive-input signals, recorded in May 2026. Review the aggregate, source revision, and incomplete provenance."};
export const metadata = createPageMetadata(content);
export default function BenchmarkPage() {
  return <HistoricalBenchmarkPage {...content} ids={["session_recording_services_detected", "possible_session_replay_on_sensitive_input_surface"]} />;
}
