import assert from 'node:assert/strict';
import test from 'node:test';
import { withResponseGuidance } from './response-guidance.js';
const result = (structuredContent: Record<string, unknown>) => ({ structuredContent, content: [{ type: 'text' as const, text: 'Original evidence' }] });
const guide = (tool: string, payload: Record<string, unknown>) => withResponseGuidance(tool, {}, result(payload), Date.parse('2026-09-12T12:00:00Z'));
const metadata = (r: ReturnType<typeof guide>) => r._meta!['ai.certscore/responseGuidance'] as any;
test('preserves success schema and original evidence, with honest missing metadata', () => {
  const payload = { scanId: 'abc', status: 'completed', completedAt: '2026-09-12T11:00:00Z' };
  const r = guide('certscore_get_scan_status', payload), g = metadata(r);
  assert.equal(r.structuredContent, payload);
  assert.deepEqual(r.content[0], result(payload).content[0]);
  assert.equal(g.ageSeconds, 3600);
  assert.equal(g.scanFrom, null);
  assert.equal(g.quotaConsumed, null);
  assert.equal(g.nextAction.tool, 'certscore_get_scan_bundle');
});
test('queued, terminal failure and no-go never recommend fetching a completed bundle', () => {
  for (const status of ['queued', 'failed', 'no_go']) {
    const g = metadata(guide('certscore_get_scan_status', { scanId: 'abc', status }));
    assert.equal(g.nextAction.tool, status === 'queued' ? 'certscore_get_scan_status' : null);
  }
});
test('pagination advances and ends without an extra call', () => {
  const page = { scanId: 'abc', pagination: { offset: 5, returned: 5, limit: 5, total: 13, truncated: true } };
  assert.equal(metadata(guide('certscore_list_findings', page)).nextAction.arguments.offset, 10);
  page.pagination.truncated = false;
  assert.equal(metadata(guide('certscore_list_findings', page)).pagination.nextOffset, null);
});
test('domain lookup uses retained nested identity and never invents scan age', () => {
  const g = metadata(guide('certscore_get_latest_domain_scan', { scan: { scanId: 'retained', status: 'completed', completedAt: 'invalid' } }));
  assert.equal(g.scanId, 'retained'); assert.equal(g.ageSeconds, null); assert.equal(g.creationDecision, 'not_requested');
  assert.equal(metadata(guide('certscore_get_latest_domain_scan', { scan: null })).nextAction.tool, 'certscore_scan_site');
});
test('tool errors stay untouched for output-schema compatibility', () => {
  const error = { isError: true, content: [{ type: 'text' as const, text: 'error' }] };
  assert.equal(withResponseGuidance('certscore_scan_site', {}, error), error);
});
test('completed-limited no-go takes precedence over bundle guidance and future timestamps stay unknown', () => {
  const g = metadata(guide('certscore_get_scan_status', { scanId: 'abc', status: 'completed_limited', resultDisposition: 'no_go', completedAt: '2099-01-01T00:00:00Z' }));
  assert.equal(g.nextAction.tool, null); assert.equal(g.ageSeconds, null);
});
test('finding explanation text is bounded without changing retained structured evidence', () => {
  const payload = { id: 'finding', plainEnglish: 'x'.repeat(50000), nextStep: 'Review the retained evidence.' };
  const r = guide('certscore_explain_finding', payload);
  assert.equal(r.structuredContent, payload);
  assert.ok(r.content.every(item => item.type !== 'text' || item.text.length < 8000));
});
