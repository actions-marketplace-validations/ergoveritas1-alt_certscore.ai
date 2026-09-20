CertScore.ai Website Privacy Scanner MCP offers free, usage-limited scanning of public websites and evidence-backed review of cookies, trackers, CMPs and consent controls, privacy-policy and disclosure signals, observable form and third-party embed activity, and HTTPS/TLS.

No purchase, paid subscription, end-user CertScore account, license key, or test credentials are required. Microsoft authenticates to the MCP server with the Azure Key Vault configuration referenced in the package manifest. The vault holds the Entra client-credentials values; do not request or share its secrets in the certification notes.

MCP endpoint: https://mcp.certscore.ai/mcp/microsoft
Health endpoint: https://mcp.certscore.ai/healthz
Support and usage documentation: https://certscore.ai/developers/reference

Suggested certification test with a publicly reachable HTTPS website:
1. Initialize the authenticated MCP session and list tools. The four declared tools are certscore_scan_site, certscore_get_scan_status, certscore_get_scan_bundle, and certscore_get_report_evidence_page.
2. Call certscore_scan_site with a public HTTPS URL. Retain the returned scanId. The default freshness mode may reuse an eligible recent scan; use refresh only if a new scan is needed for testing.
3. Poll certscore_get_scan_status with scanId using the returned retry guidance until a terminal state. Do not assume a scan is complete from a preview or interim status.
4. For completed or completed_limited, call certscore_get_scan_bundle with scanId. Preserve any coverage limitations.
5. Call certscore_get_report_evidence_page with the same scanId. If a nextCursor is returned, continue until pagination is complete. The pages are bounded report evidence, not additional scans.

Results are evidence-backed review aids, not legal advice, certification, or a compliance determination. Consent-choice observations, including bounded Reject Path evidence, appear only when an eligible scan provides verified evidence. Unsupported or unconfirmed choice-path testing is reported as limited coverage, not as a clean result.
