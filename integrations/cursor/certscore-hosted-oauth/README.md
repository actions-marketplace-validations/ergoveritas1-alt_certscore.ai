# CertScore Hosted OAuth for Cursor

Package status: prepared locally; marketplace publication is not verified. The static client requires migration 0198. Use the verification checklist below to check the deployed service independently of package availability.

Use this package for workspace scan creation and history. Install only one connection to `https://mcp.certscore.ai/mcp`, named **CertScore Hosted OAuth**. If it is already configured as `certscore` or `certscore-oauth`, reuse that connection. The server cannot remove or deduplicate client-side installs.

Copy `mcp.json` into your project’s `.cursor/mcp.json` (merge with existing servers), or configure it globally in `~/.cursor/mcp.json`. Cursor Agents uses the same remote server configuration. No client secret or manually registered client is needed. Complete the browser sign-in/authorization flow and verify the granted scopes through the connection-status tool. Active trial workspaces can authorize scan creation within existing limits. Existing read-only connections must reauthorize; token refresh does not add scopes.

First prompt for Cursor, Claude, or ChatGPT after configuring the hosted endpoint:

> Use the CertScore Hosted OAuth connection. First require the host to report connected with tools loaded, then call certscore_get_connection_status and require authenticated=true, diagnostics.mode=hosted_oauth, diagnostics.workspaceAccess=active, and diagnostics.createAllowedByScope=true. Check diagnostics.canRequestScanNow before creating a scan. Stop and report the failed gate if unavailable; a browser callback or Added card is not connection success. Then scan https://your-site.com with certscore_scan_site, poll certscore_get_scan_status only while active at the returned interval, and retrieve certscore_get_scan_bundle with detail=findings. Summarize score, coverage, finding IDs, pre-consent observations, and the report link. Do not describe an existing reused scan as a fresh scan. Do not substitute Light for this Hosted OAuth workflow.

For independent service diagnostics and actual Grok acceptance criteria, see [the Grok Hosted OAuth checklist](../../../docs/ops/grok-hosted-oauth-2026-09-13.md). Current source automatically authorizes after successful sign-in, including `prompt=consent`; an interactive approval page is not currently guaranteed.

For a Grok model running inside Cursor, use Cursor’s configuration. A separate Grok host must document its own OAuth configuration; there is no assumed portable AddMcpServer API.

The public client ID uses PKCE S256 and exact callbacks: `https://www.cursor.com/agents/mcp/oauth/callback` and `http://localhost:8787/callback`. This ID is not a secret or proof of client identity. Do not add arbitrary custom-scheme redirects.

Light at `/mcp/light` is a separate public scan route with bounded anonymous access and no workspace history. It can start eligible public scans; do not label it incapable of all creation. Use Hosted OAuth when workspace identity, history, or trial allowance is required.

Sources: [Cursor static OAuth configuration](https://prod.cursor.com/docs/mcp), [Cursor plugin reference](https://prod.cursor.com/docs/reference/plugins).

The Apache-2.0 license applies only to this integration package. CertScore trademarks and other repository components retain their respective terms.
