# CertScore Web Privacy Scanner - certification notes (1.0.3)

CertScore Web Privacy Scanner offers free, usage-limited scanning of public websites and evidence-backed review of cookies, trackers, CMPs and consent controls, privacy-policy and disclosure signals, observable form and third-party embed activity, and HTTPS/TLS.

## Connection model and issue 1

This submission uses publisher-configured Microsoft Entra client-credentials authentication, referenced through Azure Key Vault in the manifest. No separate end-user CertScore account, paid CertScore subscription, or personal CertScore API key is required. Access to Copilot Studio and the permissions required to add/use the connector in the customer's environment are prerequisites. Microsoft licensing and administrator policies apply.

The endpoint accepts Entra application tokens. A separately configured tenant-restricted delegated OAuth pilot is also enabled and has completed a Copilot Studio scan and report/evidence retrieval. That pilot is not the submitted AzureKeyVault configuration and is not a general cross-tenant customer implementation. This endpoint does not implement dynamic client registration. Entering an arbitrary OAuth client ID into the default VS Code registration prompt will not resolve the configuration mismatch.

Please confirm that the preview connector's certification and customer connection flow supports this application-token configuration. If delegated authorization is required, please provide the required grant type, client configuration, redirect URIs, and consent requirements before we revise the implementation. Issue 1 remains open pending confirmation and validation of the supported reviewer/customer flow. Tenant-local end-to-end success does not close that finding; refresh after expiry and cross-tenant access remain unverified.

## Secure configuration

- MCP endpoint: https://mcp.certscore.ai/mcp/microsoft
- Health endpoint: https://mcp.certscore.ai/healthz
- Key Vault reference: https://cs-msft-mcp-kv-7150890.vault.azure.net/
- Required configured secret names: ClientId, ClientSecret, TokenUrl, AzureActiveDirectoryResourceId.
- Required grant: client_credentials.
- Scope: the configured resource identifier with /.default appended.
- Expected token: v2 Entra application token with the configured resource audience, tenant, client identity, and Mcp.Access application role; no delegated scp claim.

The Microsoft certification service should retrieve the OAuth configuration from the referenced vault using its authorized service principal. Never put secret values or access tokens in email, screenshots, recordings, or the app ZIP. If additional secure reviewer access is needed, please identify the supported secure submission mechanism for this concierge review without initiating another Partner Center publication.

## VS Code diagnostic path

The accompanying vscode-validation.mcp.json is an optional diagnostic configuration for reviewers who can securely obtain a short-lived application token from the configured confidential client. It prompts for that token and sends it as an Authorization header to the exact Microsoft endpoint. It is not a replacement for the approved Copilot Studio customer connection flow, and does not close the reported usability issue by itself. Do not enter a client secret in the token prompt.

## Functional validation

1. Acquire the application token securely using the configured client credentials. Initialize the MCP HTTP session with Authorization: Bearer <application-token>, the SDK-negotiated protocol version, and the returned session ID on subsequent requests. Send the initialized notification before listing/calling tools.
2. List tools. The four declared tools are certscore_scan_site, certscore_get_scan_status, certscore_get_scan_bundle, and certscore_get_report_evidence_page. Verify the runtime schemas against mcptools.json.
3. Call certscore_scan_site with a public HTTPS URL, such as the publisher-owned https://certscore.ai/. Use the input field names and region values returned by tools/list. Retain scanId. The default freshness mode may reuse an eligible recent scan; refresh requests a new scan and is subject to usage limits.
4. Poll certscore_get_scan_status with scanId, following retry guidance, until terminal. A preview or interim response is not a completed report.
5. For completed or completed_limited, call certscore_get_scan_bundle with scanId. Confirm the report URL, retained findings, and coverage limitations are returned. Preserve limited coverage in any summary.
6. Call certscore_get_report_evidence_page with the same scanId. Use the pagination input defined in tools/list and the returned nextCursor until there is no next page. Evidence-page reads do not create additional scans. Keep pages from one report snapshot together.
7. Record the exact client/environment, test time, scanId, final status, and results for each tool. Redact credentials and sensitive URL values. A health check or tools/list alone is not a completed functional test.

## Limits and interpretation

Only public websites are supported. Authenticated/private-network targets are excluded. Creation and retrieval quotas apply; follow Retry-After and returned retry guidance. Current policy: https://certscore.ai/developers/reference.

Control activation, completed bounded observation, and confirmed consent/refusal are separate outcomes. Report them as returned. An unconfirmed action does not prove refusal; separately verified after-click activity may still produce a review finding. Missing or unverifiable evidence must not be described as a clean result. Results are evidence-backed review aids, not legal advice, certification, or a compliance determination.

Get started and help: https://certscore.ai/developers/mcp
Contact us: https://certscore.ai/contact-sales
Email support: support@certscore.ai

## Preview schema

Version 1.0.3 retains manifestVersion devPreview and the published vDevPreview schema under the allowance in ticket #5790539 through September 20, 2026. Please confirm an extension or the supported numbered schema if review continues after that date. No numbered schema has been guessed.
