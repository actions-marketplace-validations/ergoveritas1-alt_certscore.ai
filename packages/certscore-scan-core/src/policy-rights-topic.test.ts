import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPolicyFacts} from './scanners/policy-surface-scanner.js';
const context = 'This privacy policy explains how we process personal data and your rights. We use services to operate this website and protect information. ';
test('California address is not a California rights disclosure', () => {
 assert.ok(!extractPolicyFacts(context + 'Facebook Inc., 1601 S. California Ave, Palo Alto, California, USA.').observedTopics.includes('california_privacy_rights'));
 for (const wording of ['California privacy rights', 'California Consumer Privacy Act (CCPA)', 'California Privacy Rights Act (CPRA)']) assert.ok(extractPolicyFacts(context + wording).observedTopics.includes('california_privacy_rights'));
});
