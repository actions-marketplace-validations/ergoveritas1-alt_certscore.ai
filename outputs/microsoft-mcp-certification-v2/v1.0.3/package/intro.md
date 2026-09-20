# CertScore Web Privacy Scanner

CertScore Web Privacy Scanner offers free, usage-limited scanning of public websites and evidence-backed review of cookies, trackers, CMPs and consent controls, privacy-policy and disclosure signals, observable form and third-party embed activity, and HTTPS/TLS.

## Requirements and getting started

Requirements: Access to Microsoft Copilot Studio and permission to add and use the connector in your organization's environment are required. Your Microsoft plan and administrator policies govern availability. This connector uses publisher-configured Microsoft Entra application authentication. No separate CertScore account, paid CertScore subscription, or personal CertScore API key is required. Scan and retrieval limits apply; see the documentation for current limits and retry guidance. Only publicly accessible websites are supported; authenticated pages and private-network targets are excluded.

This is the Microsoft-authenticated edition of CertScore MCP Light. Its endpoint is https://mcp.certscore.ai/mcp/microsoft. The submitted configuration references Azure Key Vault for publisher-managed Entra client-credentials authentication. An administrator or the Microsoft connector integration must configure the connection before the tools can be used. End users do not supply CertScore credentials. Direct interactive OAuth sign-in or dynamic client registration at this endpoint is not supported. If your client prompts you to register an OAuth application, contact support for the appropriate connection configuration.

The general MCP setup page also describes other CertScore connection types; this package specifically uses the Microsoft endpoint and authentication above. The public Light endpoint and workspace OAuth endpoint are separate connection types.

## Four-tool lifecycle

1. Use `certscore_scan_site` to request a scan or reuse an eligible recent completed scan. Keep the stable `scanId` returned by the tool. The default `freshness=latest` avoids unnecessary new scans; use `refresh` only when a fresh run is explicitly required.
2. Use `certscore_get_scan_status` with that `scanId` while the scan is queued, running, or finalizing. Follow the returned retry guidance and stop at a terminal state.
3. For `completed` or `completed_limited`, use `certscore_get_scan_bundle` to retrieve the bounded canonical findings, evidence summaries and references, provenance, coverage limitations, score metadata, and public report URL.
4. When a reviewer needs the fuller retained report projection, use `certscore_get_report_evidence_page` with the same `scanId`. Continue with the returned cursor until pagination reports completion. Keep pages from the same snapshot together and preserve coverage limitations.

The Microsoft endpoint retains MCP Light's bounded anonymous-style scan and read quotas. Eligible recent-result reuse does not consume a new-scan allowance. Current automated-access policy and retry guidance are published at https://certscore.ai/developers/reference. For higher-volume use, contact support@certscore.ai.

## Public reports and evidence boundaries

Usable completed results include a public CertScore report URL. Returned content is bounded and public-safe: it excludes raw cookie values, raw request or response bodies, sensitive payloads, full DOM content, and unredacted query values. Findings and checklist rows come from CertScore's canonical evidence, concern-policy, and projection pipeline.

Results are evidence-backed automated observations of public websites for human and agentic review. They are not legal advice, certification, or a compliance determination. Missing or limited evidence is not proof of compliance, and observed review lenses are not legal conclusions.

## Known issues and limitations

- Scans cover observable public-web behavior from the selected execution region and time; site behavior can vary by location, session, account state, personalization, and later changes.
- `completed_limited` is usable but has explicit coverage limitations. Read those limitations before interpreting findings.
- Report-evidence pages are bounded. Follow the returned cursor to retrieve the complete available projection; a single page is not the complete report.
- Consent-choice observations require an eligible, deterministically resolved first-layer control and retained evidence. Control activation, completed observation, and confirmed consent/refusal are distinct outcomes. Preserve the report's exact outcome and coverage limitations.
- An unconfirmed action is not proof of consent or refusal. Separately verified after-click tracking may still produce a review finding. Missing or unverifiable evidence does not create a finding.
- Bounded observations do not establish behavior outside the measured window.
- Missing consent-action evidence does not establish Accept, Reject, Decline, or deeper preference behavior.
- Do not extrapolate observed vendors, embeds, requests, cookies, fingerprinting, tracking, or processing beyond what the retained evidence supports.
- Authentication is service-to-service. Microsoft Entra or Azure Key Vault configuration failures require administrator or publisher remediation rather than end-user CertScore login.

## Get started, support, and policies

Get started and help: https://certscore.ai/developers/mcp
Usage limits and API documentation: https://certscore.ai/developers/reference
Contact us: https://certscore.ai/contact-sales
Email support: support@certscore.ai
Website: https://certscore.ai/
Privacy: https://certscore.ai/privacy
Terms: https://certscore.ai/terms
