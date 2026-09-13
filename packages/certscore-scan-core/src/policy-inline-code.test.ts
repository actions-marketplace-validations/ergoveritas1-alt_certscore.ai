import assert from 'node:assert/strict';
import test from 'node:test';
import { extractPolicySections, resolvePolicyVisibleText } from './scanners/policy-surface-scanner.js';

test('policy extraction retains inline identifiers in document text and section evidence', async () => {
  const html = `<main><h1>Privacy policy</h1><h2>Cookies and storage</h2>
    <p>We use <code>_ga</code> for analytics and <code>visitor_preferences</code> to retain your choices.</p>
    <p>We process personal data to provide our services. Contact the controller for access, deletion and correction requests.</p>
    <script>hidden_script_marker</script><style>hidden_style_marker</style>
    <pre><code>excluded_example_marker</code></pre></main>`;
  const visibleText = await resolvePolicyVisibleText({ html, baseUrl: 'https://example.test/privacy', surfaceType: 'privacy_policy', timeoutMs: 500 });
  assert.match(visibleText, /_ga/);
  assert.match(visibleText, /visitor_preferences/);
  assert.doesNotMatch(visibleText, /hidden_script_marker|hidden_style_marker|excluded_example_marker/);
  const sections = extractPolicySections({ html, visibleText, sourceUrl: 'https://example.test/privacy' });
  const cookies = sections.find(section => section.heading === 'Cookies and storage');
  assert.match(cookies?.textExcerpt ?? '', /_ga/);
  assert.match(cookies?.textExcerpt ?? '', /visitor_preferences/);
  assert.match(cookies?.evidenceTextSha256 ?? '', /^[a-f0-9]{64}$/);
});
